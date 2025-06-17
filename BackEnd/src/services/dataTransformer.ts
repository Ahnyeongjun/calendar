import { Status, Priority } from '@prisma/client';
import { timeUtils, dateUtils } from '../utils/converter';

// API 요청 데이터 타입
export interface ScheduleApiRequest {
  title: string;
  description?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  status: Status;
  priority: Priority;
  projectId?: string;
}

// Prisma 생성 데이터 타입 (Prisma 스키마와 정확히 일치)
export interface ScheduleCreateData {
  title: string;
  description: string | null;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  status: Status;
  priority: Priority;
  projectId: string | null;
  userId: string;
}

// 업데이트 데이터 타입
export interface ScheduleUpdateData {
  title?: string;
  description?: string | null;
  date?: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  status?: Status;
  priority?: Priority;
  projectId?: string | null;
}

class ScheduleTransformer {
  // API 요청 데이터를 Prisma 생성 데이터로 변환
  static apiToCreateData(apiData: ScheduleApiRequest, userId: string): ScheduleCreateData {
    // ISO datetime에서 날짜와 시간 정보 추출 (UTC 시간 유지)
    let scheduleDate = new Date(apiData.date);
    let startTime = null;
    let endTime = null;

    if (apiData.startDate) {
      const startDateTime = new Date(apiData.startDate);
      if (!isNaN(startDateTime.getTime())) {
        // UTC 날짜를 사용하여 시간대 변환 방지
        scheduleDate = new Date(Date.UTC(
          startDateTime.getUTCFullYear(),
          startDateTime.getUTCMonth(),
          startDateTime.getUTCDate()
        ));
        startTime = timeUtils.parseTimeToDate(apiData.startDate);
      }
    }

    if (apiData.endDate) {
      endTime = timeUtils.parseTimeToDate(apiData.endDate);
    }

    return {
      title: this.sanitizeString(apiData.title),
      description: this.sanitizeStringToNull(apiData.description),
      date: scheduleDate,
      startTime,
      endTime,
      status: apiData.status,
      priority: apiData.priority,
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

    if (apiData.date !== undefined) {
      updateData.date = new Date(apiData.date);
    }

    if (apiData.startDate !== undefined) {
      const startDateTime = new Date(apiData.startDate);
      if (!isNaN(startDateTime.getTime())) {
        // UTC 날짜를 사용하여 시간대 변환 방지
        updateData.date = new Date(Date.UTC(
          startDateTime.getUTCFullYear(),
          startDateTime.getUTCMonth(),
          startDateTime.getUTCDate()
        ));
      }
      updateData.startTime = timeUtils.parseTimeToDate(apiData.startDate);
    }

    if (apiData.endDate !== undefined) {
      updateData.endTime = timeUtils.parseTimeToDate(apiData.endDate);
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
  static validateTimes(startTime?: Date | null, endTime?: Date | null): void {
    if (startTime && endTime) {
      // Date 객체를 시간 문자열로 변환하여 비교
      const startTimeStr = timeUtils.formatTimeFromMySQL(startTime);
      const endTimeStr = timeUtils.formatTimeFromMySQL(endTime);

      if (startTimeStr && endTimeStr && startTimeStr >= endTimeStr) {
        throw new Error('시작 시간은 종료 시간보다 이전이어야 합니다.');
      }
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
    existingData: { startTime: Date | null; endTime: Date | null }
  ): void {
    const startTime = updateData.startTime !== undefined ? updateData.startTime : existingData.startTime;
    const endTime = updateData.endTime !== undefined ? updateData.endTime : existingData.endTime;

    this.validateTimes(startTime, endTime);
  }

  // API 요청 데이터 검증
  static validateApiRequest(data: Partial<ScheduleApiRequest>): void {
    if (data.date && !dateUtils.isValidDate(data.date)) {
      throw new Error('유효하지 않은 날짜 형식입니다.');
    }

    if (data.startDate && !timeUtils.isValidTime(data.startDate)) {
      throw new Error('유효하지 않은 시작 시간 형식입니다. (HH:MM 또는 ISO datetime 형식을 사용하세요)');
    }

    if (data.endDate && !timeUtils.isValidTime(data.endDate)) {
      throw new Error('유효하지 않은 종료 시간 형식입니다. (HH:MM 또는 ISO datetime 형식을 사용하세요)');
    }

    // 시간 순서 검증 (API 요청 레벨에서)
    if (data.startDate && data.endDate) {
      const startTime = timeUtils.parseTimeToDate(data.startDate);
      const endTime = timeUtils.parseTimeToDate(data.endDate);

      if (startTime && endTime && startTime >= endTime) {
        throw new Error('시작 시간은 종료 시간보다 이전이어야 합니다.');
      }
    }
  }
}

export default ScheduleTransformer;