import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResult } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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
      isLoading: true,
      navigate: null,
      
      setNavigate: (navigate) => set({ navigate }),

      setLoading: (loading) => set({ isLoading: loading }),
      
      login: async (username: string, password: string): Promise<boolean> => {
        try {
          set({ isLoading: true });
          
          const authResult: AuthResult = await authService.login({ username, password });
          
          set({ 
            user: authResult.user, 
            token: authResult.token,
            isAuthenticated: true,
            isLoading: false
          });
          
          get().navigate?.('/', { replace: true });
          return true;
        } catch (error) {
          set({ isLoading: false });
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
        
        get().navigate?.('/login', { replace: true });
      },
      
      initializeAuth: async (): Promise<void> => {
        try {
          const isValid = await authService.validateSession();
          
          if (!isValid) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
          
          const { user } = await authService.getProfile();
          const token = authService.getToken();
          
          set({ 
            user, 
            token,
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          authService.logout();
          set({ 
            user: null, 
            token: null,
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
      
      updateUser: (user: User) => set({ user })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        state?.initializeAuth();
      }
    }
  )
);
