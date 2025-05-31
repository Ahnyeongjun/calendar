import { Request, Response } from 'express';
import ScheduleModel from '../models/Schedule';
import { Status, Priority } from '@prisma/client';

// 추가: 사용자 인증 정보를 요청에서 가져오는 인터페이스
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
  };
}

const scheduleController = {
  // 모든 일정 조회 (필터링 가능)
  async getAllSchedules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { date, startDate, endDate, status, priority, projectId } = req.query;
      
      const filters: any = {};
      
      // 사용자 ID 추가 (인증된 사용자의 일정만 조회)
      if (req.user) {
        filters.userId = req.user.id;
      }
      
      // 필터링 조건 추가
      if (date) filters.date = new Date(date as string);
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }
      if (status) filters.status = status as Status;
      if (priority) filters.priority = priority as Priority;
      if (projectId) filters.projectId = projectId as string;
      
      const schedules = await ScheduleModel.findAll(filters);
      res.status(200).json({ schedules });
    } catch (error) {
      console.error('Get all schedules error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 특정 일정 조회
  async getSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schedule = await ScheduleModel.findById(id);
      
      if (!schedule) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ schedule });
    } catch (error) {
      console.error('Get schedule error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 일정 생성
  async createSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, date, start_time, end_time, status, priority, project_id } = req.body;
      
      if (!title || !date || !status || !priority) {
        res.status(400).json({ message: '제목, 날짜, 상태, 우선순위는 필수 입력 항목입니다.' });
        return;
      }
      
      // camelCase로 변환하고 userId 필드 추가
      const scheduleData = {
        title,
        description,
        date: new Date(date),
        startTime: start_time ? new Date(date + 'T' + start_time) : null, // 시간 포맷 변환
        endTime: end_time ? new Date(date + 'T' + end_time) : null,       // 시간 포맷 변환
        status: status as Status,
        priority: priority as Priority,
        projectId: project_id || null,
        userId: req.user?.id || '1' // 인증된 사용자 ID 또는 기본값
      };
      
      const newSchedule = await ScheduleModel.create(scheduleData);
      
      res.status(201).json({ schedule: newSchedule });
    } catch (error) {
      console.error('Create schedule error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 일정 업데이트
  async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, date, start_time, end_time, status, priority, project_id } = req.body;
      
      if (!title || !date || !status || !priority) {
        res.status(400).json({ message: '제목, 날짜, 상태, 우선순위는 필수 입력 항목입니다.' });
        return;
      }
      
      // camelCase로 변환
      const scheduleData = {
        title,
        description,
        date: new Date(date),
        startTime: start_time ? new Date(date + 'T' + start_time) : null,
        endTime: end_time ? new Date(date + 'T' + end_time) : null,
        status: status as Status,
        priority: priority as Priority,
        projectId: project_id || null
      };
      
      const updatedSchedule = await ScheduleModel.update(id, scheduleData);
      
      if (!updatedSchedule) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ schedule: updatedSchedule });
    } catch (error) {
      console.error('Update schedule error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  },
  
  // 일정 삭제
  async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const result = await ScheduleModel.delete(id);
      
      if (!result) {
        res.status(404).json({ message: '일정을 찾을 수 없습니다.' });
        return;
      }
      
      res.status(200).json({ message: '일정이 성공적으로 삭제되었습니다.' });
    } catch (error) {
      console.error('Delete schedule error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  }
};

export default scheduleController;