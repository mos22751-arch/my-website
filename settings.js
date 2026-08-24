// ============================================================
// TOJI — مركز الحساب (settings.html)
//    بيانات الحساب، كلمة المرور، لينك البروفايل، ومنطقة الخطر
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const guestCard = document.getElementById('settingsGuestCard');
    const content   = document.getElementById('settingsContent');
    if (!guestCard || !content) return;

    const AccountAPI = window.TojiAccount?.AccountAPI;
    if (!AccountAPI || !window.TojiAccount.isLoggedIn()) {
        guestCard.hidden = false;
        content.hidden = true;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    guestCard.hidden = true;
    content.hidden = false;

    async function load() {
        try {
            const res = await AccountAPI.me();
            const user = res.user;
            document.getElementById('accNameInput').value = user.name || '';
            document.getElementById('accUsernameInput').value = user.username || '';
            document.getElementById('accBioInput').value = user.bio || '';
            document.getElementById('accPhoneInput').value = user.phone || '';
            document.getElementById('accVisibilitySelect').value = user.profileVisibility || 'public';

            const link = user.username ? `${window.location.origin}/account/${user.username}` : '';
            document.getElementById('settingsProfileLink').textContent = link || 'اختار يوزرنيم الأول';
        } catch {}
        if (window.lucide) window.lucide.createIcons();
    }
    load();

    document.getElementById('settingsCopyLinkBtn')?.addEventListener('click', () => {
        const text = document.getElementById('settingsProfileLink').textContent;
        if (!text || text.includes('اختار')) return;
        navigator.clipboard?.writeText(text).then(() => {
            window.TojiAccount.toast('اتنسخ اللينك! 🎉');
        }).catch(() => window.TojiAccount.toast(text));
    });

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
            const link = res.user.username ? `${window.location.origin}/account/${res.user.username}` : '';
            document.getElementById('settingsProfileLink').textContent = link || 'اختار يوزرنيم الأول';
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
});
