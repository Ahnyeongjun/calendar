import ApiService from './api';
import { AuthResult, LoginRequest, User } from '@/types/auth';

const TOKEN_KEY = 'auth-token';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResult> {
    try {
      const result = await ApiService.post<AuthResult>('/auth/login', credentials);
      
      if (result.token) {
        this.setToken(result.token);
      }
      
      return result;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  async getProfile(): Promise<{ user: User }> {
    return ApiService.get<{ user: User }>('/auth/profile');
  }

  logout(): void {
    this.clearToken();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    return this.isTokenValid(token);
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      await this.getProfile();
      return true;
    } catch {
      this.clearToken();
      return false;
    }
  }
}

export const authService = new AuthService();
