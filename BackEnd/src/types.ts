// 사용자 타입
export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

// JWT 페이로드 타입
export interface JwtPayload {
  id: string;
  username: string;
  name: string;
  iat?: number;
  exp?: number;
}

// 인증 결과 타입
export interface AuthResult {
  user: Omit<User, 'password' | 'created_at' | 'updated_at'>;
  token: string;
}

// 프로젝트 타입
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
}

// 일정 상태 타입
export type ScheduleStatus = 'planned' | 'in-progress' | 'completed';

// 일정 우선순위 타입
export type SchedulePriority = 'low' | 'medium' | 'high';

// 일정 타입
export interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: Date;
  start_time?: string;
  end_time?: string;
  status: ScheduleStatus;
  priority: SchedulePriority;
  project_id?: string;
  created_at?: Date;
  updated_at?: Date;
}
