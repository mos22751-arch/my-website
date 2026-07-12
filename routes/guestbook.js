const express      = require('express');
const rateLimit    = require('express-rate-limit');
const Guestbook    = require('../models/Guestbook');
const { protect }  = require('../middleware/auth');

const router = express.Router();

const postLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'كتبت رسايل كتير في دفتر الزوار، حاول بعد شوية.' }
});

// ============================================
// GET /api/guestbook  ←  عام (بدون توكن)
// آخر الرسايل الظاهرة بس، الأحدث الأول
// ============================================
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 60, 100);

        const entries = await Guestbook.find({ visible: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-ipAddress')
            .lean();

        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// POST /api/guestbook  ←  عام (بدون توكن، فيه Rate Limit من server.js)
// الزائر يسيب رسالة جديدة
// ============================================
router.post('/', postLimiter, async (req, res) => {
    try {
        const { name, message, mood } = req.body;

        if (!name || !message) {
            return res.status(400).json({ success: false, message: 'الاسم والرسالة مطلوبين.' });
        }

        const entry = await Guestbook.create({
            name,
            message,
            mood: mood || '',
            ipAddress: req.ip || req.connection.remoteAddress
        });

        const { ipAddress, ...safeEntry } = entry.toObject();

        res.status(201).json({ success: true, message: 'تم استلام رسالتك، هتظهر بعد المراجعة!', data: safeEntry });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(' | ') });
        }
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// GET /api/guestbook/all  ←  أدمن فقط (كل الرسايل حتى المخفية)
// ============================================
router.get('/all', protect, async (req, res) => {
    try {
        const entries = await Guestbook.find()
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ success: true, count: entries.length, data: entries });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// PATCH /api/guestbook/:id/visibility  ←  أدمن فقط
// إخفاء/إظهار رسالة (بدل الحذف النهائي)
// ============================================
router.patch('/:id/visibility', protect, async (req, res) => {
    try {
        const { visible } = req.body;

        const entry = await Guestbook.findByIdAndUpdate(
            req.params.id,
            { visible: !!visible },
            { new: true }
        );

        if (!entry) return res.status(404).json({ success: false, message: 'الرسالة مش موجودة.' });

        res.status(200).json({ success: true, message: 'تم التحديث.', data: entry });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// DELETE /api/guestbook/:id  ←  أدمن فقط
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const entry = await Guestbook.findByIdAndDelete(req.params.id);

        if (!entry) return res.status(404).json({ success: false, message: 'الرسالة مش موجودة.' });

        res.status(200).json({ success: true, message: 'تم الحذف.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
