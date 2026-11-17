export type SheikhPersonaId = 'murabbi' | 'faqih' | 'mutadabbir' | 'raqi';

export interface SheikhPersona {
  id: SheikhPersonaId;
  name: string;
  title: string;
  description: string;
  greeting: string;
  toneInstruction: string;
}

export interface GroqModelOption {
  id: string;
  label: string;
  family: string;
  summary: string;
  contextWindow?: string;
  isLive?: boolean;
  provider?: 'auto' | 'groq' | 'agnes';
  endpoint?: string;
  requiresEnvKey?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const AUTO_GROQ_MODEL = 'auto';
export const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
export const AGNES_MODEL_ID = 'agnes-2.5-flash';
export const AGNES_API_ENDPOINT = 'https://apihub.agnes-ai.com/v1/chat/completions';

export const GROQ_FALLBACK_CHAIN: string[] = [
  'llama-3.1-8b-instant',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'qwen/qwen3-32b',
  'openai/gpt-oss-20b',
];

export const GROQ_MODELS: GroqModelOption[] = [
  {
    id: 'auto',
    label: 'اختيار تلقائي سريع (Auto)',
    family: 'سرعة فائقة',
    summary: 'يختار أسرع محرك متاح تلقائياً للاستجابة الفورية المباشرة',
    contextWindow: 'تلقائي',
    provider: 'auto',
  },
  {
    id: AGNES_MODEL_ID,
    label: 'Agnes 2.5 Flash',
    family: 'Agnes AI',
    summary: 'نموذج agnes-2.5-flash عبر Agnes API Hub (apihub.agnes-ai.com)',
    contextWindow: '128K',
    provider: 'agnes',
    endpoint: AGNES_API_ENDPOINT,
    requiresEnvKey: 'AGNES_API_KEY',
  },
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B Versatile',
    family: 'Meta Llama 3.3',
    summary: 'النموذج الأساسي الرصين للوعظ والتفسير والإجابة المتوازنة',
    contextWindow: '128K',
  },
  {
    id: 'llama-3.1-8b-instant',
    label: 'Llama 3.1 8B Instant',
    family: 'Meta Llama 3.1',
    summary: 'استجابة فورية فائقة السرعة للأسئلة اليومية المختصرة',
    contextWindow: '128K',
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    label: 'Llama 4 Scout 17B (16E)',
    family: 'Meta Llama 4',
    summary: 'الجيل الرابع من Llama — دقة عالية وفهم عميق للسياق',
    contextWindow: '128K',
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    label: 'Llama 4 Maverick 17B (128E)',
    family: 'Meta Llama 4',
    summary: 'نموذج Llama 4 مافريك المتقدم بـ 128 خبيراً',
    contextWindow: '128K',
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'OpenAI GPT-OSS 120B',
    family: 'OpenAI OSS',
    summary: 'نموذج مفتوح الوزن كبير الحجم للاستدلال والشرح المفصل',
    contextWindow: '128K',
  },
  {
    id: 'openai/gpt-oss-20b',
    label: 'OpenAI GPT-OSS 20B',
    family: 'OpenAI OSS',
    summary: 'نسخة خفيفة وسريعة من GPT-OSS',
    contextWindow: '128K',
  },
  {
    id: 'qwen/qwen3.8-27b',
    label: 'Qwen 3.8 27B',
    family: 'Alibaba Qwen',
    summary: 'إصدار Qwen 3.8 المتطور — بلاغة عربية واستدلال رصين',
    contextWindow: '128K',
  },
  {
    id: 'qwen/qwen3-32b',
    label: 'Qwen 3 32B',
    family: 'Alibaba Qwen',
    summary: 'متقن للغة العربية والفروق اللغوية والتفكير المنهجي',
    contextWindow: '128K',
  },
  {
    id: 'qwen-qwq-32b',
    label: 'Qwen QwQ 32B',
    family: 'Alibaba Qwen',
    summary: 'نموذج استدلال تحليلي عميق للمسائل المتشعبة',
    contextWindow: '128K',
  },
  {
    id: 'allam-2-7b',
    label: 'ALLaM 2 7B (علّام العربي)',
    family: 'SDAIA Arabic',
    summary: 'نموذج «علّام» المطوّر خصيصاً للغة العربية والثقافة الإسلامية',
    contextWindow: '4K',
  },
  {
    id: 'moonshotai/kimi-k2-instruct-0905',
    label: 'Kimi K2 Instruct 0905',
    family: 'Moonshot AI',
    summary: 'سياق ممتد حتى 256K وصياغة عربية متماسكة',
    contextWindow: '256K',
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    label: 'Kimi K2 Instruct',
    family: 'Moonshot AI',
    summary: 'الإصدار القياسي من Kimi K2 للتحليل والشرح',
    contextWindow: '128K',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    label: 'DeepSeek R1 Distill Llama 70B',
    family: 'DeepSeek',
    summary: 'نموذج استدلال منطقي مرتب النقاط',
    contextWindow: '128K',
  },
  {
    id: 'gemma2-9b-it',
    label: 'Gemma 2 9B IT',
    family: 'Google Gemma',
    summary: 'نموذج خفيف ومتوازن للإجابات السريعة',
    contextWindow: '8K',
  },
];

