import {api} from "./axiosInstance.ts";
import type {FetchSubjectsParams, SubjectRequest, SubjectResponse} from "../types/Subject.ts";
import type {Page} from "../types/PageableResponse.ts";

export const subjectsApi = {
    getSubjectsByFilter: async (params: FetchSubjectsParams) => {
        const response = await api.get<Page<SubjectResponse>>('/subjects', {
            params: {
                page: params.page,
                size: params.size,
                name: params.name,
                course: params.course,
            }
        });
        return response.data;
    },

    createSubject: async (subject: SubjectRequest) => {
        const response = await api.post<SubjectRequest>('/subjects', subject);
        return response.data;
    },

    deleteSubject: async (id: number) => {
        await api.delete(`/subjects/${id}`);
    },

    putSubject: async (id: number, subject: SubjectRequest) => {
        const response = await api.put<SubjectResponse>(`/subjects/${id}`, subject);
        return response.data;
    }
}