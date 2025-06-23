import { Status, Priority } from '@prisma/client';

// API 요청 데이터 타입
export interface ScheduleApiRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: Status;
  priority?: Priority;
  projectId?: string;
}

// Prisma 생성 데이터 타입 (새 스키마와 일치)
export interface ScheduleCreateData {
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: Status;
  priority: Priority;
  projectId: string | null;
  userId: string;
}

// 업데이트 데이터 타입
export interface ScheduleUpdateData {
  title?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  status?: Status;
  priority?: Priority;
  projectId?: string | null;
}

class ScheduleTransformer {
  // API 요청 데이터를 Prisma 생성 데이터로 변환
  static apiToCreateData(apiData: ScheduleApiRequest, userId: string): ScheduleCreateData {
    return {
      title: this.sanitizeString(apiData.title),
      description: this.sanitizeStringToNull(apiData.description),
      startDate: new Date(apiData.startDate),
      endDate: new Date(apiData.endDate),
      status: apiData.status || Status.PENDING,
      priority: apiData.priority || Priority.MEDIUM,
      projectId: this.sanitizeStringToNull(apiData.projectId),
      userId
    };
  }

  // 부분 업데이트 데이터 변환
  static partialApiToUpdateData(apiData: Partial<ScheduleApiRequest>): ScheduleUpdateData {
    const updateData: ScheduleUpdateData = {};

    if (apiData.title !== undefined) {
      updateData.title = this.sanitizeString(apiData.title);
    }

    if (apiData.description !== undefined) {
      updateData.description = this.sanitizeStringToNull(apiData.description);
    }

    if (apiData.startDate !== undefined) {
      updateData.startDate = new Date(apiData.startDate);
    }

    if (apiData.endDate !== undefined) {
      updateData.endDate = new Date(apiData.endDate);
    }

    if (apiData.status !== undefined) {
      updateData.status = apiData.status;
    }

    if (apiData.priority !== undefined) {
      updateData.priority = apiData.priority;
    }

    if (apiData.projectId !== undefined) {
      updateData.projectId = this.sanitizeStringToNull(apiData.projectId);
    }

    return updateData;
  }

  // 헬퍼 메서드들
  private static sanitizeString(value: string): string {
    return value.trim();
  }

  private static sanitizeStringToNull(value?: string): string | null {
    if (!value || value.trim() === '') {
      return null;
    }
    return value.trim();
  }

  // 시간 검증
  static validateTimes(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new Error('시작 시간은 종료 시간보다 이전이어야 합니다.');
    }
  }

  // 날짜 검증
  static validateDate(date: Date): void {
    if (isNaN(date.getTime())) {
      throw new Error('유효하지 않은 날짜입니다.');
    }
  }

  // 업데이트 시 기존 데이터와 병합하여 시간 검증
  static validateUpdateTimes(
    updateData: ScheduleUpdateData,
    existingData: { startDate: Date; endDate: Date }
  ): void {
    const startDate = updateData.startDate !== undefined ? updateData.startDate : existingData.startDate;
    const endDate = updateData.endDate !== undefined ? updateData.endDate : existingData.endDate;

    this.validateTimes(startDate, endDate);
  }

  // API 요청 데이터 검증
  static validateApiRequest(data: Partial<ScheduleApiRequest>): void {
    if (data.startDate) {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        throw new Error('유효하지 않은 시작 날짜 형식입니다.');
      }
    }

    if (data.endDate) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        throw new Error('유효하지 않은 종료 날짜 형식입니다.');
      }
    }

    // 시간 순서 검증
    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (startDate >= endDate) {
        throw new Error('시작 시간은 종료 시간보다 이전이어야 합니다.');
      }
    }
  }
}

export default ScheduleTransformer;
