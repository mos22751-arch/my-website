document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('blogGrid');
    try {
        const res = await window.TojiAPI.BlogAPI.getPublic();
        const items = res?.data || [];
        if (!items.length) { grid.innerHTML = '<p class="empty-state">No posts yet. Check back soon.</p>'; return; }
        grid.innerHTML = items.map((post) => `
            <a class="glass-card blog-card" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
                ${post.coverImage ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" loading="lazy">` : ''}
                <span class="blog-date">${formatDate(post.createdAt)}</span>
                <h3>${escapeHtml(post.title)}</h3>
                ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
                ${(post.tags || []).length ? `<div class="blog-tags">${post.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            </a>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p class="empty-state">Could not load posts right now.</p>';
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
