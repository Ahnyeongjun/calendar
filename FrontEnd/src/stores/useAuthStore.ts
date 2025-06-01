import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResult } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // 라우터 인스턴스 저장
  navigate: ((to: string, options?: { replace?: boolean }) => void) | null;
  
  // Actions
  setNavigate: (navigate: (to: string, options?: { replace?: boolean }) => void) => void;
  setLoading: (loading: boolean) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // 초기 로딩 상태
      navigate: null,
      
      setNavigate: (navigate) => {
        set({ navigate });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      login: async (username: string, password: string) => {
        try {
          const authResult: AuthResult = await authService.login({ username, password });
          
          set({ 
            user: authResult.user, 
            token: authResult.token,
            isAuthenticated: true 
          });
          
          // 로그인 성공 시 메인 페이지로 이동
          const { navigate } = get();
          if (navigate) {
            navigate('/', { replace: true });
          }
          
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },
      
      logout: () => {
        authService.logout();
        set({ 
          user: null, 
          token: null,
          isAuthenticated: false 
        });
        
        // 로그아웃 시 로그인 페이지로 이동
        const { navigate } = get();
        if (navigate) {
          navigate('/login', { replace: true });
        }
      },
      
      initializeAuth: async () => {
        try {
          const token = authService.getToken();
          
          if (!token || !authService.isAuthenticated()) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
          
          // 토큰이 유효하면 사용자 정보 가져오기
          try {
            const { user } = await authService.getProfile();
            set({ 
              user, 
              token,
              isAuthenticated: true, 
              isLoading: false 
            });
          } catch (error) {
            // 토큰이 유효하지 않은 경우 로그아웃
            authService.logout();
            set({ 
              user: null, 
              token: null,
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({ isLoading: false, isAuthenticated: false });
        }
      },
      
      updateUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // persist 데이터 복원 완료 시 인증 상태 확인
        if (state) {
          state.initializeAuth();
        }
      }
    }
  )
);
