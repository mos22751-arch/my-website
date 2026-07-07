(function () {
    // ============================================================
    // Auth: JWT via Backend API (replaces hardcoded password)
    // ============================================================
    const STORAGE_KEY = 'toji_content_override';
    const AUTOSAVE_DELAY = 420;
    const IMAGE_DATA_PLACEHOLDER = '__TOJI_IMAGE_DATA_URL__';
    const PROFILE_PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22320%22 height%3D%22320%22 viewBox%3D%220 0 320 320%22%3E%3Crect width%3D%22320%22 height%3D%22320%22 rx%3D%22160%22 fill%3D%22%23101722%22%2F%3E%3Ccircle cx%3D%22160%22 cy%3D%22125%22 r%3D%2252%22 fill%3D%22%236ec6ff%22 opacity%3D%22.55%22%2F%3E%3Cpath d%3D%22M70 276c16-55 52-85 90-85s74 30 90 85%22 fill%3D%22%236ec6ff%22 opacity%3D%22.38%22%2F%3E%3C%2Fsvg%3E';
    const OWNER_CREDIT_TEXT = 'Website created by:';
    const OWNER_CREDIT_HANDLE = '@mouhamedmostafffa';
    const OWNER_CREDIT_URL = 'https://www.instagram.com/mouhamedmostafffa';

    // ---- Check for existing JWT token ----
    const _api = window.TojiAPI;
    const _existingToken = _api?.TokenManager?.get?.();

    if (!_existingToken) {
        // No token found → show the auth experience (login + forgot-password) connected to backend
        renderAuthExperience(_api);
        return;
    }

    // ============================================================
    // Auth Experience — تسجيل الدخول + نسيت كلمة المرور
    // شاشة واحدة بتتنقل بين 4 أقسام: دخول / اختيار طريقة الاستعادة /
    // إدخال الكود وكلمة مرور جديدة / نجاح العملية
    // ============================================================
    function renderAuthExperience(api) {
        document.body.innerHTML = `
            <main class="auth-shell">
                <div class="auth-orb auth-orb-1"></div>
                <div class="auth-orb auth-orb-2"></div>

                <div class="auth-card" id="authCard">
                    <div class="auth-brand">
                        <span class="auth-logo">T</span>
                        <div>
                            <p class="auth-brand-kicker">TOJI ADMIN STUDIO</p>
                            <p class="auth-brand-sub">لوحة تحكم الموقع</p>
                        </div>
                    </div>

                    <!-- ══ شاشة: تسجيل الدخول ══ -->
                    <section class="auth-screen" id="screenLogin">
                        <h1 class="auth-title">أهلاً بيك 👋</h1>
                        <p class="auth-subtitle">سجّل دخولك عشان توصل للوحة التحكم</p>

                        <form class="auth-form" id="adminLoginForm" novalidate>
                            <label class="auth-field">
                                <span class="auth-field-label">الإيميل</span>
                                <div class="auth-input-wrap">
                                    <span class="auth-input-icon" aria-hidden="true">✉️</span>
                                    <input id="adminEmailInput" type="email" autocomplete="email" autofocus placeholder="admin@toji.dev">
                                </div>
                            </label>
                            <label class="auth-field">
                                <span class="auth-field-label">كلمة المرور</span>
                                <div class="auth-input-wrap">
                                    <span class="auth-input-icon" aria-hidden="true">🔒</span>
                                    <input id="adminPasswordInput" type="password" autocomplete="current-password" placeholder="••••••••">
                                    <button type="button" class="auth-visibility-btn" id="toggleLoginPw" aria-label="إظهار كلمة المرور">👁</button>
                                </div>
                            </label>

                            <button type="submit" class="auth-submit-btn" id="loginSubmitBtn"><span>دخول</span></button>
                            <button type="button" class="auth-link-btn auth-forgot-link" id="showForgotBtn">نسيت كلمة المرور؟</button>

                            <p class="auth-msg" id="adminLoginMsg" role="status" aria-live="polite"></p>
                        </form>
                    </section>

                    <!-- ══ شاشة: اختيار طريقة الاستعادة ══ -->
                    <section class="auth-screen" id="screenForgotChoose" hidden>
                        <h1 class="auth-title">استعادة كلمة المرور</h1>
                        <p class="auth-subtitle">هتستلم كود تحقق مكوّن من 6 أرقام. اختار إزاي تستلمه:</p>

                        <div class="auth-method-list">
                            <button type="button" class="auth-method-btn" data-method="email" id="methodEmailBtn">
                                <span class="auth-method-icon">✉️</span>
                                <span class="auth-method-text">
                                    <strong>عن طريق الإيميل</strong>
                                    <small>هيوصلك كود على إيميل الاستعادة المسجل</small>
                                </span>
                                <span class="auth-method-arrow">←</span>
                            </button>
                            <button type="button" class="auth-method-btn" data-method="phone" id="methodPhoneBtn">
                                <span class="auth-method-icon">💬</span>
                                <span class="auth-method-text">
                                    <strong>عن طريق واتساب</strong>
                                    <small>هيوصلك كود على واتساب الرقم المسجل</small>
                                </span>
                                <span class="auth-method-arrow">←</span>
                            </button>
                        </div>

                        <p class="auth-msg" id="forgotChooseMsg" role="status" aria-live="polite"></p>
                        <button type="button" class="auth-link-btn" id="backToLoginBtn1">↩ رجوع لتسجيل الدخول</button>
                    </section>

                    <!-- ══ شاشة: إدخال الكود + كلمة مرور جديدة ══ -->
                    <section class="auth-screen" id="screenForgotVerify" hidden>
                        <h1 class="auth-title">تأكيد الكود</h1>
                        <p class="auth-subtitle" id="verifySubtitle">اكتب الكود اللي وصلك وكلمة مرور جديدة</p>

                        <form class="auth-form" id="resetPasswordForm" novalidate>
                            <label class="auth-field">
                                <span class="auth-field-label">كود التحقق (6 أرقام)</span>
                                <div class="auth-input-wrap">
                                    <span class="auth-input-icon" aria-hidden="true">🔑</span>
                                    <input id="resetCodeInput" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="000000" class="auth-code-input">
                                </div>
                            </label>
                            <label class="auth-field">
                                <span class="auth-field-label">كلمة المرور الجديدة</span>
                                <div class="auth-input-wrap">
                                    <span class="auth-input-icon" aria-hidden="true">🔒</span>
                                    <input id="newPasswordInput" type="password" autocomplete="new-password" placeholder="8 حروف على الأقل">
                                    <button type="button" class="auth-visibility-btn" id="toggleNewPw" aria-label="إظهار كلمة المرور">👁</button>
                                </div>
                            </label>
                            <label class="auth-field">
                                <span class="auth-field-label">تأكيد كلمة المرور</span>
                                <div class="auth-input-wrap">
                                    <span class="auth-input-icon" aria-hidden="true">🔒</span>
                                    <input id="confirmPasswordInput" type="password" autocomplete="new-password" placeholder="اعد كتابة كلمة المرور">
                                </div>
                            </label>

                            <button type="submit" class="auth-submit-btn" id="resetSubmitBtn"><span>تغيير كلمة المرور</span></button>

                            <div class="auth-secondary-row">
                                <button type="button" class="auth-link-btn" id="resendCodeBtn">إعادة إرسال الكود</button>
                                <button type="button" class="auth-link-btn" id="backToLoginBtn2">↩ رجوع لتسجيل الدخول</button>
                            </div>

                            <p class="auth-msg" id="resetMsg" role="status" aria-live="polite"></p>
                        </form>
                    </section>

                    <!-- ══ شاشة: نجاح العملية ══ -->
                    <section class="auth-screen auth-screen-center" id="screenForgotSuccess" hidden>
                        <div class="auth-success-icon">✅</div>
                        <h1 class="auth-title">تم بنجاح</h1>
                        <p class="auth-subtitle">اتغيرت كلمة المرور. سجّل دخولك بكلمة المرور الجديدة.</p>
                        <button type="button" class="auth-submit-btn" id="goToLoginBtn"><span>تسجيل الدخول</span></button>
                    </section>
                </div>
            </main>
        `;

        const $ = (id) => document.getElementById(id);
        const screens = ['screenLogin', 'screenForgotChoose', 'screenForgotVerify', 'screenForgotSuccess'];
        const showScreen = (id) => {
            screens.forEach((s) => { $(s).hidden = (s !== id); });
        };

        let currentMethod = null;
        let resendTimer = null;

        const startResendCooldown = (seconds) => {
            const btn = $('resendCodeBtn');
            if (!btn) return;
            clearInterval(resendTimer);
            let remaining = seconds;
            btn.disabled = true;
            const tick = () => {
                btn.textContent = remaining > 0 ? `إعادة الإرسال بعد ${remaining} ث` : 'إعادة إرسال الكود';
                if (remaining <= 0) {
                    clearInterval(resendTimer);
                    btn.disabled = false;
                }
                remaining -= 1;
            };
            tick();
            resendTimer = setInterval(tick, 1000);
        };

        const requestCode = async (method, msgTargetId) => {
            const msgEl = $(msgTargetId);
            try {
                const response = await api.AuthAPI.forgotPassword(method);
                currentMethod = method;
                $('verifySubtitle').textContent = response.message || 'تم إرسال الكود.';
                showScreen('screenForgotVerify');
                $('resetMsg').textContent = '';
                $('resetCodeInput').value = '';
                startResendCooldown(60);
                return true;
            } catch (error) {
                if (msgEl) msgEl.textContent = error.message || 'حصل خطأ أثناء إرسال الكود.';
                return false;
            }
        };

        // ---- تبديل إظهار كلمة المرور ----
        const wireVisibilityToggle = (btnId, inputId) => {
            const btn = $(btnId);
            const input = $(inputId);
            if (!btn || !input) return;
            btn.addEventListener('click', () => {
                const isPw = input.type === 'password';
                input.type = isPw ? 'text' : 'password';
                btn.textContent = isPw ? '🙈' : '👁';
            });
        };
        wireVisibilityToggle('toggleLoginPw', 'adminPasswordInput');
        wireVisibilityToggle('toggleNewPw', 'newPasswordInput');

        // ---- نموذج تسجيل الدخول ----
        $('adminLoginForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const email    = $('adminEmailInput').value.trim();
            const password = $('adminPasswordInput').value;
            const btn      = $('loginSubmitBtn');
            const msgEl    = $('adminLoginMsg');

            if (!email || !password) {
                msgEl.textContent = 'من فضلك أدخل الإيميل وكلمة المرور.';
                return;
            }

            btn.disabled = true;
            btn.classList.add('is-loading');
            msgEl.textContent = '';

            try {
                const response = await api.AuthAPI.login(email, password);
                api.TokenManager.set(response.token);
                window.location.reload();
            } catch (error) {
                msgEl.textContent = error.message || 'الإيميل أو كلمة المرور غلط.';
                btn.disabled = false;
                btn.classList.remove('is-loading');
            }
        });

        // ---- الانتقال لشاشة اختيار طريقة الاستعادة ----
        $('showForgotBtn').addEventListener('click', () => {
            $('forgotChooseMsg').textContent = '';
            showScreen('screenForgotChoose');
        });

        // ---- اختيار طريقة الاستعادة (إيميل / هاتف) ----
        ['methodEmailBtn', 'methodPhoneBtn'].forEach((id) => {
            $(id).addEventListener('click', async () => {
                const method = $(id).dataset.method;
                document.querySelectorAll('.auth-method-btn').forEach((b) => { b.disabled = true; });
                $('forgotChooseMsg').textContent = 'جاري إرسال الكود...';
                const ok = await requestCode(method, 'forgotChooseMsg');
                document.querySelectorAll('.auth-method-btn').forEach((b) => { b.disabled = false; });
                if (ok) $('forgotChooseMsg').textContent = '';
            });
        });

        // ---- إعادة إرسال الكود ----
        $('resendCodeBtn').addEventListener('click', async () => {
            if (!currentMethod || $('resendCodeBtn').disabled) return;
            $('resetMsg').textContent = '';
            await requestCode(currentMethod, 'resetMsg');
        });

        // ---- تأكيد الكود وتعيين كلمة مرور جديدة ----
        $('resetPasswordForm').addEventListener('submit', async (event) => {
            event.preventDefault();
            const code            = $('resetCodeInput').value.trim();
            const newPassword     = $('newPasswordInput').value;
            const confirmPassword = $('confirmPasswordInput').value;
            const btn             = $('resetSubmitBtn');
            const msgEl           = $('resetMsg');

            if (!/^\d{6}$/.test(code)) {
                msgEl.textContent = 'اكتب كود التحقق المكوّن من 6 أرقام.';
                return;
            }
            if (newPassword.length < 8) {
                msgEl.textContent = 'كلمة المرور لازم تكون 8 حروف على الأقل.';
                return;
            }
            if (newPassword !== confirmPassword) {
                msgEl.textContent = 'كلمة المرور وتأكيدها مش متطابقين.';
                return;
            }

            btn.disabled = true;
            btn.classList.add('is-loading');
            msgEl.textContent = '';

            try {
                await api.AuthAPI.resetPassword(code, newPassword);
                clearInterval(resendTimer);
                showScreen('screenForgotSuccess');
            } catch (error) {
                msgEl.textContent = error.message || 'حصل خطأ أثناء تغيير كلمة المرور.';
            } finally {
                btn.disabled = false;
                btn.classList.remove('is-loading');
            }
        });

        // ---- أزرار الرجوع لتسجيل الدخول ----
        ['backToLoginBtn1', 'backToLoginBtn2', 'goToLoginBtn'].forEach((id) => {
            $(id).addEventListener('click', () => {
                clearInterval(resendTimer);
                $('adminLoginMsg').textContent = '';
                showScreen('screenLogin');
            });
        });
    }

    // ---- Token exists — proceed to admin panel ----
    // الـ token موجود → نفتح الأدمن مباشرة بدون verify call
    // لو انتهت صلاحيته، الـ save/API calls هتفشل بـ 401 وبيتعامل معها كل call لوحده

    const el = (id) => document.getElementById(id);
    const msg = (text) => {
        const box = el('msg');
        if (box) box.textContent = text;
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value || {}));
    }

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

    function getByPath(obj, path) {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

    function setByPath(obj, path, value) {
        const keys = path.split('.');
        let target = obj;
        for (let i = 0; i < keys.length - 1; i += 1) {
            const key = keys[i];
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                target[key] = {};
            }
            target = target[key];
        }
        target[keys[keys.length - 1]] = value;
    }

    function safeJsonParse(text, fallback = {}) {
        try {
            return JSON.parse(text || '');
        } catch (error) {
            return fallback;
        }
    }

    function isDataUrl(value) {
        return typeof value === 'string' && /^data:image\//i.test(value);
    }

    function compactDataUrlLabel(value) {
        const sizeKb = Math.max(1, Math.round(String(value || '').length * 0.75 / 1024));
        return `صورة مرفوعة داخل البيانات - ${sizeKb} KB`;
    }

    function cloneForJsonDisplay(value) {
        if (isDataUrl(value)) return `${IMAGE_DATA_PLACEHOLDER} ${compactDataUrlLabel(value)}`;
        if (Array.isArray(value)) return value.map(cloneForJsonDisplay);
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneForJsonDisplay(item)]));
        }
        return value;
    }

    function restoreJsonPlaceholders(value, original) {
        if (typeof value === 'string' && value.startsWith(IMAGE_DATA_PLACEHOLDER)) {
            return original;
        }
        if (Array.isArray(value)) {
            return value.map((item, index) => restoreJsonPlaceholders(item, original?.[index]));
        }
        if (value && typeof value === 'object') {
            const result = {};
            Object.keys(value).forEach((key) => {
                result[key] = restoreJsonPlaceholders(value[key], original?.[key]);
            });
            return result;
        }
        return value;
    }

    function updateFullJson() {
        const fullJson = el('fullJson');
        if (fullJson) fullJson.value = JSON.stringify(cloneForJsonDisplay(current), null, 4);
    }

    const defaults = clone(window.TOJI_CONTENT || {});
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY), {});
    let current = deepMerge(defaults, saved);
    let projectDirHandle = null;
    let saveTimer = null;
    let indexTemplate = '';

    const siteFields = [
        { label: 'اللغة الافتراضية', path: 'site.defaultLang', options: [['en', 'English'], ['ar', 'Arabic']] },
        { label: 'الرابط الأساسي Canonical', path: 'site.canonicalUrl' },
        { label: 'تعليمات محركات البحث', path: 'site.robots', options: [['index, follow', 'index, follow'], ['noindex, nofollow', 'noindex, nofollow']] },
        { label: 'لون المتصفح Theme Color', path: 'site.themeColor' },
        { label: 'لون خلفية التطبيق', path: 'site.backgroundColor' },
        { label: 'نوع Schema', path: 'site.schemaType', options: [['Person', 'Person'], ['Organization', 'Organization']] }
    ];

    const identityFields = [
        { label: 'اسم العميل', path: 'profile.name' },
        { label: 'اسم البراند/الموقع', path: 'profile.nickname' },
        { label: 'نص شاشة التحميل', path: 'profile.loaderMark' },
        { label: 'صورة البروفايل', path: 'profile.image' },
        { label: 'رقم واتساب/الهاتف بدون +', path: 'profile.phone' },
        { label: 'الحالة الإنجليزية', path: 'profile.status.en' },
        { label: 'الحالة العربية', path: 'profile.status.ar' },
        { label: 'الثيم الافتراضي', path: 'profile.themePreset', options: [['neon', 'Neon'], ['midnight', 'Midnight'], ['emerald', 'Emerald'], ['sunset', 'Sunset'], ['aurora', 'Aurora'], ['royal', 'Royal'], ['graphite', 'Graphite']] },
        { label: 'لون Accent الافتراضي', path: 'profile.accent', options: [['cyan', 'Cyan'], ['orange', 'Orange'], ['green', 'Green'], ['violet', 'Violet'], ['gold', 'Gold']] }
    ];

    const socialFields = [
        { label: 'Instagram', path: 'profile.socials.instagram' },
        { label: 'TikTok', path: 'profile.socials.tiktok' },
        { label: 'Snapchat', path: 'profile.socials.snapchat' },
        { label: 'Threads', path: 'profile.socials.threads' }
    ];

    const assetFields = [
        { label: 'Favicon SVG', path: 'profile.assets.favicon' },
        { label: 'Apple Icon', path: 'profile.assets.appleIcon' },
        { label: 'Icon 192', path: 'profile.assets.icon192' },
        { label: 'Icon 512', path: 'profile.assets.icon512' },
        { label: 'Social Preview Image', path: 'profile.assets.socialPreview' },
        { label: 'Media Kit ZIP', path: 'profile.assets.mediaKit' }
    ];

    const shareFields = [
        { label: 'عنوان صورة المشاركة', path: 'profile.shareImage.title' },
        { label: 'وصف صورة المشاركة', path: 'profile.shareImage.subtitle', type: 'textarea' },
        { label: 'Handle داخل صورة المشاركة', path: 'profile.shareImage.handle' },
        { label: 'نص QR داخل صورة المشاركة', path: 'profile.shareImage.scanLabel' },
        { label: 'اسم ملف صورة المشاركة عند التحميل', path: 'profile.shareImage.filename' }
    ];

    const featureFields = [
        { label: 'إظهار About', path: 'sections.about', type: 'checkbox' },
        { label: 'إظهار Work', path: 'sections.work', type: 'checkbox' },
        { label: '📦 إظهار Projects (من الباك اند)', path: 'sections.projects', type: 'checkbox' },
        { label: 'إظهار Services', path: 'sections.services', type: 'checkbox' },
        { label: 'إظهار Pricing', path: 'sections.pricing', type: 'checkbox' },
        { label: 'إظهار Reviews', path: 'sections.testimonials', type: 'checkbox' },
        { label: 'إظهار Gallery', path: 'sections.gallery', type: 'checkbox' },
        { label: 'إظهار FAQ', path: 'sections.faq', type: 'checkbox' },
        { label: 'إظهار Contact/Links', path: 'sections.connect', type: 'checkbox' },
        { label: 'إظهار فورم واتساب', path: 'sections.form', type: 'checkbox' },
        { label: 'إظهار ألوان وثيمات للزائر', path: 'sections.themeControls', type: 'checkbox' }
    ];

    const designFields = [
        { label: 'الخط', path: 'design.fontFamily', options: [['Outfit', 'Outfit'], ['Arial', 'Arial'], ['Tahoma', 'Tahoma'], ['Inter', 'Inter'], ['system-ui', 'System UI']] },
        { label: 'لون Primary', path: 'design.primaryColor' },
        { label: 'لون Accent', path: 'design.accentColor' },
        { label: 'لون Mint', path: 'design.mintColor' },
        { label: 'Demo الحالي', path: 'design.presets.currentDemo', options: [['personal', 'Personal'], ['business', 'Business'], ['creator', 'Creator'], ['clinic', 'Clinic'], ['restaurant', 'Restaurant']] },
        { label: 'Style Preset', path: 'design.presets.currentStyle', options: [['neon', 'Neon'], ['midnight', 'Midnight'], ['emerald', 'Emerald'], ['sunset', 'Sunset'], ['aurora', 'Aurora'], ['royal', 'Royal'], ['graphite', 'Graphite']] }
    ];

    const analyticsFields = [
        { label: 'Google Analytics ID', path: 'analytics.googleAnalyticsId' },
        { label: 'Meta Pixel ID', path: 'analytics.metaPixelId' },
        { label: 'تفعيل UTM Tracking', path: 'analytics.utm.enabled', type: 'checkbox' },
        { label: 'UTM Source', path: 'analytics.utm.source' },
        { label: 'UTM Medium', path: 'analytics.utm.medium' },
        { label: 'UTM Campaign', path: 'analytics.utm.campaign' },
        { label: 'محتوى robots.txt', path: 'site.robotsText', type: 'textarea' },
        { label: 'رابط sitemap.xml', path: 'site.sitemapUrl' }
    ];

    const builderFields = [
        { label: 'Services Eyebrow EN', path: 'marketing.services.eyebrow.en' },
        { label: 'Services Eyebrow AR', path: 'marketing.services.eyebrow.ar' },
        { label: 'Services Title EN', path: 'marketing.services.title.en' },
        { label: 'Services Title AR', path: 'marketing.services.title.ar' },
        { label: 'Pricing Eyebrow EN', path: 'marketing.pricing.eyebrow.en' },
        { label: 'Pricing Eyebrow AR', path: 'marketing.pricing.eyebrow.ar' },
        { label: 'Pricing Title EN', path: 'marketing.pricing.title.en' },
        { label: 'Pricing Title AR', path: 'marketing.pricing.title.ar' },
        { label: 'Reviews Eyebrow EN', path: 'marketing.testimonials.eyebrow.en' },
        { label: 'Reviews Eyebrow AR', path: 'marketing.testimonials.eyebrow.ar' },
        { label: 'Reviews Title EN', path: 'marketing.testimonials.title.en' },
        { label: 'Reviews Title AR', path: 'marketing.testimonials.title.ar' },
        { label: 'Gallery Eyebrow EN', path: 'marketing.gallery.eyebrow.en' },
        { label: 'Gallery Eyebrow AR', path: 'marketing.gallery.eyebrow.ar' },
        { label: 'Gallery Title EN', path: 'marketing.gallery.title.en' },
        { label: 'Gallery Title AR', path: 'marketing.gallery.title.ar' },
        { label: 'FAQ Eyebrow EN', path: 'marketing.faq.eyebrow.en' },
        { label: 'FAQ Eyebrow AR', path: 'marketing.faq.eyebrow.ar' },
        { label: 'FAQ Title EN', path: 'marketing.faq.title.en' },
        { label: 'FAQ Title AR', path: 'marketing.faq.title.ar' },
        { label: 'روابط السوشيال: platform|label|url|icon|enabled', path: 'socialLinks', type: 'lines', lineType: 'socialLinks' },
        { label: 'أزرار CTA: type|label EN|label AR|url|message EN|message AR|enabled', path: 'ctaButtons', type: 'lines', lineType: 'ctaButtons' },
        { label: 'كروت الأعمال: banner|title EN|title AR|copy EN|copy AR|tags comma', path: 'workCards', type: 'lines', lineType: 'workCards' },
        { label: 'رسائل واتساب: value|label EN|label AR|message EN|message AR', path: 'quickMessages', type: 'lines', lineType: 'quickMessages' },
        { label: 'الخدمات: title EN|title AR|copy EN|copy AR', path: 'marketing.services.items', type: 'lines', lineType: 'services' },
        { label: 'الباقات: name EN|name AR|price|features comma', path: 'marketing.pricing.items', type: 'lines', lineType: 'pricing' },
        { label: 'آراء العملاء: name|quote EN|quote AR', path: 'marketing.testimonials.items', type: 'lines', lineType: 'testimonials' },
        { label: 'المعرض: title EN|title AR|image path', path: 'marketing.gallery.items', type: 'lines', lineType: 'gallery' },
        { label: 'FAQ: question EN|question AR|answer EN|answer AR', path: 'marketing.faq.items', type: 'lines', lineType: 'faq' }
    ];

    const translationFields = [
        { label: 'Meta Title', path: 'meta.title' },
        { label: 'Meta Description', path: 'meta.description', type: 'textarea' },
        { label: 'زر اللغة التالي', path: 'lang.nextLabel' },
        { label: 'وصف زر اللغة', path: 'lang.switchLabel' },
        { label: 'Nav: Home', path: 'nav.home' },
        { label: 'Nav: About', path: 'nav.about' },
        { label: 'Nav: Work', path: 'nav.work' },
        { label: 'Nav: Links', path: 'nav.links' },
        { label: 'Hero Eyebrow', path: 'hero.eyebrow' },
        { label: 'Hero Title', path: 'hero.title', type: 'textarea' },
        { label: 'Hero Working Prefix', path: 'hero.working' },
        { label: 'Hero Copy', path: 'hero.copy', type: 'textarea' },
        { label: 'Hero Status', path: 'hero.status' },
        { label: 'Hero CTA', path: 'hero.openLinks' },
        { label: 'Typewriter - سطر لكل كلمة', path: 'typewriter', type: 'array' },
        { label: 'Signal 1 Value', path: 'signals.valueUi' },
        { label: 'Signal 2 Value', path: 'signals.valueJs' },
        { label: 'Signal 3 Value', path: 'signals.valueGym' },
        { label: 'Signal 1 Label', path: 'signals.ui' },
        { label: 'Signal 2 Label', path: 'signals.js' },
        { label: 'Signal 3 Label', path: 'signals.gym' },
        { label: 'Profile Top Text', path: 'profile.live' },
        { label: 'Profile Caption', path: 'profile.caption', type: 'textarea' },
        { label: 'Profile Tag 1', path: 'profile.mobile' },
        { label: 'Profile Tag 2', path: 'profile.fast' },
        { label: 'Profile Tag 3', path: 'profile.personal' },
        { label: 'About Title', path: 'about.title', type: 'textarea' },
        { label: 'About Card 1 Title', path: 'about.card1.title' },
        { label: 'About Card 1 Copy', path: 'about.card1.copy', type: 'textarea' },
        { label: 'About Card 2 Title', path: 'about.card2.title' },
        { label: 'About Card 2 Copy', path: 'about.card2.copy', type: 'textarea' },
        { label: 'About Card 3 Title', path: 'about.card3.title' },
        { label: 'About Card 3 Copy', path: 'about.card3.copy', type: 'textarea' },
        { label: 'About Card 4 Title', path: 'about.card4.title' },
        { label: 'About Card 4 Copy', path: 'about.card4.copy', type: 'textarea' },
        { label: 'Work Title', path: 'work.title', type: 'textarea' },
        { label: 'Work Banner 1', path: 'work.banner1' },
        { label: 'Work Banner 2', path: 'work.banner2' },
        { label: 'Work Banner 3', path: 'work.banner3' },
        { label: 'Work Card 1 Title', path: 'work.card1.title' },
        { label: 'Work Card 1 Copy', path: 'work.card1.copy', type: 'textarea' },
        { label: 'Work Card 2 Title', path: 'work.card2.title' },
        { label: 'Work Card 2 Copy', path: 'work.card2.copy', type: 'textarea' },
        { label: 'Work Card 3 Title', path: 'work.card3.title' },
        { label: 'Work Card 3 Copy', path: 'work.card3.copy', type: 'textarea' },
        { label: 'Tag Profile', path: 'tags.profile' },
        { label: 'Tag Links', path: 'tags.links' },
        { label: 'Tag Mobile', path: 'tags.mobile' },
        { label: 'Tag Share', path: 'tags.share' },
        { label: 'Connect Eyebrow', path: 'connect.eyebrow' },
        { label: 'Connect Title', path: 'connect.title', type: 'textarea' },
        { label: 'Copy Number Button', path: 'connect.copyNumber' },
        { label: 'QR Card Title', path: 'connect.scanTitle' },
        { label: 'QR Card Copy', path: 'connect.scanCopy', type: 'textarea' },
        { label: 'Save Contact Button', path: 'connect.saveContact' },
        { label: 'Download QR Button', path: 'connect.downloadQr' },
        { label: 'Copy Link Button', path: 'connect.copyLink' },
        { label: 'Share Image Button', path: 'connect.shareImage' },
        { label: 'Media Kit Button', path: 'connect.mediaKit' },
        { label: 'Install App Button', path: 'connect.installApp' },
        { label: 'Share Profile Button', path: 'connect.shareProfile' },
        { label: 'QR Profile Tab', path: 'qr.profile' },
        { label: 'Form Eyebrow', path: 'form.eyebrow' },
        { label: 'Form Title', path: 'form.title' },
        { label: 'Form Name Label', path: 'form.name' },
        { label: 'Form Type Label', path: 'form.type' },
        { label: 'Form Message Label', path: 'form.message' },
        { label: 'Form Name Placeholder', path: 'form.namePlaceholder' },
        { label: 'Form Message Placeholder', path: 'form.messagePlaceholder', type: 'textarea' },
        { label: 'Form Option 1', path: 'form.personal' },
        { label: 'Form Option 2', path: 'form.business' },
        { label: 'Form Option 3', path: 'form.linkHub' },
        { label: 'Form Submit', path: 'form.send' },
        { label: 'Accent Label', path: 'accent.label' },
        { label: 'Preset Label', path: 'preset.label' },
        { label: 'Preset Neon', path: 'preset.neon' },
        { label: 'Preset Midnight', path: 'preset.midnight' },
        { label: 'Preset Emerald', path: 'preset.emerald' },
        { label: 'Preset Sunset', path: 'preset.sunset' },
        { label: 'Preset Aurora', path: 'preset.aurora' },
        { label: 'Preset Royal', path: 'preset.royal' },
        { label: 'Preset Graphite', path: 'preset.graphite' },
        { label: 'Preset Shuffle', path: 'preset.shuffle' },
        { label: 'ARIA Scroll About', path: 'aria.scrollAbout' },
        { label: 'ARIA Contact Card', path: 'aria.contactCard' },
        { label: 'ARIA Quick Nav', path: 'aria.quickNav' },
        { label: 'ARIA Accent Colors', path: 'aria.accentColors' },
        { label: 'ARIA Theme Presets', path: 'aria.themePresets' },
        { label: 'WhatsApp Share Message', path: 'share.whatsappMessage', type: 'textarea' },
        { label: 'Profile Share Text', path: 'share.profileText', type: 'textarea' },
        { label: 'Brief Intro', path: 'share.briefIntro', type: 'textarea' },
        { label: 'Toast Number Copied', path: 'toast.numberCopied' },
        { label: 'Toast Copy Failed', path: 'toast.copyFailed' },
        { label: 'Toast Contact Downloaded', path: 'toast.contactDownloaded' },
        { label: 'Toast QR Loading', path: 'toast.qrLoading' },
        { label: 'Toast QR Download Failed', path: 'toast.qrDownloadFailed' },
        { label: 'Toast QR Downloaded', path: 'toast.qrDownloaded' },
        { label: 'Toast Shared', path: 'toast.shared' },
        { label: 'Toast Profile Copied', path: 'toast.profileCopied' },
        { label: 'Toast Share Failed', path: 'toast.shareFailed' },
        { label: 'Toast Accent Saved', path: 'toast.accentSaved' },
        { label: 'Toast Preset Saved', path: 'toast.presetSaved' },
        { label: 'Toast Share Image Ready', path: 'toast.shareImageReady' },
        { label: 'Theme To Light', path: 'theme.toLight' },
        { label: 'Theme To Dark', path: 'theme.toDark' }
    ];

    function boolText(value) {
        return value === true || value === 'true' || value === '1' || value === 'yes' || value === 'on';
    }

    const lineSerializers = {
        socialLinks: {
            toText: (items = []) => items.map((item) => [item.platform, item.label, item.url, item.icon, item.enabled !== false].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [platform = '', label = '', url = '', icon = '', enabled = 'true'] = line.split('|').map((part) => part.trim());
                return platform || label || url ? { platform, label, url, icon: icon || platform, enabled: boolText(enabled) } : null;
            }).filter(Boolean)
        },
        ctaButtons: {
            toText: (items = []) => items.map((item) => [item.type, item.label?.en, item.label?.ar, item.url, item.message?.en, item.message?.ar, item.enabled !== false].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [type = '', labelEn = '', labelAr = '', url = '', messageEn = '', messageAr = '', enabled = 'true'] = line.split('|').map((part) => part.trim());
                return type || labelEn || url ? { type, label: { en: labelEn, ar: labelAr || labelEn }, url, message: { en: messageEn, ar: messageAr || messageEn }, enabled: boolText(enabled) } : null;
            }).filter(Boolean)
        },
        workCards: {
            toText: (items = []) => items.map((item) => [item.banner, item.title?.en, item.title?.ar, item.copy?.en, item.copy?.ar, (item.tags || []).join(', ')].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [banner = '', titleEn = '', titleAr = '', copyEn = '', copyAr = '', tags = ''] = line.split('|').map((part) => part.trim());
                return titleEn || titleAr ? { banner, title: { en: titleEn, ar: titleAr || titleEn }, copy: { en: copyEn, ar: copyAr || copyEn }, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) } : null;
            }).filter(Boolean)
        },
        quickMessages: {
            toText: (items = []) => items.map((item) => [item.value, item.label?.en, item.label?.ar, item.message?.en, item.message?.ar].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [value = '', labelEn = '', labelAr = '', messageEn = '', messageAr = ''] = line.split('|').map((part) => part.trim());
                return value || labelEn ? { value, label: { en: labelEn, ar: labelAr || labelEn }, message: { en: messageEn, ar: messageAr || messageEn } } : null;
            }).filter(Boolean)
        },
        services: {
            toText: (items = []) => items.map((item) => [item.title?.en, item.title?.ar, item.copy?.en, item.copy?.ar].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [titleEn = '', titleAr = '', copyEn = '', copyAr = ''] = line.split('|').map((part) => part.trim());
                return titleEn || titleAr ? { title: { en: titleEn, ar: titleAr || titleEn }, copy: { en: copyEn, ar: copyAr || copyEn } } : null;
            }).filter(Boolean)
        },
        pricing: {
            toText: (items = []) => items.map((item) => [item.name?.en, item.name?.ar, item.price, (item.features || []).join(', ')].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [nameEn = '', nameAr = '', price = '', features = ''] = line.split('|').map((part) => part.trim());
                return nameEn || nameAr ? { name: { en: nameEn, ar: nameAr || nameEn }, price, features: features.split(',').map((feature) => feature.trim()).filter(Boolean) } : null;
            }).filter(Boolean)
        },
        testimonials: {
            toText: (items = []) => items.map((item) => [item.name, item.quote?.en, item.quote?.ar].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [name = '', quoteEn = '', quoteAr = ''] = line.split('|').map((part) => part.trim());
                return name || quoteEn ? { name, quote: { en: quoteEn, ar: quoteAr || quoteEn } } : null;
            }).filter(Boolean)
        },
        gallery: {
            toText: (items = []) => items.map((item) => [item.title?.en, item.title?.ar, item.image].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [titleEn = '', titleAr = '', image = ''] = line.split('|').map((part) => part.trim());
                return titleEn || image ? { title: { en: titleEn, ar: titleAr || titleEn }, image } : null;
            }).filter(Boolean)
        },
        faq: {
            toText: (items = []) => items.map((item) => [item.question?.en, item.question?.ar, item.answer?.en, item.answer?.ar].join('|')).join('\n'),
            fromText: (text) => text.split('\n').map((line) => {
                const [questionEn = '', questionAr = '', answerEn = '', answerAr = ''] = line.split('|').map((part) => part.trim());
                return questionEn || questionAr ? { question: { en: questionEn, ar: questionAr || questionEn }, answer: { en: answerEn, ar: answerAr || answerEn } } : null;
            }).filter(Boolean)
        }
    };

    function buildField(containerId, field, fullPath) {
        const container = el(containerId);
        if (!container) return;

        const label = document.createElement('label');
        const controlType = field.type || (field.options ? 'select' : 'text');
        const previewTarget = field.preview || inferPreviewTarget(fullPath, containerId);
        const titleRow = document.createElement('span');
        const titleText = document.createElement('span');
        const location = document.createElement('span');

        titleRow.className = 'field-title-row';
        titleText.textContent = field.label;
        location.className = 'field-location';
        location.textContent = previewTargetLabel(previewTarget);
        titleRow.append(titleText, location);
        label.appendChild(titleRow);

        if (controlType === 'textarea' || controlType === 'array' || controlType === 'lines') label.dataset.wide = 'true';

        let input;
        if (controlType === 'select') {
            input = document.createElement('select');
            field.options.forEach(([value, text]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                input.appendChild(option);
            });
        } else if (controlType === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            label.classList.add('checkbox-label');
        } else if (controlType === 'textarea' || controlType === 'array') {
            input = document.createElement('textarea');
            input.rows = controlType === 'array' ? 4 : 3;
            input.spellcheck = true;
        } else if (controlType === 'lines') {
            input = document.createElement('textarea');
            input.rows = 5;
            input.spellcheck = true;
            input.dataset.lineType = field.lineType;
        } else {
            input = document.createElement('input');
            input.type = field.inputType || 'text';
        }

        input.dataset.path = fullPath;
        input.dataset.fieldType = controlType;
        input.dataset.previewTarget = previewTarget;
        label.appendChild(input);
        container.appendChild(label);
    }

    function buildFields(containerId, fields) {
        fields.forEach((field) => buildField(containerId, field, field.path));
    }

    function byPath(prefixes = [], exactPaths = []) {
        return (field) => exactPaths.includes(field.path)
            || prefixes.some((prefix) => field.path.startsWith(prefix));
    }

    function buildTranslationGroup(containerId, lang, predicate) {
        translationFields
            .filter(predicate)
            .forEach((field) => buildField(containerId, field, `translations.${lang}.${field.path}`));
    }

    function buildBuilderGroup(containerId, predicate) {
        builderFields
            .filter(predicate)
            .forEach((field) => buildField(containerId, field, field.path));
    }

    function buildLanguagePair(baseId, predicate) {
        buildTranslationGroup(`${baseId}En`, 'en', predicate);
        buildTranslationGroup(`${baseId}Ar`, 'ar', predicate);
    }

    function buildForm() {
        buildFields('identityFields', identityFields);
        buildFields('siteFields', siteFields);
        buildLanguagePair('navFields', byPath(['lang.', 'nav.']));

        buildLanguagePair('heroFields', byPath(['hero.', 'signals.', 'profile.'], ['typewriter']));

        buildLanguagePair('aboutFields', byPath(['about.']));

        buildLanguagePair('workFields', byPath(['work.', 'tags.']));
        buildBuilderGroup('workBuilderFields', (field) => field.path === 'workCards');

        buildFields('socialFields', socialFields);
        buildLanguagePair('connectFields', byPath(['connect.', 'qr.']));
        buildBuilderGroup('connectBuilderFields', (field) => ['socialLinks', 'ctaButtons'].includes(field.path));

        buildLanguagePair('formFields', byPath(['form.']));
        buildBuilderGroup('formBuilderFields', (field) => field.path === 'quickMessages');

        buildBuilderGroup('servicesBuilderFields', byPath(['marketing.services.']));
        buildBuilderGroup('pricingBuilderFields', byPath(['marketing.pricing.']));
        buildBuilderGroup('testimonialsBuilderFields', byPath(['marketing.testimonials.']));
        buildBuilderGroup('galleryBuilderFields', byPath(['marketing.gallery.']));
        buildBuilderGroup('faqBuilderFields', byPath(['marketing.faq.']));

        buildFields('featureFields', featureFields);
        buildFields('designFields', designFields);
        buildLanguagePair('themeFields', byPath(['accent.', 'preset.', 'theme.']));

        buildFields('assetFields', assetFields);
        buildFields('shareFields', shareFields);
        buildLanguagePair('shareTextFields', byPath(['share.']));

        buildFields('analyticsFields', analyticsFields);
        buildLanguagePair('metaFields', byPath(['meta.']));
        buildLanguagePair('toastFields', byPath(['toast.']));
        buildLanguagePair('ariaFields', byPath(['aria.']));
    }

    function setInputValue(input, value) {
        if (input.dataset.fieldType === 'checkbox') {
            input.checked = Boolean(value);
            return;
        }
        if (input.dataset.fieldType === 'array') {
            input.value = Array.isArray(value) ? value.join('\n') : '';
            return;
        }
        if (input.dataset.fieldType === 'lines') {
            input.value = lineSerializers[input.dataset.lineType]?.toText(value || []) || '';
            return;
        }
        if (isDataUrl(value)) {
            input.dataset.rawValue = value;
            input.dataset.compactValue = compactDataUrlLabel(value);
            input.value = input.dataset.compactValue;
            input.classList.add('compact-data-url');
            return;
        }
        delete input.dataset.rawValue;
        delete input.dataset.compactValue;
        input.classList.remove('compact-data-url');
        input.value = value ?? '';
    }

    function readInputValue(input) {
        if (input.dataset.fieldType === 'checkbox') {
            return input.checked;
        }
        if (input.dataset.fieldType === 'array') {
            return input.value
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean);
        }
        if (input.dataset.fieldType === 'lines') {
            return lineSerializers[input.dataset.lineType]?.fromText(input.value || '') || [];
        }
        if (input.dataset.rawValue && input.value === input.dataset.compactValue) {
            return input.dataset.rawValue;
        }
        return input.value.trim();
    }

    function fillForm() {
        document.querySelectorAll('[data-path]').forEach((input) => {
            setInputValue(input, getByPath(current, input.dataset.path));
        });
        updateFullJson();
        renderAdminPreview();
    }

    function collectForm() {
        const next = deepMerge(defaults, current);
        document.querySelectorAll('[data-path]').forEach((input) => {
            setByPath(next, input.dataset.path, readInputValue(input));
        });
        current = next;
        updateFullJson();
        return next;
    }

    function safePhone(value) {
        return String(value || '').replace(/\D+/g, '') || '201102550730';
    }

    function safeNickname(content) {
        return (getByPath(content, 'profile.nickname') || 'TOJI').trim() || 'TOJI';
    }

    function safeName(content) {
        return (getByPath(content, 'profile.name') || 'Mohamed Mostafa').trim() || 'Mohamed Mostafa';
    }

    function tFrom(content, lang, path) {
        return getByPath(content.translations?.[lang], path) ?? path;
    }

    function localized(value, lang) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value[lang] ?? value.en ?? value.ar ?? '';
        }
        return value ?? '';
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeImageSrc(value, fallback = PROFILE_PLACEHOLDER_IMAGE) {
        const src = String(value || '').trim();
        if (!src) return fallback;
        if (/^javascript:/i.test(src)) return fallback;
        return src;
    }

    function previewTargetLabel(target) {
        const labels = {
            home: 'الهيرو',
            about: 'About',
            work: 'Work',
            connect: 'Links',
            form: 'Form',
            theme: 'Theme',
            services: 'Services',
            pricing: 'Pricing',
            testimonials: 'Reviews',
            gallery: 'Gallery',
            faq: 'FAQ',
            seo: 'SEO',
            assets: 'Assets',
            share: 'Share',
            design: 'Design',
            settings: 'Settings',
            advanced: 'JSON'
        };
        return labels[target] || 'الموقع';
    }

    function inferPreviewTarget(path, containerId) {
        if (containerId === 'assetFields') return 'assets';
        if (containerId === 'shareFields' || containerId.startsWith('shareTextFields') || path.includes('.share.')) return 'share';
        if (containerId === 'analyticsFields' || containerId.startsWith('metaFields') || path.startsWith('site.') || path.includes('.meta.')) return 'seo';
        if (containerId === 'designFields') return 'design';
        if (containerId.startsWith('toastFields') || containerId.startsWith('ariaFields')) return 'settings';
        if (path.startsWith('profile.socials') || path === 'socialLinks') return 'connect';
        if (path === 'sections.themeControls') return 'theme';
        if (path.startsWith('sections.')) return path.replace('sections.', '') || 'settings';
        if (path.includes('.lang.') || path.includes('.nav.')) return 'home';
        if (path.includes('.hero.') || path.includes('.typewriter') || path.includes('.signals.') || path.includes('.profile.') || path.startsWith('profile.')) return 'home';
        if (path.includes('.about.')) return 'about';
        if (path.includes('.work.') || path === 'workCards') return 'work';
        if (path.includes('.connect.') || path.includes('.qr.') || path === 'ctaButtons') return 'connect';
        if (path.includes('.form.') || path === 'quickMessages') return 'form';
        if (path.includes('.accent.') || path.includes('.preset.') || path.includes('.theme.')) return 'theme';
        if (path.includes('marketing.services')) return 'services';
        if (path.includes('marketing.pricing')) return 'pricing';
        if (path.includes('marketing.testimonials')) return 'testimonials';
        if (path.includes('marketing.gallery')) return 'gallery';
        if (path.includes('marketing.faq')) return 'faq';
        return 'advanced';
    }

    function markActivePreview(target) {
        document.querySelectorAll('.preview-section').forEach((section) => {
            section.classList.toggle('is-active', section.dataset.previewSection === target);
        });
        const active = document.querySelector(`[data-preview-section="${target}"]`);
        const preview = el('adminPreview');
        if (active && preview && preview.scrollHeight > preview.clientHeight + 8) {
            preview.scrollTo({
                top: Math.max(active.offsetTop - preview.offsetTop - 12, 0),
                behavior: 'smooth'
            });
        }
    }

    function markPreviewEditPath(path, lineIndex = null) {
        document.querySelectorAll('.preview-editable.is-picked').forEach((node) => node.classList.remove('is-picked'));
        document.querySelectorAll('[data-edit-path]').forEach((node) => {
            const samePath = node.dataset.editPath === path;
            const sameLine = lineIndex === undefined || lineIndex === null || node.dataset.editLine === String(lineIndex);
            if (samePath && sameLine) node.classList.add('is-picked');
        });
    }

    function selectTextareaLine(input, lineIndex) {
        if (lineIndex === undefined || lineIndex === null || input.tagName !== 'TEXTAREA') return;
        const index = Number(lineIndex);
        if (!Number.isInteger(index) || index < 0) return;
        const lines = input.value.split('\n');
        if (index >= lines.length) return;
        const start = lines.slice(0, index).reduce((total, line) => total + line.length + 1, 0);
        const end = start + lines[index].length;
        input.setSelectionRange(start, end);
    }

    function focusEditorField(path, lineIndex = null) {
        const input = Array.from(document.querySelectorAll('[data-path]')).find((node) => node.dataset.path === path);
        if (!input) {
            msg('هذا الجزء ثابت أو يتم تعديله من حقل مجمع.');
            return false;
        }

        markPreviewEditPath(path, lineIndex);
        document.querySelectorAll('label.is-active-field').forEach((label) => label.classList.remove('is-active-field'));
        input.closest('label')?.classList.add('is-active-field');
        input.scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => {
            input.focus({ preventScroll: true });
            if (typeof input.select === 'function' && input.tagName !== 'SELECT' && input.type !== 'checkbox') {
                input.select();
            }
            selectTextareaLine(input, lineIndex);
        }, 260);
        markActivePreview(input.dataset.previewTarget);
        msg(`جاهز للتعديل: ${input.closest('label')?.querySelector('.field-title-row span')?.textContent || path}`);
        return true;
    }

    function renderAdminPreview(activeTarget = null) {
        const preview = el('adminPreview');
        if (!preview) return;

        const lang = current.site?.defaultLang || 'en';
        const isAr = lang === 'ar';
        const sections = current.sections || {};
        const profile = current.profile || {};
        const marketing = current.marketing || {};
        const socialLinks = Array.isArray(current.socialLinks) ? current.socialLinks.map((item, index) => ({ ...item, __index: index })).filter((item) => item.enabled !== false && item.url) : [];
        const ctaButtons = Array.isArray(current.ctaButtons) ? current.ctaButtons.map((item, index) => ({ ...item, __index: index })).filter((item) => item.enabled !== false && item.url) : [];
        const workCards = Array.isArray(current.workCards) && current.workCards.length ? current.workCards : [
            {
                banner: tFrom(current, lang, 'work.banner1'),
                title: { [lang]: tFrom(current, lang, 'work.card1.title') },
                copy: { [lang]: tFrom(current, lang, 'work.card1.copy') },
                tags: [tFrom(current, lang, 'tags.profile'), tFrom(current, lang, 'tags.links'), tFrom(current, lang, 'tags.mobile')]
            },
            {
                banner: tFrom(current, lang, 'work.banner2'),
                title: { [lang]: tFrom(current, lang, 'work.card2.title') },
                copy: { [lang]: tFrom(current, lang, 'work.card2.copy') },
                tags: ['CTA', 'SEO', tFrom(current, lang, 'profile.fast')]
            },
            {
                banner: tFrom(current, lang, 'work.banner3'),
                title: { [lang]: tFrom(current, lang, 'work.card3.title') },
                copy: { [lang]: tFrom(current, lang, 'work.card3.copy') },
                tags: ['Bio', 'QR', tFrom(current, lang, 'tags.share')]
            }
        ];

        const sectionClass = (name) => `preview-section${sections[name] === false ? ' is-hidden-section' : ''}`;
        const sectionLabel = (label) => `<span class="preview-section-label">${escapeHtml(label)}</span>`;
        const editLineAttr = (lineIndex) => lineIndex === undefined || lineIndex === null ? '' : ` data-edit-line="${Number(lineIndex)}"`;
        const edit = (path, value, className = '', lineIndex = null) => `<span class="preview-editable ${className}" data-edit-path="${escapeHtml(path)}"${editLineAttr(lineIndex)} title="اضغط للتعديل">${escapeHtml(value)}</span>`;
        const locked = (value, className = '') => `<span class="preview-locked ${className}" title="جزء ثابت">${escapeHtml(value)}</span>`;
        const tEdit = (path, className = '') => edit(`translations.${lang}.${path}`, tFrom(current, lang, path), className);
        const card = (title, copy, extra = '', titlePath = '', copyPath = '', lineIndex = null) => `
            <article class="preview-card" ${titlePath ? `data-edit-path="${escapeHtml(titlePath)}"${editLineAttr(lineIndex)}` : ''}>
                ${extra}
                <h4>${titlePath ? edit(titlePath, title, '', lineIndex) : escapeHtml(title)}</h4>
                <p>${copyPath ? edit(copyPath, copy, '', lineIndex) : escapeHtml(copy)}</p>
            </article>
        `;
        const listCards = (items = [], titleKey = 'title', copyKey = 'copy', editPath = '') => items.map((item, index) => card(
            localized(item[titleKey] || item.name || item.question, lang),
            localized(item[copyKey] || item.quote || item.answer || item.price, lang),
            item.price ? `<span class="preview-pill preview-editable" data-edit-path="${escapeHtml(editPath)}" data-edit-line="${index}">${escapeHtml(item.price)}</span>` : '',
            editPath,
            editPath,
            index
        )).join('');

        if (el('previewLangBadge')) el('previewLangBadge').textContent = lang.toUpperCase();
        preview.dir = isAr ? 'rtl' : 'ltr';
        preview.innerHTML = `
            <div class="preview-map-help">اضغط على أي نص أو زر في الخريطة لفتح مكان تعديله مباشرة.</div>
            <div class="preview-nav">
                <div class="preview-brand">${edit('profile.nickname', safeNickname(current))}<span class="dot">.</span></div>
                <div class="preview-nav-links">
                    <span>${tEdit('nav.home')}</span>
                    <span>${tEdit('nav.about')}</span>
                    <span>${tEdit('nav.work')}</span>
                    <span>${tEdit('nav.links')}</span>
                </div>
            </div>

            <section class="preview-section" data-preview-section="home">
                ${sectionLabel('Hero + Profile')}
                <div class="preview-hero-grid">
                    <div>
                        <p class="preview-eyebrow">${tEdit('hero.eyebrow')}</p>
                        <h3 class="preview-title">${tEdit('hero.title')}</h3>
                        <p class="preview-copy">${tEdit('hero.working')}${edit(`translations.${lang}.typewriter`, (tFrom(current, lang, 'typewriter') || [])[0] || '', 'preview-inline-edit')}</p>
                        <p class="preview-copy">${tEdit('hero.copy')}</p>
                        <div class="preview-actions">
                            <span class="preview-button preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.hero.openLinks`)}">${escapeHtml(tFrom(current, lang, 'hero.openLinks'))}</span>
                            <span class="preview-pill preview-editable" data-edit-path="profile.phone">WhatsApp</span>
                        </div>
                        <div class="preview-signals">
                            <span class="preview-tag">${tEdit('signals.valueUi')} - ${tEdit('signals.ui')}</span>
                            <span class="preview-tag">${tEdit('signals.valueJs')} - ${tEdit('signals.js')}</span>
                            <span class="preview-tag">${tEdit('signals.valueGym')} - ${tEdit('signals.gym')}</span>
                        </div>
                    </div>
                    <aside class="preview-profile-card">
                        <span class="preview-pill preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.profile.live`)}">${escapeHtml(tFrom(current, lang, 'profile.live'))}</span>
                        <img class="preview-photo preview-editable" data-edit-path="profile.image" src="${escapeHtml(safeImageSrc(profile.image))}" alt="">
                        <h4>${edit('profile.nickname', safeNickname(current))}</h4>
                        <p>${tEdit('profile.caption')}</p>
                        <div class="preview-tags">
                            <span class="preview-tag">${tEdit('profile.mobile')}</span>
                            <span class="preview-tag">${tEdit('profile.fast')}</span>
                            <span class="preview-tag">${tEdit('profile.personal')}</span>
                        </div>
                    </aside>
                </div>
            </section>

            <section class="${sectionClass('about')}" data-preview-section="about">
                ${sectionLabel('About')}
                <p class="preview-eyebrow">${tEdit('nav.about')}</p>
                <h3 class="preview-title">${tEdit('about.title')}</h3>
                <div class="preview-card-grid">
                    ${[1, 2, 3, 4].map((num) => card(tFrom(current, lang, `about.card${num}.title`), tFrom(current, lang, `about.card${num}.copy`), '', `translations.${lang}.about.card${num}.title`, `translations.${lang}.about.card${num}.copy`)).join('')}
                </div>
            </section>

            <section class="${sectionClass('work')}" data-preview-section="work">
                ${sectionLabel('Work')}
                <p class="preview-eyebrow">${tEdit('nav.work')}</p>
                <h3 class="preview-title">${tEdit('work.title')}</h3>
                <div class="preview-card-grid">
                    ${workCards.map((item, index) => card(
                        localized(item.title, lang),
                        localized(item.copy, lang),
                        `<span class="preview-pill preview-editable" data-edit-path="workCards" data-edit-line="${index}">${String(index + 1).padStart(2, '0')} / ${escapeHtml(item.banner || '')}</span><div class="preview-tags">${(item.tags || []).map((tag) => `<span class="preview-tag preview-editable" data-edit-path="workCards" data-edit-line="${index}">${escapeHtml(tag)}</span>`).join('')}</div>`,
                        'workCards',
                        'workCards',
                        index
                    )).join('')}
                </div>
            </section>

            <section class="${sectionClass('connect')}" data-preview-section="connect">
                ${sectionLabel('Links + QR')}
                <p class="preview-eyebrow">${tEdit('connect.eyebrow')}</p>
                <h3 class="preview-title">${tEdit('connect.title')}</h3>
                <div class="preview-socials">
                    ${socialLinks.map((item) => `<span class="preview-pill preview-editable" data-edit-path="socialLinks" data-edit-line="${item.__index}">${escapeHtml(item.label || item.platform)}</span>`).join('')}
                    <span class="preview-pill preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.connect.copyNumber`)}">${escapeHtml(tFrom(current, lang, 'connect.copyNumber'))}</span>
                    ${ctaButtons.map((item) => `<span class="preview-button preview-editable" data-edit-path="ctaButtons" data-edit-line="${item.__index}">${escapeHtml(localized(item.label, lang))}</span>`).join('')}
                </div>
                <aside class="preview-contact-card">
                    <div class="preview-tabs">
                        <span class="preview-tab preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.qr.profile`)}">${escapeHtml(tFrom(current, lang, 'qr.profile'))}</span>
                        <span class="preview-tab preview-editable" data-edit-path="profile.phone">WhatsApp</span>
                        <span class="preview-tab preview-editable" data-edit-path="profile.socials.instagram">Instagram</span>
                    </div>
                    <div class="preview-qr preview-editable" data-edit-path="profile.nickname">${escapeHtml(safeNickname(current))}</div>
                    <h4>${tEdit('connect.scanTitle')}</h4>
                    <p>${tEdit('connect.scanCopy')}</p>
                    <div class="preview-utilities">
                        <span class="preview-utility preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.connect.saveContact`)}">${escapeHtml(tFrom(current, lang, 'connect.saveContact'))}</span>
                        <span class="preview-utility preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.connect.downloadQr`)}">${escapeHtml(tFrom(current, lang, 'connect.downloadQr'))}</span>
                        <span class="preview-utility preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.connect.copyLink`)}">${escapeHtml(tFrom(current, lang, 'connect.copyLink'))}</span>
                        <span class="preview-utility preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.connect.shareImage`)}">${escapeHtml(tFrom(current, lang, 'connect.shareImage'))}</span>
                        <span class="preview-utility preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.connect.mediaKit`)}">${escapeHtml(tFrom(current, lang, 'connect.mediaKit'))}</span>
                    </div>
                </aside>
            </section>

            <section class="${sectionClass('form')}" data-preview-section="form">
                ${sectionLabel('WhatsApp Form')}
                <div class="preview-form">
                    <p class="preview-eyebrow">${tEdit('form.eyebrow')}</p>
                    <h4>${tEdit('form.title')}</h4>
                    <div class="preview-form-grid">
                        <div class="preview-input preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.form.namePlaceholder`)}"></div>
                        <div class="preview-input preview-editable" data-edit-path="quickMessages" data-edit-line="0"></div>
                        <div class="preview-input wide preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.form.messagePlaceholder`)}"></div>
                    </div>
                    <span class="preview-button preview-editable" data-edit-path="${escapeHtml(`translations.${lang}.form.send`)}">${escapeHtml(tFrom(current, lang, 'form.send'))}</span>
                </div>
            </section>

            <section class="${sectionClass('themeControls')}" data-preview-section="theme">
                ${sectionLabel('Accent + Theme')}
                <div class="preview-theme-row">
                    <span class="preview-color-line">${tEdit('accent.label')}</span>
                    <span class="preview-swatch primary preview-editable" data-edit-path="design.primaryColor"></span><span class="preview-muted-note preview-editable" data-edit-path="design.primaryColor">${escapeHtml(current.design?.primaryColor || '#39d0ff')}</span>
                    <span class="preview-swatch accent preview-editable" data-edit-path="design.accentColor"></span><span class="preview-muted-note preview-editable" data-edit-path="design.accentColor">${escapeHtml(current.design?.accentColor || '#ff7a3d')}</span>
                    <span class="preview-swatch mint preview-editable" data-edit-path="design.mintColor"></span><span class="preview-muted-note preview-editable" data-edit-path="design.mintColor">${escapeHtml(current.design?.mintColor || '#5ee2a0')}</span>
                    <span class="preview-pill preview-editable" data-edit-path="profile.themePreset">${escapeHtml(tFrom(current, lang, 'preset.label'))}: ${escapeHtml(profile.themePreset || current.design?.presets?.currentStyle || 'neon')}</span>
                </div>
            </section>

            <section class="${sectionClass('services')}" data-preview-section="services">
                ${sectionLabel('Services')}
                <p class="preview-eyebrow">${edit(`marketing.services.eyebrow.${lang}`, localized(marketing.services?.eyebrow, lang) || 'Services')}</p>
                <h3 class="preview-title">${edit(`marketing.services.title.${lang}`, localized(marketing.services?.title, lang))}</h3>
                <div class="preview-card-grid">${listCards(marketing.services?.items, 'title', 'copy', 'marketing.services.items')}</div>
            </section>

            <section class="${sectionClass('pricing')}" data-preview-section="pricing">
                ${sectionLabel('Pricing')}
                <p class="preview-eyebrow">${edit(`marketing.pricing.eyebrow.${lang}`, localized(marketing.pricing?.eyebrow, lang) || 'Pricing')}</p>
                <h3 class="preview-title">${edit(`marketing.pricing.title.${lang}`, localized(marketing.pricing?.title, lang))}</h3>
                <div class="preview-card-grid">${listCards(marketing.pricing?.items, 'name', 'price', 'marketing.pricing.items')}</div>
            </section>

            <section class="${sectionClass('testimonials')}" data-preview-section="testimonials">
                ${sectionLabel('Reviews')}
                <p class="preview-eyebrow">${edit(`marketing.testimonials.eyebrow.${lang}`, localized(marketing.testimonials?.eyebrow, lang) || 'Reviews')}</p>
                <h3 class="preview-title">${edit(`marketing.testimonials.title.${lang}`, localized(marketing.testimonials?.title, lang))}</h3>
                <div class="preview-card-grid">${listCards(marketing.testimonials?.items, 'name', 'quote', 'marketing.testimonials.items')}</div>
            </section>

            <section class="${sectionClass('gallery')}" data-preview-section="gallery">
                ${sectionLabel('Gallery')}
                <p class="preview-eyebrow">${edit(`marketing.gallery.eyebrow.${lang}`, localized(marketing.gallery?.eyebrow, lang) || 'Gallery')}</p>
                <h3 class="preview-title">${edit(`marketing.gallery.title.${lang}`, localized(marketing.gallery?.title, lang))}</h3>
                <div class="preview-card-grid">${(marketing.gallery?.items || []).map((item, index) => card(localized(item.title, lang), item.image || '', `<img class="preview-photo preview-editable" data-edit-path="marketing.gallery.items" data-edit-line="${index}" src="${escapeHtml(safeImageSrc(item.image, 'assets/social-preview.png'))}" alt="">`, 'marketing.gallery.items', 'marketing.gallery.items', index)).join('')}</div>
            </section>

            <section class="${sectionClass('faq')}" data-preview-section="faq">
                ${sectionLabel('FAQ')}
                <p class="preview-eyebrow">${edit(`marketing.faq.eyebrow.${lang}`, localized(marketing.faq?.eyebrow, lang) || 'FAQ')}</p>
                <h3 class="preview-title">${edit(`marketing.faq.title.${lang}`, localized(marketing.faq?.title, lang))}</h3>
                <div class="preview-card-grid">${listCards(marketing.faq?.items, 'question', 'answer', 'marketing.faq.items')}</div>
            </section>

            <section class="preview-section" data-preview-section="assets">
                ${sectionLabel('Images + Files')}
                <div class="preview-card-grid">
                    ${card('Profile image', profile.image || 'لا توجد صورة مخصصة', `<img class="preview-photo preview-editable" data-edit-path="profile.image" src="${escapeHtml(safeImageSrc(profile.image))}" alt="">`, 'profile.image', 'profile.image')}
                    ${card('Social preview', profile.assets?.socialPreview || 'assets/social-preview.png', `<img class="preview-photo preview-editable" data-edit-path="profile.assets.socialPreview" src="${escapeHtml(safeImageSrc(profile.assets?.socialPreview, 'assets/social-preview.png'))}" alt="">`, 'profile.assets.socialPreview', 'profile.assets.socialPreview')}
                </div>
            </section>

            <section class="preview-section" data-preview-section="share">
                ${sectionLabel('Share Image')}
                <div class="preview-share-card">
                    <p class="preview-eyebrow">${edit('profile.shareImage.handle', profile.shareImage?.handle || '@mouhamedmostafffa')}</p>
                    <h3 class="preview-title">${edit('profile.shareImage.title', profile.shareImage?.title || safeNickname(current))}</h3>
                    <p class="preview-copy">${edit('profile.shareImage.subtitle', profile.shareImage?.subtitle || '')}</p>
                    <span class="preview-pill preview-editable" data-edit-path="profile.shareImage.scanLabel">${escapeHtml(profile.shareImage?.scanLabel || 'Scan to connect')}</span>
                </div>
            </section>

            <section class="preview-section" data-preview-section="seo">
                ${sectionLabel('SEO + Analytics')}
                ${card(tFrom(current, lang, 'meta.title'), tFrom(current, lang, 'meta.description'), `<span class="preview-pill preview-editable" data-edit-path="site.robots">${escapeHtml(current.site?.robots || 'index, follow')}</span>`, `translations.${lang}.meta.title`, `translations.${lang}.meta.description`)}
                <p class="preview-muted-note preview-editable" data-edit-path="site.canonicalUrl">Canonical: ${escapeHtml(current.site?.canonicalUrl || './')}</p>
            </section>

            <footer class="preview-owner-credit preview-locked" title="حقوق ثابتة غير قابلة للتعديل من الأدمن">
                <span>${escapeHtml(OWNER_CREDIT_TEXT)}</span>
                <span>${escapeHtml(OWNER_CREDIT_HANDLE)}</span>
            </footer>
       `;

        if (activeTarget) markActivePreview(activeTarget);
    }

    function serializeContent(content) {
        return `window.TOJI_CONTENT = ${JSON.stringify(content, null, 4)};\n`;
    }

    function makeConfig(content) {
        const profile = content.profile || {};
        return {
            name: safeName(content),
            nickname: safeNickname(content),
            loaderMark: profile.loaderMark || safeNickname(content),
            image: profile.image || PROFILE_PLACEHOLDER_IMAGE,
            phone: safePhone(profile.phone),
            themePreset: profile.themePreset || 'neon',
            accent: profile.accent || 'cyan',
            status: profile.status || {},
            socials: profile.socials || {},
            assets: profile.assets || {},
            shareImage: profile.shareImage || {}
        };
    }

    function serializeConfig(content) {
        return `window.TOJI_CONFIG = ${JSON.stringify(makeConfig(content), null, 4)};\n`;
    }

    function makeManifest(content) {
        const profile = content.profile || {};
        const assets = profile.assets || {};
        const site = content.site || {};
        const nickname = safeNickname(content);
        const lang = site.defaultLang || 'en';
        return {
            name: `${nickname} | ${safeName(content)}`,
            short_name: nickname,
            description: tFrom(content, lang, 'meta.description'),
            start_url: './',
            scope: './',
            display: 'standalone',
            background_color: site.backgroundColor || '#050506',
            theme_color: site.themeColor || '#050506',
            orientation: 'portrait-primary',
            icons: [
                {
                    src: assets.icon192 || 'assets/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable'
                },
                {
                    src: assets.icon512 || 'assets/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable'
                }
            ]
        };
    }

    function serializeManifest(content) {
        return `${JSON.stringify(makeManifest(content), null, 4)}\n`;
    }

    function serializeRobots(content) {
        return `${content.site?.robotsText || 'User-agent: *\nAllow: /\nDisallow: /admin.html'}\n`;
    }

    function serializeSitemap(content) {
        const canonical = content.site?.canonicalUrl && content.site.canonicalUrl !== './'
            ? content.site.canonicalUrl.replace(/\/+$/, '/')
            : './';
        const lastmod = new Date().toISOString().slice(0, 10);
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    <url>\n        <loc>${canonical}</loc>\n        <lastmod>${lastmod}</lastmod>\n        <priority>1.0</priority>\n    </url>\n</urlset>\n`;
    }

    function makeSchema(content) {
        const site = content.site || {};
        const profile = content.profile || {};
        const socials = profile.socials || {};
        const lang = site.defaultLang || 'en';
        const sameAs = Object.values(socials).filter(Boolean);
        const schema = {
            '@context': 'https://schema.org',
            '@type': site.schemaType || 'Person',
            name: safeName(content),
            alternateName: safeNickname(content),
            url: site.canonicalUrl || './',
            image: profile.assets?.socialPreview || profile.image || 'assets/social-preview.png',
            telephone: `+${safePhone(profile.phone)}`,
            description: tFrom(content, lang, 'meta.description'),
            sameAs
        };

        if (schema['@type'] === 'Organization') {
            schema.logo = profile.assets?.socialPreview || profile.image || 'assets/social-preview.png';
        }

        return schema;
    }

    function setMeta(doc, type, name, content) {
        const selector = type === 'property' ? `meta[property="${name}"]` : `meta[name="${name}"]`;
        let meta = doc.head.querySelector(selector);
        if (!meta) {
            meta = doc.createElement('meta');
            meta.setAttribute(type, name);
            doc.head.appendChild(meta);
        }
        meta.setAttribute('content', content || '');
    }

    function setLink(doc, rel, href) {
        let link = doc.head.querySelector(`link[rel="${rel}"]`);
        if (!link) {
            link = doc.createElement('link');
            link.setAttribute('rel', rel);
            doc.head.appendChild(link);
        }
        link.setAttribute('href', href || './');
    }

    function ensureOwnerCredit(doc) {
        let credit = doc.querySelector('[data-owner-credit]');
        if (!credit) {
            credit = doc.createElement('footer');
        }

        credit.className = 'owner-credit';
        credit.setAttribute('data-owner-credit', '');
        credit.textContent = '';

        const label = doc.createElement('span');
        label.textContent = OWNER_CREDIT_TEXT;

        const link = doc.createElement('a');
        link.href = OWNER_CREDIT_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = OWNER_CREDIT_HANDLE;

        credit.append(label, link);

        const creditParent = doc.getElementById('pageScroll') || doc.querySelector('main') || doc.body;
        if (credit.parentNode !== creditParent) {
            credit.remove();
            creditParent.appendChild(credit);
        } else if (creditParent.lastElementChild !== credit) {
            creditParent.appendChild(credit);
        }
    }

    function serializeIndex(content, indexText) {
        const doc = new DOMParser().parseFromString(indexText, 'text/html');
        const site = content.site || {};
        const profile = content.profile || {};
        const assets = profile.assets || {};
        const lang = site.defaultLang || 'en';
        const title = tFrom(content, lang, 'meta.title');
        const description = tFrom(content, lang, 'meta.description');
        const nickname = safeNickname(content);
        const phone = safePhone(profile.phone);
        const whatsappMessage = tFrom(content, lang, 'share.whatsappMessage');
        const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.facebook.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none';";

        doc.documentElement.lang = lang;
        doc.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        doc.title = title;

        let cspMeta = doc.head.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspMeta) {
            cspMeta = doc.createElement('meta');
            cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
            doc.head.appendChild(cspMeta);
        }
        cspMeta.setAttribute('content', csp);

        setMeta(doc, 'name', 'description', description);
        setMeta(doc, 'name', 'author', safeName(content));
        setMeta(doc, 'name', 'theme-color', site.themeColor || '#050506');
        setMeta(doc, 'name', 'application-name', nickname);
        setMeta(doc, 'name', 'apple-mobile-web-app-title', nickname);
        setMeta(doc, 'name', 'robots', site.robots || 'index, follow');
        setMeta(doc, 'property', 'og:title', title);
        setMeta(doc, 'property', 'og:description', description);
        setMeta(doc, 'property', 'og:type', 'website');
        setMeta(doc, 'property', 'og:image', assets.socialPreview || 'assets/social-preview.png');
        setMeta(doc, 'property', 'og:image:alt', `${nickname} preview`);
        setMeta(doc, 'name', 'twitter:card', 'summary_large_image');
        setMeta(doc, 'name', 'twitter:title', title);
        setMeta(doc, 'name', 'twitter:description', description);
        setMeta(doc, 'name', 'twitter:image', assets.socialPreview || 'assets/social-preview.png');
        setLink(doc, 'canonical', site.canonicalUrl || './');

        const favicon = doc.head.querySelector('link[rel="icon"]');
        if (favicon) favicon.setAttribute('href', assets.favicon || 'assets/favicon.svg');
        const appleIcon = doc.head.querySelector('link[rel="apple-touch-icon"]');
        if (appleIcon) appleIcon.setAttribute('href', assets.appleIcon || 'assets/icon-192.png');

        doc.querySelectorAll('[data-i18n]').forEach((node) => {
            const value = tFrom(content, lang, node.dataset.i18n);
            if (value !== node.dataset.i18n) node.textContent = value;
        });

        doc.querySelectorAll('[data-i18n-attr]').forEach((node) => {
            node.dataset.i18nAttr.split(',').forEach((pair) => {
                const [attribute, key] = pair.split(':').map((part) => part.trim());
                const value = tFrom(content, lang, key);
                if (attribute && key && value !== key) node.setAttribute(attribute, value);
            });
        });

        const brandName = doc.getElementById('brandName');
        if (brandName) brandName.textContent = nickname;
        const brandLink = doc.querySelector('.brand');
        if (brandLink) brandLink.setAttribute('aria-label', `${nickname} home`);
        const profileCardName = doc.getElementById('profileCardName');
        if (profileCardName) profileCardName.textContent = nickname;
        const profilePhoto = doc.getElementById('profilePhoto');
        if (profilePhoto) {
            profilePhoto.setAttribute('src', profile.image || PROFILE_PLACEHOLDER_IMAGE);
            profilePhoto.setAttribute('alt', nickname);
        }
        const qrFallback = doc.getElementById('qrFallback');
        if (qrFallback) qrFallback.textContent = nickname;

        doc.querySelectorAll('[data-social]').forEach((link) => {
            const href = profile.socials?.[link.dataset.social] || '';
            if (href) link.setAttribute('href', href);
        });

        doc.querySelectorAll('[data-whatsapp]').forEach((link) => {
            link.setAttribute('href', `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`);
        });

        doc.querySelectorAll('[data-copy]').forEach((button) => {
            button.setAttribute('data-copy', phone);
        });

        const mediaKit = Array.from(doc.querySelectorAll('a[download]'))
            .find((link) => link.getAttribute('href')?.includes('media-kit') || link.textContent.includes(tFrom(content, lang, 'connect.mediaKit')));
        if (mediaKit) mediaKit.setAttribute('href', assets.mediaKit || 'assets/toji-media-kit.zip');

        let schemaScript = doc.getElementById('profileSchema') || doc.querySelector('script[type="application/ld+json"]');
        if (!schemaScript) {
            schemaScript = doc.createElement('script');
            schemaScript.type = 'application/ld+json';
            doc.head.appendChild(schemaScript);
        }
        schemaScript.id = 'profileSchema';
        schemaScript.textContent = `\n    ${JSON.stringify(makeSchema(content), null, 4).replace(/\n/g, '\n    ')}\n    `;
        ensureOwnerCredit(doc);

        return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}\n`;
    }

    function makeClientInfo(content) {
        return {
            generatedAt: new Date().toISOString(),
            siteOwner: safeName(content),
            brand: safeNickname(content),
            phone: safePhone(content.profile?.phone),
            filesToUpload: [
                'index.html',
                'style.css',
                'script.js',
                'content.js',
                'config.js',
                'status.js',
                'manifest.webmanifest',
                'sw.js',
                'site-help.html',
                'README-AR.md',
                'README-EN.md',
                'CHECKLIST-AR.md',
                'LICENSE.txt',
                'assets/',
                'vendor/'
            ],
            note: 'Do not upload admin.html/admin.js to a public site unless you intentionally want to include the local editor.'
        };
    }

    async function fetchIndexTemplate() {
        if (indexTemplate) return indexTemplate;
        try {
            const response = await fetch('index.html', { cache: 'no-store' });
            indexTemplate = await response.text();
        } catch (error) {
            indexTemplate = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>TOJI</title></head><body></body></html>';
        }
        return indexTemplate;
    }

    async function readProjectFile(filename) {
        if (!projectDirHandle) return '';
        try {
            const fileHandle = await projectDirHandle.getFileHandle(filename);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            return '';
        }
    }

    async function makeGeneratedFiles() {
        const content = collectForm();
        const indexSource = await readProjectFile('index.html') || await fetchIndexTemplate();
        return {
            'content.js': serializeContent(content),
            'config.js': serializeConfig(content),
            'manifest.webmanifest': serializeManifest(content),
            'index.html': serializeIndex(content, indexSource),
            'robots.txt': serializeRobots(content),
            'sitemap.xml': serializeSitemap(content),
            'site-info.json': `${JSON.stringify(makeClientInfo(content), null, 4)}\n`
        };
    }

    async function writeFile(filename, text) {
        if (!projectDirHandle) return false;
        try {
            const fileHandle = await projectDirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(text);
            await writable.close();
            return true;
        } catch (error) {
            return false;
        }
    }

    async function writeProjectFiles() {
        const files = await makeGeneratedFiles();
        const results = {};
        for (const [filename, text] of Object.entries(files)) {
            if (filename === 'site-info.json') continue;
            results[filename] = await writeFile(filename, text);
        }
        return results;
    }

    function allWritten(results) {
        return ['content.js', 'config.js', 'manifest.webmanifest', 'index.html', 'robots.txt', 'sitemap.xml'].every((name) => results[name]);
    }

    async function persist(auto = false) {
        collectForm();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

        // ============================================================
        // ✅ مزامنة الإعدادات مع الـ Backend (MongoDB)
        // لما الأدمن يحفظ → الزوار يشوفوا التغييرات من أول تحميل
        // بس بنبعت في الحفظ اليدوي (مش الـ autosave) عشان نقلل الطلبات
        // الـ server save اتنقل لزرار "حفظ على السيرفر" بشكل صريح
        if (!auto) {
            msg('✅ تم الحفظ محلياً — اضغط "حفظ على السيرفر" لرفع التغييرات.');
        }
    }

    function scheduleAutoSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            persist(true);
        }, AUTOSAVE_DELAY);
    }

    function syncPreviewFromInput(input) {
        collectForm();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        renderAdminPreview(input.dataset.previewTarget);
        scheduleAutoSave();
    }

    function downloadText(filename, text, type = 'text/plain;charset=utf-8') {
        const blob = new Blob([text], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 500);
    }

    function downloadBlob(filename, blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 800);
    }

    function makeSlug(value) {
        return String(value || 'public-site')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
            .replace(/^-+|-+$/g, '') || 'public-site';
    }

    function makeReadmeAr(content, includeAdmin) {
        return `# ${safeNickname(content)} | ملفات الموقع

