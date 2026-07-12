const express = require('express');
const router  = express.Router();
const Visit   = require('../models/Visit');
const { protect } = require('../middleware/auth');
const { getClientIp } = require('../utils/getClientIp');

// ============================================================
// navigator.sendBeacon() بيبعت الـ body كـ Blob بنوع "text/plain"
// (شوف script.js للتفصيل — ده مقصود عشان يتفادى مشكلة CORS
// preflight). الـ express.json() العام في server.js مبيقرأش
// غير Content-Type: application/json، فمحتاجين middleware هنا
// يقرأ الـ text/plain ده كـ نص خام، وبعدين نعمله JSON.parse يدوي.
// ============================================================
router.use('/visit/:id', express.text({ type: 'text/plain', limit: '10kb' }));

function parseBeaconBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string' && req.body.trim()) {
        try { return JSON.parse(req.body); } catch (_) { return {}; }
    }
    return {};
}

// ============================================================
// POST /api/analytics/visit — تسجيل زيارة جديدة (عام)
// ============================================================
router.post('/visit', async (req, res) => {
    try {
        const ip = getClientIp(req);

        const {
            device, os, browser, referrer, language,
            screen, sectionsViewed, projectsClicked,
            linksClicked, timeOnSite
        } = req.body;

        // منع تسجيل زيارات الأدمن
        const auth = req.headers.authorization;
        if (auth && auth.startsWith('Bearer ')) {
            return res.json({ success: true, tracked: false });
        }

        const visit = await Visit.create({
            ip,
            device:          device    || 'desktop',
            os:              os        || '',
            browser:         browser   || '',
            referrer:        referrer  || '',
            language:        language  || '',
            screen:          screen    || '',
            sectionsViewed:  Array.isArray(sectionsViewed)  ? sectionsViewed  : [],
            projectsClicked: Array.isArray(projectsClicked) ? projectsClicked : [],
            linksClicked:    Array.isArray(linksClicked)    ? linksClicked    : [],
            timeOnSite:      Number(timeOnSite) || 0
        });

        res.json({ success: true, id: visit._id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// PATCH و POST /api/analytics/visit/:id — تحديث بيانات الجلسة
//
// ✅ لازم الاتنين (PATCH و POST) للـ endpoint ده: المتصفح بيستخدم
//    navigator.sendBeacon() عشان يبعت التحديث وقت ما الزائر يقفل
//    الصفحة (أضمن طريقة تتبعت فعلاً)، لكن sendBeacon() بيبعت POST
//    بس ومقدرش يبعت PATCH. من غير الـ route ده، كل تحديثات الوقت
//    والأقسام والمشاريع كانت بترفض بصمت (404) ومكانتش بتتسجل خالص.
// ============================================================
async function updateVisitHandler(req, res) {
    try {
        const { sectionsViewed, projectsClicked, linksClicked, timeOnSite } = parseBeaconBody(req);
        await Visit.findByIdAndUpdate(req.params.id, {
            $set: {
                sectionsViewed:  sectionsViewed  || [],
                projectsClicked: projectsClicked || [],
                linksClicked:    linksClicked    || [],
                timeOnSite:      Number(timeOnSite) || 0
            }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

router.patch('/visit/:id', updateVisitHandler);
router.post('/visit/:id', updateVisitHandler);

// ============================================================
// GET /api/analytics/visitors — جدول الزوار بصفحات (أدمن فقط)
// ============================================================
router.get('/visitors', protect, async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));
        const skip  = (page - 1) * limit;

        const [visitors, total] = await Promise.all([
            Visit.find()
                .sort({ visitedAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('ip device os browser referrer language sectionsViewed timeOnSite visitedAt'),
            Visit.countDocuments()
        ]);

        res.json({
            success: true,
            data: visitors,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit))
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ============================================================
// GET /api/analytics/stats — إحصائيات كاملة (أدمن فقط)
// ============================================================
router.get('/stats', protect, async (req, res) => {
    try {
        const now   = new Date();
        const day   = new Date(now - 24*60*60*1000);
        const week  = new Date(now - 7*24*60*60*1000);
        const month = new Date(now - 30*24*60*60*1000);

        const [
            totalVisits, todayVisits, weekVisits, monthVisits,
            deviceStats, topSections, topProjects
        ] = await Promise.all([
            Visit.countDocuments(),
            Visit.countDocuments({ visitedAt: { $gte: day   } }),
            Visit.countDocuments({ visitedAt: { $gte: week  } }),
            Visit.countDocuments({ visitedAt: { $gte: month } }),

            // توزيع الأجهزة
            Visit.aggregate([
                { $group: { _id: '$device', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // الأقسام الأكثر مشاهدة
            Visit.aggregate([
                { $unwind: '$sectionsViewed' },
                { $group: { _id: '$sectionsViewed', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),

            // المشاريع الأكثر نقرًا
            Visit.aggregate([
                { $unwind: '$projectsClicked' },
                { $group: { _id: '$projectsClicked', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ])
        ]);

        // متوسط وقت الجلسة
        const avgTimeResult = await Visit.aggregate([
            { $match: { timeOnSite: { $gt: 0 } } },
            { $group: { _id: null, avg: { $avg: '$timeOnSite' } } }
        ]);
        const avgTime = Math.round(avgTimeResult[0]?.avg || 0);

        res.json({
            success: true,
            data: {
                counts: { total: totalVisits, today: todayVisits, week: weekVisits, month: monthVisits },
                avgTime,
                deviceStats,
                topSections,
                topProjects
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
