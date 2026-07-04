// ============================================================
// TOJI Frontend - API Integration Module
// احفظ الملف ده: api.js  (في نفس مجلد script.js)
// ============================================================

// ✅ Auto-detects environment: local dev vs. Railway production
const API_BASE_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'                                          // Local development
        : 'https://portfolio-backend-production-1901.up.railway.app/api';     // Railway production

// ============================================================
// Token Management
// ✅ السبب: بنحفظ الـ JWT في sessionStorage مش localStorage
//    عشان لو أغلقت المتصفح الـ Token بيتمسح تلقائي
//    (أآمن لأنه مش بيفضل على الجهاز للأبد)
// ============================================================
const TokenManager = {
    get: () => sessionStorage.getItem('toji_admin_token'),
    set: (token) => sessionStorage.setItem('toji_admin_token', token),
    remove: () => sessionStorage.removeItem('toji_admin_token'),
    isLoggedIn: () => !!sessionStorage.getItem('toji_admin_token')
};

// ============================================================
// Base Fetch Helper
// ============================================================
async function apiFetch(endpoint, options = {}) {
    const token = TokenManager.get();

    const defaultHeaders = {
        'Content-Type': 'application/json',
        // لو في Token، بنبعته في كل Request تلقائي
        ...(token && { Authorization: `Bearer ${token}` })
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        const data = await response.json();

        // لو التوكن انتهى، طرد المستخدم
        if (response.status === 401) {
            TokenManager.remove();
            window.location.href = '/admin.html';
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || 'حدث خطأ في السيرفر');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}

// ============================================================
// Auth API
// ============================================================
const AuthAPI = {
    login: (email, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),

    verify: () => apiFetch('/auth/verify'),

    logout: () => TokenManager.remove()
};

// ============================================================
// Projects API
// ============================================================
const ProjectsAPI = {
    // جيب المشاريع الظاهرة (للعامة - بدون توكن)
    getPublic: () => apiFetch('/projects'),

    // جيب كل المشاريع (أدمن فقط)
    getAll: () => apiFetch('/projects/all'),

    // أضف مشروع جديد
    create: (projectData) =>
        apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        }),

    // عدّل مشروع
    update: (id, projectData) =>
        apiFetch(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        }),

    // احذف مشروع
    delete: (id) =>
        apiFetch(`/projects/${id}`, { method: 'DELETE' })
};

// ============================================================
// Messages API
// ============================================================
const MessagesAPI = {
    // إرسال رسالة (للعامة - بدون توكن)
    send: (messageData) =>
        apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        }),

    // جيب كل الرسائل (أدمن فقط)
    getAll: () => apiFetch('/messages'),

    // غيّر حالة الرسالة
    updateStatus: (id, status) =>
        apiFetch(`/messages/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    // احذف رسالة
    delete: (id) =>
        apiFetch(`/messages/${id}`, { method: 'DELETE' })
};

// ============================================================
// Config API — إعدادات الموقع الحية
// ✅ الأدمن يحفظ الإعدادات هنا فتظهر للزوار فورًا
// ============================================================
const ConfigAPI = {
    get: () => apiFetch('/config'),
    save: (configData) =>
        apiFetch('/config', {
            method: 'POST',
            body: JSON.stringify({ data: configData })
        })
};

// ============================================================
// Analytics API
// ============================================================
const AnalyticsAPI = {
    getStats: () => apiFetch('/analytics/stats'),
    getVisitors: (page = 1, limit = 20) =>
        apiFetch(`/analytics/visitors?page=${page}&limit=${limit}`)
};

// تصدير موحد لكل الـ APIs

// ============================================================
// Songs API
// ============================================================
const SongsAPI = {
    getPublic: ()      => apiFetch('/songs'),
    getAll:    ()      => apiFetch('/songs/all'),
    add:       (data)  => apiFetch('/songs',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/songs/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/songs/' + id, { method: 'DELETE' })
};

// ============================================================
// WIP API — Work in Progress Board
// ============================================================
const WipAPI = {
    getAll:  ()              => apiFetch('/wip'),
    create:  (data)          => apiFetch('/wip', { method: 'POST',  body: JSON.stringify(data) }),
    update:  (id, data)      => apiFetch(`/wip/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete:  (id)            => apiFetch(`/wip/${id}`, { method: 'DELETE' })
};

// ============================================================
// Bot API — Smart FAQ Bot
// ============================================================
const BotAPI = {
    getQuestions:  ()           => apiFetch('/bot/questions'),
    saveLead:      (data)       => apiFetch('/bot/lead', { method: 'POST',  body: JSON.stringify(data) }),
    updateLead:    (id, steps)  => apiFetch(`/bot/lead/${id}`, { method: 'PATCH', body: JSON.stringify({ steps }) }),
    // Admin
    getLeads:      (page = 1)   => apiFetch(`/bot/leads?page=${page}`),
    deleteLead:    (id)         => apiFetch(`/bot/leads/${id}`,  { method: 'DELETE' }),
    deleteAllLeads:()           => apiFetch('/bot/leads',        { method: 'DELETE' }),
    createQuestion:(data)       => apiFetch('/bot/questions',    { method: 'POST',  body: JSON.stringify(data) }),
    updateQuestion:(id, data)   => apiFetch(`/bot/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteQuestion:(id)         => apiFetch(`/bot/questions/${id}`, { method: 'DELETE' }),
    seed:          (force)      => apiFetch('/bot/seed',         { method: 'POST',  body: JSON.stringify({ force }) })
};

window.TojiAPI = { TokenManager, AuthAPI, ProjectsAPI, MessagesAPI, ConfigAPI, AnalyticsAPI, SongsAPI, WipAPI, BotAPI };
