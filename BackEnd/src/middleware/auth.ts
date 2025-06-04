import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { UnauthorizedError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('인증 토큰이 필요합니다.');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('토큰이 제공되지 않았습니다.');
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT 시크릿이 설정되지 않았습니다.');
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // 토큰 만료 시간 추가 검증
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new UnauthorizedError('토큰이 만료되었습니다.');
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('토큰이 만료되었습니다.'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
    } else if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('인증에 실패했습니다.'));
    }
  }
};

export default auth;
