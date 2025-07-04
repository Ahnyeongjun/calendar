import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../services/logger';
import { ApiResponse } from '../types/common';

// Request에 requestId와 user 추가
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      user?: {
        id: string;
        username: string;
        name: string;
      };
    }
  }
}

// Request ID 미들웨어
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = randomUUID();
  req.startTime = Date.now();
  
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// HTTP 로깅 미들웨어
export const httpLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  let responseBody: any;

  res.send = function(body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    const userId = req.user?.id;
    
    logger.http(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.requestId,
      userId
    );

    // 에러 응답의 경우 상세 로깅
    if (res.statusCode >= 400) {
      const logContext = logger.createContext('HTTP_ERROR', req.requestId, userId);
      logContext.warn('HTTP Error Response', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        requestBody: req.body,
        responseBody: typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
  });

  next();
};

// 에러 처리 클래스들
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors: Record<string, string[]> = {}) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'TOO_MANY_REQUESTS');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, true, 'INTERNAL_SERVER_ERROR');
  }
}

// 비동기 함수 래퍼
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 핸들러
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Endpoint ${req.method} ${req.originalUrl} not found`);
  next(error);
};

// 전역 에러 핸들러
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const logContext = logger.createContext('ERROR_HANDLER', req.requestId, req.user?.id);

  // Prisma 에러 처리
  if ((error as any).code === 'P2003') {
    // 외래 키 제약 조건 위반
    const validationError = new ValidationError('유효하지 않은 참조 ID입니다.');
    const response: ApiResponse = {
      success: false,
      error: validationError.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };

    logContext.warn('Foreign Key Constraint Violation', {
      message: error.message,
      code: (error as any).code,
      meta: (error as any).meta,
      url: req.originalUrl,
      method: req.method
    });

    res.status(400).json(response);
    return;
  }

  if ((error as any).code === 'P2000') {
    // 데이터 길이 초과
    const validationError = new ValidationError('입력 데이터가 너무 깁니다.');
    const response: ApiResponse = {
      success: false,
      error: validationError.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };

    logContext.warn('Data Length Exceeded', {
      message: error.message,
      code: (error as any).code,
      meta: (error as any).meta,
      url: req.originalUrl,
      method: req.method
    });

    res.status(400).json(response);
    return;
  }

  // AppError 인스턴스인지 확인
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };

    // ValidationError의 경우 errors 필드 추가
    if (error instanceof ValidationError) {
      response.errors = error.errors;
    }

    // 클라이언트 에러는 WARN, 서버 에러는 ERROR 레벨로 로깅
    if (error.statusCode >= 500) {
      logContext.error('Application Error', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body
      });
    } else {
      logContext.warn('Client Error', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        url: req.originalUrl,
        method: req.method
      });
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // 일반 Error 처리
  logContext.error('Unhandled Error', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body
  });

  const response: ApiResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };

  res.status(500).json(response);
};

// 에러 핸들러들을 하나의 객체로 내보내기
export const errorHandlers = {
  requestIdMiddleware,
  httpLoggingMiddleware,
  asyncHandler,
  notFoundHandler,
  errorHandler
};
