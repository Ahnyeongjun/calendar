// 프론트엔드 에러 타입 정의

// 기본 에러 인터페이스
export interface BaseError {
  message: string;
  stack?: string;
  name: string;
}

// API 에러 타입
export interface ApiError extends BaseError {
  status?: number;
  code?: string;
  errors?: Record<string, string[]>;
  requestId?: string;
  response?: {
    status: number;
    statusText: string;
    data: {
      error?: string;
      errors?: Record<string, string[]>;
      message?: string;
      code?: string;
      success: boolean;
      timestamp: string;
      requestId?: string;
    };
  };
}

// 네트워크 에러 타입
export interface NetworkError extends BaseError {
  code: 'TIMEOUT' | 'NETWORK_ERROR' | 'CONNECTION_REFUSED' | 'ABORT' | 'UNKNOWN';
  url?: string;
  method?: string;
}

// 인증 에러 타입
export interface AuthError extends BaseError {
  code: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED' | 'FORBIDDEN';
  field?: string;
}

// 유효성 검사 에러 타입
export interface ValidationError extends BaseError {
  field: string;
  value?: any;
  rule: string;
}

// 유니온 타입으로 모든 가능한 프론트엔드 에러 정의
export type FrontendErrorType = 
  | Error
  | ApiError
  | NetworkError
  | AuthError
  | ValidationError;

// 에러 타입 가드 함수들
export function isApiError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    ('response' in error || 'status' in error) &&
    'message' in error
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    ['TIMEOUT', 'NETWORK_ERROR', 'CONNECTION_REFUSED', 'ABORT', 'UNKNOWN'].includes((error as any).code)
  );
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    ['INVALID_TOKEN', 'TOKEN_EXPIRED', 'UNAUTHORIZED', 'FORBIDDEN'].includes((error as any).code)
  );
}

export function isValidationError(error: unknown): error is ValidationError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'field' in error &&
    'rule' in error &&
    'message' in error
  );
}

// 에러 분류 함수
export function classifyError(error: unknown): FrontendErrorType {
  if (error instanceof Error) {
    return error;
  }
  
  if (isApiError(error)) {
    return error;
  }
  
  if (isNetworkError(error)) {
    return error;
  }
  
  if (isAuthError(error)) {
    return error;
  }
  
  if (isValidationError(error)) {
    return error;
  }
  
  // 알 수 없는 에러는 기본 Error로 변환
  return new Error(
    typeof error === 'string' ? error : 'Unknown error occurred'
  );
}

// 사용자 친화적 에러 메시지 추출
export function extractErrorMessage(error: FrontendErrorType): string {
  if (isApiError(error)) {
    // API 응답에서 에러 메시지 추출
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.response?.data?.errors) {
      const firstError = Object.values(error.response.data.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
    
    // HTTP 상태 코드에 따른 기본 메시지
    if (error.status || error.response?.status) {
      const status = error.status || error.response?.status;
      switch (status) {
        case 400:
          return '잘못된 요청입니다.';
        case 401:
          return '인증이 필요합니다.';
        case 403:
          return '접근 권한이 없습니다.';
        case 404:
          return '요청한 리소스를 찾을 수 없습니다.';
        case 409:
          return '요청이 현재 서버 상태와 충돌합니다.';
        case 422:
          return '요청 데이터가 유효하지 않습니다.';
        case 429:
          return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
        case 500:
          return '서버 내부 오류가 발생했습니다.';
        case 502:
          return '서버가 응답하지 않습니다.';
        case 503:
          return '서비스를 일시적으로 사용할 수 없습니다.';
        default:
          return `서버 오류가 발생했습니다 (${status}).`;
      }
    }
    
    return error.message || 'API 요청 중 오류가 발생했습니다.';
  }
  
  if (isNetworkError(error)) {
    switch (error.code) {
      case 'TIMEOUT':
        return '요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
      case 'NETWORK_ERROR':
        return '네트워크 연결에 문제가 있습니다.';
      case 'CONNECTION_REFUSED':
        return '서버에 연결할 수 없습니다.';
      case 'ABORT':
        return '요청이 취소되었습니다.';
      default:
        return '네트워크 오류가 발생했습니다.';
    }
  }
  
  if (isAuthError(error)) {
    switch (error.code) {
      case 'INVALID_TOKEN':
        return '유효하지 않은 인증 정보입니다.';
      case 'TOKEN_EXPIRED':
        return '인증이 만료되었습니다. 다시 로그인해주세요.';
      case 'UNAUTHORIZED':
        return '로그인이 필요합니다.';
      case 'FORBIDDEN':
        return '접근 권한이 없습니다.';
      default:
        return '인증 오류가 발생했습니다.';
    }
  }
  
  if (isValidationError(error)) {
    return `${error.field}: ${error.message}`;
  }
  
  return error.message || '알 수 없는 오류가 발생했습니다.';
}

// 에러 심각도 분류
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export function getErrorSeverity(error: FrontendErrorType): ErrorSeverity {
  if (isApiError(error)) {
    const status = error.status || error.response?.status;
    if (!status) return 'medium';
    
    if (status >= 500) return 'critical';
    if (status === 401 || status === 403) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }
  
  if (isNetworkError(error)) {
    if (error.code === 'CONNECTION_REFUSED') return 'critical';
    if (error.code === 'TIMEOUT') return 'high';
    return 'medium';
  }
  
  if (isAuthError(error)) {
    return 'high';
  }
  
  if (isValidationError(error)) {
    return 'low';
  }
  
  return 'medium';
}

// 에러 액션 분류 (사용자가 할 수 있는 액션)
export interface ErrorAction {
  type: 'retry' | 'reload' | 'login' | 'contact' | 'ignore';
  label: string;
  description?: string;
}

export function getErrorActions(error: FrontendErrorType): ErrorAction[] {
  const actions: ErrorAction[] = [];
  
  if (isApiError(error)) {
    const status = error.status || error.response?.status;
    
    switch (status) {
      case 401:
        actions.push({
          type: 'login',
          label: '다시 로그인',
          description: '인증이 만료되었습니다'
        });
        break;
      case 429:
        actions.push({
          type: 'retry',
          label: '잠시 후 다시 시도',
          description: '요청 제한에 걸렸습니다'
        });
        break;
      case 500:
      case 502:
      case 503:
        actions.push({
          type: 'retry',
          label: '다시 시도'
        });
        actions.push({
          type: 'contact',
          label: '고객 지원 문의'
        });
        break;
      default:
        actions.push({
          type: 'retry',
          label: '다시 시도'
        });
    }
  }
  
  if (isNetworkError(error)) {
    actions.push({
      type: 'retry',
      label: '다시 시도'
    });
    actions.push({
      type: 'reload',
      label: '페이지 새로고침'
    });
  }
  
  if (isAuthError(error)) {
    actions.push({
      type: 'login',
      label: '다시 로그인'
    });
  }
  
  return actions;
}
