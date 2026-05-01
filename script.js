document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const scrollRoot = document.getElementById('pageScroll');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const progress = document.querySelector('.scroll-progress');
    const themeToggle = document.getElementById('themeToggle');
    const languageToggle = document.getElementById('languageToggle');
    const typeTarget = document.getElementById('typewriter');
    const dockBtns = document.querySelectorAll('.dock-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.screen');
    const revealElements = document.querySelectorAll('.reveal-up');
    const tiltElements = document.querySelectorAll('.tilt-effect');
    const toast = document.getElementById('toast');
    const shareProfile = document.getElementById('shareProfile');
    const qrCanvas = document.getElementById('profileQr');
    const qrFallback = document.getElementById('qrFallback');
    const downloadContact = document.getElementById('downloadContact');
    const downloadQr = document.getElementById('downloadQr');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileViewport = window.matchMedia('(max-width: 720px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const profilePhone = '201102550730';
    const translations = {
        en: {
            meta: {
                title: 'TOJI | Mohamed Mostafa',
                description: 'Mohamed Mostafa, TOJI. Personal portfolio, social links, small web pages, and front-end experiments.'
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
                title: 'I make simple pages that look good and feel easy.',
                working: 'Working on ',
                copy: 'I care about clean layouts, quick loading, and small details that make a profile feel like mine.',
                status: 'Available for custom pages',
                openLinks: 'Open Links'
            },
            typewriter: ['my profile', 'simple pages', 'mobile links', 'better details'],
            signals: {
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
                shareProfile: 'Share Profile'
            },
            aria: {
                scrollAbout: 'Scroll to about section',
                contactCard: 'Profile QR and contact actions',
                quickNav: 'Quick navigation'
            },
            share: {
                whatsappMessage: 'Hi TOJI, I saw your profile and wanted to ask about a page.',
                profileText: 'TOJI profile and links.'
            },
            toast: {
                numberCopied: 'Number copied',
                copyFailed: 'Copy failed',
                contactDownloaded: 'Contact card downloaded',
                qrLoading: 'QR is still loading',
                qrDownloadFailed: 'QR download failed',
                qrDownloaded: 'QR downloaded',
                shared: 'Shared',
                profileCopied: 'Profile link copied',
                shareFailed: 'Share failed'
            },
            theme: {
                toLight: 'Switch to light theme',
                toDark: 'Switch to dark theme'
            }
        },
        ar: {
            meta: {
                title: 'TOJI | محمد مصطفى',
                description: 'محمد مصطفى، TOJI. بروفايل شخصي وروابط وصفحات ويب صغيرة وتجارب فرونت إند.'
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
                title: 'بعمل صفحات بسيطة شكلها حلو وسهلة الاستخدام.',
                working: 'بشتغل على ',
                copy: 'بهتم بالتصميم النضيف، التحميل السريع، والتفاصيل الصغيرة اللي تخلي البروفايل شبه صاحبه.',
                status: 'متاح لعمل صفحات مخصصة',
                openLinks: 'افتح الروابط'
            },
            typewriter: ['بروفايلي', 'صفحات بسيطة', 'روابط موبايل', 'تفاصيل أحسن'],
            signals: {
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
                shareProfile: 'مشاركة البروفايل'
            },
            aria: {
                scrollAbout: 'انتقل إلى قسم عني',
                contactCard: 'QR البروفايل وأزرار التواصل',
                quickNav: 'تنقل سريع'
            },
            share: {
                whatsappMessage: 'أهلًا TOJI، شوفت البروفايل وكنت عايز أسأل عن صفحة.',
                profileText: 'بروفايل وروابط TOJI.'
            },
            toast: {
                numberCopied: 'اتنسخ الرقم',
                copyFailed: 'النسخ فشل',
                contactDownloaded: 'تم تحميل جهة الاتصال',
                qrLoading: 'الـ QR لسه بيتحمل',
                qrDownloadFailed: 'تحميل الـ QR فشل',
                qrDownloaded: 'تم تحميل الـ QR',
                shared: 'تمت المشاركة',
                profileCopied: 'اتنسخ لينك البروفايل',
                shareFailed: 'المشاركة فشلت'
            },
            theme: {
                toLight: 'تبديل للوضع الفاتح',
                toDark: 'تبديل للوضع الداكن'
            }
        }
    };
    let currentLang = localStorage.getItem('toji_lang') === 'ar' ? 'ar' : 'en';

    if (window.lucide) {
        window.lucide.createIcons();
    }

    function t(path) {
        return path.split('.').reduce((value, key) => value?.[key], translations[currentLang]) ?? path;
    }

    function updateWhatsappLinks() {
        document.querySelectorAll('[data-whatsapp]').forEach((link) => {
            link.href = `https://wa.me/${profilePhone}?text=${encodeURIComponent(t('share.whatsappMessage'))}`;
        });
    }

    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('toji_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        body.classList.toggle('lang-ar', lang === 'ar');
        document.title = t('meta.title');
        document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
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

        updateWhatsappLinks();
        setTheme(body.classList.contains('light-theme') ? 'light' : 'dark');
        startTypewriter(true);
    }

    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
    }

    function getProfileUrl() {
        return window.location.href.split('#')[0];
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

    if (cursorDot && cursorOutline && finePointer.matches) {
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        let outlineX = x;
        let outlineY = y;

        body.classList.add('cursor-ready');

        window.addEventListener('pointermove', (event) => {
            x = event.clientX;
            y = event.clientY;
            cursorDot.style.left = `${x}px`;
            cursorDot.style.top = `${y}px`;
        }, { passive: true });

        const animateCursor = () => {
            outlineX += (x - outlineX) * 0.16;
            outlineY += (y - outlineY) * 0.16;
            cursorOutline.style.left = `${outlineX}px`;
            cursorOutline.style.top = `${outlineY}px`;
            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        document.querySelectorAll('a, button, .tilt-effect').forEach((item) => {
            item.addEventListener('mouseenter', () => body.classList.add('cursor-active'));
            item.addEventListener('mouseleave', () => body.classList.remove('cursor-active'));
        });
    }

    let words = translations[currentLang].typewriter;
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
            words = translations[currentLang].typewriter;
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

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                activateSection(entry.target.id);
            }
        });
    }, {
        root: scrollRoot,
        threshold: 0.55
    });

    sections.forEach((section) => sectionObserver.observe(section));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        root: scrollRoot,
        threshold: 0.12
    });

    revealElements.forEach((element) => revealObserver.observe(element));

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

    if (finePointer.matches && !reducedMotion.matches) {
        tiltElements.forEach((element) => {
            element.addEventListener('mousemove', (event) => {
                const rect = element.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const rotateX = ((y / rect.height) - 0.5) * -8;
                const rotateY = ((x / rect.width) - 0.5) * 8;
                element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        field.remove();
    }

    document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await copyText(button.dataset.copy);
                showToast(t('toast.numberCopied'));
            } catch (error) {
                showToast(t('toast.copyFailed'));
            }
        });
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

        const url = getProfileUrl();
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

    window.tojiRenderQr();

    downloadContact?.addEventListener('click', () => {
        const url = getProfileUrl();
        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            'FN:Mohamed Mostafa',
            'N:Mostafa;Mohamed;;;',
            'NICKNAME:TOJI',
            'TEL;TYPE=CELL:+201102550730',
            `URL:${url}`,
            'X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/mouhamedmostafffa',
            'X-SOCIALPROFILE;TYPE=tiktok:https://tiktok.com/@mouhamedmostafffa',
            'X-SOCIALPROFILE;TYPE=snapchat:https://www.snapchat.com/add/dr.toji',
            'END:VCARD'
        ].join('\r\n');

        downloadFile('TOJI-contact.vcf', `${vcard}\r\n`, 'text/vcard;charset=utf-8');
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

            downloadFile('TOJI-qr.png', blob, 'image/png');
            showToast(t('toast.qrDownloaded'));
        }, 'image/png');
    });

    shareProfile?.addEventListener('click', async () => {
        const url = getProfileUrl();
        const shareData = {
            title: 'TOJI | Mohamed Mostafa',
            text: t('share.profileText'),
            url
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast(t('toast.shared'));
            } else {
                await copyText(url);
                showToast(t('toast.profileCopied'));
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                showToast(t('toast.shareFailed'));
            }
        }
    });

    function finishLoading() {
        body.classList.remove('is-loading');
        body.classList.add('is-ready');
    }

    window.addEventListener('load', () => {
        setTimeout(finishLoading, mobileViewport.matches ? 220 : 360);
    }, { once: true });

    setTimeout(finishLoading, 1200);

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
