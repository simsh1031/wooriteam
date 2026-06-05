import client from './client';
import type { ApiResponse, PostCreateRequest, PostDetailResponse, PostSummaryResponse, RoleType } from './types';

export const getPosts = (role?: RoleType) =>
  client.get<ApiResponse<PostSummaryResponse[]>>('/api/posts', { params: role ? { role } : {} });

export const getPost = (id: number) =>
  client.get<ApiResponse<PostDetailResponse>>(`/api/posts/${id}`);

export const createPost = (data: PostCreateRequest) =>
  client.post<ApiResponse<PostDetailResponse>>('/api/posts', data);

export const updatePost = (id: number, data: PostCreateRequest) =>
  client.put<ApiResponse<PostDetailResponse>>(`/api/posts/${id}`, data);

export const deletePost = (id: number) =>
  client.delete<ApiResponse<null>>(`/api/posts/${id}`);

export const closePost = (id: number) =>
  client.patch<ApiResponse<null>>(`/api/posts/${id}/close`);