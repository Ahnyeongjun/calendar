import { apiService } from './api';
import { 
  AuthResult, 
  LoginRequest, 
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  User,
  JwtPayload,
  SessionInfo 
} from '@/types/auth';
import { ApiResponse } from '@/types/common';
import { FrontendErrorType, classifyError, extractErrorMessage, isApiError } from '@/types/errors';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';
const REFRESH_THRESHOLD = 60 * 60 * 1000; // 1시간

export class AuthService {
  private tokenRefreshTimer?: NodeJS.Timeout;

  /**
   * 사용자 로그인
   */
  async login(credentials: LoginRequest): Promise<AuthResult> {
    try {
      const response = await apiService.post<ApiResponse<AuthResult>>('/auth/login', credentials);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '로그인에 실패했습니다.');
      }

      const authResult = response.data;
      
      // 토큰과 사용자 정보 저장
      this.setToken(authResult.token);
      this.setUser(authResult.user);
      
      // 토큰 자동 갱신 설정
      this.setupTokenRefresh(authResult.token);
      
      return authResult;
    } catch (error: unknown) {
      this.clearAuth();
      throw this.handleError(error, '로그인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 회원가입
   */
  async register(userData: RegisterRequest): Promise<AuthResult> {
    try {
      const response = await apiService.post<ApiResponse<AuthResult>>('/auth/register', userData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '회원가입에 실패했습니다.');
      }

      const authResult = response.data;
      
      // 자동 로그인 처리
      this.setToken(authResult.token);
      this.setUser(authResult.user);
      this.setupTokenRefresh(authResult.token);
      
      return authResult;
    } catch (error: unknown) {
      throw this.handleError(error, '회원가입 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 프로필 조회
   */
  async getProfile(): Promise<User> {
    try {
      const response = await apiService.get<ApiResponse<{ user: User }>>('/auth/me');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '프로필 조회에 실패했습니다.');
      }

      const user = response.data.user;
      this.setUser(user);
      
      return user;
    } catch (error: unknown) {
      throw this.handleError(error, '프로필 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const response = await apiService.put<ApiResponse<{ user: User }>>('/auth/profile', data);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '프로필 업데이트에 실패했습니다.');
      }

      const user = response.data.user;
      this.setUser(user);
      
      return user;
    } catch (error: unknown) {
      throw this.handleError(error, '프로필 업데이트 중 오류가 발생했습니다.');
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiService.post<ApiResponse>('/auth/change-password', data);
      
      if (!response.success) {
        throw new Error(response.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error: unknown) {
      throw this.handleError(error, '비밀번호 변경 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 새로고침
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await apiService.post<ApiResponse<{ token: string }>>('/auth/refresh');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || '토큰 새로고침에 실패했습니다.');
      }

      const newToken = response.data.token;
      this.setToken(newToken);
      this.setupTokenRefresh(newToken);
      
      return newToken;
    } catch (error: unknown) {
      this.clearAuth();
      throw this.handleError(error, '토큰 새로고침 중 오류가 발생했습니다.');
    }
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      // 서버에 로그아웃 알림 (토큰이 있을 때만)
      if (this.getToken()) {
        await apiService.post('/auth/logout').catch(() => {
          // 로그아웃 API 실패는 무시 (이미 토큰이 만료되었을 수 있음)
        });
      }
    } finally {
      this.clearAuth();
    }
  }

  /**
   * 계정 삭제
   */
  async deleteAccount(password: string): Promise<void> {
    try {
      const response = await apiService.delete<ApiResponse>('/auth/account', { 
        data: { password } 
      });
      
      if (!response.success) {
        throw new Error(response.error || '계정 삭제에 실패했습니다.');
      }
      
      this.clearAuth();
    } catch (error: unknown) {
      throw this.handleError(error, '계정 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 토큰 관리 메서드들
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private getUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = undefined;
    }
  }

  /**
   * 인증 상태 확인
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? this.isTokenValid(token) : false;
  }

  /**
   * 토큰 유효성 검사
   */
  private isTokenValid(token: string): boolean {
    try {
      const payload = this.parseJwtPayload(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  /**
   * JWT 페이로드 파싱
   */
  private parseJwtPayload(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  }

  /**
   * 토큰 만료까지 남은 시간 (밀리초)
   */
  getTokenTimeToExpiry(): number {
    const token = this.getToken();
    if (!token) return 0;

    try {
      const payload = this.parseJwtPayload(token);
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, (payload.exp - now) * 1000);
    } catch {
      return 0;
    }
  }

  /**
   * 토큰 자동 갱신 설정
   */
  private setupTokenRefresh(token: string): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    const timeToExpiry = this.getTokenTimeToExpiry();
    const refreshTime = Math.max(0, timeToExpiry - REFRESH_THRESHOLD);

    if (refreshTime > 0) {
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken().catch(() => {
          // 자동 새로고침 실패 시 로그아웃
          this.clearAuth();
        });
      }, refreshTime);
    }
  }

  /**
   * 세션 유효성 검사
   */
  async validateSession(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      await this.getProfile();
      return true;
    } catch {
      this.clearAuth();
      return false;
    }
  }

  /**
   * 현재 세션 정보 조회
   */
  getSessionInfo(): SessionInfo | null {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return null;
    }

    try {
      const payload = this.parseJwtPayload(token);
      return {
        userId: user.id,
        username: user.username,
        loginAt: new Date(payload.iat * 1000).toISOString(),
        expiresAt: new Date(payload.exp * 1000).toISOString(),
        isActive: this.isTokenValid(token)
      };
    } catch {
      return null;
    }
  }

  /**
   * 토큰이 곧 만료되는지 확인
   */
  isTokenExpiringSoon(): boolean {
    const timeToExpiry = this.getTokenTimeToExpiry();
    return timeToExpiry > 0 && timeToExpiry < REFRESH_THRESHOLD;
  }

  /**
   * 에러 처리 헬퍼
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    const classifiedError = classifyError(error);
    const errorMessage = extractErrorMessage(classifiedError);
    
    // API 에러인 경우 더 상세한 로깅
    if (isApiError(classifiedError)) {
      console.warn('API Error:', {
        status: classifiedError.status || classifiedError.response?.status,
        code: classifiedError.code,
        message: errorMessage,
        requestId: classifiedError.requestId
      });
    }
    
    return new Error(errorMessage || defaultMessage);
  }

  /**
   * 로그인 상태 변경 이벤트 리스너
   */
  onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        callback(this.isAuthenticated());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

export const authService = new AuthService();
