import {
  AGNES_API_ENDPOINT,
  AUTO_GROQ_MODEL,
  buildSheikhSystemPrompt,
  DEFAULT_GROQ_MODEL,
  formatAgnesErrorMessage,
  formatGroqErrorMessage,
  getFallbackModelSequence,
  isAgnesModel,
  isRealApiKey,
  mergeLiveGroqModels,
  parseSseLines,
  sanitizeChatMessages,
  stripModelThinkingTags,
  stripStreamingThinkingTags,
} from '../utils/sheikhAi.ts';

let cachedLiveModels: { ids: string[]; fetchedAt: number } | null = null;
let inflightModelsPromise: Promise<string[]> | null = null;
const LIVE_MODELS_TTL_MS = 5 * 60 * 1000;
const FAST_CHAT_TIMEOUT_MS = 18000;
const FAST_MAX_TOKENS = 900;

export interface ServiceJsonResponse {
  status: number;
  body: Record<string, unknown>;
}

export type SheikhStreamEvent =
  | {
      type: 'meta';
      model: string;
      requestedModel: string;
      provider: string;
    }
  | {
      type: 'delta';
      delta: string;
      model: string;
    }
  | {
      type: 'done';
      reply: string;
      model: string;
      requestedModel: string;
      fallbackUsed: boolean;
      provider: string;
    }
  | {
      type: 'error';
      status: number;
      errorCode: string;
      error: string;
    };

async function fetchLiveGroqModelIds(apiKey: string, forceRefresh = false): Promise<string[]> {
  if (!forceRefresh && cachedLiveModels) {
    const isFresh = Date.now() - cachedLiveModels.fetchedAt < LIVE_MODELS_TTL_MS;
    if (!isFresh && !inflightModelsPromise) {
      // Stale-while-revalidate in background so chat latency stays 0ms
      void refreshLiveGroqModels(apiKey);
    }
    return cachedLiveModels.ids;
  }

  return refreshLiveGroqModels(apiKey);
}

async function refreshLiveGroqModels(apiKey: string): Promise<string[]> {
  if (inflightModelsPromise) return inflightModelsPromise;

  inflightModelsPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      if (!res.ok) {
        return cachedLiveModels?.ids || [];
      }
      const data = (await res.json()) as { data?: Array<{ id?: string }> };
      const ids = Array.isArray(data.data)
        ? data.data.map((item) => item.id || '').filter(Boolean)
        : [];
      cachedLiveModels = { ids, fetchedAt: Date.now() };
      return ids;
    } catch {
      return cachedLiveModels?.ids || [];
    } finally {
      clearTimeout(timer);
      inflightModelsPromise = null;
    }
  })();

  return inflightModelsPromise;
}

async function callOpenAiCompatibleChat(params: {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  stream: boolean;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FAST_CHAT_TIMEOUT_MS);
  try {
    const response = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          ...params.messages.slice(-8),
        ],
        temperature: 0.6,
        max_tokens: FAST_MAX_TOKENS,
        stream: params.stream,
      }),
      signal: controller.signal,
    });

    if (!params.stream || !response.ok || !response.body) {
      const rawText = await response.text();
      return { response, rawText, isStream: false as const };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const rawText = await response.text();
      return { response, rawText, isStream: false as const };
    }

    return { response, rawText: '', isStream: true as const };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function consumeOpenAiSseStream(
  response: Response,
  modelId: string,
  onVisibleText: (fullVisibleText: string, delta: string) => void
): Promise<{ reply: string; model: string }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let rawAccumulated = '';
  let lastVisible = '';
  let resolvedModel = modelId;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    sseBuffer += decoder.decode(value, { stream: true });
    const { events, remainder } = parseSseLines(sseBuffer);
    sseBuffer = remainder;

    for (const evt of events) {
      if (typeof evt.model === 'string' && evt.model) {
        resolvedModel = evt.model;
      }
      const choices = evt.choices as
        | Array<{ delta?: { content?: string }; message?: { content?: string } }>
        | undefined;
      const chunk = choices?.[0]?.delta?.content ?? choices?.[0]?.message?.content ?? '';
      if (!chunk) continue;
      rawAccumulated += chunk;
      const visible = stripStreamingThinkingTags(rawAccumulated);
      if (visible.length > lastVisible.length) {
        const delta = visible.slice(lastVisible.length);
        lastVisible = visible;
        onVisibleText(visible, delta);
      }
    }
  }

  if (sseBuffer.trim()) {
    const { events } = parseSseLines(`${sseBuffer}\n`);
    for (const evt of events) {
      const choices = evt.choices as
        | Array<{ delta?: { content?: string }; message?: { content?: string } }>
        | undefined;
      const chunk = choices?.[0]?.delta?.content ?? choices?.[0]?.message?.content ?? '';
      if (chunk) rawAccumulated += chunk;
    }
  }

  const finalReply = stripModelThinkingTags(rawAccumulated);
  if (finalReply.length > lastVisible.length) {
    onVisibleText(finalReply, finalReply.slice(lastVisible.length));
  }

  return { reply: finalReply, model: resolvedModel };
}

