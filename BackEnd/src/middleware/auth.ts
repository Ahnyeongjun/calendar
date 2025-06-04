import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

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
      res.status(401).json({ message: '인증 토큰이 필요합니다.' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: '토큰이 만료되었습니다.' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    } else {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

export default auth;
