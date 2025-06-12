import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { UserContext } from '../types/common';
import { logger } from '../services/logger';
import { NotFoundError, ConflictError, InternalServerError } from '../middleware/errorHandler';
import { generateToken } from '../middleware/auth';
import { AppErrorType, classifyError, isPrismaError, extractErrorMessage } from '../types/errors';

export interface CreateUserInput {
  username: string;
  password: string;
  name: string;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
}

export interface AuthResult {
  user: UserContext;
  token: string;
}

export interface SafeUser extends Omit<User, 'password'> {
  id: string;
  username: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SELECT_SAFE_FIELDS = {
    id: true,
    username: true,
    name: true,
    createdAt: true,
    updatedAt: true
  };

  /**
   * 사용자명으로 사용자 찾기 (비밀번호 포함)
   */
  static async findByUsername(username: string, requestId?: string): Promise<User | null> {
    try {
      const timer = logger.startTimer('UserModel.findByUsername', requestId);

      const user = await prisma.user.findUnique({
        where: { username }
      });

      const duration = timer.end('USER_MODEL');
      logger.db('SELECT', 'users', duration, undefined, requestId);

      return user;
    } catch (error) {
      logger.db('SELECT', 'users', undefined, error, requestId);
      throw new InternalServerError('사용자 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * ID로 안전한 사용자 정보 찾기 (비밀번호 제외)
   */
  static async findById(id: string, requestId?: string): Promise<SafeUser | null> {
    try {
      const timer = logger.startTimer('UserModel.findById', requestId);

      const user = await prisma.user.findUnique({
        where: { id },
        select: this.SELECT_SAFE_FIELDS
      });

      const duration = timer.end('USER_MODEL');
      logger.db('SELECT', 'users', duration, undefined, requestId);

      return user;
    } catch (error) {
      logger.db('SELECT', 'users', undefined, error, requestId);
      throw new InternalServerError('사용자 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * ID로 사용자 찾기 (존재하지 않으면 예외 발생)
   */
  static async findByIdOrThrow(id: string, requestId?: string): Promise<SafeUser> {
    const user = await this.findById(id, requestId);

    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 사용자명 중복 확인
   */
  static async checkUsernameExists(username: string, requestId?: string): Promise<boolean> {
    try {
      const timer = logger.startTimer('UserModel.checkUsernameExists', requestId);

      const count = await prisma.user.count({
        where: { username }
      });

      const duration = timer.end('USER_MODEL');
      logger.db('COUNT', 'users', duration, undefined, requestId);

      return count > 0;
    } catch (error) {
      logger.db('COUNT', 'users', undefined, error, requestId);
      throw new InternalServerError('사용자명 중복 확인 중 오류가 발생했습니다.');
    }
  }

  /**
   * 새 사용자 생성
   */
  static async create(userData: CreateUserInput, requestId?: string): Promise<SafeUser> {
    try {
      // 사용자명 중복 확인
      const exists = await this.checkUsernameExists(userData.username, requestId);
      if (exists) {
        throw new ConflictError('이미 사용 중인 사용자명입니다.');
      }

      const timer = logger.startTimer('UserModel.create', requestId);

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

      // 새 사용자 생성
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          password: hashedPassword,
          name: userData.name
        },
        select: this.SELECT_SAFE_FIELDS
      });

      const duration = timer.end('USER_MODEL');
      logger.db('INSERT', 'users', duration, undefined, requestId);

      const logContext = logger.createContext('USER_MODEL', requestId);
      logContext.info('User created successfully', {
        userId: user.id,
        username: user.username
      });

      return user;
    } catch (error: unknown) {
      const classifiedError = classifyError(error);

      if (classifiedError instanceof ConflictError) {
        throw classifiedError;
      }

      logger.db('INSERT', 'users', undefined, classifiedError, requestId);

      // Prisma unique constraint 에러 처리
      if (isPrismaError(classifiedError) && classifiedError.code === 'P2002') {
        throw new ConflictError('이미 사용 중인 사용자명입니다.');
      }

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`사용자 생성 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  /**
   * 사용자 정보 업데이트
   */
  static async update(id: string, updateData: UpdateUserInput, requestId?: string): Promise<SafeUser> {
    try {
      // 사용자 존재 확인
      await this.findByIdOrThrow(id, requestId);

      const timer = logger.startTimer('UserModel.update', requestId);

      const dataToUpdate: any = {};

      if (updateData.name) {
        dataToUpdate.name = updateData.name;
      }

      if (updateData.password) {
        dataToUpdate.password = await bcrypt.hash(updateData.password, this.SALT_ROUNDS);
      }

      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: this.SELECT_SAFE_FIELDS
      });

      const duration = timer.end('USER_MODEL');
      logger.db('UPDATE', 'users', duration, undefined, requestId);

      const logContext = logger.createContext('USER_MODEL', requestId, id);
      logContext.info('User updated successfully', {
        userId: user.id,
        updatedFields: Object.keys(dataToUpdate)
      });

      return user;
    } catch (error: unknown) {
      const classifiedError = classifyError(error);

      if (classifiedError instanceof NotFoundError) {
        throw classifiedError;
      }

      logger.db('UPDATE', 'users', undefined, classifiedError, requestId);

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`사용자 정보 업데이트 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  /**
   * 사용자 삭제
   */
  static async delete(id: string, requestId?: string): Promise<void> {
    try {
      // 사용자 존재 확인
      await this.findByIdOrThrow(id, requestId);

      const timer = logger.startTimer('UserModel.delete', requestId);

      await prisma.user.delete({
        where: { id }
      });

      const duration = timer.end('USER_MODEL');
      logger.db('DELETE', 'users', duration, undefined, requestId);

      const logContext = logger.createContext('USER_MODEL', requestId, id);
      logContext.info('User deleted successfully', { userId: id });
    } catch (error: unknown) {
      const classifiedError = classifyError(error);

      if (classifiedError instanceof NotFoundError) {
        throw classifiedError;
      }

      logger.db('DELETE', 'users', undefined, classifiedError, requestId);

      // Prisma 레코드 없음 에러 처리
      if (isPrismaError(classifiedError) && classifiedError.code === 'P2025') {
        throw new NotFoundError('사용자를 찾을 수 없습니다.');
      }

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`사용자 삭제 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  /**
   * 사용자 인증
   */
  static async authenticate(username: string, password: string, requestId?: string): Promise<AuthResult | null> {
    try {
      const logContext = logger.createContext('USER_MODEL', requestId);
      logContext.debug('Authentication attempt', { username });

      const user = await this.findByUsername(username, requestId);

      if (!user) {
        logContext.warn('Authentication failed: user not found', { username });
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        logContext.warn('Authentication failed: invalid password', {
          username,
          userId: user.id
        });
        return null;
      }

      // 토큰 생성
      const userContext: UserContext = {
        id: user.id,
        username: user.username,
        name: user.name
      };

      const token = generateToken(userContext);

      logContext.info('Authentication successful', {
        userId: user.id,
        username: user.username
      });

      return {
        user: userContext,
        token
      };
    } catch (error: unknown) {
      const classifiedError = classifyError(error);
      const logContext = logger.createContext('USER_MODEL', requestId);

      logContext.error('Authentication error', classifiedError);

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`인증 처리 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  /**
   * 비밀번호 변경
   */
  static async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    requestId?: string
  ): Promise<void> {
    try {
      const logContext = logger.createContext('USER_MODEL', requestId, id);

      // 현재 비밀번호 확인을 위해 전체 사용자 정보 조회
      const user = await prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다.');
      }

      // 현재 비밀번호 확인
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        logContext.warn('Password change failed: invalid current password');
        throw new ConflictError('현재 비밀번호가 올바르지 않습니다.');
      }

      // 새 비밀번호 해시화 및 업데이트
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      const timer = logger.startTimer('UserModel.changePassword', requestId);

      await prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword }
      });

      const duration = timer.end('USER_MODEL');
      logger.db('UPDATE', 'users', duration, undefined, requestId);

      logContext.info('Password changed successfully');
    } catch (error: unknown) {
      const classifiedError = classifyError(error);

      if (classifiedError instanceof NotFoundError || classifiedError instanceof ConflictError) {
        throw classifiedError;
      }

      logger.db('UPDATE', 'users', undefined, classifiedError, requestId);

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`비밀번호 변경 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  /**
   * 사용자 목록 조회 (관리자용)
   */
  static async findMany(
    page: number = 1,
    limit: number = 10,
    search?: string,
    requestId?: string
  ): Promise<{ users: SafeUser[]; total: number }> {
    try {
      const timer = logger.startTimer('UserModel.findMany', requestId);

      const skip = (page - 1) * limit;
      const where = search ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } }
        ]
      } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: this.SELECT_SAFE_FIELDS,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const duration = timer.end('USER_MODEL');
      logger.db('SELECT', 'users', duration, undefined, requestId);

      return { users, total };
    } catch (error: unknown) {
      const classifiedError = classifyError(error);

      logger.db('SELECT', 'users', undefined, classifiedError, requestId);

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`사용자 목록 조회 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }

  /**
   * 사용자 통계 조회
   */
  static async getStats(requestId?: string): Promise<{
    totalUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }> {
    try {
      const timer = logger.startTimer('UserModel.getStats', requestId);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: monthAgo } } })
      ]);

      const duration = timer.end('USER_MODEL');
      logger.db('COUNT', 'users', duration, undefined, requestId);

      return {
        totalUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth
      };
    } catch (error: unknown) {
      const classifiedError = classifyError(error);

      logger.db('COUNT', 'users', undefined, classifiedError, requestId);

      const errorMessage = extractErrorMessage(classifiedError);
      throw new InternalServerError(`사용자 통계 조회 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }
}

export default UserModel;