export function getHealthResponse(): ServiceJsonResponse {
  return {
    status: 200,
    body: { ok: true },
  };
}

export async function getSheikhAiStatusResponse(options?: {
  forceRefresh?: boolean;
}): Promise<ServiceJsonResponse> {
  const groqKey = process.env.GROQ_API_KEY?.trim() || '';
  const agnesKey = process.env.AGNES_API_KEY?.trim() || '';
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const hasGroq = isRealApiKey(groqKey);
  const hasAgnes = isRealApiKey(agnesKey);
  const hasGemini = isRealApiKey(geminiKey);
  const forceRefresh = Boolean(options?.forceRefresh);

  const liveIds = hasGroq ? await fetchLiveGroqModelIds(groqKey, forceRefresh) : [];
  const models = mergeLiveGroqModels(liveIds, { agnesConfigured: hasAgnes });

  return {
    status: 200,
    body: {
      configured: hasGroq || hasAgnes || hasGemini,
      groqConfigured: hasGroq,
      agnesConfigured: hasAgnes,
      geminiFallbackConfigured: hasGemini,
      provider: hasGroq ? 'groq' : hasAgnes ? 'agnes' : hasGemini ? 'gemini-fallback' : 'unconfigured',
      models,
      defaultModel: AUTO_GROQ_MODEL,
      recommendedModel: DEFAULT_GROQ_MODEL,
      liveModelsCount: liveIds.length,
    },
  };
}

