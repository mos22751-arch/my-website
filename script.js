document.addEventListener('DOMContentLoaded', () => {
    function deepMerge(base, override) {
        if (Array.isArray(base) || Array.isArray(override)) {
            return Array.isArray(override) ? [...override] : Array.isArray(base) ? [...base] : override;
        }
        if (!base || typeof base !== 'object') return override ?? base;
        if (!override || typeof override !== 'object') return { ...base };

        const result = { ...base };
        Object.keys(override).forEach((key) => {
            result[key] = key in base ? deepMerge(base[key], override[key]) : override[key];
        });
        return result;
    }

    const body = document.body;
    const scrollRoot = document.getElementById('pageScroll');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const progress = document.querySelector('.scroll-progress');
    const themeToggle = document.getElementById('themeToggle');
    const languageToggle = document.getElementById('languageToggle');
    const typeTarget = document.getElementById('typewriter');
    let dockBtns = document.querySelectorAll('.dock-btn');
    let navLinks = document.querySelectorAll('.nav-link');
    let sections = document.querySelectorAll('.screen');
    let revealElements = document.querySelectorAll('.reveal-up');
    let tiltElements = document.querySelectorAll('.tilt-effect');
    let sectionObserver;
    let revealObserver;
    const toast = document.getElementById('toast');
    const shareProfile = document.getElementById('shareProfile');
    const qrCanvas = document.getElementById('profileQr');
    const qrFallback = document.getElementById('qrFallback');
    const downloadContact = document.getElementById('downloadContact');
    const downloadQr = document.getElementById('downloadQr');
    const copyProfileLink = document.getElementById('copyProfileLink');
    const generateShareImage = document.getElementById('generateShareImage');
    const qrModeBtns = document.querySelectorAll('.qr-mode');
    const quickMessageForm = document.getElementById('quickMessageForm');
    const messageName = document.getElementById('messageName');
    const messageType = document.getElementById('messageType');
    const messageText = document.getElementById('messageText');
    const accentSwatches = document.querySelectorAll('.accent-swatch');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const randomVibe = document.getElementById('randomVibe');
    const liveStatusText = document.getElementById('liveStatusText');
    const brandName = document.getElementById('brandName');
    const profileCardName = document.getElementById('profileCardName');
    const profilePhoto = document.getElementById('profilePhoto');
    const loaderBrand = document.getElementById('loaderBrand');
    const installApp = document.getElementById('installApp');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileViewport = window.matchMedia('(max-width: 720px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const config = window.TOJI_CONFIG || {};
    const ownerCreditText = 'Website created by:';
    const ownerCreditHandle = '@mouhamedmostafffa';
    const ownerCreditUrl = 'https://www.instagram.com/mouhamedmostafffa';
    const urlParams = new URLSearchParams(window.location.search);
    const previewMode = urlParams.get('preview') === '1';
    let savedContent = {};

    if (previewMode) {
        // وضع المعاينة: يستخدم تعديلات localStorage الخاصة بالأدمن
        try {
            savedContent = JSON.parse(localStorage.getItem('toji_content_override') || '{}');
        } catch (error) {
            savedContent = {};
        }
    } else {
        // الزوار العاديون: يستخدمون الـ config المباشر من السيرفر
        // (المخزّن في localStorage من آخر جلب ناجح من الـ backend)
        try {
            savedContent = JSON.parse(localStorage.getItem('toji_live_config') || '{}');
        } catch (error) {
            savedContent = {};
        }

        // جيب أحدث config من الـ backend في الخلفية وحدّث الـ cache
        // التغييرات ستظهر عند أقرب تحميل للصفحة
        if (window.TojiAPI?.ConfigAPI) {
            window.TojiAPI.ConfigAPI.get()
                .then((response) => {
                    if (response?.data) {
                        const newConfig  = JSON.stringify(response.data);
                        const oldCache   = localStorage.getItem('toji_live_config');
                        if (newConfig !== oldCache) {
                            localStorage.setItem('toji_live_config', newConfig);
                            // لو مفيش cache قديم (أول زيارة) → reload لعرض المحتوى الحي فورًا
                            if (!oldCache) window.location.reload();
                        }
                    }
                })
                .catch(() => {
                    // السيرفر مش متاح → يفضل المحتوى الاستاتيك من content.js
                });
        }
    }
    const contentOverrides = deepMerge(window.TOJI_CONTENT || {}, savedContent);
    const profileConfig = deepMerge(config, contentOverrides.profile || {});
    const profilePlaceholderImage = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22320%22 height%3D%22320%22 viewBox%3D%220 0 320 320%22%3E%3Crect width%3D%22320%22 height%3D%22320%22 rx%3D%22160%22 fill%3D%22%23101722%22%2F%3E%3Ccircle cx%3D%22160%22 cy%3D%22125%22 r%3D%2252%22 fill%3D%22%236ec6ff%22 opacity%3D%22.55%22%2F%3E%3Cpath d%3D%22M70 276c16-55 52-85 90-85s74 30 90 85%22 fill%3D%22%236ec6ff%22 opacity%3D%22.38%22%2F%3E%3C%2Fsvg%3E';
    const sectionConfig = {
        about: true,
        work: true,
        services: false,
        pricing: false,
        testimonials: false,
        gallery: false,
        faq: false,
        connect: true,
        form: true,
        themeControls: true,
        ...(contentOverrides.sections || {})
    };
    const designConfig = contentOverrides.design || {};
    const analyticsConfig = contentOverrides.analytics || {};
    const socials = {
        instagram: '',
        tiktok: '',
        snapchat: '',
        threads: '',
        ...(profileConfig.socials || {})
    };
    const profilePhone = profileConfig.phone || '201102550730';
    const profileName = profileConfig.name || 'Mohamed Mostafa';
    const profileNickname = profileConfig.nickname || 'TOJI';
    const profileImage = profileConfig.image || profilePlaceholderImage;
    const profileLoaderMark = profileConfig.loaderMark || profileNickname;

    function ensureOwnerCredit() {
        let credit = document.querySelector('[data-owner-credit]');
        if (!credit) {
            credit = document.createElement('footer');
        }

        credit.className = 'owner-credit';
        credit.setAttribute('data-owner-credit', '');
        credit.textContent = '';

        const label = document.createElement('span');
        label.textContent = ownerCreditText;

        const link = document.createElement('a');
        link.href = ownerCreditUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ownerCreditHandle;

        credit.append(label, link);

        const creditParent = scrollRoot || document.querySelector('main') || body;
        if (credit.parentNode !== creditParent) {
            credit.remove();
            creditParent.appendChild(credit);
        } else if (creditParent.lastElementChild !== credit) {
            creditParent.appendChild(credit);
        }
    }

    ensureOwnerCredit();
    const defaultTranslations = {
        en: {
            meta: {
                title: 'TOJI | Mohamed Mostafa',
                description: 'Mohamed Mostafa, TOJI. Personal portfolio, links, QR contact, web page builds, and clean front-end details.'
            },
            lang: {
                nextLabel: 'عربي',
                switchLabel: 'Switch to Arabic'
            },
            nav: {
                home: 'Home',
                about: 'About',
                work: 'Work',
                links: 'Links'
            },
            hero: {
                eyebrow: 'Mohamed Mostafa / TOJI',
                title: 'I make simple pages that look good and feel easy.',
                working: 'Working on ',
                copy: 'I care about clean layouts, quick loading, and small details that make a profile feel like mine.',
                status: 'Available for custom pages',
                openLinks: 'Open Links'
            },
            typewriter: ['my profile', 'simple pages', 'mobile links', 'better details'],
            signals: {
                valueUi: 'UI',
                valueJs: 'JS',
                valueGym: 'Gym',
                ui: 'Clean screens',
                js: 'Small details',
                gym: 'Routine'
            },
            profile: {
                live: 'Profile is live',
                caption: 'Code, training, and better details.',
                mobile: 'Mobile-first',
                fast: 'Fast',
                personal: 'Personal'
            },
            about: {
                title: 'A few things I care about when I build.',
                card1: {
                    title: 'Good first impression',
                    copy: 'I like pages that say who you are fast, without making people search for the important stuff.'
                },
                card2: {
                    title: 'Clean build',
                    copy: 'Simple HTML, CSS, and JavaScript that stay easy to edit later.'
                },
                card3: {
                    title: 'Phone first',
                    copy: 'Most people open links from their phone, so the mobile view has to feel right.'
                },
                card4: {
                    title: 'Same routine',
                    copy: 'Training taught me that small upgrades add up when you keep showing up.'
                }
            },
            work: {
                title: 'Pages I can build or improve.',
                banner1: 'TOJI',
                banner2: 'CTA',
                banner3: 'QR',
                card1: {
                    title: 'Personal portfolio',
                    copy: 'A clean page for your name, links, work, and the first impression you want people to get.'
                },
                card2: {
                    title: 'Business landing page',
                    copy: 'A focused page for a service, offer, or shop, with clear buttons and no extra noise.'
                },
                card3: {
                    title: 'Creator link hub',
                    copy: 'One place for social accounts, contact, QR code, and share buttons that actually help.'
                }
            },
            tags: {
                profile: 'Profile',
                links: 'Links',
                mobile: 'Mobile',
                share: 'Share'
            },
            connect: {
                eyebrow: 'Connect',
                title: 'My links are here.',
                copyNumber: 'Copy Number',
                scanTitle: 'Scan this profile',
                scanCopy: 'Open the same page on another phone, or save my contact card for later.',
                saveContact: 'Save Contact',
                downloadQr: 'Download QR',
                copyLink: 'Copy Link',
                shareImage: 'Share Image',
                mediaKit: 'Media Kit',
                installApp: 'Install App',
                shareProfile: 'Share Profile'
            },
            qr: {
                profile: 'Profile'
            },
            form: {
                eyebrow: 'Quick Message',
                title: 'Send a WhatsApp brief.',
                name: 'Name',
                type: 'Page type',
                message: 'Message',
                namePlaceholder: 'Your name',
                messagePlaceholder: 'Tell me what you want to build',
                personal: 'Personal profile',
                business: 'Business page',
                linkHub: 'Link hub',
                send: 'Open WhatsApp'
            },
            accent: {
                label: 'Accent'
            },
            preset: {
                label: 'Theme',
                neon: 'Neon',
                midnight: 'Midnight',
                emerald: 'Emerald',
                sunset: 'Sunset',
                aurora: 'Aurora',
                royal: 'Royal',
                graphite: 'Graphite',
                shuffle: 'Shuffle'
            },
            aria: {
                scrollAbout: 'Scroll to about section',
                contactCard: 'Profile QR and contact actions',
                quickNav: 'Quick navigation',
                accentColors: 'Accent colors',
                themePresets: 'Theme presets'
            },
            share: {
                whatsappMessage: 'Hi, I saw your profile and wanted to ask about a page.',
                profileText: 'TOJI profile and links.',
                briefIntro: 'Hi, I want to build a page.'
            },
            toast: {
                numberCopied: 'Number copied',
                copyFailed: 'Copy failed',
                copyManual: 'Copy manually:',
                contactDownloaded: 'Contact card downloaded',
                qrLoading: 'QR is still loading',
                qrDownloadFailed: 'QR download failed',
                qrDownloaded: 'QR downloaded',
                shared: 'Shared',
                profileCopied: 'Profile link copied',
                shareFailed: 'Share failed',
                accentSaved: 'Accent saved',
                presetSaved: 'Theme saved',
                shareImageReady: 'Share image downloaded'
            },
            theme: {
                toLight: 'Switch to light theme',
                toDark: 'Switch to dark theme'
            }
        },
        ar: {
            meta: {
                title: 'TOJI | Mohamed Mostafa',
                description: 'قالب بروفايل شخصي وروابط وصفحات ويب صغيرة.'
            },
            lang: {
                nextLabel: 'EN',
                switchLabel: 'Switch to English'
            },
            nav: {
                home: 'الرئيسية',
                about: 'عني',
                work: 'شغلي',
                links: 'الروابط'
            },
            hero: {
                eyebrow: 'Mohamed Mostafa / TOJI',
                title: 'بعمل صفحات بسيطة شكلها حلو وسهلة الاستخدام.',
                working: 'بشتغل على ',
                copy: 'بهتم بالتصميم النضيف، التحميل السريع، والتفاصيل الصغيرة اللي تخلي البروفايل شبه صاحبه.',
                status: 'متاح لعمل صفحات مخصصة',
                openLinks: 'افتح الروابط'
            },
            typewriter: ['بروفايلي', 'صفحات بسيطة', 'روابط موبايل', 'تفاصيل أحسن'],
            signals: {
                valueUi: 'واجهة',
                valueJs: 'جافاسكربت',
                valueGym: 'جيم',
                ui: 'شاشات نضيفة',
                js: 'تفاصيل صغيرة',
                gym: 'روتين'
            },
            profile: {
                live: 'البروفايل شغال',
                caption: 'كود، تمرين، وتفاصيل أحسن.',
                mobile: 'مناسب للموبايل',
                fast: 'سريع',
                personal: 'شخصي'
            },
            about: {
                title: 'شوية حاجات بهتم بيها وأنا ببني.',
                card1: {
                    title: 'انطباع أول قوي',
                    copy: 'بحب الصفحات اللي تقول أنت مين بسرعة من غير ما الناس تدور على المهم.'
                },
                card2: {
                    title: 'بناء نضيف',
                    copy: 'HTML وCSS وJavaScript بشكل بسيط وسهل يتعدل بعدين.'
                },
                card3: {
                    title: 'الموبايل الأول',
                    copy: 'معظم الناس بتفتح الروابط من الموبايل، فشكل الموبايل لازم يبقى مظبوط.'
                },
                card4: {
                    title: 'نفس الروتين',
                    copy: 'التمرين علمني إن التحسينات الصغيرة بتفرق لما تفضل مكمل.'
                }
            },
            work: {
                title: 'صفحات أقدر أبنيها أو أطورها.',
                banner1: 'TOJI',
                banner2: 'CTA',
                banner3: 'QR',
                card1: {
                    title: 'بورتفوليو شخصي',
                    copy: 'صفحة نضيفة لاسمك وروابطك وشغلك والانطباع اللي عايز توصله.'
                },
                card2: {
                    title: 'صفحة خدمة أو بيزنس',
                    copy: 'صفحة مركزة لخدمة أو عرض أو شوب، بأزرار واضحة ومن غير زحمة.'
                },
                card3: {
                    title: 'تجميعة روابط لصانع محتوى',
                    copy: 'مكان واحد للسوشيال، التواصل، QR، وأزرار مشاركة مفيدة فعلًا.'
                }
            },
            tags: {
                profile: 'بروفايل',
                links: 'روابط',
                mobile: 'موبايل',
                share: 'مشاركة'
            },
            connect: {
                eyebrow: 'تواصل',
                title: 'روابطي هنا.',
                copyNumber: 'نسخ الرقم',
                scanTitle: 'امسح البروفايل',
                scanCopy: 'افتح نفس الصفحة من موبايل تاني، أو احفظ جهة الاتصال لوقت لاحق.',
                saveContact: 'حفظ جهة الاتصال',
                downloadQr: 'تحميل QR',
                copyLink: 'نسخ اللينك',
                shareImage: 'صورة مشاركة',
                mediaKit: 'ميديا كيت',
                installApp: 'تثبيت الموقع',
                shareProfile: 'مشاركة البروفايل'
            },
            qr: {
                profile: 'البروفايل'
            },
            form: {
                eyebrow: 'رسالة سريعة',
                title: 'ابعت brief على واتساب.',
                name: 'الاسم',
                type: 'نوع الصفحة',
                message: 'الرسالة',
                namePlaceholder: 'اسمك',
                messagePlaceholder: 'اكتب عايز تبني إيه',
                personal: 'بروفايل شخصي',
                business: 'صفحة بيزنس',
                linkHub: 'تجميعة روابط',
                send: 'افتح واتساب'
            },
            accent: {
                label: 'اللون'
            },
            preset: {
                label: 'الثيم',
                neon: 'نيون',
                midnight: 'ليلي',
                emerald: 'زمرد',
                sunset: 'غروب',
                aurora: 'أورورا',
                royal: 'ملكي',
                graphite: 'جرافيت',
                shuffle: 'بدل الستايل'
            },
            aria: {
                scrollAbout: 'انتقل إلى قسم عني',
                contactCard: 'QR البروفايل وأزرار التواصل',
                quickNav: 'تنقل سريع',
                accentColors: 'ألوان الموقع',
                themePresets: 'ثيمات الموقع'
            },
            share: {
                whatsappMessage: 'أهلًا، شوفت البروفايل وكنت عايز أسأل عن صفحة.',
                profileText: 'بروفايل وروابط TOJI.',
                briefIntro: 'أهلًا، عايز أعمل صفحة.'
            },
            toast: {
                numberCopied: 'اتنسخ الرقم',
                copyFailed: 'النسخ فشل',
                copyManual: 'انسخ يدويًا:',
                contactDownloaded: 'تم تحميل جهة الاتصال',
                qrLoading: 'الـ QR لسه بيتحمل',
                qrDownloadFailed: 'تحميل الـ QR فشل',
                qrDownloaded: 'تم تحميل الـ QR',
                shared: 'تمت المشاركة',
                profileCopied: 'اتنسخ لينك البروفايل',
                shareFailed: 'المشاركة فشلت',
                accentSaved: 'اتحفظ اللون',
                presetSaved: 'اتحفظ الثيم',
                shareImageReady: 'تم تحميل صورة المشاركة'
            },
            theme: {
                toLight: 'تبديل للوضع الفاتح',
                toDark: 'تبديل للوضع الداكن'
            }
        }
    };
    const translations = deepMerge(defaultTranslations, contentOverrides.translations || {});
    const defaultLang = contentOverrides.site?.defaultLang === 'ar' ? 'ar' : 'en';
    let currentLang = localStorage.getItem('toji_lang') || defaultLang;
    if (!['en', 'ar'].includes(currentLang)) currentLang = defaultLang;
    let currentQrMode = localStorage.getItem('toji_qr_mode') || 'profile';
    if (!['profile', 'whatsapp', 'instagram'].includes(currentQrMode)) currentQrMode = 'profile';

    if (window.lucide) {
        window.lucide.createIcons();
    }

    function t(path) {
        return path.split('.').reduce((value, key) => value?.[key], translations[currentLang]) ?? path;
    }

    function localized(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value[currentLang] || value.en || value.ar || '';
        }
        return value ?? '';
    }

    function refreshDomCollections() {
        dockBtns = document.querySelectorAll('.dock-btn');
        navLinks = document.querySelectorAll('.nav-link');
        sections = document.querySelectorAll('.screen:not([hidden])');
        revealElements = document.querySelectorAll('.reveal-up');
        tiltElements = document.querySelectorAll('.tilt-effect');
    }

    function appendUtm(url, medium = 'link') {
        const utm = analyticsConfig.utm || {};
        if (!utm.enabled || !url || url.startsWith('#') || url.startsWith('tel:') || url.startsWith('mailto:')) return url;
        try {
            const next = new URL(url, window.location.href);
            next.searchParams.set('utm_source', utm.source || 'website');
            next.searchParams.set('utm_medium', utm.medium || medium);
            next.searchParams.set('utm_campaign', utm.campaign || 'personal-site');
            return next.toString();
        } catch (error) {
            return url;
        }
    }

    function iconName(name) {
        const map = {
            facebook: 'facebook',
            youtube: 'youtube',
            x: 'twitter',
            twitter: 'twitter',
            linkedin: 'linkedin',
            website: 'globe',
            tiktok: 'video',
            threads: 'at-sign'
        };
        return map[name] || name || 'link';
    }

    function iconMarkup(name, className = '') {
        return `<i data-lucide="${iconName(name)}" class="${className}" aria-hidden="true"></i>`;
    }

    function setElementVisible(selector, visible) {
        document.querySelectorAll(selector).forEach((node) => {
            node.hidden = !visible;
        });
    }

    function renderNavigation() {
        const nav = document.querySelector('.nav-links');
        const dock = document.querySelector('.floating-dock');
        const items = [
            { id: 'home', label: t('nav.home'), icon: 'home', enabled: true },
            { id: 'expertise', label: t('nav.about'), icon: 'user-round', enabled: sectionConfig.about },
            { id: 'work', label: t('nav.work'), icon: 'briefcase-business', enabled: sectionConfig.work },
            { id: 'services', label: localized(contentOverrides.marketing?.services?.eyebrow) || 'Services', icon: 'sparkles', enabled: sectionConfig.services },
            { id: 'pricing', label: localized(contentOverrides.marketing?.pricing?.eyebrow) || 'Pricing', icon: 'badge-dollar-sign', enabled: sectionConfig.pricing },
            { id: 'testimonials', label: localized(contentOverrides.marketing?.testimonials?.eyebrow) || 'Reviews', icon: 'quote', enabled: sectionConfig.testimonials },
            { id: 'gallery', label: localized(contentOverrides.marketing?.gallery?.eyebrow) || 'Gallery', icon: 'images', enabled: sectionConfig.gallery },
            { id: 'faq', label: localized(contentOverrides.marketing?.faq?.eyebrow) || 'FAQ', icon: 'circle-help', enabled: sectionConfig.faq },
            { id: 'connect', label: t('nav.links'), icon: 'link-2', enabled: sectionConfig.connect }
        ].filter((item) => item.enabled);

        if (nav) {
            nav.innerHTML = items.map((item, index) => `<a class="nav-link ${index === 0 ? 'active' : ''}" href="#${item.id}" data-target="${item.id}">${item.label}</a>`).join('');
        }
        if (dock) {
            dock.innerHTML = items.map((item, index) => `
                <button class="dock-btn ${index === 0 ? 'active' : ''}" type="button" data-target="${item.id}" aria-label="${item.label}">
                    ${iconMarkup(item.icon)}
                </button>
            `).join('');
        }
    }

    function renderWorkCards(apiCards) {
        const grid = document.querySelector('.project-grid');
        // Priority: 1) API data  2) content.js overrides  3) leave static HTML
        const cards = apiCards
            || (Array.isArray(contentOverrides.workCards) && contentOverrides.workCards.length
                ? contentOverrides.workCards
                : null);
        if (!grid || !cards) return;

        grid.innerHTML = cards.map((card, index) => {
            const tags = (card.tags || []).map((tag) => `<span>${localized(tag)}</span>`).join('');
            const liveBtn = card.liveUrl
                ? `<a href="${card.liveUrl}" target="_blank" rel="noreferrer" class="project-live-link">View Project →</a>`
                : '';
            return `
                <article class="project-card glass-card reveal-up tilt-effect ${index ? `delay-${Math.min(index, 3)}` : ''}">
                    <div class="project-preview preview-${index % 3}" aria-hidden="true">
                        <span>${localized(card.banner) || String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <span class="project-number">${String(index + 1).padStart(2, '0')}</span>
                    <h3>${localized(card.title)}</h3>
                    <p>${localized(card.copy)}</p>
                    <div class="project-tags">${tags}</div>
                    ${liveBtn}
                </article>
            `;
        }).join('');
    }

    // ---- Load projects from backend API (with graceful fallback) ----
    async function loadProjectsFromAPI() {
        if (!window.TojiAPI) return; // api.js not loaded
        try {
            const response = await window.TojiAPI.ProjectsAPI.getPublic();
            if (response && Array.isArray(response.data) && response.data.length > 0) {
                // Map MongoDB project schema → workCards shape expected by renderWorkCards
                const apiCards = response.data.map((p) => ({
                    banner: p.banner,
                    title:  p.title,   // already { en, ar }
                    copy:   p.copy,    // already { en, ar }
                    tags:   p.tags || [],
                    liveUrl: p.liveUrl || ''
                }));
                renderWorkCards(apiCards);
                window.lucide?.createIcons(); // re-run icons in case new ones were added
            }
            // If DB is empty, the static HTML / content.js cards remain visible
        } catch (_err) {
            // Backend unreachable → silently keep static content, no error shown to visitors
            console.warn('[TOJI] Projects API unavailable, using static content.');
        }
    }

    function renderSocialLinks() {
        const mesh = document.querySelector('.social-mesh');
        if (!mesh) return;

        const links = Array.isArray(contentOverrides.socialLinks)
            ? contentOverrides.socialLinks.filter((item) => item.enabled !== false && item.url)
            : [];
        const socialItems = links.map((item, index) => `
            <a href="${appendUtm(item.url, item.platform || 'social')}" target="_blank" rel="noreferrer" class="social-pill glass-card hover-glow reveal-up ${index ? `delay-${Math.min(index, 3)}` : ''}" data-social-dynamic="${item.platform || 'link'}">
                ${iconMarkup(item.icon || item.platform)}
                <span>${localized(item.label)}</span>
                ${iconMarkup('external-link', 'pill-arrow')}
            </a>
        `);

        socialItems.push(`
            <a href="${appendUtm(getWhatsappUrl(), 'whatsapp')}" target="_blank" rel="noreferrer" class="social-pill glass-card hover-glow reveal-up" data-whatsapp>
                ${iconMarkup('message-circle')}
                <span>WhatsApp</span>
                ${iconMarkup('external-link', 'pill-arrow')}
            </a>
        `);
        socialItems.push(`
            <button class="social-pill glass-card hover-glow reveal-up delay-1" type="button" data-copy="${profilePhone}">
                ${iconMarkup('copy')}
                <span data-i18n="connect.copyNumber">${t('connect.copyNumber')}</span>
                ${iconMarkup('check', 'pill-arrow')}
            </button>
        `);

        mesh.innerHTML = socialItems.join('');
    }

    function renderQuickMessages() {
        if (!messageType) return;
        const messages = Array.isArray(contentOverrides.quickMessages) && contentOverrides.quickMessages.length
            ? contentOverrides.quickMessages
            : [
                { value: 'personal', label: { en: t('form.personal'), ar: t('form.personal') }, message: { en: t('share.briefIntro'), ar: t('share.briefIntro') } },
                { value: 'business', label: { en: t('form.business'), ar: t('form.business') }, message: { en: t('share.briefIntro'), ar: t('share.briefIntro') } },
                { value: 'linkHub', label: { en: t('form.linkHub'), ar: t('form.linkHub') }, message: { en: t('share.briefIntro'), ar: t('share.briefIntro') } }
            ];

        messageType.innerHTML = messages.map((item) => `
            <option value="${item.value || localized(item.label)}" data-message="${localized(item.message)}">${localized(item.label)}</option>
        `).join('');
    }

    function renderHeroCtas() {
        const actions = document.querySelector('.hero-actions');
        if (!actions) return;
        actions.querySelectorAll('[data-dynamic-cta]').forEach((node) => node.remove());
        (contentOverrides.ctaButtons || []).filter((item) => item.enabled !== false && item.url).forEach((item) => {
            const link = document.createElement('a');
            link.className = 'action-btn action-secondary';
            link.href = appendUtm(item.url, item.type || 'cta');
            link.target = '_blank';
            link.rel = 'noreferrer';
            link.dataset.dynamicCta = item.type || 'cta';
            link.dataset.message = localized(item.message);
            link.innerHTML = `${iconMarkup(item.type === 'map' ? 'map-pin' : 'calendar-check')}<span>${localized(item.label)}</span>`;
            actions.appendChild(link);
        });
    }

    function renderMarketingSection(id, config, renderer) {
        let section = document.getElementById(id);
        if (!section) {
            const connectSection = document.getElementById('connect');
            section = document.createElement('section');
            section.className = 'screen dynamic-section';
            section.id = id;
            section.setAttribute('aria-labelledby', `${id}-title`);
            connectSection?.parentNode?.insertBefore(section, connectSection);
        }
        section.hidden = !sectionConfig[id];
        if (section.hidden) return;

        section.innerHTML = `
            <div class="section-shell">
                <div class="section-heading reveal-up">
                    <p class="eyebrow">${localized(config?.eyebrow) || id}</p>
                    <h2 class="section-title" id="${id}-title">${localized(config?.title) || id}</h2>
                </div>
                ${renderer(config)}
            </div>
        `;
    }

    function renderMarketingSections() {
        const marketing = contentOverrides.marketing || {};
        renderMarketingSection('services', marketing.services, (section) => `
            <div class="marketing-grid">
                ${(section?.items || []).map((item) => `
                    <article class="marketing-card glass-card reveal-up tilt-effect">
                        ${iconMarkup('sparkles')}
                        <h3>${localized(item.title)}</h3>
                        <p>${localized(item.copy)}</p>
                    </article>
                `).join('')}
            </div>
        `);
        renderMarketingSection('pricing', marketing.pricing, (section) => `
            <div class="pricing-grid">
                ${(section?.items || []).map((item) => `
                    <article class="pricing-card glass-card reveal-up">
                        <span>${localized(item.name)}</span>
                        <strong>${item.price || ''}</strong>
                        <ul>${(item.features || []).map((feature) => `<li>${localized(feature)}</li>`).join('')}</ul>
                    </article>
                `).join('')}
            </div>
        `);
        renderMarketingSection('testimonials', marketing.testimonials, (section) => `
            <div class="marketing-grid">
                ${(section?.items || []).map((item) => `
                    <article class="marketing-card glass-card reveal-up">
                        <p>${localized(item.quote)}</p>
                        <h3>${localized(item.name)}</h3>
                    </article>
                `).join('')}
            </div>
        `);
        renderMarketingSection('gallery', marketing.gallery, (section) => `
            <div class="gallery-grid">
                ${(section?.items || []).map((item) => `
                    <figure class="gallery-item glass-card reveal-up">
                        <img src="${item.image || 'assets/social-preview.png'}" alt="${localized(item.title)}" loading="lazy">
                        <figcaption>${localized(item.title)}</figcaption>
                    </figure>
                `).join('')}
            </div>
        `);
        renderMarketingSection('faq', marketing.faq, (section) => `
            <div class="faq-list">
                ${(section?.items || []).map((item) => `
                    <details class="faq-item glass-card reveal-up">
                        <summary>${localized(item.question)}</summary>
                        <p>${localized(item.answer)}</p>
                    </details>
                `).join('')}
            </div>
        `);
    }

    function applySectionVisibility() {
        setElementVisible('#expertise', sectionConfig.about);
        setElementVisible('#work', sectionConfig.work);
        setElementVisible('#connect', sectionConfig.connect);
        setElementVisible('#quickMessageForm', sectionConfig.form && sectionConfig.connect);
        setElementVisible('.accent-panel', sectionConfig.themeControls && sectionConfig.connect);
    }

    function applyDesignConfig() {
        if (designConfig.primaryColor) body.style.setProperty('--primary', designConfig.primaryColor);
        if (designConfig.accentColor) body.style.setProperty('--accent', designConfig.accentColor);
        if (designConfig.mintColor) body.style.setProperty('--mint', designConfig.mintColor);
        if (designConfig.fontFamily) {
            document.documentElement.style.setProperty('--site-font', designConfig.fontFamily);
            body.style.fontFamily = `'${designConfig.fontFamily}', cursive, system-ui, -apple-system, sans-serif`;
        }
        ['personal', 'business', 'creator', 'clinic', 'restaurant'].forEach((name) => {
            body.classList.toggle(`demo-${name}`, designConfig.presets?.currentDemo === name);
        });
    }

    function setupAnalytics() {
        if (analyticsConfig.googleAnalyticsId && !document.getElementById('gaScript')) {
            const ga = document.createElement('script');
            ga.id = 'gaScript';
            ga.async = true;
            ga.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsConfig.googleAnalyticsId)}`;
            document.head.appendChild(ga);

            const inline = document.createElement('script');
            inline.id = 'gaInline';
            inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${analyticsConfig.googleAnalyticsId}');`;
            document.head.appendChild(inline);
        }

        if (analyticsConfig.metaPixelId && !document.getElementById('metaPixelScript')) {
            const pixel = document.createElement('script');
            pixel.id = 'metaPixelScript';
            pixel.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${analyticsConfig.metaPixelId}');fbq('track','PageView');`;
            document.head.appendChild(pixel);
        }
    }

    function renderTemplateFeatures() {
        applyDesignConfig();
        applySectionVisibility();
        renderMarketingSections();
        renderNavigation();
        renderWorkCards();
        renderSocialLinks();
        renderQuickMessages();
        renderHeroCtas();
        setupAnalytics();
        refreshDomCollections();
        window.lucide?.createIcons();
    }

    function isInsideScrollViewport(element) {
        const rect = element.getBoundingClientRect();
        const rootRect = scrollRoot
            ? scrollRoot.getBoundingClientRect()
            : { top: 0, bottom: window.innerHeight };

        return rect.bottom >= rootRect.top && rect.top <= rootRect.bottom;
    }

    function syncObservedElements() {
        refreshDomCollections();

        revealElements.forEach((element) => {
            if (element.closest('.hero-screen') || isInsideScrollViewport(element)) {
                element.classList.add('visible');
            }
        });

        if (sectionObserver) {
            sectionObserver.disconnect();
            sections.forEach((section) => sectionObserver.observe(section));
        }

        if (revealObserver) {
            revealObserver.disconnect();
            revealElements.forEach((element) => revealObserver.observe(element));
        }
    }

    function updateWhatsappLinks() {
        document.querySelectorAll('[data-whatsapp]').forEach((link) => {
            link.href = appendUtm(`https://wa.me/${profilePhone}?text=${encodeURIComponent(t('share.whatsappMessage'))}`, 'whatsapp');
        });
    }

    function applyConfigLinks() {
        document.querySelectorAll('[data-social]').forEach((link) => {
            const key = link.dataset.social;
            if (socials[key]) {
                link.href = socials[key];
                link.hidden = false;
            } else {
                link.hidden = true;
            }
        });

        document.querySelectorAll('[data-copy]').forEach((button) => {
            button.dataset.copy = profilePhone;
        });

        const assets = profileConfig.assets || {};
        document.querySelectorAll('a[download]').forEach((link) => {
            if (link.getAttribute('href')?.includes('media-kit') && assets.mediaKit) {
                link.href = assets.mediaKit;
            }
        });
    }

    function applyProfileIdentity() {
        if (brandName) brandName.textContent = profileNickname;
        if (profileCardName) profileCardName.textContent = profileNickname;
        if (profilePhoto) {
            profilePhoto.src = profileImage;
            profilePhoto.alt = profileNickname;
        }
        if (loaderBrand) loaderBrand.textContent = profileLoaderMark;
        if (qrFallback) qrFallback.textContent = profileNickname;
        document.querySelector('.brand')?.setAttribute('aria-label', `${profileNickname} home`);
    }

    function getWhatsappUrl(message = t('share.whatsappMessage')) {
        return `https://wa.me/${profilePhone}?text=${encodeURIComponent(message)}`;
    }

    function getQrValue() {
        if (currentQrMode === 'whatsapp') return `https://wa.me/${profilePhone}`;
        if (currentQrMode === 'instagram') return socials.instagram || getProfileUrl();
        return getProfileUrl();
    }

    function applyLiveStatus() {
        const status = profileConfig.status || window.TOJI_STATUS || {};
        const text = status[currentLang] || status.en || t('hero.status');

        if (liveStatusText) {
            liveStatusText.textContent = text;
        }
    }

    const presetTokens = {
        neon: () => ({
            primary: designConfig.primaryColor || '#36d6ff',
            accent: designConfig.accentColor || '#ff7a3d',
            mint: designConfig.mintColor || '#6df6b2',
            glow: 'rgba(57, 208, 255, 0.28)'
        }),
        midnight: () => ({ primary: '#8bd3ff', accent: '#c8a7ff', mint: '#7ef0c1', glow: 'rgba(139, 211, 255, 0.22)' }),
        emerald: () => ({ primary: '#5ee2a0', accent: '#f7c948', mint: '#39d0ff', glow: 'rgba(94, 226, 160, 0.24)' }),
        sunset: () => ({ primary: '#ff9f43', accent: '#ff5f7e', mint: '#39d0ff', glow: 'rgba(255, 122, 61, 0.26)' }),
        aurora: () => ({ primary: '#7dd3fc', accent: '#d8b4fe', mint: '#86efac', glow: 'rgba(125, 211, 252, 0.23)' }),
        royal: () => ({ primary: '#f6c95f', accent: '#a78bfa', mint: '#5ee2a0', glow: 'rgba(246, 201, 95, 0.22)' }),
        graphite: () => ({ primary: '#e5e7eb', accent: '#39d0ff', mint: '#ff7a3d', glow: 'rgba(229, 231, 235, 0.16)' })
    };

    const accentTokens = {
        orange: { primary: '#ff7a3d', accent: '#39d0ff', glow: 'rgba(255, 122, 61, 0.28)' },
        green: { primary: '#5ee2a0', accent: '#ff7a3d', glow: 'rgba(94, 226, 160, 0.28)' },
        violet: { primary: '#a78bfa', accent: '#39d0ff', glow: 'rgba(167, 139, 250, 0.28)' },
        gold: { primary: '#f6c95f', accent: '#39d0ff', glow: 'rgba(246, 201, 95, 0.26)' }
    };

    function applyColorTokens(preset = 'neon', accent = 'cyan') {
        const base = (presetTokens[preset] || presetTokens.neon)();
        body.style.setProperty('--primary', base.primary);
        body.style.setProperty('--accent', base.accent);
        body.style.setProperty('--mint', base.mint);
        body.style.setProperty('--glow-color', base.glow);

        const accentToken = accentTokens[accent];
        if (accentToken) {
            body.style.setProperty('--primary', accentToken.primary);
            body.style.setProperty('--accent', accentToken.accent);
            body.style.setProperty('--glow-color', accentToken.glow);
        }
    }

    function setAccent(accent) {
        const accents = ['cyan', 'orange', 'green', 'violet', 'gold'];
        const safeAccent = accents.includes(accent) ? accent : 'cyan';
        accents.forEach((name) => {
            body.classList.toggle(`accent-${name}`, name === safeAccent && name !== 'cyan');
        });
        localStorage.setItem('toji_accent', safeAccent);
        applyColorTokens(localStorage.getItem('toji_theme_preset') || designConfig.presets?.currentStyle || profileConfig.themePreset || 'neon', safeAccent);

        accentSwatches.forEach((button) => {
            button.classList.toggle('active', button.dataset.accent === safeAccent);
        });

        window.tojiRenderQr?.();
    }

    function setThemePreset(preset) {
        const presets = ['neon', 'midnight', 'emerald', 'sunset', 'aurora', 'royal', 'graphite'];
        const safePreset = presets.includes(preset) ? preset : 'neon';

        presets.forEach((name) => {
            body.classList.toggle(`preset-${name}`, name === safePreset && name !== 'neon');
        });

        localStorage.setItem('toji_theme_preset', safePreset);
        applyColorTokens(safePreset, localStorage.getItem('toji_accent') || profileConfig.accent || 'cyan');
        presetBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.preset === safePreset);
        });
    }

    function shuffleVibe() {
        const combos = [
            { preset: 'aurora', accent: 'violet' },
            { preset: 'royal', accent: 'gold' },
            { preset: 'graphite', accent: 'cyan' },
            { preset: 'midnight', accent: 'violet' },
            { preset: 'emerald', accent: 'green' },
            { preset: 'sunset', accent: 'orange' },
            { preset: 'neon', accent: 'cyan' }
        ];
        const currentPreset = localStorage.getItem('toji_theme_preset') || 'neon';
        const currentAccent = localStorage.getItem('toji_accent') || 'cyan';
        const currentIndex = combos.findIndex((combo) => combo.preset === currentPreset && combo.accent === currentAccent);
        const next = combos[(currentIndex + 1 + combos.length) % combos.length];

        setThemePreset(next.preset);
        setAccent(next.accent);
        showToast(t('toast.presetSaved'));
    }

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('toji_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        body.classList.toggle('lang-ar', lang === 'ar');

        /* ── Font swap: Arabic = Aref Ruqaa handwriting | English = Caveat handwriting ── */
        if (lang === 'ar') {
            body.style.fontFamily = "'Aref Ruqaa', cursive";
        } else {
            const enFont = (window.TOJI_CONTENT?.design?.fontFamily) || 'Caveat';
            body.style.fontFamily = `'${enFont}', cursive, system-ui, -apple-system, sans-serif`;
        }
        document.title = t('meta.title');
        document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
        document.querySelector('meta[name="author"]')?.setAttribute('content', profileName);
        document.querySelector('meta[name="application-name"]')?.setAttribute('content', profileNickname);
        document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', profileNickname);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', t('meta.title'));
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', t('meta.description'));
        document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', t('meta.title'));
        document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', t('meta.description'));
        if (profileConfig.assets?.socialPreview) {
            document.querySelector('meta[property="og:image"]')?.setAttribute('content', profileConfig.assets.socialPreview);
            document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', profileConfig.assets.socialPreview);
        }
        const schema = document.getElementById('profileSchema');
        if (schema) {
            const sameAs = Object.values(socials).filter(Boolean);
            schema.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': contentOverrides.site?.schemaType || 'Person',
                name: profileName,
                alternateName: profileNickname,
                url: contentOverrides.site?.canonicalUrl || getProfileUrl(),
                image: profileConfig.assets?.socialPreview || profileImage,
                telephone: `+${profilePhone}`,
                description: t('meta.description'),
                sameAs
            }, null, 4);
        }
        languageToggle?.querySelector('span')?.replaceChildren(document.createTextNode(t('lang.nextLabel')));
        languageToggle?.setAttribute('aria-label', t('lang.switchLabel'));

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            element.textContent = t(element.dataset.i18n);
        });

        document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
            element.dataset.i18nAttr.split(',').forEach((pair) => {
                const [attribute, key] = pair.split(':').map((part) => part.trim());
                if (attribute && key) element.setAttribute(attribute, t(key));
            });
        });

        renderTemplateFeatures();
        // Fetch live projects from backend and overlay on static content
        loadProjectsFromAPI();
        setThemePreset(localStorage.getItem('toji_theme_preset') || designConfig.presets?.currentStyle || profileConfig.themePreset || 'neon');
        setAccent(localStorage.getItem('toji_accent') || profileConfig.accent || 'cyan');
        updateWhatsappLinks();
        applyLiveStatus();
        setTheme(body.classList.contains('light-theme') ? 'light' : 'dark');
        startTypewriter(true);
        window.tojiRenderQr?.();
        syncObservedElements();
        updateProgress();
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function getProfileUrl() {
        const url = new URL(window.location.href);
        url.searchParams.delete('preview');
        url.hash = '';
        return url.toString();
    }

    function downloadFile(filename, content, type) {
        const blob = content instanceof Blob ? content : new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    }

    function setTheme(theme) {
        const isLight = theme === 'light';
        body.classList.toggle('light-theme', isLight);
        body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem('toji_theme', theme);
        themeToggle?.setAttribute('aria-label', isLight ? t('theme.toDark') : t('theme.toLight'));
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f7f5ef' : '#050506');
    }

    setTheme(localStorage.getItem('toji_theme') === 'light' ? 'light' : 'dark');

    themeToggle?.addEventListener('click', () => {
        setTheme(body.classList.contains('dark-theme') ? 'light' : 'dark');
    });

    languageToggle?.addEventListener('click', () => {
        applyLanguage(currentLang === 'ar' ? 'en' : 'ar');
    });

    accentSwatches.forEach((button) => {
        button.addEventListener('click', () => {
            setAccent(button.dataset.accent);
            showToast(t('toast.accentSaved'));
        });
    });

    presetBtns.forEach((button) => {
        if (!button.dataset.preset) return;
        button.addEventListener('click', () => {
            setThemePreset(button.dataset.preset);
            showToast(t('toast.presetSaved'));
        });
    });

    randomVibe?.addEventListener('click', shuffleVibe);

    applyConfigLinks();
    applyProfileIdentity();
    setThemePreset(localStorage.getItem('toji_theme_preset') || designConfig.presets?.currentStyle || profileConfig.themePreset || 'neon');
    setAccent(localStorage.getItem('toji_accent') || profileConfig.accent || 'cyan');

    const enableCustomCursor = true;

    if (enableCustomCursor && cursorDot && cursorOutline && finePointer.matches && !reducedMotion.matches && !mobileViewport.matches) {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        let outlineX = x;
        let outlineY = y;
        let cursorFrame = 0;

        body.classList.add('cursor-ready');

        const moveCursor = (element, nextX, nextY) => {
            element.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`;
        };

        const renderCursor = () => {
            outlineX += (x - outlineX) * 0.16;
            outlineY += (y - outlineY) * 0.16;
            moveCursor(cursorOutline, outlineX, outlineY);
            cursorFrame = Math.abs(x - outlineX) > 0.25 || Math.abs(y - outlineY) > 0.25
                ? requestAnimationFrame(renderCursor)
                : 0;
        };

        const requestCursorRender = () => {
            if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
        };

        window.addEventListener('pointermove', (event) => {
            x = event.clientX;
            y = event.clientY;
            moveCursor(cursorDot, x, y);
            requestCursorRender();
        }, { passive: true });

        document.addEventListener('pointerover', (event) => {
            if (event.target.closest?.('a, button, .tilt-effect')) body.classList.add('cursor-active');
        }, { passive: true });

        document.addEventListener('pointerout', (event) => {
            const nextTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
            if (!nextTarget?.closest?.('a, button, .tilt-effect')) body.classList.remove('cursor-active');
        }, { passive: true });
    }

    function getTypewriterWords() {
        const list = translations[currentLang]?.typewriter;
        return Array.isArray(list) && list.length ? list : [profileNickname];
    }

    let words = getTypewriterWords();
    let wordIndex = 0;
    let charIndex = words[0].length;
    let isDeleting = false;
    let typeTimer;

    function typeEffect() {
        if (!typeTarget) return;
        const currentWord = words[wordIndex];
        typeTarget.textContent = currentWord.slice(0, charIndex);

        if (isDeleting) {
            charIndex -= 1;
        } else {
            charIndex += 1;
        }

        let speed = isDeleting ? 45 : 82;

        if (mobileViewport.matches) {
            speed = isDeleting ? 28 : 54;
        }

        if (!isDeleting && charIndex > currentWord.length) {
            speed = mobileViewport.matches ? 780 : 1300;
            isDeleting = true;
        }

        if (isDeleting && charIndex < 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            charIndex = 0;
            speed = mobileViewport.matches ? 160 : 300;
        }

        typeTimer = setTimeout(typeEffect, speed);
    }

    function startTypewriter(reset = false) {
        if (!typeTarget) return;
        clearTimeout(typeTimer);

        if (reset) {
            words = getTypewriterWords();
            wordIndex = 0;
            charIndex = words[0].length;
            isDeleting = false;
        }

        if (reducedMotion.matches) {
            typeTarget.textContent = words[0];
        } else {
            typeEffect();
        }
    }

    applyLanguage(currentLang);

    function updateProgress() {
        if (!scrollRoot || !progress) return;
        const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        const amount = maxScroll > 0 ? scrollRoot.scrollTop / maxScroll : 0;
        progress.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
    }

    scrollRoot?.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    function activateSection(id) {
        dockBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.target === id);
        });
        navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.target === id);
        });
    }

    sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                activateSection(entry.target.id);
            }
        });
    }, {
        root: scrollRoot,
        threshold: 0.55
    });

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        root: scrollRoot,
        threshold: 0.12
    });

    syncObservedElements();

    function goToSection(targetId) {
        const target = document.getElementById(targetId);
        if (!target || !scrollRoot) return;

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        scrollRoot.scrollTo({
            top: target.offsetTop,
            behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
        target.querySelectorAll('.reveal-up').forEach((element) => element.classList.add('visible'));
        activateSection(targetId);
    }

    document.addEventListener('click', (event) => {
        if (event.defaultPrevented) return;
        const dockButton = event.target.closest?.('.dock-btn');
        const navLink = event.target.closest?.('.nav-link');
        const targetId = dockButton?.dataset.target || navLink?.dataset.target;
        if (!targetId) return;

        event.preventDefault();
        goToSection(targetId);
        window.history.replaceState(null, '', `#${targetId}`);
    });

    dockBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            goToSection(btn.dataset.target);
            window.history.replaceState(null, '', `#${btn.dataset.target}`);
        });
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            goToSection(link.dataset.target);
            window.history.replaceState(null, '', `#${link.dataset.target}`);
        });
    });

    document.querySelectorAll('a[href^="#"]:not(.nav-link)').forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href').slice(1) || 'home';
            if (!document.getElementById(targetId)) return;

            event.preventDefault();
            goToSection(targetId);
            window.history.replaceState(null, '', `#${targetId}`);
        });
    });

    if (window.location.hash) {
        const hashTarget = window.location.hash.slice(1);
        if (document.getElementById(hashTarget)) {
            setTimeout(() => goToSection(hashTarget), 80);
        }
    }

    if (finePointer.matches && !reducedMotion.matches && !mobileViewport.matches) {
        Array.from(tiltElements)
            .filter((element) => element.classList.contains('profile-panel'))
            .forEach((element) => {
            let tiltFrame = 0;
            let nextEvent;

            element.addEventListener('pointermove', (event) => {
                nextEvent = event;
                if (tiltFrame) return;

                tiltFrame = requestAnimationFrame(() => {
                    tiltFrame = 0;
                    if (!nextEvent) return;

                const rect = element.getBoundingClientRect();
                    const x = nextEvent.clientX - rect.left;
                    const y = nextEvent.clientY - rect.top;
                const rotateX = ((y / rect.height) - 0.5) * -8;
                const rotateY = ((x / rect.width) - 0.5) * 8;
                element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
                });
            }, { passive: true });

            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // Fall back below when browser permissions block direct clipboard access.
            }
        }

        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.top = '0';
        field.style.left = '0';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.focus();
        field.select();
        field.setSelectionRange(0, field.value.length);
        const copied = document.execCommand('copy');
        field.remove();

        return copied;
    }

    function manualCopyMessage(text) {
        const value = String(text || '').replace(/\s+/g, ' ').trim();
        const shortValue = value.length > 44 ? `${value.slice(0, 44)}...` : value;
        return `${t('toast.copyManual')} ${shortValue}`;
    }

    function showCopyResult(copied, successMessage, text) {
        showToast(copied ? successMessage : manualCopyMessage(text));
    }

    document.addEventListener('click', async (event) => {
        const button = event.target.closest?.('[data-copy]');
        if (!button) return;
        const value = button.dataset.copy || '';

        try {
            showCopyResult(await copyText(value), t('toast.numberCopied'), value);
        } catch (error) {
            showToast(manualCopyMessage(value));
        }
    });

    function renderLocalQr(canvas, value) {
        if (!canvas || !window.TextEncoder) return false;

        const specs = [
            { version: 1, size: 21, dataCodewords: 19, eccCodewords: 7, align: [] },
            { version: 2, size: 25, dataCodewords: 34, eccCodewords: 10, align: [6, 18] },
            { version: 3, size: 29, dataCodewords: 55, eccCodewords: 15, align: [6, 22] },
            { version: 4, size: 33, dataCodewords: 80, eccCodewords: 20, align: [6, 26] },
            { version: 5, size: 37, dataCodewords: 108, eccCodewords: 26, align: [6, 30] }
        ];
        const bytes = Array.from(new TextEncoder().encode(value));
        const spec = specs.find((item) => bytes.length <= item.dataCodewords - 2);

        if (!spec) return false;

        const dataCodewords = makeDataCodewords(bytes, spec);
        const eccCodewords = makeErrorCodewords(dataCodewords, spec.eccCodewords);
        const payloadBits = [];

        dataCodewords.concat(eccCodewords).forEach((byte) => {
            appendBits(payloadBits, byte, 8);
        });

        const modules = Array.from({ length: spec.size }, () => Array(spec.size).fill(false));
        const reserved = Array.from({ length: spec.size }, () => Array(spec.size).fill(false));

        function setFunctionModule(x, y, isDark) {
            if (x < 0 || y < 0 || x >= spec.size || y >= spec.size) return;
            modules[y][x] = Boolean(isDark);
            reserved[y][x] = true;
        }

        function drawFinder(left, top) {
            for (let y = -1; y <= 7; y += 1) {
                for (let x = -1; x <= 7; x += 1) {
                    const isDark = x >= 0 && x <= 6 && y >= 0 && y <= 6
                        && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
                    setFunctionModule(left + x, top + y, isDark);
                }
            }
        }

        function drawAlignment(cx, cy) {
            if (reserved[cy]?.[cx]) return;

            for (let y = -2; y <= 2; y += 1) {
                for (let x = -2; x <= 2; x += 1) {
                    const isDark = Math.max(Math.abs(x), Math.abs(y)) === 2 || (x === 0 && y === 0);
                    setFunctionModule(cx + x, cy + y, isDark);
                }
            }
        }

        drawFinder(0, 0);
        drawFinder(spec.size - 7, 0);
        drawFinder(0, spec.size - 7);

        for (let i = 8; i < spec.size - 8; i += 1) {
            setFunctionModule(6, i, i % 2 === 0);
            setFunctionModule(i, 6, i % 2 === 0);
        }

        spec.align.forEach((y) => spec.align.forEach((x) => drawAlignment(x, y)));
        drawFormatBits(0);

        let bitIndex = 0;
        let upward = true;

        for (let right = spec.size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;

            for (let vertical = 0; vertical < spec.size; vertical += 1) {
                const y = upward ? spec.size - 1 - vertical : vertical;

                for (let offset = 0; offset < 2; offset += 1) {
                    const x = right - offset;
                    if (reserved[y][x]) continue;

                    const isDark = Boolean(payloadBits[bitIndex]);
                    const isMasked = (x + y) % 2 === 0;
                    modules[y][x] = isDark !== isMasked;
                    bitIndex += 1;
                }
            }

            upward = !upward;
        }

        drawCanvas();
        return true;

        function makeDataCodewords(inputBytes, qrSpec) {
            const bits = [];
            const capacityBits = qrSpec.dataCodewords * 8;
            appendBits(bits, 0x4, 4);
            appendBits(bits, inputBytes.length, qrSpec.version < 10 ? 8 : 16);
            inputBytes.forEach((byte) => appendBits(bits, byte, 8));

            const terminatorLength = Math.min(4, capacityBits - bits.length);
            for (let i = 0; i < terminatorLength; i += 1) bits.push(false);
            while (bits.length % 8 !== 0) bits.push(false);

            const codewords = [];
            for (let i = 0; i < bits.length; i += 8) {
                let codeword = 0;
                for (let j = 0; j < 8; j += 1) {
                    codeword = (codeword << 1) | (bits[i + j] ? 1 : 0);
                }
                codewords.push(codeword);
            }

            for (let pad = 0; codewords.length < qrSpec.dataCodewords; pad += 1) {
                codewords.push(pad % 2 === 0 ? 0xec : 0x11);
            }

            return codewords;
        }

        function makeErrorCodewords(data, degree) {
            const divisor = makeDivisor(degree);
            const result = Array(degree).fill(0);

            data.forEach((byte) => {
                const factor = byte ^ result.shift();
                result.push(0);

                divisor.forEach((coefficient, index) => {
                    result[index] ^= multiplyQrField(coefficient, factor);
                });
            });

            return result;
        }

        function makeDivisor(degree) {
            const result = Array(degree - 1).fill(0).concat(1);
            let root = 1;

            for (let i = 0; i < degree; i += 1) {
                for (let j = 0; j < result.length; j += 1) {
                    result[j] = multiplyQrField(result[j], root);
                    if (j + 1 < result.length) result[j] ^= result[j + 1];
                }
                root = multiplyQrField(root, 0x02);
            }

            return result;
        }

        function multiplyQrField(x, y) {
            let z = 0;

            for (let i = 7; i >= 0; i -= 1) {
                z = (z << 1) ^ ((z >>> 7) * 0x11d);
                z ^= ((y >>> i) & 1) * x;
            }

            return z;
        }

        function appendBits(bits, valueToAppend, length) {
            for (let i = length - 1; i >= 0; i -= 1) {
                bits.push(((valueToAppend >>> i) & 1) === 1);
            }
        }

        function drawFormatBits(mask) {
            const bits = getFormatBits(mask);

            for (let i = 0; i <= 5; i += 1) setFunctionModule(8, i, getBit(bits, i));
            setFunctionModule(8, 7, getBit(bits, 6));
            setFunctionModule(8, 8, getBit(bits, 7));
            setFunctionModule(7, 8, getBit(bits, 8));
            for (let i = 9; i < 15; i += 1) setFunctionModule(14 - i, 8, getBit(bits, i));
            for (let i = 0; i < 8; i += 1) setFunctionModule(spec.size - 1 - i, 8, getBit(bits, i));
            for (let i = 8; i < 15; i += 1) setFunctionModule(8, spec.size - 15 + i, getBit(bits, i));
            setFunctionModule(8, spec.size - 8, true);
        }

        function getFormatBits(mask) {
            const data = (1 << 3) | mask;
            let remainder = data;

            for (let i = 0; i < 10; i += 1) {
                remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
            }

            return ((data << 10) | remainder) ^ 0x5412;
        }

        function getBit(valueToRead, index) {
            return ((valueToRead >>> index) & 1) === 1;
        }

        function drawCanvas() {
            const context = canvas.getContext('2d');
            if (!context) return;

            const canvasSize = 220;
            const cellSize = Math.max(1, Math.floor(canvasSize / (spec.size + 8)));
            const qrSize = cellSize * spec.size;
            const offset = Math.floor((canvasSize - qrSize) / 2);

            canvas.width = canvasSize;
            canvas.height = canvasSize;
            context.fillStyle = '#f7f5ef';
            context.fillRect(0, 0, canvasSize, canvasSize);
            context.fillStyle = '#050506';

            modules.forEach((row, y) => {
                row.forEach((isDark, x) => {
                    if (!isDark) return;
                    context.fillRect(offset + x * cellSize, offset + y * cellSize, cellSize, cellSize);
                });
            });
        }
    }

    window.tojiRenderQr = function renderQr() {
        if (!qrCanvas) return;

        const url = getQrValue();
        const markReady = () => qrCanvas.closest('.qr-frame')?.classList.add('qr-ready');
        const markLoading = () => qrCanvas.closest('.qr-frame')?.classList.remove('qr-ready');
        const renderFallback = () => {
            if (renderLocalQr(qrCanvas, url)) {
                markReady();
                return;
            }

            markLoading();
            if (qrFallback) qrFallback.textContent = 'QR';
        };

        if (!window.QRCode?.toCanvas) {
            renderFallback();
            return;
        }

        window.QRCode.toCanvas(qrCanvas, url, {
            width: 220,
            margin: 1,
            color: {
                dark: '#050506',
                light: '#f7f5ef'
            }
        }, (error) => {
            if (error) {
                renderFallback();
                return;
            }

            markReady();
        });
    };

    qrModeBtns.forEach((button) => {
        const isActive = button.dataset.qrMode === currentQrMode;
        button.classList.toggle('active', isActive);

        button.addEventListener('click', () => {
            currentQrMode = button.dataset.qrMode || 'profile';
            localStorage.setItem('toji_qr_mode', currentQrMode);
            qrModeBtns.forEach((item) => item.classList.toggle('active', item === button));
            window.tojiRenderQr();
        });
    });

    window.tojiRenderQr();

    downloadContact?.addEventListener('click', () => {
        const url = getProfileUrl();
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${profileName}`,
            `N:${profileName};;;;`,
            `NICKNAME:${profileNickname}`,
            `TEL;TYPE=CELL:+${profilePhone}`,
            `URL:${url}`,
            `X-SOCIALPROFILE;TYPE=instagram:${socials.instagram}`,
            `X-SOCIALPROFILE;TYPE=tiktok:${socials.tiktok}`,
            `X-SOCIALPROFILE;TYPE=snapchat:${socials.snapchat}`,
            'END:VCARD'
        ].join('\r\n');

        downloadFile(`${profileNickname}-contact.vcf`, `${vcard}\r\n`, 'text/vcard;charset=utf-8');
        showToast(t('toast.contactDownloaded'));
    });

    downloadQr?.addEventListener('click', () => {
        if (!qrCanvas || !qrCanvas.closest('.qr-frame')?.classList.contains('qr-ready')) {
            showToast(t('toast.qrLoading'));
            window.tojiRenderQr();
            return;
        }

        qrCanvas.toBlob((blob) => {
            if (!blob) {
                showToast(t('toast.qrDownloadFailed'));
                return;
            }

            downloadFile(`${profileNickname}-${currentQrMode}-qr.png`, blob, 'image/png');
            showToast(t('toast.qrDownloaded'));
        }, 'image/png');
    });

    copyProfileLink?.addEventListener('click', async () => {
        const profileUrl = getProfileUrl();
        try {
            showCopyResult(await copyText(profileUrl), t('toast.profileCopied'), profileUrl);
        } catch (error) {
            showToast(manualCopyMessage(profileUrl));
        }
    });

    async function generateShareCard() {
        const canvas = document.createElement('canvas');
        const width = 1200;
        const height = 630;
        const context = canvas.getContext('2d');
        const shareConfig = profileConfig.shareImage || {};

        canvas.width = width;
        canvas.height = height;

        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#061c23');
        gradient.addColorStop(0.58, '#050506');
        gradient.addColorStop(1, '#271208');
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        context.globalAlpha = 0.26;
        context.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#39d0ff';
        context.beginPath();
        context.arc(250, 170, 280, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#ff7a3d';
        context.beginPath();
        context.arc(980, 420, 260, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;

        context.strokeStyle = 'rgba(255,255,255,0.12)';
        context.lineWidth = 1;
        for (let x = 120; x < width; x += 160) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }
        for (let y = 105; y < height; y += 105) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        roundRect(context, 70, 70, 1060, 490, 34);
        context.fillStyle = 'rgba(255,255,255,0.07)';
        context.fill();
        context.strokeStyle = 'rgba(255,255,255,0.16)';
        context.stroke();

        context.fillStyle = '#ff7a3d';
        context.font = '900 34px Arial, sans-serif';
        context.fillText(`${profileName.toUpperCase()} / ${profileNickname}`, 122, 142);

        context.fillStyle = '#f7f5ef';
        context.font = '900 92px Arial, sans-serif';
        context.fillText(shareConfig.title || profileNickname, 122, 265);

        context.fillStyle = '#a7acb7';
        context.font = '700 34px Arial, sans-serif';
        context.fillText(shareConfig.subtitle || t('share.profileText'), 122, 330);
        context.fillText(shareConfig.handle || socials.instagram.replace('https://instagram.com/', '@'), 122, 382);

        const qrImage = await canvasToImage(qrCanvas);
        context.fillStyle = '#f7f5ef';
        roundRect(context, 824, 142, 236, 236, 12);
        context.fill();
        if (qrImage) context.drawImage(qrImage, 840, 158, 204, 204);

        context.fillStyle = '#f7f5ef';
        context.font = '900 30px Arial, sans-serif';
        context.textAlign = 'center';
        context.fillText(shareConfig.scanLabel || 'Scan to connect', 942, 430);
        context.textAlign = 'left';

        context.fillStyle = 'rgba(255,255,255,0.09)';
        context.beginPath();
        context.arc(706, 300, 82, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#f7f5ef';
        context.font = '900 54px Arial, sans-serif';
        context.textAlign = 'center';
        context.fillText(profileNickname, 706, 316);
        context.textAlign = 'left';

        await downloadCanvasImage(canvas);
    }

    function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = src;
        });
    }

    function canvasToImage(sourceCanvas) {
        if (!sourceCanvas) return Promise.resolve(null);
        return loadImage(sourceCanvas.toDataURL('image/png'));
    }

    function downloadCanvasImage(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(false);
                    return;
                }

                downloadFile(profileConfig.shareImage?.filename || `${profileNickname}-share-card.png`, blob, 'image/png');
                showToast(t('toast.shareImageReady'));
                resolve(true);
            }, 'image/png');
        });
    }

    generateShareImage?.addEventListener('click', () => {
        if (!qrCanvas?.closest('.qr-frame')?.classList.contains('qr-ready')) {
            window.tojiRenderQr();
        }

        generateShareCard();
    });

    shareProfile?.addEventListener('click', async () => {
        const url = getProfileUrl();
        const shareData = {
            title: `${profileNickname} | ${profileName}`,
            text: t('share.profileText'),
            url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast(t('toast.shared'));
            } else {
                showCopyResult(await copyText(url), t('toast.profileCopied'), url);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                showToast(t('toast.shareFailed'));
            }
        }
    });

    quickMessageForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const selectedOption = messageType?.selectedOptions[0];
        const nameVal        = messageName?.value.trim();
        const msgVal         = messageText?.value.trim();

        // Basic client-side validation
        if (!nameVal || !msgVal) {
            // Light feedback — no big UI disruption
            messageName?.reportValidity?.();
            messageText?.reportValidity?.();
            return;
        }

        // Disable submit button to prevent double sends
        const submitBtn   = quickMessageForm.querySelector('button[type="submit"]');
        const originalTxt = submitBtn?.textContent || 'إرسال';
        if (submitBtn) {
            submitBtn.disabled    = true;
            submitBtn.textContent = '...';
        }

        // Build WhatsApp message parts (kept exactly as before)
        const parts = [
            selectedOption?.dataset.message || t('share.briefIntro'),
            nameVal ? `${t('form.name')}: ${nameVal}` : '',
            selectedOption?.textContent?.trim() ? `${t('form.type')}: ${selectedOption.textContent.trim()}` : '',
            msgVal ? `${t('form.message')}: ${msgVal}` : ''
        ].filter(Boolean);

        // ---- Save to backend (fire-and-forget; never blocks WhatsApp) ----
        if (window.TojiAPI) {
            window.TojiAPI.MessagesAPI.send({
                name:     nameVal,
                pageType: selectedOption?.textContent?.trim() || 'Not specified',
                message:  msgVal
            }).catch((err) => {
                // Silently log — visitor experience is not affected
                console.warn('[TOJI] Message save failed:', err.message);
            });
        }

        // ---- Open WhatsApp (original behaviour preserved) ----
        window.open(getWhatsappUrl(parts.join('\n')), '_blank', 'noopener,noreferrer');

        // Reset form after opening WhatsApp
        quickMessageForm.reset();

        if (submitBtn) {
            submitBtn.disabled    = false;
            submitBtn.textContent = originalTxt;
        }
    });

    let installPromptEvent;

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        installPromptEvent = event;
        if (installApp) installApp.hidden = false;
    });

    installApp?.addEventListener('click', async () => {
        if (!installPromptEvent) return;
        installPromptEvent.prompt();
        await installPromptEvent.userChoice;
        installPromptEvent = null;
        installApp.hidden = true;
    });

    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    function finishLoading() {
        body.classList.remove('is-loading');
        body.classList.add('is-ready');
    }

    window.addEventListener('load', () => {
        setTimeout(finishLoading, mobileViewport.matches ? 220 : 360);
    }, { once: true });

    setTimeout(finishLoading, 1200);

    window.addEventListener('storage', (event) => {
        if (previewMode && event.key === 'toji_content_override') {
            window.location.reload();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) return;
        if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select')) return;

        const ids = Array.from(sections).map((section) => section.id);
        const current = ids.findIndex((id) => document.querySelector(`.dock-btn[data-target="${id}"]`)?.classList.contains('active'));
        const direction = ['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1;
        const next = Math.min(ids.length - 1, Math.max(0, current + direction));

        event.preventDefault();
        goToSection(ids[next]);
    });
});

// ========== ALL ENHANCEMENTS JS ==========

// RIPPLE
document.addEventListener('click', (e) => {
    if (e.target.closest('button, a, [role="button"]')) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = e.target.closest('button, a, [role="button"]').getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        e.target.closest('button, a, [role="button"]').appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        if (navigator.vibrate) navigator.vibrate(10);
    }
});

// SCROLL ANIMATIONS
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('scroll-animate');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.hero-content, .section-title, .bento-item, .social-pill').forEach(el => {
    observer.observe(el);
});

// FORM VALIDATION
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
        if (input.value.length > 0 && input.checkValidity && input.checkValidity()) {
            input.classList.add('valid');
        }
    });
});

// AUDIO CONTEXT
try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    window.playSound = (freq = 400, duration = 100) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + duration / 1000);
    };
} catch(e) {}

// TOUCH
document.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, a')) {
        e.target.closest('button, a').style.opacity = '0.8';
    }
});

document.addEventListener('touchend', (e) => {
    if (e.target.closest('button, a')) {
        e.target.closest('button, a').style.opacity = '1';
    }
});

// LAZY LOADING
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-lazy]');
    lazyImages.forEach(img => {
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.src = entry.target.dataset.lazy;
                    entry.target.removeAttribute('data-lazy');
                    imgObserver.unobserve(entry.target);
                }
            });
        });
        imgObserver.observe(img);
    });
}

// SWIPE
let touchStartX = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchEndX < touchStartX - 50) {
        // Swiped left
    } else if (touchEndX > touchStartX + 50) {
        // Swiped right
    }
});

// MAGNETIC HOVER
document.querySelectorAll('button, a').forEach(element => {
    element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance < 100) {
            const angle = Math.atan2(y, x);
            const pull = (100 - distance) / 100 * 10;
            element.style.transform = `translate(${Math.cos(angle) * pull}px, ${Math.sin(angle) * pull}px)`;
        }
    });
    
    element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0, 0)';
    });
});

// PROGRESS BAR ON PAGE LOAD
window.addEventListener('beforeunload', () => {
    const progress = document.createElement('div');
    progress.className = 'progress-bar';
    document.body.appendChild(progress);
});

