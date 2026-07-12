const mongoose = require('mongoose');

// يخزن نسخة واحدة من إعدادات الموقع الكاملة (TOJI_CONTENT)
// key = 'main' دايمًا — مش محتاجين أكتر من سجل واحد
const siteConfigSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            default: 'main',
            unique: true,
            trim: true
        },
        // بيخزن الـ JSON الكامل لـ TOJI_CONTENT
        data: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Config data is required']
        },
        // آخر من عدّل الإعدادات
        updatedBy: {
            type: String,
            default: 'admin'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
