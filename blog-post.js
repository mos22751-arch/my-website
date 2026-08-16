document.addEventListener('DOMContentLoaded', async () => {
    const el = document.getElementById('blogPostContent');
    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { el.innerHTML = '<p class="empty-state">Post not found.</p>'; return; }
    try {
        const res = await window.TojiAPI.BlogAPI.getBySlug(slug);
        const post = res?.data;
        if (!post) { el.innerHTML = '<p class="empty-state">Post not found.</p>'; return; }
        document.title = `${post.title} | TOJI`;
        el.innerHTML = `
            ${post.coverImage ? `<img class="cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">` : ''}
            <p class="blog-date">${formatDate(post.createdAt)}</p>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="blog-post-content">${escapeHtml(post.content)}</div>
        `;
    } catch (err) {
        el.innerHTML = '<p class="empty-state">Post not found.</p>';
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
