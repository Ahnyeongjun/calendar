import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // 라우터 인스턴스 저장
  navigate: ((to: string, options?: { replace?: boolean }) => void) | null;
  setNavigate: (navigate: (to: string, options?: { replace?: boolean }) => void) => void;
  setLoading: (loading: boolean) => void;
  // 인증 액션들
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// 테스트 계정 데이터
const TEST_ACCOUNTS = [
  { id: '1', username: 'admin', password: '1234', name: '관리자' },
  { id: '2', username: 'admin2', password: '1234', name: '관리자2' }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // 초기 로딩 상태
      navigate: null,
      
      setNavigate: (navigate) => {
        set({ navigate });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      login: (username: string, password: string) => {
        const account = TEST_ACCOUNTS.find(
          acc => acc.username === username && acc.password === password
        );
        
        if (account) {
          const userData = { id: account.id, username: account.username, name: account.name };
          set({ user: userData, isAuthenticated: true });
          
          // 로그인 성공 시 메인 페이지로 이동
          const { navigate } = get();
          if (navigate) {
            navigate('/', { replace: true });
          }
          
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
        
        // 로그아웃 시 로그인 페이지로 이동
        const { navigate } = get();
        if (navigate) {
          navigate('/login', { replace: true });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // persist 데이터 복원 완료 시 로딩 해제
        if (state) {
          state.setLoading(false);
        }
      }
    }
  )
);
