import ScheduleModel, { ScheduleCreateInput, ScheduleUpdateInput } from '../../src/models/Schedule';
import { TestDatabase } from '../helpers/database';
import { validScheduleData } from '../fixtures/data';
import { Status, Priority, Schedule } from '@prisma/client';

// 실제 데이터베이스를 사용하는 모델 테스트이므로 모킹 제거
// jest.mock('../../src/config/prisma', () => require('../__mocks__/prismaMocks'));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));

describe('ScheduleModel', () => {
  let testUserId: string;
  let testProjectId: string;
  let testProject2Id: string;

  // scheduleCreateData를 beforeAll 후에 생성하도록 변경
  let scheduleCreateData: ScheduleCreateInput;

  beforeAll(async () => {
    await TestDatabase.setup();
    
    // 테스트용 사용자 생성
    const testUser = await TestDatabase.createTestUser({
      id: 'test-user-id',
      username: 'testuser',
      password: 'hashedpassword',
      name: 'Test User'
    });
    testUserId = testUser.id;

    // 테스트용 프로젝트들 생성
    const testProject = await TestDatabase.createTestProject({
      id: 'test-project-id',
      name: 'Test Project',
      description: 'Test Project Description',
      color: '#FF0000',
      userId: testUserId
    });
    testProjectId = testProject.id;

    const testProject2 = await TestDatabase.createTestProject({
      id: 'test-project-2',
      name: 'Test Project 2',
      description: 'Test Project 2 Description', 
      color: '#00FF00',
      userId: testUserId
    });
    testProject2Id = testProject2.id;

    // scheduleCreateData 초기화
    scheduleCreateData = {
      title: 'Test Schedule',
      description: 'Test Description',
      startDate: new Date('2024-01-01T09:00:00Z'),
      endDate: new Date('2024-01-01T17:00:00Z'),
      status: Status.PENDING,
      priority: Priority.MEDIUM,
      projectId: testProjectId,
      userId: testUserId
    };
  });

  beforeEach(async () => {
    // 스케줄만 정리 (사용자와 프로젝트는 유지)
    const prisma = TestDatabase.getPrisma();
    await prisma.schedule.deleteMany();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('create', () => {
    it('새 일정을 성공적으로 생성해야 한다', async () => {
      const schedule = await ScheduleModel.create(scheduleCreateData);

      expect(schedule).toBeDefined();
      expect(schedule.id).toBeDefined();
      expect(schedule.title).toBe(scheduleCreateData.title);
      expect(schedule.description).toBe(scheduleCreateData.description);
      expect(schedule.startDate).toEqual(scheduleCreateData.startDate);
      expect(schedule.endDate).toEqual(scheduleCreateData.endDate);
      expect(schedule.status).toBe(scheduleCreateData.status);
      expect(schedule.priority).toBe(scheduleCreateData.priority);
      expect(schedule.projectId).toBe(scheduleCreateData.projectId);
      expect(schedule.userId).toBe(scheduleCreateData.userId);
      expect(schedule.createdAt).toBeDefined();
      expect(schedule.updatedAt).toBeDefined();
    });

    it('필수 필드만으로 일정을 생성해야 한다', async () => {
      const minimalScheduleData: ScheduleCreateInput = {
        title: 'Minimal Schedule',
        description: null,
        startDate: new Date('2024-01-01T09:00:00Z'),
        endDate: new Date('2024-01-01T17:00:00Z'),
        status: Status.PENDING,
        priority: Priority.LOW,
        projectId: testProjectId,
        userId: testUserId
      };

      const schedule = await ScheduleModel.create(minimalScheduleData);

      expect(schedule).toBeDefined();
      expect(schedule.title).toBe(minimalScheduleData.title);
      expect(schedule.description).toBeNull();
    });

    it('다양한 상태와 우선순위로 일정을 생성해야 한다', async () => {
      const statuses = [Status.PENDING, Status.IN_PROGRESS, Status.COMPLETED];
      const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];

      for (const status of statuses) {
        for (const priority of priorities) {
          const schedule = await ScheduleModel.create({
            ...scheduleCreateData,
            title: `Schedule ${status} ${priority}`,
            status,
            priority
          });

          expect(schedule.status).toBe(status);
          expect(schedule.priority).toBe(priority);
        }
      }
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // 테스트 데이터 생성
      await ScheduleModel.create({
        ...scheduleCreateData,
        title: 'Schedule 1',
        startDate: new Date('2024-01-01T09:00:00Z'),
        status: Status.PENDING,
        priority: Priority.HIGH,
        projectId: testProjectId
      });

      await ScheduleModel.create({
        ...scheduleCreateData,
        title: 'Schedule 2',
        startDate: new Date('2024-01-02T10:00:00Z'),
        status: Status.COMPLETED,
        priority: Priority.LOW,
        projectId: testProject2Id
      });

      await ScheduleModel.create({
        ...scheduleCreateData,
        title: 'Schedule 3',
        startDate: new Date('2024-01-01T14:00:00Z'),
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        userId: testUserId // 다른 사용자 대신 같은 사용자 사용
      });
    });

    it('모든 일정을 날짜와 시간 순으로 반환해야 한다', async () => {
      const schedules = await ScheduleModel.findAll();

      expect(schedules).toHaveLength(3);
      
      // 날짜 순으로 정렬되어 있는지 확인
      expect(schedules[0].startDate.getTime()).toBeLessThanOrEqual(schedules[1].startDate.getTime());
      expect(schedules[1].startDate.getTime()).toBeLessThanOrEqual(schedules[2].startDate.getTime());
      
      // 같은 날짜인 경우 시간 순으로 정렬되어 있는지 확인
      const sameDateSchedules = schedules.filter(s => 
        s.startDate.toDateString() === new Date('2024-01-01').toDateString()
      );
      if (sameDateSchedules.length > 1) {
        expect(sameDateSchedules[0].startDate.getTime()).toBeLessThanOrEqual(sameDateSchedules[1].startDate.getTime());
      }
    });

    it('userId 필터로 특정 사용자의 일정만 반환해야 한다', async () => {
      const schedules = await ScheduleModel.findAll({ userId: testUserId });

      expect(schedules).toHaveLength(3); // 모두 같은 사용자이므로
      schedules.forEach(schedule => {
        expect(schedule.userId).toBe(testUserId);
      });
    });

    it('특정 날짜의 일정만 반환해야 한다', async () => {
      const targetDate = new Date('2024-01-01');
      const schedules = await ScheduleModel.findAll({ startDate: targetDate });

      expect(schedules).toHaveLength(2);
      schedules.forEach(schedule => {
        expect(schedule.startDate.toDateString()).toBe(targetDate.toDateString());
      });
    });

    it('상태로 일정을 필터링해야 한다', async () => {
      const schedules = await ScheduleModel.findAll({ status: Status.PENDING });

      expect(schedules).toHaveLength(1);
      expect(schedules[0].status).toBe(Status.PENDING);
    });

    it('우선순위로 일정을 필터링해야 한다', async () => {
      const schedules = await ScheduleModel.findAll({ priority: Priority.HIGH });

      expect(schedules).toHaveLength(1);
      expect(schedules[0].priority).toBe(Priority.HIGH);
    });

    it('빈 배열을 반환해야 한다 (조건에 맞는 일정이 없는 경우)', async () => {
      const schedules = await ScheduleModel.findAll({ priority: Priority.MEDIUM, status: Status.COMPLETED });
      expect(schedules).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('존재하는 일정 ID로 조회 시 일정 정보를 반환해야 한다', async () => {
      const createdSchedule = await ScheduleModel.create(scheduleCreateData);
      const foundSchedule = await ScheduleModel.findById(createdSchedule.id);

      expect(foundSchedule).toBeDefined();
      expect(foundSchedule!.id).toBe(createdSchedule.id);
      expect(foundSchedule!.title).toBe(createdSchedule.title);
      expect(foundSchedule!.description).toBe(createdSchedule.description);
      expect(foundSchedule!.startDate?.getTime()).toBe(createdSchedule.startDate?.getTime());
      expect(foundSchedule!.endDate?.getTime()).toBe(createdSchedule.endDate?.getTime());
      expect(foundSchedule!.status).toBe(createdSchedule.status);
      expect(foundSchedule!.priority).toBe(createdSchedule.priority);
    });

    it('존재하지 않는 일정 ID로 조회 시 null을 반환해야 한다', async () => {
      const foundSchedule = await ScheduleModel.findById('non-existent-id');
      expect(foundSchedule).toBeNull();
    });
  });

  describe('update', () => {
    it('일정 정보를 성공적으로 업데이트해야 한다', async () => {
      const createdSchedule = await ScheduleModel.create(scheduleCreateData);
      
      const updateData: ScheduleUpdateInput = {
        title: 'Updated Schedule',
        description: 'Updated Description',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T18:00:00Z'),
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH
      };

      const updatedSchedule = await ScheduleModel.update(createdSchedule.id, updateData);

      expect(updatedSchedule).toBeDefined();
      expect(updatedSchedule!.id).toBe(createdSchedule.id);
      expect(updatedSchedule!.title).toBe(updateData.title);
      expect(updatedSchedule!.description).toBe(updateData.description);
      expect(updatedSchedule!.startDate?.getTime()).toBe(updateData.startDate?.getTime());
      expect(updatedSchedule!.endDate?.getTime()).toBe(updateData.endDate?.getTime());
      expect(updatedSchedule!.status).toBe(updateData.status);
      expect(updatedSchedule!.priority).toBe(updateData.priority);
    });

    it('존재하지 않는 일정 ID로 업데이트 시 null을 반환해야 한다', async () => {
      const updateData: ScheduleUpdateInput = {
        title: 'Updated Schedule'
      };

      const result = await ScheduleModel.update('non-existent-id', updateData);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('일정을 성공적으로 삭제해야 한다', async () => {
      const createdSchedule = await ScheduleModel.create(scheduleCreateData);

      const result = await ScheduleModel.delete(createdSchedule.id);
      expect(result).toBe(true);

      // 삭제 확인
      const foundSchedule = await ScheduleModel.findById(createdSchedule.id);
      expect(foundSchedule).toBeNull();
    });

    it('존재하지 않는 일정 ID로 삭제 시 false를 반환해야 한다', async () => {
      const result = await ScheduleModel.delete('non-existent-id');
      expect(result).toBe(false);
    });
  });
});
