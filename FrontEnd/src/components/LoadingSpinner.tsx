import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  className?: string;
  message?: string;
  overlay?: boolean;
  fullScreen?: boolean;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4', 
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const variantClasses = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  message,
  overlay = false,
  fullScreen = false
}) => {
  const spinnerElement = (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message && (
        <p className={cn(
          'text-sm',
          variantClasses[variant],
          'animate-pulse'
        )}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinnerElement}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

// 인라인 로딩 인디케이터 (텍스트 내부용)
export const InlineLoader: React.FC<{
  size?: 'xs' | 'sm';
  className?: string;
}> = ({ size = 'xs', className }) => (
  <svg
    className={cn(
      'inline animate-spin',
      sizeClasses[size],
      'text-current',
      className
    )}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// 페이지 로딩용 컴포넌트
export const PageLoader: React.FC<{
  message?: string;
}> = ({ message = '페이지를 불러오는 중...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <LoadingSpinner 
      size="lg" 
      variant="primary" 
      message={message}
      className="text-center"
    />
  </div>
);

// 컨텐츠 로딩용 컴포넌트 
export const ContentLoader: React.FC<{
  height?: string;
  message?: string;
}> = ({ height = 'h-64', message = '데이터를 불러오는 중...' }) => (
  <div className={cn('flex items-center justify-center', height)}>
    <LoadingSpinner 
      size="md" 
      message={message}
      className="text-center"
    />
  </div>
);

// 버튼 내부용 로딩 스피너
export const ButtonLoader: React.FC<{
  size?: 'xs' | 'sm';
  className?: string;
}> = ({ size = 'sm', className }) => (
  <InlineLoader 
    size={size} 
    className={cn('mr-2', className)} 
  />
);

// 스켈레톤 로더 컴포넌트들
export const SkeletonLoader: React.FC<{
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}> = ({ className, variant = 'rectangular' }) => {
  const baseClasses = 'animate-pulse bg-muted';
  
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
};

// 텍스트 스켈레톤
export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        variant="text"
        className={index === lines - 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
);

// 카드 스켈레톤
export const CardSkeleton: React.FC<{
  showAvatar?: boolean;
  className?: string;
}> = ({ showAvatar = false, className }) => (
  <div className={cn('p-4 space-y-3', className)}>
    {showAvatar && (
      <div className="flex items-center space-x-3">
        <SkeletonLoader variant="circular" className="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <SkeletonLoader variant="text" className="h-4 w-1/4" />
          <SkeletonLoader variant="text" className="h-3 w-1/3" />
        </div>
      </div>
    )}
    <TextSkeleton lines={3} />
  </div>
);

// 테이블 스켈레톤
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('space-y-3', className)}>
    {/* 헤더 */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, index) => (
        <SkeletonLoader key={`header-${index}`} variant="text" className="h-5" />
      ))}
    </div>
    
    {/* 행들 */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div 
        key={`row-${rowIndex}`}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <SkeletonLoader key={`cell-${rowIndex}-${colIndex}`} variant="text" />
        ))}
      </div>
    ))}
  </div>
);

// 사용 예시를 위한 HOC
export const withLoading = <P extends object>(
  Component: React.ComponentType<P>,
  LoaderComponent: React.ComponentType = () => <LoadingSpinner size="lg" />
) => {
  return ({ isLoading, ...props }: P & { isLoading: boolean }) => {
    if (isLoading) {
      return <LoaderComponent />;
    }
    return <Component {...(props as P)} />;
  };
};
