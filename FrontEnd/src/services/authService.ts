import ApiService from './api';
import { AuthResult, LoginRequest, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResult> {
    const result = await ApiService.post<AuthResult>('/auth/login', credentials);
    
    // 토큰을 localStorage에 저장
    if (result.token) {
      localStorage.setItem('auth-token', result.token);
    }
    
    return result;
  },

  async getProfile(): Promise<{ user: User }> {
    return ApiService.get<{ user: User }>('/auth/profile');
  },

  logout(): void {
    localStorage.removeItem('auth-token');
  },

  getToken(): string | null {
    return localStorage.getItem('auth-token');
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // JWT 토큰의 만료 시간 확인 (간단한 체크)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }
};