هذه النسخة جاهزة للرفع أو الإرسال للعميل.

## طريقة الرفع

1. ارفع كل الملفات والفولدرات الموجودة في هذا الـ ZIP على الاستضافة.
2. افتح الدومين وتأكد أن الصفحة تعمل.
3. جرّب زر واتساب، QR، الروابط الاجتماعية، وتغيير اللغة.
4. لو عندك دومين نهائي، حدّث canonical و sitemap من لوحة الأدمن قبل التصدير.

## ملفات مهمة

- index.html: الصفحة الرئيسية.
- content.js و config.js: بيانات العميل والمحتوى.
- style.css و script.js: التصميم والتفاعل.
- assets/: الصور والأيقونات.
- vendor/: مكتبات محلية يحتاجها الموقع.

${includeAdmin ? 'هذه النسخة تحتوي ملفات الأدمن للمطور.' : 'هذه نسخة موقع نهائية بدون ملفات الأدمن.'}
`;
    }

    function makeReadmeEn(content, includeAdmin) {
        return `# ${safeNickname(content)} | Website Package

This package is ready to upload as the TOJI website.

## Upload

1. Upload all files and folders from this ZIP to the hosting account.
2. Open the final domain and test the page.
3. Test WhatsApp, QR, social links, and language switching.
4. If you have a final domain, update canonical and sitemap before exporting.

