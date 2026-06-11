import client from './client';
import type { ApiResponse, ApplicationResponse, MyApplicationResponse } from './types';

interface ApplicationPayload {
  roleId: number;
  motivation: string;
  techStack: string;
  experience: string;
  contact: string;
}

export const applyToPost = (postId: number, data: ApplicationPayload) =>
  client.post<ApiResponse<ApplicationResponse>>(`/api/posts/${postId}/applications`, data);

export const getApplicationsByPost = (postId: number) =>
  client.get<ApiResponse<ApplicationResponse[]>>(`/api/posts/${postId}/applications`);

export const getMyApplicationForPost = (postId: number) =>
  client.get<ApiResponse<ApplicationResponse | null>>(`/api/posts/${postId}/applications/me`);

export const updateMyApplication = (postId: number, data: ApplicationPayload) =>
  client.put<ApiResponse<ApplicationResponse>>(`/api/posts/${postId}/applications/me`, data);

export const withdrawMyApplication = (postId: number) =>
  client.delete<ApiResponse<void>>(`/api/posts/${postId}/applications/me`);

export const getMyPosts = () =>
  client.get<ApiResponse<import('./types').PostSummaryResponse[]>>('/api/my/posts');

export const getMyApplications = () =>
  client.get<ApiResponse<MyApplicationResponse[]>>('/api/my/applications');