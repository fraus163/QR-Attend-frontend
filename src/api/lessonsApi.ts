import { api } from './axiosInstance';
import type { Page } from '../types/PageableResponse';
import type {
    FetchLessonsParams,
    LessonResponse,
    QRCodeResponse,
    ScanQRRequest,
} from '../types/Lesson';
import type {
    AttendanceResponse,
    UpdateAttendanceRequest,
    AttendanceFilterParams,
} from '../types/Attendance';

export const lessonsApi = {
    getLessonsByFilter: async (params: FetchLessonsParams): Promise<Page<LessonResponse>> => {
        const response = await api.get<Page<LessonResponse>>('/lessons', {
            params: {
                page: params.page ?? 0,
                size: params.size ?? 10,
                date: params.date || undefined,
            },
        });
        return response.data;
    },

    startLesson: async (lessonId: number): Promise<QRCodeResponse> => {
        const response = await api.post<QRCodeResponse>(`/lessons/${lessonId}/start`);
        return response.data;
    },

    getNextQrToken: async (lessonId: number): Promise<QRCodeResponse> => {
        const response = await api.get<QRCodeResponse>(`/lessons/${lessonId}/qr-token`);
        return response.data;
    },

    completeLesson: async (lessonId: number): Promise<void> => {
        await api.post(`/lessons/${lessonId}/complete`);
    },

    scanQR: async (data: ScanQRRequest): Promise<AttendanceResponse> => {
        const response = await api.post<AttendanceResponse>('/lessons/scan', data);
        return response.data;
    },

    getMyAttendance: async (params?: { page?: number; size?: number }): Promise<Page<AttendanceResponse>> => {
        const response = await api.get<Page<AttendanceResponse>>('/attendance/my', {
            params: {
                page: params?.page ?? 0,
                size: params?.size ?? 10,
            },
        });
        return response.data;
    },

    getAttendanceForTeacher: async (params: AttendanceFilterParams): Promise<Page<AttendanceResponse>> => {
        const response = await api.get<Page<AttendanceResponse>>('/attendance/teacher', {
            params: {
                date: params.date || undefined,
                subjectName: params.subjectName || undefined,
                page: params.page ?? 0,
                size: params.size ?? 10,
            },
        });
        return response.data;
    },

    updateAttendance: async (attendanceId: number, data: UpdateAttendanceRequest): Promise<AttendanceResponse> => {
        const response = await api.put<AttendanceResponse>(`/attendance/${attendanceId}`, data);
        return response.data;
    },

    getLessonStatus: async (lessonId: number): Promise<LessonResponse> => {
        const response = await api.get<LessonResponse>(`/lessons/${lessonId}/status`);
        return response.data;
    },

    getMySubjects: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/subjects/my');
        return response.data;
    },

    uploadFile: async (formData: FormData): Promise<{ url: string }> => {
        const response = await api.post<{ url: string }>('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};