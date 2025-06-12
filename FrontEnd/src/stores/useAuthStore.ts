import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { 
  User, 
  AuthState, 
  LoginRequest, 
  RegisterRequest, 
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthError 
} from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthStore extends AuthState {
  // 내비게이션 함수 (React Router)
  navigate: ((to: string, options?: { replace?: boolean }) => void) | null;
  
  // 액션들
  setNavigate: (navigate: (to: string, options?: { replace?: boolean }) => void) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // 인증 관련 액션
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>;
  changePassword: (data: ChangePasswordRequest) => Promise<boolean>;
  
  // 초기화 및 유틸리티
  initializeAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
  updateUser: (user: User) => void;
  
  // 상태 리셋
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastLoginAt: undefined
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        navigate: null,

        // 내비게이션 설정
        setNavigate: (navigate) => {
          set({ navigate }, false, 'setNavigate');
        },

        // 로딩 상태 설정
        setLoading: (isLoading) => {
          set({ isLoading }, false, 'setLoading');
        },

        // 에러 설정
        setError: (error) => {
          set({ error }, false, 'setError');
        },

        // 에러 초기화
        clearError: () => {
          set({ error: null }, false, 'clearError');
        },

        // 로그인
        login: async (credentials: LoginRequest): Promise<boolean> => {
          try {
            set({ isLoading: true, error: null }, false, 'login:start');
            
            const authResult = await authService.login(credentials);
            
            set({
              user: authResult.user,
              token: authResult.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              lastLoginAt: new Date().toISOString()
            }, false, 'login:success');
            
            // 메인 페이지로 이동
            get().navigate?.('/', { replace: true });
            
            return true;
          } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
          
          set({
          isLoading: false,
          error: errorMessage
          }, false, 'login:error');
          
          return false;
          }
        },

        // 회원가입
        register: async (userData: RegisterRequest): Promise<boolean> => {
          try {
            set({ isLoading: true, error: null }, false, 'register:start');
            
            const authResult = await authService.register(userData);
            
            set({
              user: authResult.user,
              token: authResult.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              lastLoginAt: new Date().toISOString()
            }, false, 'register:success');
            
            // 메인 페이지로 이동
            get().navigate?.('/', { replace: true });
            
            return true;
          } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
          
          set({
          isLoading: false,
          error: errorMessage
          }, false, 'register:error');
          
          return false;
          }
        },

        // 로그아웃
        logout: async (): Promise<void> => {
          try {
            await authService.logout();
          } catch (error: unknown) {
          // 로그아웃 API 실패는 무시 (이미 토큰이 만료되었을 수 있음)
          console.warn('Logout API failed:', error);
          } finally {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: null,
              lastLoginAt: undefined
            }, false, 'logout');
            
            // 로그인 페이지로 이동
            get().navigate?.('/login', { replace: true });
          }
        },

        // 프로필 업데이트
        updateProfile: async (data: UpdateProfileRequest): Promise<boolean> => {
          try {
            set({ isLoading: true, error: null }, false, 'updateProfile:start');
            
            const updatedUser = await authService.updateProfile(data);
            
            set({
              user: updatedUser,
              isLoading: false,
              error: null
            }, false, 'updateProfile:success');
            
            return true;
          } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';
          
          set({
          isLoading: false,
          error: errorMessage
          }, false, 'updateProfile:error');
          
          return false;
          }
        },

        // 비밀번호 변경
        changePassword: async (data: ChangePasswordRequest): Promise<boolean> => {
          try {
            set({ isLoading: true, error: null }, false, 'changePassword:start');
            
            await authService.changePassword(data);
            
            set({
              isLoading: false,
              error: null
            }, false, 'changePassword:success');
            
            return true;
          } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.';
          
          set({
          isLoading: false,
          error: errorMessage
          }, false, 'changePassword:error');
          
          return false;
          }
        },

        // 토큰 새로고침
        refreshToken: async (): Promise<boolean> => {
          try {
            const newToken = await authService.refreshToken();
            
            set({
              token: newToken,
              error: null
            }, false, 'refreshToken:success');
            
            return true;
          } catch (error: unknown) {
          // 토큰 새로고침 실패 시 로그아웃
          get().logout();
          return false;
          }
        },

        // 인증 상태 확인
        checkAuthStatus: async (): Promise<void> => {
          try {
            set({ isLoading: true }, false, 'checkAuthStatus:start');
            
            const isValid = await authService.validateSession();
            
            if (isValid) {
              const user = await authService.getProfile();
              const token = authService.getToken();
              
              set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null
              }, false, 'checkAuthStatus:success');
            } else {
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              }, false, 'checkAuthStatus:invalid');
            }
          } catch (error: unknown) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            }, false, 'checkAuthStatus:error');
          }
        },

        // 앱 초기화
        initializeAuth: async (): Promise<void> => {
          const state = get();
          
          // 이미 인증 확인이 완료된 경우 스킵
          if (!state.isLoading) {
            return;
          }
          
          await state.checkAuthStatus();
        },

        // 사용자 정보 업데이트 (외부에서 호출용)
        updateUser: (user: User): void => {
          set({ user }, false, 'updateUser');
        },

        // 상태 리셋
        reset: (): void => {
          set({
            ...initialState,
            navigate: get().navigate // navigate 함수는 유지
          }, false, 'reset');
        }
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        // 지속할 상태만 선택
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          lastLoginAt: state.lastLoginAt
        }),
        // 스토리지에서 복원된 후 실행
        onRehydrateStorage: () => (state) => {
          if (state) {
            // 복원된 상태가 있으면 인증 상태 확인
            state.initializeAuth();
          }
        },
        // 버전 관리 (스키마 변경 시 사용)
        version: 1,
        migrate: (persistedState: any, version: number) => {
          // 향후 스키마 변경 시 마이그레이션 로직
          return persistedState;
        }
      }
    ),
    {
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// 인증 상태 변경 감지를 위한 선택자들
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  updateProfile: state.updateProfile,
  changePassword: state.changePassword,
  clearError: state.clearError,
  setNavigate: state.setNavigate,
  initializeAuth: state.initializeAuth
}));

// 개발 환경에서 디버깅을 위한 전역 노출
if (process.env.NODE_ENV === 'development') {
  (window as any).authStore = useAuthStore;
}

// 인증 이벤트 리스너 설정
if (typeof window !== 'undefined') {
  // 다른 탭에서 로그아웃 시 동기화
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth-storage' && e.newValue === null) {
      // 다른 탭에서 로그아웃된 경우
      useAuthStore.getState().reset();
    }
  });

  // 401 에러 시 자동 로그아웃
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });

  // 페이지 포커스 시 인증 상태 재확인
  let lastFocusTime = Date.now();
  window.addEventListener('focus', () => {
    const now = Date.now();
    const timeSinceLastFocus = now - lastFocusTime;
    
    // 5분 이상 포커스가 없었던 경우 인증 상태 재확인
    if (timeSinceLastFocus > 5 * 60 * 1000) {
      const { isAuthenticated, checkAuthStatus } = useAuthStore.getState();
      if (isAuthenticated) {
        checkAuthStatus();
      }
    }
    
    lastFocusTime = now;
  });
}
