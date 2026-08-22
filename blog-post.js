document.addEventListener('DOMContentLoaded', async () => {
    const el = document.getElementById('blogPostContent');
    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { el.innerHTML = '<p class="empty-state">المقال مش موجود.</p>'; return; }
    try {
        const res = await window.TojiAPI.BlogAPI.getBySlug(slug);
        const post = res?.data;
        if (!post) { el.innerHTML = '<p class="empty-state">المقال مش موجود.</p>'; return; }
        document.title = `${post.title} | TOJI`;

        const paragraphsHtml = String(post.content || '')
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
            .join('');

        const tagsHtml = (post.tags || []).length
            ? `<div class="blog-tags blog-post-tags">${post.tags.map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}</div>`
            : '';

        el.innerHTML = `
            ${post.coverImage ? `<img class="cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">` : ''}
            <p class="blog-date">${formatDate(post.createdAt)}</p>
            <h1>${escapeHtml(post.title)}</h1>
            ${tagsHtml}
            <div class="blog-post-content">${paragraphsHtml}</div>
        `;
    } catch (err) {
        el.innerHTML = '<p class="empty-state">المقال مش موجود.</p>';
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
