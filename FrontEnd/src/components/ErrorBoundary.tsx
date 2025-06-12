import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ({ error, resetError }: { error: Error; resetError: () => void }) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 외부 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 프로덕션 환경에서 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // 여기에 Sentry, LogRocket 등 에러 리포팅 서비스 호출
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // 에러 리포팅 서비스 구현
    // 예: Sentry.captureException(error, { extra: errorInfo });
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError
        });
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-destructive">
                앱에서 오류가 발생했습니다
              </h1>
              <p className="text-muted-foreground">
                예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium mb-2">
                  개발자 정보 (개발 환경에서만 표시)
                </summary>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                홈으로 가기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-outline text-foreground border border-input rounded-md hover:bg-accent transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트에서 사용할 수 있는 HOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// 에러 리포팅을 위한 유틸리티 함수
export const reportError = (error: Error, context?: string) => {
  console.error(`Error in ${context}:`, error);
  
  if (process.env.NODE_ENV === 'production') {
    // 프로덕션 환경에서 에러 리포팅 서비스로 전송
    // 예: Sentry.captureException(error, { tags: { context } });
  }
};

// React Query나 기타 비동기 에러를 처리하기 위한 전역 에러 핸들러
export const setupGlobalErrorHandlers = () => {
  // Promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (process.env.NODE_ENV === 'production') {
      // 에러 리포팅 서비스로 전송
      reportError(new Error(event.reason), 'unhandledrejection');
    }
    
    // 개발 환경에서는 기본 동작 유지
    if (process.env.NODE_ENV !== 'development') {
      event.preventDefault();
    }
  });

  // 일반 JavaScript 에러 핸들러
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    if (process.env.NODE_ENV === 'production') {
      reportError(event.error, 'global');
    }
  });
};
