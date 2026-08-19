import { api } from './axiosInstance';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    tokeType?: string;
    role: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        const { accessToken, role } = response.data;

        // Синхронно сохраняем в localStorage
        if (accessToken) {
            localStorage.setItem('token', accessToken);
        }
        if (role) {
            localStorage.setItem('userRole', role);
        }

        return response.data;
    },

    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
    },

    getToken: (): string | null => {
        return localStorage.getItem('token');
    },

    getRole: (): string | null => {
        return localStorage.getItem('userRole');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },
};