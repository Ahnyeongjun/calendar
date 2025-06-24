import React, { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuthActions } from '@/stores/useAuthStore';
import { setupGlobalErrorHandlers } from '@/components/ErrorBoundary';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import NotFound from './pages/NotFound';
import SentryTestComponent from './components/SentryTestComponent';

// React Query 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // 401, 403, 404 에러는 재시도하지 않음
        if (error?.status && [401, 403, 404].includes(error.status)) {
          return false;
        }
        // 최대 3번까지 재시도
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // 클라이언트 에러(4xx)는 재시도하지 않음
        if (error?.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
  },
});

// 앱 라우트 컴포넌트
const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { setNavigate, initializeAuth } = useAuthActions();

  useEffect(() => {
    // 네비게이션 함수를 Auth Store에 제공
    setNavigate(navigate);

    // 앱 초기화 시 인증 상태 확인
    initializeAuth();
  }, [navigate, setNavigate, initializeAuth]);

  return (
    <AuthLayout>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthLayout>
  );
};

// 메인 App 컴포넌트
const App: React.FC = () => {
  useEffect(() => {
    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers();

    // 앱 메타데이터 설정
    document.title = 'Calendar App';

    // 다크모드 감지 및 초기 설정
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // 키보드 접근성 개선
    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseNavigation = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyboardNavigation);
    document.addEventListener('mousedown', handleMouseNavigation);

    // 성능 모니터링 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const measurePerformance = () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        console.log('App Performance Metrics:', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
          firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
        });
      };

      // 페이지 로드 완료 후 성능 측정
      if (document.readyState === 'complete') {
        measurePerformance();
      } else {
        window.addEventListener('load', measurePerformance);
      }
    }

    // 온라인/오프라인 상태 감지
    const handleOnline = () => {
      console.log('App is online');
      // 온라인 상태가 되면 React Query 재시도
      queryClient.refetchQueries();
    };

    const handleOffline = () => {
      console.log('App is offline');
      // 오프라인 상태 알림 표시 가능
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyboardNavigation);
      document.removeEventListener('mousedown', handleMouseNavigation);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Sentry.ErrorBoundary 
      fallback={({ error }) => (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">에러가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">예상치 못한 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => window.location.reload()}
          >
            페이지 새로고침
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 max-w-lg">
              <summary className="cursor-pointer text-sm text-gray-500">에러 세부정보</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {error.toString()}
              </pre>
            </details>
          )}
        </div>
      )} 
      showDialog
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="calendar-theme">
          <TooltipProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>

            {/* Sentry 테스트 컴포넌트 (개발 환경에서만) */}
            <SentryTestComponent />

            {/* Toast 알림 시스템 */}
            <Toaster />
            <Sonner
              position="top-right"
              closeButton
              richColors
              theme="system"
            />

            {/* React Query 개발 도구 (개발 환경에서만) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools
                initialIsOpen={false}
                position="bottom"
              />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
};

export default App;
