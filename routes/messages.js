const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ============================================
// POST /api/messages  →  عام (بدون توكن)
// الزائر يبعت رسالة من الفورم
// ============================================
router.post('/', async (req, res) => {
    try {
        const { name, pageType, message } = req.body;

        // تحقق بسيط من البيانات
        if (!name || !message) {
            return res.status(400).json({
                success: false,
                message: 'الاسم والرسالة مطلوبين.'
            });
        }

        // حفظ الرسالة مع الـ IP (لحماية من Spam - مش بيتعرضش)
        const newMessage = await Message.create({
            name,
            pageType: pageType || 'Not specified',
            message,
            ipAddress: req.ip || req.connection.remoteAddress
        });

        res.status(201).json({
            success: true,
            message: 'تم إرسال رسالتك بنجاح! هكلمك قريب.'
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(' | ') });
        }
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

// ============================================
// GET /api/messages  →  أدمن فقط
// اعرض كل الرسائل الواردة (الأحدث الأول)
// ============================================
router.get('/', protect, async (req, res) => {
    try {
        const messages = await Message.find()
            .sort({ createdAt: -1 }) // الأحدث الأول
            .select('-ipAddress');   // إخفاء الـ IP من الـ Response

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

// ============================================
// PATCH /api/messages/:id/status  →  أدمن فقط
// غيّر حالة الرسالة (new → read → replied)
// ============================================
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['new', 'read', 'replied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'الحالة غير صالحة.' });
        }

        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ success: false, message: 'الرسالة مش موجودة.' });
        }

        res.status(200).json({
            success: true,
            message: 'تم تحديث الحالة.',
            data: message
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

// ============================================
// DELETE /api/messages/:id  →  أدمن فقط
// احذف رسالة
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const message = await Message.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: 'الرسالة مش موجودة.' });
        }

        res.status(200).json({
            success: true,
            message: 'تم حذف الرسالة.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

module.exports = router;
