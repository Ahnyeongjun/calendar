import { Request, Response } from 'express';
import ScheduleModel from '../models/Schedule';
import { Status, Priority } from '@prisma/client';
import { kafkaProducer } from '../services/kafka.client';
import { asyncHandler, ValidationError, NotFoundError, ForbiddenError, UnauthorizedError } from '../middleware/errorHandler';
import ValidationService from '../services/validationService';
import ScheduleTransformer from '../services/dataTransformer';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

interface ScheduleFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: Status;
  priority?: Priority;
  projectId?: string;
}

class ScheduleController {
  // 헬퍼 메서드들
  private static validateAuthentication(req: AuthenticatedRequest): void {
    if (!req.user) {
      throw new UnauthorizedError();
    }
  }

  private static buildFilters(query: any, userId: string): ScheduleFilters {
    const filters: ScheduleFilters = { userId };

    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);
    if (query.status) filters.status = query.status as Status;
    if (query.priority) filters.priority = query.priority as Priority;
    if (query.projectId) filters.projectId = query.projectId;

    return filters;
  }

  private static async validateOwnership(scheduleId: string, userId: string): Promise<any> {
    const schedule = await ScheduleModel.findById(scheduleId);

    if (!schedule) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenError('이 일정에 대한 권한이 없습니다.');
    }

    return schedule;
  }

  private static async publishKafkaEvent(schedule: any, type: 'CREATE' | 'UPDATE' | 'DELETE'): Promise<void> {
    try {
      if (process.env.KAFKA_ENABLED === 'false') return;

      await kafkaProducer.publishEvent('calendar-events', schedule.id, {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description || undefined,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        userId: schedule.userId,
        type
      });
    } catch (error) {
      // Silent fail - Kafka 에러가 API 응답에 영향을 주지 않음
      console.warn('Kafka event publishing failed:', error);
    }
  }

  // 컨트롤러 메서드들
  static getAllSchedules = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);

    const filters = ScheduleController.buildFilters(req.query, req.user!.id);
    const schedules = await ScheduleModel.findAll(filters);

    res.json({
      success: true,
      schedules: schedules
    });
  });

  static getSchedule = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    ValidationService.validateId(req.params.id);

    const schedule = await ScheduleModel.findById(req.params.id);

    if (!schedule) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    res.json({
      success: true,
      schedule: schedule
    });
  });

  static createSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);
    ValidationService.validateCreateScheduleData(req.body);

    // API 요청 데이터 검증
    ScheduleTransformer.validateApiRequest(req.body);

    const scheduleData = ScheduleTransformer.apiToCreateData(req.body, req.user!.id);

    // 시간 검증
    ScheduleTransformer.validateTimes(scheduleData.startDate, scheduleData.endDate);
    ScheduleTransformer.validateDate(scheduleData.startDate);
    ScheduleTransformer.validateDate(scheduleData.endDate);

    const newSchedule = await ScheduleModel.create(scheduleData);

    // Kafka 이벤트 발행
    await ScheduleController.publishKafkaEvent(newSchedule, 'CREATE');

    res.status(201).json({
      success: true,
      schedule: newSchedule
    });
  });

  static updateSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);
    ValidationService.validateId(req.params.id);
    ValidationService.validateUpdateScheduleData(req.body);

    const { id } = req.params;

    // 소유권 검증 및 기존 데이터 가져오기
    const existingSchedule = await ScheduleController.validateOwnership(id, req.user!.id);

    // API 요청 데이터 검증
    ScheduleTransformer.validateApiRequest(req.body);

    const updateData = ScheduleTransformer.partialApiToUpdateData(req.body);

    // 시간 검증 (업데이트되는 경우에만)
    if (updateData.startDate !== undefined || updateData.endDate !== undefined) {
      ScheduleTransformer.validateUpdateTimes(updateData, existingSchedule);
    }

    if (updateData.startDate !== undefined) {
      ScheduleTransformer.validateDate(updateData.startDate);
    }

    if (updateData.endDate !== undefined) {
      ScheduleTransformer.validateDate(updateData.endDate);
    }

    const updatedSchedule = await ScheduleModel.update(id, updateData);

    if (!updatedSchedule) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    // Kafka 이벤트 발행
    await ScheduleController.publishKafkaEvent(updatedSchedule, 'UPDATE');

    res.json({
      success: true,
      schedule: updatedSchedule
    });
  });

  static deleteSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);
    ValidationService.validateId(req.params.id);

    const { id } = req.params;

    // 소유권 검증 및 기존 일정 정보 가져오기
    const existingSchedule = await ScheduleController.validateOwnership(id, req.user!.id);

    const result = await ScheduleModel.delete(id);

    if (!result) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    // Kafka 이벤트 발행
    await ScheduleController.publishKafkaEvent(existingSchedule, 'DELETE');

    res.json({
      success: true,
      message: '일정이 삭제되었습니다.'
    });
  });
}

export default ScheduleController;
