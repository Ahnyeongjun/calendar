import { Request, Response } from 'express';
import UserModel from '../models/User';
import { asyncHandler, UnauthorizedError } from '../middleware/errorHandler';
import ValidationService from '../services/validationService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

class AuthController {
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    
    // 입력 데이터 검증
    ValidationService.validateLoginData({ username, password });
    
    // 사용자 인증
    const authResult = await UserModel.authenticate(username, password);
    
    if (!authResult) {
      throw new UnauthorizedError('사용자명 또는 비밀번호가 올바르지 않습니다.');
    }
    
    res.json({
      success: true,
      ...authResult
    });
  });
  
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
    }
    
    res.json({ 
      success: true,
      user 
    });
  });
}

export default AuthController;
