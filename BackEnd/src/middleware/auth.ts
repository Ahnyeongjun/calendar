import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UnauthorizedError } from './errorHandler';
import { logger } from '../services/logger';
import { UserContext } from '../types/common';
import { AppErrorType, classifyError, extractErrorMessage, isJwtError } from '../types/errors';

interface JwtPayload {
  id: string;
  username: string;
  name: string;
  iat: number;
  exp: number;
}

// JWT 토큰에서 사용자 정보 추출
const extractUserFromToken = (token: string): UserContext => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    return {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name
    };
  } catch (error: unknown) {
    const classifiedError = classifyError(error);

    if (isJwtError(classifiedError)) {
      if (classifiedError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('토큰이 만료되었습니다. 다시 로그인해주세요.');
      } else if (classifiedError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('유효하지 않은 토큰입니다.');
      }
    }

    const errorMessage = extractErrorMessage(classifiedError);
    throw new UnauthorizedError(`토큰 검증에 실패했습니다: ${errorMessage}`);
  }
};

// Authorization 헤더에서 토큰 추출
const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw new UnauthorizedError('인증 토큰이 필요합니다.');
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new UnauthorizedError('토큰 형식이 올바르지 않습니다. Bearer 토큰을 사용해주세요.');
  }

  return parts[1];
};

// 기본 인증 미들웨어
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const user = extractUserFromToken(token);

    req.user = user;

    const logContext = logger.createContext('AUTH', req.requestId, user.id);
    logContext.debug('Authentication successful', { userId: user.id, username: user.username });

    next();
  } catch (error: unknown) {
    const classifiedError = classifyError(error);
    const logContext = logger.createContext('AUTH', req.requestId);

    if (classifiedError instanceof UnauthorizedError) {
      logContext.warn('Authentication failed', {
        error: classifiedError.message,
        authHeader: req.headers.authorization ? 'present' : 'missing',
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    } else {
      const errorMessage = extractErrorMessage(classifiedError);
      logContext.error('Unexpected authentication error', {
        error: errorMessage,
        type: classifiedError.constructor.name
      });
    }

    next(classifiedError instanceof UnauthorizedError ? classifiedError : new UnauthorizedError('인증에 실패했습니다.'));
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = extractTokenFromHeader(authHeader);
    const user = extractUserFromToken(token);

    req.user = user;

    const logContext = logger.createContext('OPTIONAL_AUTH', req.requestId, user.id);
    logContext.debug('Optional authentication successful', { userId: user.id, username: user.username });

    next();
  } catch (error: unknown) {
    const classifiedError = classifyError(error);
    const logContext = logger.createContext('OPTIONAL_AUTH', req.requestId);
    const errorMessage = extractErrorMessage(classifiedError);

    logContext.warn('Optional authentication failed, proceeding without auth', {
      error: errorMessage,
      type: classifiedError.constructor.name
    });

    // 선택적 인증에서는 에러가 발생해도 next()로 진행
    next();
  }
};

// 역할 기반 권한 확인 미들웨어 (향후 확장용)
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('인증이 필요합니다.'));
      return;
    }

    // 현재는 역할 시스템이 없으므로 모든 사용자 통과
    // 향후 User 모델에 role 필드 추가 시 구현
    const logContext = logger.createContext('RBAC', req.requestId, req.user.id);
    logContext.debug('Role check passed (not implemented)', { requiredRoles: roles, userId: req.user.id });

    next();
  };
};

// 사용자 본인 확인 미들웨어
export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new UnauthorizedError('인증이 필요합니다.'));
    return;
  }

  const targetUserId = req.params.userId || req.params.id;

  if (!targetUserId) {
    next(new UnauthorizedError('사용자 ID가 필요합니다.'));
    return;
  }

  if (req.user.id !== targetUserId) {
    // 현재는 관리자 역할이 없으므로 본인만 접근 가능
    const logContext = logger.createContext('SELF_CHECK', req.requestId, req.user.id);
    logContext.warn('Access denied: not self', {
      userId: req.user.id,
      targetUserId,
      action: `${req.method} ${req.originalUrl}`
    });

    next(new UnauthorizedError('본인의 정보만 접근할 수 있습니다.'));
    return;
  }

  next();
};

// 토큰 새로고침 미들웨어
export const refreshTokenIfNeeded = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = extractTokenFromHeader(authHeader);
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded || !decoded.exp) {
      next();
      return;
    }

    // 토큰이 1시간 이내에 만료되면 새 토큰 발급
    const expiryTime = decoded.exp * 1000;
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();

    if (expiryTime - now < oneHour) {
      try {
        const newToken = jwt.sign(
          {
            id: req.user.id,
            username: req.user.username,
            name: req.user.name
          },
          config.jwt.secret,
          { expiresIn: config.jwt.expiresIn }
        );

        res.setHeader('X-New-Token', newToken);

        const logContext = logger.createContext('TOKEN_REFRESH', req.requestId, req.user.id);
        logContext.info('Token refreshed', { userId: req.user.id });
      } catch (tokenError: unknown) {
        const classifiedTokenError = classifyError(tokenError);
        const tokenErrorMessage = extractErrorMessage(classifiedTokenError);

        const logContext = logger.createContext('TOKEN_REFRESH', req.requestId, req.user.id);
        logContext.error('Token generation failed during refresh', {
          error: tokenErrorMessage,
          type: classifiedTokenError.constructor.name
        });

        // 토큰 생성 실패해도 요청은 계속 진행
      }
    }

    next();
  } catch (error: unknown) {
    // 토큰 새로고침 실패는 요청을 중단하지 않음
    const classifiedError = classifyError(error);
    const logContext = logger.createContext('TOKEN_REFRESH', req.requestId, req.user?.id);
    const errorMessage = extractErrorMessage(classifiedError);

    logContext.warn('Token refresh failed', {
      error: errorMessage,
      type: classifiedError.constructor.name
    });

    next();
  }
};

// JWT 토큰 생성 유틸리티
export const generateToken = (user: UserContext): string => {
  try {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  } catch (error: unknown) {
    const classifiedError = classifyError(error);
    const errorMessage = extractErrorMessage(classifiedError);

    logger.error('JWT token generation failed', 'JWT', {
      error: errorMessage,
      type: classifiedError.constructor.name,
      userId: user.id
    });

    throw new Error(`토큰 생성에 실패했습니다: ${errorMessage}`);
  }
};

// JWT 토큰 검증 유틸리티
export const verifyToken = (token: string): UserContext => {
  try {
    return extractUserFromToken(token);
  } catch (error: unknown) {
    const classifiedError = classifyError(error);
    const errorMessage = extractErrorMessage(classifiedError);

    logger.error('JWT token verification failed', 'JWT', {
      error: errorMessage,
      type: classifiedError.constructor.name
    });

    throw classifiedError instanceof UnauthorizedError
      ? classifiedError
      : new UnauthorizedError(`토큰 검증에 실패했습니다: ${errorMessage}`);
  }
};

// 기본 내보내기 (기존 호환성)
export default authMiddleware;

// 미들웨어들을 객체로 묶어서 내보내기
export const authMiddlewares = {
  auth: authMiddleware,
  optionalAuth: optionalAuthMiddleware,
  requireRole,
  requireSelfOrAdmin,
  refreshTokenIfNeeded,
  generateToken,
  verifyToken
};
