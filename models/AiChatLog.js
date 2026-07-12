const mongoose = require('mongoose');

// كل سؤال بيتسأل لمساعد الـ AI بيتسجل هنا — عشان الأدمن يقدر يشوف الزوار بيسألوا عن إيه
const aiChatLogSchema = new mongoose.Schema(
    {
        question: { type: String, required: true, trim: true, maxlength: 500 },
        answer:   { type: String, default: '', trim: true, maxlength: 2000 },

        // 'fixed'  = اتجاوب فورًا من غير Gemini (سؤال من الأسئلة الجاهزة)
        // 'ai'     = اتجاوب من Gemini
        // 'error'  = حصلت مشكلة في الاتصال بـ Gemini
        // 'disabled' = الشات كان متوقف وقت السؤال
        source: { type: String, enum: ['fixed', 'ai', 'error', 'disabled'], default: 'ai' },

        ip: { type: String, default: '' },

        // معرّف ثابت لكل زائر (متولّد وبيتحفظ في المتصفح بتاعه) — عشان نقدر نجمع
        // كل أسئلة نفس الشخص في محادثة واحدة في الأدمن، بدل ما كل الأسئلة تتلخبط مع بعض
        clientId: { type: String, default: '', trim: true, maxlength: 100 }
    },
    { timestamps: true }
);

aiChatLogSchema.index({ createdAt: -1 });
aiChatLogSchema.index({ clientId: 1, createdAt: 1 });

module.exports = mongoose.model('AiChatLog', aiChatLogSchema);
