import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:8000',
});

// ── Request interceptor: attach JWT access token ──
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: refresh token on 401 ──
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (
            error.response?.status === 401 &&
            !original._retry &&
            localStorage.getItem('refresh_token')
        ) {
            original._retry = true;
            try {
                const { data } = await axios.post(
                    'http://localhost:8000/api/auth/token/refresh/',
                    { refresh: localStorage.getItem('refresh_token') },
                );
                localStorage.setItem('access_token', data.access);
                if (data.refresh) {
                    localStorage.setItem('refresh_token', data.refresh);
                }
                original.headers.Authorization = `Bearer ${data.access}`;
                return API(original);
            } catch {
                // Refresh failed — clear everything
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    },
);

export default API;
