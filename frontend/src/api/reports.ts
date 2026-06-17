import client from './client';
import type { ApiResponse, ReportRequest } from './types';

export const createReport = (data: ReportRequest) =>
  client.post<ApiResponse<void>>('/api/reports', data);
