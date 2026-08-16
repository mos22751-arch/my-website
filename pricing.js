document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('pricingGrid');
    try {
        const res = await window.TojiAPI.PricingAPI.getPublic();
        const items = res?.data || [];
        if (!items.length) { grid.innerHTML = '<p class="empty-state">No packages yet. Message me for a custom quote.</p>'; return; }
        grid.innerHTML = items.map((p) => `
            <article class="glass-card pricing-card ${p.highlighted ? 'is-highlighted' : ''}">
                ${p.highlighted ? '<span class="pricing-badge">Most popular</span>' : ''}
                <h3>${escapeHtml(p.name)}</h3>
                <div class="pricing-price">${escapeHtml(p.price)} ${p.period ? `<span>${escapeHtml(p.period)}</span>` : ''}</div>
                ${p.description ? `<p class="pricing-desc">${escapeHtml(p.description)}</p>` : ''}
                <ul class="pricing-features">
                    ${(p.features || []).map((feat) => `<li>${escapeHtml(feat)}</li>`).join('')}
                </ul>
                <a class="action-btn action-primary" href="quote.html">${escapeHtml(p.ctaText || 'Get Started')}</a>
            </article>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p class="empty-state">Could not load packages right now.</p>';
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
