// ============================================================
// TOJI — مركز الرسايل (messages.html)
//    قائمة محادثات + بحث عن ناس جديدة + نافذة دردشة كاملة
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const guestCard = document.getElementById('msgGuestCard');
    const appEl     = document.getElementById('msgApp');
    if (!guestCard || !appEl) return;

    const AccountAPI = window.TojiAccount?.AccountAPI;
    if (!AccountAPI || !window.TojiAccount.isLoggedIn()) {
        guestCard.hidden = false;
        appEl.hidden = true;
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    guestCard.hidden = true;
    appEl.hidden = false;

    const myId = window.TojiAccount.getUser()?.id;
    let activeUsername = new URLSearchParams(window.location.search).get('u') || '';
    let threadsCache = [];

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }
    function timeAgo(d) {
        if (!d) return '';
        const diff = (Date.now() - new Date(d).getTime()) / 1000;
        if (diff < 60) return 'دلوقتي';
        if (diff < 3600) return Math.floor(diff / 60) + 'د';
        if (diff < 86400) return Math.floor(diff / 3600) + 'س';
        return Math.floor(diff / 86400) + 'ي';
    }
    function initialOf(name) { return (name || '؟').trim().slice(0, 1).toUpperCase(); }

    // ── قائمة المحادثات ──
    async function loadThreads() {
        try {
            const res = await AccountAPI.getThreads();
            threadsCache = res.data || [];
            renderThreads();
        } catch {
            document.getElementById('msgThreadsList').innerHTML = '<p class="acc-empty">تعذر تحميل المحادثات.</p>';
        }
    }

    function renderThreads() {
        const listEl = document.getElementById('msgThreadsList');
        if (!threadsCache.length) {
            listEl.innerHTML = '<p class="acc-empty">لسه مفيش دردشات. دور على حد فوق وابدأ 👋</p>';
            return;
        }
        listEl.innerHTML = threadsCache.map((t) => `
            <button type="button" class="msg-thread-item ${t.key === activeUsername ? 'active' : ''} ${t.unread ? 'has-unread' : ''}" data-username="${t.isAdmin ? 'admin' : escapeHtml(t.other?.username || '')}">
                ${t.other?.avatarUrl
                    ? `<img class="msg-thread-item-avatar" src="${escapeHtml(t.other.avatarUrl)}" alt="">`
                    : `<span class="msg-thread-item-avatar msg-thread-item-fallback">${t.isAdmin ? '👑' : initialOf(t.other?.name)}</span>`}
                <div class="msg-thread-item-body">
                    <strong>${escapeHtml(t.other?.name || 'مستخدم')}</strong>
                    <span>${escapeHtml((t.lastText || '').slice(0, 36))}</span>
                </div>
                <span class="msg-thread-item-time">${timeAgo(t.lastAt)}</span>
            </button>`).join('');
    }

    document.getElementById('msgThreadsList').addEventListener('click', (e) => {
        const btn = e.target.closest('.msg-thread-item');
        if (btn) openThread(btn.dataset.username, btn.querySelector('strong')?.textContent);
    });

    // ── بحث عن ناس جديدة ──
    const searchInput = document.getElementById('msgSearchInput');
    const searchResultsEl = document.getElementById('msgSearchResults');
    let searchTimer = null;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        const q = searchInput.value.trim();
        if (q.length < 2) { searchResultsEl.hidden = true; return; }
        searchTimer = setTimeout(async () => {
            try {
                const res = await AccountAPI.searchUsers(q);
                const users = res.data || [];
                searchResultsEl.hidden = false;
                searchResultsEl.innerHTML = users.length
                    ? users.map((u) => `
                        <button type="button" class="msg-search-item" data-username="${escapeHtml(u.username)}">
                            ${u.avatarUrl
                                ? `<img src="${escapeHtml(u.avatarUrl)}" alt="">`
                                : `<span class="msg-search-item-fallback">${initialOf(u.name)}</span>`}
                            <div><strong>${escapeHtml(u.name)}</strong><span>@${escapeHtml(u.username)}</span></div>
                        </button>`).join('')
                    : '<p class="acc-empty">مفيش نتايج.</p>';
            } catch {
                searchResultsEl.hidden = true;
            }
        }, 300);
    });

    searchResultsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.msg-search-item');
        if (!btn) return;
        searchInput.value = '';
        searchResultsEl.hidden = true;
        openThread(btn.dataset.username, btn.querySelector('strong')?.textContent);
    });

    // ── نافذة الدردشة ──
    async function openThread(username, displayName) {
        if (!username) return;
        activeUsername = username;
        document.getElementById('msgThreadEmpty').hidden = true;
        document.getElementById('msgThreadActive').hidden = false;
        renderThreads();

        document.getElementById('msgThreadName').textContent = displayName || username;
        const usernameLink = document.getElementById('msgThreadUsernameLink');
        if (username === 'admin') {
            usernameLink.textContent = 'مساعدة Toji المباشرة';
            usernameLink.removeAttribute('href');
        } else {
            usernameLink.textContent = '@' + username;
            usernameLink.href = `profile.html?u=${encodeURIComponent(username)}`;
        }

        const avatarImg = document.getElementById('msgThreadAvatar');
        const avatarFallback = document.getElementById('msgThreadAvatarFallback');
        const thread = threadsCache.find((t) => (t.isAdmin ? 'admin' : t.other?.username) === username);
        if (thread?.other?.avatarUrl) {
            avatarImg.src = thread.other.avatarUrl;
            avatarImg.hidden = false;
            avatarFallback.hidden = true;
        } else {
            avatarImg.hidden = true;
            avatarFallback.hidden = false;
            avatarFallback.textContent = username === 'admin' ? '👑' : initialOf(displayName);
        }

        await loadMessages();
    }

    async function loadMessages() {
        const el = document.getElementById('msgThreadMessages');
        el.innerHTML = '<p class="acc-empty">⏳ جارٍ التحميل...</p>';
        try {
            const res = await AccountAPI.getThread(activeUsername);
            const msgs = res.data || [];
            el.innerHTML = msgs.map((m) => {
                const isMine = activeUsername === 'admin'
                    ? !m.isAdminReply
                    : String(m.fromUser) === String(myId);
                return `<div class="msg-bubble ${isMine ? 'is-mine' : 'is-theirs'}">${escapeHtml(m.text)}</div>`;
            }).join('') || '<p class="acc-empty">لسه مفيش رسايل، ابدأ الكلام 👋</p>';
            el.scrollTop = el.scrollHeight;
        } catch (err) {
            el.innerHTML = `<p class="acc-empty">${escapeHtml(err.message)}</p>`;
        }
    }

    document.getElementById('msgThreadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('msgThreadInput');
        const text = input.value.trim();
        if (!text || !activeUsername) return;
        input.value = '';
        input.disabled = true;
        try {
            await AccountAPI.sendMessage(activeUsername, text);
            await loadMessages();
            await loadThreads();
        } catch (err) {
            window.TojiAccount.toast(err.message);
        } finally {
            input.disabled = false;
            input.focus();
        }
    });

    await loadThreads();
    if (activeUsername) {
        const existing = threadsCache.find((t) => (t.isAdmin ? 'admin' : t.other?.username) === activeUsername);
        openThread(activeUsername, existing?.other?.name || activeUsername);
    }

    if (window.lucide) window.lucide.createIcons();

    // ── تحديث دوري خفيف لقائمة المحادثات (بديل بسيط لـ real-time) ──
    setInterval(() => { loadThreads(); if (activeUsername) loadMessages(); }, 15000);
});
