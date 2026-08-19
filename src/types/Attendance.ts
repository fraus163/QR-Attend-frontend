export type AttendanceType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface AttendanceResponse {
    id: number;
    studentId: number;
    studentFullName?: string;
    groupName?: string;
    lessonId: number;
    lessonDate?: string;
    lessonTimeFrom?: string;
    lessonTimeTo?: string;
    subjectName?: string;
    teacherFullName?: string;
    mark: AttendanceType;
    link?: string;
    comment?: string;
    isMarked?: boolean;
}

export interface UpdateAttendanceRequest {
    mark?: AttendanceType;
    comment?: string;
    link?: string;
}

export interface AttendanceFilterParams {
    date?: string;
    subjectName?: string;
    lessonId?: number;
    page?: number;
    size?: number;
}

export interface AttendanceWithStudent {
    id: number;
    studentId: number;
    studentFullName: string;
    groupName?: string;
    lessonId: number;
    mark: AttendanceType;
    link?: string;
    comment?: string;
    isMarked?: boolean;
}