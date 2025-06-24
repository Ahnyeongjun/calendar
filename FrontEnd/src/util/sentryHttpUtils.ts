import * as Sentry from "@sentry/react";

/**
 * Sentry 보안 토큰을 포함한 HTTP 헤더 생성
 */
export const getSentryHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // 보안 토큰이 설정되어 있으면 헤더에 추가
  const sentryToken = import.meta.env.VITE_SENTRY_TOKEN;
  if (sentryToken) {
    headers['X-Sentry-Token'] = sentryToken;
  }
  
  return headers;
};

/**
 * Sentry 추적 헤더를 포함한 HTTP 헤더 생성
 * 분산 추적을 위해 사용
 */
export const getSentryTraceHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // 현재 트랜잭션의 추적 헤더 가져오기
  const span = Sentry.getActiveSpan();
  if (span) {
    const traceHeader = Sentry.spanToTraceHeader(span);
    if (traceHeader) {
      headers['sentry-trace'] = traceHeader;
    }
    
    // Baggage 헤더 추가 (추가 메타데이터용)
    const baggage = Sentry.spanToBaggageHeader(span);
    if (baggage) {
      headers['baggage'] = baggage;
    }
  }
  
  return headers;
};

/**
 * 모든 Sentry 관련 헤더를 포함한 HTTP 헤더 생성
 */
export const getAllSentryHeaders = (): Record<string, string> => {
  return {
    ...getSentryHeaders(),
    ...getSentryTraceHeaders(),
  };
};

/**
 * fetch API에 Sentry 헤더를 자동으로 추가하는 래퍼 함수
 */
export const sentryFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // 기존 헤더와 Sentry 헤더 병합
  const sentryHeaders = getAllSentryHeaders();
  const headers = {
    ...sentryHeaders,
    ...options.headers,
  };
  
  // Sentry로 API 요청 추적
  return Sentry.withScope(async (scope) => {
    scope.setTag('api_request', true);
    scope.setContext('request', {
      url,
      method: options.method || 'GET',
      headers: Object.keys(headers),
    });
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // 응답 상태 추가
      scope.setTag('response_status', response.status);
      
      if (!response.ok) {
        // 4xx, 5xx 에러 추적
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      // 네트워크 에러 또는 HTTP 에러 추적
      Sentry.captureException(error);
      throw error;
    }
  });
};

/**
 * Axios 인터셉터용 Sentry 헤더 설정 함수
 */
export const setupAxiosSentryInterceptors = (axiosInstance: any) => {
  // 요청 인터셉터: Sentry 헤더 추가
  axiosInstance.interceptors.request.use(
    (config: any) => {
      const sentryHeaders = getAllSentryHeaders();
      config.headers = {
        ...config.headers,
        ...sentryHeaders,
      };
      
      // 요청 시작 추적
      Sentry.addBreadcrumb({
        message: `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        category: 'http',
        level: 'info',
        data: {
          url: config.url,
          method: config.method,
        },
      });
      
      return config;
    },
    (error: any) => {
      Sentry.captureException(error);
      return Promise.reject(error);
    }
  );
  
  // 응답 인터셉터: 에러 추적
  axiosInstance.interceptors.response.use(
    (response: any) => {
      // 성공 응답 추적
      Sentry.addBreadcrumb({
        message: `API Success: ${response.status} ${response.config.url}`,
        category: 'http',
        level: 'info',
        data: {
          url: response.config.url,
          status: response.status,
        },
      });
      
      return response;
    },
    (error: any) => {
      // 에러 응답 추적
      const config = error.config;
      const response = error.response;
      
      Sentry.withScope((scope) => {
        scope.setTag('api_error', true);
        scope.setContext('api_request', {
          url: config?.url,
          method: config?.method,
          status: response?.status,
          statusText: response?.statusText,
        });
        
        if (response?.status >= 500) {
          // 서버 에러
          Sentry.captureException(new Error(`Server Error: ${config?.method} ${config?.url}`));
        } else if (response?.status >= 400) {
          // 클라이언트 에러
          Sentry.captureMessage(`Client Error: ${response.status} ${config?.url}`, 'warning');
        } else {
          // 네트워크 에러 등
          Sentry.captureException(error);
        }
      });
      
      return Promise.reject(error);
    }
  );
};

/**
 * 도메인별 보안 토큰 검증
 */
export const isAllowedDomain = (url: string): boolean => {
  const allowedDomains = [
    'localhost',
    'yourserver.io',
    'your-api-domain.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || 
      urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

/**
 * 허용된 도메인에만 보안 토큰을 추가하는 안전한 헤더 생성
 */
export const getSafeHeaders = (url: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // 추적 헤더는 항상 추가
  Object.assign(headers, getSentryTraceHeaders());
  
  // 보안 토큰은 허용된 도메인에만 추가
  if (isAllowedDomain(url)) {
    Object.assign(headers, getSentryHeaders());
  }
  
  return headers;
};
