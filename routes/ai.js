const express     = require('express');
const router      = express.Router();
const rateLimit   = require('express-rate-limit');
const AiSettings  = require('../models/AiSettings');
const AiChatLog   = require('../models/AiChatLog');
const { protect } = require('../middleware/auth');
const { getClientIp } = require('../utils/getClientIp');

// حد خاص لشات الـ AI بس (مش هيأثر على /settings أو /logs بتوع الأدمن)
const chatLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'رسايل كتير على الشات، استنى شوية وجرب تاني 🙏' }
});

// ============================================================
// مطابقة الأسئلة الثابتة (100% مضمونة، من غير ما نكلم Gemini)
// ============================================================
function normalize(s) {
    return String(s || '')
        .trim()
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // تشكيل
        .replace(/[إأآا]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/[؟?!.,،؛;:"'`~()\[\]{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function localReply(raw) {
    const n = normalize(raw);
    if (!n) return null;

    if (n.includes('السلام عليكم') || n.includes('سلام عليكم')) {
        return 'وعليكم السلام 🌟 أهلاً بيك في موقع Toji! أنا زعزع، اتفضل اسألني أي حاجة.';
    }
    if (n.includes('مين انت') || n.includes('مين إنت') || n.includes('مين ده')) {
        return 'أنا زعزع 😎 مساعد Toji الذكي، اسألني أي حاجة وأنا أساعدك.';
    }
    if (n.includes('ايه شغلك') || n === 'skills' || n.includes('skills')) {
        return 'Full-stack developer — Next.js, React, Tailwind, HTML, CSS, JS, Python, C.';
    }
    if (n.includes('خبرتك قد ايه') || n.includes('خبرتك قداي') || (n.includes('خبرتك') && n.includes('قد'))) {
        return 'سنة ونص — وبحمد الله شاطر في اللي بعمله 😏';
    }
    if (n.includes('عايز اشتغل معاك') || n.includes('كولاب') || n.includes('collab')) {
        return 'تقدر تتواصل مع Toji من الموقع مباشرة 🚀';
    }
    return null;
}

const FALLBACK_ERROR    = 'معلش 🙏 في مشكلة بسيطة في الاتصال، جرب تاني كمان شوية.';
const FALLBACK_DISABLED = 'الشات متوقف مؤقتًا دلوقتي 🙏 تقدر تتواصل مع Toji من الموقع مباشرة.';

function buildSystemPrompt(settings) {
    return `You are "زعزع" (Zaza), a fun, friendly, witty AI assistant that lives on Toji's personal portfolio website.

PERSONALITY:
1. Your name is "زعزع". You're playful, upbeat, a little funny/sarcastic sometimes, and genuinely helpful — like a smart friend texting back, not a stiff corporate bot.
2. Speak in Egyptian Arabic (اللهجة المصرية العامية) by default, casual chat tone. If the user writes in English or another language, you can reply in that language instead, still keeping your fun tone. Technical terms/proper nouns can stay in English (e.g. "Next.js", "React").
3. Never say you are Gemini, Google, or "a language model". You are simply "زعزع".

WHAT YOU CAN TALK ABOUT:
4. You are a normal, general-purpose AI assistant — answer ANY question the user asks (general knowledge, advice, jokes, coding help, random chit-chat, anything), just like any other helpful AI chatbot. You are NOT restricted to only talking about Toji.
5. You DO know you're embedded on Toji's website and that you belong to him — if it's relevant or the user asks, mention that naturally and proudly. Use the facts about Toji below when the user asks about him or his work. Never invent details about Toji that aren't listed below.
6. Keep answers reasonably short and conversational (a few sentences usually), unless the user clearly wants something longer/detailed — then go ahead and give a fuller answer. Light emoji is fine, don't overdo it.
7. If the user's message matches one of these FIXED questions (even worded a bit differently but the same meaning), reply with THAT EXACT text, word for word, nothing added:
   - "السلام عليكم" → "وعليكم السلام 🌟 أهلاً بيك في موقع Toji! أنا زعزع، اتفضل اسألني أي حاجة."
   - "مين أنت؟" → "أنا زعزع 😎 مساعد Toji الذكي، اسألني أي حاجة وأنا أساعدك."
   - "إيه شغلك؟" or "Skills" → "Full-stack developer — Next.js, React, Tailwind, HTML, CSS, JS, Python, C."
   - "خبرتك قد إيه؟" → "سنة ونص — وبحمد الله شاطر في اللي بعمله 😏"
   - "عايز أشتغل معاك" or "كولاب" → "تقدر تتواصل مع Toji من الموقع مباشرة 🚀"

FACTS ABOUT TOJI (use these when the user asks about him or his work):
- Name: ${settings.name}
- Role: ${settings.role}
- Stack: ${settings.stack}
- Languages he speaks: ${settings.languages}
- Experience: ${settings.experience}
- Projects: ${settings.projects}
- Education: ${settings.education}
- How to contact him: ${settings.contact}

Stay in character as زعزع at all times, but otherwise be as helpful as a normal AI assistant would be about anything the user brings up.`;
}

// ============================================================
// 🔀 3 مزودين AI مجانيين — لو واحد فشل أو ضرب حد الطلبات المجاني بتاعه
// (زي اللي بيحصل مع Gemini) بنجرب اللي بعده تلقائيًا على طول
// الترتيب: Gemini → Groq → OpenRouter (كل واحد بيتجرب بس لو مفتاحه موجود في .env)
// ============================================================

// موديلات — لو حد اتقفل أو اتغير، غيّر اسمه هنا بس (من غير ما تلمس باقي الكود)
const GEMINI_MODEL     = 'gemini-2.5-flash-lite';
const GROQ_MODEL       = 'llama-3.3-70b-versatile';
const OPENROUTER_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

async function fetchWithTimeout(url, options, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// كل الدوال التالية بتاخد نفس الشكل: (systemPrompt, messages) وبترجع نص الرد
// messages هنا بصيغة OpenAI العادية: [{ role: 'user'|'assistant', content: '...' }]

async function callGemini(systemPrompt, messages) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const contents = messages.map((m) => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    const body = JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.4 }
    });

    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    }).catch((err) => { throw err.name === 'AbortError' ? new Error('Gemini timeout') : err; });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Gemini HTTP ${response.status}`);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) throw new Error('Gemini returned an empty/blocked response');
    return text.trim();
}

async function callGroq(systemPrompt, messages) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY missing');

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 300,
        temperature: 0.4
    });

    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body
    }).catch((err) => { throw err.name === 'AbortError' ? new Error('Groq timeout') : err; });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `Groq HTTP ${response.status}`);

    const text = data.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('Groq returned an empty response');
    return text.trim();
}

async function callOpenRouter(systemPrompt, messages) {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing');

    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const body = JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 300,
        temperature: 0.4
    });

    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            // مطلوبين من OpenRouter بس مش بيأثروا على الوظيفة، تقدر تغيرهم زي ما تحب
            'HTTP-Referer': process.env.SITE_URL || 'https://toji-portfolio.com',
            'X-Title': "Toji Portfolio - Zaza AI"
        },
        body
    }).catch((err) => { throw err.name === 'AbortError' ? new Error('OpenRouter timeout') : err; });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `OpenRouter HTTP ${response.status}`);

    const text = data.choices?.[0]?.message?.content || '';
    if (!text) throw new Error('OpenRouter returned an empty response');
    return text.trim();
}

// ترتيب المحاولة: Gemini الأول (الأفضل جودة)، بعدين Groq، بعدين OpenRouter
const AI_PROVIDERS = [
    { name: 'gemini',     label: 'Gemini',     envKey: 'GEMINI_API_KEY',     call: callGemini },
    { name: 'groq',       label: 'Groq',       envKey: 'GROQ_API_KEY',       call: callGroq },
    { name: 'openrouter', label: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', call: callOpenRouter }
];

// دالة مؤقتية بتحدد لو الخطأ "مؤقت" (زي حد الطلبات 429 أو السيرفر واقع 500/502/503)
// عشان تستاهل محاولة تانية على نفس المزود قبل ما نسيبه وننتقل للي بعده
function isTransientError(message) {
    return /429|500|502|503|overloaded|rate.?limit|quota|timeout/i.test(String(message || ''));
}

// بيجرب كل مزود بالترتيب (بس اللي عنده مفتاح API متظبط في .env)، ولو واحد فشل
// بيحاول عليه مرة تانية لو الخطأ مؤقت، وبعدين ينتقل تلقائي للمزود اللي بعده
async function askAI(systemPrompt, messages) {
    const attemptedErrors = [];

    for (const provider of AI_PROVIDERS) {
        if (!process.env[provider.envKey]) continue; // المزود ده مش متظبط، نتخطاه

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const text = await provider.call(systemPrompt, messages);
                return { text, provider: provider.name };
            } catch (err) {
                attemptedErrors.push(`${provider.label}: ${err.message}`);
                if (isTransientError(err.message) && attempt === 0) {
                    await sleep(600); // محاولة تانية سريعة قبل ما نستسلم على المزود ده
                    continue;
                }
                break; // نسيب المزود ده وننتقل للي بعده
            }
        }
    }

    throw new Error(attemptedErrors.join(' | ') || 'مفيش أي مزود AI متظبط في .env');
}

// ============================================================
// PUBLIC — حالة الشات (شغال ولا لأ) عشان الفرونت يقرر يظهر الزرار ولا لأ
// ============================================================
router.get('/status', async (req, res) => {
    try {
        const settings = await AiSettings.getSingleton();
        res.json({ success: true, enabled: settings.enabled });
    } catch (err) {
        // في حالة أي مشكلة، نسيب الشات ظاهر افتراضيًا بدل ما نخفيه غلط
        res.json({ success: true, enabled: true });
    }
});

// ============================================================
// PUBLIC — الشات نفسه
// ============================================================
router.post('/chat', chatLimiter, async (req, res) => {
    const { messages, clientId } = req.body;

    if (!messages || !Array.isArray(messages) || !messages.length) {
        return res.status(400).json({ success: false, error: 'messages required' });
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const question     = String(lastUserMsg?.content || '').trim().slice(0, 500);
    const ip            = getClientIp(req);
    const cid           = String(clientId || '').trim().slice(0, 100);

    if (!question) {
        return res.status(400).json({ success: false, error: 'empty message' });
    }

    let settings;
    try {
        settings = await AiSettings.getSingleton();
    } catch {
        settings = { enabled: true }; // fallback لو الداتابيز مش متاحة لحظيًا
    }

    // ── الشات متوقف من الأدمن ──
    if (!settings.enabled) {
        AiChatLog.create({ question, answer: FALLBACK_DISABLED, source: 'disabled', ip, clientId: cid }).catch(() => {});
        return res.json({ success: true, content: FALLBACK_DISABLED, source: 'disabled' });
    }

    // ── تطابق مضمون محليًا (من غير ما نكلم Gemini خالص) ──
    const fixed = localReply(question);
    if (fixed) {
        AiChatLog.create({ question, answer: fixed, source: 'fixed', ip, clientId: cid }).catch(() => {});
        return res.json({ success: true, content: fixed, source: 'fixed' });
    }

    // ── مفيش ولا مزود AI متظبط ──
    const anyProviderConfigured = AI_PROVIDERS.some((p) => !!process.env[p.envKey]);
    if (!anyProviderConfigured) {
        AiChatLog.create({ question, answer: '(no AI provider API key configured)', source: 'error', ip, clientId: cid }).catch(() => {});
        return res.status(503).json({ success: false, error: 'AI not configured' });
    }

    // ── نكلم المزودين بالترتيب (Gemini → Groq → OpenRouter) ──
    try {
        const oaiMessages = messages.slice(-8).map((msg) => ({
            role:    msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        const systemPrompt   = buildSystemPrompt(settings);
        const { text, provider } = await askAI(systemPrompt, oaiMessages);
        const reply           = text || FALLBACK_ERROR;

        AiChatLog.create({ question, answer: reply, source: 'ai', ip, clientId: cid }).catch(() => {});
        res.json({ success: true, content: reply, source: 'ai', provider });

    } catch (err) {
        console.error('[AI CHAT] All providers failed:', err.message);
        // بنسجل السبب الحقيقي في اللوج (يظهر في لوحة الأدمن) عشان تقدر تشخّص المشكلة
        // من غير ما تحتاج تدخل على لوجات Railway — الزائر نفسه بيشوف الرسالة الودّية بس.
        AiChatLog.create({ question, answer: `[${err.message}] ${FALLBACK_ERROR}`, source: 'error', ip, clientId: cid }).catch(() => {});
        res.status(502).json({ success: false, error: FALLBACK_ERROR });
    }
});

// ============================================================
// ADMIN — إعدادات المساعد (تشغيل/إيقاف + المعلومات)
// ============================================================
router.get('/settings', protect, async (req, res) => {
    try {
        const settings = await AiSettings.getSingleton();
        res.json({ success: true, data: settings });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/settings', protect, async (req, res) => {
    try {
        const allowed = ['enabled', 'name', 'role', 'stack', 'languages', 'experience', 'projects', 'education', 'contact'];
        const update  = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        const settings = await AiSettings.findOneAndUpdate({ key: 'main' }, update, { new: true, upsert: true });
        res.json({ success: true, data: settings });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ============================================================
// ADMIN — سجل أسئلة الزوار (شات لكل شخص لوحده)
// كل زائر بيتحدد بـ clientId (متولّد من المتصفح بتاعه)، ولو مش موجود
// بنرجع لـ IP كـ fallback عشان مفيش زائر يضيع من غير مجموعة
// ============================================================

// بيرجع قائمة "الأشخاص" (Threads) مرتبة بالأحدث، كل واحد وآخر رسالة بتاعته
router.get('/logs/threads', protect, async (req, res) => {
    try {
        const threads = await AiChatLog.aggregate([
            {
                $addFields: {
                    threadKey: {
                        $cond: [
                            { $and: [{ $ne: ['$clientId', null] }, { $ne: ['$clientId', ''] }] },
                            '$clientId',
                            { $concat: ['ip:', { $ifNull: ['$ip', 'unknown'] }] }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$threadKey',
                    ip: { $first: '$ip' },
                    clientId: { $first: '$clientId' },
                    lastQuestion: { $first: '$question' },
                    lastAnswer: { $first: '$answer' },
                    lastAt: { $first: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { lastAt: -1 } }
        ]);

        res.json({ success: true, data: threads });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// بيرجع كل رسائل شخص معين (محادثة كاملة، مرتبة زمنيًا من الأقدم للأحدث)
router.get('/logs/thread/:threadKey', protect, async (req, res) => {
    try {
        const key = req.params.threadKey;
        const filter = key.startsWith('ip:') ? { ip: key.slice(3), $or: [{ clientId: '' }, { clientId: null }] } : { clientId: key };
        const logs = await AiChatLog.find(filter).sort({ createdAt: 1 });
        res.json({ success: true, data: logs });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// بيمسح محادثة شخص معين بالكامل
router.delete('/logs/thread/:threadKey', protect, async (req, res) => {
    try {
        const key = req.params.threadKey;
        const filter = key.startsWith('ip:') ? { ip: key.slice(3), $or: [{ clientId: '' }, { clientId: null }] } : { clientId: key };
        await AiChatLog.deleteMany(filter);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── (Legacy) قائمة مسطحة — لسه شغالة لو محتاجينها ──
router.get('/logs', protect, async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const skip  = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            AiChatLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            AiChatLog.countDocuments()
        ]);
        res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/logs', protect, async (req, res) => {
    try {
        await AiChatLog.deleteMany({});
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/logs/:id', protect, async (req, res) => {
    try {
        await AiChatLog.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
