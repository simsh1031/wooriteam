import client from './client';
import type { ApiResponse, ApplicationResponse, MyApplicationResponse } from './types';

export const applyToPost = (postId: number, data: {
  roleId: number;
  motivation: string;
  techStack: string;
  experience: string;
  contact: string;
}) => client.post<ApiResponse<ApplicationResponse>>(`/api/posts/${postId}/applications`, data);

export const getApplicationsByPost = (postId: number) =>
  client.get<ApiResponse<ApplicationResponse[]>>(`/api/posts/${postId}/applications`);

export const getMyPosts = () =>
  client.get<ApiResponse<import('./types').PostSummaryResponse[]>>('/api/my/posts');

export const getMyApplications = () =>
  client.get<ApiResponse<MyApplicationResponse[]>>('/api/my/applications');