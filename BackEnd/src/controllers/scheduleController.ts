import { Request, Response } from 'express';
import ScheduleModel from '../models/Schedule';
import { Status, Priority } from '@prisma/client';
import { kafkaProducer } from '../services/kafka.client';
import { convertKafkaDate, convertScheduleDate, storeEndDateInfo } from '../utils/converter';
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
  date?: Date;
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

    if (query.date) filters.date = new Date(query.date);
    if (query.startDate && query.endDate) {
      filters.startDate = new Date(query.startDate);
      filters.endDate = new Date(query.endDate);
    }
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
      const kafkaDates = convertKafkaDate(schedule);

      await kafkaProducer.publishEvent('calendar-events', schedule.id, {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description || undefined,
        startDate: kafkaDates.startDate,
        endDate: kafkaDates.endDate,
        userId: schedule.userId,
        type
      });
    } catch (error) {
      // Silent fail - Kafka 에러가 API 응답에 영향을 주지 않음
    }
  }

  // 컨트롤러 메서드들
  static getAllSchedules = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);

    const filters = ScheduleController.buildFilters(req.query, req.user!.id);
    const schedules = await ScheduleModel.findAll(filters);
    const processedSchedules = schedules.map(convertScheduleDate);

    res.json({
      success: true,
      schedules: processedSchedules
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
      schedule: convertScheduleDate(schedule)
    });
  });

  static createSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);
    ValidationService.validateCreateScheduleData(req.body);

    const scheduleData = ScheduleTransformer.apiToCreateData(req.body, req.user!.id);

    // 시간 검증
    ScheduleTransformer.validateTimes(scheduleData.startTime, scheduleData.endTime);
    ScheduleTransformer.validateDate(scheduleData.date);

    const newSchedule = await ScheduleModel.create(scheduleData);

    // endDate 원본 정보 저장 (ISO datetime 형식 보조)
    if (req.body.end_date && newSchedule.id) {
      storeEndDateInfo(newSchedule.id, req.body.end_date);
    }

    // Kafka 이벤트 발행
    await ScheduleController.publishKafkaEvent(newSchedule, 'CREATE');

    // 응답 데이터에 date 변환 적용
    const responseSchedule = convertScheduleDate(newSchedule);

    res.status(201).json({
      success: true,
      schedule: responseSchedule
    });
  });

  static updateSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    ScheduleController.validateAuthentication(req);
    ValidationService.validateId(req.params.id);
    ValidationService.validateUpdateScheduleData(req.body);

    const { id } = req.params;

    // 소유권 검증 및 기존 데이터 가져오기
    const existingSchedule = await ScheduleController.validateOwnership(id, req.user!.id);

    const updateData = ScheduleTransformer.partialApiToUpdateData(req.body);

    // 시간 검증 (업데이트되는 경우에만)
    if (updateData.startTime !== undefined || updateData.endTime !== undefined) {
      ScheduleTransformer.validateUpdateTimes(updateData, existingSchedule);
    }

    if (updateData.date !== undefined) {
      ScheduleTransformer.validateDate(updateData.date);
    }

    const updatedSchedule = await ScheduleModel.update(id, updateData);

    if (!updatedSchedule) {
      throw new NotFoundError('일정을 찾을 수 없습니다.');
    }

    // endDate 원본 정보 업데이트
    if (req.body.end_date) {
      storeEndDateInfo(id, req.body.end_date);
    }

    // Kafka 이벤트 발행
    await ScheduleController.publishKafkaEvent(updatedSchedule, 'UPDATE');

    // 응답 데이터에 date 변환 적용
    const responseSchedule = convertScheduleDate(updatedSchedule);

    res.json({
      success: true,
      schedule: responseSchedule
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
