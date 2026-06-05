import client from './client';
import type { ApiResponse, LoginResponse } from './types';

export const signup = (email: string, password: string, nickname: string) =>
  client.post<ApiResponse<null>>('/api/auth/signup', { email, password, nickname });

export const login = (email: string, password: string) =>
  client.post<ApiResponse<LoginResponse>>('/api/auth/login', { email, password });

export const logout = () =>
  client.post<ApiResponse<null>>('/api/auth/logout');

export const withdraw = () =>
  client.delete<ApiResponse<null>>('/api/auth/withdraw');