document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('bookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('bStatus');
        const name = document.getElementById('bName').value.trim();
        const contact = document.getElementById('bContact').value.trim();
        const preferredDate = document.getElementById('bDate').value.trim();
        const preferredTime = document.getElementById('bTime').value.trim();
        const message = document.getElementById('bMessage').value.trim();
        if (!name || !contact) return;
        status.textContent = 'Sending…';
        status.className = 'form-status';
        try {
            await window.TojiAPI.BookingAPI.send({ name, contact, preferredDate, preferredTime, message });
            status.textContent = "Request sent! I'll confirm the time soon.";
            status.className = 'form-status is-success';
            e.target.reset();
        } catch (err) {
            status.textContent = err.message || 'Could not send. Try again.';
            status.className = 'form-status is-error';
        }
    });
});
