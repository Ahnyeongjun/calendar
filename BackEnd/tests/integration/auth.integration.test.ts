import request from 'supertest';
import express from 'express';
import { TestDatabase } from '../helpers/database';
import { createTestServer, generateTestToken, createTestUser } from '../helpers/testUtils';
import { validUserData, validLoginData, invalidUserData, invalidLoginData } from '../fixtures/data';
import authRoutes from '../../src/routes/authRoutes';
import { Priority, Status } from '@prisma/client';

jest.mock('../../src/config/prisma', () => require('../__mocks__/prismaMocks'));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));
jest.mock('../../src/middleware/auth', () => require('../__mocks__/authMocks'));

describe('Auth Integration Tests', () => {
  let app: express.Application;
  let testServer: any;

  beforeAll(async () => {
    await TestDatabase.setup();
    testServer = createTestServer();
    testServer.setupRoutes('/api/auth', authRoutes);
    app = testServer.getApp();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('POST /api/auth/register', () => {
    it('유효한 데이터로 회원가입이 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: '회원가입이 완료되었습니다.',
        data: {
          user: {
            username: validUserData.username,
            name: validUserData.name
          },
          token: expect.any(String)
        }
      });

      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.requestId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();

      // 실제로 사용자가 DB에 생성되었는지 확인
      const prisma = TestDatabase.getPrisma();
      const createdUser = await prisma.user.findUnique({
        where: { username: validUserData.username }
      });
      expect(createdUser).toBeDefined();
      expect(createdUser).not.toBeNull();
      if (createdUser) {
        expect(createdUser.name).toBe(validUserData.name);
      }
    });

    it('중복된 사용자명으로 회원가입 시 409 에러를 반환해야 한다', async () => {
      // 첫 번째 사용자 생성
      await createTestUser({ username: validUserData.username });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('이미 사용 중인 사용자명')
      });
    });

    it('잘못된 데이터로 회원가입 시 400 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.emptyUsername)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('짧은 비밀번호로 회원가입 시 400 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.shortPassword)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser({
        username: validLoginData.username,
        password: validLoginData.password
      });
    });

    it('올바른 인증 정보로 로그인이 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '로그인에 성공했습니다.',
        data: {
          user: {
            username: validLoginData.username
          },
          token: expect.any(String)
        }
      });

      expect(response.body.data.user).not.toHaveProperty('password');

      // 토큰이 유효한지 확인
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(response.body.data.token, 'test-secret');
      expect(decoded.username).toBe(validLoginData.username);
    });

    it('잘못된 비밀번호로 로그인 시 401 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData.wrongPassword)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
      });
    });

    it('존재하지 않는 사용자로 로그인 시 401 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData.nonExistentUser)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
      });
    });

    it('빈 사용자명으로 로그인 시 400 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData.emptyUsername)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /api/auth/profile', () => {
    let user: any;
    let token: string;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user.id, user.username, user.name);
    });

    it('유효한 토큰으로 프로필 조회가 성공해야 한다', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            name: user.name
          }
        }
      });

      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('토큰 없이 프로필 조회 시 401 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('토큰')
      });
    });

    it('잘못된 토큰으로 프로필 조회 시 401 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('만료된 토큰으로 프로필 조회 시 401 에러를 반환해야 한다', async () => {
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { id: user.id, username: user.username, name: user.name },
        'test-secret',
        { expiresIn: '-1h' } // 이미 만료된 토큰
      );

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('PUT /api/auth/profile', () => {
    let user: any;
    let token: string;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user.id, user.username, user.name);
    });

    it('유효한 데이터로 프로필 업데이트가 성공해야 한다', async () => {
      const updateData = { name: 'Updated Test User' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '프로필이 성공적으로 업데이트되었습니다.',
        data: {
          user: {
            id: user.id,
            username: user.username,
            name: updateData.name
          }
        }
      });

      // 실제로 DB에서 업데이트되었는지 확인
      const prisma = TestDatabase.getPrisma();
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(updatedUser).not.toBeNull();
      if (updatedUser) {
        expect(updatedUser.name).toBe(updateData.name);
      }
    });

    it('빈 이름으로 프로필 업데이트 시 400 에러를 반환해야 한다', async () => {
      const updateData = { name: '' };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let user: any;
    let token: string;
    const currentPassword = 'TestPassword123!';

    beforeEach(async () => {
      user = await createTestUser({ password: currentPassword });
      token = generateTestToken(user.id, user.username, user.name);
    });

    it('올바른 현재 비밀번호로 비밀번호 변경이 성공해야 한다', async () => {
      const passwordData = {
        currentPassword,
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.'
      });

      // 새 비밀번호로 로그인 확인
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: user.username,
          password: passwordData.newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('잘못된 현재 비밀번호로 변경 시 409 에러를 반환해야 한다', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: '현재 비밀번호가 올바르지 않습니다.'
      });
    });

    it('동일한 비밀번호로 변경 시 400 에러를 반환해야 한다', async () => {
      const passwordData = {
        currentPassword,
        newPassword: currentPassword
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.'
      });
    });

    it('약한 새 비밀번호로 변경 시 400 에러를 반환해야 한다', async () => {
      const passwordData = {
        currentPassword,
        newPassword: '123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('보안 요구사항')
      });
    });
  });

  describe('DELETE /api/auth/account', () => {
    let user: any;
    let token: string;
    const password = 'TestPassword123!';

    beforeEach(async () => {
      user = await createTestUser({ password });
      token = generateTestToken(user.id, user.username, user.name);
    });

    it('올바른 비밀번호로 계정 삭제가 성공해야 한다', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '계정이 성공적으로 삭제되었습니다.'
      });

      // 실제로 사용자가 DB에서 삭제되었는지 확인
      const prisma = TestDatabase.getPrisma();
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(deletedUser).toBeNull();

      // 삭제된 계정으로 로그인 시도
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: user.username,
          password
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
    });

    it('잘못된 비밀번호로 계정 삭제 시 401 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'WrongPassword123!' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: '비밀번호가 올바르지 않습니다.'
      });

      // 사용자가 여전히 존재하는지 확인
      const prisma = TestDatabase.getPrisma();
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(existingUser).toBeDefined();
      expect(existingUser).not.toBeNull();
    });

    it('비밀번호 없이 계정 삭제 시 400 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: '계정 삭제를 위해 비밀번호를 입력해주세요.'
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    let user: any;
    let token: string;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user.id, user.username, user.name);
    });

    it('로그아웃이 성공해야 한다', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: '성공적으로 로그아웃되었습니다.'
      });
    });
  });

  describe('Authentication Flow', () => {
    it('회원가입 -> 로그인 -> 프로필 조회 -> 프로필 수정 -> 비밀번호 변경 -> 로그아웃 플로우가 정상 작동해야 한다', async () => {
      // 1. 회원가입
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      const { token: registerToken } = registerResponse.body.data;

      // 2. 로그인 (별도)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const { token: loginToken } = loginResponse.body.data;

      // 3. 프로필 조회
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.username).toBe(validUserData.username);

      // 4. 프로필 수정
      const updateResponse = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${loginToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.user.name).toBe('Updated Name');

      // 5. 비밀번호 변경
      const newPassword = 'NewPassword123!';
      const changePasswordResponse = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${loginToken}`)
        .send({
          currentPassword: validUserData.password,
          newPassword
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // 6. 새 비밀번호로 로그인 확인
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: validUserData.username,
          password: newPassword
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);

      // 7. 로그아웃
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newLoginResponse.body.data.token}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // 8. 실제 DB에서 최종 상태 확인
      const prisma = TestDatabase.getPrisma();
      const finalUser = await prisma.user.findUnique({
        where: { username: validUserData.username }
      });
      expect(finalUser).toBeDefined();
      expect(finalUser).not.toBeNull();

      if (finalUser) {
        expect(finalUser.name).toBe('Updated Name');

        // 새 비밀번호로 실제 인증 확인
        const bcrypt = require('bcryptjs');
        const isNewPasswordValid = await bcrypt.compare(newPassword, finalUser.password);
        expect(isNewPasswordValid).toBe(true);
      }
    });
  });

  describe('Database Integration', () => {
    it('사용자 생성 시 관련 데이터베이스 제약 조건이 작동해야 한다', async () => {
      // 첫 번째 사용자 생성
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // 동일한 사용자명으로 다시 생성 시도 (unique 제약 조건)
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      // DB에 하나의 사용자만 있는지 확인
      const prisma = TestDatabase.getPrisma();
      const userCount = await prisma.user.count();
      expect(userCount).toBe(1);
    });

    it('계정 삭제 시 관련 데이터도 함께 삭제되어야 한다 (CASCADE)', async () => {
      // 사용자 생성
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.username, user.name);

      // 프로젝트와 스케줄 생성 (관계 기반으로 생성)
      const prisma = TestDatabase.getPrisma();

      // 프로젝트 생성
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          color: '#FFFFFF', // Add a valid color value
          user: {
            connect: { id: user.id }
          }
        }
      });

      // 스케줄 생성
      const schedule = await prisma.schedule.create({
        data: {
          title: 'Test Schedule',
          startTime: new Date(), // Replace with a valid property from ScheduleCreateInput
          endTime: new Date(), // 1시간 후
          date: new Date(), // Add a valid date property
          status: Status.completed, // Add a valid status property
          priority: Priority.high, // Add a valid priority property
          user: {
            connect: { id: user.id }
          },
          project: {
            connect: { id: project.id }
          }
        }
      });

      const deleteResponse = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'TestPassword123!' });

      expect(deleteResponse.status).toBe(200);

      // 사용자와 관련 데이터가 모두 삭제되었는지 확인
      const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
      const deletedProjects = await prisma.project.findMany({ where: { userId: user.id } });
      const deletedSchedules = await prisma.schedule.findMany({ where: { userId: user.id } });

      expect(deletedUser).toBeNull();
      expect(deletedProjects).toHaveLength(0);
      expect(deletedSchedules).toHaveLength(0);
    });
  });
});
