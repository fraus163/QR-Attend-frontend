export type LessonStatus = 'IN_WAITING' | 'IN_PROGRESS' | 'DONE';

export interface LessonResponse {
    id: number;
    teacherFullName?: string;
    teacherLastName?: string;
    teacherFirstName?: string;
    teacherPatronymic?: string;
    subjectName: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    audience: string;
    status: LessonStatus;
    isMarked?: boolean;
}

export interface FetchLessonsParams {
    page?: number;
    size?: number;
    date?: string;
}

export interface QRCodeResponse {
    token: string;
    lessonId: number;
    ttl: number;
    expiresAt: string;
}

export interface ScanQRRequest {
    token: string;
    lessonId: number;
}