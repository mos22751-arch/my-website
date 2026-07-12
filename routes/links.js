const express  = require('express');
const Link     = require('../models/Link');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/links  ←  عام (بدون توكن)
// الزوار بيجيبوا اللينكات الظاهرة فقط
// ============================================
router.get('/', async (req, res) => {
    try {
        const links = await Link.find({ visible: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        res.status(200).json({ success: true, count: links.length, data: links });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// GET /api/links/all  ←  أدمن فقط (كل اللينكات حتى المخفية)
// ============================================
router.get('/all', protect, async (req, res) => {
    try {
        const links = await Link.find()
            .sort({ order: 1, createdAt: 1 })
            .lean();

        res.status(200).json({ success: true, count: links.length, data: links });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// POST /api/links  ←  أدمن فقط (إضافة لينك جديد)
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const { title, url, imageUrl, icon, order, visible } = req.body;

        if (!title || !url) {
            return res.status(400).json({ success: false, message: 'الاسم والرابط مطلوبين.' });
        }

        const link = await Link.create({ title, url, imageUrl, icon, order, visible });

        res.status(201).json({ success: true, message: 'تم إضافة اللينك.', data: link });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// PUT /api/links/:id  ←  أدمن فقط (تعديل)
// ============================================
router.put('/:id', protect, async (req, res) => {
    try {
        const link = await Link.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!link) return res.status(404).json({ success: false, message: 'اللينك غير موجود.' });

        res.status(200).json({ success: true, message: 'تم تعديل اللينك.', data: link });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// DELETE /api/links/:id  ←  أدمن فقط (حذف)
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const link = await Link.findByIdAndDelete(req.params.id);

        if (!link) return res.status(404).json({ success: false, message: 'اللينك غير موجود.' });

        res.status(200).json({ success: true, message: 'تم حذف اللينك.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
