import client from './client';
import type { ApiResponse, Difficulty, PostCreateRequest, PostDetailResponse, PostSummaryResponse, ProjectType, RoleType } from './types';

export interface PostFilterParams {
  role?: RoleType;
  difficulty?: Difficulty;
  projectType?: ProjectType;
  techStack?: string[];
  keyword?: string;
}

export const getPosts = (params: PostFilterParams = {}) => {
  const query: Record<string, string | string[]> = {};
  if (params.role) query.role = params.role;
  if (params.difficulty) query.difficulty = params.difficulty;
  if (params.projectType) query.projectType = params.projectType;
  if (params.techStack && params.techStack.length > 0) query.techStack = params.techStack;
  if (params.keyword) query.keyword = params.keyword;
  return client.get<ApiResponse<PostSummaryResponse[]>>('/api/posts', {
    params: query,
    paramsSerializer: (p) => {
      const parts: string[] = [];
      for (const [k, v] of Object.entries(p)) {
        if (Array.isArray(v)) {
          v.forEach((item) => parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(item)}`));
        } else {
          parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        }
      }
      return parts.join('&');
    },
  });
};

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

export const addBookmark = (id: number) =>
  client.post<ApiResponse<null>>(`/api/posts/${id}/bookmark`);

export const removeBookmark = (id: number) =>
  client.delete<ApiResponse<null>>(`/api/posts/${id}/bookmark`);