export async function streamSheikhAiChat(
  payload: {
    messages?: unknown;
    personaId?: unknown;
    model?: unknown;
  },
  emit: (event: SheikhStreamEvent) => void
): Promise<void> {
  const { messages, personaId, model } = payload ?? {};
  const sanitizedMessages = sanitizeChatMessages(messages);

  if (
    sanitizedMessages.length === 0 ||
    sanitizedMessages[sanitizedMessages.length - 1]?.role !== 'user'
  ) {
    emit({
      type: 'error',
      status: 400,
      errorCode: 'INVALID_REQUEST',
      error: 'يرجى كتابة سؤال واضح ليتمكن الشيخ أبو نوار من الإجابة عليه.',
    });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY?.trim() || '';
  const agnesKey = process.env.AGNES_API_KEY?.trim() || '';
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const hasGroq = isRealApiKey(groqKey);
  const hasAgnes = isRealApiKey(agnesKey);
  const hasGemini = isRealApiKey(geminiKey);

  const systemPrompt = buildSheikhSystemPrompt(
    typeof personaId === 'string' ? personaId : undefined
  );
  const requestedModel = typeof model === 'string' ? model.trim() : AUTO_GROQ_MODEL;

  if (isAgnesModel(requestedModel)) {
    if (!hasAgnes) {
      emit({
        type: 'error',
        status: 503,
        errorCode: 'MISSING_AGNES_API_KEY',
        error: formatAgnesErrorMessage(503),
      });
      return;
    }

    try {
      const result = await callOpenAiCompatibleChat({
        endpoint: AGNES_API_ENDPOINT,
        apiKey: agnesKey,
        model: requestedModel,
        systemPrompt,
        messages: sanitizedMessages,
        stream: true,
      });

      if (!result.response.ok) {
        emit({
          type: 'error',
          status: result.response.status,
          errorCode:
            result.response.status === 401 || result.response.status === 403
              ? 'INVALID_AGNES_API_KEY'
              : 'AGNES_ERROR',
          error: formatAgnesErrorMessage(result.response.status, result.rawText),
        });
        return;
      }

      if (result.isStream) {
        emit({ type: 'meta', model: requestedModel, requestedModel, provider: 'agnes' });
        const { reply, model: resolvedModel } = await consumeOpenAiSseStream(
          result.response,
          requestedModel,
          (_full, delta) => emit({ type: 'delta', delta, model: requestedModel })
        );
        if (!reply) {
          emit({
            type: 'error',
            status: 502,
            errorCode: 'EMPTY_REPLY',
            error: 'لم يصل رد مكتمل من الخادم. يرجى إعادة طرح السؤال.',
          });
          return;
        }
        emit({
          type: 'done',
          reply,
          model: resolvedModel,
          requestedModel,
          fallbackUsed: false,
          provider: 'agnes',
        });
        return;
      }

      const data = JSON.parse(result.rawText) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = stripModelThinkingTags(data.choices?.[0]?.message?.content?.trim() || '');
      if (!reply) {
        emit({
          type: 'error',
          status: 502,
          errorCode: 'EMPTY_REPLY',
          error: 'لم يصل رد مكتمل من الخادم. يرجى إعادة طرح السؤال.',
        });
        return;
      }
      const resolvedModel = data.model || requestedModel;
      emit({ type: 'delta', delta: reply, model: resolvedModel });
      emit({
        type: 'done',
        reply,
        model: resolvedModel,
        requestedModel,
        fallbackUsed: false,
        provider: 'agnes',
      });
      return;
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const status = isAbort ? 504 : 502;
      emit({
        type: 'error',
        status,
        errorCode: isAbort ? 'TIMEOUT' : 'AGNES_ERROR',
        error: formatAgnesErrorMessage(status),
      });
      return;
    }
  }

  if (hasGroq) {
    const liveIds = cachedLiveModels?.ids || [];
    if (!cachedLiveModels && !inflightModelsPromise) {
      void refreshLiveGroqModels(groqKey);
    }
    const candidates = getFallbackModelSequence(requestedModel, liveIds).slice(0, 4);

    let lastStatus = 502;
    let lastRawText = '';

    for (const candidateModel of candidates) {
      try {
        const result = await callOpenAiCompatibleChat({
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: groqKey,
          model: candidateModel,
          systemPrompt,
          messages: sanitizedMessages,
          stream: true,
        });

        lastStatus = result.response.status;
        lastRawText = result.rawText;

        if (result.response.status === 401 || result.response.status === 403) {
          emit({
            type: 'error',
            status: result.response.status,
            errorCode: 'INVALID_API_KEY',
            error: formatGroqErrorMessage(result.response.status, result.rawText),
          });
          return;
        }

        if (!result.response.ok) {
          if (
            result.response.status === 400 ||
            result.response.status === 404 ||
            result.response.status === 429
          ) {
            continue;
          }
          break;
        }

        if (result.isStream) {
          emit({ type: 'meta', model: candidateModel, requestedModel, provider: 'groq' });
          const { reply, model: resolvedModel } = await consumeOpenAiSseStream(
            result.response,
            candidateModel,
            (_full, delta) => emit({ type: 'delta', delta, model: candidateModel })
          );
          if (!reply) continue;
          emit({
            type: 'done',
            reply,
            model: resolvedModel,
            requestedModel,
            fallbackUsed:
              requestedModel !== AUTO_GROQ_MODEL && resolvedModel !== requestedModel,
            provider: 'groq',
          });
          return;
        }

        const data = JSON.parse(result.rawText) as {
          model?: string;
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = stripModelThinkingTags(data.choices?.[0]?.message?.content?.trim() || '');
        if (!reply) continue;
        const resolvedModel = data.model || candidateModel;
        emit({ type: 'delta', delta: reply, model: resolvedModel });
        emit({
          type: 'done',
          reply,
          model: resolvedModel,
          requestedModel,
          fallbackUsed: requestedModel !== AUTO_GROQ_MODEL && resolvedModel !== requestedModel,
          provider: 'groq',
        });
        return;
      } catch (err) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        lastStatus = isAbort ? 504 : 502;
      }
    }

    emit({
      type: 'error',
      status: lastStatus,
      errorCode: lastStatus === 504 ? 'TIMEOUT' : 'ENGINE_ERROR',
      error: formatGroqErrorMessage(lastStatus, lastRawText),
    });
    return;
  }

  if (hasGemini) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents = sanitizedMessages.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const modelLabel = 'الاستجابة الفورية السريعة';
      emit({ type: 'meta', model: modelLabel, requestedModel, provider: 'gemini-fallback' });

      const streamResult = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: FAST_MAX_TOKENS,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      let fullText = '';
      for await (const chunk of streamResult) {
        const delta = chunk.text || '';
        if (delta) {
          fullText += delta;
          emit({ type: 'delta', delta, model: modelLabel });
        }
      }

      const reply = stripModelThinkingTags(fullText);
      if (!reply) {
        emit({
          type: 'error',
          status: 502,
          errorCode: 'EMPTY_REPLY',
          error: 'لم يصل رد مكتمل من الخادم. يرجى إعادة طرح السؤال.',
        });
        return;
      }

      emit({
        type: 'done',
        reply,
        model: modelLabel,
        requestedModel,
        fallbackUsed: false,
        provider: 'gemini-fallback',
      });
      return;
    } catch {
      emit({
        type: 'error',
        status: 502,
        errorCode: 'FALLBACK_ERROR',
        error: formatGroqErrorMessage(500),
      });
      return;
    }
  }

  emit({
    type: 'error',
    status: 503,
    errorCode: 'MISSING_API_KEY',
    error: formatGroqErrorMessage(503),
  });
}

