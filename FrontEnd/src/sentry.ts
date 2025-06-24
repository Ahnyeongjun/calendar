import * as Sentry from "@sentry/react";

export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.

    // Environment 설정
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,

    // Release 정보 (선택사항)
    release: import.meta.env.VITE_APP_VERSION || "1.0.0",

    // 에러 필터링
    beforeSend(event) {
      // 개발 환경에서는 콘솔에도 출력
      if (import.meta.env.MODE === 'development') {
        console.error('Sentry Error:', event);
      }
      return event;
    },

    // 보안 토큰 설정 (선택사항)
    beforeSendTransaction(transaction) {
      // 트랜잭션에 보안 헤더 추가 (필요한 경우)
      if (import.meta.env.VITE_SENTRY_TOKEN) {
        transaction.setTag('security_token', 'present');
      }
      return transaction;
    },
  });
};

// React Router와 함께 사용할 수 있는 Sentry Router
export const SentryRoutes = Sentry.withSentryRouting;
