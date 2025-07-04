import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../src/controllers/authController';
import UserModel, { AuthResult } from '../../src/models/User';
import ValidationService from '../../src/services/validationService';
import { TestDatabase } from '../helpers/database';
import { validUserData, validLoginData, invalidLoginData } from '../fixtures/data';
import { ConflictError, NotFoundError } from '../../src/middleware/errorHandler';
import { UserContext } from '../../src/types/common';

// Mock 설정들을 파일 상단에 배치
jest.mock('../../src/models/User', () => require('../__mocks__/userModelMocks'));
jest.mock('../../src/services/validationService', () => require('../__mocks__/validationServiceMocks'));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));
jest.mock('../../src/middleware/auth', () => require('../__mocks__/authMocks'));

// errorHandler mock은 asyncHandler를 단순한 함수로 만들어서 await 처리가 가능하게 함
jest.mock('../../src/middleware/errorHandler', () => {
  const actual = jest.requireActual('../../src/middleware/errorHandler');
  return {
    ...actual,
    asyncHandler: (fn: Function) => {
      return async (req: any, res: any, next: any) => {
        try {
          await fn(req, res, next);
        } catch (error) {
          next(error);
        }
      };
    }
  };
});


const MockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const MockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    req = {
      requestId: 'test-request-id',
      body: {},
      user: undefined
    };

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    next = jest.fn();

    res = {
      json: jsonSpy as unknown as Response['json'],
      status: statusSpy as unknown as Response['status']
    };

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('유효한 로그인 정보로 성공적으로 로그인해야 한다', async () => {
      const mockAuthResult = {
        user: {
          id: 'user-id',
          username: 'testuser',
          name: 'Test User'
        },
        token: 'jwt-token'
      };

      MockValidationService.validateLoginData.mockReturnValue(validLoginData);
      MockUserModel.authenticate.mockResolvedValue(mockAuthResult);

      req.body = validLoginData;

      await AuthController.login(req as Request, res as Response, next);

      expect(MockValidationService.validateLoginData).toHaveBeenCalledWith(validLoginData);
      expect(MockUserModel.authenticate).toHaveBeenCalledWith(
        validLoginData.username,
        validLoginData.password,
        'test-request-id'
      );
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: mockAuthResult,
        message: '로그인에 성공했습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      // next가 호출되지 않았는지 확인
      expect(next).not.toHaveBeenCalled();
    });

    it('잘못된 로그인 정보로 인증 실패 시 401 에러를 반환해야 한다', async () => {
      MockValidationService.validateLoginData.mockReturnValue(invalidLoginData.wrongPassword);
      MockUserModel.authenticate.mockResolvedValue(null);

      req.body = invalidLoginData.wrongPassword;

      await AuthController.login(req as Request, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: '사용자명 또는 비밀번호가 올바르지 않습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('ValidationService에서 에러가 발생하면 next를 호출해야 한다', async () => {
      const validationError = new Error('Validation failed');
      MockValidationService.validateLoginData.mockImplementation(() => {
        throw validationError;
      });

      req.body = invalidLoginData.emptyUsername;

      await AuthController.login(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });
  });

  describe('register', () => {
    it('유효한 데이터로 성공적으로 회원가입해야 한다', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAuthResult = {
        user: {
          id: 'user-id',
          username: 'testuser',
          name: 'Test User'
        },
        token: 'jwt-token'
      };

      // res.status(201).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateUserData.mockReturnValue(validUserData);
      MockUserModel.create.mockResolvedValue(mockUser);
      MockUserModel.authenticate.mockResolvedValue(mockAuthResult);

      req.body = validUserData;

      await AuthController.register(req as Request, res as Response, next);

      expect(MockValidationService.validateCreateUserData).toHaveBeenCalledWith(validUserData);
      expect(MockUserModel.create).toHaveBeenCalledWith(validUserData, 'test-request-id');

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(chainedJson).toHaveBeenCalledWith({
        success: true,
        data: mockAuthResult,
        message: '회원가입이 완료되었습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('중복된 사용자명으로 회원가입 시 next를 통해 에러를 전달해야 한다', async () => {
      const conflictError = new ConflictError('이미 사용 중인 사용자명입니다.');

      MockValidationService.validateCreateUserData.mockReturnValue(validUserData);
      MockUserModel.create.mockRejectedValue(conflictError);

      req.body = validUserData;

      await AuthController.register(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(conflictError);
    });

    it('UserModel.authenticate가 실패하면 회원가입 성공 메시지를 반환해야 한다', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // res.status(201).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateUserData.mockReturnValue(validUserData);
      MockUserModel.create.mockResolvedValue(mockUser);
      MockUserModel.authenticate.mockResolvedValue(null); // 자동 로그인 실패

      req.body = validUserData;

      await AuthController.register(req as Request, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(chainedJson).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser },
        message: '회원가입이 완료되었습니다. 로그인해주세요.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
    });
  });

  describe('getProfile', () => {
    it('인증된 사용자의 프로필을 성공적으로 반환해야 한다', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };

      MockUserModel.findByIdOrThrow.mockResolvedValue(mockUser);

      await AuthController.getProfile(req as any, res as Response, next);

      expect(MockUserModel.findByIdOrThrow).toHaveBeenCalledWith('user-id', 'test-request-id');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { user: mockUser },
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('인증되지 않은 요청에 대해 401 에러를 반환해야 한다', async () => {
      req.user = undefined;

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      await AuthController.getProfile(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(chainedJson).toHaveBeenCalledWith({
        success: false,
        error: '인증 정보를 찾을 수 없습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('UserModel에서 에러가 발생하면 next를 호출해야 한다', async () => {
      const notFoundError = new NotFoundError('사용자를 찾을 수 없습니다.');

      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };

      MockUserModel.findByIdOrThrow.mockRejectedValue(notFoundError);

      await AuthController.getProfile(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };
    });

    it('유효한 비밀번호 변경 요청을 성공적으로 처리해야 한다', async () => {
      const passwordData = {
        currentPassword: 'currentPassword123!',
        newPassword: 'newPassword123!'
      };

      MockValidationService.validatePassword.mockReturnValue({
        isValid: true,
        errors: []
      });
      MockUserModel.changePassword.mockResolvedValue(undefined);

      req.body = passwordData;

      await AuthController.changePassword(req as any, res as Response, next);

      expect(MockUserModel.changePassword).toHaveBeenCalledWith(
        'user-id',
        passwordData.currentPassword,
        passwordData.newPassword,
        'test-request-id'
      );
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('현재 비밀번호와 새 비밀번호가 같을 때 400 에러를 반환해야 한다', async () => {
      const passwordData = {
        currentPassword: 'samePassword123!',
        newPassword: 'samePassword123!'
      };

      // res.status(400).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      req.body = passwordData;

      await AuthController.changePassword(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(chainedJson).toHaveBeenCalledWith({
        success: false,
        error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('약한 새 비밀번호에 대해 400 에러를 반환해야 한다', async () => {
      const passwordData = {
        currentPassword: 'currentPassword123!',
        newPassword: 'weak'
      };

      // res.status(400).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validatePassword.mockReturnValue({
        isValid: false,
        errors: ['비밀번호가 너무 짧습니다.']
      });

      req.body = passwordData;

      await AuthController.changePassword(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(chainedJson).toHaveBeenCalledWith({
        success: false,
        error: '비밀번호가 보안 요구사항을 충족하지 않습니다.',
        errors: { password: ['비밀번호가 너무 짧습니다.'] },
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('인증되지 않은 요청에 대해 401 에러를 반환해야 한다', async () => {
      req.user = undefined;

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      await AuthController.changePassword(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('UserModel에서 에러가 발생하면 next를 호출해야 한다', async () => {
      const changePasswordError = new ConflictError('현재 비밀번호가 올바르지 않습니다.');

      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!'
      };

      MockValidationService.validatePassword.mockReturnValue({
        isValid: true,
        errors: []
      });
      MockUserModel.changePassword.mockRejectedValue(changePasswordError);

      req.body = passwordData;

      await AuthController.changePassword(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(changePasswordError);
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };
    });

    it('프로필을 성공적으로 업데이트해야 한다', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedUser = {
        id: 'user-id',
        username: 'testuser',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      MockValidationService.validateUpdateUserData.mockReturnValue(updateData);
      MockUserModel.update.mockResolvedValue(updatedUser);

      req.body = updateData;

      await AuthController.updateProfile(req as any, res as Response, next);

      expect(MockValidationService.validateUpdateUserData).toHaveBeenCalledWith(updateData);
      expect(MockUserModel.update).toHaveBeenCalledWith('user-id', updateData, 'test-request-id');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { user: updatedUser },
        message: '프로필이 성공적으로 업데이트되었습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('인증되지 않은 요청에 대해 401 에러를 반환해야 한다', async () => {
      req.user = undefined;

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      await AuthController.updateProfile(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('ValidationService에서 에러가 발생하면 next를 호출해야 한다', async () => {
      const validationError = new Error('Validation failed');

      MockValidationService.validateUpdateUserData.mockImplementation(() => {
        throw validationError;
      });

      req.body = { name: '' };

      await AuthController.updateProfile(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(validationError);
    });
  });

  describe('deleteAccount', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };
    });

    it('올바른 비밀번호로 계정을 성공적으로 삭제해야 한다', async () => {
      const mockAuthResult: AuthResult = {
        user: req.user as UserContext,
        token: 'token'
      };

      MockUserModel.authenticate.mockResolvedValue(mockAuthResult);
      MockUserModel.delete.mockResolvedValue(undefined);

      req.body = { password: 'correctPassword123!' };

      await AuthController.deleteAccount(req as any, res as Response, next);

      expect(MockUserModel.authenticate).toHaveBeenCalledWith(
        'testuser',
        'correctPassword123!',
        'test-request-id'
      );
      expect(MockUserModel.delete).toHaveBeenCalledWith('user-id', 'test-request-id');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '계정이 성공적으로 삭제되었습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('잘못된 비밀번호로 계정 삭제 시 401 에러를 반환해야 한다', async () => {
      MockUserModel.authenticate.mockResolvedValue(null);

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      req.body = { password: 'wrongPassword123!' };

      await AuthController.deleteAccount(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(chainedJson).toHaveBeenCalledWith({
        success: false,
        error: '비밀번호가 올바르지 않습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('비밀번호가 제공되지 않았을 때 400 에러를 반환해야 한다', async () => {
      req.body = {};

      // res.status(400).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      await AuthController.deleteAccount(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(chainedJson).toHaveBeenCalledWith({
        success: false,
        error: '계정 삭제를 위해 비밀번호를 입력해주세요.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('인증되지 않은 요청에 대해 401 에러를 반환해야 한다', async () => {
      req.user = undefined;

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      await AuthController.deleteAccount(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('UserModel에서 에러가 발생하면 next를 호출해야 한다', async () => {
      const deleteError = new Error('Delete failed');

      const mockAuthResult = {
        user: req.user as UserContext,
        token: 'token'
      };

      MockUserModel.authenticate.mockResolvedValue(mockAuthResult);
      MockUserModel.delete.mockRejectedValue(deleteError);

      req.body = { password: 'correctPassword123!' };

      await AuthController.deleteAccount(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(deleteError);
    });
  });

  describe('logout', () => {
    it('로그아웃 응답을 성공적으로 반환해야 한다', async () => {
      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };

      await AuthController.logout(req as any, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '성공적으로 로그아웃되었습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User'
      };
    });

    it('토큰을 성공적으로 새로고침해야 한다', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAuthResult = {
        user: req.user as UserContext,
        token: 'new-jwt-token'
      };

      MockUserModel.findByIdOrThrow.mockResolvedValue(mockUser);
      MockUserModel.authenticate.mockResolvedValue(mockAuthResult);

      await AuthController.refreshToken(req as any, res as Response, next);

      expect(MockUserModel.findByIdOrThrow).toHaveBeenCalledWith('user-id', 'test-request-id');
      expect(MockUserModel.authenticate).toHaveBeenCalledWith('testuser', '', 'test-request-id');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { token: 'new-jwt-token' },
        message: '토큰이 성공적으로 새로고침되었습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('인증되지 않은 요청에 대해 401 에러를 반환해야 한다', async () => {
      req.user = undefined;

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      await AuthController.refreshToken(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('토큰 새로고침 실패 시 401 에러를 반환해야 한다', async () => {
      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // res.status(401).json() 체인을 위한 설정
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockUserModel.findByIdOrThrow.mockResolvedValue(mockUser);
      MockUserModel.authenticate.mockResolvedValue(null);

      await AuthController.refreshToken(req as any, res as Response, next);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(chainedJson).toHaveBeenCalledWith({
        success: false,
        error: '토큰 새로고침에 실패했습니다.',
        timestamp: expect.any(String),
        requestId: 'test-request-id'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('UserModel에서 에러가 발생하면 next를 호출해야 한다', async () => {
      const findError = new NotFoundError('사용자를 찾을 수 없습니다.');

      MockUserModel.findByIdOrThrow.mockRejectedValue(findError);

      await AuthController.refreshToken(req as any, res as Response, next);

      expect(next).toHaveBeenCalledWith(findError);
    });
  });
});