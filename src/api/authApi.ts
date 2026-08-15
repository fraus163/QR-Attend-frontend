import {api} from "./axiosInstance.ts";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface AuthResponse {
    jwtToken: string;
    role: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<string> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        localStorage.setItem('token', response.data.jwtToken);
        console.log(response.data.jwtToken);
        return response.data.role;
    },

    logout: () => {
        localStorage.removeItem('token');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};