document.addEventListener('DOMContentLoaded', async () => {
    const guestCard = document.getElementById('accGuestCard');
    const dashboard = document.getElementById('accDashboard');
    if (!guestCard || !dashboard) return;

    const AccountAPI = window.TojiAccount?.AccountAPI;
    if (!AccountAPI) return;

    document.getElementById('accGuestBtn')?.addEventListener('click', () => window.TojiAccount.openAuthModal('login'));

    async function render() {
        if (!window.TojiAccount.isLoggedIn()) {
            guestCard.hidden = false;
            dashboard.hidden = true;
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        guestCard.hidden = true;
        dashboard.hidden = false;

        let user;
        try {
            const res = await AccountAPI.me();
            user = res.user;
        } catch {
            window.TojiAccount.logout();
            guestCard.hidden = false;
            dashboard.hidden = true;
            return;
        }

        // profile card
        document.getElementById('accName').textContent = user.name;
        document.getElementById('accEmail').textContent = user.email;
        document.getElementById('accPointsTotal').textContent = user.points?.total ?? 0;
        document.getElementById('accNameInput').value = user.name;

        const img = document.getElementById('accAvatarImg');
        const fallback = document.getElementById('accAvatarFallback');
        if (user.avatarUrl) {
            img.src = user.avatarUrl;
            img.hidden = false;
            fallback.hidden = true;
        } else {
            img.hidden = true;
            fallback.hidden = false;
            fallback.textContent = (user.name || '؟').trim().slice(0, 1).toUpperCase();
        }

        renderCodes(user.discountCodes || []);
        loadProjects();
        loadChatHistory();

        const settings = await window.TojiAccount.getSettings();
        const hint = document.getElementById('accRedeemHint');
        const redeemBtn = document.getElementById('accRedeemBtn');
        if (!settings.enablePoints) {
            hint.textContent = 'نظام النقط متوقف حاليًا.';
            redeemBtn.hidden = true;
        } else {
            hint.textContent = `كل ${settings.redeemThreshold} نقطة = كود خصم ${settings.discountPercent}%. معاك دلوقتي ${user.points?.total ?? 0} نقطة.`;
            redeemBtn.hidden = false;
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function renderCodes(codes) {
        const list = document.getElementById('accCodesList');
        if (!codes.length) { list.innerHTML = ''; return; }
        list.innerHTML = codes.slice().reverse().map((c) => `
            <div class="acc-code-item ${c.used ? 'is-used' : ''}">
                <code>${c.code}</code>
                <span>${c.percent}% خصم</span>
                <small>${c.used ? 'مُستخدم' : 'متاح'}</small>
            </div>`).join('');
    }

    async function loadProjects() {
        const listEl = document.getElementById('accProjectsList');
        const emptyEl = document.getElementById('accProjectsEmpty');
        try {
            const res = await AccountAPI.myProjects();
            const items = res.data || [];
            if (!items.length) { emptyEl.hidden = false; listEl.innerHTML = ''; return; }
            emptyEl.hidden = true;
            listEl.innerHTML = items.map((it) => {
                const label = it.type === 'quote' ? 'طلب عرض سعر' : 'طلب حجز';
                const detail = it.type === 'quote' ? (it.projectType || it.description || '') : (it.preferredDate || it.message || '');
                const date = new Date(it.createdAt).toLocaleDateString('ar-EG');
                return `<div class="acc-list-item">
                    <div><strong>${label}</strong><span>${escapeHtml(detail).slice(0, 80)}</span></div>
                    <div class="acc-list-meta"><span class="acc-status acc-status-${it.status}">${it.status}</span><small>${date}</small></div>
                </div>`;
            }).join('');
        } catch {
            emptyEl.hidden = false;
            emptyEl.textContent = 'تعذر تحميل مشاريعك دلوقتي.';
        }
    }

    async function loadChatHistory() {
        const logEl = document.getElementById('accChatLog');
        const emptyEl = document.getElementById('accChatEmpty');
        try {
            const res = await AccountAPI.chatHistory();
            const items = res.data || [];
            if (!items.length) { emptyEl.hidden = false; logEl.innerHTML = ''; return; }
            emptyEl.hidden = true;
            logEl.innerHTML = items.slice(-40).map((m) => `
                <div class="acc-chat-pair">
                    <p class="acc-chat-q">${escapeHtml(m.question)}</p>
                    ${m.answer ? `<p class="acc-chat-a">${escapeHtml(m.answer)}</p>` : ''}
                </div>`).join('');
        } catch {
            emptyEl.hidden = false;
            emptyEl.textContent = 'تعذر تحميل دردشتك دلوقتي.';
        }
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    document.getElementById('accNameForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('accNameStatus');
        const name = document.getElementById('accNameInput').value.trim();
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.updateName(name);
            status.textContent = 'اتحفظ!';
            status.className = 'form-status is-success';
            document.getElementById('accName').textContent = name;
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    document.getElementById('accPassForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('accPassStatus');
        const current = document.getElementById('accCurrentPass').value;
        const next = document.getElementById('accNewPass').value;
        status.textContent = '...';
        status.className = 'form-status';
        try {
            await AccountAPI.changePassword(current, next);
            status.textContent = 'اتغيّرت كلمة المرور!';
            status.className = 'form-status is-success';
            e.target.reset();
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    document.getElementById('accAvatarInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await AccountAPI.uploadAvatar(file);
            document.getElementById('accAvatarImg').src = res.user.avatarUrl;
            document.getElementById('accAvatarImg').hidden = false;
            document.getElementById('accAvatarFallback').hidden = true;
            window.TojiAccount.toast('اتغيّرت الصورة!');
        } catch (err) {
            window.TojiAccount.toast(err.message || 'فشل رفع الصورة');
        }
    });

    document.getElementById('accRedeemBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('accRedeemStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            const res = await AccountAPI.redeemPoints();
            status.textContent = `اتعمل كود: ${res.code} (${res.percent}% خصم)`;
            status.className = 'form-status is-success';
            document.getElementById('accPointsTotal').textContent = res.remainingPoints;
            render();
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    window.addEventListener('toji-account-change', render);
    render();
});
