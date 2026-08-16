document.addEventListener('DOMContentLoaded', () => {
    loadGuestbook();
    document.getElementById('guestbookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('gbStatus');
        const name = document.getElementById('gbName').value.trim();
        const message = document.getElementById('gbMessage').value.trim();
        const mood = document.getElementById('gbMood').value.trim();
        if (!name || !message) return;
        status.textContent = 'Sending…';
        status.className = 'form-status';
        try {
            await window.TojiAPI.GuestbookAPI.create({ name, message, mood });
            status.textContent = 'Thanks! Your message will show once approved.';
            status.className = 'form-status is-success';
            e.target.reset();
        } catch (err) {
            status.textContent = err.message || 'Could not send. Try again.';
            status.className = 'form-status is-error';
        }
    });
});

async function loadGuestbook() {
    const el = document.getElementById('guestbookList');
    try {
        const res = await window.TojiAPI.GuestbookAPI.getPublic(100);
        const items = res?.data || [];
        if (!items.length) { el.innerHTML = '<p class="empty-state">No messages yet — be the first.</p>'; return; }
        el.innerHTML = items.map((g) => `
            <div class="glass-card blog-card" style="cursor:default;">
                <h3>${escapeHtml(g.name)} ${g.mood ? escapeHtml(g.mood) : ''}</h3>
                <p>${escapeHtml(g.message)}</p>
                <span class="blog-date">${formatDate(g.createdAt)}</span>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<p class="empty-state">Could not load the guestbook right now.</p>';
    }
}

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
