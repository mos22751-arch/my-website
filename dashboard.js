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
        document.getElementById('accUsernameInput').value = user.username || '';
        document.getElementById('accBioInput').value = user.bio || '';
        document.getElementById('accPhoneInput').value = user.phone || '';
        document.getElementById('accVisibilitySelect').value = user.profileVisibility || 'public';

        const unameLink = document.getElementById('accUsernameLink');
        unameLink.textContent = user.username ? '@' + user.username : '@—';
        unameLink.href = user.username ? `profile.html?u=${encodeURIComponent(user.username)}` : '#';
        document.getElementById('accBioDisplay').textContent = user.bio || '';
        document.getElementById('accFollowersCount').textContent = user.followersCount || 0;
        document.getElementById('accFollowingCount').textContent = user.followingCount || 0;

        if (user.level) {
            document.getElementById('accLevelEmoji').textContent = user.level.emoji;
            document.getElementById('accLevelLabel').textContent = user.level.label;
        }

        renderWelcomeBanner(user.adminWelcomeMessage);
        loadBroadcasts();

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
        renderPointsHistory(user.pointsHistory || []);
        renderMoodPref(user.preferredMode || '');
        renderStreak(user.streak);
        renderReferral(user);
        renderQuests(user);
        document.getElementById('accNotesInput').value = user.personalNotes || '';
        updateNotesCounter();
        loadProjects();
        loadChatHistory();
        loadSavedProjects();
        loadFollowLists();

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

    function renderPointsHistory(history) {
        const el = document.getElementById('accPointsHistory');
        if (!el) return;
        if (!history.length) { el.innerHTML = '<p class="acc-empty">لسه مفيش حركة نقط.</p>'; return; }
        el.innerHTML = history.slice().reverse().slice(0, 30).map((h) => `
            <div class="acc-history-row">
                <span class="acc-history-amount ${h.amount >= 0 ? 'is-positive' : 'is-negative'}">${h.amount >= 0 ? '+' : ''}${h.amount}</span>
                <span class="acc-history-reason">${escapeHtml(h.reason)}</span>
                <small class="acc-history-date">${new Date(h.createdAt).toLocaleDateString('ar-EG')}</small>
            </div>`).join('');
    }

    function renderMoodPref(mode) {
        document.querySelectorAll('#accMoodPick .acc-mood-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    function renderStreak(streak) {
        const badge = document.getElementById('accStreakBadge');
        if (!streak || !streak.current) { badge.hidden = true; return; }
        badge.hidden = false;
        document.getElementById('accStreakCurrent').textContent = streak.current;
    }

    function renderReferral(user) {
        document.getElementById('accReferralCode').textContent = user.referralCode || '—';
        document.getElementById('accReferralCount').textContent =
            `دعيت ${user.referralCount || 0} صاحب لحد دلوقتي.`;
    }

    const WEEKLY_CHALLENGE_TARGET = 3;

    function renderQuests(user) {
        const wc = user.weeklyChallenge || { daysCount: 0, claimed: false };
        const fillEl = document.getElementById('accChallengeFill');
        const subEl  = document.getElementById('accChallengeSub');
        const btn    = document.getElementById('accChallengeBtn');
        const pct = Math.min(100, (wc.daysCount / WEEKLY_CHALLENGE_TARGET) * 100);
        fillEl.style.width = pct + '%';

        if (wc.claimed) {
            subEl.textContent = 'خدت المكافأة الأسبوع ده ✅';
            btn.disabled = true;
            btn.textContent = 'اتاخدت';
        } else if (wc.daysCount >= WEEKLY_CHALLENGE_TARGET) {
            subEl.textContent = `${wc.daysCount} / ${WEEKLY_CHALLENGE_TARGET} أيام — جاهز!`;
            btn.disabled = false;
            btn.textContent = 'خد 20 نقطة';
        } else {
            subEl.textContent = `${wc.daysCount} / ${WEEKLY_CHALLENGE_TARGET} أيام`;
            btn.disabled = true;
            btn.textContent = 'خد 20 نقطة';
        }

        const surpriseBtn = document.getElementById('accSurpriseBtn');
        if (user.canClaimSurpriseBox === false) {
            surpriseBtn.disabled = true;
            surpriseBtn.textContent = 'اتفتح الشهر ده ✅';
        } else {
            surpriseBtn.disabled = false;
            surpriseBtn.textContent = 'افتح الصندوق';
        }
    }

    document.getElementById('accChallengeBtn')?.addEventListener('click', async function () {
        this.disabled = true;
        try {
            const res = await AccountAPI.claimWeeklyChallenge();
            window.TojiAccount.toast(`أخدت ${res.awarded} نقطة 🎯`);
            render();
        } catch (err) {
            window.TojiAccount.toast(err.message);
            this.disabled = false;
        }
    });

    document.getElementById('accSurpriseBtn')?.addEventListener('click', async function () {
        this.disabled = true;
        try {
            const res = await AccountAPI.claimSurpriseBox();
            window.TojiAccount.toast(`مبروك! لقيت ${res.awarded} نقطة في الصندوق 🎁`);
            render();
        } catch (err) {
            window.TojiAccount.toast(err.message);
            this.disabled = false;
        }
    });

    document.getElementById('accReferralCopyBtn')?.addEventListener('click', () => {
        const code = document.getElementById('accReferralCode').textContent;
        if (!code || code === '—') return;
        const url = `${window.location.origin}/index.html?ref=${code}`;
        navigator.clipboard?.writeText(url).then(() => {
            window.TojiAccount.toast('اتنسخ الرابط! 🎉');
        }).catch(() => {
            window.TojiAccount.toast(url);
        });
    });

    function updateNotesCounter() {
        const el = document.getElementById('accNotesCount');
        const input = document.getElementById('accNotesInput');
        if (el && input) el.textContent = input.value.length;
    }
    document.getElementById('accNotesInput')?.addEventListener('input', updateNotesCounter);

    document.getElementById('accNotesSaveBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('accNotesStatus');
        status.textContent = 'جارٍ الحفظ...';
        status.className = 'form-status';
        try {
            await AccountAPI.updateNotes(document.getElementById('accNotesInput').value);
            status.textContent = 'اتحفظت ✅';
            status.className = 'form-status is-success';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    async function loadSavedProjects() {
        const listEl = document.getElementById('accSavedList');
        const emptyEl = document.getElementById('accSavedEmpty');
        try {
            const res = await AccountAPI.me();
            const ids = res.user.savedProjectIds || [];
            if (!ids.length) { emptyEl.hidden = false; listEl.innerHTML = ''; return; }
            emptyEl.hidden = true;
            const all = await window.TojiAPI.ProjectsAPI.getPublic();
            const projects = (all.data || []).filter((p) => ids.includes(String(p._id)));
            listEl.innerHTML = projects.map((p) => `
                <div class="acc-list-item">
                    <div><strong>${escapeHtml(p.title || 'مشروع')}</strong><span>${escapeHtml((p.description || '').slice(0, 80))}</span></div>
                    <div class="acc-list-meta"><a class="btn-secondary" href="index.html#projects">شوفه</a></div>
                </div>`).join('') || '<p class="acc-empty">المشاريع دي مش موجودة دلوقتي.</p>';
        } catch {
            emptyEl.hidden = false;
            emptyEl.textContent = 'تعذر تحميل مشاريعك المحفوظة.';
        }
    }

    document.getElementById('accExportBtn')?.addEventListener('click', async () => {
        try {
            const data = await AccountAPI.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'toji-my-data.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            window.TojiAccount.toast(err.message || 'تعذر تصدير بياناتك');
        }
    });

    document.querySelectorAll('#accMoodPick .acc-mood-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const status = document.getElementById('accMoodStatus');
            status.textContent = '...';
            status.className = 'form-status';
            try {
                await AccountAPI.updatePreferences(btn.dataset.mode, '');
                renderMoodPref(btn.dataset.mode);
                status.textContent = 'اتحفظ ✅';
                status.className = 'form-status is-success';
            } catch (err) {
                status.textContent = err.message;
                status.className = 'form-status is-error';
            }
        });
    });

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

    // ── ملخص بس هنا — الأرشيف الكامل في صفحة زعزع نفسها (مش الحساب) ──
    async function loadChatHistory() {
        const summaryEl = document.getElementById('accChatSummary');
        const emptyEl   = document.getElementById('accChatEmpty');
        try {
            const res   = await AccountAPI.chatHistory();
            const items = res.data || [];
            if (!items.length) {
                emptyEl.hidden = false;
                summaryEl.hidden = true;
                return;
            }
            emptyEl.hidden = true;
            summaryEl.hidden = false;
            document.getElementById('accChatCount').textContent = items.length;
            const last = items[items.length - 1];
            document.getElementById('accChatLast').textContent = last?.answer
                ? `آخر رد من زعزع: "${String(last.answer).slice(0, 90)}${last.answer.length > 90 ? '…' : ''}"`
                : 'كمل من هنا.';
        } catch {
            emptyEl.hidden = false;
            emptyEl.textContent = 'تعذر تحميل ملخص دردشتك دلوقتي.';
        }
    }

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    document.getElementById('accProfileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('accNameStatus');
        status.textContent = '...';
        status.className = 'form-status';
        try {
            const res = await AccountAPI.updateProfile({
                name: document.getElementById('accNameInput').value.trim(),
                username: document.getElementById('accUsernameInput').value.trim(),
                bio: document.getElementById('accBioInput').value,
                phone: document.getElementById('accPhoneInput').value,
                profileVisibility: document.getElementById('accVisibilitySelect').value
            });
            status.textContent = 'اتحفظ! ✅';
            status.className = 'form-status is-success';
            document.getElementById('accName').textContent = res.user.name;
            document.getElementById('accUsernameLink').textContent = '@' + (res.user.username || '—');
            document.getElementById('accBioDisplay').textContent = res.user.bio || '';
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

    document.getElementById('accDeleteBtn')?.addEventListener('click', () => {
        document.getElementById('accDeleteConfirm').hidden = false;
    });
    document.getElementById('accDeleteCancelBtn')?.addEventListener('click', () => {
        document.getElementById('accDeleteConfirm').hidden = true;
    });
    document.getElementById('accDeleteConfirmBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('accDeleteStatus');
        status.textContent = 'جارٍ الحذف...';
        status.className = 'form-status';
        try {
            await AccountAPI.deleteAccount();
            window.TojiAccount.logout();
            window.location.href = 'index.html';
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    // ── رسالة ترحيب مخصصة من الأدمن ──
    function renderWelcomeBanner(msg) {
        const banner = document.getElementById('accWelcomeBanner');
        if (!msg || !msg.text || msg.seen) { banner.hidden = true; return; }
        document.getElementById('accWelcomeText').textContent = msg.text;
        banner.hidden = false;
    }
    document.getElementById('accWelcomeDismiss')?.addEventListener('click', async () => {
        document.getElementById('accWelcomeBanner').hidden = true;
        try { await AccountAPI.markWelcomeSeen(); } catch {}
    });

    // ── إعلانات الأدمن ──
    async function loadBroadcasts() {
        const banner = document.getElementById('accBroadcastBanner');
        try {
            const res = await AccountAPI.getBroadcasts();
            const items = res.data || [];
            if (!items.length) { banner.hidden = true; return; }
            const seenId = localStorage.getItem('toji_last_seen_broadcast');
            if (String(items[0]._id) === seenId) { banner.hidden = true; return; }
            banner.innerHTML = `<span>📢 ${escapeHtml(items[0].text)}</span><button type="button" id="accBroadcastDismiss">✕</button>`;
            banner.hidden = false;
            document.getElementById('accBroadcastDismiss')?.addEventListener('click', () => {
                localStorage.setItem('toji_last_seen_broadcast', String(items[0]._id));
                banner.hidden = true;
            });
        } catch { banner.hidden = true; }
    }

    // ── المتابعين / بيتابع / الرسايل ──
    document.querySelectorAll('.acc-follow-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.acc-follow-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('accFollowersList').hidden = tab.dataset.tab !== 'followers';
            document.getElementById('accFollowingList').hidden = tab.dataset.tab !== 'following';
            document.getElementById('accChatsList').hidden = tab.dataset.tab !== 'chats';
            if (tab.dataset.tab === 'chats') loadConversations();
        });
    });

    function renderUserList(el, users, emptyText) {
        if (!users.length) { el.innerHTML = `<p class="acc-empty">${emptyText}</p>`; return; }
        el.innerHTML = users.map((u) => `
            <a class="acc-list-item" href="profile.html?u=${encodeURIComponent(u.username)}">
                <div><strong>${escapeHtml(u.name)}</strong><span>@${escapeHtml(u.username)}</span></div>
            </a>`).join('');
    }

    async function loadFollowLists() {
        try {
            const [followers, following] = await Promise.all([AccountAPI.followers(), AccountAPI.following()]);
            renderUserList(document.getElementById('accFollowersList'), followers.data || [], 'لسه مفيش حد بيتابعك.');
            renderUserList(document.getElementById('accFollowingList'), following.data || [], 'لسه مبتتابعش حد.');
        } catch {}
    }

    async function loadConversations() {
        const el = document.getElementById('accChatsList');
        try {
            const res = await AccountAPI.getConversations();
            const items = res.data || [];
            const adminItem = `<a class="acc-list-item acc-admin-chat-link" href="#" data-username="admin">
                <div><strong>💬 كلم Toji مباشرة</strong><span>ابعت رسالة للأدمن</span></div>
            </a>`;
            const userItems = items.filter((t) => !t.isAdmin).map((t) => `
                <a class="acc-list-item" href="#" data-username="${escapeHtml(t.other?.username || '')}">
                    <div><strong>${escapeHtml(t.other?.name || '')}</strong><span>${escapeHtml((t.lastText || '').slice(0, 60))}</span></div>
                    ${t.unread ? '<span class="acc-unread-dot"></span>' : ''}
                </a>`).join('');
            el.innerHTML = adminItem + userItems;
        } catch {
            el.innerHTML = '<p class="acc-empty">تعذر تحميل الرسايل.</p>';
        }
    }

    document.getElementById('accChatsList')?.addEventListener('click', (e) => {
        const link = e.target.closest('[data-username]');
        if (!link) return;
        e.preventDefault();
        openDmThread(link.dataset.username, link.querySelector('strong')?.textContent || 'Toji');
    });

    // ── نافذة الرسايل (DM) ──
    let currentDmUsername = '';
    function openDmThread(username, displayName) {
        currentDmUsername = username;
        document.getElementById('accDmTitle').textContent = displayName || username;
        document.getElementById('accDmOverlay').hidden = false;
        loadDmMessages();
    }
    document.getElementById('accDmClose')?.addEventListener('click', () => {
        document.getElementById('accDmOverlay').hidden = true;
    });
    async function loadDmMessages() {
        const el = document.getElementById('accDmMessages');
        el.innerHTML = '<p class="acc-empty">⏳ جارٍ التحميل...</p>';
        try {
            const res = await AccountAPI.getThread(currentDmUsername);
            const msgs = res.data || [];
            const myId = window.TojiAccount.getUser()?.id;
            el.innerHTML = msgs.map((m) => {
                const isMine = currentDmUsername === 'admin' ? !m.isAdminReply : String(m.fromUser) === String(myId);
                return `<div class="acc-dm-msg ${isMine ? 'is-mine' : 'is-theirs'}">${escapeHtml(m.text)}</div>`;
            }).join('') || '<p class="acc-empty">لسه مفيش رسايل، ابدأ الكلام 👋</p>';
            el.scrollTop = el.scrollHeight;
        } catch (err) {
            el.innerHTML = `<p class="acc-empty">${escapeHtml(err.message)}</p>`;
        }
    }
    async function sendDm() {
        const input = document.getElementById('accDmInput');
        const text = input.value.trim();
        if (!text || !currentDmUsername) return;
        input.value = '';
        try {
            await AccountAPI.sendMessage(currentDmUsername, text);
            loadDmMessages();
        } catch (err) {
            window.TojiAccount.toast(err.message);
        }
    }
    document.getElementById('accDmSend')?.addEventListener('click', sendDm);
    document.getElementById('accDmInput')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendDm();
    });

    // ── إهداء نقط ──
    document.getElementById('accGiftBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('accGiftStatus');
        const username = document.getElementById('accGiftUsername').value.trim();
        const amount = Number(document.getElementById('accGiftAmount').value);
        status.textContent = '...';
        status.className = 'form-status';
        try {
            const res = await AccountAPI.giftPoints(username, amount);
            status.textContent = res.message;
            status.className = 'form-status is-success';
            document.getElementById('accGiftUsername').value = '';
            document.getElementById('accGiftAmount').value = '';
            render();
        } catch (err) {
            status.textContent = err.message;
            status.className = 'form-status is-error';
        }
    });

    window.addEventListener('toji-account-change', render);
    render();
});
