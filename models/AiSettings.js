const mongoose = require('mongoose');

// نسخة واحدة بس من إعدادات مساعد الـ AI (key = 'main' دايمًا)
// ده اللي بيتحكم فيه الأدمن من اللوحة: تشغيل/إيقاف الشات + المعلومات اللي المساعد بيرد بيها
const aiSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: 'main', unique: true, trim: true },

        // مفتاح إيقاف/تشغيل الشات بالكامل من الأدمن (من غير ما نلمس الكود)
        enabled: { type: Boolean, default: true },

        // معلومات Toji اللي المساعد بيستخدمها في ردوده
        name:       { type: String, default: 'Toji' },
        role:       { type: String, default: 'Full-stack developer' },
        stack:      { type: String, default: 'Next.js, React, Tailwind CSS, HTML, CSS, JS, Python, C' },
        languages:  { type: String, default: 'Arabic (native), English (fluent), French' },
        experience: { type: String, default: '1.5 years, self-taught' },
        projects:   { type: String, default: 'This portfolio website, and a Burger app (a food ordering system)' },
        education:  { type: String, default: 'Self-taught, no formal degree' },
        contact:    { type: String, default: 'Through the contact form on this website' }
    },
    { timestamps: true }
);

// بيرجع الإعدادات، ولو مفيش سجل لسه بيعمل واحد بالقيم الافتراضية
aiSettingsSchema.statics.getSingleton = async function () {
    let doc = await this.findOne({ key: 'main' });
    if (!doc) doc = await this.create({ key: 'main' });
    return doc;
};

module.exports = mongoose.model('AiSettings', aiSettingsSchema);
