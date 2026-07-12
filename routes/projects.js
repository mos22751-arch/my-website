const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/projects  →  عام (بدون توكن)
// جيب كل المشاريع الظاهرة مرتبة
// ============================================
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find({ isVisible: true })
            .sort({ order: 1, createdAt: -1 }); // ترتيب حسب order ثم الأحدث

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

// ============================================
// GET /api/projects/all  →  أدمن فقط
// جيب كل المشاريع حتى المخفية
// ============================================
router.get('/all', protect, async (req, res) => {
    try {
        const projects = await Project.find().sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

// ============================================
// POST /api/projects  →  أدمن فقط
// أضف مشروع جديد
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const project = await Project.create(req.body);

        res.status(201).json({
            success: true,
            message: 'تم إضافة المشروع بنجاح.',
            data: project
        });
    } catch (error) {
        // Validation errors من Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join(' | ') });
        }
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

// ============================================
// PUT /api/projects/:id  →  أدمن فقط
// عدّل مشروع موجود
// ============================================
router.put('/:id', protect, async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,           // ارجع النسخة الجديدة بعد التعديل
                runValidators: true  // اشغّل الـ Validation عند التعديل
            }
        );

        if (!project) {
            return res.status(404).json({ success: false, message: 'المشروع مش موجود.' });
        }

        res.status(200).json({
            success: true,
            message: 'تم تعديل المشروع بنجاح.',
            data: project
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
// DELETE /api/projects/:id  →  أدمن فقط
// احذف مشروع
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'المشروع مش موجود.' });
        }

        res.status(200).json({
            success: true,
            message: 'تم حذف المشروع بنجاح.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر.', error: error.message });
    }
});

module.exports = router;