## Important Files

- index.html: main page.
- content.js and config.js: site content and settings.
- style.css and script.js: design and interactions.
- assets/: images and icons.
- vendor/: local libraries used by the page.

${includeAdmin ? 'This developer package includes the admin editor files.' : 'This is a public site package without admin editor files.'}
`;
    }

    function makeChecklistAr(content) {
        return `# Checklist قبل التسليم

- [ ] اسم العميل صحيح: ${safeName(content)}
- [ ] اسم البراند صحيح: ${safeNickname(content)}
- [ ] رقم واتساب صحيح: ${safePhone(content.profile?.phone)}
- [ ] كل الروابط الاجتماعية تفتح بشكل صحيح.
- [ ] الصورة الشخصية وصورة المشاركة موجودين.
- [ ] العنوان والوصف مناسبين للعميل.
- [ ] QR يعمل.
- [ ] زر حفظ جهة الاتصال يعمل.
- [ ] اللغة العربية والإنجليزية سليمة.
- [ ] لا توجد أخطاء في Console.
- [ ] ملفات الأدمن غير موجودة في نسخة العميل النهائية.
`;
    }

    function makeLicenseText(content) {
        return `Website template delivery license

Client: ${safeName(content)}
Brand: ${safeNickname(content)}
Generated: ${new Date().toISOString()}

