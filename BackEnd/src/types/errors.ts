// 기본 에러 인터페이스
export interface BaseError {
  message: string;
  stack?: string;
  name: string;
}

// Prisma 에러 타입
export interface PrismaError extends BaseError {
  code: string;
  meta?: {
    target?: string[];
    field_name?: string;
    database_error?: string;
  };
  clientVersion: string;
}

// API 에러 타입 (axios 등)
export interface ApiError extends BaseError {
  response?: {
    status: number;
    statusText: string;
    data: {
      error?: string;
      errors?: Record<string, string[]>;
      message?: string;
      code?: string;
    };
  };
  request?: any;
  config?: any;
  code?: string;
}

// 네트워크 에러 타입
export interface NetworkError extends BaseError {
  code: 'TIMEOUT' | 'NETWORK_ERROR' | 'CONNECTION_REFUSED' | 'UNKNOWN';
  url?: string;
  method?: string;
}

// JWT 관련 에러 타입
export interface JwtError extends BaseError {
  name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError';
  expiredAt?: Date;
}

// 유니온 타입으로 모든 가능한 에러 정의
export type AppErrorType = 
  | Error
  | PrismaError  
  | ApiError
  | NetworkError
  | JwtError;

// 에러 타입 가드 함수들
export function isPrismaError(error: unknown): error is PrismaError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'clientVersion' in error &&
    typeof (error as any).code === 'string'
  );
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as any).response === 'object'
  );
}

export function isNetworkError(error: unknown): error is NetworkError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    ['TIMEOUT', 'NETWORK_ERROR', 'CONNECTION_REFUSED', 'UNKNOWN'].includes((error as any).code)
  );
}

export function isJwtError(error: unknown): error is JwtError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes((error as any).name)
  );
}

// 에러 분류 함수
export function classifyError(error: unknown): AppErrorType {
  if (error instanceof Error) {
    return error;
  }
  
  if (isPrismaError(error)) {
    return error;
  }
  
  if (isApiError(error)) {
    return error;
  }
  
  if (isNetworkError(error)) {
    return error;
  }
  
  if (isJwtError(error)) {
    return error;
  }
  
  // 알 수 없는 에러는 기본 Error로 변환
  return new Error(
    typeof error === 'string' ? error : 'Unknown error occurred'
  );
}

// 에러 메시지 추출 함수
export function extractErrorMessage(error: AppErrorType): string {
  if (isPrismaError(error)) {
    switch (error.code) {
      case 'P2002':
        return '중복된 데이터입니다.';
      case 'P2025':
        return '데이터를 찾을 수 없습니다.';
      case 'P2003':
        return '참조 무결성 제약 조건 위반입니다.';
      default:
        return error.message || '데이터베이스 오류가 발생했습니다.';
    }
  }
  
  if (isApiError(error)) {
    return error.response?.data?.error || 
           error.response?.data?.message || 
           error.message || 
           'API 요청 중 오류가 발생했습니다.';
  }
  
  if (isNetworkError(error)) {
    switch (error.code) {
      case 'TIMEOUT':
        return '요청 시간이 초과되었습니다.';
      case 'NETWORK_ERROR':
        return '네트워크 연결에 문제가 있습니다.';
      case 'CONNECTION_REFUSED':
        return '서버에 연결할 수 없습니다.';
      default:
        return '네트워크 오류가 발생했습니다.';
    }
  }
  
  if (isJwtError(error)) {
    switch (error.name) {
      case 'TokenExpiredError':
        return '토큰이 만료되었습니다.';
      case 'JsonWebTokenError':
        return '유효하지 않은 토큰입니다.';
      case 'NotBeforeError':
        return '토큰이 아직 활성화되지 않았습니다.';
      default:
        return '토큰 검증에 실패했습니다.';
    }
  }
  
  return error.message || '알 수 없는 오류가 발생했습니다.';
}
