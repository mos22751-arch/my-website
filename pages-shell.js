// ============================================================
// TOJI — Shared Page Shell
// ثيم + نافبار + فوتر لأي صفحة منفصلة (pricing, blog, ...)
// نسخة خفيفة من اللوجيك الموجود في script.js — بدون الأنيميشنز التقيلة
// ============================================================
(function () {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');

    const presetTokens = {
        neon: () => ({ primary: '#36d6ff', accent: '#ff7a3d', mint: '#6df6b2', glow: 'rgba(57, 208, 255, 0.28)' }),
        midnight: () => ({ primary: '#8bd3ff', accent: '#c8a7ff', mint: '#7ef0c1', glow: 'rgba(139, 211, 255, 0.22)' }),
        emerald: () => ({ primary: '#5ee2a0', accent: '#f7c948', mint: '#39d0ff', glow: 'rgba(94, 226, 160, 0.24)' }),
        sunset: () => ({ primary: '#ff9f43', accent: '#ff5f7e', mint: '#39d0ff', glow: 'rgba(255, 122, 61, 0.26)' }),
        aurora: () => ({ primary: '#7dd3fc', accent: '#d8b4fe', mint: '#86efac', glow: 'rgba(125, 211, 252, 0.23)' }),
        royal: () => ({ primary: '#f6c95f', accent: '#a78bfa', mint: '#5ee2a0', glow: 'rgba(246, 201, 95, 0.22)' }),
        graphite: () => ({ primary: '#e5e7eb', accent: '#39d0ff', mint: '#ff7a3d', glow: 'rgba(229, 231, 235, 0.16)' })
    };
    const presetTokensLight = {
        neon: () => ({ primary: '#0077b6', accent: '#d85f2a', mint: '#07845d', glow: 'rgba(0, 119, 182, 0.18)' }),
        midnight: () => ({ primary: '#0369a1', accent: '#7c3aed', mint: '#047857', glow: 'rgba(3, 105, 161, 0.16)' }),
        emerald: () => ({ primary: '#047857', accent: '#b45309', mint: '#0369a1', glow: 'rgba(4, 120, 87, 0.16)' }),
        sunset: () => ({ primary: '#c2410c', accent: '#be123c', mint: '#0369a1', glow: 'rgba(194, 65, 12, 0.16)' }),
        aurora: () => ({ primary: '#0e7490', accent: '#7e22ce', mint: '#047857', glow: 'rgba(14, 116, 144, 0.16)' }),
        royal: () => ({ primary: '#a16207', accent: '#6d28d9', mint: '#047857', glow: 'rgba(161, 98, 7, 0.16)' }),
        graphite: () => ({ primary: '#374151', accent: '#0e7490', mint: '#c2410c', glow: 'rgba(55, 65, 81, 0.14)' })
    };
    const accentTokens = {
        orange: { primary: '#ff7a3d', accent: '#39d0ff', glow: 'rgba(255, 122, 61, 0.28)' },
        green: { primary: '#5ee2a0', accent: '#ff7a3d', glow: 'rgba(94, 226, 160, 0.28)' },
        violet: { primary: '#a78bfa', accent: '#39d0ff', glow: 'rgba(167, 139, 250, 0.28)' },
        gold: { primary: '#f6c95f', accent: '#39d0ff', glow: 'rgba(246, 201, 95, 0.26)' }
    };
    const accentTokensLight = {
        orange: { primary: '#c2410c', accent: '#0369a1', glow: 'rgba(194, 65, 12, 0.16)' },
        green: { primary: '#047857', accent: '#c2410c', glow: 'rgba(4, 120, 87, 0.16)' },
        violet: { primary: '#6d28d9', accent: '#0369a1', glow: 'rgba(109, 40, 217, 0.16)' },
        gold: { primary: '#a16207', accent: '#0369a1', glow: 'rgba(161, 98, 7, 0.14)' }
    };
    const presets = ['neon', 'midnight', 'emerald', 'sunset', 'aurora', 'royal', 'graphite'];
    const accents = ['cyan', 'orange', 'green', 'violet', 'gold'];

    function applyColorTokens(preset, accent) {
        const isLight = body.classList.contains('light-theme');
        const p = (isLight ? presetTokensLight : presetTokens)[preset] || presetTokens.graphite;
        const a = (isLight ? accentTokensLight : accentTokens)[accent];
        const base = p();
        body.style.setProperty('--primary', base.primary);
        body.style.setProperty('--accent', base.accent);
        body.style.setProperty('--mint', base.mint);
        body.style.setProperty('--glow-color', base.glow);
        if (a) {
            body.style.setProperty('--primary', a.primary);
            body.style.setProperty('--accent', a.accent);
            body.style.setProperty('--glow-color', a.glow);
        }
    }

    function setTheme(theme) {
        const isLight = theme === 'light';
        body.classList.toggle('light-theme', isLight);
        body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem('toji_theme', theme);
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f7f5ef' : '#050506');
        applyColorTokens(
            localStorage.getItem('toji_theme_preset') || 'graphite',
            localStorage.getItem('toji_accent') || 'cyan'
        );
    }

    function applyPreset() {
        const preset = localStorage.getItem('toji_theme_preset') || 'graphite';
        presets.forEach((name) => body.classList.toggle(`preset-${name}`, name === preset && name !== 'neon'));
        const accent = localStorage.getItem('toji_accent') || 'cyan';
        accents.forEach((name) => body.classList.toggle(`accent-${name}`, name === accent && name !== 'cyan'));
    }

    applyPreset();
    setTheme(localStorage.getItem('toji_theme') === 'light' ? 'light' : 'dark');

    themeToggle?.addEventListener('click', () => {
        setTheme(body.classList.contains('dark-theme') ? 'light' : 'dark');
    });

    // إزالة كلاس is-loading عشان الصفحة تتشاف (مستخدمة نفس CSS بتاع index)
    requestAnimationFrame(() => body.classList.remove('is-loading'));

    // تشغيل أيقونات lucide — هنا مش inline script عشان الـ CSP (script-src 'self' بس، من غير unsafe-inline)
    if (window.lucide) window.lucide.createIcons();
})();
