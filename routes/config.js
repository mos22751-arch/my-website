const express = require('express');
const SiteConfig = require('../models/SiteConfig');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/config  →  عام (بدون توكن)
// يجيب أحدث إعدادات الموقع (TOJI_CONTENT من MongoDB)
// الفرونت إند بيستخدمه عشان يعرض أحدث محتوى للزوار
// ============================================
router.get('/', async (req, res) => {
    try {
        const config = await SiteConfig.findOne({ key: 'main' });

        if (!config) {
            // مفيش config محفوظ بعد → الفرونت إند هيستخدم content.js الاستاتيك
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No live config saved yet. Using static content.js.'
            });
        }

        res.status(200).json({
            success: true,
            data: config.data,
            updatedAt: config.updatedAt
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching config.', error: error.message });
    }
});

// ============================================
// POST /api/config  →  أدمن فقط (JWT)
// يحفظ إعدادات الموقع الجديدة في MongoDB
// بيُستدعى من admin.js كل ما الأدمن يحفظ
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const { data } = req.body;

        if (!data || typeof data !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Config data is required and must be a JSON object.'
            });
        }

        // upsert: لو موجود → عدّله، لو مش موجود → أنشئه
        const config = await SiteConfig.findOneAndUpdate(
            { key: 'main' },
            {
                data,
                updatedBy: req.admin?.email || 'admin'
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Site config saved. Changes will be visible to all visitors on next page load.',
            updatedAt: config.updatedAt
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error saving config.', error: error.message });
    }
});

module.exports = router;
