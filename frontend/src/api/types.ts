export type RoleType = 'BACKEND' | 'FRONTEND' | 'DESIGN' | 'PLANNING';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ProjectType = 'SIDE_PROJECT' | 'GRADUATION' | 'HACKATHON' | 'STUDY' | 'OTHER';
export type CareerType = 'NON_MAJOR_STUDENT' | 'MAJOR_STUDENT' | 'BOOTCAMP' | 'JOB_SEEKER' | 'JUNIOR' | 'SENIOR' | 'OTHER';

export const CAREER_TYPE_LABELS: Record<CareerType, string> = {
  NON_MAJOR_STUDENT: '비전공자 대학생',
  MAJOR_STUDENT: '전공자 대학생',
  BOOTCAMP: '부트캠프 수강생/수료생',
  JOB_SEEKER: '취업 준비생',
  JUNIOR: '주니어 개발자',
  SENIOR: '경력 개발자',
  OTHER: '기타',
};

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

export interface PostRoleStack {
  roleType: RoleType;
  techStack: string | null;
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
  roleStacks: PostRoleStack[];
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

export interface UserProfileResponse {
  userId: number;
  nickname: string;
  email: string;
  techStack: string | null;
  careerType: CareerType | null;
  experience: string | null;
  isPublic: boolean;
  contactEmail: string | null;
}

export interface PublicProfileSummaryResponse {
  userId: number;
  nickname: string;
  techStack: string | null;
  careerType: CareerType | null;
}

export interface PublicProfileDetailResponse {
  userId: number;
  nickname: string;
  email: string | null;
  techStack: string | null;
  careerType: CareerType | null;
  experience: string | null;
}

export interface UserProfileRequest {
  techStack: string;
  careerType: CareerType | null;
  experience: string;
  isPublic: boolean;
  contactEmail: string;
}

export const TECH_STACKS: Record<RoleType, string[]> = {
  BACKEND: [
    '협의 후 결정',
    'Java', 'Spring Boot', 'Spring MVC', 'Spring JPA', 'Node.js', 'Express.js', 'NestJS',
    'Python', 'Django', 'FastAPI', 'Flask', 'Go', 'Rust', 'PHP', 'Laravel',
    'Ruby', 'Ruby on Rails', 'C', 'C++', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'REST API', 'GraphQL', 'gRPC',
  ],
  FRONTEND: [
    '협의 후 결정',
    'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Svelte',
    'Next.js', 'Nuxt.js', 'TailwindCSS', 'Sass/SCSS', 'Bootstrap', 'jQuery',
    'Webpack', 'Vite', 'Redux', 'Zustand', 'Recoil', 'React Native', 'Flutter',
    'Three.js', 'D3.js', 'Styled-components',
  ],
  DESIGN: [
    '협의 후 결정',
    'Figma', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe XD', 'Adobe After Effects',
    'Adobe Premiere Pro', 'Sketch', 'Zeplin', 'InVision', 'Canva', 'Blender',
    'Cinema 4D', 'Procreate', 'Webflow', 'Framer', 'ProtoPie',
  ],
  PLANNING: [
    '협의 후 결정',
    'Notion', 'Confluence', 'Jira', 'Trello', 'Miro', 'Figma', 'Asana', 'Linear',
    'ClickUp', 'Slack', 'Google Workspace', 'PowerPoint', 'Excel', 'Aha!', 'Balsamiq',
  ],
};