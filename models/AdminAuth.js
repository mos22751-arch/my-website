const mongoose = require('mongoose');

// ============================================================
// AdminAuth
// سجل واحد بس (key = 'main') بيخزن:
//  - passwordHash: لو الأدمن غيّر كلمة السر (بيتجاهل ADMIN_PASSWORD في .env بعدها)
//  - recoveryEmail / recoveryPhone: فين يتبعت كود "نسيت كلمة المرور"
//  - otp: بيانات الكود المؤقت الحالي (لو موجود)
// ============================================================
const adminAuthSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: 'main',
            unique: true,
            trim: true
        },

        // بديل كلمة المرور المخزنة في .env — يتحدث بعد "نسيت كلمة المرور"
        passwordHash: {
            type: String,
            select: false
        },

        recoveryEmail: {
            type: String,
            trim: true,
            default: ''
        },
        recoveryPhone: {
            type: String,
            trim: true,
            default: ''
        },

        // كود التحقق المؤقت (OTP) الحالي — بيتمسح بعد الاستخدام أو الانتهاء
        otp: {
            codeHash:   { type: String, select: false },
            method:     { type: String, enum: ['email', 'phone'] },
            expiresAt:  { type: Date },
            attempts:   { type: Number, default: 0 },
            lastSentAt: { type: Date }
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('AdminAuth', adminAuthSchema);