export const SHEIKH_PERSONAS: SheikhPersona[] = [
  {
    id: 'murabbi',
    name: 'الشيخ أبو نوار — المربّي والواعظ',
    title: 'أسلوب وعظي رقيق يجمع بين الحكمة والموعظة الحسنة',
    description: 'يخاطبك برفق الأب المربّي، يستهل بالبسملة والدعاء، ويغرس الطمأنينة واليقين.',
    greeting:
      'السلام عليكم ورحمة الله وبركاته يا بنيّ، معك الشيخ أبو نوار. حياك الله وبيّاك وجعل الجنة مثواي ومثواك. سلْ ما بدا لك في أمر دينك ودنياك، والله أسأل أن يفتح علينا وعليك فتوح العارفين.',
    toneInstruction:
      'تكلّم بصفتك الشيخ أبو نوار وبأسلوب شيخٍ مربٍّ وواعظٍ رحيم، تخاطب السائل بعبارات مثل (يا بنيّ، يا أخي الكريم، بارك الله فيك، حفظك الله)، وتُكثر من التذكير بفضل الله ورحمته وحسن التوكل عليه.',
  },
  {
    id: 'faqih',
    name: 'الشيخ أبو نوار — الفقه الميسّر',
    title: 'بيان الأحكام العملية بوضوح وأمانة علمية',
    description: 'يشرح مسائل العبادات والمعاملات اليومية بترتيب واضح مع الإحالة لأقوال أهل العلم.',
    greeting:
      'بسم الله الرحمن الرحيم، والحمد لله رب العالمين، والصلاة والسلام على أشرف المرسلين. أهلاً بك أخي المبارك، معك الشيخ أبو نوار، تفضّل بسؤالك الفقهي وسنبيّنه لك على بصيرة ويسر بإذن الله.',
    toneInstruction:
      'تكلّم بصفتك الشيخ أبو نوار وبأسلوب فقيهٍ متّزنٍ واضح العبارة، ترتّب الجواب في نقاط واضحة عند الحاجة، وتذكر الدليل من القرآن والسنة النبوية الصحيحة إن تيسر، وإذا كانت المسألة خلافية أو شائكة أو من النوازل الشخصية الدقيقة فاذكر الرأي المشهور ثم انصح السائل بمراجعة دار الإفتاء أو عالم ثقة في بلده.',
  },
  {
    id: 'mutadabbir',
    name: 'الشيخ أبو نوار — التفسير والتدبر',
    title: 'غوص في لطائف الآيات ومعاني القرآن الكريم',
    description: 'يربطك بكتاب الله عز وجل، ويستخرج الهدايات الإيمانية واللطائف البلاغية من الآيات.',
    greeting:
      'الحمد لله الذي أنزل على عبده الكتاب ولم يجعل له عوجا. مرحباً بك في مجلس تدبر كلام الله مع الشيخ أبو نوار، اذكر الآية أو الموضوع القرآني الذي يشغل قلبك لنتفيأ ظلاله معاً.',
    toneInstruction:
      'تكلّم بصفتك الشيخ أبو نوار وبأسلوب عالمٍ بالتفسير والتدبر، تبرز جمال النظم القرآني وهدايات الآيات ومقاصدها، وتستشهد بآيات القرآن الكريم بدقة تامة دون تحريف.',
  },
  {
    id: 'raqi',
    name: 'الشيخ أبو نوار — الرقية والتحصين',
    title: 'إرشاد بالرقية الشرعية والأذكار النبوية الثابتة',
    description: 'يوجّهك إلى الأذكار الصحيحة والآيات المأثورة للسكينة والتحصين بعيداً عن الخرافات.',
    greeting:
      'أعوذ بالله السميع العليم من الشيطان الرجيم، بسم الله أرقيك والله يشفيك. مرحباً بك يا أخي، معك الشيخ أبو نوار، اذكر ما تشتكي منه أو تسأل عنه في الأذكار والتحصين الشرعي لأرشدك إلى الهدي النبوي الصحيح.',
    toneInstruction:
      'تكلّم بصفتك الشيخ أبو نوار وبأسلوب شيخٍ ناصحٍ في باب الرقية الشرعية والأذكار النبوية، تركّز على التوحيد والتوكل على الله وقراءة الفاتحة وآية الكرسي والمعوذات والأدعية المأثورة الصحيحة، وتحذّر برفق من الأوهام والمشعوذين، وتوصي بالجمع بين الدعاء والأخذ بالأسباب الطبية المباحة عند الحاجة.',
  },
];

