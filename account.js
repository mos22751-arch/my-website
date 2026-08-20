// ============================================================
// TOJI — Optional Account System (Frontend)
// حساب اختياري بالكامل: تسجيل/دخول عادي أو بجوجل، ذاكرة شات زعزع،
// حفظ المشاريع، نظام نقط يومي، صورة بروفايل.
// شغال في كل صفحات الموقع (لازم يتحمل بعد api.js).
// ============================================================
(function () {
    'use strict';

    const API_BASE_URL = window.TojiAPI?.API_BASE_URL ||
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000/api'
            : 'https://toji-backend.onrender.com/api');

    // ── إدارة توكن المستخدم — منفصل تمامًا عن توكن الأدمن ──────
    const USER_TOKEN_KEY = 'toji_user_token';
    const USER_KEY        = 'toji_user_data';

    const UserToken = {
        get:    () => localStorage.getItem(USER_TOKEN_KEY),
        set:    (t) => localStorage.setItem(USER_TOKEN_KEY, t),
        remove: () => localStorage.removeItem(USER_TOKEN_KEY)
    };

    function getCachedUser() {
        try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
    }
    function setCachedUser(u) {
        try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {}
    }
    function clearCachedUser() {
        localStorage.removeItem(USER_KEY);
    }

    async function accountFetch(endpoint, options = {}) {
        const token = UserToken.get();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(options.headers || {})
        };
        const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        let data;
        try { data = await res.json(); } catch { data = {}; }
        if (!res.ok) throw new Error(data.message || 'حصل خطأ في السيرفر');
        return data;
    }

    const AccountAPI = {
        settings:   () => accountFetch('/account/settings'),
        register:   (name, email, password) => accountFetch('/account/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
        login:      (email, password) => accountFetch('/account/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        google:     (credential) => accountFetch('/account/google', { method: 'POST', body: JSON.stringify({ credential }) }),
        me:         () => accountFetch('/account/me'),
        updateName: (name) => accountFetch('/account/me', { method: 'PUT', body: JSON.stringify({ name }) }),
        changePassword: (currentPassword, newPassword) => accountFetch('/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
        claimDaily: () => accountFetch('/account/claim-daily-points', { method: 'POST' }),
        redeemPoints: () => accountFetch('/account/redeem-points', { method: 'POST' }),
        chatHistory: () => accountFetch('/account/chat-history'),
        claimChat:   (clientId) => accountFetch('/account/claim-chat', { method: 'POST', body: JSON.stringify({ clientId }) }),
        myProjects:  () => accountFetch('/account/my-projects'),
        uploadAvatar: async (file) => {
            const token = UserToken.get();
            const fd = new FormData();
            fd.append('image', file);
            const res = await fetch(`${API_BASE_URL}/account/avatar`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: fd
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'فشل رفع الصورة');
            return data;
        }
    };

    let cachedSettings = null;
    async function getSettings() {
        if (cachedSettings) return cachedSettings;
        try {
            const res = await AccountAPI.settings();
            cachedSettings = res.data;
        } catch {
            cachedSettings = { enableAccounts: true, enableGoogleLogin: false, enablePoints: true };
        }
        return cachedSettings;
    }

    function isLoggedIn() { return Boolean(UserToken.get()); }
    function getUser() { return getCachedUser(); }
    function getToken() { return UserToken.get(); }

    function logout() {
        UserToken.remove();
        clearCachedUser();
        renderNavButton();
        window.dispatchEvent(new CustomEvent('toji-account-change', { detail: { user: null } }));
    }

    function setSession(token, user) {
        UserToken.set(token);
        setCachedUser(user);
        renderNavButton();
        window.dispatchEvent(new CustomEvent('toji-account-change', { detail: { user } }));
        claimDailyPointsQuietly();
        claimOldChatQuietly();
    }

    // ── ربط شات زعزع القديم (قبل الحساب) بالحساب الجديد تلقائيًا ──
    function claimOldChatQuietly() {
        try {
            const cid = localStorage.getItem('toji_ai_cid');
            if (cid) AccountAPI.claimChat(cid).catch(() => {});
        } catch {}
    }

    // ── نقطة الدخول اليومية — مرة واحدة كل يوم تلقائيًا ──────────
    async function claimDailyPointsQuietly() {
        try {
            const settings = await getSettings();
            if (!settings.enablePoints) return;
            const res = await AccountAPI.claimDaily();
            if (res && res.awarded > 0) {
                const user = getCachedUser();
                if (user) { user.points = { total: res.total }; setCachedUser(user); }
                renderNavButton();
                toast(`+${res.awarded} نقطة عشان دخولك النهارده 🎉`);
            }
        } catch {}
    }

    function toast(msg) {
        const el = document.createElement('div');
        el.className = 'toji-toast';
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
    }

    // ============================================================
    // Nav button / dropdown
    // ============================================================
    function initials(name) {
        return String(name || '؟').trim().slice(0, 1).toUpperCase();
    }

    function renderNavButton() {
        const navActions = document.querySelector('.nav-actions');
        if (!navActions) return;

        let wrap = document.getElementById('tojiAccountWrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'tojiAccountWrap';
            wrap.className = 'toji-account-wrap';
            navActions.insertBefore(wrap, navActions.firstChild);
        }

        const user = getCachedUser();

        if (!user) {
            wrap.innerHTML = `<button class="toji-account-btn toji-account-signin" id="tojiSignInBtn" type="button">
                <i data-lucide="user" aria-hidden="true"></i><span>دخول</span>
            </button>`;
            wrap.querySelector('#tojiSignInBtn').addEventListener('click', () => openAuthModal('login'));
        } else {
            const avatar = user.avatarUrl
                ? `<img src="${escapeAttr(user.avatarUrl)}" alt="" class="toji-account-avatar">`
                : `<span class="toji-account-avatar toji-account-avatar-fallback">${initials(user.name)}</span>`;
            wrap.innerHTML = `
                <div class="toji-account-pill" id="tojiAccountPill" tabindex="0">
                    ${avatar}
                    <span class="toji-account-name">${escapeHtml(user.name)}</span>
                    ${user.points ? `<span class="toji-account-points" title="نقطك">${user.points.total} ⭐</span>` : ''}
                </div>
                <div class="toji-account-menu" id="tojiAccountMenu" hidden>
                    <a href="account.html" class="toji-account-menu-item"><i data-lucide="layout-dashboard" aria-hidden="true"></i> حسابي</a>
                    <button type="button" class="toji-account-menu-item" id="tojiLogoutBtn"><i data-lucide="log-out" aria-hidden="true"></i> تسجيل خروج</button>
                </div>`;
            const pill = wrap.querySelector('#tojiAccountPill');
            const menu = wrap.querySelector('#tojiAccountMenu');
            pill.addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
            document.addEventListener('click', () => { menu.hidden = true; }, { once: true });
            wrap.querySelector('#tojiLogoutBtn').addEventListener('click', logout);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(str) { return escapeHtml(str); }

    // ============================================================
    // Auth Modal — تصميم متناسق مع استايل الموقع (glass-panel)
    // ============================================================
    let modalEl = null;

    async function openAuthModal(initialTab) {
        const settings = await getSettings();
        if (!settings.enableAccounts) return;

        if (!modalEl) buildModal();
        modalEl.hidden = false;
        requestAnimationFrame(() => modalEl.classList.add('open'));
        setTab(initialTab || 'login');

        if (settings.enableGoogleLogin && settings.googleClientId) {
            renderGoogleButtons(settings.googleClientId);
        } else {
            modalEl.querySelectorAll('.toji-google-slot').forEach((el) => { el.hidden = true; });
        }
    }

    function closeAuthModal() {
        if (!modalEl) return;
        modalEl.classList.remove('open');
        setTimeout(() => { modalEl.hidden = true; }, 200);
    }

    function setTab(tab) {
        modalEl.querySelectorAll('.toji-auth-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
        modalEl.querySelectorAll('.toji-auth-form').forEach((f) => f.hidden = f.dataset.form !== tab);
        modalEl.querySelector('.toji-auth-error').textContent = '';
    }

    function buildModal() {
        modalEl = document.createElement('div');
        modalEl.className = 'toji-auth-overlay';
        modalEl.hidden = true;
        modalEl.innerHTML = `
        <div class="toji-auth-modal glass-panel" role="dialog" aria-modal="true" aria-label="تسجيل الدخول أو إنشاء حساب">
            <button class="toji-auth-close" type="button" aria-label="إغلاق">
                <i data-lucide="x" aria-hidden="true"></i>
            </button>
            <div class="toji-auth-head">
                <p class="eyebrow">حساب اختياري</p>
                <h3>سجّل دخولك عشان تاخد أكتر</h3>
                <p class="toji-auth-sub">ذاكرة لشات زعزع، حفظ مشاريعك، نقط يومية بتتحول لخصم — كله اختياري تمامًا.</p>
            </div>
            <div class="toji-auth-tabs">
                <button class="toji-auth-tab active" data-tab="login" type="button">تسجيل دخول</button>
                <button class="toji-auth-tab" data-tab="register" type="button">حساب جديد</button>
            </div>
            <p class="toji-auth-error" role="alert"></p>

            <form class="toji-auth-form" data-form="login">
                <label>الإيميل<input type="email" name="email" required autocomplete="email" maxlength="120"></label>
                <label>كلمة المرور<input type="password" name="password" required autocomplete="current-password" maxlength="100"></label>
                <button type="submit" class="toji-auth-submit">دخول</button>
            </form>

            <form class="toji-auth-form" data-form="register" hidden>
                <label>الاسم<input type="text" name="name" required maxlength="60"></label>
                <label>الإيميل<input type="email" name="email" required autocomplete="email" maxlength="120"></label>
                <label>كلمة المرور<input type="password" name="password" required autocomplete="new-password" minlength="8" maxlength="100"></label>
                <p class="toji-auth-hint">8 حروف على الأقل</p>
                <button type="submit" class="toji-auth-submit">إنشاء حساب</button>
            </form>

            <div class="toji-auth-divider toji-google-slot"><span>أو</span></div>
            <div class="toji-google-btn-slot toji-google-slot" id="tojiGoogleBtnSlot"></div>
        </div>`;
        document.body.appendChild(modalEl);

        modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeAuthModal(); });
        modalEl.querySelector('.toji-auth-close').addEventListener('click', closeAuthModal);
        modalEl.querySelectorAll('.toji-auth-tab').forEach((btn) => btn.addEventListener('click', () => setTab(btn.dataset.tab)));

        modalEl.querySelector('[data-form="login"]').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const errEl = modalEl.querySelector('.toji-auth-error');
            errEl.textContent = '';
            try {
                const res = await AccountAPI.login(form.email.value.trim(), form.password.value);
                setSession(res.token, res.user);
                closeAuthModal();
                toast('أهلاً بيك تاني! 👋');
            } catch (err) {
                errEl.textContent = err.message;
            }
        });

        modalEl.querySelector('[data-form="register"]').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const errEl = modalEl.querySelector('.toji-auth-error');
            errEl.textContent = '';
            try {
                const res = await AccountAPI.register(form.name.value.trim(), form.email.value.trim(), form.password.value);
                setSession(res.token, res.user);
                closeAuthModal();
                toast('اتعمل حسابك! 🎉');
            } catch (err) {
                errEl.textContent = err.message;
            }
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // ── Google Identity Services — بيتحمّل بس لو مفعّل من الأدمن ──
    let gisLoaded = false;
    let gisLoading = null;
    function loadGis() {
        if (gisLoaded) return Promise.resolve();
        if (gisLoading) return gisLoading;
        gisLoading = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.defer = true;
            s.onload = () => { gisLoaded = true; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return gisLoading;
    }

    async function renderGoogleButtons(clientId) {
        const slot = document.getElementById('tojiGoogleBtnSlot');
        if (!slot) return;
        modalEl.querySelectorAll('.toji-google-slot').forEach((el) => { el.hidden = false; });
        try {
            await loadGis();
            if (!window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: async (response) => {
                    const errEl = modalEl.querySelector('.toji-auth-error');
                    try {
                        const res = await AccountAPI.google(response.credential);
                        setSession(res.token, res.user);
                        closeAuthModal();
                        toast('أهلاً بيك! 👋');
                    } catch (err) {
                        errEl.textContent = err.message;
                    }
                }
            });
            slot.innerHTML = '';
            window.google.accounts.id.renderButton(slot, { theme: 'filled_black', size: 'large', shape: 'pill', width: 280 });
        } catch {
            modalEl.querySelectorAll('.toji-google-slot').forEach((el) => { el.hidden = true; });
        }
    }

    // ============================================================
    // Init
    // ============================================================
    async function init() {
        renderNavButton();
        // لو معاه توكن، نتأكد إنه لسه صالح ونحدّث بياناته (points ممكن تتغير)
        if (isLoggedIn()) {
            try {
                const res = await AccountAPI.me();
                setCachedUser(res.user);
                renderNavButton();
                claimDailyPointsQuietly();
            } catch {
                logout();
            }
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    window.TojiAccount = {
        AccountAPI,
        isLoggedIn,
        getUser,
        getToken,
        logout,
        openAuthModal,
        getSettings,
        toast
    };
})();
