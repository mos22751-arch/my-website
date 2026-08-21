// ============================================================
// TOJI — Zaza AI Chat Page (zaza.html)
//    Speaks ONLY Egyptian Arabic (مصري). Fully backend-driven via /api/ai/chat
//    (fixed answers, knowledge, moods, and on/off toggle are all controlled
//    from the admin panel). Same localStorage keys as before so returning
//    visitors stay recognized.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const panel    = document.getElementById('zazaPanel');
    const msgEl    = document.getElementById('aiChatMessages');
    const choices  = document.getElementById('botChoices');
    const inputRow = document.getElementById('botInputRow');
    const inputEl  = document.getElementById('botInput');
    const sendBtn  = document.getElementById('botInputSend');
    const imgBtn   = document.getElementById('botImageBtn');
    const imgInput = document.getElementById('botImageInput');
    const imgPreview = document.getElementById('botImagePreview');
    const editNameBtn = document.getElementById('editNameBtn');
    if (!panel || !msgEl) return;

    // ── معرّف ثابت لكل زائر، بيتحفظ في المتصفح بتاعه، عشان لوحة الأدمن
    //    تقدر تجمع كل رسايله في محادثة واحدة لوحدها بدل ما تتلخبط مع زوار تانيين ──
    function getClientId() {
        try {
            let id = localStorage.getItem('toji_ai_cid');
            if (!id) {
                id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
                    'cid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
                localStorage.setItem('toji_ai_cid', id);
            }
            return id;
        } catch { return ''; }
    }
    const clientId = getClientId();

    // ── اسم الزائر: بيتحفظ في المتصفح بتاعه عشان لو رجع تاني زعزع يفتكره ──
    function getSavedName() {
        try { return (localStorage.getItem('toji_ai_user_name') || '').trim(); } catch { return ''; }
    }
    function saveName(n) {
        try { localStorage.setItem('toji_ai_user_name', String(n || '').trim().slice(0, 60)); } catch {}
    }

    let history       = [];
    let busy           = false;
    let profilePhone   = '201102550730'; // fallback، بيتحدّث من الإعدادات لو موجودة
    let uploadingImage = false;
    let userName       = getSavedName();
    let mode           = null;   // 'joke' | 'serious'
    let moodKey        = '';     // مود مخصص من اللي الأدمن ضايفهم
    let stage          = 'name'; // 'name' → 'mode' → 'chat'
    let awaitingNameEdit = false; // true لما الزائر يضغط زرار "غيّر اسمك" (تصحيح اسم اتكتب غلط)
    let moods          = [];     // المودات المخصصة (من الأدمن)
    let remainingImages = 1;     // كام صورة فاضلة النهارده
    let pendingImageUrl = '';    // رابط صورة متبعت وجاهزة تتضاف للرسالة الجاية

    // ── render helpers ───────────────────────────────────────
    function scroll() { msgEl.scrollTop = msgEl.scrollHeight; }
    const aiAvatarHTML = '<span class="ai-msg-avatar"><img src="assets/profile.webp" alt="" onerror="this.style.display=\'none\'"></span>';

    function addMsg(text, role, opts) {
        opts = opts || {};
        const d = document.createElement('div');
        d.className = 'ai-msg ' + role + (opts.noActions ? ' ai-msg-static' : '');
        const logId = opts.logId ? String(opts.logId) : '';
        if (logId) d.dataset.logId = logId;
        const imageHTML = opts.imageUrl ? `<img class="ai-msg-image" src="${opts.imageUrl}" alt="صورة مبعوتة" loading="lazy">` : '';
        const textHTML  = text ? '<p>' + String(text).split('\n').join('<br>') + '</p>' : '';
        d.innerHTML = (role === 'ai' ? aiAvatarHTML : '') +
            '<div class="ai-msg-body">' + imageHTML + textHTML +
            (role === 'ai' && !opts.noActions ? aiMsgActionsHTML(logId) : '') +
            '</div>';
        msgEl.appendChild(d);
        if (role === 'ai' && window.lucide) window.lucide.createIcons();
        scroll();
        return d;
    }

    // ── أزرار تحت كل رد: نسخ / إعادة توليد / تقييم ──────────────
    function aiMsgActionsHTML(logId) {
        return '<div class="ai-msg-actions">' +
            '<button class="ai-msg-action" data-act="copy" aria-label="نسخ الرد"><i data-lucide="copy" aria-hidden="true"></i></button>' +
            '<button class="ai-msg-action" data-act="regen" aria-label="إعادة توليد الرد"><i data-lucide="refresh-cw" aria-hidden="true"></i></button>' +
            (logId ?
                '<button class="ai-msg-action" data-act="up" aria-label="رد كويس"><i data-lucide="thumbs-up" aria-hidden="true"></i></button>' +
                '<button class="ai-msg-action" data-act="down" aria-label="رد مش كويس"><i data-lucide="thumbs-down" aria-hidden="true"></i></button>'
                : '') +
            '</div>';
    }

    msgEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.ai-msg-action');
        if (!btn) return;
        const bubble = btn.closest('.ai-msg');
        const act    = btn.dataset.act;

        if (act === 'copy') {
            const raw = bubble.querySelector('p')?.innerText || '';
            navigator.clipboard?.writeText(raw).then(() => {
                btn.classList.add('done');
                setTimeout(() => btn.classList.remove('done'), 1200);
            }).catch(() => {});
            return;
        }

        if (act === 'regen') {
            if (busy) return;
            regenerateFrom(bubble);
            return;
        }

        if (act === 'up' || act === 'down') {
            if (!bubble.dataset.logId || busy) return;
            const already = btn.classList.contains('active');
            const rating  = already ? null : act;
            bubble.querySelectorAll('.ai-msg-action[data-act="up"], .ai-msg-action[data-act="down"]')
                .forEach(b => b.classList.remove('active'));
            if (!already) btn.classList.add('active');
            window.TojiAPI?.AiAPI?.rateLog?.(bubble.dataset.logId, rating).catch(() => {});
            return;
        }
    });

    let typingEl = null;
    function showTyping() {
        typingEl = document.createElement('div');
        typingEl.className = 'ai-msg ai typing';
        typingEl.innerHTML = aiAvatarHTML + '<p><span></span><span></span><span></span></p>';
        msgEl.appendChild(typingEl);
        scroll();
    }
    function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

    function clearChoices() { choices.innerHTML = ''; }

    function showSuggestions() {
        const opts = [
            'مين أنت؟',
            'إيه شغلك؟',
            'خبرتك قد إيه؟',
            'عايز أشتغل معاك'
        ];
        choices.innerHTML = opts.map(label =>
            '<button class="bot-choice-btn" data-msg="' + label + '">' + label + '</button>'
        ).join('');
    }

    // ── سؤال المود: هزار/جد + أي مودات مخصصة ضايفها الأدمن ──────────
    function showModeChoices() {
        const custom = moods.map(m =>
            `<button class="bot-choice-btn bot-mood-btn" data-mood="${m.key}">${m.emoji || '✨'} ${m.label}</button>`
        ).join('');
        choices.innerHTML =
            '<button class="bot-choice-btn" data-mode="joke">😄 هزار</button>' +
            '<button class="bot-choice-btn" data-mode="serious">🧐 جد</button>' +
            custom;
    }

    function chooseMode(m) {
        mode    = (m === 'joke') ? 'joke' : 'serious';
        moodKey = '';
        stage   = 'chat';
        clearChoices();
        inputRow.hidden = false;
        addMsg(mode === 'joke' ? 'يلا بينا نهزر شوية 😄' : 'تمام، هنتكلم كلام جد 🙂', 'ai', { noActions: true });
        addMsg('أسألني أي حاجة عن شغل Toji، أو دردش معايا في أي موضوع تاني 😊', 'ai', { noActions: true });
        showSuggestions();
        inputEl.focus();
        saveModePreferenceQuietly(mode);
    }

    function chooseCustomMood(key) {
        const found = moods.find(m => m.key === key);
        if (!found) return;
        mode    = '';
        moodKey = key;
        stage   = 'chat';
        clearChoices();
        inputRow.hidden = false;
        addMsg(`تمام، هبقى ${found.label} ${found.emoji || '✨'} النهارده معاك`, 'ai', { noActions: true });
        addMsg('أسألني أي حاجة عن شغل Toji، أو دردش معايا في أي موضوع تاني 😊', 'ai', { noActions: true });
        showSuggestions();
        inputEl.focus();
    }

    // ── لو الزائر مسجل دخول، بنحفظله المود المفضل عشان زعزع
    //    مايسألوش تاني كل مرة يفتح فيها الشات ──────────────────
    function saveModePreferenceQuietly(m) {
        if (!window.TojiAccount?.isLoggedIn()) return;
        window.TojiAccount.AccountAPI.updatePreferences(m, '').catch(() => {});
    }

    const FALLBACK_ERROR = 'معلش 🙏 في مشكلة بسيطة في الاتصال، جرب تاني كمان شوية.';

    function setBusy(v) {
        busy = v;
        sendBtn.disabled = v;
    }

    async function askAndAppend() {
        try {
            const usedImageUrl = pendingImageUrl;
            const res   = await window.TojiAPI.AiAPI.chat(history, clientId, userName, mode, moodKey, usedImageUrl);
            const reply = (res && res.content ? String(res.content) : '').trim() || FALLBACK_ERROR;
            hideTyping();
            addMsg(reply, 'ai', { logId: res && res.logId });
            history.push({ role: 'assistant', content: reply });
            if (res && res.escalate) addEscalateCTA();
        } catch (err) {
            hideTyping();
            addMsg(FALLBACK_ERROR, 'ai', { noActions: true });
            console.warn('[TOJI] AI chat error:', err.message);
        } finally {
            setBusy(false);
        }
    }

    async function sendMessage(raw) {
        const text = String(raw || '').trim();
        if ((!text && !pendingImageUrl) || busy) return;

        // ── أول رسالة بتتبعت وإحنا لسه ما عرفناش اسم الزائر (أو الزائر بيصحح اسمه) ──
        if (stage === 'name') {
            if (!text) return;
            addMsg(text, 'user');
            inputEl.value = '';
            const cleanName = text.slice(0, 60);
            const wasCorrection = awaitingNameEdit;
            userName = cleanName;
            saveName(cleanName);
            awaitingNameEdit = false;
            updateHumanContactLink();

            if (wasCorrection) {
                // كان بيصحح اسم اتكتب غلط قبل كده — نكمل من نفس مكان المحادثة
                addMsg('تمام، هبقى أناديك يا ' + cleanName + ' بقى 😄', 'ai', { noActions: true });
                stage = 'chat';
                inputRow.hidden = false;
                inputEl.focus();
            } else {
                addMsg('تشرفنا يا ' + cleanName + '! 😄 عايزنا نهزر ولا نتكلم جد النهارده؟', 'ai', { noActions: true });
                stage = 'mode';
                inputRow.hidden = true;
                showModeChoices();
            }
            return;
        }

        const sentImageUrl = pendingImageUrl;
        addMsg(text, 'user', { imageUrl: sentImageUrl });
        history.push({ role: 'user', content: text || '(صورة)' });
        clearChoices();
        inputEl.value = '';
        clearPendingImage(); // الصورة اتبعتت خلاص، مش هتفضل معلقة في الفورم
        setBusy(true);
        showTyping();
        await askAndAppend();
    }

    // ── إعادة توليد رد: بنمسح الرد ده وأي حاجة بعده، ونرجع نطلب رد جديد
    //    لنفس السؤال اللي قبله ────────────────────────────────────────
    async function regenerateFrom(bubble) {
        const aiBubbles = Array.from(msgEl.querySelectorAll('.ai-msg.ai:not(.ai-msg-static)'));
        const idx = aiBubbles.indexOf(bubble);
        if (idx === -1) return;

        const assistantIdxInHistory = [];
        history.forEach((m, i) => { if (m.role === 'assistant') assistantIdxInHistory.push(i); });
        const targetIdx = assistantIdxInHistory[idx];
        if (targetIdx === undefined) return;

        history = history.slice(0, targetIdx);

        let node = bubble;
        while (node) { const next = node.nextSibling; node.remove(); node = next; }

        setBusy(true);
        showTyping();
        await askAndAppend();
    }

    // ── quick-suggestion chips + أزرار اختيار المود ────────────
    choices.addEventListener('click', (e) => {
        const modeBtn = e.target.closest('[data-mode]');
        if (modeBtn) {
            if (busy) return;
            chooseMode(modeBtn.dataset.mode);
            return;
        }
        const moodBtn = e.target.closest('[data-mood]');
        if (moodBtn) {
            if (busy) return;
            chooseCustomMood(moodBtn.dataset.mood);
            return;
        }
        const btn = e.target.closest('[data-msg]');
        if (!btn || busy) return;
        sendMessage(btn.dataset.msg);
    });

    // ── تصحيح الاسم: لو زعزع سأل الاسم وجاوبت غلط، تقدر تصححه في أي وقت ──
    editNameBtn?.addEventListener('click', () => {
        if (busy) return;
        awaitingNameEdit = true;
        stage = 'name';
        clearChoices();
        inputRow.hidden = false;
        addMsg('تمام، اسمك الصح إيه؟ ✏️', 'ai', { noActions: true });
        inputEl.value = '';
        inputEl.focus();
    });

    // ── free-text input ───────────────────────────────────────
    sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value); }
    });

    // ── إرسال صورة: صورة واحدة بس في اليوم لكل زائر ──────────────
    function updateImageButtonState() {
        const disabled = uploadingImage || remainingImages <= 0 || !!pendingImageUrl;
        imgBtn.classList.toggle('is-disabled', disabled);
        imgBtn.title = pendingImageUrl
            ? 'الصورة جاهزة للإرسال'
            : (remainingImages > 0 ? 'ابعت صورة (1 يوميًا)' : 'استخدمت صورتك النهارده، جرب بكرة');
    }

    function clearPendingImage() {
        pendingImageUrl = '';
        imgPreview.hidden = true;
        imgPreview.innerHTML = '';
        updateImageButtonState();
    }

    imgBtn?.addEventListener('click', (e) => {
        if (imgBtn.classList.contains('is-disabled')) e.preventDefault();
    });

    imgInput?.addEventListener('change', async () => {
        const file = imgInput.files && imgInput.files[0];
        imgInput.value = '';
        if (!file || uploadingImage || remainingImages <= 0) return;

        uploadingImage = true;
        updateImageButtonState();
        imgPreview.hidden = false;
        imgPreview.innerHTML = '<span class="projects-hint">⏳ جارٍ رفع الصورة...</span>';

        try {
            const res = await window.TojiAPI.AiAPI.uploadChatImage(file, clientId);
            pendingImageUrl = res.url;
            remainingImages = 0;
            imgPreview.innerHTML =
                `<img src="${res.url}" alt="">` +
                '<span>الصورة جاهزة، اكتب رسالتك وابعت 👍</span>' +
                '<button type="button" class="bot-image-preview-remove" id="botImageRemove">إلغاء</button>';
            document.getElementById('botImageRemove')?.addEventListener('click', clearPendingImage);
        } catch (err) {
            imgPreview.innerHTML = `<span class="projects-hint error">❌ ${err.message || 'فشل رفع الصورة'}</span>`;
            setTimeout(() => { if (!pendingImageUrl) { imgPreview.hidden = true; imgPreview.innerHTML = ''; } }, 3000);
        } finally {
            uploadingImage = false;
            updateImageButtonState();
        }
    });

    // ── تحميل المودات المخصصة + رصيد الصور اليومي ──────────────
    async function loadMoods() {
        try {
            const res = await window.TojiAPI?.AiMoodAPI?.getPublic?.();
            moods = (res && Array.isArray(res.data)) ? res.data : [];
        } catch { moods = []; }
    }

    async function loadImageQuota() {
        try {
            const res = await window.TojiAPI?.AiAPI?.imageQuota?.(clientId);
            remainingImages = (res && typeof res.remainingToday === 'number') ? res.remainingToday : 1;
        } catch { remainingImages = 1; }
        updateImageButtonState();
    }

    // ── رقم واتساب Toji من إعدادات الموقع (نفس المستخدم في باقي الصفحات) ──
    async function loadProfilePhone() {
        try {
            const res = await window.TojiAPI?.ConfigAPI?.get?.();
            const phone = res?.data?.profile?.phone || res?.data?.phone;
            if (phone) profilePhone = String(phone).replace(/[^\d]/g, '') || profilePhone;
        } catch {}
        updateHumanContactLink();
    }

    // ── الرابط الدايم في الهيدر: احتياطي متاح للزائر أي وقت، مش لازم زعزع يفعّله ──
    function updateHumanContactLink() {
        const link = document.getElementById('humanContactLink');
        if (!link) return;
        const msg = userName
            ? `أهلًا Toji، أنا ${userName}. حابب أتكلم معاك مباشرة عن مشروع.`
            : 'أهلًا Toji، حابب أتكلم معاك مباشرة عن مشروع.';
        link.href = `https://wa.me/${profilePhone}?text=${encodeURIComponent(msg)}`;
    }

    // ── زرار "كلم Toji مباشرة" لما زعزع يحس إن الزائر عميل جد محتمل ──
    function buildEscalateMessage() {
        const recap = history
            .filter(m => m.role === 'user')
            .slice(-4)
            .map(m => '- ' + String(m.content).replace(/\s+/g, ' ').trim().slice(0, 140))
            .join('\n');

        const greeting = userName ? `أهلًا Toji، أنا ${userName}.` : 'أهلًا Toji.';
        return `${greeting} كنت بدردش مع زعزع على الموقع وحابب أكلمك مباشرة عن مشروع/تعاون.\n\nملخص اللي اتكلمنا فيه:\n${recap || '(دردشة عامة)'}`;
    }

    function addEscalateCTA() {
        const wrap = document.createElement('div');
        wrap.className = 'ai-escalate-card';
        wrap.innerHTML =
            '<p class="ai-escalate-text">حاسس إن الموضوع ده يستاهل تتكلم مع Toji نفسه؟ 👇</p>' +
            '<a class="ai-escalate-btn" target="_blank" rel="noopener noreferrer">' +
            '<i data-lucide="phone-call" aria-hidden="true"></i> كلم Toji مباشرة</a>';
        const link = wrap.querySelector('.ai-escalate-btn');
        link.href = `https://wa.me/${profilePhone}?text=${encodeURIComponent(buildEscalateMessage())}`;
        msgEl.appendChild(wrap);
        if (window.lucide) window.lucide.createIcons();
        scroll();
    }

    // ── دردشة سابقة من الحساب (لو الزائر مسجل دخول) — بتتحمل هنا بس،
    //    مش في صفحة الحساب، زي ما اتطلب ──────────────────────────
    async function loadAccountHistory() {
        if (!window.TojiAccount?.isLoggedIn()) return null;
        try {
            const res = await window.TojiAccount.AccountAPI.chatHistory();
            return Array.isArray(res.data) ? res.data : [];
        } catch { return []; }
    }

    function renderPastHistory(logs) {
        if (!logs || !logs.length) return;

        const openDivider = document.createElement('div');
        openDivider.className = 'ai-history-divider';
        openDivider.innerHTML = '<span>محادثتك السابقة مع زعزع</span>';
        msgEl.appendChild(openDivider);

        logs.slice(-20).forEach(m => {
            if (m.question) addMsg(m.question, 'user', { noActions: true, imageUrl: m.imageUrl || '' });
            if (m.answer)   addMsg(m.answer, 'ai', { noActions: true });
            history.push({ role: 'user', content: m.question || '(صورة)' });
            if (m.answer) history.push({ role: 'assistant', content: m.answer });
        });
        history = history.slice(-8); // نفس الحد اللي الباك إند بيقصه بيه على أي حال

        const closeDivider = document.createElement('div');
        closeDivider.className = 'ai-history-divider';
        closeDivider.innerHTML = '<span>دلوقتي</span>';
        msgEl.appendChild(closeDivider);
        scroll();
    }

    // ── init الصفحة ─────────────────────────────────────────────
    async function init() {
        await loadMoods();
        loadImageQuota();
        loadProfilePhone();

        msgEl.innerHTML  = '';
        history          = [];
        setBusy(false);
        inputEl.value    = '';
        if (window.lucide) window.lucide.createIcons();

        // ── لو الزائر مسجل دخول، زعزع بياخد اسمه من الحساب مباشرة ──
        const accountUser = window.TojiAccount?.isLoggedIn() ? window.TojiAccount.getUser() : null;
        userName = accountUser?.name ? accountUser.name : getSavedName();
        if (accountUser?.name) saveName(accountUser.name);
        mode     = null;
        moodKey  = '';
        clearChoices();
        updateHumanContactLink();

        const pastLogs = await loadAccountHistory();
        if (pastLogs && pastLogs.length) renderPastHistory(pastLogs);

        if (userName) {
            stage = 'mode';
            inputRow.hidden = true;
            // ── لو الحساب عنده مود محفوظ، كمل على طول من غير ما تسأل تاني ──
            if (accountUser?.preferredMode === 'joke' || accountUser?.preferredMode === 'serious') {
                addMsg('يا هلا بيك تاني يا ' + userName + ' 👋', 'ai', { noActions: true });
                chooseMode(accountUser.preferredMode);
            } else {
                addMsg('يا هلا بيك تاني يا ' + userName + ' 👋 أنا زعزع.. عايزنا نهزر ولا نتكلم جد النهارده؟', 'ai', { noActions: true });
                showModeChoices();
            }
        } else {
            stage = 'name';
            inputRow.hidden = false;
            addMsg('يا هلا 👋 أنا زعزع، مساعد Toji الذكي! قبل ما نبدأ.. اسمك إيه؟', 'ai', { noActions: true });
            inputEl.focus();
        }

        // ── لو الأدمن قافل الشات، وضح ده للزائر بدل ما يبعت في الفاضي ──
        if (window.TojiAPI?.AiAPI) {
            window.TojiAPI.AiAPI.status().then(res => {
                if (res && res.enabled === false) {
                    inputRow.hidden = true;
                    clearChoices();
                    addMsg('الشات متوقف مؤقتًا دلوقتي 🙏 تقدر تتواصل مع Toji من الموقع مباشرة.', 'ai', { noActions: true });
                }
            }).catch(() => {});
        }
    }

    init();
});
