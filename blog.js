document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('blogGrid');
    try {
        const res = await window.TojiAPI.BlogAPI.getPublic();
        const items = res?.data || [];
        if (!items.length) { grid.innerHTML = '<p class="empty-state">لسه مفيش بوستات، تابعنا قريب.</p>'; return; }
        grid.innerHTML = items.map((post) => `
            <a class="glass-card blog-card ${post.coverImage ? 'has-cover' : ''}" href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
                ${post.coverImage ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" loading="lazy">` : ''}
                <span class="blog-date">${formatDate(post.createdAt)}</span>
                <h3>${escapeHtml(post.title)}</h3>
                ${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}
                ${(post.tags || []).length ? `<div class="blog-tags">${post.tags.map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
                <span class="blog-card-read">اقرأ المزيد ←</span>
            </a>
        `).join('');
    } catch (err) {
        grid.innerHTML = '<p class="empty-state">تعذر تحميل البوستات دلوقتي.</p>';
    }
});

function formatDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
