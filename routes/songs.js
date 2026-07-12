const express  = require('express');
const Song     = require('../models/Song');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/songs  ←  عام (بدون توكن)
// الزوار بيجيبوا الأغاني الظاهرة فقط
// ============================================
router.get('/', async (req, res) => {
    try {
        const songs = await Song.find({ visible: true })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: songs.length,
            data: songs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// GET /api/songs/all  ←  أدمن فقط (كل الأغاني حتى المخفية)
// ============================================
router.get('/all', protect, async (req, res) => {
    try {
        const songs = await Song.find()
            .sort({ order: 1, createdAt: 1 })
            .lean();

        res.status(200).json({ success: true, count: songs.length, data: songs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// POST /api/songs  ←  أدمن فقط (إضافة أغنية)
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const { title, artist, description, spotifyUrl, youtubeUrl, audioUrl, coverUrl, mood, visible, order } = req.body;

        if (!title || !artist) {
            return res.status(400).json({ success: false, message: 'Title and artist are required.' });
        }

        const song = await Song.create({ title, artist, description, spotifyUrl, youtubeUrl, audioUrl, coverUrl, mood, visible, order });

        res.status(201).json({ success: true, message: 'Song added.', data: song });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// PUT /api/songs/:id  ←  أدمن فقط (تعديل)
// ============================================
router.put('/:id', protect, async (req, res) => {
    try {
        const song = await Song.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!song) return res.status(404).json({ success: false, message: 'Song not found.' });

        res.status(200).json({ success: true, message: 'Song updated.', data: song });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

// ============================================
// DELETE /api/songs/:id  ←  أدمن فقط (حذف)
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const song = await Song.findByIdAndDelete(req.params.id);

        if (!song) return res.status(404).json({ success: false, message: 'Song not found.' });

        res.status(200).json({ success: true, message: 'Song deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
});

module.exports = router;
