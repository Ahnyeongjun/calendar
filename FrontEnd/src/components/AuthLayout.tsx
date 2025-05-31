import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * 전체 앱의 인증 처리를 담당하는 레이아웃 컴포넌트
 * - 로딩 상태 처리
 * - 인증 상태에 따른 페이지 접근 제어
 * - 자동 리다이렉트 처리
 */
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // 인증 상태 로딩 중
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 공개 페이지 목록 (인증 없이 접근 가능)
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.includes(location.pathname);

  // 미인증 사용자가 보호된 페이지 접근 시 로그인으로 리다이렉트
  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }

  // 인증된 사용자가 로그인 페이지 접근 시 메인으로 리다이렉트
  if (isAuthenticated && isPublicPath) {
    return <Navigate to="/" replace />;
  }

  // 정상적인 페이지 렌더링
  return <>{children}</>;
};
