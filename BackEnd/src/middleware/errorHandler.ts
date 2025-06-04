import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;

  constructor(message: string = '리소스를 찾을 수 없습니다.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = '인증이 필요합니다.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  isOperational = true;

  constructor(message: string = '권한이 없습니다.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// 전역 에러 처리 미들웨어
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = '서버 내부 오류가 발생했습니다.';

  // 알려진 에러 타입들 처리
  if (error.isOperational) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = '잘못된 ID 형식입니다.';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = '이미 존재하는 데이터입니다.';
  }

  // 개발 환경에서는 상세한 에러 정보 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      error: error 
    })
  });
};

// 404 에러 처리 미들웨어
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `경로 ${req.originalUrl}을 찾을 수 없습니다.`
  });
};

// 비동기 에러를 자동으로 catch하는 래퍼
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
