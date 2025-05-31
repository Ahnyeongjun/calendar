import { User as PrismaUser, Project as PrismaProject, Schedule as PrismaSchedule, Status, Priority } from '@prisma/client';

// Prisma가 생성한 타입 대신 별도의 인터페이스가 필요한 경우 추가
// 여기서는 기존 코드와의 호환성을 위해 필요한 타입만 정의

// JWT 관련 타입
export interface AuthResult {
  user: Omit<PrismaUser, 'password'>;
  token: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  name: string;
  iat?: number;
  exp?: number;
}

// 확장 타입 (필요한 경우)
export interface ScheduleWithProject extends PrismaSchedule {
  project?: PrismaProject | null;
}

// 컨트롤러 요청/응답 타입 (필요한 경우)
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
}

// 타입 재정의 (호환성 위해)
export type User = PrismaUser;
export type Project = PrismaProject;
export type Schedule = PrismaSchedule;

// 상태 및 우선순위 타입 (기존 코드와의 호환성 위해)
export { Status, Priority };