export const SUGGESTED_SHEIKH_QUESTIONS: string[] = [
  'كيف أحافظ على الخشوع في الصلاة رغم مشاغل الحياة؟',
  'ما فضل أذكار الصباح والمساء وكيف أداوم عليها؟',
  'أشعر أحياناً بضيق وهمّ، بمَ تنصحني من القرآن والسنة؟',
  'اشرح لي باختصار معنى قوله تعالى: ﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
  'كيف أرقي نفسي وأهلي بالرقية الشرعية الصحيحة من الكتاب والسنة؟',
  'ما أيسر خطة عملية لختم القرآن الكريم كل شهر؟',
];

export function isRealApiKey(value?: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const upper = trimmed.toUpperCase();
  if (
    upper.startsWith('MY_') ||
    upper.includes('YOUR_') ||
    upper === 'PLACEHOLDER' ||
    upper === 'CHANGE_ME'
  ) {
    return false;
  }
  return trimmed.length >= 8;
}

export function getSheikhPersona(personaId?: string): SheikhPersona {
  return SHEIKH_PERSONAS.find((p) => p.id === personaId) || SHEIKH_PERSONAS[0];
}

export function isValidGroqModelId(modelId?: string): boolean {
  if (!modelId || typeof modelId !== 'string') return false;
  const trimmed = modelId.trim();
  return trimmed === AUTO_GROQ_MODEL || /^[a-zA-Z0-9._:/-]{2,120}$/.test(trimmed);
}

export function resolveGroqModel(modelId?: string): string {
  if (!modelId || typeof modelId !== 'string') return DEFAULT_GROQ_MODEL;
  const trimmed = modelId.trim();
  if (trimmed === AUTO_GROQ_MODEL) return DEFAULT_GROQ_MODEL;
  const found = GROQ_MODELS.find((m) => m.id === trimmed);
  if (found) return found.id;
  return isValidGroqModelId(trimmed) ? trimmed : DEFAULT_GROQ_MODEL;
}

export function isAgnesModel(modelId?: string): boolean {
  if (!modelId || typeof modelId !== 'string') return false;
  const normalized = modelId.trim().toLowerCase();
  return normalized === AGNES_MODEL_ID || normalized.startsWith('agnes-');
}

export function isChatCapableGroqModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  if (
    lower.includes('whisper') ||
    lower.includes('orpheus') ||
    lower.includes('guard') ||
    lower.includes('safeguard') ||
    lower.includes('tts') ||
    lower.includes('embed')
  ) {
    return false;
  }
  return true;
}

