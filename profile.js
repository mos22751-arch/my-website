// ============================================================
// TOJI — صفحة البروفايل العام (view من منظور شخص تاني)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('profileLoading');
    const errorEl   = document.getElementById('profileError');
    const contentEl = document.getElementById('profileContent');

    const AccountAPI = window.TojiAccount?.AccountAPI;
    const username = new URLSearchParams(window.location.search).get('u');

    if (!username || !AccountAPI) {
        loadingEl.hidden = true;
        errorEl.hidden = false;
        return;
    }

    let profile = null;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    function formatDate(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
    }

    async function load() {
        try {
            const res = await AccountAPI.getPublicProfile(username);
            profile = res.data;
            render();
        } catch (err) {
            loadingEl.hidden = true;
            errorEl.hidden = false;
            document.getElementById('profileErrorTitle').textContent =
                err.message?.includes('خاص') ? 'الحساب ده خاص' : 'الحساب مش موجود';
            document.getElementById('profileErrorText').textContent =
                err.message?.includes('خاص') ? 'صاحب الحساب ده مخلي بروفايله خاص.' : 'تأكد من الرابط وجرب تاني.';
        }
    }

    function render() {
        loadingEl.hidden = true;
        contentEl.hidden = false;
        document.title = `${profile.name} (@${profile.username}) | TOJI`;

        document.getElementById('pName').textContent = profile.name;
        document.getElementById('pUsername').textContent = '@' + profile.username;
        document.getElementById('pBio').textContent = profile.bio || '';
        document.getElementById('pFollowersCount').textContent = profile.followersCount || 0;
        document.getElementById('pFollowingCount').textContent = profile.followingCount || 0;
        document.getElementById('pMemberSince').textContent = profile.memberSince ? `عضو من ${formatDate(profile.memberSince)}` : '';

        if (profile.level) {
            document.getElementById('pLevelEmoji').textContent = profile.level.emoji;
            document.getElementById('pLevelLabel').textContent = profile.level.label;
        }

        const img = document.getElementById('pAvatarImg');
        const fallback = document.getElementById('pAvatarFallback');
        if (profile.avatarUrl) {
            img.src = profile.avatarUrl;
            img.hidden = false;
            fallback.hidden = true;
        } else {
            img.hidden = true;
            fallback.hidden = false;
            fallback.textContent = (profile.name || '؟').trim().slice(0, 1).toUpperCase();
        }

        const followBtn = document.getElementById('pFollowBtn');
        const msgBtn     = document.getElementById('pMessageBtn');
        const isSelf = window.TojiAccount?.isLoggedIn() && window.TojiAccount.getUser()?.username === profile.username;

        if (isSelf) {
            followBtn.hidden = true;
            msgBtn.hidden = true;
        } else {
            followBtn.hidden = false;
            msgBtn.hidden = false;
            updateFollowBtn(profile.isFollowing);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function updateFollowBtn(isFollowing) {
        const btn = document.getElementById('pFollowBtn');
        btn.textContent = isFollowing ? 'إلغاء المتابعة' : 'تابعه';
        btn.classList.toggle('is-following', isFollowing);
    }

    document.getElementById('pFollowBtn')?.addEventListener('click', async () => {
        if (!window.TojiAccount?.isLoggedIn()) { window.TojiAccount?.openAuthModal?.(); return; }
        const btn = document.getElementById('pFollowBtn');
        btn.disabled = true;
        try {
            const isFollowing = btn.classList.contains('is-following');
            const res = isFollowing ? await AccountAPI.unfollow(username) : await AccountAPI.follow(username);
            updateFollowBtn(res.following);
            profile.followersCount += res.following ? 1 : -1;
            document.getElementById('pFollowersCount').textContent = profile.followersCount;
        } catch (err) {
            window.TojiAccount.toast(err.message);
        } finally {
            btn.disabled = false;
        }
    });

    document.getElementById('pMessageBtn')?.addEventListener('click', () => {
        if (!window.TojiAccount?.isLoggedIn()) { window.TojiAccount?.openAuthModal?.(); return; }
        openDmThread(username, profile.name);
    });

    // ── نافذة الرسايل ──
    let currentDmUsername = '';
    function openDmThread(uname, displayName) {
        currentDmUsername = uname;
        document.getElementById('accDmTitle').textContent = displayName || uname;
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
                const isMine = String(m.fromUser) === String(myId);
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
    document.getElementById('accDmInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendDm(); });

    load();
});
