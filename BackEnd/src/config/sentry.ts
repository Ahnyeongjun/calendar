import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Express.js용 Sentry 초기화 함수
 */
export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.log('🟡 SENTRY_DSN not found, Sentry monitoring disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: dsn,
      environment: process.env.NODE_ENV || 'development',
      
      // 샘플링 비율 (개발환경에서는 100%)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // 디버그 모드 (개발환경에서만)
      debug: process.env.NODE_ENV === 'development',
      
      // 릴리즈 정보
      release: process.env.npm_package_version || '1.0.0',
      
      // 기본 태그
      initialScope: {
        tags: {
          component: 'backend',
          service: 'calendar-api'
        }
      },
      
      // 에러 필터링
      beforeSend(event, hint) {
        // 개발 환경에서는 콘솔에도 출력
        if (process.env.NODE_ENV === 'development') {
          console.log('🔴 Sentry Event:', {
            message: event.message,
            level: event.level,
            platform: event.platform,
            timestamp: event.timestamp
          });
        }
        
        return event;
      }
    });
    
    console.log('🟢 Sentry initialized successfully');
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    
  } catch (error) {
    console.error('🔴 Sentry initialization failed:', error);
  }
}

/**
 * 커스텀 에러 리포팅 함수들
 */
export const sentryHelpers = {
  /**
   * 사용자 정보 설정
   */
  setUser(userId: string, email?: string, additionalData?: Record<string, any>) {
    Sentry.setUser({
      id: userId,
      email,
      ...additionalData
    });
  },

  /**
   * 추가 컨텍스트 설정
   */
  setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  },

  /**
   * 태그 설정
   */
  setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  },

  /**
   * 브레드크럼 추가
   */
  addBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel) {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      level: level || 'info',
      timestamp: Date.now() / 1000
    });
  },

  /**
   * 에러 캐치 및 전송
   */
  captureError(error: Error, additionalData?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (additionalData) {
        scope.setContext('additionalData', additionalData);
      }
      Sentry.captureException(error);
    });
  },

  /**
   * 메시지 전송
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', additionalData?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (additionalData) {
        scope.setContext('additionalData', additionalData);
      }
      Sentry.captureMessage(message, level);
    });
  },

  /**
   * 스코프와 함께 실행
   */
  withScope(callback: (scope: Sentry.Scope) => void) {
    Sentry.withScope(callback);
  }
};

export { Sentry };
