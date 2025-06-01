import { prisma } from '../config/prisma';
import { Schedule, Status, Priority } from '@prisma/client';

interface ScheduleFilters {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  status?: Status;
  priority?: Priority;
  projectId?: string;
  userId?: string;
}

class ScheduleModel {
  static async findAll(filters: ScheduleFilters = {}): Promise<Schedule[]> {
    try {
      const where: any = {};
      
      // 날짜 필터링
      if (filters.date) {
        where.date = filters.date;
      }
      
      // 날짜 범위 필터링
      if (filters.startDate && filters.endDate) {
        where.date = {
          gte: filters.startDate,
          lte: filters.endDate
        };
      }
      
      // 상태 필터링
      if (filters.status) {
        where.status = filters.status;
      }
      
      // 우선순위 필터링
      if (filters.priority) {
        where.priority = filters.priority;
      }
      
      // 프로젝트 필터링
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      
      // 사용자 필터링
      if (filters.userId) {
        where.userId = filters.userId;
      }
      
      return await prisma.schedule.findMany({
        where,
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' }
        ],
        include: {
          project: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Schedule.findAll error:', error);
      throw error;
    }
  }
  
  static async findById(id: string): Promise<Schedule | null> {
    try {
      return await prisma.schedule.findUnique({
        where: { id },
        include: {
          project: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Schedule.findById error:', error);
      throw error;
    }
  }
  
  static async create(scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    try {
      return await prisma.schedule.create({
        data: scheduleData,
        include: {
          project: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Schedule.create error:', error);
      throw error;
    }
  }
  
  static async update(id: string, scheduleData: Partial<Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Schedule | null> {
    try {
      // 일정 존재 확인
      const existingSchedule = await this.findById(id);
      if (!existingSchedule) {
        return null;
      }
      
      // 업데이트 실행
      return await prisma.schedule.update({
        where: { id },
        data: scheduleData,
        include: {
          project: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true
            }
          }
        }
      });
    } catch (error) {
      console.error('Schedule.update error:', error);
      throw error;
    }
  }
  
  static async delete(id: string): Promise<boolean> {
    try {
      // 일정 존재 확인
      const existingSchedule = await this.findById(id);
      if (!existingSchedule) {
        return false;
      }
      
      // 삭제 실행
      await prisma.schedule.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error('Schedule.delete error:', error);
      throw error;
    }
  }
}

export default ScheduleModel;