// ============================================================
// TOJI — Quick Pages Nav
// زرار عائم في كل صفحة، بيفتح قائمة فيها لينكات لكل الصفحات
// ============================================================
(function () {
    const PAGES = [
        { href: 'pricing.html', icon: '💳', label: 'Pricing' },
        { href: 'process.html', icon: '🧭', label: 'Process' },
        { href: 'blog.html', icon: '📝', label: 'Blog' },
        { href: 'changelog.html', icon: '🗓️', label: 'Changelog' },
        { href: 'stack.html', icon: '🧱', label: 'Stack' },
        { href: 'guestbook.html', icon: '📖', label: 'Guestbook' },
        { href: 'quote.html', icon: '💬', label: 'Get a Quote' },
        { href: 'book.html', icon: '📅', label: 'Book a Call' }
    ];

    function currentFile() {
        const p = window.location.pathname.split('/').pop();
        return p || 'index.html';
    }

    function build() {
        const here = currentFile();

        const wrap = document.createElement('div');
        wrap.className = 'quick-nav';
        wrap.innerHTML = `
            <button class="quick-nav-toggle" type="button" aria-label="Quick pages menu" aria-expanded="false">
                <span class="quick-nav-icon-open">✦</span>
                <span class="quick-nav-icon-close">✕</span>
            </button>
            <div class="quick-nav-panel" role="menu">
                <a class="quick-nav-item ${here === 'index.html' || here === '' ? 'is-current' : ''}" href="index.html">🏠 <span>Home</span></a>
                ${PAGES.map((p) => `<a class="quick-nav-item ${here === p.href ? 'is-current' : ''}" href="${p.href}">${p.icon} <span>${p.label}</span></a>`).join('')}
            </div>
        `;
        document.body.appendChild(wrap);

        const toggle = wrap.querySelector('.quick-nav-toggle');
        const panel = wrap.querySelector('.quick-nav-panel');

        toggle.addEventListener('click', () => {
            const isOpen = wrap.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) {
                wrap.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                wrap.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
