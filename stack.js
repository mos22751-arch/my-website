document.addEventListener('DOMContentLoaded', async () => {
    const el = document.getElementById('stackBody');
    try {
        const res = await window.TojiAPI.StackAPI.getPublic();
        const items = res?.data || [];
        if (!items.length) { el.innerHTML = '<p class="empty-state">Stack details coming soon.</p>'; return; }
        const byCategory = {};
        items.forEach((it) => {
            byCategory[it.category] = byCategory[it.category] || [];
            byCategory[it.category].push(it);
        });
        el.innerHTML = Object.entries(byCategory).map(([cat, list]) => `
            <h2 class="stack-category-title">${escapeHtml(cat)}</h2>
            <div class="stack-grid">
                ${list.map((it) => `
                    <div class="glass-card stack-item">
                        <i data-lucide="${escapeHtml(it.icon || 'box')}" aria-hidden="true"></i>
                        <div>
                            <h4>${escapeHtml(it.name)}</h4>
                            ${it.description ? `<p>${escapeHtml(it.description)}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    } catch (err) {
        el.innerHTML = '<p class="empty-state">Could not load the stack right now.</p>';
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
