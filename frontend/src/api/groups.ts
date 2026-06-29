import client from './client';
import type {
  ApiResponse,
  GroupCreateRequest,
  GroupDetailResponse,
  GroupJoinRequest,
  GroupSummaryResponse,
  MyGroupResponse,
  PostSummaryResponse,
} from './types';

export const getGroups = () =>
  client.get<ApiResponse<GroupSummaryResponse[]>>('/api/groups');

export const getGroup = (groupId: number) =>
  client.get<ApiResponse<GroupDetailResponse>>(`/api/groups/${groupId}`);

export const createGroup = (data: GroupCreateRequest) =>
  client.post<ApiResponse<GroupDetailResponse>>('/api/groups', data);

export const joinGroup = (groupId: number, data: GroupJoinRequest) =>
  client.post<ApiResponse<void>>(`/api/groups/${groupId}/members`, data);

export const approveGroupMember = (groupId: number, memberId: number) =>
  client.patch<ApiResponse<void>>(`/api/groups/${groupId}/members/${memberId}/approve`);

export const removeGroupMember = (groupId: number, memberId: number) =>
  client.delete<ApiResponse<void>>(`/api/groups/${groupId}/members/${memberId}`);

export const getGroupPosts = (groupId: number) =>
  client.get<ApiResponse<PostSummaryResponse[]>>(`/api/groups/${groupId}/posts`);

export const getMyGroups = () =>
  client.get<ApiResponse<MyGroupResponse[]>>('/api/my/groups');
