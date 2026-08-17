export type AttendanceType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

// types/Attendance.ts
export interface AttendanceResponse {
    id: number;
    studentId: number;
    studentFullName?: string;
    lessonId: number;
    lessonDate?: string;
    lessonTimeFrom?: string;
    lessonTimeTo?: string;
    subjectName?: string;
    teacherFullName?: string;  // Добавить поле для преподавателя
    mark: AttendanceType;
    link?: string;
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