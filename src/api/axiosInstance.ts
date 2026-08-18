import axios from "axios";

const getBaseUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    console.log('📍 Hostname:', hostname);
    console.log('📍 Protocol:', protocol);

    // Если через ngrok (HTTPS) — но у тебя ngrok заблокирован, так что этот блок не нужен
    if (hostname.includes('ngrok-free.dev') || hostname.includes('ngrok.io')) {
        return `https://${hostname}:8080/api/v1`;
    }

    // 🔥 ВСЕГДА используем HTTP для бэкенда, т.к. он на HTTP
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `http://${hostname}:8080/api/v1`;
    }

    return 'http://localhost:8080/api/v1';
};

const getStaticUrl = () => {
    const hostname = window.location.hostname;

    if (hostname.includes('ngrok-free.dev') || hostname.includes('ngrok.io')) {
        return `https://${hostname}:8080`;
    }

    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `http://${hostname}:8080`;
    }

    return 'http://localhost:8080';
};

export const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

export const staticApi = axios.create({
    baseURL: getStaticUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Интерсептор для добавления токена
const authInterceptor = (config: any) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    return config;
};

api.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
staticApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

// Интерсептор для обработки 401
const errorInterceptor = (error: any) => {
    if (error.response?.status === 401) {
        console.log('401 Unauthorized - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
    }
    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, errorInterceptor);
staticApi.interceptors.response.use((response) => response, errorInterceptor);

console.log('📡 API Base URL:', api.defaults.baseURL);
console.log('📡 Static Base URL:', staticApi.defaults.baseURL);