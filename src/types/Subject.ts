export interface SubjectResponse {
    id: number;
    name: string;
    course: number;
}

export interface SubjectRequest {
    name: string;
    course: number;
}

export interface FetchSubjectsParams {
    page: number;
    size: number;
    name?: string;
    course?: number;
}