
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
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
      login: (username: string, password: string) => {
        const account = TEST_ACCOUNTS.find(
          acc => acc.username === username && acc.password === password
        );
        
        if (account) {
          const userData = { id: account.id, username: account.username, name: account.name };
          set({ user: userData, isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
