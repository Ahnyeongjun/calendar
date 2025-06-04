import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthLayoutProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ['/login'];

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isPublicPath = PUBLIC_PATHS.includes(location.pathname);

  // 미인증 사용자의 보호된 페이지 접근 차단
  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" replace />;
  }

  // 인증된 사용자의 로그인 페이지 접근 차단
  if (isAuthenticated && isPublicPath) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
