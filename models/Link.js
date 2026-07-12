const mongoose = require('mongoose');

// روابط قسم "Connect" في الموقع (إنستجرام، تيك توك، واتساب، أو أي رابط تاني)
// كل لينك بيتعرض بصورته اللي الأدمن رفعها، ولو ضغط الزائر في أي حتة عليه بيوديه للرابط
const linkSchema = new mongoose.Schema(
    {
        title: { type: String, required: [true, 'اسم اللينك مطلوب'], trim: true, maxlength: 60 },
        url:   { type: String, required: [true, 'الرابط مطلوب'], trim: true, maxlength: 500 },

        // صورة اللينك (مرفوعة على Cloudinary من الأدمن)
        imageUrl: { type: String, trim: true, default: '' },

        // أيقونة احتياطية (lucide icon name) لو مفيش صورة لسه
        icon: { type: String, trim: true, default: 'link' },

        order:   { type: Number, default: 0 },
        visible: { type: Boolean, default: true }
    },
    { timestamps: true }
);

linkSchema.index({ order: 1 });

module.exports = mongoose.model('Link', linkSchema);
