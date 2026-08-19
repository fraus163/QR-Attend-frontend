import axios, { AxiosError } from 'axios';

const NGROK_HOST = 'https://wreckage-overprice-reverence.ngrok-free.dev';

export const BASE_URL = `${NGROK_HOST}/api/v1`;
export const STATIC_URL = NGROK_HOST;

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

export const staticApi = axios.create({
    baseURL: STATIC_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

const authInterceptor = (config: any) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

api.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));
staticApi.interceptors.request.use(authInterceptor, (error) => Promise.reject(error));

const errorInterceptor = (error: AxiosError) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');

        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, errorInterceptor);
staticApi.interceptors.response.use((response) => response, errorInterceptor);