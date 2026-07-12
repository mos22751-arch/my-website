const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const rateLimit  = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const AdminAuth  = require('../models/AdminAuth');
const { sendOtpEmail }    = require('../utils/mailer');
const { sendOtpTelegram } = require('../utils/telegram');

const router = express.Router();

const OTP_TTL_MINUTES           = 10;
const OTP_RESEND_COOLDOWN_SEC   = 60;
const OTP_MAX_ATTEMPTS          = 5;

// ============================================================
// Rate limiter مخصوص لـ forgot-password
// (بالإضافة للـ authLimiter العام اللي متطبق على /api/auth كلها)
// ============================================================
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'طلبات كتير لاستعادة كلمة المرور، حاول بعد شوية.' }
});

// ============================================================
// Pre-compute a one-time hash of ADMIN_PASSWORD (fallback من .env)
// بيتستخدم بس لو مفيش passwordHash محفوظ في قاعدة البيانات
// (يعني قبل ما الأدمن يغيّر كلمة السر أول مرة عن طريق "نسيت كلمة المرور")
// ============================================================
let _envAdminPasswordHash = null;
async function getEnvAdminHash() {
    if (!_envAdminPasswordHash) {
        _envAdminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    }
    return _envAdminPasswordHash;
}
// Warm-up: compute on startup so first login isn't slow
getEnvAdminHash();

// جيب هاش كلمة المرور الحالي (من الداتابيز لو موجود، وإلا من .env)
async function getCurrentPasswordHash() {
    const doc = await AdminAuth.findOne({ key: 'main' }).select('+passwordHash').lean();
    if (doc && doc.passwordHash) return doc.passwordHash;
    return getEnvAdminHash();
}

// جيب سجل AdminAuth (وأنشئه لو مش موجود) مع تعبئة بيانات الاستعادة الافتراضية من .env
async function getOrCreateAdminAuthDoc() {
    let doc = await AdminAuth.findOne({ key: 'main' }).select('+passwordHash +otp.codeHash');
    if (!doc) {
        doc = await AdminAuth.create({
            key: 'main',
            recoveryEmail: process.env.ADMIN_RECOVERY_EMAIL || '',
            recoveryPhone: process.env.ADMIN_RECOVERY_PHONE || ''
        });
    }
    return doc;
}

function generateOtpCode() {
    return String(crypto.randomInt(100000, 1000000)); // 6 digits: 100000-999999
}

function hashCode(code) {
    return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function maskEmail(email) {
    const at = String(email || '').indexOf('@');
    if (at <= 0) return '••••';
    const name   = email.slice(0, at);
    const domain = email.slice(at + 1);
    const visible = name.slice(0, Math.min(2, name.length));
    return `${visible}${'•'.repeat(Math.max(name.length - visible.length, 2))}@${domain}`;
}

function maskPhone(phone) {
    const digits = String(phone || '');
    if (digits.length <= 4) return '••••';
    return `${digits.slice(0, digits.length - 4).replace(/./g, '•')}${digits.slice(-4)}`;
}

// ============================================================
// POST /api/auth/login
// Admin-only login endpoint
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Constant-time email comparison to prevent timing attacks
        const isEmailMatch = email === process.env.ADMIN_EMAIL;

        // Always run bcrypt.compare even if email doesn't match
        // so response time is the same regardless (prevents user enumeration)
        const hash            = await getCurrentPasswordHash();
        const isPasswordMatch = await bcrypt.compare(password, hash);

        if (!isEmailMatch || !isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect email or password.'
            });
        }

        const token = jwt.sign(
            { role: 'admin', email: process.env.ADMIN_EMAIL },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            success:   true,
            message:   'Login successful.',
            token,
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// ============================================================
// GET /api/auth/verify
// Verify JWT token validity (called by frontend on page load)
// ============================================================
router.get('/verify', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Token is valid.',
        admin:   req.admin
    });
});

