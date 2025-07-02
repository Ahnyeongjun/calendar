import { Request, Response, NextFunction } from 'express';
import ScheduleController from '../../src/controllers/scheduleController';
import ScheduleModel from '../../src/models/Schedule';
import ValidationService from '../../src/services/validationService';
import ScheduleTransformer from '../../src/services/dataTransformer';
import { UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from '../../src/middleware/errorHandler';
import { Status, Priority } from '@prisma/client';
import { validScheduleData } from '../fixtures/data';

// Mocks
jest.mock('../../src/models/Schedule');
jest.mock('../../src/services/validationService');
jest.mock('../../src/services/dataTransformer');
jest.mock('../../src/services/kafka.client', () => ({
  kafkaProducer: {
    publishEvent: jest.fn()
  }
}));
jest.mock('../../src/utils/converter', () => ({
  convertKafkaDate: jest.fn().mockReturnValue({
    startDate: '2024-01-01T09:00:00Z',
    endDate: '2024-01-01T17:00:00Z'
  }),
  convertScheduleDate: jest.fn().mockImplementation((schedule) => schedule),
  storeEndDateInfo: jest.fn()
}));
jest.mock('../../src/services/logger', () => require('../__mocks__/loggerMocks'));

const MockScheduleModel = ScheduleModel as jest.Mocked<typeof ScheduleModel>;
const MockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;
const MockScheduleTransformer = ScheduleTransformer as jest.Mocked<typeof ScheduleTransformer>;

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

describe('ScheduleController', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  const mockUser = {
    id: 'user-id',
    username: 'testuser',
    name: 'Test User'
  };

  const mockSchedule = {
    id: 'schedule-id',
    title: 'Test Schedule',
    description: 'Test Description',
    date: new Date('2024-01-01'),
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.IN_PROGRESS,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    req = {
      user: mockUser,
      params: {},
      body: {},
      query: {}
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

  describe('getAllSchedules', () => {
    it('인증된 사용자의 모든 일정을 성공적으로 반환해야 한다', async () => {
      const mockSchedules = [mockSchedule];

      MockScheduleModel.findAll.mockResolvedValue(mockSchedules);

      await ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next);

      expect(MockScheduleModel.findAll).toHaveBeenCalledWith({ userId: 'user-id' });
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        schedules: mockSchedules
      });
    });

    it('필터 조건과 함께 일정을 조회해야 한다', async () => {
      req.query = {
        date: '2024-01-01',
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH,
        projectId: 'project-id'
      };

      const mockSchedules = [mockSchedule];
      MockScheduleModel.findAll.mockResolvedValue(mockSchedules);

      await ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next);

      expect(MockScheduleModel.findAll).toHaveBeenCalledWith({
        userId: 'user-id',
        date: new Date('2024-01-01'),
        status: Status.IN_PROGRESS,
        priority: Priority.HIGH,
        projectId: 'project-id'
      });
    });

    it('날짜 범위 필터를 적용해야 한다', async () => {
      req.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const mockSchedules = [mockSchedule];
      MockScheduleModel.findAll.mockResolvedValue(mockSchedules);

      await ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next);

      expect(MockScheduleModel.findAll).toHaveBeenCalledWith({
        userId: 'user-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });
    });

    it('인증되지 않은 사용자에 대해 UnauthorizedError를 발생시켜야 한다', async () => {
      req.user = undefined;

      await expect(
        ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(UnauthorizedError);

      expect(MockScheduleModel.findAll).not.toHaveBeenCalled();
    });

    it('빈 일정 배열을 반환해야 한다', async () => {
      MockScheduleModel.findAll.mockResolvedValue([]);

      await ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        schedules: []
      });
    });
  });

  describe('getSchedule', () => {
    beforeEach(() => {
      req.params = { id: 'schedule-id' };
    });

    it('존재하는 일정을 성공적으로 반환해야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockScheduleModel.findById.mockResolvedValue(mockSchedule);

      await ScheduleController.getSchedule(req as Request, res as Response, next);

      expect(MockValidationService.validateId).toHaveBeenCalledWith('schedule-id');
      expect(MockScheduleModel.findById).toHaveBeenCalledWith('schedule-id');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        schedule: mockSchedule
      });
    });

    it('존재하지 않는 일정에 대해 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockScheduleModel.findById.mockResolvedValue(null);

      await expect(ScheduleController.getSchedule(req as Request, res as Response, next)).rejects.toThrow(
        NotFoundError
      );
    });

    it('잘못된 ID에 대해 ValidationError를 발생시켜야 한다', async () => {
      const validationError = new ValidationError('잘못된 ID입니다.');
      MockValidationService.validateId.mockImplementation(() => {
        throw validationError;
      });

      await expect(ScheduleController.getSchedule(req as Request, res as Response, next)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('createSchedule', () => {
    const scheduleCreateData = {
      title: 'Test Schedule',
      description: 'Test Description',
      startDate: new Date('2024-01-01T10:00:00Z'),
      endDate: new Date('2024-01-01T17:00:00Z'),
      projectId: 'project-id',
      userId: 'user-id'
    };

    it('유효한 데이터로 일정을 성공적으로 생성해야 한다', async () => {
      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateScheduleData.mockReturnValue(scheduleCreateData);
      MockScheduleTransformer.apiToCreateData.mockReturnValue({
        title: 'Test Schedule',
        description: 'Test Description',
        startDate: new Date('2024-01-01T09:00:00Z'),
        endDate: new Date('2024-01-01T17:00:00Z'),
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: 'project-id',
        userId: 'user-id'
      });
      MockScheduleTransformer.validateTimes.mockReturnValue(undefined);
      MockScheduleTransformer.validateDate.mockReturnValue(undefined);
      MockScheduleModel.create.mockResolvedValue(mockSchedule);

      req.body = validScheduleData;

      await ScheduleController.createSchedule(req as AuthenticatedRequest, res as Response, next);

      expect(MockValidationService.validateCreateScheduleData).toHaveBeenCalledWith(validScheduleData);
      expect(MockScheduleTransformer.apiToCreateData).toHaveBeenCalledWith(validScheduleData, 'user-id');
      expect(MockScheduleModel.create).toHaveBeenCalledWith({
        title: 'Test Schedule',
        description: 'Test Description',
        date: new Date('2024-01-01'),
        startDate: new Date('2024-01-01T09:00:00Z'),
        endDate: new Date('2024-01-01T17:00:00Z'),
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: 'project-id',
        userId: 'user-id'
      });

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(chainedJson).toHaveBeenCalledWith({
        success: true,
        schedule: mockSchedule
      });
    });

    it('인증되지 않은 사용자에 대해 UnauthorizedError를 발생시켜야 한다', async () => {
      req.user = undefined;

      await expect(
        ScheduleController.createSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(UnauthorizedError);

      expect(MockScheduleModel.create).not.toHaveBeenCalled();
    });

    it('ValidationService에서 에러가 발생하면 에러를 전파해야 한다', async () => {
      const validationError = new ValidationError('Validation failed');
      MockValidationService.validateCreateScheduleData.mockImplementation(() => {
        throw validationError;
      });

      req.body = { title: '' };

      await expect(
        ScheduleController.createSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(ValidationError);

      expect(MockScheduleModel.create).not.toHaveBeenCalled();
    });

    it('ScheduleTransformer에서 시간 검증 에러가 발생하면 에러를 전파해야 한다', async () => {
      const timeValidationError = new ValidationError('Invalid time range');

      MockValidationService.validateCreateScheduleData.mockReturnValue(scheduleCreateData);
      MockScheduleTransformer.apiToCreateData.mockReturnValue({
        title: 'Test Schedule',
        description: 'Test Description',
        startDate: new Date('2024-01-01T09:00:00Z'),
        endDate: new Date('2024-01-01T17:00:00Z'),
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: 'project-id',
        userId: 'user-id'
      });
      MockScheduleTransformer.validateTimes.mockImplementation(() => {
        throw timeValidationError;
      });

      req.body = validScheduleData;

      await expect(
        ScheduleController.createSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(ValidationError);

      expect(MockScheduleModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateSchedule', () => {
    beforeEach(() => {
      req.params = { id: 'schedule-id' };
    });

    const updateData = {
      title: 'Updated Schedule',
      description: 'Updated Description'
    };

    it('일정을 성공적으로 업데이트해야 한다', async () => {
      const updatedSchedule = { ...mockSchedule, ...updateData };

      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockValidationService.validateUpdateScheduleData.mockReturnValue(updateData);
      MockScheduleModel.findById.mockResolvedValue(mockSchedule);
      MockScheduleTransformer.partialApiToUpdateData.mockReturnValue(updateData);
      MockScheduleModel.update.mockResolvedValue(updatedSchedule);

      req.body = updateData;

      await ScheduleController.updateSchedule(req as AuthenticatedRequest, res as Response, next);

      expect(MockValidationService.validateId).toHaveBeenCalledWith('schedule-id');
      expect(MockValidationService.validateUpdateScheduleData).toHaveBeenCalledWith(updateData);
      expect(MockScheduleModel.findById).toHaveBeenCalledWith('schedule-id');
      expect(MockScheduleModel.update).toHaveBeenCalledWith('schedule-id', updateData);

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        schedule: updatedSchedule
      });
    });

    it('인증되지 않은 사용자에 대해 UnauthorizedError를 발생시켜야 한다', async () => {
      req.user = undefined;

      await expect(
        ScheduleController.updateSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(UnauthorizedError);

      expect(MockScheduleModel.update).not.toHaveBeenCalled();
    });

    it('존재하지 않는 일정 업데이트 시 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockValidationService.validateUpdateScheduleData.mockReturnValue(updateData);
      MockScheduleModel.findById.mockResolvedValue(null);

      req.body = updateData;

      await expect(
        ScheduleController.updateSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(NotFoundError);

      expect(MockScheduleModel.update).not.toHaveBeenCalled();
    });

    it('다른 사용자의 일정 업데이트 시 ForbiddenError를 발생시켜야 한다', async () => {
      const otherUserSchedule = { ...mockSchedule, userId: 'other-user-id' };

      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockValidationService.validateUpdateScheduleData.mockReturnValue(updateData);
      MockScheduleModel.findById.mockResolvedValue(otherUserSchedule);

      req.body = updateData;

      await expect(
        ScheduleController.updateSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(ForbiddenError);

      expect(MockScheduleModel.update).not.toHaveBeenCalled();
    });

    it('시간 업데이트 시 시간 검증을 수행해야 한다', async () => {
      const timeUpdateData = {
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T18:00:00Z')
      };

      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockValidationService.validateUpdateScheduleData.mockReturnValue(timeUpdateData);
      MockScheduleModel.findById.mockResolvedValue(mockSchedule);
      MockScheduleTransformer.partialApiToUpdateData.mockReturnValue({
        startDate: new Date(timeUpdateData.startDate),
        endDate: new Date(timeUpdateData.endDate)
      });
      MockScheduleTransformer.validateUpdateTimes.mockReturnValue(undefined);
      MockScheduleModel.update.mockResolvedValue({ ...mockSchedule, ...timeUpdateData });

      req.body = timeUpdateData;

      await ScheduleController.updateSchedule(req as AuthenticatedRequest, res as Response, next);

      expect(MockScheduleTransformer.validateUpdateTimes).toHaveBeenCalledWith(timeUpdateData, mockSchedule);
    });

    it('Model.update가 null을 반환하면 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockValidationService.validateUpdateScheduleData.mockReturnValue(updateData);
      MockScheduleModel.findById.mockResolvedValue(mockSchedule);
      MockScheduleTransformer.partialApiToUpdateData.mockReturnValue(updateData);
      MockScheduleModel.update.mockResolvedValue(null);

      req.body = updateData;

      await expect(
        ScheduleController.updateSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteSchedule', () => {
    beforeEach(() => {
      req.params = { id: 'schedule-id' };
    });

    it('일정을 성공적으로 삭제해야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockScheduleModel.findById.mockResolvedValue(mockSchedule);
      MockScheduleModel.delete.mockResolvedValue(true);

      await ScheduleController.deleteSchedule(req as AuthenticatedRequest, res as Response, next);

      expect(MockValidationService.validateId).toHaveBeenCalledWith('schedule-id');
      expect(MockScheduleModel.findById).toHaveBeenCalledWith('schedule-id');
      expect(MockScheduleModel.delete).toHaveBeenCalledWith('schedule-id');

      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        message: '일정이 삭제되었습니다.'
      });
    });

    it('인증되지 않은 사용자에 대해 UnauthorizedError를 발생시켜야 한다', async () => {
      req.user = undefined;

      await expect(
        ScheduleController.deleteSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(UnauthorizedError);

      expect(MockScheduleModel.delete).not.toHaveBeenCalled();
    });

    it('존재하지 않는 일정 삭제 시 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockScheduleModel.findById.mockResolvedValue(null);

      await expect(
        ScheduleController.deleteSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(NotFoundError);

      expect(MockScheduleModel.delete).not.toHaveBeenCalled();
    });

    it('다른 사용자의 일정 삭제 시 ForbiddenError를 발생시켜야 한다', async () => {
      const otherUserSchedule = { ...mockSchedule, userId: 'other-user-id' };

      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockScheduleModel.findById.mockResolvedValue(otherUserSchedule);

      await expect(
        ScheduleController.deleteSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(ForbiddenError);

      expect(MockScheduleModel.delete).not.toHaveBeenCalled();
    });

    it('Model.delete가 false를 반환하면 NotFoundError를 발생시켜야 한다', async () => {
      MockValidationService.validateId.mockReturnValue('schedule-id');
      MockScheduleModel.findById.mockResolvedValue(mockSchedule);
      MockScheduleModel.delete.mockResolvedValue(false);

      await expect(
        ScheduleController.deleteSchedule(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Error Handling', () => {
    it('Model에서 데이터베이스 에러가 발생하면 에러를 전파해야 한다', async () => {
      const databaseError = new Error('Database connection failed');

      MockScheduleModel.findAll.mockRejectedValue(databaseError);

      await expect(
        ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow('Database connection failed');
    });

    it('Kafka 에러가 발생해도 API 응답에 영향을 주지 않아야 한다', async () => {
      const { kafkaProducer } = require('../../src/services/kafka.client');
      kafkaProducer.publishEvent.mockRejectedValue(new Error('Kafka error'));

      const chainedJson = jest.fn();
      statusSpy.mockReturnValue({ json: chainedJson });

      MockValidationService.validateCreateScheduleData.mockReturnValue({
        title: 'Test Schedule',
        description: 'Test Description',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T17:00:00Z'),
        projectId: 'project-id',
        userId: 'user-id'
      });
      MockScheduleTransformer.apiToCreateData.mockReturnValue({
        title: 'Test Schedule',
        description: 'Test Description',
        startDate: new Date('2024-01-01T09:00:00Z'),
        endDate: new Date('2024-01-01T17:00:00Z'),
        status: Status.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: 'project-id',
        userId: 'user-id'
      });
      MockScheduleTransformer.validateTimes.mockReturnValue(undefined);
      MockScheduleTransformer.validateDate.mockReturnValue(undefined);
      MockScheduleModel.create.mockResolvedValue(mockSchedule);

      req.body = validScheduleData;

      await ScheduleController.createSchedule(req as AuthenticatedRequest, res as Response, next);

      // Kafka 에러에도 불구하고 성공 응답이 와야 함
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(chainedJson).toHaveBeenCalledWith({
        success: true,
        schedule: mockSchedule
      });
    });
  });

  describe('Authentication Helper', () => {
    it('validateAuthentication이 올바르게 작동해야 한다', async () => {
      // Private method이므로 간접적으로 테스트
      req.user = undefined;

      await expect(
        ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Filter Builder', () => {
    it('빈 쿼리에 대해 userId만 포함한 필터를 생성해야 한다', async () => {
      req.query = {};

      MockScheduleModel.findAll.mockResolvedValue([]);

      await ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next);

      expect(MockScheduleModel.findAll).toHaveBeenCalledWith({ userId: 'user-id' });
    });

    it('모든 쿼리 파라미터를 포함한 필터를 생성해야 한다', async () => {
      req.query = {
        date: '2024-01-01',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: Status.COMPLETED,
        priority: Priority.LOW,
        projectId: 'project-id'
      };

      MockScheduleModel.findAll.mockResolvedValue([]);

      await ScheduleController.getAllSchedules(req as AuthenticatedRequest, res as Response, next);

      expect(MockScheduleModel.findAll).toHaveBeenCalledWith({
        userId: 'user-id',
        date: new Date('2024-01-01'),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: Status.COMPLETED,
        priority: Priority.LOW,
        projectId: 'project-id'
      });
    });
  });
});
