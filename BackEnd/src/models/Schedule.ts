import { prisma } from '../config/prisma';
import { Schedule, Status, Priority } from '@prisma/client';

interface ScheduleFilters {
  startDate?: Date;
  endDate?: Date;
  status?: Status;
  priority?: Priority;
  projectId?: string;
  userId?: string;
}

// Prisma 생성/업데이트에 사용할 타입들
type ScheduleCreateInput = Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>;
type ScheduleUpdateInput = Partial<ScheduleCreateInput>;

class ScheduleModel {
  static async findAll(filters: ScheduleFilters = {}): Promise<Schedule[]> {
    try {
      const where: any = {};

      // 날짜 범위 필터링 (더 간단하고 직관적인 로직)
      if (filters.startDate && filters.endDate) {
        // 시작일과 종료일이 모두 제공된 경우: 날짜 범위에 있는 모든 일정
        const startOfDay = new Date(filters.startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        where.OR = [
          {
            // 시작일이 범위 내에 있는 일정
            startDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          {
            // 종료일이 범위 내에 있는 일정
            endDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          {
            // 범위를 완전히 포함하는 일정
            AND: [
              { startDate: { lte: startOfDay } },
              { endDate: { gte: endOfDay } }
            ]
          }
        ];
      } else if (filters.startDate) {
        // 시작일만 제공된 경우: 해당 날짜 이후에 끝나는 일정
        where.endDate = {
          gte: filters.startDate
        };
      } else if (filters.endDate) {
        // 종료일만 제공된 경우: 해당 날짜 이전에 시작하는 일정
        where.startDate = {
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
          { startDate: 'asc' },
          { createdAt: 'asc' }
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

  static async create(scheduleData: ScheduleCreateInput): Promise<Schedule> {
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

  static async update(id: string, scheduleData: ScheduleUpdateInput): Promise<Schedule | null> {
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
export type { ScheduleCreateInput, ScheduleUpdateInput };
