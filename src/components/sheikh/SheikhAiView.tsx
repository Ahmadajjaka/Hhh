import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  MessageSquarePlus,
  PanelRight,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  Trash2,
  UserCheck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  AUTO_GROQ_MODEL,
  ChatTurn,
  getSheikhPersona,
  GROQ_MODELS,
  GroqModelOption,
  isAgnesModel,
  parseSseLines,
  SHEIKH_PERSONAS,
  SheikhPersonaId,
  SUGGESTED_SHEIKH_QUESTIONS,
} from '../../utils/sheikhAi';
import { resolveApiUrl } from '../../utils/pwaHelpers';

interface SheikhAiViewProps {
  onBack?: () => void;
}

interface DisplayMessage extends ChatTurn {
  id: string;
  personaName?: string;
  modelUsed?: string;
}

interface SavedThread {
  id: string;
  title: string;
  personaId: SheikhPersonaId;
  messages: DisplayMessage[];
  updatedAt: string;
}

interface ServerStatus {
  loading: boolean;
  configured: boolean;
  groqConfigured: boolean;
  agnesConfigured: boolean;
  provider: string;
  models: GroqModelOption[];
}

const CHATS_STORAGE_KEY = 'noor_sheikh_ai_threads_v1';

function createInitialMessages(personaId: SheikhPersonaId): DisplayMessage[] {
  const persona = getSheikhPersona(personaId);
  return [
    {
      id: `welcome-${personaId}`,
      role: 'assistant',
      content: persona.greeting,
      personaName: persona.name,
    },
  ];
}

