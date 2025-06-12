import React, { useEffect, Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/useAuthStore';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

interface AuthLayoutProps {
  children: React.ReactNode;
}

// 공개 페이지 경로들
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

// 인증이 필요한 페이지에서 로딩 시 보여줄 스켈레톤
const AuthLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto p-4">
      <div className="animate-pulse space-y-4">
        {/* 헤더 스켈레톤 */}
        <div className="h-16 bg-muted rounded-lg"></div>
        
        {/* 메인 컨텐츠 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div className="h-32 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 공개 페이지 로딩 스켈레톤
const PublicLoadingSkeleton: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-md p-6 space-y-4">
      <div className="animate-pulse">
        {/* 로고/제목 스켈레톤 */}
        <div className="h-12 bg-muted rounded-lg mb-6"></div>
        
        {/* 폼 스켈레톤 */}
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded-md"></div>
          <div className="h-10 bg-muted rounded-md"></div>
          <div className="h-10 bg-muted rounded-md"></div>
        </div>
      </div>
    </div>
  </div>
);

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading, error } = useAuth();
  const location = useLocation();

  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);
  const isRootPath = location.pathname === '/';

  // 로딩 중일 때
  if (isLoading) {
    return isPublicPath ? <PublicLoadingSkeleton /> : <AuthLoadingSkeleton />;
  }

  // 에러가 있을 때 (네트워크 에러 등)
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-medium">
            인증 오류가 발생했습니다
          </div>
          <div className="text-muted-foreground">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 미인증 사용자의 보호된 페이지 접근 차단
  if (!isAuthenticated && !isPublicPath) {
    // 현재 경로를 쿼리 파라미터로 저장하여 로그인 후 원래 페이지로 돌아갈 수 있게 함
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTo}`} replace />;
  }

  // 인증된 사용자의 공개 페이지 접근 처리
  if (isAuthenticated && isPublicPath) {
    // 리디렉션 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로
    const urlParams = new URLSearchParams(location.search);
    const redirectTo = urlParams.get('redirect');
    
    if (redirectTo) {
      try {
        const decodedPath = decodeURIComponent(redirectTo);
        // 보안을 위해 상대 경로만 허용
        if (decodedPath.startsWith('/') && !decodedPath.startsWith('//')) {
          return <Navigate to={decodedPath} replace />;
        }
      } catch {
        // 디코딩 실패 시 메인 페이지로
      }
    }
    
    return <Navigate to="/" replace />;
  }

  // 정상적인 경우 children 렌더링
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-destructive text-lg font-medium">
              앱에서 오류가 발생했습니다
            </div>
            <div className="text-muted-foreground text-sm">
              {process.env.NODE_ENV === 'development' ? error.message : '잠시 후 다시 시도해주세요.'}
            </div>
            <div className="space-x-2">
              <button
                onClick={resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// 인증 상태에 따른 조건부 렌더링을 위한 헬퍼 컴포넌트들
export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <>{fallback}</>;
};

export const UnauthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <>{fallback}</>;
};

// 로딩 상태 체크 컴포넌트
export const AuthReady: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return fallback ? <>{fallback}</> : <LoadingSpinner />;
  }
  
  return <>{children}</>;
};
