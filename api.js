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

    // ✅ حد أقصى 25 ثانية للطلب — لو السيرفر مش بيرد، بنوقف الطلب
    //    ونرجّع خطأ واضح بدل ما الزرار يفضل شغال (loading) للأبد
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers },
            signal: controller.signal
        });

        const data = await response.json();

        // لو التوكن انتهى، طرد المستخدم
        if (response.status === 401) {
            TokenManager.remove();
            window.location.href = '/admin.html';
            return;
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || 'حدث خطأ في السيرفر');
        }

        return data;
    } catch (error) {
        if (error.name === 'AbortError') {
            const timeoutError = new Error('السيرفر مبيردش. جرب تاني بعد شوية أو تأكد إن الباك إند شغال.');
            console.error('API Error: request timed out ->', endpoint);
            throw timeoutError;
        }
        console.error('API Error:', error.message);
        throw error;
    } finally {
        clearTimeout(timeoutId);
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

    logout: () => TokenManager.remove(),

    // "نسيت كلمة المرور" — يبعت كود تحقق بالإيميل أو الهاتف
    forgotPassword: (method) =>
        apiFetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ method })
        }),

    // تأكيد الكود وتغيير كلمة المرور
    resetPassword: (code, newPassword) =>
        apiFetch('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ code, newPassword })
        })
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
// AI API — Gemini-powered chat assistant (server-side proxy)
// ============================================================
const AiAPI = {
    // messages: [{ role: 'user'|'assistant', content: string }, ...]
    chat:   (messages, clientId) => apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ messages, clientId }) }),
    status: ()           => apiFetch('/ai/status'),
    // Admin
    getSettings:    ()      => apiFetch('/ai/settings'),
    updateSettings: (data)  => apiFetch('/ai/settings', { method: 'PUT', body: JSON.stringify(data) }),
    // شات لكل شخص لوحده
    getThreads:     ()      => apiFetch('/ai/logs/threads'),
    getThread:      (key)   => apiFetch(`/ai/logs/thread/${encodeURIComponent(key)}`),
    deleteThread:   (key)   => apiFetch(`/ai/logs/thread/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    // (Legacy) قائمة مسطحة
    getLogs:        (page = 1) => apiFetch(`/ai/logs?page=${page}`),
    deleteLog:      (id)    => apiFetch(`/ai/logs/${id}`, { method: 'DELETE' }),
    deleteAllLogs:  ()      => apiFetch('/ai/logs', { method: 'DELETE' })
};

// ============================================================
// Links API — قسم اللينكات (Connect) في الموقع
// ============================================================
const LinksAPI = {
    getPublic: ()      => apiFetch('/links'),
    getAll:    ()      => apiFetch('/links/all'),
    create:    (data)  => apiFetch('/links',       { method: 'POST',   body: JSON.stringify(data) }),
    update:    (id, d) => apiFetch('/links/' + id, { method: 'PUT',    body: JSON.stringify(d)    }),
    remove:    (id)    => apiFetch('/links/' + id, { method: 'DELETE' })
};

// ============================================================
// Guestbook API — دفتر الزوار
// ============================================================
const GuestbookAPI = {
    getPublic:      (limit = 60)  => apiFetch(`/guestbook?limit=${limit}`),
    getAll:         ()            => apiFetch('/guestbook/all'),
    create:         (data)        => apiFetch('/guestbook', { method: 'POST', body: JSON.stringify(data) }),
    setVisibility:  (id, visible) => apiFetch(`/guestbook/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ visible }) }),
    remove:         (id)          => apiFetch(`/guestbook/${id}`, { method: 'DELETE' })
};

window.TojiAPI = { TokenManager, AuthAPI, ProjectsAPI, MessagesAPI, ConfigAPI, AnalyticsAPI, SongsAPI, WipAPI, AiAPI, LinksAPI, GuestbookAPI, API_BASE_URL };
