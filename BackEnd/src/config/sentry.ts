import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from './config';

/**
 * Sentry 초기화 함수
 */
export function initializeSentry(): void {
  // 개발 환경에서는 Sentry를 사용하지 않을 수도 있음
  if (!process.env.SENTRY_DSN) {
    console.log('SENTRY_DSN not found, Sentry monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.server.nodeEnv,

    // 성능 모니터링
    integrations: [
      // 성능 프로파일링 (선택사항)
      nodeProfilingIntegration(),
    ],

    // 트레이스 샘플링 비율 (0.0 ~ 1.0)
    tracesSampleRate: config.server.isProduction ? 0.1 : 1.0,

    // 프로파일링 샘플링 비율 (0.0 ~ 1.0)
    profilesSampleRate: config.server.isProduction ? 0.1 : 1.0,

    // 릴리즈 정보
    release: process.env.npm_package_version || '1.0.0',

    // 추가 태그
    initialScope: {
      tags: {
        component: 'backend',
        service: 'calendar-api'
      }
    },

    // 에러 필터링
    beforeSend(event, hint) {
      // 개발 환경에서는 콘솔에도 출력
      if (config.server.isDevelopment) {
        console.log('Sentry Event:', event);
      }

      // 특정 에러는 Sentry로 보내지 않기
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'code' in error) {
        // 예: 데이터베이스 연결 에러는 로컬에서만 처리
        if (error.code === 'ECONNREFUSED' && config.server.isDevelopment) {
          return null;
        }
      }

      return event;
    }
  });

  console.log(`Sentry initialized for ${config.server.nodeEnv} environment`);
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
