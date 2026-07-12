const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Song title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        artist: {
            type: String,
            required: [true, 'Artist name is required'],
            trim: true,
            maxlength: [100, 'Artist cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, 'Description cannot exceed 300 characters'],
            default: ''
        },
        // رابط Spotify أو YouTube أو MP3 مباشر
        spotifyUrl: { type: String, trim: true, default: '' },
        youtubeUrl: { type: String, trim: true, default: '' },
        audioUrl:   { type: String, trim: true, default: '' }, // رابط MP3 من Cloudinary
        // رابط صورة الغلاف (URL من Spotify أو أي مكان)
        coverUrl:   { type: String, trim: true, default: '' },
        // المزاج: chill / hype / sad / focus / vibe
        mood:       { type: String, trim: true, default: 'vibe' },
        visible:    { type: Boolean, default: true },
        order:      { type: Number, default: 0 }
    },
    { timestamps: true }
);

// ترتيب تصاعدي حسب order
songSchema.index({ order: 1 });

module.exports = mongoose.model('Song', songSchema);
