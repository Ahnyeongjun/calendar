import { Status, Priority } from '@prisma/client';
import { ValidationError } from '../middleware/errorHandler';
import ScheduleTransformer, { ScheduleApiRequest } from './dataTransformer';

interface ScheduleValidationData {
  title?: string;
  description?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  priority?: string;
  project_id?: string;
}

interface ProjectValidationData {
  name?: string;
  description?: string;
  color?: string;
}

class ValidationService {
  // 필수 필드 검증
  static validateRequired(data: any, fields: string[]): void {
    const missing = fields.filter(field => !data[field] || data[field].toString().trim() === '');
    
    if (missing.length > 0) {
      throw new ValidationError(`다음 필드는 필수입니다: ${missing.join(', ')}`);
    }
  }

  // 스케줄 데이터 검증
  static validateScheduleData(data: ScheduleValidationData, isUpdate = false): void {
    if (!isUpdate) {
      this.validateRequired(data, ['title', 'date', 'status', 'priority']);
    }

    // 제목 길이 검증
    if (data.title !== undefined) {
      if (data.title.trim().length === 0) {
        throw new ValidationError('제목은 필수입니다.');
      }
      if (data.title.length > 100) {
        throw new ValidationError('제목은 100자를 초과할 수 없습니다.');
      }
    }

    // 설명 길이 검증
    if (data.description !== undefined) {
      if (data.description && data.description.length > 500) {
        throw new ValidationError('설명은 500자를 초과할 수 없습니다.');
      }
    }

    // 상태 검증
    if (data.status !== undefined) {
      const validStatuses = Object.values(Status);
      if (!validStatuses.includes(data.status as Status)) {
        throw new ValidationError(`유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}`);
      }
    }

    // 우선순위 검증
    if (data.priority !== undefined) {
      const validPriorities = Object.values(Priority);
      if (!validPriorities.includes(data.priority as Priority)) {
        throw new ValidationError(`유효하지 않은 우선순위입니다. 가능한 값: ${validPriorities.join(', ')}`);
      }
    }

    // ScheduleTransformer의 검증 메서드 사용
    try {
      // 타입 호환성을 위한 변환
      const apiData: Partial<ScheduleApiRequest> = {};
      
      if (data.title !== undefined) apiData.title = data.title;
      if (data.description !== undefined) apiData.description = data.description;
      if (data.date !== undefined) apiData.date = data.date;
      if (data.start_date !== undefined) apiData.start_date = data.start_date;
      if (data.end_date !== undefined) apiData.end_date = data.end_date;
      if (data.status !== undefined) apiData.status = data.status as Status;
      if (data.priority !== undefined) apiData.priority = data.priority as Priority;
      if (data.project_id !== undefined) apiData.project_id = data.project_id;
      
      ScheduleTransformer.validateApiRequest(apiData);
    } catch (error) {
      throw new ValidationError((error as Error).message);
    }
  }

  // 프로젝트 데이터 검증
  static validateProjectData(data: ProjectValidationData, isUpdate = false): void {
    if (!isUpdate) {
      this.validateRequired(data, ['name', 'color']);
    }

    // 이름 검증
    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new ValidationError('프로젝트 이름은 필수입니다.');
      }
      if (data.name.length > 50) {
        throw new ValidationError('프로젝트 이름은 50자를 초과할 수 없습니다.');
      }
    }

    // 설명 검증
    if (data.description !== undefined) {
      if (data.description && data.description.length > 200) {
        throw new ValidationError('프로젝트 설명은 200자를 초과할 수 없습니다.');
      }
    }

    // 색상 검증
    if (data.color !== undefined) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(data.color)) {
        throw new ValidationError('유효하지 않은 색상 형식입니다. (#RRGGBB)');
      }
    }
  }

  // 로그인 데이터 검증
  static validateLoginData(data: { username?: string; password?: string }): void {
    this.validateRequired(data, ['username', 'password']);

    if (data.username && data.username.length < 3) {
      throw new ValidationError('사용자명은 3자 이상이어야 합니다.');
    }

    if (data.password && data.password.length < 4) {
      throw new ValidationError('비밀번호는 4자 이상이어야 합니다.');
    }
  }

  // ID 형식 검증
  static validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('ID는 필수입니다.');
    }
  }
}

export default ValidationService;