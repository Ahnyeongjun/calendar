import * as Sentry from "@sentry/react";

/**
 * 사용자 정보를 Sentry에 설정
 */
export const setSentryUser = (user: { 
  id: string; 
  email?: string; 
  username?: string; 
}) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
};

/**
 * Sentry 사용자 정보 초기화 (로그아웃 시 사용)
 */
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

/**
 * 커스텀 태그 설정
 */
export const setSentryTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * 커스텀 컨텍스트 설정
 */
export const setSentryContext = (key: string, context: any) => {
  Sentry.setContext(key, context);
};

/**
 * 수동으로 에러 보고
 */
export const reportError = (error: Error, context?: any) => {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext("error_context", context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * 커스텀 메시지 보고
 */
export const reportMessage = (
  message: string, 
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: any
) => {
  if (context) {
    Sentry.withScope((scope) => {
      scope.setContext("message_context", context);
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
};

/**
 * 성능 트랜잭션 시작
 */
export const startTransaction = (name: string, op?: string) => {
  return Sentry.startTransaction({
    name,
    op: op || 'navigation',
  });
};

/**
 * 브레드크럼(사용자 행동 기록) 추가
 */
export const addBreadcrumb = (message: string, category?: string, level?: any) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'user',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
};

/**
 * API 요청 관련 에러 보고
 */
export const reportApiError = (error: any, url: string, method: string) => {
  Sentry.withScope((scope) => {
    scope.setTag("api_error", true);
    scope.setContext("api_request", {
      url,
      method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });
    
    const errorMessage = `API ${method} ${url} failed`;
    if (error.response?.status >= 500) {
      // 서버 에러는 error 레벨로
      Sentry.captureException(new Error(errorMessage));
    } else if (error.response?.status >= 400) {
      // 클라이언트 에러는 warning 레벨로
      Sentry.captureMessage(errorMessage, 'warning');
    } else {
      // 네트워크 에러 등은 error 레벨로
      Sentry.captureException(error);
    }
  });
};

/**
 * 사용자 행동 추적
 */
export const trackUserAction = (action: string, data?: any) => {
  addBreadcrumb(`User ${action}`, 'user', 'info');
  
  if (data) {
    Sentry.withScope((scope) => {
      scope.setContext("user_action", {
        action,
        ...data,
        timestamp: new Date().toISOString(),
      });
      Sentry.captureMessage(`User performed: ${action}`, 'info');
    });
  }
};

/**
 * 페이지 뷰 추적
 */
export const trackPageView = (pageName: string, additionalData?: any) => {
  addBreadcrumb(`Visited ${pageName}`, 'navigation', 'info');
  
  Sentry.withScope((scope) => {
    scope.setTag("page", pageName);
    if (additionalData) {
      scope.setContext("page_data", additionalData);
    }
    Sentry.captureMessage(`Page view: ${pageName}`, 'info');
  });
};

/**
 * 성능 메트릭 보고
 */
export const reportPerformanceMetric = (metricName: string, value: number, unit?: string) => {
  Sentry.withScope((scope) => {
    scope.setContext("performance_metric", {
      name: metricName,
      value,
      unit: unit || 'ms',
      timestamp: new Date().toISOString(),
    });
    Sentry.captureMessage(`Performance: ${metricName} = ${value}${unit || 'ms'}`, 'info');
  });
};
