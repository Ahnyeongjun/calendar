import ScheduleModel, { ScheduleCreateInput, ScheduleUpdateInput } from '../../src/models/Schedule';
import { TestDatabase } from '../helpers/database';
import { validScheduleData } from '../fixtures/data';
import { Status, Priority, Schedule } from '@prisma/client';

jest.mock('../../src/config/prisma', () => require('../__mocks__/prismaMocks'));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));

describe('ScheduleModel', () => {
  let prisma: any;

  const scheduleCreateData: ScheduleCreateInput = {
    title: 'Test Schedule',
    description: 'Test Description',
    date: new Date('2024-01-01'),
    startTime: new Date('2024-01-01T09:00:00Z'),
    endTime: new Date('2024-01-01T17:00:00Z'),
    status: Status.planned,
    priority: Priority.medium,
    projectId: 'project-id',
    userId: 'user-id'
  };

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
    it('새 일정을 성공적으로 생성해야 한다', async () => {
      const schedule = await ScheduleModel.create(scheduleCreateData);

      expect(schedule).toBeDefined();
      expect(schedule.id).toBeDefined();
      expect(schedule.title).toBe(scheduleCreateData.title);
      expect(schedule.description).toBe(scheduleCreateData.description);
      expect(schedule.date).toEqual(scheduleCreateData.date);
      expect(schedule.startTime).toEqual(scheduleCreateData.startTime);
      expect(schedule.endTime).toEqual(scheduleCreateData.endTime);
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
        date: new Date('2024-01-01'),
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T17:00:00Z'),
        status: Status.planned,
        priority: Priority.low,
        projectId: 'project-id',
        userId: 'user-id'
      };

      const schedule = await ScheduleModel.create(minimalScheduleData);

      expect(schedule).toBeDefined();
      expect(schedule.title).toBe(minimalScheduleData.title);
      expect(schedule.description).toBeNull();
    });

    it('다양한 상태와 우선순위로 일정을 생성해야 한다', async () => {
      const statuses = [Status.planned, Status.in_progress, Status.completed];
      const priorities = [Priority.low, Priority.medium, Priority.high];

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
        date: new Date('2024-01-01'),
        startTime: new Date('2024-01-01T09:00:00Z'),
        status: Status.planned,
        priority: Priority.high,
        projectId: 'project-1'
      });

      await ScheduleModel.create({
        ...scheduleCreateData,
        title: 'Schedule 2',
        date: new Date('2024-01-02'),
        startTime: new Date('2024-01-02T10:00:00Z'),
        status: Status.completed,
        priority: Priority.low,
        projectId: 'project-2'
      });

      await ScheduleModel.create({
        ...scheduleCreateData,
        title: 'Schedule 3',
        date: new Date('2024-01-01'),
        startTime: new Date('2024-01-01T14:00:00Z'),
        status: Status.in_progress,
        priority: Priority.medium,
        userId: 'other-user-id'
      });
    });

    it('모든 일정을 날짜와 시간 순으로 반환해야 한다', async () => {
      const schedules = await ScheduleModel.findAll();

      expect(schedules).toHaveLength(3);
      
      // 날짜 순으로 정렬되어 있는지 확인
      expect(schedules[0].date.getTime()).toBeLessThanOrEqual(schedules[1].date.getTime());
      expect(schedules[1].date.getTime()).toBeLessThanOrEqual(schedules[2].date.getTime());
      
      // 같은 날짜인 경우 시간 순으로 정렬되어 있는지 확인
      const sameDateSchedules = schedules.filter(s => s.date.getTime() === new Date('2024-01-01').getTime());
      if (sameDateSchedules.length > 1) {
        expect(sameDateSchedules[0].startTime!.getTime()).toBeLessThanOrEqual(sameDateSchedules[1].startTime!.getTime());
      }
    });

    it('userId 필터로 특정 사용자의 일정만 반환해야 한다', async () => {
      const schedules = await ScheduleModel.findAll({ userId: 'user-id' });

      expect(schedules).toHaveLength(2);
      schedules.forEach(schedule => {
        expect(schedule.userId).toBe('user-id');
      });
    });

    it('특정 날짜의 일정만 반환해야 한다', async () => {
      const targetDate = new Date('2024-01-01');
      const schedules = await ScheduleModel.findAll({ date: targetDate });

      expect(schedules).toHaveLength(2);
      schedules.forEach(schedule => {
        expect(schedule.date.getTime()).toBe(targetDate.getTime());
      });
    });

    it('상태로 일정을 필터링해야 한다', async () => {
      const schedules = await ScheduleModel.findAll({ status: Status.planned });

      expect(schedules).toHaveLength(1);
      expect(schedules[0].status).toBe(Status.planned);
    });

    it('우선순위로 일정을 필터링해야 한다', async () => {
      const schedules = await ScheduleModel.findAll({ priority: Priority.high });

      expect(schedules).toHaveLength(1);
      expect(schedules[0].priority).toBe(Priority.high);
    });

    it('빈 배열을 반환해야 한다 (조건에 맞는 일정이 없는 경우)', async () => {
      const schedules = await ScheduleModel.findAll({ priority: Priority.medium, status: Status.completed });
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
      expect(foundSchedule!.date.getTime()).toBe(createdSchedule.date.getTime());
      expect(foundSchedule!.startTime?.getTime()).toBe(createdSchedule.startTime?.getTime());
      expect(foundSchedule!.endTime?.getTime()).toBe(createdSchedule.endTime?.getTime());
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
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T18:00:00Z'),
        status: Status.in_progress,
        priority: Priority.high
      };

      const updatedSchedule = await ScheduleModel.update(createdSchedule.id, updateData);

      expect(updatedSchedule).toBeDefined();
      expect(updatedSchedule!.id).toBe(createdSchedule.id);
      expect(updatedSchedule!.title).toBe(updateData.title);
      expect(updatedSchedule!.description).toBe(updateData.description);
      expect(updatedSchedule!.startTime?.getTime()).toBe(updateData.startTime?.getTime());
      expect(updatedSchedule!.endTime?.getTime()).toBe(updateData.endTime?.getTime());
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
