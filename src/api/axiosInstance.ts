import axios from "axios";

export const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const staticApi = axios.create({
    baseURL: 'http://localhost:8080',
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