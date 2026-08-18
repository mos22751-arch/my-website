// ============================================================
// TOJI — Quick Pages Nav
// زرار عائم قابل للسحب في كل صفحة، بيفتح قائمة فيها لينكات لكل الصفحات
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

    const POS_KEY = 'toji_quicknav_pos'; // { right, bottom } بالبكسل من حواف الشاشة
    const DRAG_THRESHOLD = 6; // بكسل — أقل من كده يتحسب "دوسة" مش سحب

    function currentFile() {
        const p = window.location.pathname.split('/').pop();
        return p || 'index.html';
    }

    function loadPos() {
        try {
            const raw = localStorage.getItem(POS_KEY);
            if (!raw) return null;
            const pos = JSON.parse(raw);
            if (typeof pos.right === 'number' && typeof pos.bottom === 'number') return pos;
        } catch (err) { /* تجاهل */ }
        return null;
    }

    function savePos(pos) {
        try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (err) { /* تجاهل */ }
    }

    function clampPos(right, bottom, wrap) {
        const margin = 6;
        const w = wrap.offsetWidth || 60;
        const h = wrap.offsetHeight || 60;
        const maxRight = window.innerWidth - w - margin;
        const maxBottom = window.innerHeight - h - margin;
        return {
            right: Math.min(Math.max(right, margin), Math.max(margin, maxRight)),
            bottom: Math.min(Math.max(bottom, margin), Math.max(margin, maxBottom))
        };
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

        // ---- استرجاع آخر مكان اتحفظ ----
        const saved = loadPos();
        if (saved) {
            wrap.style.right = `${saved.right}px`;
            wrap.style.bottom = `${saved.bottom}px`;
        }

        function updateFlip() {
            // لو الزرار قريب من فوق الشاشة، افتح المينيو تحته مش فوقه
            const rect = wrap.getBoundingClientRect();
            wrap.classList.toggle('flip-below', rect.top < 260);
        }
        updateFlip();

        function openMenu() {
            updateFlip();
            wrap.classList.add('is-open');
            toggle.setAttribute('aria-expanded', 'true');
        }
        function closeMenu() {
            wrap.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        }
        function toggleMenu() {
            wrap.classList.contains('is-open') ? closeMenu() : openMenu();
        }

        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) closeMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });

        // ---- السحب (pointer events — بيشتغل تاتش وماوس مع بعض) ----
        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let startRight = 0;
        let startBottom = 0;

        toggle.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            dragging = true;
            moved = false;
            closeMenu();
            const rect = wrap.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startRight = window.innerWidth - rect.right;
            startBottom = window.innerHeight - rect.bottom;
            toggle.setPointerCapture(e.pointerId);
            toggle.classList.add('is-dragging');
        });

        toggle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) moved = true;
            if (!moved) return;
            const nextRight = startRight - dx;
            const nextBottom = startBottom - dy;
            const clamped = clampPos(nextRight, nextBottom, wrap);
            wrap.style.right = `${clamped.right}px`;
            wrap.style.bottom = `${clamped.bottom}px`;
        });

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            toggle.classList.remove('is-dragging');
            try { toggle.releasePointerCapture(e.pointerId); } catch (err) { /* تجاهل */ }
            if (moved) {
                const rect = wrap.getBoundingClientRect();
                savePos({
                    right: Math.round(window.innerWidth - rect.right),
                    bottom: Math.round(window.innerHeight - rect.bottom)
                });
            } else {
                toggleMenu();
            }
        }

        toggle.addEventListener('pointerup', endDrag);
        toggle.addEventListener('pointercancel', endDrag);

        // امنع سلوك السحب الافتراضي بتاع الصور/اللينكات جوه اللمس
        toggle.addEventListener('dragstart', (e) => e.preventDefault());

        window.addEventListener('resize', () => {
            const rect = wrap.getBoundingClientRect();
            const clamped = clampPos(window.innerWidth - rect.right, window.innerHeight - rect.bottom, wrap);
            wrap.style.right = `${clamped.right}px`;
            wrap.style.bottom = `${clamped.bottom}px`;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
