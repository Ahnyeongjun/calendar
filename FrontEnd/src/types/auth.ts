import { BaseEntity } from './common';

// 사용자 인터페이스
export interface User extends BaseEntity {
  username: string;
  name: string;
}

// 로그인 요청 데이터
export interface LoginRequest {
  username: string;
  password: string;
}

// 회원가입 요청 데이터
export interface RegisterRequest {
  username: string;
  password: string;
  name: string;
}

// 프로필 업데이트 요청 데이터
export interface UpdateProfileRequest {
  name?: string;
  password?: string;
}

// 비밀번호 변경 요청 데이터
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 인증 결과
export interface AuthResult {
  user: User;
  token: string;
}

// 로그인 폼 데이터
export interface LoginFormData {
  username: string;
  password: string;
  rememberMe?: boolean;
}

// 회원가입 폼 데이터
export interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  agreeToTerms: boolean;
}

// 프로필 폼 데이터
export interface ProfileFormData {
  name: string;
}

// 비밀번호 변경 폼 데이터
export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// 인증 에러
export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

// JWT 페이로드
export interface JwtPayload {
  id: string;
  username: string;
  name: string;
  iat: number;
  exp: number;
}

// 인증 상태
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginAt?: string;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  // 상태
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 액션
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
  clearError: () => void;
  
  // 유틸리티
  refreshToken: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

// 세션 정보
export interface SessionInfo {
  userId: string;
  username: string;
  loginAt: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

// 로그인 옵션
export interface LoginOptions {
  rememberMe?: boolean;
  redirectUrl?: string;
  force?: boolean; // 이미 로그인된 경우 강제 재로그인
}

// 로그아웃 옵션
export interface LogoutOptions {
  redirectUrl?: string;
  clearStorage?: boolean;
  revokeToken?: boolean;
}

// 토큰 정보
export interface TokenInfo {
  token: string;
  type: 'Bearer';
  expiresAt: string;
  refreshToken?: string;
}

// 비밀번호 정책
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPasswords?: string[];
}

// 비밀번호 강도
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

// 계정 상태
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'locked';

// 사용자 역할 (향후 확장용)
export type UserRole = 'user' | 'admin' | 'moderator';

// 사용자 권한 (향후 확장용)
export interface UserPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canViewAnalytics: boolean;
}

// 확장된 사용자 정보 (향후 확장용)
export interface ExtendedUser extends User {
  email?: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  status: AccountStatus;
  permissions: UserPermissions;
  lastLoginAt?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  preferences: UserPreferences;
}

// 사용자 환경설정
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
}

// 알림 환경설정
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  desktop: boolean;
  scheduleReminders: boolean;
  projectUpdates: boolean;
  systemAlerts: boolean;
}

// 개인정보 설정
export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'friends';
  showOnlineStatus: boolean;
  allowSearchByEmail: boolean;
  allowSearchByUsername: boolean;
  dataRetention: number; // days
}

// 로그인 기록
export interface LoginHistory {
  id: string;
  userId: string;
  loginAt: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  success: boolean;
  failureReason?: string;
}

// 계정 복구
export interface AccountRecovery {
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
}

// 2단계 인증
export interface TwoFactorAuth {
  enabled: boolean;
  method: 'sms' | 'email' | 'authenticator';
  backupCodes: string[];
  lastUsedAt?: string;
}

// 인증 이벤트
export interface AuthEvent {
  type: 'login' | 'logout' | 'register' | 'password_change' | 'profile_update';
  timestamp: string;
  details?: Record<string, any>;
}
