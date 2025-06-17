import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';

// 요청 컨텍스트 설정
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  user: ['id', 'email'],
  request: ['method', 'url', 'headers'],
  transaction: 'methodPath', // GET /api/users/:id
});

// 에러 핸들링
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // 모든 에러를 Sentry로 보냄
    return true;
  },
});

// 트랜잭션 추적
export const sentryTracingHandler = (req: Request, res: Response, next: NextFunction) => {
  // 사용자 정보가 있으면 Sentry 컨텍스트에 추가
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
    });
  }

  // 요청 정보 추가
  Sentry.setTag('endpoint', `${req.method} ${req.route?.path || req.path}`);
  Sentry.setContext('request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
  });

  next();
};

// 성능 모니터링을 위한 커스텀 미들웨어
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const transaction = Sentry.startTransaction({
    op: 'http.server',
    name: `${req.method} ${req.route?.path || req.path}`,
  });

  // 트랜잭션을 현재 스코프에 설정
  Sentry.getCurrentScope().setSpan(transaction);

  // 응답이 끝날 때 트랜잭션 종료
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    transaction.setTag('http.status_code', res.statusCode);
    transaction.setData('response_time', duration);
    
    // 느린 요청은 별도 표시
    if (duration > 1000) {
      transaction.setTag('slow_request', true);
    }
    
    transaction.finish();
  });

  next();
};

// API 에러 응답 표준화
export const errorResponseMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Sentry에 추가 컨텍스트 제공
  Sentry.withScope((scope) => {
    scope.setTag('error_type', error.constructor.name);
    scope.setLevel('error');
    scope.setContext('error_details', {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
    });
    
    Sentry.captureException(error);
  });

  // 클라이언트에 전송할 에러 정보
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = error.statusCode || 500;
  
  const errorResponse = {
    success: false,
    message: error.message || 'Internal Server Error',
    ...(isDevelopment && {
      stack: error.stack,
      details: error
    }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  res.status(statusCode).json(errorResponse);
};

// 캐치되지 않은 에러 처리
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    Sentry.captureException(error, {
      tags: { type: 'uncaughtException' }
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    Sentry.captureException(reason as Error, {
      tags: { type: 'unhandledRejection' }
    });
  });
};
