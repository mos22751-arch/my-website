/* ========================================================
   TOJI ENHANCEMENTS — JavaScript Layer  v1.0
   Loaded AFTER all base scripts. Adds features without
   touching or duplicating the existing script.js logic.
   ======================================================== */

(function () {
    'use strict';

    /* ── Utility helpers ──────────────────────────────────── */
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
    const isFinePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ======================================================
       0. VISIBILITY — وقف الانيميشن المكلفة (الـ orbs) لما
          المستخدم يبدل تاب — توفير GPU/باتري بدون ما نمسح حاجة
       ====================================================== */
    function initVisibilityPause() {
        document.addEventListener('visibilitychange', () => {
            document.body.classList.toggle('tab-hidden', document.hidden);
        });
    }

    /* ======================================================
       1. GRADIENT ORBS — Animated background depth layers
       ====================================================== */
    function initGradientOrbs() {
        if (reducedMotion.matches) return;
        [1, 2, 3].forEach((n) => {
            const orb = document.createElement('div');
            orb.className = `gradient-orb gradient-orb-${n}`;
            orb.setAttribute('aria-hidden', 'true');
            document.body.appendChild(orb);
        });
    }

    /* ======================================================
       2. SOUND SYSTEM — Toggle + Web Audio API tones
       ====================================================== */
    let soundEnabled = false;
    let audioCtx = null;

    function getAudioCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        return audioCtx;
    }

    function playTone(freq = 440, duration = 80, type = 'sine', volume = 0.06) {
        if (!soundEnabled) return;
        const ctx = getAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration / 1000 + 0.02);
    }

    const Sounds = {
        click: () => playTone(600, 70, 'sine', 0.06),
        hover: () => playTone(900, 35, 'sine', 0.025),
        success: () => {
            playTone(520, 80, 'sine', 0.07);
            setTimeout(() => playTone(660, 100, 'sine', 0.07), 85);
        },
        error: () => playTone(220, 160, 'sawtooth', 0.05),
        toggle: () => playTone(440, 90, 'triangle', 0.07),
    };

    function initSoundToggle() {
        // Button already lives in the dock — just wire it up
        const btn = document.getElementById('soundToggle');
        if (!btn) return;

        const iconMute = btn.querySelector('.icon-mute');
        const iconOn   = btn.querySelector('.icon-on');

        function updateUI() {
            if (iconMute) iconMute.style.display = soundEnabled ? 'none'  : '';
            if (iconOn)   iconOn.style.display   = soundEnabled ? ''      : 'none';
            btn.classList.toggle('sound-on', soundEnabled);
            btn.setAttribute('aria-label', soundEnabled ? 'Sound on — tap to mute' : 'Sound off — tap to enable');
        }

        btn.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            updateUI();
            if (soundEnabled) Sounds.toggle();
        });

        updateUI();

        // Click sound on all interactive elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('button, a, [role="button"]')) Sounds.click();
        }, { passive: true });

        // Hover sounds on nav / dock
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('.dock-btn, .nav-link, .accent-swatch, .preset-btn')) Sounds.hover();
        }, { passive: true });
    }

    /* ======================================================
       3. IMPROVED RIPPLE — replaces the base ripple handler
       (base handler is still active but we add a nicer one)
       ====================================================== */
    function initRipple() {
        document.addEventListener('pointerdown', (e) => {
            const host = e.target.closest('button, a, .utility-btn, .dock-btn');
            if (!host) return;

            // Position
            const rect = host.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.className = 'toji-ripple';
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;

            // Ensure host has position:relative and overflow:hidden
            if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

            host.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        }, { passive: true });
    }

    /* ======================================================
       4. MAGNETIC BUTTONS — smooth pointer-pull effect
          Only on desktop with fine pointer to avoid jank
       ====================================================== */
    function initMagneticEffect() {
        if (!isFinePointer() || reducedMotion.matches) return;

        const selector = '.action-btn, .share-profile, .theme-switch, .language-toggle, .nav-link, .dock-btn';
        $$(selector).forEach((el) => el.classList.add('magnetic-btn'));

        function resetTransform(el) {
            if (el && !el.closest('.tilt-effect')) el.style.transform = '';
        }

        let activeEl = null;
        let lastEvent = null;
        let rafId = null;

        // ✅ بنحسب ونكتب الـ transform مرة واحدة بس في كل فريم (60fps حد أقصى)
        // بدل ما نعمل getBoundingClientRect() + style write على كل حركة فأرة خام
        // (اللي ممكن توصل لمئات المرات في الثانية) — نفس التأثير البصري بالظبط، تكلفة أقل بكتير
        function applyMagnetic() {
            rafId = null;
            if (!activeEl || !lastEvent) return;
            if (activeEl.closest('.tilt-effect')) return;

            const rect = activeEl.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = lastEvent.clientX - cx;
            const dy = lastEvent.clientY - cy;
            const dist = Math.hypot(dx, dy);
            const maxDist = Math.max(rect.width, rect.height) * 0.7;

            if (dist > maxDist) {
                activeEl.style.transform = '';
                return;
            }

            const pull = (1 - dist / maxDist) * 8;
            const nx = (dx / dist || 0) * pull;
            const ny = (dy / dist || 0) * pull;
            activeEl.style.transform = `translate(${nx}px, ${ny}px)`;
        }

        // ✅ listener واحد على الصفحة كلها بدل listener منفصل على كل عنصر مغناطيسي
        document.addEventListener('mousemove', (e) => {
            const target = e.target.closest(selector);

            if (target !== activeEl) {
                resetTransform(activeEl);
                activeEl = target;
            }
            if (!activeEl) return;

            lastEvent = e;
            if (rafId === null) rafId = requestAnimationFrame(applyMagnetic);
        }, { passive: true });

        document.documentElement.addEventListener('mouseleave', () => {
            resetTransform(activeEl);
            activeEl = null;
        }, { passive: true });
    }

    /* ======================================================
       5. PARALLAX SCROLL — subtle hero depth on desktop
       ====================================================== */
    function initParallax() {
        if (isMobile() || reducedMotion.matches) return;

        const scrollRoot = $('#pageScroll');
        if (!scrollRoot) return;

        const layers = [
            { el: $('.hero-content'), speed: 0.08 },
            { el: $('.profile-panel'),speed: 0.05 },
            { el: $('.mesh-bg'),      speed: 0.04 },
        ];

        let ticking = false;
        scrollRoot.addEventListener('scroll', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const st = scrollRoot.scrollTop;
                layers.forEach(({ el, speed }) => {
                    if (!el) return;
                    el.style.transform = `translateY(${st * speed}px)`;
                });
                ticking = false;
            });
        }, { passive: true });
    }

    /* ======================================================
       6. PROFILE CARD FLOAT — gentle bob when not tilting
       ====================================================== */
    function initProfileFloat() {
        if (reducedMotion.matches) return;
        const panel = $('.profile-panel');
        if (!panel) return;

        let floating = true;
        panel.classList.add('float-animate');

        panel.addEventListener('mouseenter', () => {
            floating = false;
            panel.classList.remove('float-animate');
        });
        panel.addEventListener('mouseleave', () => {
            floating = true;
            panel.classList.add('float-animate');
        });
    }

    /* ======================================================
       7. SWIPE NAVIGATION — actually navigates between sections
       ====================================================== */
    function initSwipeNavigation() {
        if (!isMobile()) return;

        const scrollRoot = $('#pageScroll');
        if (!scrollRoot) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        scrollRoot.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        scrollRoot.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            const dt = Date.now() - touchStartTime;

            // Only horizontal swipes, fast, not while scrolling vertically
            if (dt > 350) return;
            if (Math.abs(dy) > Math.abs(dx) * 1.5) return;
            if (Math.abs(dx) < 55) return;

            const activeDock = $('.dock-btn.active');
            if (!activeDock) return;

            const allDocks = $$('.dock-btn');
            const currentIndex = allDocks.indexOf(activeDock);
            const sections = $$('.screen').map((s) => s.id);

            let nextIndex;
            if (dx < 0) {
                // Swipe left → next section
                nextIndex = Math.min(currentIndex + 1, sections.length - 1);
            } else {
                // Swipe right → previous section
                nextIndex = Math.max(currentIndex - 1, 0);
            }

            if (nextIndex === currentIndex) return;

            const targetId = sections[nextIndex];
            const target = document.getElementById(targetId);
            if (!target) return;

            scrollRoot.scrollTo({ top: target.offsetTop, behavior: 'smooth' });

            // Visual haptic
            if (navigator.vibrate) navigator.vibrate(15);

            // Update dock/nav active state
            allDocks.forEach((b, i) => b.classList.toggle('active', i === nextIndex));
            $$('.nav-link').forEach((l) => l.classList.toggle('active', l.dataset.target === targetId));
            window.syncLiquidIndicators?.();
        }, { passive: true });
    }

    /* ======================================================
       8. FORM ENHANCED VALIDATION & FEEDBACK
       ====================================================== */
    function initFormEnhancements() {
        const form = $('#quickMessageForm');
        if (!form) return;

        const inputs = $$('input, textarea', form);

        // Real-time validation on input
        inputs.forEach((input) => {
            input.addEventListener('input', () => {
                input.classList.remove('field-invalid', 'field-valid');
                if (input.value.trim().length > 0) {
                    input.classList.add('field-valid');
                }
            });

            input.addEventListener('blur', () => {
                if (input.required && input.value.trim() === '') {
                    input.classList.add('field-invalid');
                    input.classList.remove('field-valid');
                    Sounds.error();
                }
            });

            // Focus glow
            input.addEventListener('focus', () => {
                if (!reducedMotion.matches) {
                    input.style.transition = 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease';
                }
            });
        });

        // Submit: show loading state → success flash
        form.addEventListener('submit', (e) => {
            const btn = form.querySelector('[type="submit"]');
            if (btn) {
                btn.classList.add('form-loading');
                setTimeout(() => {
                    btn.classList.remove('form-loading');
                    form.classList.add('form-success');
                    Sounds.success();
                    setTimeout(() => form.classList.remove('form-success'), 600);
                }, 400);
            }
        });
    }

    /* ======================================================
       9. COUNTER ANIMATION — signal-row numbers count up
       ====================================================== */
    function initCounterAnimations() {
        if (reducedMotion.matches) return;

        const counters = $$('.signal-value[data-counter]');
        if (!counters.length) return;

        const animate = (el) => {
            const end = parseFloat(el.dataset.counter);
            const duration = 900;
            const decimals = String(end).includes('.') ? 1 : 0;
            let startTime = null;

            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                el.textContent = (eased * end).toFixed(decimals);
                if (progress < 1) requestAnimationFrame(step);
                else {
                    el.textContent = end.toFixed(decimals);
                    // Pop effect
                    el.classList.add('counter-pop');
                    setTimeout(() => el.classList.remove('counter-pop'), 300);
                }
            };
            requestAnimationFrame(step);
        };

        const scrollRoot = $('#pageScroll');
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate(entry.target);
                        obs.unobserve(entry.target);
                    }
                });
            },
            { root: scrollRoot, threshold: 0.5 }
        );

        counters.forEach((el) => obs.observe(el));
    }

    /* ======================================================
       10. PROFILE IMAGE SKELETON LOADER
       ====================================================== */
    function initImageLoader() {
        const img = $('#profilePhoto');
        if (!img) return;

        if (!img.complete) {
            img.classList.add('img-loading');
            img.parentElement?.classList.add('skeleton-shimmer');
            img.addEventListener('load', () => {
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
                img.parentElement?.classList.remove('skeleton-shimmer');
            }, { once: true });
            img.addEventListener('error', () => {
                img.parentElement?.classList.remove('skeleton-shimmer');
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
            }, { once: true });
        } else {
            img.classList.add('img-loaded');
        }
    }

    /* ======================================================
       11. HAPTIC FEEDBACK — visual + vibration on mobile
       ====================================================== */
    function initHapticFeedback() {
        if (!isMobile()) return;

        document.addEventListener('pointerdown', (e) => {
            const target = e.target.closest('button, a, .accent-swatch, .preset-btn');
            if (!target) return;

            // Vibration API
            if (navigator.vibrate) navigator.vibrate(8);

            // Visual pulse
            target.classList.add('haptic-feedback');
            setTimeout(() => target.classList.remove('haptic-feedback'), 400);
        }, { passive: true });
    }

    /* ======================================================
       12. DOCK HIDE ON SCROLL (mobile) — dock hides while
           user scrolls, reappears when they stop
       ====================================================== */
    function initDockAutoHide() {
        if (!isMobile()) return;

        const dock = $('.floating-dock-wrapper');
        if (!dock) return;

        const scrollRoot = $('#pageScroll');
        if (!scrollRoot) return;

        let lastSt = 0;
        let hideTimer = null;

        scrollRoot.addEventListener('scroll', () => {
            const st = scrollRoot.scrollTop;
            const delta = st - lastSt;

            if (Math.abs(delta) > 4) {
                dock.classList.add('dock-hidden');
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => dock.classList.remove('dock-hidden'), 800);
            }

            lastSt = st;
        }, { passive: true });
    }

    /* ======================================================
       13. BLUR ON SCROLL — hero content blurs as you scroll
       ====================================================== */
    function initScrollBlur() {
        if (reducedMotion.matches || isMobile()) return;

        const scrollRoot = $('#pageScroll');
        const heroContent = $('.hero-content');
        if (!scrollRoot || !heroContent) return;

        heroContent.classList.add('scroll-blur');
        const vh = window.innerHeight;

        scrollRoot.addEventListener('scroll', () => {
            const st = scrollRoot.scrollTop;
            const progress = Math.min(st / (vh * 0.5), 1);

            if (progress > 0.15) {
                heroContent.classList.add('blurred');
            } else {
                heroContent.classList.remove('blurred');
            }
        }, { passive: true });
    }

    /* ======================================================
       14. LIGHTBOX — gallery image zoom
       ====================================================== */
    function initLightbox() {
        let box = null;

        function createLightbox() {
            if (box) return;
            box = document.createElement('div');
            box.className = 'toji-lightbox';
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            box.setAttribute('aria-label', 'Image viewer');

            const img = document.createElement('img');
            img.alt = '';

            const close = document.createElement('button');
            close.className = 'toji-lightbox-close';
            close.type = 'button';
            close.setAttribute('aria-label', 'Close image viewer');
            close.innerHTML = '&times;';

            box.appendChild(img);
            box.appendChild(close);
            document.body.appendChild(box);

            close.addEventListener('click', closeLightbox);
            box.addEventListener('click', (e) => { if (e.target === box) closeLightbox(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
        }

        function openLightbox(src, alt) {
            createLightbox();
            const img = box.querySelector('img');
            img.src = src;
            img.alt = alt || '';
            box.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            if (!box) return;
            box.classList.remove('open');
            document.body.style.overflow = '';
        }

        // Wire up gallery items
        document.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (!item) return;
            const img = item.querySelector('img');
            if (img) openLightbox(img.src, img.alt);
        });
    }

    /* ======================================================
       15. TEXT REVEAL — animate eyebrow & title on reveal
       ====================================================== */
    function initTextReveal() {
        if (reducedMotion.matches) return;

        const scrollRoot = $('#pageScroll');
        const elements = $$('.section-heading .eyebrow, .section-heading .section-title');

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('text-reveal-anim');
                        obs.unobserve(entry.target);
                    }
                });
            },
            { root: scrollRoot, threshold: 0.2 }
        );

        elements.forEach((el) => obs.observe(el));
    }

    /* ======================================================
       16. QR FRAME — add glow pulse on mobile when canvas ready
       ====================================================== */
    function initQREnhancements() {
        const qrFrame = $('.qr-frame');
        const canvas = $('#profileQr');
        if (!qrFrame || !canvas) return;

        // Watch for QR render completion
        const mo = new MutationObserver(() => {
            if (canvas.width > 0) {
                qrFrame.style.transition = 'box-shadow 0.4s ease';
                setTimeout(() => {
                    qrFrame.style.boxShadow = '';
                }, 100);
            }
        });
        mo.observe(canvas, { attributes: true });
    }

    /* ======================================================
       17. PRESET / ACCENT TRANSITION ANIMATION
       ====================================================== */
    function initThemeTransition() {
        const style = document.createElement('style');
        style.id = 'themeTransitionStyle';
        style.textContent = `
            body.theme-transitioning,
            body.theme-transitioning *,
            body.theme-transitioning *::before,
            body.theme-transitioning *::after {
                transition-duration: 0.35s !important;
                transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1) !important;
            }
        `;
        document.head.appendChild(style);

        const swatches = $$('.accent-swatch, .preset-btn, #themeToggle');
        swatches.forEach((el) => {
            el.addEventListener('click', () => {
                document.body.classList.add('theme-transitioning');
                setTimeout(() => document.body.classList.remove('theme-transitioning'), 380);
            });
        });
    }

    /* ======================================================
       18. ENHANCED DOCK BUTTON BOUNCE
       ====================================================== */
    function initDockBounce() {
        if (reducedMotion.matches) return;

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.dock-btn');
            if (!btn) return;

            btn.style.transform = 'scale(0.85)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 180);
        });
    }

    /* ======================================================
       19. NAV LINK UNDERLINE SLIDE
       ====================================================== */
    function initNavEnhancements() {
        const navLinks = $$('.nav-link');

        navLinks.forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.forEach((l) => l.classList.remove('active'));
                link.classList.add('active');
                window.syncLiquidIndicators?.();
            });
        });
    }

    /* ======================================================
       20. PERFORMANCE — requestIdleCallback for non-critical
       ====================================================== */
    function initLazyFeatures() {
        const run = typeof requestIdleCallback === 'function'
            ? (cb) => requestIdleCallback(cb, { timeout: 2000 })
            : (cb) => setTimeout(cb, 200);

        run(() => {
            initMagneticEffect();
            initParallax();
            initScrollBlur();
            initTextReveal();
            initLightbox();
            initQREnhancements();
        });
    }

    /* ======================================================
       21. SERVICE WORKER PRE-CACHE PING
       ====================================================== */
    function initServiceWorkerEnhancements() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.ready.then((reg) => {
            // Update found — could show a "New version available" toast
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // Silently update — don't interrupt user
                        console.info('[TOJI] New version cached.');
                    }
                });
            });
        }).catch(() => {});
    }

    /* ======================================================
       22. KEYBOARD SHORTCUT HINTS
       ====================================================== */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Arrow keys already handled by base script.js
            // Add: "/" to focus search-like elements if present
            if (e.key === '/' && !e.target.matches('input, textarea, select')) {
                const firstInput = $('#messageName');
                if (firstInput) {
                    e.preventDefault();
                    firstInput.focus();
                    firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    /* ======================================================
       23. TOUCH FEEDBACK FIX — replace the base opacity hack
       ====================================================== */
    function initTouchFeedback() {
        // Remove the opacity-toggle from base script (it conflicts with ripple)
        // We handle it via CSS :active states instead
        // The base script already added listeners; we add haptic enhancement
        document.addEventListener('touchstart', () => {}, { passive: true });
    }

    /* ======================================================
       INIT — run when DOM is ready
       ====================================================== */
    function init() {
        initVisibilityPause();
        initGradientOrbs();
        initSoundToggle();
        initRipple();
        initProfileFloat();
        initSwipeNavigation();
        initFormEnhancements();
        initCounterAnimations();
        initImageLoader();
        initHapticFeedback();
        initDockAutoHide();
        initDockBounce();
        initNavEnhancements();
        initThemeTransition();
        initTouchFeedback();
        initServiceWorkerEnhancements();
        initKeyboardShortcuts();

        // Non-critical features after idle
        initLazyFeatures();
    }

    /* ── Attach signal-value counters to existing DOM numbers ── */
    function attachCounterData() {
        // The signal row has text values (UI, JS, QR) — these are labels not numbers
        // So we instead animate a subtle scale pop to show life
        const signalValues = $$('.signal-value');
        signalValues.forEach((el) => {
            const text = el.textContent.trim();
            const num = parseFloat(text);
            if (!isNaN(num) && num > 1) {
                el.setAttribute('data-counter', num);
                el.textContent = '0';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            attachCounterData();
            init();
        });
    } else {
        attachCounterData();
        // Slight delay to ensure base script.js has fully initialised
        setTimeout(init, 120);
    }

    /* ======================================================
       EXPOSE helpers for debugging
       ====================================================== */
    window.TOJI_ENH = { Sounds, playTone };

})();

