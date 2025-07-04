import Joi from 'joi';
import { ValidationError } from '../middleware/errorHandler';

export interface LoginData {
  username: string;
  password: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  name: string;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
}

export interface CreateScheduleData {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  projectId: string;
  userId: string;
}

export interface UpdateScheduleData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
}

class ValidationService {
  // 스키마 정의
  private static schemas = {
    login: Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
          'string.alphanum': '사용자명은 영문자와 숫자만 포함할 수 있습니다',
          'string.min': '사용자명은 최소 3자 이상이어야 합니다',
          'string.max': '사용자명은 최대 30자까지 가능합니다',
          'any.required': '사용자명은 필수입니다'
        }),
      password: Joi.string()
        .min(4)
        .max(100)
        .required()
        .messages({
          'string.min': '비밀번호는 최소 4자 이상이어야 합니다',
          'string.max': '비밀번호는 최대 100자까지 가능합니다',
          'any.required': '비밀번호는 필수입니다'
        })
    }),

    createUser: Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
          'string.alphanum': '사용자명은 영문자와 숫자만 포함할 수 있습니다',
          'string.min': '사용자명은 최소 3자 이상이어야 합니다',
          'string.max': '사용자명은 최대 30자까지 가능합니다',
          'any.required': '사용자명은 필수입니다'
        }),
      password: Joi.string()
        .min(4)
        .max(100)
        .required()
        .messages({
          'string.min': '비밀번호는 최소 4자 이상이어야 합니다',
          'string.max': '비밀번호는 최대 100자까지 가능합니다',
          'any.required': '비밀번호는 필수입니다'
        }),
      name: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
          'string.min': '이름은 최소 1자 이상이어야 합니다',
          'string.max': '이름은 최대 100자까지 가능합니다',
          'any.required': '이름은 필수입니다'
        })
    }),

    updateUser: Joi.object({
      name: Joi.string()
        .min(1)
        .max(100)
        .messages({
          'string.min': '이름은 최소 1자 이상이어야 합니다',
          'string.max': '이름은 최대 100자까지 가능합니다'
        }),
      password: Joi.string()
        .min(4)
        .max(100)
        .messages({
          'string.min': '비밀번호는 최소 4자 이상이어야 합니다',
          'string.max': '비밀번호는 최대 100자까지 가능합니다'
        })
    }).min(1).messages({
      'object.min': '수정할 정보를 입력해주세요'
    }),

    createProject: Joi.object({
      name: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
          'string.min': '프로젝트명은 최소 1자 이상이어야 합니다',
          'string.max': '프로젝트명은 최대 100자까지 가능합니다',
          'any.required': '프로젝트명은 필수입니다'
        }),
      description: Joi.string()
        .max(500)
        .allow('')
        .messages({
          'string.max': '설명은 최대 500자까지 가능합니다'
        }),
      color: Joi.string()
        .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .messages({
          'string.pattern.base': '색상은 유효한 헥스 코드여야 합니다 (예: #FF0000)'
        })
    }),

    updateProject: Joi.object({
      name: Joi.string()
        .min(1)
        .max(100)
        .messages({
          'string.min': '프로젝트명은 최소 1자 이상이어야 합니다',
          'string.max': '프로젝트명은 최대 100자까지 가능합니다'
        }),
      description: Joi.string()
        .max(500)
        .allow('')
        .messages({
          'string.max': '설명은 최대 500자까지 가능합니다'
        }),
      color: Joi.string()
        .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .messages({
          'string.pattern.base': '색상은 유효한 헥스 코드여야 합니다 (예: #FF0000)'
        })
    }).min(1).messages({
      'object.min': '수정할 정보를 입력해주세요'
    }),

    createSchedule: Joi.object({
      title: Joi.string()
        .min(1)
        .max(255) // 255자로 증가
        .required()
        .messages({
          'string.min': '제목은 최소 1자 이상이어야 합니다',
          'string.max': '제목은 최대 255자까지 가능합니다',
          'any.required': '제목은 필수입니다'
        }),
      description: Joi.string()
        .max(1000)
        .allow('', null) // null 허용 추가
        .messages({
          'string.max': '설명은 최대 1000자까지 가능합니다'
        }),
      startDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.format': '시작일은 유효한 ISO 날짜 형식이어야 합니다',
          'any.required': '시작일은 필수입니다'
        }),
      endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .required()
        .messages({
          'date.format': '종료일은 유효한 ISO 날짜 형식이어야 합니다',
          'date.min': '종료일은 시작일보다 이후여야 합니다',
          'any.required': '종료일은 필수입니다'
        }),
      projectId: Joi.string(),
      userId: Joi.string()
    }),

    updateSchedule: Joi.object({
      title: Joi.string()
        .min(1)
        .max(255) // 255자로 증가
        .messages({
          'string.min': '제목은 최소 1자 이상이어야 합니다',
          'string.max': '제목은 최대 255자까지 가능합니다'
        }),
      description: Joi.string()
        .max(1000)
        .allow('', null) // null 허용 추가
        .messages({
          'string.max': '설명은 최대 1000자까지 가능합니다'
        }),
      startDate: Joi.date()
        .iso()
        .messages({
          'date.format': '시작일은 유효한 ISO 날짜 형식이어야 합니다'
        }),
      endDate: Joi.date()
        .iso()
        .when('startDate', {
          is: Joi.exist(),
          then: Joi.date().min(Joi.ref('startDate')),
          otherwise: Joi.date()
        })
        .messages({
          'date.format': '종료일은 유효한 ISO 날짜 형식이어야 합니다',
          'date.min': '종료일은 시작일보다 이후여야 합니다'
        }),
      projectId: Joi.string()
    }).min(1).messages({
      'object.min': '수정할 정보를 입력해주세요'
    }),

    queryParams: Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          'number.base': '페이지는 숫자여야 합니다',
          'number.integer': '페이지는 정수여야 합니다',
          'number.min': '페이지는 1 이상이어야 합니다'
        }),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
          'number.base': '제한 수는 숫자여야 합니다',
          'number.integer': '제한 수는 정수여야 합니다',
          'number.min': '제한 수는 1 이상이어야 합니다',
          'number.max': '제한 수는 100 이하여야 합니다'
        }),
      sortBy: Joi.string()
        .valid('createdAt', 'updatedAt', 'title', 'startDate', 'endDate', 'name')
        .default('createdAt')
        .messages({
          'any.only': '정렬 기준은 createdAt, updatedAt, title, startDate, endDate, name 중 하나여야 합니다'
        }),
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
          'any.only': '정렬 순서는 asc 또는 desc여야 합니다'
        }),
      search: Joi.string()
        .max(100)
        .allow('')
        .messages({
          'string.max': '검색어는 최대 100자까지 가능합니다'
        }),
      startDate: Joi.date()
        .iso()
        .messages({
          'date.format': '시작일은 유효한 ISO 날짜 형식이어야 합니다'
        }),
      endDate: Joi.date()
        .iso()
        .min(Joi.ref('startDate'))
        .messages({
          'date.format': '종료일은 유효한 ISO 날짜 형식이어야 합니다',
          'date.min': '종료일은 시작일보다 이후여야 합니다'
        }),
      projectId: Joi.string()
    }),

    id: Joi.string()
      .required()
      .messages({
        'any.required': 'ID는 필수입니다',
        'string.base': 'ID는 문자열이어야 합니다'
      }),

    // 단일 값 검증용 스키마들
    email: Joi.string()
      .email()
      .messages({
        'string.email': '유효한 이메일 주소를 입력해주세요'
      }),

    positiveInteger: Joi.number()
      .integer()
      .min(1)
      .messages({
        'number.base': '숫자를 입력해주세요',
        'number.integer': '정수를 입력해주세요',
        'number.min': '1 이상의 숫자를 입력해주세요'
      }),

    hexColor: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .messages({
        'string.pattern.base': '유효한 헥스 코드를 입력해주세요 (예: #FF0000)'
      })
  };

  // 일반적인 검증 메서드 (ObjectSchema용)
  private static validate<T>(schema: Joi.ObjectSchema, data: any): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors: Record<string, string[]> = {};

      error.details.forEach(detail => {
        const field = detail.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(detail.message);
      });

      throw new ValidationError('입력 데이터가 유효하지 않습니다', errors);
    }

    return value as T;
  }

  // 단일 값 검증 메서드 (StringSchema, NumberSchema 등)
  private static validateSingle<T>(schema: Joi.Schema, data: any): T {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      convert: true
    });

    if (error) {
      const errorMessage = error.details[0]?.message || '값이 유효하지 않습니다';
      throw new ValidationError(errorMessage, { value: [errorMessage] });
    }

    return value as T;
  }

  // 로그인 데이터 검증
  static validateLoginData(data: any): LoginData {
    return this.validate<LoginData>(this.schemas.login, data);
  }

  // 사용자 생성 데이터 검증
  static validateCreateUserData(data: any): CreateUserData {
    return this.validate<CreateUserData>(this.schemas.createUser, data);
  }

  // 사용자 업데이트 데이터 검증
  static validateUpdateUserData(data: any): UpdateUserData {
    return this.validate<UpdateUserData>(this.schemas.updateUser, data);
  }

  // 프로젝트 생성 데이터 검증
  static validateCreateProjectData(data: any): CreateProjectData {
    return this.validate<CreateProjectData>(this.schemas.createProject, data);
  }

  // 프로젝트 업데이트 데이터 검증
  static validateUpdateProjectData(data: any): UpdateProjectData {
    return this.validate<UpdateProjectData>(this.schemas.updateProject, data);
  }

  // 스케줄 생성 데이터 검증
  static validateCreateScheduleData(data: any): CreateScheduleData {
    return this.validate<CreateScheduleData>(this.schemas.createSchedule, data);
  }

  // 스케줄 업데이트 데이터 검증
  static validateUpdateScheduleData(data: any): UpdateScheduleData {
    return this.validate<UpdateScheduleData>(this.schemas.updateSchedule, data);
  }

  // 쿼리 파라미터 검증
  static validateQueryParams(data: any): QueryParams {
    return this.validate<QueryParams>(this.schemas.queryParams, data);
  }

  // ID 검증
  static validateId(data: any): string {
    return this.validateSingle<string>(this.schemas.id, data);
  }

  // 이메일 검증 (단일 값)
  static validateEmailSingle(data: any): string {
    return this.validateSingle<string>(this.schemas.email, data);
  }

  // 양의 정수 검증
  static validatePositiveInteger(data: any): number {
    return this.validateSingle<number>(this.schemas.positiveInteger, data);
  }

  // 헥스 코드 검증
  static validateHexColorSingle(data: any): string {
    return this.validateSingle<string>(this.schemas.hexColor, data);
  }

  // 커스텀 검증 메서드들
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('비밀번호는 최소 8자 이상이어야 합니다');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('비밀번호는 최소 1개의 대문자를 포함해야 합니다');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('비밀번호는 최소 1개의 소문자를 포함해야 합니다');
    }

    if (!/\d/.test(password)) {
      errors.push('비밀번호는 최소 1개의 숫자를 포함해야 합니다');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('비밀번호는 최소 1개의 특수문자를 포함해야 합니다');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateDateRange(startDate: string, endDate: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }

  static validateHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }
}

export default ValidationService;
