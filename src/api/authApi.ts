import { api } from "./axiosInstance.ts";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    jwtToken: string;
    role: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<{ token: string; role: string }> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        const { jwtToken, role } = response.data;

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('userRole', role);
        console.log('Token:', jwtToken);
        console.log('Role:', role);

        return { token: jwtToken, role };
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    getRole: (): string | null => {
        return localStorage.getItem('userRole');
    },

    getToken: (): string | null => {
        return localStorage.getItem('token');
    }
};