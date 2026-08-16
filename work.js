document.addEventListener('DOMContentLoaded', async () => {
    const el = document.getElementById('workDetailContent');
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { el.innerHTML = '<p class="empty-state">Project not found.</p>'; return; }
    try {
        const res = await window.TojiAPI.ProjectsAPI.getOne(id);
        const project = res?.data;
        if (!project) { el.innerHTML = '<p class="empty-state">Project not found.</p>'; return; }
        const title = project.title?.en || project.title?.ar || '';
        const copy = project.copy?.en || project.copy?.ar || '';
        document.title = `${title} | TOJI`;
        el.innerHTML = `
            <span class="work-detail-banner">${escapeHtml(project.banner || '')}</span>
            <h1>${escapeHtml(title)}</h1>
            ${project.imageUrl ? `<img class="work-detail-image" src="${escapeHtml(project.imageUrl)}" alt="${escapeHtml(title)}">` : ''}
            <div class="work-detail-tags">${(project.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
            <div class="work-detail-body-text">${escapeHtml(copy)}</div>
            ${project.liveUrl ? `<p style="margin-top:24px;"><a class="action-btn action-primary" href="${escapeHtml(project.liveUrl)}" target="_blank" rel="noreferrer">View live</a></p>` : ''}
        `;
    } catch (err) {
        el.innerHTML = '<p class="empty-state">Project not found.</p>';
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