export function mergeLiveGroqModels(
  liveModelIds: string[],
  options?: { agnesConfigured?: boolean }
): GroqModelOption[] {
  const curatedMap = new Map<string, GroqModelOption>();
  for (const m of GROQ_MODELS) {
    curatedMap.set(m.id, m);
  }

  const autoOption = curatedMap.get(AUTO_GROQ_MODEL)!;
  const agnesOption = curatedMap.get(AGNES_MODEL_ID);
  const merged: GroqModelOption[] = [autoOption];
  const seen = new Set<string>([AUTO_GROQ_MODEL]);

  if (agnesOption) {
    merged.push({
      ...agnesOption,
      isLive: Boolean(options?.agnesConfigured),
    });
    seen.add(AGNES_MODEL_ID);
  }

  const chatLiveIds = liveModelIds.filter(
    (id) => isValidGroqModelId(id) && isChatCapableGroqModel(id) && !isAgnesModel(id)
  );

  if (chatLiveIds.length > 0) {
    const liveSet = new Set(chatLiveIds);
    // 1. Live curated models first
    for (const m of GROQ_MODELS) {
      if (seen.has(m.id)) continue;
      if (liveSet.has(m.id)) {
        merged.push({ ...m, isLive: true });
        seen.add(m.id);
      }
    }
    // 2. Newly discovered live Groq models not in curated list
    for (const liveId of chatLiveIds) {
      if (seen.has(liveId)) continue;
      seen.add(liveId);
      const shortName = liveId.includes('/') ? liveId.split('/').pop() || liveId : liveId;
      merged.push({
        id: liveId,
        label: shortName,
        family: liveId.includes('/') ? liveId.split('/')[0] : 'محرك مباشر',
        summary: 'محرك محادثة متاح مباشرة على الخادم',
        isLive: true,
        provider: 'groq',
      });
    }
    // 3. Remaining Groq catalog models (server auto-falls back if unavailable on account tier)
    for (const m of GROQ_MODELS) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      merged.push({ ...m, isLive: false });
    }
    return merged;
  }

  for (const m of GROQ_MODELS) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    merged.push(m);
  }
  return merged;
}

export function getFallbackModelSequence(
  requestedModel?: string,
  liveModelIds: string[] = []
): string[] {
  const ordered: string[] = [];
  const pushUnique = (id: string) => {
    if (
      id &&
      id !== AUTO_GROQ_MODEL &&
      !isAgnesModel(id) &&
      isChatCapableGroqModel(id) &&
      !ordered.includes(id)
    ) {
      ordered.push(id);
    }
  };

  if (
    requestedModel &&
    requestedModel !== AUTO_GROQ_MODEL &&
    !isAgnesModel(requestedModel) &&
    isValidGroqModelId(requestedModel)
  ) {
    pushUnique(requestedModel.trim());
  }

  // Prioritize active live models from the user's Groq account to avoid wasted fallback attempts
  const liveSet = new Set(liveModelIds);
  for (const id of GROQ_FALLBACK_CHAIN) {
    if (liveSet.has(id)) pushUnique(id);
  }
  for (const id of liveModelIds) {
    if (isValidGroqModelId(id)) pushUnique(id);
  }
  for (const id of GROQ_FALLBACK_CHAIN) {
    pushUnique(id);
  }

  return ordered;
}

export function stripModelThinkingTags(text: string): string {
  if (!text) return '';
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return withoutThink || text.replace(/<\/?think>/gi, '').trim();
}

export function stripStreamingThinkingTags(text: string): string {
  if (!text) return '';
  const closedStripped = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  const openIdx = closedStripped.toLowerCase().indexOf('<think>');
  const visible = openIdx >= 0 ? closedStripped.slice(0, openIdx) : closedStripped;
  return visible.replace(/^\s+/, '');
}

export function parseSseLines(buffer: string): {
  events: Array<Record<string, unknown>>;
  remainder: string;
} {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const lastBreak = normalized.lastIndexOf('\n');
  if (lastBreak === -1) {
    return { events: [], remainder: normalized };
  }

  const completePart = normalized.slice(0, lastBreak);
  const remainder = normalized.slice(lastBreak + 1);
  const events: Array<Record<string, unknown>> = [];

  for (const rawLine of completePart.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object') {
        events.push(parsed as Record<string, unknown>);
      }
    } catch {
      // ignore malformed partial JSON chunk
    }
  }

  return { events, remainder };
}

