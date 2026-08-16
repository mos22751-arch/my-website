document.addEventListener('DOMContentLoaded', async () => {
    const el = document.getElementById('changelogList');
    try {
        const res = await window.TojiAPI.ChangelogAPI.getPublic();
        const items = res?.data || [];
        if (!items.length) { el.innerHTML = '<p class="empty-state">Nothing logged yet.</p>'; return; }
        el.innerHTML = items.map((entry) => `
            <div class="glass-card changelog-entry">
                <span class="changelog-type ${entry.type}">${entry.type}</span>
                <div>
                    <h3>${escapeHtml(entry.title)}</h3>
                    ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ''}
                    <span class="changelog-date">${formatDate(entry.date)}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<p class="empty-state">Could not load the changelog right now.</p>';
    }
});

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
