import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // HTTP 요청 추적
      Sentry.httpIntegration({
        tracing: true,
      }),
      
      // Express 자동 추적
      Sentry.expressIntegration(),
      
      // 프로파일링
      nodeProfilingIntegration(),
    ],
    
    // 에러 필터링
    beforeSend(event, hint) {
      // 로컬 개발 환경에서는 콘솔에도 출력
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Event:', event);
        console.error('Original Error:', hint.originalException);
      }
      
      // 특정 에러는 Sentry에 보내지 않음
      const error = hint.originalException;
      if (error instanceof Error) {
        // JWT 만료 에러는 정상적인 플로우이므로 제외
        if (error.message.includes('jwt expired') || error.message.includes('TokenExpiredError')) {
          return null;
        }
        
        // Prisma 연결 에러만 필터링 (개발 중 자주 발생)
        if (process.env.NODE_ENV === 'development' && error.message.includes('PrismaClientInitializationError')) {
          return null;
        }
      }
      
      return event;
    },
    
    // 추가 컨텍스트 설정
    initialScope: {
      tags: {
        component: "calendar-backend",
      },
    },
  });
};

export { Sentry };
