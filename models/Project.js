const mongoose = require('mongoose');

// Schema مبني على نفس هيكل workCards في content.js بتاعك
const projectSchema = new mongoose.Schema(
    {
        banner: {
            type: String,
            required: [true, 'البانر مطلوب (مثال: TOJI, WEB, ADMIN)'],
            trim: true,
            maxlength: [20, 'البانر مش أكتر من 20 حرف']
        },
        title: {
            en: {
                type: String,
                required: [true, 'العنوان الإنجليزي مطلوب'],
                trim: true
            },
            ar: {
                type: String,
                required: [true, 'العنوان العربي مطلوب'],
                trim: true
            }
        },
        copy: {
            en: {
                type: String,
                required: [true, 'الوصف الإنجليزي مطلوب'],
                trim: true
            },
            ar: {
                type: String,
                required: [true, 'الوصف العربي مطلوب'],
                trim: true
            }
        },
        tags: {
            type: [String],
            default: []
        },
        // رابط الـ Live Preview اختياري
        liveUrl: {
            type: String,
            trim: true,
            default: ''
        },
        // صورة المشروع (رابط Cloudinary)
        imageUrl: {
            type: String,
            trim: true,
            default: ''
        },
        // ترتيب الظهور في الصفحة
        order: {
            type: Number,
            default: 0
        },
        // إخفاء/إظهار المشروع
        isVisible: {
            type: Boolean,
            default: true
        }
    },
    {
        // timestamps بيضيف createdAt و updatedAt أوتوماتيك
        timestamps: true
    }
);

module.exports = mongoose.model('Project', projectSchema);
