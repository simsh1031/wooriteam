import client from './client';
import type {
  ApiResponse,
  PublicProfileDetailResponse,
  PublicProfileSummaryResponse,
  UserProfileRequest,
  UserProfileResponse,
} from './types';

export const getMyProfile = () =>
  client.get<ApiResponse<UserProfileResponse>>('/api/my/profile');

export const updateMyProfile = (data: UserProfileRequest) =>
  client.put<ApiResponse<UserProfileResponse>>('/api/my/profile', data);

export const getPublicProfiles = () =>
  client.get<ApiResponse<PublicProfileSummaryResponse[]>>('/api/users');

export const getPublicProfileDetail = (userId: number) =>
  client.get<ApiResponse<PublicProfileDetailResponse>>(`/api/users/${userId}`);