export function buildSheikhSystemPrompt(personaId?: string): string {
  const persona = getSheikhPersona(personaId);
  return [
    'أنت «الشيخ أبو نوار»، عالم ومربٍّ إسلامي وقور في منصة «نور القرآن».',
    persona.toneInstruction,
    'التزم بالضوابط التالية في جميع إجاباتك:',
    '1. تحدّث بلغة عربية فصيحة راقية ومألوفة، بعيدة عن التكلف والركاكة، وبروحٍ إسلامية وقورة.',
    '2. استهلّ ردك بتحية إسلامية مناسبة أو دعاءٍ لطيف للسائل، واختمه بدعاءٍ جامعٍ مختصر.',
    '3. التزم بالكتاب والسنة الصحيحة ومنهج الوسطية والاعتدال، واجتنب التعصب أو التجريح.',
    '4. لا تختلق آيةً قرآنية ولا حديثاً نبوياً؛ إذا لم تجزم بنص الآية أو صحة الحديث فاذكر المعنى العام بدقة وأمانة.',
    '5. في مسائل الفتوى المعقدة أو القضايا الطبية والنفسية والطلاق والمواريث الدقيقة، قدّم التوجيه العام وانصح بلطف بمراجعة أهل العلم الثقات أو المختصين.',
    '6. اجعل الإجابة رشيقة ومركّزة ومباشرة الفائدة دون إطالة مملة، واضحة الفِقَر، بأسلوب نثري عربي أصيل خالٍ من رموز التنسيق البرمجية مثل ** أو # أو الجداول.',
  ].join('\n');
}

export function sanitizeChatMessages(rawMessages: unknown): ChatTurn[] {
  if (!Array.isArray(rawMessages)) return [];
  const cleaned: ChatTurn[] = [];
  for (const item of rawMessages) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as { role?: unknown; content?: unknown };
    if (candidate.role !== 'user' && candidate.role !== 'assistant') continue;
    if (typeof candidate.content !== 'string') continue;
    const trimmed = candidate.content.trim();
    if (!trimmed) continue;
    cleaned.push({
      role: candidate.role,
      content: trimmed.slice(0, 4000),
    });
  }
  return cleaned.slice(-14);
}

export function formatGroqErrorMessage(status: number, rawBody?: string): string {
  if (status === 401 || status === 403) {
    return 'مفتاح التشغيل السري على الخادم غير صالح أو منتهي الصلاحية. يرجى التحقق من قيمته في لوحة الأسرار (Secrets).';
  }
  if (status === 429) {
    return 'تم تجاوز حد الطلبات المؤقت على الخادم. يرجى الانتظار بضع ثوانٍ أو اختيار محرك آخر.';
  }
  if (status === 503) {
    return 'لم يتم ضبط مفتاح التشغيل السري على الخادم بعد. أضف المتغير المطلوب في لوحة الأسرار (Secrets) أو ملف البيئة لتفعيل المحادثة المباشرة.';
  }
  if (rawBody && rawBody.toLowerCase().includes('model')) {
    return 'النموذج المحدد غير متاح حالياً. جرّب «اختيار تلقائي ذكي (Auto)» أو اختر نموذجاً آخر من القائمة.';
  }
  return 'تعذر الاتصال بخدمة الشيخ أبو نوار حالياً. يرجى المحاولة مرة أخرى بعد قليل.';
}

export function formatAgnesErrorMessage(status: number, rawBody?: string): string {
  if (status === 401 || status === 403) {
    return 'مفتاح AGNES_API_KEY مفقود أو غير صالح لدى apihub.agnes-ai.com. يرجى التحقق من قيمة المفتاح في لوحة الأسرار (Secrets).';
  }
  if (status === 429) {
    return 'تم تجاوز حد الطلبات المؤقت لدى Agnes AI Hub. يرجى الانتظار بضع ثوانٍ أو التبديل إلى نموذج آخر.';
  }
  if (status === 503) {
    return 'لتشغيل نموذج agnes-2.5-flash، يرجى إضافة المتغير AGNES_API_KEY في لوحة الأسرار (Secrets) على الخادم.';
  }
  if (status === 504) {
    return 'انتهت مهلة الاتصال بخادم Agnes AI Hub. يرجى إعادة المحاولة.';
  }
  if (rawBody && rawBody.toLowerCase().includes('model')) {
    return 'نموذج agnes-2.5-flash غير متاح حالياً على حساب Agnes AI الخاص بك.';
  }
  return 'تعذر الاتصال بخدمة Agnes AI (apihub.agnes-ai.com) حالياً. يرجى المحاولة مرة أخرى بعد قليل.';
}
