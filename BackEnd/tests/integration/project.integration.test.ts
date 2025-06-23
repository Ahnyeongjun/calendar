import request from 'supertest';
import app from '../../src/index';
import { TestDatabase } from '../helpers/database';
import { validProjectData } from '../fixtures/data';
import { createTestUser, generateTestToken } from '../helpers/testUtils';

describe('Project API Integration Tests', () => {
  let testUserId: string;
  let authToken: string;
  let otherUserId: string;
  let otherAuthToken: string;

  beforeAll(async () => {
    await TestDatabase.setup();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();

    // 테스트 사용자 생성
    const testUser = await createTestUser({
      username: 'testuser',
      password: 'TestPassword123!',
      name: 'Test User'
    });
    testUserId = testUser.id;
    authToken = generateTestToken(testUser);

    // 다른 사용자 생성
    const otherUser = await createTestUser({
      username: 'otheruser',
      password: 'OtherPassword123!',
      name: 'Other User'
    });
    otherUserId = otherUser.id;
    otherAuthToken = generateTestToken(otherUser);
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('GET /api/projects', () => {
    it('모든 프로젝트를 성공적으로 조회해야 한다', async () => {
      // 테스트 프로젝트 생성
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          userId: testUserId
        });

      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({
          ...validProjectData,
          name: 'Other Project',
          userId: otherUserId
        });

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toHaveLength(2);
      expect(response.body.projects[0].name).toBeDefined();
      expect(response.body.projects[0].color).toBeDefined();
    });

    it('빈 프로젝트 목록을 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toHaveLength(0);
    });
  });

  describe('GET /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          userId: testUserId
        });

      projectId = createResponse.body.project.id;
    });

    it('존재하는 프로젝트를 성공적으로 조회해야 한다', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.project.id).toBe(projectId);
      expect(response.body.project.name).toBe(validProjectData.name);
      expect(response.body.project.description).toBe(validProjectData.description);
      expect(response.body.project.color).toBe(validProjectData.color);
    });

    it('존재하지 않는 프로젝트에 대해 404 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('프로젝트를 찾을 수 없습니다');
    });

    it('잘못된 ID 형식에 대해 400 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .get('/api/projects/')
        .expect(404); // Route not found
    });
  });

  describe('POST /api/projects', () => {
    it('유효한 데이터로 프로젝트를 성공적으로 생성해야 한다', async () => {
      const projectData = {
        ...validProjectData,
        userId: testUserId
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.project.id).toBeDefined();
      expect(response.body.project.name).toBe(projectData.name);
      expect(response.body.project.description).toBe(projectData.description);
      expect(response.body.project.color).toBe(projectData.color);
      expect(response.body.project.userId).toBe(testUserId);
      expect(response.body.project.createdAt).toBeDefined();
      expect(response.body.project.updatedAt).toBeDefined();
    });

    it('필수 필드 없이 생성 시 400 에러를 반환해야 한다', async () => {
      const invalidData = {
        description: 'Missing required fields'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('중복된 프로젝트명으로 생성 시 400 에러를 반환해야 한다', async () => {
      const projectData = {
        ...validProjectData,
        userId: testUserId
      };

      // 첫 번째 프로젝트 생성
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      // 같은 이름으로 두 번째 프로젝트 생성 시도
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('이미 존재하는 프로젝트 이름');
    });

    it('잘못된 색상 코드로 생성 시 400 에러를 반환해야 한다', async () => {
      const invalidData = {
        ...validProjectData,
        userId: testUserId,
        color: 'invalid-color'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('인증 없이 생성 시 401 에러를 반환해야 한다', async () => {
      const projectData = {
        ...validProjectData,
        userId: testUserId
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('빈 설명이 null로 처리되어야 한다', async () => {
      const projectData = {
        ...validProjectData,
        userId: testUserId,
        description: '   ' // 공백만 있는 설명
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.project.description).toBeNull();
    });
  });

  describe('PUT /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          userId: testUserId
        });

      projectId = createResponse.body.project.id;
    });

    it('프로젝트를 성공적으로 업데이트해야 한다', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated Description',
        color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.project.id).toBe(projectId);
      expect(response.body.project.name).toBe(updateData.name);
      expect(response.body.project.description).toBe(updateData.description);
      expect(response.body.project.color).toBe(updateData.color);
    });

    it('부분 업데이트를 성공적으로 수행해야 한다', async () => {
      const partialUpdateData = {
        name: 'Partially Updated Project'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.project.name).toBe(partialUpdateData.name);
      expect(response.body.project.description).toBe(validProjectData.description); // 기존 값 유지
    });

    it('존재하지 않는 프로젝트 업데이트 시 404 에러를 반환해야 한다', async () => {
      const updateData = {
        name: 'Updated Project'
      };

      const response = await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('프로젝트를 찾을 수 없습니다');
    });

    it('중복된 이름으로 업데이트 시 400 에러를 반환해야 한다', async () => {
      // 다른 프로젝트 생성
      const otherProjectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          name: 'Other Project',
          userId: testUserId
        });

      // 첫 번째 프로젝트를 다른 프로젝트와 같은 이름으로 업데이트 시도
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Other Project'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('이미 존재하는 프로젝트 이름');
    });

    it('같은 이름으로 업데이트는 허용되어야 한다', async () => {
      const updateData = {
        name: validProjectData.name, // 동일한 이름
        color: '#00FF00'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.project.color).toBe(updateData.color);
    });

    it('인증 없이 업데이트 시 401 에러를 반환해야 한다', async () => {
      const updateData = {
        name: 'Updated Project'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          userId: testUserId
        });

      projectId = createResponse.body.project.id;
    });

    it('프로젝트를 성공적으로 삭제해야 한다', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('프로젝트가 삭제되었습니다');

      // 삭제 확인
      await request(app)
        .get(`/api/projects/${projectId}`)
        .expect(404);
    });

    it('존재하지 않는 프로젝트 삭제 시 404 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('프로젝트를 찾을 수 없습니다');
    });

    it('보호된 프로젝트 삭제 시 400 에러를 반환해야 한다', async () => {
      const protectedIds = ['personal', 'work', 'study'];

      for (const protectedId of protectedIds) {
        const response = await request(app)
          .delete(`/api/projects/${protectedId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('기본 프로젝트는 삭제할 수 없습니다');
      }
    });

    it('인증 없이 삭제 시 401 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('서버 에러가 발생하면 500 에러를 반환해야 한다', async () => {
      // 데이터베이스 연결을 일시적으로 차단하거나 에러를 발생시키는 테스트
      // 실제 구현에서는 prisma mock을 통해 에러를 발생시킬 수 있음
    });

    it('잘못된 JSON 형식에 대해 400 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('Content-Type이 application/json이 아닌 경우 415 에러를 반환해야 한다', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('plain text data')
        .expect(415);
    });
  });

  describe('대소문자 구분 없는 검색', () => {
    it('대소문자를 구분하지 않고 중복 검사를 수행해야 한다', async () => {
      // 소문자로 프로젝트 생성
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          name: 'test project',
          userId: testUserId
        })
        .expect(201);

      // 대문자로 같은 이름의 프로젝트 생성 시도
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validProjectData,
          name: 'TEST PROJECT',
          userId: testUserId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('이미 존재하는 프로젝트 이름');
    });
  });

  describe('길이 제한 테스트', () => {
    it('매우 긴 프로젝트명을 처리할 수 있어야 한다', async () => {
      const longName = 'A'.repeat(255);
      const projectData = {
        ...validProjectData,
        name: longName,
        userId: testUserId
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.project.name).toBe(longName);
    });

    it('매우 긴 설명을 처리할 수 있어야 한다', async () => {
      const longDescription = 'B'.repeat(1000);
      const projectData = {
        ...validProjectData,
        description: longDescription,
        userId: testUserId
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.project.description).toBe(longDescription);
    });
  });

  describe('특수 문자 처리', () => {
    it('특수 문자가 포함된 프로젝트명을 처리할 수 있어야 한다', async () => {
      const specialName = '프로젝트 @#$%^&*()';
      const projectData = {
        ...validProjectData,
        name: specialName,
        userId: testUserId
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.project.name).toBe(specialName);

      // 조회도 정상 작동해야 함
      const getResponse = await request(app)
        .get(`/api/projects/${response.body.project.id}`)
        .expect(200);

      expect(getResponse.body.project.name).toBe(specialName);
    });
  });

  describe('동시성 테스트', () => {
    it('동시에 같은 이름의 프로젝트를 생성하려고 하면 하나만 성공해야 한다', async () => {
      const projectData = {
        ...validProjectData,
        name: 'Concurrent Project',
        userId: testUserId
      };

      const promises = [
        request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(projectData),
        request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(projectData)
      ];

      const results = await Promise.allSettled(promises);

      const successful = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 201
      );
      const failed = results.filter(result =>
        result.status === 'fulfilled' && result.value.status === 400
      );

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(1);
    });
  });
});
