const express    = require('express');
const router     = express.Router();
const Wip        = require('../models/Wip');
const { protect } = require('../middleware/auth');

// GET /api/wip  —  للزوار
router.get('/', async (req, res) => {
    try {
        const items = await Wip.find().sort({ status: 1, order: 1, createdAt: -1 });
        res.json({ success: true, data: items });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/wip  —  أدمن
router.post('/', protect, async (req, res) => {
    try {
        const item = await Wip.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

// PATCH /api/wip/:id  —  تغيير الـ status (drag or button)
router.patch('/:id', protect, async (req, res) => {
    try {
        const item = await Wip.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/wip/:id  —  أدمن
router.delete('/:id', protect, async (req, res) => {
    try {
        await Wip.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
