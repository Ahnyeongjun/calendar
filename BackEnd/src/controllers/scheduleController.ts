import { Request, Response } from 'express';
import ScheduleModel from '../models/Schedule';
import { Status, Priority } from '@prisma/client';
import { kafkaProducer } from '../services/kafka.client';
import { convertKafkaDate, convertScheduleDate } from '../utils/converter';

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

interface ScheduleCreateData {
  title: string;
  description: string;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  status: Status;
  priority: Priority;
  projectId: string | null;
  userId: string;
}

const scheduleController = {
  async getAllSchedules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const filters: ScheduleFilters = {
        userId: req.user.id,
        ...buildFilters(req.query)
      };

      const schedules = await ScheduleModel.findAll(filters);
      const processedSchedules = schedules.map(convertScheduleDate);

      res.json({ schedules: processedSchedules });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await ScheduleModel.findById(id);

      if (!schedule) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }

      res.json({ schedule: convertScheduleDate(schedule) });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async createSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const validation = validateScheduleData(req.body);
      if (!validation.isValid) {
        res.status(400).json({ message: validation.message });
        return;
      }

      const scheduleData = buildScheduleData(req.body, req.user.id);
      const newSchedule = await ScheduleModel.create(scheduleData);

      // Kafka 이벤트 발행
      await publishKafkaEvent(newSchedule, 'CREATE');

      res.status(201).json({ schedule: newSchedule });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async updateSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const validation = validateScheduleData(req.body);
      if (!validation.isValid) {
        res.status(400).json({ message: validation.message });
        return;
      }

      const existingSchedule = await ScheduleModel.findById(id);
      if (!existingSchedule) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }

      if (existingSchedule.userId !== req.user.id) {
        res.status(403).json({ message: '권한이 없습니다.' });
        return;
      }

      const scheduleData = buildScheduleData(req.body);
      const updatedSchedule = await ScheduleModel.update(id, scheduleData);

      if (!updatedSchedule) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }

      // Kafka 이벤트 발행
      await publishKafkaEvent(updatedSchedule, 'UPDATE');

      res.json({ schedule: updatedSchedule });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },

  async deleteSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({ message: '인증이 필요합니다.' });
        return;
      }

      const existingSchedule = await ScheduleModel.findById(id);
      if (!existingSchedule) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }

      if (existingSchedule.userId !== req.user.id) {
        res.status(403).json({ message: '권한이 없습니다.' });
        return;
      }

      const result = await ScheduleModel.delete(id);
      if (!result) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }

      // Kafka 이벤트 발행
      await publishKafkaEvent(existingSchedule, 'DELETE');

      res.json({ message: '일정이 삭제되었습니다.' });
    } catch (error) {
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

// Helper functions
function buildFilters(query: any): Partial<ScheduleFilters> {
  const filters: Partial<ScheduleFilters> = {};

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

function validateScheduleData(body: any): { isValid: boolean; message?: string } {
  const { title, date, status, priority } = body;

  if (!title || !date || !status || !priority) {
    return {
      isValid: false,
      message: '제목, 날짜, 상태, 우선순위는 필수입니다.'
    };
  }

  return { isValid: true };
}

function buildScheduleData(body: any, userId?: string): ScheduleCreateData {
  const { title, description, date, start_time, end_time, status, priority, project_id } = body;

  const data: any = {
    title,
    description,
    date: new Date(date),
    startTime: start_time ? new Date(date + 'T' + start_time) : null,
    endTime: end_time ? new Date(date + 'T' + end_time) : null,
    status: status as Status,
    priority: priority as Priority,
    projectId: project_id || null
  };

  if (userId) {
    data.userId = userId;
  }

  return data;
}

async function publishKafkaEvent(schedule: any, type: 'CREATE' | 'UPDATE' | 'DELETE'): Promise<void> {
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

export default scheduleController;
