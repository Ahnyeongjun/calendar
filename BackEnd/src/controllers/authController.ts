import { Request, Response } from 'express';
import UserModel from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';
import ValidationService from '../services/validationService';
import { logger } from '../services/logger';
import { ApiResponse } from '../types/common';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

export class AuthController {
  /**
   * 사용자 로그인
   */
  static login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId);
    
    // 입력 데이터 검증
    const { username, password } = ValidationService.validateLoginData(req.body);
    
    logContext.info('Login attempt', { username });
    
    // 사용자 인증
    const authResult = await UserModel.authenticate(username, password, req.requestId);
    
    if (!authResult) {
      logContext.warn('Login failed', { username });
      
      const response: ApiResponse = {
        success: false,
        error: '사용자명 또는 비밀번호가 올바르지 않습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }
    
    logContext.info('Login successful', { 
      userId: authResult.user.id,
      username: authResult.user.username 
    });
    
    const response: ApiResponse = {
      success: true,
      data: authResult,
      message: '로그인에 성공했습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });

  /**
   * 사용자 프로필 조회
   */
  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId, req.user?.id);
    
    if (!req.user) {
      logContext.error('User not found in request context');
      const response: ApiResponse = {
        success: false,
        error: '인증 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }
    
    const user = await UserModel.findByIdOrThrow(req.user.id, req.requestId);
    
    logContext.debug('Profile retrieved', { userId: user.id });
    
    const response: ApiResponse = {
      success: true,
      data: { user },
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });

  /**
   * 사용자 등록
   */
  static register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId);
    
    // 입력 데이터 검증
    const userData = ValidationService.validateCreateUserData(req.body);
    
    logContext.info('Registration attempt', { username: userData.username });
    
    // 새 사용자 생성
    const user = await UserModel.create(userData, req.requestId);
    
    // 생성된 사용자로 자동 로그인 처리
    const authResult = await UserModel.authenticate(userData.username, userData.password, req.requestId);
    
    if (!authResult) {
      // 이 경우는 매우 드물지만 안전장치
      logContext.error('Auto-login failed after registration', { userId: user.id });
      
      const response: ApiResponse = {
        success: true,
        data: { user },
        message: '회원가입이 완료되었습니다. 로그인해주세요.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(201).json(response);
      return;
    }
    
    logContext.info('Registration and auto-login successful', { 
      userId: user.id,
      username: user.username 
    });
    
    const response: ApiResponse = {
      success: true,
      data: authResult,
      message: '회원가입이 완료되었습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.status(201).json(response);
  });

  /**
   * 비밀번호 변경
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId, req.user?.id);
    
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: '인증 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    // 기본 검증
    if (!currentPassword || !newPassword) {
      const response: ApiResponse = {
        success: false,
        error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(400).json(response);
      return;
    }

    if (currentPassword === newPassword) {
      const response: ApiResponse = {
        success: false,
        error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(400).json(response);
      return;
    }

    // 새 비밀번호 강도 검증 (선택적)
    const passwordValidation = ValidationService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      const response: ApiResponse = {
        success: false,
        error: '비밀번호가 보안 요구사항을 충족하지 않습니다.',
        errors: { password: passwordValidation.errors },
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(400).json(response);
      return;
    }
    
    logContext.info('Password change attempt');
    
    await UserModel.changePassword(req.user.id, currentPassword, newPassword, req.requestId);
    
    logContext.info('Password changed successfully');
    
    const response: ApiResponse = {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });

  /**
   * 프로필 업데이트
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId, req.user?.id);
    
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: '인증 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }

    // 입력 데이터 검증
    const updateData = ValidationService.validateUpdateUserData(req.body);
    
    logContext.info('Profile update attempt', { 
      updatedFields: Object.keys(updateData) 
    });
    
    const updatedUser = await UserModel.update(req.user.id, updateData, req.requestId);
    
    logContext.info('Profile updated successfully');
    
    const response: ApiResponse = {
      success: true,
      data: { user: updatedUser },
      message: '프로필이 성공적으로 업데이트되었습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });

  /**
   * 토큰 새로고침
   */
  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId, req.user?.id);
    
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: '인증 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }

    // 사용자 정보 재확인
    const user = await UserModel.findByIdOrThrow(req.user.id, req.requestId);
    
    // 새 토큰 생성
    const authResult = await UserModel.authenticate(user.username, '', req.requestId);
    
    if (!authResult) {
      logContext.error('Token refresh failed');
      
      const response: ApiResponse = {
        success: false,
        error: '토큰 새로고침에 실패했습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }
    
    logContext.info('Token refreshed successfully');
    
    const response: ApiResponse = {
      success: true,
      data: { token: authResult.token },
      message: '토큰이 성공적으로 새로고침되었습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });

  /**
   * 로그아웃 (클라이언트에서 토큰 삭제를 위한 응답)
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId, req.user?.id);
    
    logContext.info('User logout');
    
    const response: ApiResponse = {
      success: true,
      message: '성공적으로 로그아웃되었습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });

  /**
   * 계정 삭제
   */
  static deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const logContext = logger.createContext('AUTH_CONTROLLER', req.requestId, req.user?.id);
    
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: '인증 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }

    const { password } = req.body;
    
    if (!password) {
      const response: ApiResponse = {
        success: false,
        error: '계정 삭제를 위해 비밀번호를 입력해주세요.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(400).json(response);
      return;
    }

    // 비밀번호 확인
    const authResult = await UserModel.authenticate(req.user.username, password, req.requestId);
    
    if (!authResult) {
      logContext.warn('Account deletion failed: invalid password');
      
      const response: ApiResponse = {
        success: false,
        error: '비밀번호가 올바르지 않습니다.',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      };
      
      res.status(401).json(response);
      return;
    }
    
    logContext.info('Account deletion attempt');
    
    await UserModel.delete(req.user.id, req.requestId);
    
    logContext.info('Account deleted successfully');
    
    const response: ApiResponse = {
      success: true,
      message: '계정이 성공적으로 삭제되었습니다.',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    };
    
    res.json(response);
  });
}

export default AuthController;
