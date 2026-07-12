const mongoose = require('mongoose');

// Schema بيتخزن فيه كل رسالة من فورم التواصل
const messageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'الاسم مطلوب'],
            trim: true,
            maxlength: [100, 'الاسم مش أكتر من 100 حرف']
        },
        // نوع الصفحة اللي الزائر طلبها (personal, business, admin edition)
        pageType: {
            type: String,
            trim: true,
            default: 'Not specified'
        },
        message: {
            type: String,
            required: [true, 'الرسالة مطلوبة'],
            trim: true,
            maxlength: [2000, 'الرسالة مش أكتر من 2000 حرف']
        },
        // حالة الرسالة (هتساعدك تعرف أيه اللي ردت عليه)
        status: {
            type: String,
            enum: ['new', 'read', 'replied'],
            default: 'new'
        },
        // IP بالـ spam للحماية من الحفظ فقط - مش بنعرضه
        ipAddress: {
            type: String,
            select: false // مش بيتبعت في الـ response عادي
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Message', messageSchema);
