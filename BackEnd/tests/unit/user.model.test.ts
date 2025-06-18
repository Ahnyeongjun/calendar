import UserModel, { CreateUserInput, UpdateUserInput } from '../../src/models/User';
import { TestDatabase } from '../helpers/database';
import { validUserData, invalidUserData, validUpdateData } from '../fixtures/data';
import { ConflictError, NotFoundError, InternalServerError } from '../../src/middleware/errorHandler';
import bcrypt from 'bcryptjs';

jest.mock('../../src/config/prisma', () => require('../__mocks__/prismaMocks'));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));
jest.mock('../../src/middleware/auth', () => require('../__mocks__/authMocks'));

interface TestUser {
  id: string;
  username: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

describe('UserModel', () => {
  let prisma: any;

  beforeAll(async () => {
    prisma = await TestDatabase.setup();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('create', () => {
    it('새 사용자를 성공적으로 생성해야 한다', async () => {
      const user = await UserModel.create(validUserData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe(validUserData.username);
      expect(user.name).toBe(validUserData.name);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user).not.toHaveProperty('password'); // 비밀번호는 반환되지 않아야 함
    });

    it('중복된 사용자명으로 생성 시 ConflictError를 발생시켜야 한다', async () => {
      await UserModel.create(validUserData);

      await expect(UserModel.create(validUserData)).rejects.toThrow(ConflictError);
    });

    it('생성된 사용자의 비밀번호가 해시화되어야 한다', async () => {
      const user = await UserModel.create(validUserData);

      // 데이터베이스에서 직접 조회하여 비밀번호 확인
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(userWithPassword.password).not.toBe(validUserData.password);

      const isPasswordValid = await bcrypt.compare(validUserData.password, userWithPassword.password);
      expect(isPasswordValid).toBe(true);
    });
  });

  describe('findById', () => {
    it('존재하는 사용자 ID로 조회 시 사용자 정보를 반환해야 한다', async () => {
      const createdUser = await UserModel.create(validUserData);
      const foundUser = await UserModel.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.username).toBe(createdUser.username);
      expect(foundUser!.name).toBe(createdUser.name);
      expect(foundUser).not.toHaveProperty('password');
    });

    it('존재하지 않는 사용자 ID로 조회 시 null을 반환해야 한다', async () => {
      const foundUser = await UserModel.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('존재하는 사용자 ID로 조회 시 사용자 정보를 반환해야 한다', async () => {
      const createdUser = await UserModel.create(validUserData);
      const foundUser = await UserModel.findByIdOrThrow(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
    });

    it('존재하지 않는 사용자 ID로 조회 시 NotFoundError를 발생시켜야 한다', async () => {
      await expect(UserModel.findByIdOrThrow('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByUsername', () => {
    it('존재하는 사용자명으로 조회 시 사용자 정보를 반환해야 한다 (비밀번호 포함)', async () => {
      await UserModel.create(validUserData);
      const foundUser = await UserModel.findByUsername(validUserData.username);

      expect(foundUser).toBeDefined();
      expect(foundUser!.username).toBe(validUserData.username);
      expect(foundUser!.password).toBeDefined(); // 이 메서드는 비밀번호를 포함해야 함
    });

    it('존재하지 않는 사용자명으로 조회 시 null을 반환해야 한다', async () => {
      const foundUser = await UserModel.findByUsername('non-existent-username');
      expect(foundUser).toBeNull();
    });
  });

  describe('checkUsernameExists', () => {
    it('존재하는 사용자명에 대해 true를 반환해야 한다', async () => {
      await UserModel.create(validUserData);
      const exists = await UserModel.checkUsernameExists(validUserData.username);
      expect(exists).toBe(true);
    });

    it('존재하지 않는 사용자명에 대해 false를 반환해야 한다', async () => {
      const exists = await UserModel.checkUsernameExists('non-existent-username');
      expect(exists).toBe(false);
    });
  });

  describe('update', () => {
    it('사용자 정보를 성공적으로 업데이트해야 한다', async () => {
      const createdUser = await UserModel.create(validUserData);
      const updatedUser = await UserModel.update(createdUser.id, validUpdateData);

      expect(updatedUser.id).toBe(createdUser.id);
      expect(updatedUser.name).toBe(validUpdateData.name);
      expect(updatedUser.username).toBe(createdUser.username); // username은 변경되지 않음
    });

    it('비밀번호 업데이트 시 해시화되어야 한다', async () => {
      const createdUser = await UserModel.create(validUserData);
      const newPassword = 'NewPassword123!';

      await UserModel.update(createdUser.id, { password: newPassword });

      // 데이터베이스에서 직접 조회하여 비밀번호 확인
      const userWithPassword = await prisma.user.findUnique({
        where: { id: createdUser.id }
      });

      expect(userWithPassword.password).not.toBe(newPassword);

      const isPasswordValid = await bcrypt.compare(newPassword, userWithPassword.password);
      expect(isPasswordValid).toBe(true);
    });

    it('존재하지 않는 사용자 ID로 업데이트 시 NotFoundError를 발생시켜야 한다', async () => {
      await expect(UserModel.update('non-existent-id', validUpdateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('사용자를 성공적으로 삭제해야 한다', async () => {
      const createdUser = await UserModel.create(validUserData);

      await UserModel.delete(createdUser.id);

      const foundUser = await UserModel.findById(createdUser.id);
      expect(foundUser).toBeNull();
    });

    it('존재하지 않는 사용자 ID로 삭제 시 NotFoundError를 발생시켜야 한다', async () => {
      await expect(UserModel.delete('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('authenticate', () => {
    beforeEach(async () => {
      await UserModel.create(validUserData);
    });

    it('올바른 사용자명과 비밀번호로 인증 시 토큰과 사용자 정보를 반환해야 한다', async () => {
      const authResult = await UserModel.authenticate(validUserData.username, validUserData.password);

      expect(authResult).toBeDefined();
      expect(authResult!.user).toBeDefined();
      expect(authResult!.token).toBeDefined();
      expect(authResult!.user.username).toBe(validUserData.username);
      expect(authResult!.user.name).toBe(validUserData.name);
    });

    it('존재하지 않는 사용자명으로 인증 시 null을 반환해야 한다', async () => {
      const authResult = await UserModel.authenticate('non-existent-user', validUserData.password);
      expect(authResult).toBeNull();
    });

    it('잘못된 비밀번호로 인증 시 null을 반환해야 한다', async () => {
      const authResult = await UserModel.authenticate(validUserData.username, 'wrong-password');
      expect(authResult).toBeNull();
    });
  });

  describe('changePassword', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await UserModel.create(validUserData);
      userId = user.id;
    });

    it('올바른 현재 비밀번호로 비밀번호 변경을 성공해야 한다', async () => {
      const newPassword = 'NewPassword123!';

      await UserModel.changePassword(userId, validUserData.password, newPassword);

      // 새 비밀번호로 인증 확인
      const authResult = await UserModel.authenticate(validUserData.username, newPassword);
      expect(authResult).toBeDefined();
    });

    it('잘못된 현재 비밀번호로 변경 시 ConflictError를 발생시켜야 한다', async () => {
      const newPassword = 'NewPassword123!';

      await expect(
        UserModel.changePassword(userId, 'wrong-password', newPassword)
      ).rejects.toThrow(ConflictError);
    });

    it('존재하지 않는 사용자 ID로 비밀번호 변경 시 NotFoundError를 발생시켜야 한다', async () => {
      await expect(
        UserModel.changePassword('non-existent-id', validUserData.password, 'NewPassword123!')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      // 테스트용 사용자들 생성
      await UserModel.create({ ...validUserData, username: 'user1', name: 'User One' });
      await UserModel.create({ ...validUserData, username: 'user2', name: 'User Two' });
      await UserModel.create({ ...validUserData, username: 'admin1', name: 'Admin One' });
    });

    it('페이지네이션과 함께 사용자 목록을 반환해야 한다', async () => {
      const result = await UserModel.findMany(1, 2);

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.users[0]).not.toHaveProperty('password');
    });

    it('검색어로 사용자를 필터링해야 한다', async () => {
      const result = await UserModel.findMany(1, 10, 'admin');

      expect(result.users).toHaveLength(1);
      expect(result.users[0].username).toBe('admin1');
      expect(result.total).toBe(1);
    });

    it('생성일 기준 내림차순으로 정렬되어야 한다', async () => {
      const result = await UserModel.findMany(1, 10);

      expect(result.users).toHaveLength(3);
      // 가장 최근에 생성된 사용자가 첫 번째여야 함
      expect(result.users[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        result.users[1].createdAt.getTime()
      );
    });
  });

  describe('getStats', () => {
    it('사용자 통계를 올바르게 반환해야 한다', async () => {
      // 오늘 생성된 사용자
      await UserModel.create({ ...validUserData, username: 'today1' });
      await UserModel.create({ ...validUserData, username: 'today2' });

      const stats = await UserModel.getStats();

      expect(stats.totalUsers).toBe(2);
      expect(stats.newUsersToday).toBe(2);
      expect(stats.newUsersThisWeek).toBe(2);
      expect(stats.newUsersThisMonth).toBe(2);
    });

    it('빈 데이터베이스에서 0 통계를 반환해야 한다', async () => {
      const stats = await UserModel.getStats();

      expect(stats.totalUsers).toBe(0);
      expect(stats.newUsersToday).toBe(0);
      expect(stats.newUsersThisWeek).toBe(0);
      expect(stats.newUsersThisMonth).toBe(0);
    });
  });

  describe('Database Operations', () => {
    it('대량의 사용자 생성과 조회가 정상 작동해야 한다', async () => {
      // 여러 사용자 생성
      const users: TestUser[] = [];
      for (let i = 0; i < 5; i++) {
        const user = await UserModel.create({
          ...validUserData,
          username: `user${i}`,
          name: `User ${i}`
        });
        users.push(user as TestUser);
      }

      // 모든 사용자 조회
      const result = await UserModel.findMany(1, 10);
      expect(result.users).toHaveLength(5);
      expect(result.total).toBe(5);

      // 각 사용자 개별 조회
      for (const user of users) {
        const foundUser = await UserModel.findById(user.id);
        expect(foundUser).toBeDefined();
        expect(foundUser!.username).toBe(user.username);
      }
    });

    it('트랜잭션처럼 작동하는 복합 작업이 정상 작동해야 한다', async () => {
      // 사용자 생성
      const user = await UserModel.create(validUserData);

      // 프로필 업데이트
      const updatedUser = await UserModel.update(user.id, { name: 'Updated Name' });
      expect(updatedUser.name).toBe('Updated Name');

      // 비밀번호 변경
      await UserModel.changePassword(user.id, validUserData.password, 'NewPassword123!');

      // 새 비밀번호로 인증
      const authResult = await UserModel.authenticate(user.username, 'NewPassword123!');
      expect(authResult).toBeDefined();
      expect(authResult!.user.name).toBe('Updated Name');

      // 최종 확인
      const finalUser = await UserModel.findById(user.id);
      expect(finalUser).toBeDefined();
      expect(finalUser!.name).toBe('Updated Name');
    });

    it('동시 접근 상황을 시뮬레이션해야 한다', async () => {
      // 동일한 사용자명으로 동시에 생성 시도
      const promises = [
        UserModel.create({ ...validUserData, username: 'concurrent' }),
        UserModel.create({ ...validUserData, username: 'concurrent' })
      ];

      // 하나만 성공하고 하나는 실패해야 함
      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // 실패한 것은 ConflictError여야 함
      const failedResult = failed[0] as PromiseRejectedResult;
      expect(failedResult.reason).toBeInstanceOf(ConflictError);
    });
  });
});
