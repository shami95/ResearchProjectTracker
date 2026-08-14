export type UserRole = 'ADMIN' | 'PI' | 'MEMBER' | 'VIEWER';

export type ProjectStatus =
  | 'PLANNING'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'ARCHIVED';

export const PROJECT_STATUSES: ProjectStatus[] = [
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED',
];

export interface AuthResponse {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface AuthUser {
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
}

export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface Project {
  id: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  piId: string | null;
  piName: string | null;
  tags: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  title: string;
  summary: string;
  tags: string;
  startDate: string | null;
  endDate: string | null;
  piId?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string | null;
  isCompleted: boolean;
  createdById: string | null;
  createdByName: string | null;
}

export interface MilestoneRequest {
  title: string;
  description: string;
  dueDate: string | null;
  isCompleted?: boolean;
}

export interface DocumentItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  urlOrPath: string;
  uploadedById: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
}

export interface ApiError {
  status?: number;
  message: string;
  timestamp?: string;
}
