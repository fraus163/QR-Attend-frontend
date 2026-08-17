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
    // ===== РАСПИСАНИЕ =====
    getLessonsByFilter: async (params: FetchLessonsParams) => {
        const requestParams: Record<string, any> = {
            page: params.page,
            size: params.size,
        };

        if (params.date) {
            requestParams.date = params.date;
        }

        const response = await api.get<Page<LessonResponse>>('/lessons', {
            params: requestParams,
        });
        return response.data;
    },

    // ===== ПРЕПОДАВАТЕЛЬ =====
    startLesson: async (lessonId: number): Promise<QRCodeResponse> => {
        const response = await api.post<QRCodeResponse>(`/lessons/${lessonId}/start`);
        return response.data;
    },

    completeLesson: async (lessonId: number): Promise<void> => {
        await api.post(`/lessons/${lessonId}/complete`);
    },

    // ===== СТУДЕНТ =====
    scanQR: async (data: ScanQRRequest): Promise<AttendanceResponse> => {
        const response = await api.post<AttendanceResponse>('/lessons/scan', data);
        return response.data;
    },

    // ===== ПОСЕЩАЕМОСТЬ СТУДЕНТА =====
    getMyAttendance: async (params?: { page?: number; size?: number }): Promise<Page<AttendanceResponse>> => {
        const response = await api.get<Page<AttendanceResponse>>('/attendance/my', {
            params: {
                page: params?.page || 0,
                size: params?.size || 10,
            },
        });
        return response.data;
    },

    // ===== ПОСЕЩАЕМОСТЬ ПРЕПОДАВАТЕЛЯ =====
    getAttendanceForTeacher: async (params: AttendanceFilterParams & { page?: number; size?: number }): Promise<Page<AttendanceResponse>> => {
        const response = await api.get<Page<AttendanceResponse>>('/attendance/teacher', {
            params: {
                date: params.date,
                lessonId: params.lessonId,
                page: params.page || 0,
                size: params.size || 10,
            },
        });
        return response.data;
    },

    // ===== ОБНОВЛЕНИЕ ПОСЕЩАЕМОСТИ =====
    updateAttendance: async (attendanceId: number, data: UpdateAttendanceRequest): Promise<AttendanceResponse> => {
        const response = await api.put<AttendanceResponse>(`/attendance/${attendanceId}`, data);
        return response.data;
    },

    // ===== СТАТУС ЗАНЯТИЯ =====
    getLessonStatus: async (lessonId: number): Promise<LessonResponse> => {
        const response = await api.get<LessonResponse>(`/lessons/${lessonId}/status`);
        return response.data;
    },

    uploadFile: async (formData: FormData): Promise<{ url: string }> => {
        const response = await api.post<{ url: string }>('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};