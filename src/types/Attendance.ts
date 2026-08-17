export type AttendanceType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceResponse {
    id: number;
    studentId: number;
    studentFullName?: string;
    lessonId: number;
    lessonDate?: string;
    lessonTimeFrom?: string;
    lessonTimeTo?: string;
    subjectName?: string;
    mark: AttendanceType;
    link?: string;        // Ссылка на фото справки
    comment?: string;
}

export interface UpdateAttendanceRequest {
    mark: AttendanceType;
    comment?: string;
    link?: string;
}

export interface AttendanceFilterParams {
    date?: string;
    lessonId?: number;
}

export interface AttendanceWithStudent {
    id: number;
    studentId: number;
    studentFullName: string;
    lessonId: number;
    mark: AttendanceType;
    link?: string;
    comment?: string;
}