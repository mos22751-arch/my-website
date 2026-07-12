const express    = require('express');
const multer     = require('multer');
const cloudinary = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

const router = express.Router();

// multer — بيحفظ الملف في الـ RAM مؤقتاً قبل رفعه على Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
        if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|m4a)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الملف مش مدعوم. ارفع MP3 أو WAV أو OGG بس.'), false);
        }
    }
});

// multer منفصل للصور — يقبل jpg/png/webp/gif بحد أقصى 8MB
const uploadImage = multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('نوع الصورة مش مدعوم. ارفع JPG أو PNG أو WEBP بس.'), false);
        }
    }
});

// ============================================
// POST /api/upload/image  ←  أدمن فقط
// يرفع صورة (مثلاً لمشروع) على Cloudinary ويرجع الرابط
// ============================================
router.post('/image', protect, uploadImage.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'مفيش صورة اتبعتت.' });
        }

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    folder:        'toji-projects',
                    use_filename:  true,
                    unique_filename: true,
                    // تصغير + ضغط تلقائي عشان الأداء
                    transformation: [
                        { width: 1200, height: 900, crop: 'limit' },
                        { quality: 'auto:good' },
                        { fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.status(200).json({
            success:  true,
            message:  'تم رفع الصورة بنجاح!',
            url:      result.secure_url,
            publicId: result.public_id,
            width:    result.width,
            height:   result.height,
            size:     req.file.size
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل رفع الصورة: ' + (error.message || 'خطأ في السيرفر')
        });
    }
});

// ============================================
// POST /api/upload/audio  ←  أدمن فقط
// يرفع ملف MP3 على Cloudinary ويرجع الرابط
// ============================================
router.post('/audio', protect, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'مفيش ملف اتبعت.' });
        }

        // رفع الملف على Cloudinary من الـ buffer
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'video', // Cloudinary بيعامل الصوت كـ video
                    folder:        'toji-songs',
                    format:        'mp3',
                    audio_codec:   'mp3',
                    use_filename:  true,
                    unique_filename: true
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        res.status(200).json({
            success:  true,
            message:  'تم رفع الملف بنجاح!',
            url:      result.secure_url,
            publicId: result.public_id,
            duration: result.duration ? Math.round(result.duration) : null,
            size:     req.file.size
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل رفع الملف: ' + (error.message || 'خطأ في السيرفر')
        });
    }
});

module.exports = router;