This package is delivered as a static website customized for TOJI.
Do not resell the customized public version as a separate template unless your sales agreement allows it.
`;
    }

    async function fetchPackageAsset(path) {
        const response = await fetch(path, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Missing ${path}`);
        return new Uint8Array(await response.arrayBuffer());
    }

    function makeCrcTable() {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i += 1) {
            let c = i;
            for (let k = 0; k < 8; k += 1) {
                c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c >>> 0;
        }
        return table;
    }

    const crcTable = makeCrcTable();

    function crc32(bytes) {
        let crc = 0xffffffff;
        bytes.forEach((byte) => {
            crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
        });
        return (crc ^ 0xffffffff) >>> 0;
    }

    function textBytes(text) {
        return new TextEncoder().encode(text);
    }

    function numberBytes(value, size) {
        const bytes = new Uint8Array(size);
        for (let i = 0; i < size; i += 1) {
            bytes[i] = (value >>> (i * 8)) & 0xff;
        }
        return bytes;
    }

    function concatBytes(parts) {
        const length = parts.reduce((total, part) => total + part.length, 0);
        const output = new Uint8Array(length);
        let offset = 0;
        parts.forEach((part) => {
            output.set(part, offset);
            offset += part.length;
        });
        return output;
    }

    function zipDateTime(date = new Date()) {
        const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
        const day = (date.getFullYear() - 1980) << 9 | ((date.getMonth() + 1) << 5) | date.getDate();
        return { time, day };
    }

    function makeZip(entries) {
        const fileParts = [];
        const centralParts = [];
        let offset = 0;
        const { time, day } = zipDateTime();

        entries.forEach((entry) => {
            const filename = textBytes(entry.path.replace(/\\/g, '/'));
            const data = typeof entry.data === 'string' ? textBytes(entry.data) : entry.data;
            const crc = crc32(data);
            const localHeader = concatBytes([
                numberBytes(0x04034b50, 4),
                numberBytes(20, 2),
                numberBytes(0x0800, 2),
                numberBytes(0, 2),
                numberBytes(time, 2),
                numberBytes(day, 2),
                numberBytes(crc, 4),
                numberBytes(data.length, 4),
                numberBytes(data.length, 4),
                numberBytes(filename.length, 2),
                numberBytes(0, 2),
                filename
            ]);

            fileParts.push(localHeader, data);

            const centralHeader = concatBytes([
                numberBytes(0x02014b50, 4),
                numberBytes(20, 2),
                numberBytes(20, 2),
                numberBytes(0x0800, 2),
                numberBytes(0, 2),
                numberBytes(time, 2),
                numberBytes(day, 2),
                numberBytes(crc, 4),
                numberBytes(data.length, 4),
                numberBytes(data.length, 4),
                numberBytes(filename.length, 2),
                numberBytes(0, 2),
                numberBytes(0, 2),
                numberBytes(0, 2),
                numberBytes(0, 2),
                numberBytes(0, 4),
                numberBytes(offset, 4),
                filename
            ]);

            centralParts.push(centralHeader);
            offset += localHeader.length + data.length;
        });

        const centralDirectory = concatBytes(centralParts);
        const endRecord = concatBytes([
            numberBytes(0x06054b50, 4),
            numberBytes(0, 2),
            numberBytes(0, 2),
            numberBytes(entries.length, 2),
            numberBytes(entries.length, 2),
            numberBytes(centralDirectory.length, 4),
            numberBytes(offset, 4),
            numberBytes(0, 2)
        ]);

        return new Blob([concatBytes([...fileParts, centralDirectory, endRecord])], { type: 'application/zip' });
    }

    async function makeWebsitePackage(includeAdmin = false) {
        const files = await makeGeneratedFiles();
        const content = collectForm();
        const staticFiles = [
            'style.css',
            'script.js',
            'status.js',
            'sw.js',
            'site-help.html',
            'assets/favicon.svg',
            'assets/icon-192.png',
            'assets/icon-512.png',
            'assets/profile.webp',
            'assets/social-preview.png',
            'assets/social-preview.svg',
            'assets/toji-media-kit.zip',
            'vendor/lucide.min.js'
        ];
        const adminFiles = ['admin.html', 'admin.css', 'admin.js', 'SELLING-GUIDE-AR.md'];
        const entries = [
            { path: 'index.html', data: files['index.html'] },
            { path: 'content.js', data: files['content.js'] },
            { path: 'config.js', data: files['config.js'] },
            { path: 'manifest.webmanifest', data: files['manifest.webmanifest'] },
            { path: 'robots.txt', data: files['robots.txt'] },
            { path: 'sitemap.xml', data: files['sitemap.xml'] },
            { path: 'site-info.json', data: files['site-info.json'] },
            { path: 'README-AR.md', data: makeReadmeAr(content, includeAdmin) },
            { path: 'README-EN.md', data: makeReadmeEn(content, includeAdmin) },
            { path: 'CHECKLIST-AR.md', data: makeChecklistAr(content) },
            { path: 'LICENSE.txt', data: makeLicenseText(content) }
        ];

        const wantedFiles = includeAdmin ? staticFiles.concat(adminFiles) : staticFiles;
        for (const path of wantedFiles) {
            try {
                entries.push({ path, data: await fetchPackageAsset(path) });
            } catch (error) {
                entries.push({ path: `MISSING-${path.replace(/[\\/]/g, '-')}.txt`, data: `Could not include ${path}. Add it manually if needed.\n` });
            }
        }

        return makeZip(entries);
    }

    function sanitizeOwnerData() {
        current = deepMerge(current, {
            site: {
                defaultLang: 'en',
                canonicalUrl: './',
                robots: 'index, follow',
                themeColor: '#050506',
                backgroundColor: '#050506',
                schemaType: 'Person'
            },
            profile: {
                name: 'Mohamed Mostafa',
                nickname: 'TOJI',
                loaderMark: 'TOJI',
                image: 'assets/profile.webp',
                phone: '201102550730',
                themePreset: 'neon',
                accent: 'cyan',
                status: {
                    en: 'Available for custom pages and clean web builds',
                    ar: 'متاح لصفحات مخصصة ومواقع خفيفة وشكلها مميز'
                },
                socials: {
                    instagram: 'https://instagram.com/mouhamedmostafffa',
                    tiktok: 'https://tiktok.com/@mouhamedmostafffa',
                    snapchat: 'https://www.snapchat.com/add/dr.toji',
                    threads: 'https://www.threads.net/@mouhamedmostafffa',
                    website: './'
                },
                shareImage: {
                    title: 'TOJI',
                    subtitle: 'Personal links, clean pages, QR, contact, and web details in one place.',
                    handle: '@mouhamedmostafffa',
                    scanLabel: 'Scan to connect',
                    filename: 'TOJI-share-card.png'
                }
            }
        });
        fillForm();
    }

    function setPathInput(path, value) {
        const input = document.querySelector(`[data-path="${path}"]`);
        if (input) {
            setInputValue(input, value);
            setByPath(current, path, value);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
            updateFullJson();
            renderAdminPreview(input.dataset.previewTarget);
        }
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function bindImageUpload(inputId, targetPath) {
        const input = el(inputId);
        if (!input) return;
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            const dataUrl = await readFileAsDataUrl(file);
            setPathInput(targetPath, dataUrl);
            await persist(true);
            msg('تم رفع الصورة داخل بيانات القالب. صدّر ZIP بعد الانتهاء.');
        });
    }

    buildForm();
    fillForm();
    fetchIndexTemplate();
    bindImageUpload('profileUpload', 'profile.image');
    bindImageUpload('previewUpload', 'profile.assets.socialPreview');

    document.querySelectorAll('[data-path]').forEach((node) => {
        node.addEventListener('focus', () => {
            document.querySelectorAll('label.is-active-field').forEach((label) => label.classList.remove('is-active-field'));
            node.closest('label')?.classList.add('is-active-field');
            markPreviewEditPath(node.dataset.path);
            markActivePreview(node.dataset.previewTarget);
        });
        node.addEventListener('input', () => syncPreviewFromInput(node));
        node.addEventListener('change', () => syncPreviewFromInput(node));
    });

    const adminPreview = el('adminPreview');
    if (adminPreview) {
        adminPreview.addEventListener('click', (event) => {
            const target = event.target.closest('[data-edit-path]');
            if (!target || !adminPreview.contains(target)) return;
            event.preventDefault();
            event.stopPropagation();
            focusEditorField(target.dataset.editPath, target.dataset.editLine);
        });
    }

    // ============================================================
    // 🔘 TOOLBAR — Backend-Focused Buttons
    // ============================================================

    // --- حالة الاتصال بالسيرفر ---
    // ============================================================
    // 👁 LIVE PREVIEW — iframe + toggle + click-to-edit
    // ============================================================

    const workspace       = document.getElementById('adminWorkspace');
    const previewFrame    = document.getElementById('livePreviewFrame');
    const togglePreviewBtn= document.getElementById('togglePreviewBtn');
    const previewRefreshBtn=document.getElementById('previewRefreshBtn');
    const clickHint       = document.getElementById('previewClickHint');
    const previewTitle    = document.getElementById('previewSectionTitle');

    // Map: section IDs on the site → admin panel ID + panel element
    const sectionToPanel = {
        'home':             { panelId: 'panelHero',     label: 'Hero — الصفحة الرئيسية' },
        'expertise':        { panelId: 'panelAbout',    label: 'About' },
        'work':             { panelId: 'panelWork',     label: 'Work — الأعمال' },
        'projects':         { panelId: 'projectsPanel', label: 'المشاريع' },
        'wip':              { panelId: 'analyticsPanel', label: 'البيانات' },
        'songs':            { panelId: 'songsPanel',    label: 'الأغاني المفضلة' },
        'connect':          { panelId: 'panelLinks',    label: 'Links — التواصل' },
        'quickMessageForm': { panelId: 'panelForm',     label: 'فورم واتساب' },
        'themePanel':       { panelId: 'panelDesign',   label: 'الشكل والأقسام' },
        'faq':              { panelId: 'panelExtra',    label: 'الأقسام الإضافية' },
        'services':         { panelId: 'panelExtra',    label: 'الأقسام الإضافية' },
        'pricing':          { panelId: 'panelExtra',    label: 'الأقسام الإضافية' },
    };

    // Toggle preview open/close
    let previewOpen = false;
    function setPreview(open) {
        previewOpen = open;
        workspace.classList.toggle('preview-open', open);
        if (togglePreviewBtn) {
            togglePreviewBtn.innerHTML = open
                ? '<span class="btn-icon">✕</span> إغلاق المعاينة'
                : '<span class="btn-icon">👁</span> معاينة';
        }
        if (open && previewFrame && !previewFrame.src.includes('index.html')) {
            previewFrame.src = 'index.html';
        }
    }

    if (togglePreviewBtn) {
        togglePreviewBtn.addEventListener('click', () => setPreview(!previewOpen));
    }

    if (previewRefreshBtn && previewFrame) {
        previewRefreshBtn.addEventListener('click', () => {
            previewFrame.src = previewFrame.src;
        });
    }

    // ── Click-to-edit via postMessage ──────────────────────────
    // لما الـ iframe يتحمّل، نحقن script فيه يبعت postMessage لما يضغط على أي section
    if (previewFrame) {
        previewFrame.addEventListener('load', () => {
            try {
                const iframeDoc = previewFrame.contentDocument;
                if (!iframeDoc) return;

                // Inject click tracker into iframe
                const script = iframeDoc.createElement('script');
                script.textContent = `
                    (function() {
                        if (window.__adminTracker) return;
                        window.__adminTracker = true;

                        // Add visual cursor hint to sections
                        document.querySelectorAll('section[id]').forEach(function(sec) {
                            sec.style.cursor = 'crosshair';
                            sec.addEventListener('click', function(e) {
                                e.stopPropagation();
                                window.parent.postMessage({
                                    type: 'toji-section-click',
                                    sectionId: sec.id,
                                    tag: e.target.tagName,
                                    text: (e.target.textContent || '').slice(0, 60)
                                }, '*');
                            }, true);
                        });

                        // Prevent actual navigation in preview
                        document.querySelectorAll('a[href^="#"]').forEach(function(a) {
                            a.addEventListener('click', function(e) {
                                e.preventDefault();
                                var targetId = a.getAttribute('href').slice(1);
                                window.parent.postMessage({
                                    type: 'toji-section-click',
                                    sectionId: targetId
                                }, '*');
                            });
                        });
                    })();
                `;
                iframeDoc.head.appendChild(script);
                if (clickHint) clickHint.style.opacity = '1';
            } catch (err) {
                console.warn('[Admin] Cannot inject into iframe:', err.message);
            }
        });

        // Receive section clicks from iframe
        window.addEventListener('message', (e) => {
            if (e.data?.type !== 'toji-section-click') return;
            const sectionId = e.data.sectionId;
            const mapping   = sectionToPanel[sectionId];
            if (!mapping) return;

            // Update title
            if (previewTitle) previewTitle.textContent = mapping.label;

            // Find the panel
            const targetPanel = document.getElementById(mapping.panelId);
            if (!targetPanel) return;

            // Open the panel if it's a details element
            if (targetPanel.tagName === 'DETAILS') targetPanel.open = true;

            // Scroll to it smoothly
            targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // Flash highlight
            targetPanel.classList.remove('panel-highlight');
            void targetPanel.offsetWidth;
            targetPanel.classList.add('panel-highlight');

            setTimeout(() => targetPanel.classList.remove('panel-highlight'), 1600);

            // Hide hint after first use
            if (clickHint) {
                clickHint.style.opacity = '0';
                setTimeout(() => clickHint.remove(), 400);
            }
        });
    }

    async function checkServerStatus() {
        const dot  = el('statusDot');
        const text = el('statusText');
        dot.className = 'status-dot syncing';
        text.textContent = 'جارٍ التحقق...';
        try {
            const res = await fetch(`${window.TojiAPI ? API_BASE_URL.replace('/api','') : 'https://portfolio-backend-production-1901.up.railway.app'}/health`);
            if (res.ok) {
                dot.className  = 'status-dot online';
                text.textContent = '🟢 السيرفر متصل';
            } else {
                throw new Error();
            }
        } catch {
            dot.className  = 'status-dot offline';
            text.textContent = '🔴 السيرفر غير متاح';
        }
    }

    // --- بنر الحالة ---
    function showBanner(message, type = 'info', duration = 4000) {
        const banner = el('syncBanner');
        banner.className = `sync-banner ${type}`;
        el('syncBannerText').textContent = message;
        banner.hidden = false;
        if (duration > 0) setTimeout(() => { banner.hidden = true; }, duration);
    }

    // تحقق من الاتصال فور فتح الأدمن
    checkServerStatus();
    setInterval(checkServerStatus, 30000); // تحديث كل 30 ثانية

    // ============================================================
    // ☁️ حفظ على السيرفر (الزر الرئيسي)
    // ============================================================
    el('saveServerBtn').addEventListener('click', async () => {
        if (!window.TojiAPI?.ConfigAPI) {
            showBanner('❌ api.js غير محمّل — تأكد من إعدادات الصفحة.', 'error');
            return;
        }

        const btn = el('saveServerBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span> جارٍ الحفظ...';
        el('statusDot').className = 'status-dot syncing';

        collectForm();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

        // إزالة base64 قبل الإرسال
        function stripBase64(obj) {
            if (!obj || typeof obj !== 'object') return obj;
            const clone = Array.isArray(obj) ? [] : {};
            for (const k in obj) {
                const v = obj[k];
                if (typeof v === 'string' && v.startsWith('data:')) clone[k] = '';
                else if (typeof v === 'object') clone[k] = stripBase64(v);
                else clone[k] = v;
            }
            return clone;
        }

        try {
            await window.TojiAPI.ConfigAPI.save(stripBase64(current));
            localStorage.setItem('toji_live_config', JSON.stringify(current));

            el('statusDot').className = 'status-dot online';
            const now = new Date().toLocaleTimeString('ar-EG');
            el('statusText').textContent = `🟢 آخر حفظ: ${now}`;
            showBanner('✅ تم الحفظ على السيرفر — التغييرات ستظهر للزوار فوراً.', 'success');
        } catch (err) {
            el('statusDot').className = 'status-dot offline';
            el('statusText').textContent = '🔴 فشل الحفظ';
            showBanner(`❌ فشل الحفظ: ${err.message || 'تحقق من الاتصال أو سجّل دخول مجدداً.'}`, 'error', 7000);
            console.error('[TOJI] Save failed:', err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">☁️</span> حفظ على السيرفر';
        }
    });

    // ============================================================
    // ⬇️ مزامنة من السيرفر (جيب آخر config من MongoDB)
    // ============================================================
    el('pullServerBtn').addEventListener('click', async () => {
        if (!window.TojiAPI?.ConfigAPI) {
            showBanner('❌ api.js غير محمّل.', 'error');
            return;
        }

        const btn = el('pullServerBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span> جارٍ المزامنة...';

        try {
            const response = await window.TojiAPI.ConfigAPI.get();
            if (response?.data) {
                current = deepMerge(defaults, response.data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
                localStorage.setItem('toji_live_config', JSON.stringify(current));
                fillForm();
                showBanner('✅ تمت المزامنة من السيرفر — تعديلاتك الأخيرة تظهر الآن.', 'success');
            } else {
                showBanner('ℹ️ السيرفر ليس فيه config محفوظ بعد — يظهر المحتوى الافتراضي.', 'info');
            }
        } catch (err) {
            showBanner(`❌ فشلت المزامنة: ${err.message}`, 'error', 6000);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">⬇️</span> مزامنة من السيرفر';
        }
    });

    // ============================================================
    // ↺ إعادة تعيين (رجوع لآخر نسخة محفوظة)
    // ============================================================
    el('resetBtn').addEventListener('click', () => {
        if (!window.confirm('سيتم حذف تعديلاتك الحالية والرجوع لآخر نسخة محفوظة. متابعة؟')) return;
        localStorage.removeItem(STORAGE_KEY);
        current = clone(defaults);
        fillForm();
        showBanner('↺ تم الرجوع للنسخة المحفوظة.', 'info');
    });

    // ============================================================
    // 🚪 تسجيل خروج
    // ============================================================
    el('cleanFinalBtn').addEventListener('click', () => {
        if (!window.confirm('هل تريد تسجيل الخروج؟ سيتم مسح الجلسة.')) return;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('toji_lang');
        localStorage.removeItem('toji_theme');
        localStorage.removeItem('toji_theme_preset');
        localStorage.removeItem('toji_accent');
        localStorage.removeItem('toji_qr_mode');
        localStorage.removeItem('toji_live_config');
        window.TojiAPI?.TokenManager?.remove?.();
        window.location.href = 'admin.html';
    });

    // ============================================================
    // 📦 PROJECTS MANAGER — إدارة المشاريع من الباك اند
    // ============================================================

    let editingProjectId = null;

    // --- تحميل وعرض المشاريع ---
    async function loadProjects() {
        const list = el('projectsList');
        list.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';

        try {
            const res = await window.TojiAPI.ProjectsAPI.getAll();
            const projects = res?.data || [];

            if (!projects.length) {
                list.innerHTML = '<p class="projects-hint">لا توجد مشاريع بعد. أضف أول مشروع!</p>';
                return;
            }

            list.innerHTML = projects.map((p) => `
                <div class="project-card" data-id="${p._id}">
                    ${p.imageUrl ? `<div class="project-card-thumb"><img src="${p.imageUrl}" alt="${p.title?.en || ''}"></div>` : ''}
                    <div class="project-card-header">
                        <span class="project-badge">${p.banner}</span>
                        <div class="project-card-title">
                            <strong>${p.title?.en || ''}</strong>
                            <span>${p.title?.ar || ''}</span>
                        </div>
                        <span class="project-visibility ${p.isVisible ? 'visible' : 'hidden'}">
                            ${p.isVisible ? '👁 ظاهر' : '🚫 مخفي'}
                        </span>
                    </div>
                    <p class="project-card-copy">${p.copy?.en || ''}</p>
                    <div class="project-card-tags">
                        ${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}
                        ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" class="tag tag-link">🔗 رابط</a>` : ''}
                    </div>
                    <div class="project-card-actions">
                        <button class="btn-secondary btn-sm"
                                data-action="edit"
                                data-id="${p._id}">✏️ تعديل</button>
                        <button class="btn-danger btn-sm"
                                data-action="delete"
                                data-id="${p._id}"
                                data-name="${(p.title?.en || '').replace(/"/g, '')}">🗑 حذف</button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            list.innerHTML = `<p class="projects-hint error">❌ فشل التحميل: ${err.message}</p>`;
        }
    }

    // --- عرض معاينة الصورة ---
    function renderProjectImagePreview(url) {
        const preview = el('projectImagePreview');
        const removeBtn = el('removeProjectImageBtn');
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="معاينة المشروع">`;
            removeBtn.hidden = false;
        } else {
            preview.innerHTML = '<span class="project-image-placeholder">🖼️ لا توجد صورة</span>';
            removeBtn.hidden = true;
        }
    }

    // --- رفع صورة على Cloudinary عبر الباك اند ---
    el('pImageFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const statusEl = el('projectImageStatus');
        statusEl.textContent = '⏳ جارٍ رفع الصورة...';
        statusEl.className = 'project-image-status';

        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = window.TojiAPI.TokenManager.get();
            const res = await fetch(`${window.TojiAPI.API_BASE_URL}/upload/image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'فشل رفع الصورة');
            }

            el('pImageUrl').value = data.url;
            renderProjectImagePreview(data.url);
            statusEl.textContent = '✅ تم رفع الصورة بنجاح.';
            statusEl.className = 'project-image-status success';
        } catch (err) {
            statusEl.textContent = '❌ ' + err.message;
            statusEl.className = 'project-image-status error';
        } finally {
            e.target.value = ''; // reset input عشان يقدر يرفع نفس الملف تاني لو عايز
        }
    });

    el('removeProjectImageBtn').addEventListener('click', () => {
        el('pImageUrl').value = '';
        renderProjectImagePreview('');
        el('projectImageStatus').textContent = '';
    });

    // --- فتح فورم إضافة ---
    function openAddForm() {
        editingProjectId = null;
        el('projectFormTitle').textContent = 'مشروع جديد';
        el('projectId').value = '';
        el('pImageUrl').value = '';
        renderProjectImagePreview('');
        el('projectImageStatus').textContent = '';
        el('pBanner').value = '';
        el('pTitleEn').value = '';
        el('pTitleAr').value = '';
        el('pCopyEn').value = '';
        el('pCopyAr').value = '';
        el('pTags').value = '';
        el('pLiveUrl').value = '';
        el('pOrder').value = '0';
        el('pVisible').checked = true;
        el('projectFormMsg').textContent = '';
        el('projectForm').hidden = false;
        el('projectForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- فتح فورم تعديل ---
    async function editProject(id) {
        try {
            const res = await window.TojiAPI.ProjectsAPI.getAll();
            const project = (res?.data || []).find((p) => p._id === id);
            if (!project) return;

            editingProjectId = id;
            el('projectFormTitle').textContent = 'تعديل المشروع';
            el('projectId').value = id;
            el('pImageUrl').value = project.imageUrl || '';
            renderProjectImagePreview(project.imageUrl || '');
            el('projectImageStatus').textContent = '';
            el('pBanner').value = project.banner || '';
            el('pTitleEn').value = project.title?.en || '';
            el('pTitleAr').value = project.title?.ar || '';
            el('pCopyEn').value = project.copy?.en || '';
            el('pCopyAr').value = project.copy?.ar || '';
            el('pTags').value = (project.tags || []).join(', ');
            el('pLiveUrl').value = project.liveUrl || '';
            el('pOrder').value = project.order ?? 0;
            el('pVisible').checked = project.isVisible !== false;
            el('projectFormMsg').textContent = '';
            el('projectForm').hidden = false;
            el('projectForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            showBanner('❌ فشل تحميل بيانات المشروع: ' + err.message, 'error');
        }
    }

    // --- حفظ (إضافة أو تعديل) ---
    el('saveProjectBtn').addEventListener('click', async () => {
        const btn = el('saveProjectBtn');
        const msgEl = el('projectFormMsg');

        const banner  = el('pBanner').value.trim();
        const titleEn = el('pTitleEn').value.trim();
        const titleAr = el('pTitleAr').value.trim();
        const copyEn  = el('pCopyEn').value.trim();
        const copyAr  = el('pCopyAr').value.trim();

        if (!banner || !titleEn || !titleAr || !copyEn || !copyAr) {
            msgEl.textContent = '⚠️ يرجى ملء جميع الحقول المطلوبة.';
            msgEl.className = 'form-msg error';
            return;
        }

        const projectData = {
            banner,
            title: { en: titleEn, ar: titleAr },
            copy:  { en: copyEn,  ar: copyAr  },
            tags:  el('pTags').value.split(',').map((t) => t.trim()).filter(Boolean),
            liveUrl:   el('pLiveUrl').value.trim(),
            imageUrl:  el('pImageUrl').value.trim(),
            order:     parseInt(el('pOrder').value) || 0,
            isVisible: el('pVisible').checked
        };

        btn.disabled = true;
        btn.textContent = '⏳ جارٍ الحفظ...';
        msgEl.textContent = '';

        try {
            if (editingProjectId) {
                await window.TojiAPI.ProjectsAPI.update(editingProjectId, projectData);
                showBanner('✅ تم تعديل المشروع بنجاح.', 'success');
            } else {
                await window.TojiAPI.ProjectsAPI.create(projectData);
                showBanner('✅ تم إضافة المشروع بنجاح.', 'success');
            }

            el('projectForm').hidden = true;
            editingProjectId = null;
            await loadProjects();
        } catch (err) {
            msgEl.textContent = '❌ ' + (err.message || 'حدث خطأ. حاول مجدداً.');
            msgEl.className = 'form-msg error';
        } finally {
            btn.disabled = false;
            btn.textContent = '💾 حفظ المشروع';
        }
    });

    // Event Delegation — بدل onclick في الـ HTML (CSP compliance)
    el('projectsList').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id     = btn.dataset.id;

        if (action === 'delete') {
            const name = btn.dataset.name || 'هذا المشروع';
            if (!window.confirm(`حذف "${name}"؟ لا يمكن التراجع.`)) return;
            btn.disabled = true;
            btn.textContent = '⏳';
            try {
                await window.TojiAPI.ProjectsAPI.delete(id);
                showBanner('✅ تم حذف المشروع.', 'success');
                await loadProjects();
            } catch (err) {
                btn.disabled = false;
                btn.textContent = '🗑 حذف';
                showBanner('❌ فشل الحذف: ' + err.message, 'error');
            }
        }

        if (action === 'edit') {
            await editProject(id);
        }
    });

    el('addProjectBtn').addEventListener('click', openAddForm);

    el('cancelProjectBtn').addEventListener('click', () => {
        el('projectForm').hidden = true;
        editingProjectId = null;
    });

    el('loadProjectsBtn').addEventListener('click', loadProjects);

    // تحميل المشاريع تلقائياً عند فتح الأدمن
    if (window.TojiAPI?.ProjectsAPI) {
        loadProjects();
    }


    // ============================================================
    // 🎵 SONGS MANAGER — إدارة الأغاني المفضلة
    // ============================================================

    async function loadSongs() {
        const btn = el('loadSongsBtn');
        const list = el('songsList');
        if (!list) return;
        if (btn) { btn.disabled = true; btn.textContent = '⏳ جاري التحميل...'; }

        try {
            const res   = await window.TojiAPI.SongsAPI.getAll();
            const songs = res?.data || [];

            if (songs.length === 0) {
                list.innerHTML = '<p class="projects-hint">مفيش أغاني بعد. اضغط "+ إضافة أغنية جديدة".</p>';
            } else {
                const moodEmoji = { chill: '🧊', hype: '🔥', sad: '🌧️', focus: '⚡', vibe: '🎵' };
                list.innerHTML = songs.map((song) => {
                    const emoji = moodEmoji[song.mood] || '🎵';
                    return `
                    <div class="project-item" data-id="${song._id}">
                        <div class="project-item-main">
                            <span class="project-banner">${emoji}</span>
                            <div class="project-item-info">
                                <strong>${song.title}</strong>
                                <span class="project-item-sub">${song.artist}</span>
                                ${song.description ? '<span class="project-item-sub">' + song.description + '</span>' : ''}
                            </div>
                            <span class="project-visibility">${song.visible ? '👁 ظاهر' : '🙈 مخفي'}</span>
                        </div>
                        <div class="project-item-actions">
                            <button class="btn-sm btn-edit" data-song-edit="${song._id}" type="button">✏️ تعديل</button>
                            <button class="btn-sm btn-delete" data-song-delete="${song._id}" type="button">🗑 حذف</button>
                        </div>
                    </div>`;
                }).join('');
            }
        } catch (err) {
            list.innerHTML = '<p class="form-error">⚠️ فشل تحميل الأغاني: ' + err.message + '</p>';
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 تحميل الأغاني'; }
        }
    }

    function clearSongForm() {
        el('songId').value       = '';
        el('sTitle').value       = '';
        el('sArtist').value      = '';
        el('sDesc').value        = '';
        el('sSpotify').value     = '';
        el('sYoutube').value     = '';
        el('sCover').value       = '';
        el('sMood').value        = 'vibe';
        el('sOrder').value       = '0';
        el('sVisible').checked   = true;
        el('songFormMsg').textContent = '';
        el('songFormTitle').textContent = 'أغنية جديدة';
    }

    // ---- أزرار الـ toolbar ----
    el('addSongBtn').addEventListener('click', () => {
        clearSongForm();
        el('songForm').hidden = false;
        el('songForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    el('cancelSongBtn').addEventListener('click', () => {
        el('songForm').hidden = true;
        clearSongForm();
    });

    // ---- حفظ / تعديل أغنية ----
    el('saveSongBtn').addEventListener('click', async () => {
        const id      = el('songId').value.trim();
        const title   = el('sTitle').value.trim();
        const artist  = el('sArtist').value.trim();
        const msgEl   = el('songFormMsg');

        if (!title || !artist) {
            msgEl.textContent = '⚠️ اسم الأغنية والفنان مطلوبان.';
            return;
        }

        const data = {
            title,
            artist,
            description: el('sDesc').value.trim(),
            spotifyUrl:  el('sSpotify').value.trim(),
            youtubeUrl:  el('sYoutube').value.trim(),
            coverUrl:    el('sCover').value.trim(),
            mood:        el('sMood').value,
            order:       Number(el('sOrder').value) || 0,
            visible:     el('sVisible').checked
        };

        const saveBtn = el('saveSongBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ جاري الحفظ...';
        msgEl.textContent = '';

        try {
            if (id) {
                await window.TojiAPI.SongsAPI.update(id, data);
                msgEl.textContent = '✅ تم التعديل بنجاح!';
            } else {
                await window.TojiAPI.SongsAPI.add(data);
                msgEl.textContent = '✅ تمت الإضافة بنجاح!';
            }
            el('songForm').hidden = true;
            clearSongForm();
            await loadSongs();
        } catch (err) {
            msgEl.textContent = '⚠️ فشل الحفظ: ' + err.message;
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 حفظ الأغنية';
        }
    });

    // ---- Event delegation لأزرار التعديل والحذف ----
    el('songsList').addEventListener('click', async (e) => {
        // تعديل
        const editId = e.target.dataset.songEdit;
        if (editId) {
            const res  = await window.TojiAPI.SongsAPI.getAll().catch(() => ({ data: [] }));
            const song = (res?.data || []).find((s) => s._id === editId);
            if (!song) return;
            el('songId').value     = song._id;
            el('sTitle').value     = song.title;
            el('sArtist').value    = song.artist;
            el('sDesc').value      = song.description || '';
            el('sSpotify').value   = song.spotifyUrl  || '';
            el('sYoutube').value   = song.youtubeUrl  || '';
            el('sCover').value     = song.coverUrl    || '';
            el('sMood').value      = song.mood        || 'vibe';
            el('sOrder').value     = song.order       || 0;
            el('sVisible').checked = song.visible !== false;
            el('songFormTitle').textContent = 'تعديل: ' + song.title;
            el('songForm').hidden = false;
            el('songForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // حذف
        const deleteId = e.target.dataset.songDelete;
        if (deleteId) {
            if (!confirm('هتحذف الأغنية دي؟')) return;
            try {
                await window.TojiAPI.SongsAPI.remove(deleteId);
                await loadSongs();
            } catch (err) {
                alert('فشل الحذف: ' + err.message);
            }
        }
    });



    el('loadSongsBtn').addEventListener('click', loadSongs);

    // تحميل تلقائي عند فتح الأدمن
    if (window.TojiAPI?.SongsAPI) {
        loadSongs();
    }

    // ============================================================
    // 📊 ANALYTICS DASHBOARD
    // ============================================================

    let currentVisitorsPage = 1;

    async function loadAnalytics() {
        const btn = el('refreshAnalyticsBtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

        try {
            const res  = await window.TojiAPI.AnalyticsAPI.getStats();
            const data = res?.data;
            if (!data) throw new Error('لا توجد بيانات');

            // الأرقام
            el('statTotal').textContent   = data.counts.total.toLocaleString('ar');
            el('statToday').textContent   = data.counts.today.toLocaleString('ar');
            el('statWeek').textContent    = data.counts.week.toLocaleString('ar');
            el('statMonth').textContent   = data.counts.month.toLocaleString('ar');
            const m = Math.floor(data.avgTime / 60);
            const s = data.avgTime % 60;
            el('statAvgTime').textContent = m > 0 ? `${m}د ${s}ث` : `${s}ث`;

            // الأجهزة
            const deviceIcons = { mobile: '📱', tablet: '📲', desktop: '🖥' };
            const maxDevice = data.deviceStats[0]?.count || 1;
            el('deviceStats').innerHTML = data.deviceStats.map((d) => `
                <div class="stat-row">
                    <span class="stat-row-label">${deviceIcons[d._id] || '💻'} ${d._id}</span>
                    <span class="stat-row-count">${d.count}</span>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width:${(d.count/maxDevice*100).toFixed(0)}%"></div></div>
            `).join('') || '<p class="projects-hint">لا توجد بيانات بعد.</p>';

            // الأقسام
            const maxSec = data.topSections[0]?.count || 1;
            el('sectionStats').innerHTML = data.topSections.map((s) => `
                <div class="stat-row">
                    <span class="stat-row-label">${s._id}</span>
                    <span class="stat-row-count">${s.count}</span>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width:${(s.count/maxSec*100).toFixed(0)}%"></div></div>
            `).join('') || '<p class="projects-hint">لا توجد بيانات بعد.</p>';

            // المشاريع
            const maxProj = data.topProjects[0]?.count || 1;
            el('projectStats').innerHTML = data.topProjects.map((p) => `
                <div class="stat-row">
                    <span class="stat-row-label">${p._id}</span>
                    <span class="stat-row-count">${p.count}</span>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width:${(p.count/maxProj*100).toFixed(0)}%"></div></div>
            `).join('') || '<p class="projects-hint">لا توجد بيانات بعد.</p>';

            showBanner(`✅ تم تحميل إحصائيات ${data.counts.total} زيارة.`, 'success', 3000);

            // جدول الزوار — صفحة منفصلة
            await loadVisitorsPage(1);

        } catch (err) {
            el('visitorsList').innerHTML = `<p class="projects-hint error">❌ فشل التحميل: ${err.message}</p>`;
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 تحديث'; }
        }
    }

    // ============================================================
    // 📄 جدول الزوار بصفحات (1, 2, 3...)
    // ============================================================
    async function loadVisitorsPage(page) {
        currentVisitorsPage = page;
        el('visitorsList').innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';

        try {
            const res = await window.TojiAPI.AnalyticsAPI.getVisitors(page, 20);
            const visitors   = res?.data || [];
            const pagination = res?.pagination || { page: 1, totalPages: 1, total: 0 };

            if (!visitors.length) {
                el('visitorsList').innerHTML = '<p class="projects-hint">لا توجد زيارات مسجّلة بعد.</p>';
                return;
            }

            const icons = { mobile:'📱', tablet:'📲', desktop:'🖥' };
            const rows = visitors.map((v) => {
                const date  = new Date(v.visitedAt).toLocaleString('ar-EG');
                const mins  = Math.floor((v.timeOnSite||0)/60);
                const secs  = (v.timeOnSite||0) % 60;
                const time  = mins > 0 ? `${mins}د ${secs}ث` : `${secs}ث`;
                const sections = (v.sectionsViewed||[]).join(', ') || '—';
                return `<tr>
                    <td><span class="device-icon">${icons[v.device]||'💻'}</span></td>
                    <td><code>${v.ip||'—'}</code></td>
                    <td>${v.browser||'—'}</td>
                    <td>${v.os||'—'}</td>
                    <td title="${sections}">${sections.length > 30 ? sections.slice(0,30)+'…' : sections}</td>
                    <td>${time}</td>
                    <td>${date}</td>
                </tr>`;
            }).join('');

            el('visitorsList').innerHTML = `
                <table class="visitors-table">
                    <thead>
                        <tr>
                            <th>الجهاز</th>
                            <th>IP</th>
                            <th>المتصفح</th>
                            <th>نظام التشغيل</th>
                            <th>الأقسام</th>
                            <th>الوقت</th>
                            <th>تاريخ الزيارة</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                ${renderVisitorsPagination(pagination)}
            `;

            // ربط أزرار الصفحات
            el('visitorsList').querySelectorAll('[data-vpage]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const p = parseInt(btn.dataset.vpage);
                    if (p && p !== currentVisitorsPage) loadVisitorsPage(p);
                });
            });

        } catch (err) {
            el('visitorsList').innerHTML = `<p class="projects-hint error">❌ فشل تحميل الزوار: ${err.message}</p>`;
        }
    }

    function renderVisitorsPagination(pagination) {
        const { page, totalPages, total } = pagination;
        if (totalPages <= 1) {
            return `<p class="visitors-total-count">إجمالي ${total} زيارة</p>`;
        }

        // نطاق الصفحات المعروضة: حد أقصى 5 أزرار حوالين الصفحة الحالية
        let start = Math.max(1, page - 2);
        let end   = Math.min(totalPages, start + 4);
        start = Math.max(1, end - 4);

        let pages = '';
        if (start > 1) {
            pages += `<button class="vpage-btn" data-vpage="1">1</button>`;
            if (start > 2) pages += `<span class="vpage-dots">…</span>`;
        }
        for (let p = start; p <= end; p++) {
            pages += `<button class="vpage-btn ${p === page ? 'active' : ''}" data-vpage="${p}">${p}</button>`;
        }
        if (end < totalPages) {
            if (end < totalPages - 1) pages += `<span class="vpage-dots">…</span>`;
            pages += `<button class="vpage-btn" data-vpage="${totalPages}">${totalPages}</button>`;
        }

        return `
            <div class="visitors-pagination">
                <button class="vpage-btn vpage-nav" data-vpage="${Math.max(1, page-1)}" ${page===1?'disabled':''}>‹ السابق</button>
                ${pages}
                <button class="vpage-btn vpage-nav" data-vpage="${Math.min(totalPages, page+1)}" ${page===totalPages?'disabled':''}>التالي ›</button>
                <span class="visitors-total-count">إجمالي ${total} زيارة</span>
            </div>`;
    }

    el('refreshAnalyticsBtn').addEventListener('click', loadAnalytics);

    // تحميل تلقائي عند فتح الأدمن
    if (window.TojiAPI?.AnalyticsAPI) loadAnalytics();

    // ============================================================
    // 🤖 BOT ADMIN — إدارة الأسئلة والـ Leads
    // ============================================================

    // ── Tabs ──────────────────────────────────────────────────
    document.querySelectorAll('.bot-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.bot-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById('botTabQuestions').hidden = target !== 'questions';
            document.getElementById('botTabLeads').hidden     = target !== 'leads';
            if (target === 'leads') loadBotLeads(1);
            if (target === 'questions') loadBotQuestions();
        });
    });

    // ── Questions ──────────────────────────────────────────────
    let botAllQuestions = [];

    async function loadBotQuestions() {
        const listEl = el('botQuestionsList');
        listEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
        try {
            const res = await window.TojiAPI.BotAPI.getQuestions();
            botAllQuestions = res?.data || [];
            renderBotTree();
        } catch (err) {
            listEl.innerHTML = `<p class="projects-hint error">❌ ${err.message}</p>`;
        }
    }

    function renderBotTree() {
        const listEl = el('botQuestionsList');
        if (!botAllQuestions.length) {
            listEl.innerHTML = '<p class="projects-hint">لا توجد أسئلة. اضغط "بذر الأسئلة الافتراضية" للبدء.</p>';
            return;
        }

        const getQ    = id => botAllQuestions.find(q => String(q._id) === String(id));
        const roots   = botAllQuestions.filter(q => q.isRoot).sort((a,b) => a.order - b.order);
        const visited = new Set(); // prevent infinite loops

        // ── render one node (question box) ───────────────────────
        function nodeHTML(q) {
            return `
            <div class="tq-node" data-id="${q._id}">
                <div class="tq-box ${q.isRoot ? 'tq-box-root' : 'tq-box-child'}">
                    <div class="tq-box-label">${q.isRoot ? '🌱 Root' : '📌'}</div>
                    <div class="tq-box-en">${escapeHtml(q.text?.en || '')}</div>
                    <div class="tq-box-ar">${escapeHtml(q.text?.ar || '')}</div>
                    <div class="tq-box-actions">
                        <button class="btn-secondary btn-sm" data-bot-edit="${q._id}">✏️</button>
                        <button class="btn-danger btn-sm"   data-bot-delete="${q._id}">🗑</button>
                    </div>
                </div>
            </div>`;
        }

        // ── render children level ─────────────────────────────────
        function childrenHTML(q) {
            if (visited.has(String(q._id))) return '';
            visited.add(String(q._id));

            const opts = (q.options || []);
            if (!opts.length) return '';

            // Build each option branch
            const branches = opts.map(o => {
                const nextQ     = o.nextQuestionId ? getQ(o.nextQuestionId) : null;
                const finalText = o.finalResponse?.en || o.finalResponse?.ar || '';

                // The leaf content: either a sub-question tree or a final answer box
                let leafHTML = '';
                if (nextQ) {
                    leafHTML = treeHTML(nextQ);
                } else if (finalText) {
                    leafHTML = `<div class="tq-leaf">
                        <div class="tq-leaf-icon">✓</div>
                        <p class="tq-leaf-text">${escapeHtml(finalText.slice(0, 60))}${finalText.length > 60 ? '…' : ''}</p>
                    </div>`;
                } else {
                    leafHTML = `<div class="tq-leaf tq-leaf-empty"><span>—</span></div>`;
                }

                return `<div class="tq-branch">
                    <div class="tq-branch-label">${escapeHtml(o.text?.en || '')} / ${escapeHtml(o.text?.ar || '')}</div>
                    <div class="tq-branch-connector"></div>
                    ${leafHTML}
                </div>`;
            }).join('');

            return `<div class="tq-children">
                <div class="tq-children-line"></div>
                <div class="tq-children-row">${branches}</div>
            </div>`;
        }

        // ── full sub-tree for one question ────────────────────────
        function treeHTML(q) {
            return `<div class="tq-subtree">
                ${nodeHTML(q)}
                ${childrenHTML(q)}
            </div>`;
        }

        listEl.innerHTML = `
            <div class="tq-legend">
                <span>🌱 Root = سؤال ابتدائي</span>
                <span>📌 = سؤال فرعي</span>
                <span class="tq-legend-final">✓ = إجابة نهائية</span>
            </div>
            <div class="tq-forest">
                ${roots.map(q => treeHTML(q)).join('')}
            </div>`;
    }


    // ── Add / Edit Question (tree-style: branch inline, no ID hunting) ──

    // Builds the "linked to" chip + actions for a branch option, or the
    // "create branch" button when nothing is linked yet.
    function botBranchFieldsHTML(nextId) {
        const nextQ = nextId ? botAllQuestions.find(q => String(q._id) === String(nextId)) : null;
        if (nextId && nextQ) {
            return `
                <div class="bot-opt-branch-display">
                    <span class="bot-opt-branch-chip">🔗 ${escapeHtml(nextQ.text?.en || '')} <span class="bot-opt-branch-chip-ar">/ ${escapeHtml(nextQ.text?.ar || '')}</span></span>
                    <button type="button" class="btn-secondary btn-sm bot-opt-edit-branch">✏️ فتح السؤال المتفرع</button>
                    <button type="button" class="btn-ghost btn-sm bot-opt-unlink-branch">✕ فك الربط</button>
                </div>`;
        }
        if (nextId && !nextQ) {
            // linked to a question that no longer exists
            return `
                <div class="bot-opt-branch-display">
                    <span class="bot-opt-branch-chip bot-opt-branch-chip-missing">⚠️ السؤال المرتبط محذوف</span>
                    <button type="button" class="btn-ghost btn-sm bot-opt-unlink-branch">✕ فك الربط</button>
                </div>`;
        }
        return `
            <div class="bot-opt-branch-display">
                <button type="button" class="btn-primary btn-sm bot-opt-add-branch">➕ أنشئ سؤال متفرع هنا</button>
            </div>`;
    }

    function botOptionRowHTML(opt, otherQs) {
        const optId    = opt?.id || '';
        const nextId   = opt?.nextQuestionId ? String(opt.nextQuestionId) : '';
        const isBranch = !!nextId;
        const modeName = 'bot-opt-mode-' + (optId || Math.random().toString(36).slice(2));
        const advancedSelect = `
            <details class="bot-opt-advanced">
                <summary>أو اربط بسؤال موجود بالفعل</summary>
                <select class="bot-opt-next">
                    <option value="">— اختر سؤال —</option>
                    ${otherQs.map(q => `<option value="${q._id}" ${nextId===String(q._id)?'selected':''}>${q.isRoot?'🌱 ':'📌 '}${escapeHtml(q.text?.en||'')}</option>`).join('')}
                </select>
            </details>`;

        return `
            <div class="bot-opt-row" data-opt-id="${optId}" data-next-id="${nextId}">
                <div class="bot-opt-row-top">
                    <input class="bot-opt-en" placeholder="نص الاختيار EN" value="${opt?.text?.en||''}">
                    <input class="bot-opt-ar" placeholder="نص الاختيار AR" value="${opt?.text?.ar||''}">
                    <button type="button" class="btn-danger btn-sm bot-opt-remove" title="حذف الاختيار">✕</button>
                </div>
                <div class="bot-opt-mode">
                    <label class="bot-opt-mode-choice">
                        <input type="radio" class="bot-opt-mode-final" name="${modeName}" ${!isBranch?'checked':''}> إجابة نهائية
                    </label>
                    <label class="bot-opt-mode-choice">
                        <input type="radio" class="bot-opt-mode-branch" name="${modeName}" ${isBranch?'checked':''}> يتفرع لسؤال تاني
                    </label>
                </div>
                <div class="bot-opt-final-fields" ${isBranch?'hidden':''}>
                    <textarea class="bot-opt-final-en" placeholder="الإجابة النهائية EN">${opt?.finalResponse?.en||''}</textarea>
                    <textarea class="bot-opt-final-ar" placeholder="الإجابة النهائية AR">${opt?.finalResponse?.ar||''}</textarea>
                </div>
                <div class="bot-opt-branch-fields" ${!isBranch?'hidden':''}>
                    ${botBranchFieldsHTML(nextId)}
                    ${advancedSelect}
                </div>
            </div>`;
    }

    function refreshOptRowBranchUI(rowEl, nextId) {
        rowEl.dataset.nextId = nextId || '';
        const branchFields = rowEl.querySelector('.bot-opt-branch-fields');
        const display = branchFields.querySelector('.bot-opt-branch-display');
        display.outerHTML = botBranchFieldsHTML(nextId);
        const sel = rowEl.querySelector('.bot-opt-next');
        if (sel) sel.value = nextId || '';
    }

    // Small nested modal to spin up a brand-new sub-question in one step
    function openQuickSubQuestionModal(onCreated) {
        const nested = document.createElement('div');
        nested.className = 'bot-form-overlay bot-form-overlay-nested';
        nested.innerHTML = `
            <div class="bot-form-modal bot-form-modal-sm">
                <h3>➕ سؤال متفرع جديد</h3>
                <p class="bot-form-hint">هيظهر هذا السؤال لما الزائر يختار الاختيار ده. تقدر بعدين تفتحه من الشجرة وتضيفله اختيارات وتفرعات تانية.</p>
                <label>نص السؤال بالإنجليزي<input id="subQEn"></label>
                <label>نص السؤال بالعربي<input id="subQAr"></label>
                <div class="project-form-actions" style="margin-top:14px">
                    <button class="btn-primary" id="subQSaveBtn">💾 إنشاء وربط</button>
                    <button class="btn-ghost" id="subQCancelBtn">إلغاء</button>
                </div>
                <p id="subQMsg" class="form-msg"></p>
            </div>`;
        document.body.appendChild(nested);

        nested.querySelector('#subQCancelBtn').addEventListener('click', () => nested.remove());
        nested.addEventListener('click', (e) => { if (e.target === nested) nested.remove(); });

        nested.querySelector('#subQSaveBtn').addEventListener('click', async () => {
            const msgEl = nested.querySelector('#subQMsg');
            const en = nested.querySelector('#subQEn').value.trim();
            const ar = nested.querySelector('#subQAr').value.trim();
            if (!en || !ar) { msgEl.textContent = '⚠️ لازم تكتب النص بالعربي والإنجليزي'; return; }
            msgEl.textContent = '⏳ جارٍ الإنشاء...';
            try {
                const res = await window.TojiAPI.BotAPI.createQuestion({ text: { en, ar }, isRoot: false, order: 0, options: [] });
                if (res?.data) botAllQuestions.push(res.data);
                nested.remove();
                onCreated(res.data);
            } catch (err) { msgEl.textContent = '❌ ' + err.message; }
        });
    }

    function openBotQuestionForm(existing = null, onSaved = null) {
        const isEdit  = !!existing;
        const overlay = document.createElement('div');
        overlay.className = 'bot-form-overlay';

        const otherQs = botAllQuestions.filter(q => !existing || String(q._id) !== String(existing._id));
        const existingOpts = (existing?.options || []).map(o => botOptionRowHTML(o, otherQs)).join('');

        overlay.innerHTML = `
            <div class="bot-form-modal">
                <h3>${isEdit ? '✏️ تعديل سؤال' : '➕ سؤال جديد'}</h3>
                <label>النص بالإنجليزي<input id="bqEn" value="${existing?.text?.en||''}"></label>
                <label>النص بالعربي<input id="bqAr" value="${existing?.text?.ar||''}"></label>
                <label><input type="checkbox" id="bqRoot" ${existing?.isRoot?'checked':''}> سؤال بداية (Root) — يظهر أول ما الشات يبدأ</label>
                <label>الترتيب<input type="number" id="bqOrder" value="${existing?.order||0}" style="width:80px"></label>
                <div class="bot-section-label" style="margin:12px 0 4px">الاختيارات (Options)</div>
                <p class="bot-form-hint">لكل اختيار: اختار إما "إجابة نهائية" أو "يتفرع لسؤال تاني" وأنشئ السؤال الفرعي من هنا مباشرة.</p>
                <div id="botOptList">${existingOpts}</div>
                <button class="btn-secondary btn-sm" id="botAddOptBtn">+ إضافة اختيار</button>
                <div class="project-form-actions" style="margin-top:16px">
                    <button class="btn-primary" id="botSaveQBtn">💾 حفظ</button>
                    <button class="btn-ghost"   id="botCancelQBtn">إلغاء</button>
                </div>
                <p id="botQMsg" class="form-msg"></p>
            </div>`;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const optList = overlay.querySelector('#botOptList');

        overlay.querySelector('#botCancelQBtn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        // Add a blank option row
        overlay.querySelector('#botAddOptBtn').addEventListener('click', () => {
            const wrap = document.createElement('div');
            wrap.innerHTML = botOptionRowHTML(null, otherQs);
            optList.appendChild(wrap.firstElementChild);
        });

        // Delegated events for all option rows (existing + newly added)
        optList.addEventListener('click', (e) => {
            const row = e.target.closest('.bot-opt-row');
            if (!row) return;

            if (e.target.classList.contains('bot-opt-remove')) { row.remove(); return; }

            if (e.target.classList.contains('bot-opt-add-branch')) {
                openQuickSubQuestionModal((newQ) => {
                    if (!newQ) return;
                    refreshOptRowBranchUI(row, newQ._id);
                });
                return;
            }

            if (e.target.classList.contains('bot-opt-edit-branch')) {
                const childId = row.dataset.nextId;
                const child = botAllQuestions.find(q => String(q._id) === childId);
                if (child) {
                    openBotQuestionForm(child, (updatedQ) => {
                        if (updatedQ) refreshOptRowBranchUI(row, updatedQ._id);
                    });
                }
                return;
            }

            if (e.target.classList.contains('bot-opt-unlink-branch')) {
                refreshOptRowBranchUI(row, '');
                return;
            }
        });

        optList.addEventListener('change', (e) => {
            const row = e.target.closest('.bot-opt-row');
            if (!row) return;

            if (e.target.classList.contains('bot-opt-mode-final')) {
                row.querySelector('.bot-opt-final-fields').hidden = false;
                row.querySelector('.bot-opt-branch-fields').hidden = true;
            }
            if (e.target.classList.contains('bot-opt-mode-branch')) {
                row.querySelector('.bot-opt-final-fields').hidden = true;
                row.querySelector('.bot-opt-branch-fields').hidden = false;
            }
            if (e.target.classList.contains('bot-opt-next')) {
                refreshOptRowBranchUI(row, e.target.value);
                if (e.target.value) row.querySelector('.bot-opt-mode-branch').checked = true;
            }
        });

        // Save
        overlay.querySelector('#botSaveQBtn').addEventListener('click', async () => {
            const msgEl = overlay.querySelector('#botQMsg');
            const en    = overlay.querySelector('#bqEn').value.trim();
            const ar    = overlay.querySelector('#bqAr').value.trim();
            if (!en || !ar) { msgEl.textContent = '⚠️ لازم تكتب النص بالعربي والإنجليزي'; return; }

            const opts = [...optList.querySelectorAll('.bot-opt-row')].map((row) => {
                const isBranch = row.querySelector('.bot-opt-mode-branch').checked;
                return {
                    id:             row.dataset.optId || crypto.randomUUID().slice(0,8),
                    text:           { en: row.querySelector('.bot-opt-en').value.trim(), ar: row.querySelector('.bot-opt-ar').value.trim() },
                    nextQuestionId: isBranch ? (row.dataset.nextId || null) : null,
                    finalResponse:  isBranch ? { en:'', ar:'' } : {
                        en: row.querySelector('.bot-opt-final-en').value.trim(),
                        ar: row.querySelector('.bot-opt-final-ar').value.trim()
                    }
                };
            });

            const data = {
                text:    { en, ar },
                isRoot:  overlay.querySelector('#bqRoot').checked,
                order:   parseInt(overlay.querySelector('#bqOrder').value) || 0,
                options: opts
            };

            msgEl.textContent = '⏳ جارٍ الحفظ...';
            try {
                const res = isEdit
                    ? await window.TojiAPI.BotAPI.updateQuestion(existing._id, data)
                    : await window.TojiAPI.BotAPI.createQuestion(data);
                overlay.remove();
                await loadBotQuestions();
                showBanner('✅ تم حفظ السؤال.', 'success');
                if (onSaved) onSaved(res?.data || { ...data, _id: existing?._id });
            } catch (err) {
                msgEl.textContent = '❌ ' + err.message;
            }
        });
    }

    el('botAddRootBtn').addEventListener('click', () => openBotQuestionForm());

    el('botQuestionsList').addEventListener('click', async (e) => {
        const editId   = e.target.dataset.botEdit;
        const deleteId = e.target.dataset.botDelete;

        if (editId) {
            const q = botAllQuestions.find(q => String(q._id) === editId);
            if (q) openBotQuestionForm(q);
        }

        if (deleteId) {
            const usedElsewhere = botAllQuestions.some(q =>
                String(q._id) !== deleteId && (q.options||[]).some(o => String(o.nextQuestionId) === deleteId)
            );
            const warning = usedElsewhere
                ? 'تنبيه: في اختيارات في أسئلة تانية بتتفرع للسؤال ده، وهتفضل الروابط دي فاضية بعد الحذف. متابعة؟'
                : 'حذف هذا السؤال؟';
            if (!confirm(warning)) return;
            try {
                await window.TojiAPI.BotAPI.deleteQuestion(deleteId);
                await loadBotQuestions();
                showBanner('✅ تم حذف السؤال.', 'success');
            } catch (err) { showBanner('❌ ' + err.message, 'error'); }
        }
    });

    el('botSeedBtn').addEventListener('click', async () => {
        if (!confirm('هيمسح كل الأسئلة الحالية ويحطّ الافتراضية. متابعة؟')) return;
        try {
            await window.TojiAPI.BotAPI.seed(true);
            await loadBotQuestions();
            showBanner('✅ تم بذر الأسئلة الافتراضية.', 'success');
        } catch (err) { showBanner('❌ ' + err.message, 'error'); }
    });

    el('botRefreshQBtn').addEventListener('click', loadBotQuestions);

    // ── Leads ──────────────────────────────────────────────────
    function escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function renderConversationSummary(conversation) {
        if (!conversation || !conversation.length) {
            return '<p class="projects-hint">مفيش أسئلة اتسألت.</p>';
        }
        return `<ul class="lead-conversation-list">${conversation.map((step) => `
            <li>
                <span class="lead-conv-q">❓ ${escapeHtml(step.question)}</span>
                <span class="lead-conv-a">↳ ${escapeHtml(step.answer)}</span>
            </li>
        `).join('')}</ul>`;
    }

    // ملخص سريع لآخر اهتمام أبداه الزائر — من غير ما تحتاج تدوس تفتح التفاصيل
    function renderLeadQuickSummary(conversation) {
        if (!conversation || !conversation.length) return '—';
        const last = conversation[conversation.length - 1];
        const preview = String(last?.answer || last?.question || '').trim();
        if (!preview) return '—';
        const truncated = preview.length > 40 ? preview.slice(0, 40) + '…' : preview;
        return escapeHtml(truncated);
    }

    async function loadBotLeads(page = 1) {
        const listEl = el('botLeadsList');
        listEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
        try {
            const res        = await window.TojiAPI.BotAPI.getLeads(page);
            const leads      = res?.data || [];
            const pagination = res?.pagination || {};

            if (!leads.length) { listEl.innerHTML = '<p class="projects-hint">لا توجد بيانات زوار بعد.</p>'; return; }

            const rows = leads.map(l => `
                <tr class="lead-row" data-lead-row="${l._id}">
                    <td>${l.name || '—'}</td>
                    <td><code>${l.ip || '—'}</code></td>
                    <td>${l.phone || '—'}</td>
                    <td>${l.language === 'ar' ? '🇦🇪' : '🇬🇧'}</td>
                    <td class="lead-quick-summary" title="${renderLeadQuickSummary(l.conversation)}">${renderLeadQuickSummary(l.conversation)}</td>
                    <td>
                        <button class="btn-secondary btn-sm" data-lead-toggle="${l._id}">
                            👁 ${(l.conversation||[]).length} خطوة
                        </button>
                    </td>
                    <td>${new Date(l.createdAt).toLocaleString('ar-EG')}</td>
                    <td><button class="btn-danger btn-sm" data-lead-del="${l._id}">🗑</button></td>
                </tr>
                <tr class="lead-conv-row" id="leadConv_${l._id}" hidden>
                    <td colspan="8">${renderConversationSummary(l.conversation)}</td>
                </tr>`).join('');

            listEl.innerHTML = `
                <table class="visitors-table">
                    <thead><tr><th>الاسم</th><th>IP</th><th>الموبايل</th><th>اللغة</th><th>آخر اهتمام</th><th>المحادثة</th><th>التاريخ</th><th></th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                ${renderVisitorsPagination({ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}`;

            listEl.querySelectorAll('[data-lead-toggle]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const row = el('leadConv_' + btn.dataset.leadToggle);
                    if (row) row.hidden = !row.hidden;
                });
            });

            listEl.querySelectorAll('[data-lead-del]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('حذف هذا الزائر؟')) return;
                    await window.TojiAPI.BotAPI.deleteLead(btn.dataset.leadDel);
                    loadBotLeads(page);
                });
            });

            listEl.querySelectorAll('[data-vpage]').forEach(btn => {
                btn.addEventListener('click', () => loadBotLeads(parseInt(btn.dataset.vpage)));
            });

        } catch (err) { listEl.innerHTML = `<p class="projects-hint error">❌ ${err.message}</p>`; }
    }

    el('botRefreshLeadsBtn').addEventListener('click', () => loadBotLeads(1));

    el('botDeleteAllLeadsBtn').addEventListener('click', async () => {
        if (!confirm('مسح كل بيانات الزوار نهائياً؟')) return;
        try {
            await window.TojiAPI.BotAPI.deleteAllLeads();
            showBanner('✅ تم مسح كل بيانات الزوار.', 'success');
            loadBotLeads(1);
        } catch (err) { showBanner('❌ ' + err.message, 'error'); }
    });

    // تحميل تلقائي
    if (window.TojiAPI?.BotAPI) loadBotQuestions();

    // ============================================================
    // JSON Panel Buttons (بدون تغيير)
    // ============================================================
    el('copyFullBtn').addEventListener('click', async () => {
        collectForm();
        try {
            await navigator.clipboard.writeText(JSON.stringify(current, null, 4));
            msg('تم نسخ JSON الكامل.');
        } catch {
            msg('النسخ فشل — جرّب مرة أخرى.');
        }
    });

    el('loadFullBtn').addEventListener('click', async () => {
        try {
            const parsed = restoreJsonPlaceholders(JSON.parse(el('fullJson').value || '{}'), current);
            current = deepMerge(defaults, parsed);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
            fillForm();
            showBanner('✅ تم تطبيق JSON — اضغط "حفظ على السيرفر" لرفعه.', 'info');
        } catch {
            msg('JSON غير صالح. راجع الأقواس والفواصل.');
        }
    });
})();