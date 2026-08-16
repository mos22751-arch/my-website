document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('quoteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('qStatus');
        const name = document.getElementById('qName').value.trim();
        const contact = document.getElementById('qContact').value.trim();
        const projectType = document.getElementById('qType').value;
        const budget = document.getElementById('qBudget').value.trim();
        const description = document.getElementById('qDesc').value.trim();
        if (!name || !contact) return;
        status.textContent = 'Sending…';
        status.className = 'form-status';
        try {
            await window.TojiAPI.QuoteAPI.send({ name, contact, projectType, budget, description });
            status.textContent = "Got it! I'll get back to you soon.";
            status.className = 'form-status is-success';
            e.target.reset();
        } catch (err) {
            status.textContent = err.message || 'Could not send. Try again.';
            status.className = 'form-status is-error';
        }
    });
});
