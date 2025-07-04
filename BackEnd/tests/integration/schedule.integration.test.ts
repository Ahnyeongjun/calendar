import request, { Response, Test } from 'supertest';
import express from 'express';
import { TestDatabase } from '../helpers/database';
import {
  createTestUser,
  createTestProject,
  generateTestToken,
  cleanupTestData
} from '../helpers/testUtils';
import { Status, Priority } from '@prisma/client';
import scheduleRoutes from '../../src/routes/scheduleRoutes';
import { authMiddleware } from '../../src/middleware/auth';

describe('Schedule Integration Tests', () => {
  let app: express.Application;
  let testUserId: string;
  let testProjectId: string;
  let authToken: string;

  beforeAll(async () => {
    // Express 앱 설정
    app = express();
    app.use(express.json());
    app.use('/api/schedules', authMiddleware, scheduleRoutes);

    // 에러 핸들러
    const { errorHandler } = require('../../src/middleware/errorHandler');
    app.use(errorHandler);

    // 데이터베이스 설정
    await TestDatabase.setup();
  });

  beforeEach(async () => {
    // 테스트 데이터 정리
    await cleanupTestData();

    // 테스트 사용자 생성
    const testUser = await createTestUser({
      username: 'scheduletest',
      name: 'Schedule Test User'
    });
    testUserId = testUser.id;

    // 테스트 프로젝트 생성
    const testProject = await createTestProject(testUserId, {
      name: 'Test Project for Schedule',
      description: 'Test project description'
    });
    testProjectId = testProject.id;

    // 인증 토큰 생성
    authToken = generateTestToken(testUserId, 'scheduletest', 'Schedule Test User');
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('POST /api/schedules', () => {
    it('새로운 일정을 생성할 수 있어야 한다', async () => {
      const scheduleData = {
        title: 'Test Schedule',
        description: 'Test schedule description',
        startDate: '2024-01-01T09:00:00.000Z',
        endDate: '2024-01-01T17:00:00.000Z',
        status: Status.PENDING,
        priority: Priority.MEDIUM,
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.schedule).toBeDefined();
      expect(response.body.schedule.title).toBe(scheduleData.title);
      expect(response.body.schedule.description).toBe(scheduleData.description);
      expect(response.body.schedule.status).toBe(scheduleData.status);
      expect(response.body.schedule.priority).toBe(scheduleData.priority);
      expect(response.body.schedule.projectId).toBe(testProjectId);
      expect(response.body.schedule.userId).toBe(testUserId);
    });

    it('필수 필드가 없으면 400 에러를 반환해야 한다', async () => {
      const invalidData = {
        description: 'Missing title and dates'
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('잘못된 날짜 형식에 대해 400 에러를 반환해야 한다', async () => {
      const invalidDateData = {
        title: 'Test Schedule',
        startDate: 'invalid-date',
        endDate: '2024-01-01T17:00:00.000Z',
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('존재하지 않는 프로젝트 ID로 생성하면 400 에러를 반환해야 한다', async () => {
      const invalidProjectData = {
        title: 'Test Schedule',
        startDate: '2024-01-01T09:00:00.000Z',
        endDate: '2024-01-01T17:00:00.000Z',
        projectId: 'non-existent-project-id'
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProjectData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('인증 없이 요청하면 401 에러를 반환해야 한다', async () => {
      const scheduleData = {
        title: 'Test Schedule',
        startDate: '2024-01-01T09:00:00.000Z',
        endDate: '2024-01-01T17:00:00.000Z',
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .send(scheduleData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/schedules', () => {
    beforeEach(async () => {
      // 테스트용 일정들 생성
      const schedules = [
        {
          title: 'Morning Meeting',
          description: 'Daily standup',
          startDate: new Date('2024-01-01T09:00:00.000Z'),
          endDate: new Date('2024-01-01T10:00:00.000Z'),
          status: Status.PENDING,
          priority: Priority.HIGH,
          projectId: testProjectId,
          userId: testUserId
        },
        {
          title: 'Lunch Break',
          description: 'Break time',
          startDate: new Date('2024-01-01T12:00:00.000Z'),
          endDate: new Date('2024-01-01T13:00:00.000Z'),
          status: Status.COMPLETED,
          priority: Priority.LOW,
          projectId: testProjectId,
          userId: testUserId
        },
        {
          title: 'Afternoon Work',
          description: 'Development tasks',
          startDate: new Date('2024-01-02T14:00:00.000Z'),
          endDate: new Date('2024-01-02T18:00:00.000Z'),
          status: Status.IN_PROGRESS,
          priority: Priority.MEDIUM,
          projectId: testProjectId,
          userId: testUserId
        }
      ];

      const prisma = TestDatabase.getPrisma();
      for (const schedule of schedules) {
        await prisma.schedule.create({ data: schedule });
      }
    });

    it('모든 일정을 조회할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .get('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedules).toBeDefined();
      expect(response.body.schedules).toHaveLength(3);
    });

    it('상태별로 필터링할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .get(`/api/schedules?status=${Status.PENDING}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedules).toHaveLength(1);
      expect(response.body.schedules[0].status).toBe(Status.PENDING);
    });

    it('우선순위별로 필터링할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .get(`/api/schedules?priority=${Priority.HIGH}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedules).toHaveLength(1);
      expect(response.body.schedules[0].priority).toBe(Priority.HIGH);
    });

    it('날짜 범위로 필터링할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .get('/api/schedules?startDate=2024-01-01&endDate=2024-01-01')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedules).toHaveLength(2);
    });

    it('프로젝트별로 필터링할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .get(`/api/schedules?projectId=${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedules).toHaveLength(3);
    });
  });

  describe('GET /api/schedules/:id', () => {
    let scheduleId: string;

    beforeEach(async () => {
      const prisma = TestDatabase.getPrisma();
      const schedule = await prisma.schedule.create({
        data: {
          title: 'Test Schedule',
          description: 'Test description',
          startDate: new Date('2024-01-01T09:00:00.000Z'),
          endDate: new Date('2024-01-01T17:00:00.000Z'),
          status: Status.PENDING,
          priority: Priority.MEDIUM,
          projectId: testProjectId,
          userId: testUserId
        }
      });
      scheduleId = schedule.id;
    });

    it('특정 일정을 조회할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .get(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedule).toBeDefined();
      expect(response.body.schedule.id).toBe(scheduleId);
      expect(response.body.schedule.title).toBe('Test Schedule');
    });

    it('존재하지 않는 일정 조회시 404 에러를 반환해야 한다', async () => {
      const response: Response = await request(app)
        .get('/api/schedules/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/schedules/:id', () => {
    let scheduleId: string;

    beforeEach(async () => {
      const prisma = TestDatabase.getPrisma();
      const schedule = await prisma.schedule.create({
        data: {
          title: 'Original Title',
          description: 'Original description',
          startDate: new Date('2024-01-01T09:00:00.000Z'),
          endDate: new Date('2024-01-01T17:00:00.000Z'),
          status: Status.PENDING,
          priority: Priority.MEDIUM,
          projectId: testProjectId,
          userId: testUserId
        }
      });
      scheduleId = schedule.id;
    });

    it('일정을 업데이트할 수 있어야 한다', async () => {
      const updateData = {
        title: 'Updated Title',
        status: Status.COMPLETED,
        priority: Priority.HIGH
      };

      const response: Response = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.schedule.title).toBe(updateData.title);
      expect(response.body.schedule.status).toBe(updateData.status);
      expect(response.body.schedule.priority).toBe(updateData.priority);
      expect(response.body.schedule.description).toBe('Original description'); // 변경되지 않음
    });

    it('존재하지 않는 일정 업데이트시 404 에러를 반환해야 한다', async () => {
      const updateData = { title: 'Updated Title' };

      const response: Response = await request(app)
        .put('/api/schedules/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('다른 사용자의 일정은 업데이트할 수 없어야 한다', async () => {
      // 다른 사용자 생성
      const otherUser = await createTestUser({
        username: 'otheruser',
        name: 'Other User'
      });
      const otherToken = generateTestToken(otherUser.id, 'otheruser', 'Other User');

      const updateData = { title: 'Unauthorized Update' };

      const response: Response = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    let scheduleId: string;

    beforeEach(async () => {
      const prisma = TestDatabase.getPrisma();
      const schedule = await prisma.schedule.create({
        data: {
          title: 'Schedule to Delete',
          description: 'Will be deleted',
          startDate: new Date('2024-01-01T09:00:00.000Z'),
          endDate: new Date('2024-01-01T17:00:00.000Z'),
          status: Status.PENDING,
          priority: Priority.MEDIUM,
          projectId: testProjectId,
          userId: testUserId
        }
      });
      scheduleId = schedule.id;
    });

    it('일정을 삭제할 수 있어야 한다', async () => {
      const response: Response = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      // 삭제 확인
      const getResponse: Response = await request(app)
        .get(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('존재하지 않는 일정 삭제시 404 에러를 반환해야 한다', async () => {
      const response: Response = await request(app)
        .delete('/api/schedules/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('다른 사용자의 일정은 삭제할 수 없어야 한다', async () => {
      // 다른 사용자 생성
      const otherUser = await createTestUser({
        username: 'otheruser2',
        name: 'Other User 2'
      });
      const otherToken = generateTestToken(otherUser.id, 'otheruser2', 'Other User 2');

      const response: Response = await request(app)
        .delete(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('매우 긴 제목과 설명을 처리할 수 있어야 한다', async () => {
      const longContentData = {
        title: 'A'.repeat(255),
        description: 'B'.repeat(1000),
        startDate: '2024-01-01T09:00:00.000Z',
        endDate: '2024-01-01T17:00:00.000Z',
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(longContentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.schedule.title).toBe(longContentData.title);
      expect(response.body.schedule.description).toBe(longContentData.description);
    });

    it('빈 설명(null)을 처리할 수 있어야 한다', async () => {
      const nullDescriptionData = {
        title: 'No Description Schedule',
        description: null,
        startDate: '2024-01-01T09:00:00.000Z',
        endDate: '2024-01-01T17:00:00.000Z',
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nullDescriptionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.schedule.description).toBeNull();
    });

    it('과거 날짜로 일정을 생성할 수 있어야 한다', async () => {
      const pastData = {
        title: 'Past Schedule',
        startDate: '2020-01-01T09:00:00.000Z',
        endDate: '2020-01-01T17:00:00.000Z',
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pastData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('먼 미래 날짜로 일정을 생성할 수 있어야 한다', async () => {
      const futureData = {
        title: 'Future Schedule',
        startDate: '2030-12-31T09:00:00.000Z',
        endDate: '2030-12-31T17:00:00.000Z',
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(futureData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('시작 시간이 종료 시간보다 늦으면 400 에러를 반환해야 한다', async () => {
      const invalidTimeData = {
        title: 'Invalid Time Schedule',
        startDate: '2024-01-01T17:00:00.000Z',
        endDate: '2024-01-01T09:00:00.000Z', // 시작보다 빠른 종료 시간
        projectId: testProjectId
      };

      const response: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTimeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Concurrent Operations', () => {
    it('동시에 여러 일정을 생성할 수 있어야 한다', async () => {
      const createSchedule = async (index: number): Promise<Response> => {
        const scheduleData = {
          title: `Concurrent Schedule ${index + 1}`,
          description: `Description ${index + 1}`,
          startDate: `2024-01-0${index + 1}T09:00:00.000Z`,
          endDate: `2024-01-0${index + 1}T17:00:00.000Z`,
          status: Status.PENDING,
          priority: Priority.MEDIUM,
          projectId: testProjectId
        };

        return await request(app)
          .post('/api/schedules')
          .set('Authorization', `Bearer ${authToken}`)
          .send(scheduleData);
      };

      const promises = Array.from({ length: 5 }, (_, i) => createSchedule(i));
      const results: Response[] = await Promise.all(promises);

      results.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.schedule.title).toBe(`Concurrent Schedule ${index + 1}`);
      });
    });
  });

  describe('Data Consistency', () => {
    it('생성된 일정의 모든 필드가 정확히 저장되어야 한다', async () => {
      const scheduleData = {
        title: 'Consistency Test',
        description: 'Detailed description for testing',
        startDate: '2024-01-01T09:30:00.000Z',
        endDate: '2024-01-01T17:45:00.000Z',
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH,
        projectId: testProjectId
      };

      const createResponse: Response = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scheduleData);

      expect(createResponse.status).toBe(201);
      const scheduleId = createResponse.body.schedule.id;

      // 개별 조회로 확인
      const getResponse: Response = await request(app)
        .get(`/api/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      const schedule = getResponse.body.schedule;
      expect(schedule.title).toBe(scheduleData.title);
      expect(schedule.description).toBe(scheduleData.description);
      expect(schedule.status).toBe(scheduleData.status);
      expect(schedule.priority).toBe(scheduleData.priority);
      expect(schedule.projectId).toBe(testProjectId);
      expect(schedule.userId).toBe(testUserId);

      // 날짜는 ISO 문자열로 비교
      expect(new Date(schedule.startDate).toISOString()).toBe(scheduleData.startDate);
      expect(new Date(schedule.endDate).toISOString()).toBe(scheduleData.endDate);
    });
  });
});
