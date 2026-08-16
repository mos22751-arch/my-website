document.addEventListener('DOMContentLoaded', async () => {
    const el = document.getElementById('processTimeline');
    try {
        const res = await window.TojiAPI.ProcessAPI.getPublic();
        const items = res?.data || [];
        if (!items.length) { el.innerHTML = '<p class="empty-state">Process steps coming soon.</p>'; return; }
        el.innerHTML = items.map((step, i) => `
            <div class="timeline-step glass-card">
                <div class="timeline-index">${String(i + 1).padStart(2, '0')}</div>
                <div class="timeline-content">
                    <h3>${escapeHtml(step.title)}</h3>
                    <p>${escapeHtml(step.description)}</p>
                    ${step.duration ? `<span class="timeline-duration">${escapeHtml(step.duration)}</span>` : ''}
                </div>
            </div>
        `).join('');
    } catch (err) {
        el.innerHTML = '<p class="empty-state">Could not load the process right now.</p>';
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}
