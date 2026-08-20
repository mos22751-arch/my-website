(function () {
    'use strict';

    const { TokenManager, API_BASE_URL } = window.TojiAPI;

    async function adminFetch(endpoint, options = {}) {
        const token = TokenManager.get();
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...(options.headers || {})
            }
        });
        if (res.status === 401) {
            TokenManager.remove();
            window.location.href = 'admin.html';
            throw new Error('غير مصرح');
        }
        let data;
        try { data = await res.json(); } catch { data = {}; }
        if (!res.ok) throw new Error(data.message || 'حصل خطأ');
        return data;
    }

    let currentPage = 1;
    let searchTimer = null;
    let detailUser = null;

    function $(id) { return document.getElementById(id); }

    async function checkServerStatus() {
        try {
            const r = await fetch(`${API_BASE_URL}/health`).catch(() => fetch(`${API_BASE_URL.replace('/api', '')}`));
            $('statusDot').classList.add('online');
            $('statusText').textContent = 'متصل';
        } catch {
            $('statusText').textContent = 'غير متصل';
        }
    }

    // ============================================================
    // Settings panel
    // ============================================================
    async function loadSettings() {
        const res = await adminFetch('/admin/users/settings');
        const s = res.data;
        const form = $('settingsForm');
        ['enableAccounts', 'enableRegistration', 'enableGoogleLogin', 'enableChatMemory', 'enableSavedProjects', 'enablePoints']
            .forEach((k) => { form.elements[k].checked = Boolean(s[k]); });
        form.elements.googleClientId.value = s.googleClientId || '';
        form.elements.pointsPerDay.value = s.pointsPerDay;
        form.elements.redeemThreshold.value = s.redeemThreshold;
        form.elements.discountPercent.value = s.discountPercent;
    }

    $('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = $('settingsMsg');
        msg.textContent = 'جارٍ الحفظ...';
        msg.className = 'acc-form-msg';
        const form = e.target;
        const payload = {
            enableAccounts: form.elements.enableAccounts.checked,
            enableRegistration: form.elements.enableRegistration.checked,
            enableGoogleLogin: form.elements.enableGoogleLogin.checked,
            enableChatMemory: form.elements.enableChatMemory.checked,
            enableSavedProjects: form.elements.enableSavedProjects.checked,
            enablePoints: form.elements.enablePoints.checked,
            googleClientId: form.elements.googleClientId.value.trim(),
            pointsPerDay: Number(form.elements.pointsPerDay.value),
            redeemThreshold: Number(form.elements.redeemThreshold.value),
            discountPercent: Number(form.elements.discountPercent.value)
        };
        try {
            await adminFetch('/admin/users/settings', { method: 'PUT', body: JSON.stringify(payload) });
            msg.textContent = 'اتحفظت الإعدادات ✅';
            msg.className = 'acc-form-msg is-success';
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    // ============================================================
    // Users list
    // ============================================================
    async function loadUsers(page = 1) {
        currentPage = page;
        const search = $('searchInput').value.trim();
        const qs = new URLSearchParams({ page, limit: 20, ...(search && { search }) });
        const res = await adminFetch(`/admin/users?${qs.toString()}`);
        renderTable(res.data);
        renderPagination(res.pagination);
        $('resultCount').textContent = `${res.pagination.total} حساب`;
    }

    function renderTable(users) {
        const tbody = $('usersTableBody');
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="acc-empty-row">مفيش حسابات.</td></tr>`;
            return;
        }
        tbody.innerHTML = users.map((u) => `
            <tr data-id="${u._id}">
                <td>${u.avatarUrl ? `<img class="acc-mini-avatar" src="${escapeAttr(u.avatarUrl)}" alt="">` : `<span class="acc-mini-avatar acc-mini-fallback">${escapeHtml((u.name || '؟')[0])}</span>`}</td>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${u.points?.total ?? 0}</td>
                <td>${new Date(u.createdAt).toLocaleDateString('ar-EG')}</td>
                <td><span class="acc-badge ${u.isActive ? 'is-active' : 'is-inactive'}">${u.isActive ? 'مفعّل' : 'موقوف'}</span></td>
                <td><button class="btn-secondary acc-view-btn" data-id="${u._id}" type="button">عرض</button></td>
            </tr>`).join('');

        tbody.querySelectorAll('.acc-view-btn').forEach((btn) => {
            btn.addEventListener('click', () => openDetail(btn.dataset.id));
        });
    }

    function renderPagination(p) {
        const el = $('pagination');
        if (p.pages <= 1) { el.innerHTML = ''; return; }
        let html = '';
        for (let i = 1; i <= p.pages; i++) {
            html += `<button class="acc-page-btn ${i === p.page ? 'active' : ''}" data-page="${i}" type="button">${i}</button>`;
        }
        el.innerHTML = html;
        el.querySelectorAll('.acc-page-btn').forEach((btn) => {
            btn.addEventListener('click', () => loadUsers(Number(btn.dataset.page)));
        });
    }

    $('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadUsers(1), 350);
    });

    // ============================================================
    // Detail modal
    // ============================================================
    async function openDetail(id) {
        const res = await adminFetch(`/admin/users/${id}`);
        detailUser = res.data;
        $('detailName').textContent = detailUser.name;
        $('detailEmail').textContent = detailUser.email;
        $('detailActive').checked = detailUser.isActive;
        $('detailPoints').value = detailUser.points?.total ?? 0;
        $('detailNotes').value = detailUser.adminNotes || '';
        $('detailStats').innerHTML = `
            <span>💬 ${res.stats.chatCount} رسالة شات</span>
            <span>📋 ${res.stats.quoteCount} طلب عرض سعر</span>
            <span>📅 ${res.stats.bookingCount} طلب حجز</span>`;
        $('detailSaveMsg').textContent = '';
        $('detailPasswordMsg').textContent = '';
        $('detailNewPassword').value = '';
        $('detailOverlay').hidden = false;
    }

    $('detailClose').addEventListener('click', () => { $('detailOverlay').hidden = true; });
    $('detailOverlay').addEventListener('click', (e) => { if (e.target === $('detailOverlay')) $('detailOverlay').hidden = true; });

    $('detailSaveBtn').addEventListener('click', async () => {
        const msg = $('detailSaveMsg');
        msg.textContent = 'جارٍ الحفظ...';
        msg.className = 'acc-form-msg';
        try {
            await adminFetch(`/admin/users/${detailUser._id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    isActive: $('detailActive').checked,
                    pointsTotal: Number($('detailPoints').value),
                    adminNotes: $('detailNotes').value
                })
            });
            msg.textContent = 'اتحفظ ✅';
            msg.className = 'acc-form-msg is-success';
            loadUsers(currentPage);
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    $('detailPasswordBtn').addEventListener('click', async () => {
        const msg = $('detailPasswordMsg');
        const newPassword = $('detailNewPassword').value;
        if (!newPassword || newPassword.length < 8) {
            msg.textContent = 'كلمة المرور لازم تكون 8 حروف على الأقل.';
            msg.className = 'acc-form-msg is-error';
            return;
        }
        msg.textContent = 'جارٍ التغيير...';
        msg.className = 'acc-form-msg';
        try {
            await adminFetch(`/admin/users/${detailUser._id}/password`, {
                method: 'PUT',
                body: JSON.stringify({ newPassword })
            });
            msg.textContent = 'اتغيّرت كلمة المرور ✅';
            msg.className = 'acc-form-msg is-success';
            $('detailNewPassword').value = '';
        } catch (err) {
            msg.textContent = err.message;
            msg.className = 'acc-form-msg is-error';
        }
    });

    $('detailDeleteBtn').addEventListener('click', async () => {
        if (!confirm(`متأكد إنك عايز تمسح حساب "${detailUser.name}" نهائيًا؟`)) return;
        try {
            await adminFetch(`/admin/users/${detailUser._id}`, { method: 'DELETE' });
            $('detailOverlay').hidden = true;
            loadUsers(currentPage);
        } catch (err) {
            alert(err.message);
        }
    });

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function escapeAttr(str) { return escapeHtml(str); }

    $('logoutBtn').addEventListener('click', () => {
        TokenManager.remove();
        window.location.href = 'admin.html';
    });

    // ============================================================
    // Init — لازم أدمن مسجل دخول
    // ============================================================
    (async function init() {
        if (!TokenManager.isLoggedIn()) {
            $('lockScreen').hidden = false;
            return;
        }
        try {
            await loadSettings();
            await loadUsers(1);
            $('accWorkspace').hidden = false;
            checkServerStatus();
        } catch (err) {
            $('lockScreen').hidden = false;
        }
    })();
})();
