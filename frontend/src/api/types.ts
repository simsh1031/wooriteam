export type RoleType = 'BACKEND' | 'FRONTEND' | 'DESIGN' | 'PLANNING';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ProjectType = 'SIDE_PROJECT' | 'GRADUATION' | 'HACKATHON' | 'STUDY' | 'OTHER';

export const ROLE_LABELS: Record<RoleType, string> = {
  BACKEND: '백엔드',
  FRONTEND: '프론트엔드',
  DESIGN: '디자인',
  PLANNING: '기획',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  BEGINNER: '입문',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  SIDE_PROJECT: '사이드 프로젝트',
  GRADUATION: '졸업작품',
  HACKATHON: '해커톤',
  STUDY: '스터디',
  OTHER: '기타',
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface LoginResponse {
  token: string;
  nickname: string;
}

export interface PostRoleResponse {
  id: number;
  roleType: RoleType;
  description: string | null;
  techStack: string | null;
}

export interface PostDetailResponse {
  id: number;
  title: string;
  description: string | null;
  difficulty: Difficulty | null;
  projectType: ProjectType | null;
  closed: boolean;
  createdAt: string;
  authorId: number;
  authorNickname: string;
  roles: PostRoleResponse[];
}

export interface PostSummaryResponse {
  id: number;
  title: string;
  difficulty: Difficulty | null;
  projectType: ProjectType | null;
  closed: boolean;
  createdAt: string;
  authorNickname: string;
  roleTypes: RoleType[];
}

export interface ApplicationResponse {
  id: number;
  roleId: number;
  roleType: RoleType;
  applicantNickname: string;
  motivation: string;
  techStack: string | null;
  experience: string | null;
  contact: string;
  createdAt: string;
}

export interface MyApplicationResponse {
  id: number;
  postId: number;
  postTitle: string;
  roleType: RoleType;
  postClosed: boolean;
  createdAt: string;
}

export interface PostRoleRequest {
  roleType: RoleType;
  description: string;
  techStack: string;
}

export interface PostCreateRequest {
  title: string;
  description: string;
  difficulty: Difficulty | '';
  projectType: ProjectType | '';
  roles: PostRoleRequest[];
}