// ============================================================
// POST /api/auth/forgot-password
// body: { method: 'email' | 'phone' }
// بيبعت كود تحقق مكوّن من 6 أرقام على إيميل/رقم الاستعادة المحفوظ
// ============================================================
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const { method } = req.body;

        if (!['email', 'phone'].includes(method)) {
            return res.status(400).json({
                success: false,
                message: 'اختر طريقة استلام الكود: إيميل أو رقم هاتف.'
            });
        }

        const doc = await getOrCreateAdminAuthDoc();

        // منع طلب كود جديد قبل ما مدة الانتظار تخلص (حماية من السبام)
        if (doc.otp && doc.otp.lastSentAt) {
            const secondsSince = (Date.now() - new Date(doc.otp.lastSentAt).getTime()) / 1000;
            if (secondsSince < OTP_RESEND_COOLDOWN_SEC) {
                const wait = Math.ceil(OTP_RESEND_COOLDOWN_SEC - secondsSince);
                return res.status(429).json({
                    success: false,
                    message: `استنى ${wait} ثانية قبل ما تطلب كود تاني.`
                });
            }
        }

        const recoveryEmail = doc.recoveryEmail || process.env.ADMIN_RECOVERY_EMAIL || '';
        const recoveryPhone = doc.recoveryPhone || process.env.ADMIN_RECOVERY_PHONE || '';
        const destination   = method === 'email' ? recoveryEmail : recoveryPhone;

        if (!destination) {
            return res.status(400).json({
                success: false,
                message: 'مفيش إيميل أو رقم هاتف استعادة محفوظ على السيرفر. راجع إعدادات الأدمن.'
            });
        }

        const code = generateOtpCode();

        // إرسال الكود فعليًا — لو الخدمة مش مظبوطة في .env هيرمي Error برسالة واضحة
        if (method === 'email') {
            await sendOtpEmail(destination, code);
        } else {
            await sendOtpTelegram(destination, code);
        }

        doc.otp = {
            codeHash:   hashCode(code),
            method,
            expiresAt:  new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
            attempts:   0,
            lastSentAt: new Date()
        };
        await doc.save();

        const hint = method === 'email' ? maskEmail(destination) : maskPhone(destination);

        res.status(200).json({
            success: true,
            message: `تم إرسال كود التحقق. اتبعت إلى ${hint}.`,
            destinationHint: hint,
            expiresInMinutes: OTP_TTL_MINUTES
        });
    } catch (error) {
        console.error('Forgot password error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'حصل خطأ أثناء إرسال كود التحقق.'
        });
    }
});

// ============================================================
// POST /api/auth/reset-password
// body: { code, newPassword }
// بيتأكد من صحة الكود اللي اتبعت، ولو صح بيغيّر كلمة المرور
// ============================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { code, newPassword } = req.body;

        if (!code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'كود التحقق وكلمة المرور الجديدة مطلوبين.'
            });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور الجديدة لازم تكون 8 حروف على الأقل.'
            });
        }

        const doc = await AdminAuth.findOne({ key: 'main' }).select('+otp.codeHash');

        if (!doc || !doc.otp || !doc.otp.codeHash) {
            return res.status(400).json({
                success: false,
                message: 'مفيش طلب استعادة كلمة مرور شغال حاليًا. اطلب كود جديد.'
            });
        }

        if (new Date(doc.otp.expiresAt).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'كود التحقق منتهي الصلاحية. اطلب كود جديد.'
            });
        }

        if (doc.otp.attempts >= OTP_MAX_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: 'محاولات غلط كتير. اطلب كود جديد.'
            });
        }

        const isMatch = hashCode(code) === doc.otp.codeHash;

        if (!isMatch) {
            doc.otp.attempts = (doc.otp.attempts || 0) + 1;
            await doc.save();
            return res.status(400).json({
                success: false,
                message: 'كود التحقق غلط.'
            });
        }

        doc.passwordHash = await bcrypt.hash(newPassword, 12);
        doc.otp = undefined;
        await doc.save();

        res.status(200).json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح. سجل دخول بكلمة المرور الجديدة.'
        });
    } catch (error) {
        console.error('Reset password error:', error.message);
        res.status(500).json({
            success: false,
            message: 'حصل خطأ أثناء تغيير كلمة المرور.'
        });
    }
});

module.exports = router;
