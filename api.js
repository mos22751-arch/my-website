// ============================================================
// TOJI Frontend - API Integration Module
// ============================================================

// Auto-detect environment
const API_BASE_URL =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://portfolio-backend-production-1901.up.railway.app/api';

// ============================================================
// Token Management
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
        ...(token && { Authorization: `Bearer ${token}` })
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        const data = await response.json();

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
    getPublic: () => apiFetch('/projects'),

    getAll: () => apiFetch('/projects/all'),

    create: (projectData) =>
        apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        }),

    update: (id, projectData) =>
        apiFetch(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        }),

    delete: (id) =>
        apiFetch(`/projects/${id}`, {
            method: 'DELETE'
        })
};

// ============================================================
// Messages API
// ============================================================
const MessagesAPI = {
    send: (messageData) =>
        apiFetch('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        }),

    getAll: () => apiFetch('/messages'),

    updateStatus: (id, status) =>
        apiFetch(`/messages/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),

    delete: (id) =>
        apiFetch(`/messages/${id}`, {
            method: 'DELETE'
        })
};

// ============================================================
// Config API
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
// Export APIs
// ============================================================
window.TojiAPI = {
    TokenManager,
    AuthAPI,
    ProjectsAPI,
    MessagesAPI,
    ConfigAPI
};