export async function processSheikhAiChat(payload: {
  messages?: unknown;
  personaId?: unknown;
  model?: unknown;
}): Promise<ServiceJsonResponse> {
  const { messages, personaId, model } = payload ?? {};
  const sanitizedMessages = sanitizeChatMessages(messages);

  if (
    sanitizedMessages.length === 0 ||
    sanitizedMessages[sanitizedMessages.length - 1]?.role !== 'user'
  ) {
    return {
      status: 400,
      body: {
        errorCode: 'INVALID_REQUEST',
        error: 'يرجى كتابة سؤال واضح ليتمكن الشيخ أبو نوار من الإجابة عليه.',
      },
    };
  }

  const groqKey = process.env.GROQ_API_KEY?.trim() || '';
  const agnesKey = process.env.AGNES_API_KEY?.trim() || '';
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || '';
  const hasGroq = isRealApiKey(groqKey);
  const hasAgnes = isRealApiKey(agnesKey);
  const hasGemini = isRealApiKey(geminiKey);

  const systemPrompt = buildSheikhSystemPrompt(
    typeof personaId === 'string' ? personaId : undefined
  );

  const requestedModel = typeof model === 'string' ? model.trim() : AUTO_GROQ_MODEL;

  if (isAgnesModel(requestedModel)) {
    if (!hasAgnes) {
      return {
        status: 503,
        body: {
          errorCode: 'MISSING_AGNES_API_KEY',
          error: formatAgnesErrorMessage(503),
        },
      };
    }

    try {
      const { response, rawText } = await callOpenAiCompatibleChat({
        endpoint: AGNES_API_ENDPOINT,
        apiKey: agnesKey,
        model: requestedModel,
        systemPrompt,
        messages: sanitizedMessages,
        stream: false,
      });

      if (!response.ok) {
        return {
          status: response.status,
          body: {
            errorCode:
              response.status === 401 || response.status === 403
                ? 'INVALID_AGNES_API_KEY'
                : 'AGNES_ERROR',
            error: formatAgnesErrorMessage(response.status, rawText),
          },
        };
      }

      const data = JSON.parse(rawText) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const rawReply = data.choices?.[0]?.message?.content?.trim() || '';
      const reply = stripModelThinkingTags(rawReply);
      if (!reply) {
        return {
          status: 502,
          body: {
            errorCode: 'EMPTY_REPLY',
            error: 'لم يصل رد مكتمل من خادم Agnes AI. يرجى إعادة طرح السؤال.',
          },
        };
      }

      return {
        status: 200,
        body: {
          reply,
          model: data.model || requestedModel,
          requestedModel,
          fallbackUsed: false,
          provider: 'agnes',
          usage: data.usage || null,
        },
      };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const status = isAbort ? 504 : 502;
      return {
        status,
        body: {
          errorCode: isAbort ? 'TIMEOUT' : 'AGNES_ERROR',
          error: formatAgnesErrorMessage(status),
        },
      };
    }
  }

  if (hasGroq) {
    const liveIds = cachedLiveModels?.ids || [];
    if (!cachedLiveModels && !inflightModelsPromise) {
      void refreshLiveGroqModels(groqKey);
    }
    const candidates = getFallbackModelSequence(requestedModel, liveIds).slice(0, 4);

    let lastStatus = 502;
    let lastRawText = '';

    for (const candidateModel of candidates) {
      try {
        const { response, rawText } = await callOpenAiCompatibleChat({
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: groqKey,
          model: candidateModel,
          systemPrompt,
          messages: sanitizedMessages,
          stream: false,
        });

        lastStatus = response.status;
        lastRawText = rawText;

        if (response.status === 401 || response.status === 403) {
          return {
            status: response.status,
            body: {
              errorCode: 'INVALID_API_KEY',
              error: formatGroqErrorMessage(response.status, rawText),
            },
          };
        }

        if (!response.ok) {
          if (response.status === 400 || response.status === 404 || response.status === 429) {
            continue;
          }
          break;
        }

        const data = JSON.parse(rawText) as {
          model?: string;
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { total_tokens?: number };
        };

        const rawReply = data.choices?.[0]?.message?.content?.trim() || '';
        const reply = stripModelThinkingTags(rawReply);

        if (!reply) {
          continue;
        }

        return {
          status: 200,
          body: {
            reply,
            model: data.model || candidateModel,
            requestedModel,
            fallbackUsed:
              requestedModel !== AUTO_GROQ_MODEL && (data.model || candidateModel) !== requestedModel,
            provider: 'groq',
            usage: data.usage || null,
          },
        };
      } catch (err) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        if (isAbort) {
          lastStatus = 504;
          continue;
        }
        lastStatus = 502;
      }
    }

    return {
      status: lastStatus,
      body: {
        errorCode: lastStatus === 504 ? 'TIMEOUT' : 'ENGINE_ERROR',
        error: formatGroqErrorMessage(lastStatus, lastRawText),
      },
    };
  }

  if (hasGemini) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents = sanitizedMessages.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
          maxOutputTokens: FAST_MAX_TOKENS,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const reply = stripModelThinkingTags(geminiRes.text || '');
      if (!reply) {
        return {
          status: 502,
          body: {
            errorCode: 'EMPTY_REPLY',
            error: 'لم يصل رد مكتمل من الخادم. يرجى إعادة طرح السؤال.',
          },
        };
      }

      return {
        status: 200,
        body: {
          reply,
          model: 'الاستجابة الفورية السريعة',
          provider: 'gemini-fallback',
          usage: null,
        },
      };
    } catch {
      return {
        status: 502,
        body: {
          errorCode: 'FALLBACK_ERROR',
          error: formatGroqErrorMessage(500),
        },
      };
    }
  }

  return {
    status: 503,
    body: {
      errorCode: 'MISSING_API_KEY',
      error: formatGroqErrorMessage(503),
    },
  };
}
