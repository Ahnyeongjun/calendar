import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import dotenv from 'dotenv';

dotenv.config();

// Express의 Request 타입을 확장
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: '인증 토큰이 없습니다.' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // 토큰 검증
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // 요청 객체에 사용자 정보 추가
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: '토큰이 만료되었습니다.' });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      return;
    }
    
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export default auth;