export const SheikhAiView: React.FC<SheikhAiViewProps> = ({ onBack }) => {
  const [personaId, setPersonaId] = useState<SheikhPersonaId>('murabbi');
  const [selectedModel, setSelectedModel] = useState<string>(AUTO_GROQ_MODEL);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    loading: true,
    configured: false,
    groqConfigured: false,
    agnesConfigured: false,
    provider: 'unconfigured',
    models: GROQ_MODELS,
  });

  const [threads, setThreads] = useState<SavedThread[]>(() => {
    try {
      const raw = localStorage.getItem(CHATS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedThread[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => `thread-${Date.now()}`);
  const [messages, setMessages] = useState<DisplayMessage[]>(() =>
    createInitialMessages('murabbi')
  );

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedKeyName, setCopiedKeyName] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activePersona = getSheikhPersona(personaId);

  const fetchStatus = async (forceRefresh = false) => {
    setServerStatus((prev) => ({ ...prev, loading: true }));
    try {
      const endpoint = forceRefresh ? '/api/sheikh-ai/status?refresh=1' : '/api/sheikh-ai/status';
      const res = await fetch(
        resolveApiUrl(endpoint, { apiBaseUrl: import.meta.env.VITE_API_BASE_URL })
      );
      if (!res.ok) throw new Error('status_failed');
      const data = (await res.json()) as {
        configured?: boolean;
        groqConfigured?: boolean;
        agnesConfigured?: boolean;
        provider?: string;
        models?: GroqModelOption[];
        defaultModel?: string;
      };
      const models =
        Array.isArray(data.models) && data.models.length > 0 ? data.models : GROQ_MODELS;

      setServerStatus({
        loading: false,
        configured: Boolean(data.configured),
        groqConfigured: Boolean(data.groqConfigured),
        agnesConfigured: Boolean(data.agnesConfigured),
        provider: data.provider || 'unconfigured',
        models,
      });

      setSelectedModel((curr) =>
        models.some((m) => m.id === curr) ? curr : data.defaultModel || AUTO_GROQ_MODEL
      );
    } catch {
      setServerStatus((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  useEffect(() => {
    fetchStatus(false);
    return () => {
      abortControllerRef.current?.abort();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: isSending ? 'auto' : 'smooth', block: 'end' });
  }, [messages, isSending]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Persist completed conversations containing at least one user turn
  useEffect(() => {
    if (isSending) return;
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (!firstUserMsg) return;

    const title = firstUserMsg.content.slice(0, 48);
    setThreads((prev) => {
      const next: SavedThread = {
        id: activeThreadId,
        title,
        personaId,
        messages: messages.slice(-24),
        updatedAt: new Date().toISOString(),
      };
      const filtered = prev.filter((t) => t.id !== activeThreadId);
      const updated = [next, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [messages, activeThreadId, personaId, isSending]);

  const handleSelectPersona = (nextId: SheikhPersonaId) => {
    setPersonaId(nextId);
    setErrorMessage(null);
    if (messages.length <= 1 && messages[0]?.role === 'assistant') {
      setMessages(createInitialMessages(nextId));
    }
  };

  const handleNewConversation = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsSending(false);
    setStreamingMsgId(null);
    setErrorMessage(null);
    setActiveThreadId(`thread-${Date.now()}`);
    setMessages(createInitialMessages(personaId));
    setMobileDrawerOpen(false);
  };

  const handleLoadThread = (thread: SavedThread) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsSending(false);
    setStreamingMsgId(null);
    setErrorMessage(null);
    setActiveThreadId(thread.id);
    setPersonaId(thread.personaId);
    setMessages(thread.messages);
    setMobileDrawerOpen(false);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) => {
      const updated = prev.filter((t) => t.id !== threadId);
      try {
        localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (threadId === activeThreadId) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsSending(false);
      setStreamingMsgId(null);
      setActiveThreadId(`thread-${Date.now()}`);
      setMessages(createInitialMessages(personaId));
    }
  };

  const applyServerErrorState = (errorCode?: string) => {
    if (errorCode === 'MISSING_API_KEY') {
      setServerStatus((prev) => ({
        ...prev,
        configured: false,
        groqConfigured: false,
      }));
    } else if (errorCode === 'MISSING_AGNES_API_KEY') {
      setServerStatus((prev) => ({
        ...prev,
        agnesConfigured: false,
      }));
    }
  };

  const applyProviderConnected = (provider?: string) => {
    setServerStatus((prev) => ({
      ...prev,
      configured: true,
      groqConfigured: provider === 'groq' ? true : prev.groqConfigured,
      agnesConfigured: provider === 'agnes' ? true : prev.agnesConfigured,
    }));
  };

  const runChatRequest = async (historyForUi: DisplayMessage[]) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setIsSending(true);
    setStreamingMsgId(null);

    const requestBody = JSON.stringify({
      personaId,
      model: selectedModel,
      messages: historyForUi
        .filter((m, idx) => !(idx === 0 && m.role === 'assistant' && m.id.startsWith('welcome-')))
        .map((m) => ({ role: m.role, content: m.content })),
    });

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const streamRes = await fetch(resolveApiUrl('/api/sheikh-ai/chat-stream', { apiBaseUrl }), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
        signal: controller.signal,
      });

      const contentType = streamRes.headers.get('content-type') || '';

      if (streamRes.ok && streamRes.body && contentType.includes('text/event-stream')) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let accumulatedReply = '';
        let activeModelLabel = selectedModel;
        let bubbleInserted = false;
        let receivedDone = false;

        const upsertStreamingBubble = (text: string, modelLabel: string) => {
          setStreamingMsgId(assistantMsgId);
          if (!bubbleInserted) {
            bubbleInserted = true;
            setMessages((prev) => [
              ...prev,
              {
                id: assistantMsgId,
                role: 'assistant',
                content: text,
                personaName: activePersona.name,
                modelUsed: modelLabel,
              },
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: text, modelUsed: modelLabel } : m
              )
            );
          }
        };

        const processEvents = (events: Array<Record<string, unknown>>) => {
          for (const evt of events) {
            if (evt.type === 'meta') {
              if (typeof evt.model === 'string' && evt.model) {
                activeModelLabel = evt.model;
              }
              if (typeof evt.provider === 'string') {
                applyProviderConnected(evt.provider);
              }
            } else if (evt.type === 'delta') {
              const delta = typeof evt.delta === 'string' ? evt.delta : '';
              if (typeof evt.model === 'string' && evt.model) {
                activeModelLabel = evt.model;
              }
              if (delta) {
                accumulatedReply += delta;
                upsertStreamingBubble(accumulatedReply, activeModelLabel);
              }
            } else if (evt.type === 'done') {
              receivedDone = true;
              const finalReply =
                typeof evt.reply === 'string' && evt.reply ? evt.reply : accumulatedReply;
              const finalModel =
                typeof evt.model === 'string' && evt.model ? evt.model : activeModelLabel;
              if (typeof evt.provider === 'string') {
                applyProviderConnected(evt.provider);
              }
              if (finalReply) {
                accumulatedReply = finalReply;
                upsertStreamingBubble(finalReply, finalModel);
              }
            } else if (evt.type === 'error') {
              applyServerErrorState(typeof evt.errorCode === 'string' ? evt.errorCode : undefined);
              setErrorMessage(
                typeof evt.error === 'string' && evt.error
                  ? evt.error
                  : 'تعذر الحصول على رد من الخادم حالياً. يرجى المحاولة مجدداً.'
              );
              if (!accumulatedReply && bubbleInserted) {
                setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
              }
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSseLines(sseBuffer);
          sseBuffer = remainder;
          processEvents(events);
        }

        if (sseBuffer.trim()) {
          const { events } = parseSseLines(`${sseBuffer}\n`);
          processEvents(events);
        }

        if (receivedDone || accumulatedReply) {
          return;
        }
        return;
      }

      // Seamless fallback to buffered JSON endpoint (e.g., static / Netlify Functions)
      const fallbackRes = await fetch(resolveApiUrl('/api/sheikh-ai/chat', { apiBaseUrl }), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
        signal: controller.signal,
      });

      const data = (await fallbackRes.json()) as {
        reply?: string;
        model?: string;
        provider?: string;
        error?: string;
        errorCode?: string;
      };

      if (!fallbackRes.ok || !data.reply) {
        applyServerErrorState(data.errorCode);
        setErrorMessage(
          data.error || 'تعذر الحصول على رد من الخادم حالياً. يرجى المحاولة مجدداً.'
        );
        return;
      }

      applyProviderConnected(data.provider);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: data.reply!,
          personaName: activePersona.name,
          modelUsed: data.model || selectedModel,
        },
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setErrorMessage('تعذر الاتصال بالخادم حالياً. يرجى التحقق من الاتصال والمحاولة مرة أخرى.');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsSending(false);
        setStreamingMsgId(null);
      }
    }
  };

  const submitQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isSending) return;

    const userTurn: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextMessages = [...messages, userTurn];
    setMessages(nextMessages);
    setInputText('');
    await runChatRequest(nextMessages);
  };

  const handleRegenerateLast = async () => {
    if (isSending) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const actualIdx = messages.length - 1 - lastUserIdx;
    const truncated = messages.slice(0, actualIdx + 1);
    setMessages(truncated);
    await runChatRequest(truncated);
  };

  const handleCopyMessage = (msg: DisplayMessage) => {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(msg.content)
      .then(() => {
        setCopiedId(msg.id);
        window.setTimeout(() => setCopiedId((curr) => (curr === msg.id ? null : curr)), 2200);
      })
      .catch(() => {});
  };

  const handleSpeakMessage = (msg: DisplayMessage) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.content);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyEnvVar = (envName: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard
      .writeText(envName)
      .then(() => {
        setCopiedKeyName(true);
        window.setTimeout(() => setCopiedKeyName(false), 2000);
      })
      .catch(() => {});
  };

  const activeModelMeta =
    serverStatus.models.find((m) => m.id === selectedModel) || serverStatus.models[0];

  const isAgnesSelected = isAgnesModel(selectedModel);
  const isFreshThread = messages.length === 1 && messages[0]?.role === 'assistant';

  return (
    <div
      data-testid="sheikh-ai-view"
      className="fixed inset-0 z-50 flex flex-col bg-[#031911] text-slate-100 overflow-hidden"
    >
      {/* Full-Screen AI Workspace Top Bar */}
      <header className="shrink-0 h-14 px-2.5 sm:px-5 border-b border-amber-500/20 bg-[#041e15]/95 backdrop-blur-md flex items-center justify-between gap-2 z-40">
        {/* RTL Right: Back + Sidebar toggle + Active Scholar */}
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 sm:px-3 min-h-[40px] rounded-xl bg-[#c5a059] text-black font-bold text-xs hover:bg-[#d8b368] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="العودة إلى الرئيسية"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                setDesktopSidebarOpen((prev) => !prev);
              } else {
                setMobileDrawerOpen((prev) => !prev);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 min-h-[40px] rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              desktopSidebarOpen || mobileDrawerOpen
                ? 'bg-[#0b3b2c] border-amber-400/60 text-amber-200'
                : 'bg-[#06241b] border-emerald-800/50 text-emerald-100 hover:border-amber-500/40'
            }`}
            aria-label="قائمة أساليب الشيخ أبو نوار والمحركات"
          >
            <PanelRight className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">الأساليب والمحركات</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-amber-200 font-arabic-serif truncate">
              {activePersona.name}
            </h1>
            <p className="hidden sm:block text-[11px] text-emerald-300/70 truncate">
              {activeModelMeta?.label || selectedModel}
              {' · '}
              {serverStatus.loading
                ? 'جاري فحص الخادم'
                : isAgnesSelected
                ? serverStatus.agnesConfigured
                  ? 'متصل بـ Agnes AI'
                  : 'بانتظار AGNES_API_KEY'
                : serverStatus.groqConfigured
                ? 'متصل بالخادم الذكي'
                : serverStatus.configured
                ? 'محرك الخادم البديل نشط'
                : 'بانتظار ضبط مفتاح الخادم'}
            </p>
          </div>
        </div>

        {/* RTL Left: Quick Model Picker + New Chat */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="topbar-groq-model" className="sr-only">
            اختيار نموذج الذكاء الاصطناعي
          </label>
          <select
            id="topbar-groq-model"
            dir="ltr"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="hidden sm:block max-w-[230px] min-h-[40px] px-3 rounded-xl bg-[#06241b] border border-emerald-700/50 text-xs text-amber-100 text-left focus:outline-none focus:border-amber-400 cursor-pointer"
            title="اختر نموذج الذكاء الاصطناعي"
          >
            {serverStatus.models.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#031911] text-white">
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 px-3 min-h-[40px] rounded-xl bg-[#082a1f] hover:bg-[#0d3a2c] border border-emerald-700/45 text-xs font-bold text-amber-200 whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="محادثة جديدة"
          >
            <MessageSquarePlus className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">محادثة جديدة</span>
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile Drawer Backdrop */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />
        )}

        {/* Sidebar (Personas + All Groq Models + Saved Conversations) */}
        <aside
          aria-label="لوحة أساليب الشيخ أبو نوار والمحركات"
          className={`${
            mobileDrawerOpen ? 'fixed inset-y-0 right-0 z-[60] flex' : 'hidden'
          } ${
            desktopSidebarOpen ? 'lg:static lg:flex' : 'lg:hidden'
          } w-[86vw] max-w-xs lg:w-80 shrink-0 bg-[#041a13] border-l border-emerald-800/40 flex-col min-h-0 overflow-y-auto p-4 space-y-5`}
        >
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-emerald-800/35">
            <span className="text-sm font-bold text-amber-300 font-arabic-serif">
              الشيخ أبو نوار والمحركات
            </span>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-emerald-200 hover:bg-emerald-900/50 cursor-pointer"
              aria-label="إغلاق القائمة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

            {/* Sheikh Personas */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>أسلوب الشيخ أبو نوار ({SHEIKH_PERSONAS.length})</span>
                </h2>
              </div>

              <div className="space-y-2">
                {SHEIKH_PERSONAS.map((persona) => {
                  const isSelected = persona.id === personaId;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleSelectPersona(persona.id)}
                      className={`w-full text-right p-3 rounded-2xl border transition-colors duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0b3b2c] border-amber-400/70 text-white'
                          : 'bg-[#03150f] border-emerald-800/35 text-emerald-100/85 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-200">{persona.name}</span>
                        {isSelected && (
                          <span className="text-[11px] font-bold text-amber-300 shrink-0">نشط</span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-200/70 mt-1 leading-relaxed">
                        {persona.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* All Models List (Groq + Agnes AI) */}
            <section className="space-y-2.5 pt-2 border-t border-emerald-800/35">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="sidebar-groq-model"
                  className="text-xs font-bold text-amber-300"
                >
                  كل النماذج المتاحة ({serverStatus.models.length})
                </label>
                <button
                  type="button"
                  onClick={() => fetchStatus(true)}
                  className="min-h-[34px] px-2 rounded-lg text-[11px] text-amber-300 hover:bg-emerald-900/50 flex items-center gap-1 cursor-pointer"
                  title="مزامنة أحدث النماذج من الخادم"
                >
                  <RefreshCw className={`w-3 h-3 ${serverStatus.loading ? 'animate-spin' : ''}`} />
                  <span>مزامنة</span>
                </button>
              </div>

              <select
                id="sidebar-groq-model"
                dir="ltr"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#031911] border border-emerald-700/50 text-xs text-amber-100 text-left focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {serverStatus.models.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#031911] text-white">
                    {m.label} {m.contextWindow ? `(${m.contextWindow})` : ''}
                  </option>
                ))}
              </select>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pl-1">
                {serverStatus.models.map((m) => {
                  const isActive = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModel(m.id)}
                      className={`w-full text-right p-2.5 rounded-xl border text-xs transition-colors duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#0b3b2c] border-amber-400/65 text-white'
                          : 'bg-[#03150f]/80 border-emerald-900/40 text-emerald-100/80 hover:border-amber-500/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-amber-200 truncate" dir="ltr">
                          {m.label}
                        </span>
                        <span className="text-[10px] text-emerald-300/75 shrink-0">
                          {m.isLive ? 'متاح الآن · ' : ''}
                          {m.family}
                          {m.contextWindow ? ` · ${m.contextWindow}` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/65 mt-0.5 leading-snug">
                        {m.summary}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Saved Conversation History */}
            {threads.length > 0 && (
              <section className="space-y-2 pt-2 border-t border-emerald-800/35">
                <h2 className="text-xs font-bold text-amber-300">المحادثات السابقة</h2>
                <div className="space-y-1.5">
                  {threads.map((thread) => {
                    const isCurrent = thread.id === activeThreadId;
                    return (
                      <div
                        key={thread.id}
                        className={`flex items-center justify-between gap-1 rounded-xl border px-2.5 py-1.5 ${
                          isCurrent
                            ? 'bg-[#0b3b2c] border-amber-400/50'
                            : 'bg-[#03150f] border-emerald-900/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleLoadThread(thread)}
                          className="flex-1 text-right text-xs text-emerald-100 hover:text-amber-200 truncate py-1 cursor-pointer"
                        >
                          {thread.title}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteThread(thread.id, e)}
                          className="p-1.5 text-emerald-400/60 hover:text-rose-400 cursor-pointer shrink-0"
                          aria-label={`حذف محادثة ${thread.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>

        {/* Main Chat Canvas */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-[radial-gradient(circle_at_top,_rgba(197,160,89,0.06),_transparent_55%)]">
          {/* Scrollable Messages Container */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5">
            <div className="max-w-3xl mx-auto space-y-5">
              {/* Server Key Setup Guidance Banner */}
              {!serverStatus.loading &&
                ((isAgnesSelected && !serverStatus.agnesConfigured) ||
                  (!isAgnesSelected && !serverStatus.configured)) && (
                  <div
                    role="status"
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-100 space-y-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 leading-relaxed">
                        <p className="font-bold text-amber-200 text-sm">
                          {isAgnesSelected
                            ? 'لتشغيل نموذج agnes-2.5-flash أضف مفتاح AGNES_API_KEY على الخادم'
                            : 'لتشغيل الإجابات الحية مع الشيخ أبو نوار أضف مفتاح التشغيل السري على الخادم'}
                        </p>
                        <p className="text-amber-100/80">
                          {isAgnesSelected ? (
                            <>
                              تم ربط النموذج بنقطة{' '}
                              <code
                                dir="ltr"
                                className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono"
                              >
                                https://apihub.agnes-ai.com/v1/chat/completions
                              </code>
                              . أضف المتغير{' '}
                              <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono">
                                AGNES_API_KEY
                              </code>{' '}
                              في لوحة الأسرار (Secrets) ثم اضغط «تحديث الاتصال».
                            </>
                          ) : (
                            <>
                              أضف مفتاح التشغيل السري للمحادثة الذكية في إعدادات الأسرار (Secrets) أو ملف البيئة على الخادم، ثم اضغط «تحديث الاتصال».
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isAgnesSelected && (
                        <button
                          type="button"
                          onClick={() => handleCopyEnvVar('AGNES_API_KEY')}
                          className="min-h-[38px] px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedKeyName ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedKeyName
                              ? 'تم نسخ AGNES_API_KEY'
                              : 'نسخ اسم المتغير AGNES_API_KEY'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => fetchStatus(true)}
                        className="min-h-[38px] px-3 rounded-xl bg-[#082a1f] hover:bg-[#0d3a2c] border border-emerald-700/50 text-emerald-100 font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>تحديث الاتصال</span>
                      </button>
                      {isAgnesSelected && serverStatus.groqConfigured && (
                        <button
                          type="button"
                          onClick={() => setSelectedModel(AUTO_GROQ_MODEL)}
                          className="min-h-[38px] px-3 rounded-xl bg-[#0b3b2c] hover:bg-[#11503c] border border-emerald-500/40 text-amber-200 font-bold cursor-pointer"
                        >
                          التبديل إلى الوضع التلقائي المتاح الآن
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Compact Persona Switcher on Mobile / Tablet */}
              <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1">
                {SHEIKH_PERSONAS.map((persona) => {
                  const isSelected = persona.id === personaId;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleSelectPersona(persona.id)}
                      className={`min-h-[38px] px-3 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#c5a059] text-black border-[#c5a059]'
                          : 'bg-[#06241b] text-emerald-100/85 border-emerald-800/50'
                      }`}
                    >
                      {persona.name}
                    </button>
                  );
                })}
              </div>

              {/* Messages */}
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isLastAssistant = !isUser && index === messages.length - 1 && !isFreshThread;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`w-full sm:max-w-[90%] rounded-2xl px-4 sm:px-5 py-4 border ${
                        isUser
                          ? 'bg-[#0b3b2c] border-emerald-600/45 text-white'
                          : 'bg-[#06241b]/95 border-amber-500/30 text-amber-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isUser
                                ? 'text-emerald-300 font-bold'
                                : 'text-amber-300 font-bold font-arabic-serif text-xs'
                            }
                          >
                            {isUser ? 'السائل الكريم' : msg.personaName || activePersona.name}
                          </span>
                          {!isUser && msg.modelUsed && (
                            <span className="text-emerald-300/65" dir="ltr">
                              · {msg.modelUsed}
                            </span>
                          )}
                        </div>

                        {!isUser && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg)}
                              className="flex items-center gap-1 text-emerald-300/80 hover:text-amber-300 transition-colors cursor-pointer"
                              aria-label="الاستماع لقراءة الرد"
                            >
                              {speakingMsgId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                                  <span>إيقاف</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>استماع</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg)}
                              className="flex items-center gap-1 text-emerald-300/80 hover:text-amber-300 transition-colors cursor-pointer"
                              aria-label="نسخ رد الشيخ"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>نسخ</span>
                                </>
                              )}
                            </button>

                            {isLastAssistant && (
                              <button
                                type="button"
                                disabled={isSending}
                                onClick={handleRegenerateLast}
                                className="flex items-center gap-1 text-emerald-300/80 hover:text-amber-300 transition-colors cursor-pointer disabled:opacity-40"
                                aria-label="إعادة توليد الإجابة"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>إعادة</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-sm sm:text-[15.5px] leading-[1.95] whitespace-pre-wrap select-text">
                        {msg.content.split(/(\*\*[^*]+\*\*)/g).map((part, partIdx) =>
                          part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
                            <strong key={partIdx} className="font-bold text-amber-200">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            <React.Fragment key={partIdx}>{part}</React.Fragment>
                          )
                        )}
                        {streamingMsgId === msg.id && (
                          <span
                            aria-hidden="true"
                            className="inline-block w-2 h-4 mr-1 align-middle bg-amber-300 animate-pulse rounded-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Starter Prompts on New Thread */}
              {isFreshThread && !isSending && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300/90">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>اختر سؤالاً للبدء أو اكتب سؤالك في الأسفل:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTED_SHEIKH_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        disabled={isSending}
                        onClick={() => submitQuestion(q)}
                        className="text-right px-4 py-3 min-h-[48px] rounded-2xl bg-[#06241b]/85 hover:bg-[#0b3b2c] border border-emerald-800/45 hover:border-amber-400/55 text-xs sm:text-sm text-emerald-100 leading-relaxed transition-colors duration-150 cursor-pointer disabled:opacity-50"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSending && !streamingMsgId && (
                <div className="flex items-end flex-col">
                  <div className="w-full sm:max-w-[90%] rounded-2xl px-5 py-4 bg-[#06241b]/95 border border-amber-500/30 text-amber-200 text-sm">
                    جاري استحضار الجواب بأسلوب {activePersona.name}...
                  </div>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-rose-950/55 border border-rose-500/45 text-xs sm:text-sm text-rose-100 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRegenerateLast}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Docked Bottom Full-Width Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion(inputText);
            }}
            className="shrink-0 border-t border-emerald-800/40 bg-[#041c14]/95 backdrop-blur-md px-3 sm:px-6 py-3"
          >
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-end gap-2.5">
                <label htmlFor="sheikh-question-input" className="sr-only">
                  اكتب سؤالك للشيخ أبو نوار
                </label>
                <textarea
                  id="sheikh-question-input"
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitQuestion(inputText);
                    }
                  }}
                  placeholder="اكتب سؤالك للشيخ أبو نوار هنا بأدبٍ ووضوح... (Enter للإرسال)"
                  className="flex-1 resize-none rounded-2xl bg-[#031911] border border-emerald-700/55 focus:border-amber-400 px-4 py-3 text-sm text-white placeholder:text-emerald-300/45 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="min-h-[48px] px-5 rounded-2xl bg-[#c5a059] hover:bg-[#d8b368] disabled:opacity-45 text-black font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                  aria-label="إرسال السؤال إلى الشيخ أبو نوار"
                >
                  <Send className="w-4 h-4" />
                  <span>اسأل</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-300/65 px-1">
                <span>
                  الشيخ أبو نوار للاستئناس والتدبر الشرعي — في المسائل الدقيقة يُرجى مراجعة أهل العلم
                </span>
                <span dir="ltr">
                  {activeModelMeta?.label || selectedModel}
                </span>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};
