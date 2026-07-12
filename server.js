// ============================================================
// TOJI Portfolio - Backend Server
// Stack: Node.js + Express.js + MongoDB (Mongoose)
// ============================================================

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// ---- استيراد الـ Routes ----
const authRoutes     = require('./routes/auth');
const projectRoutes  = require('./routes/projects');
const messageRoutes  = require('./routes/messages');
const configRoutes   = require('./routes/config');
const analyticsRoutes = require('./routes/analytics');
const songRoutes      = require('./routes/songs');
const wipRoutes       = require('./routes/wip');
const aiRoutes        = require('./routes/ai');
const uploadRoutes    = require('./routes/upload');
const linksRoutes     = require('./routes/links');
const guestbookRoutes = require('./routes/guestbook');

// ---- الاتصال بـ MongoDB ----
connectDB();

const app = express();

// ============================================================
// 1. Trust Railway's Proxy
//    مطلوب عشان rate limiting يشوف IP المستخدم الحقيقي
//    مش IP الـ proxy بتاع Railway
// ============================================================
app.set('trust proxy', 1);

// ============================================================
// 2. CORS Configuration
// ============================================================
const allowedOrigins = [
    process.env.FRONTEND_URL,                          // Production frontend URL
    'https://toji-portfolio-eight.vercel.app',         // Vercel production (explicit)
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Postman / curl / server-to-server
        
        // Allow all Vercel preview deployments for this project
        if (origin.endsWith('.vercel.app') && origin.includes('toji')) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`[CORS] Blocked: ${origin}`);
            }
            callback(new Error(`CORS Error: Origin (${origin}) not allowed.`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// ============================================================
// 3. Body Parser
//    حد عالي لـ /api/config لأن الـ JSON قد يكون كبير
// ============================================================
app.use('/api/config', express.json({ limit: '5mb' }));
app.use('/api/config', express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// 4. Rate Limiting
// ============================================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'طلبات كتير جداً، حاول بعد شوية.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'محاولات دخول كتير جداً، انتظر 15 دقيقة.' }
});

const messageLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'بعتت رسائل كتير، حاول بعد ساعة.' }
});

app.use('/api/', generalLimiter);

// ============================================================
// 5. Routes
// ============================================================
app.use('/api/auth',      authLimiter,    authRoutes);
app.use('/api/projects',                  projectRoutes);
app.use('/api/messages',  messageLimiter, messageRoutes);
app.use('/api/config',                    configRoutes);
app.use('/api/analytics',                 analyticsRoutes);
app.use('/api/songs',                     songRoutes);
app.use('/api/wip',                       wipRoutes);
app.use('/api/ai',                        aiRoutes);
app.use('/api/upload',                    uploadRoutes);
app.use('/api/links',                     linksRoutes);
app.use('/api/guestbook',                 guestbookRoutes);

// ============================================================
// 6. Health Check
// ============================================================
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 TOJI Portfolio API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// ============================================================
// 7. 404 Handler
// ============================================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route (${req.originalUrl}) not found.`
    });
});

// ============================================================
// 8. Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
    console.error('💥 Error:', err.message);
    if (err.message?.startsWith('CORS Error')) {
        return res.status(403).json({ success: false, message: err.message });
    }
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error.'
    });
});

// ============================================================
// 9. Start Server
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 TOJI Backend running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health\n`);
});
