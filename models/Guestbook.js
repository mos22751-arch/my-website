const mongoose = require('mongoose');

// دفتر الزوار — أي حد يزور الموقع يقدر يسيب رسالة قصيرة
const guestbookSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'الاسم مطلوب'],
            trim: true,
            maxlength: [40, 'الاسم مش أكتر من 40 حرف']
        },
        message: {
            type: String,
            required: [true, 'الرسالة مطلوبة'],
            trim: true,
            maxlength: [280, 'الرسالة مش أكتر من 280 حرف']
        },
        // إيموجي بسيط اختياري يعبر عن الموود (زي زعزع)
        mood: {
            type: String,
            trim: true,
            maxlength: 8,
            default: ''
        },
        // ظاهر للزوار ولا لأ — بيبدأ مخفي لحد ما الأدمن يوافق عليه
        visible: {
            type: Boolean,
            default: false
        },
        // للحماية من السبام فقط - مش بيتعرض
        ipAddress: {
            type: String,
            select: false
        }
    },
    { timestamps: true }
);

guestbookSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Guestbook', guestbookSchema);
