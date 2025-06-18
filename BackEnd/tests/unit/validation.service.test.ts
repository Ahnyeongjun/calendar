import ValidationService from '../../src/services/validationService';
import { ValidationError } from '../../src/middleware/errorHandler';
import { validUserData, invalidUserData, validProjectData, invalidProjectData, validScheduleData, invalidScheduleData } from '../fixtures/data';

describe('ValidationService', () => {
  describe('validateLoginData', () => {
    it('유효한 로그인 데이터를 검증해야 한다', () => {
      const validData = {
        username: 'testuser',
        password: 'testpass'
      };

      const result = ValidationService.validateLoginData(validData);
      expect(result).toEqual(validData);
    });

    it('빈 사용자명에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidData = {
        username: '',
        password: 'testpass'
      };

      expect(() => ValidationService.validateLoginData(invalidData)).toThrow(ValidationError);
    });

    it('짧은 사용자명에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidData = {
        username: 'ab',
        password: 'testpass'
      };

      expect(() => ValidationService.validateLoginData(invalidData)).toThrow(ValidationError);
    });

    it('특수문자가 포함된 사용자명에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidData = {
        username: 'test@user',
        password: 'testpass'
      };

      expect(() => ValidationService.validateLoginData(invalidData)).toThrow(ValidationError);
    });

    it('빈 비밀번호에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidData = {
        username: 'testuser',
        password: ''
      };

      expect(() => ValidationService.validateLoginData(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateCreateUserData', () => {
    it('유효한 사용자 생성 데이터를 검증해야 한다', () => {
      const result = ValidationService.validateCreateUserData(validUserData);
      expect(result).toEqual(validUserData);
    });

    it('빈 이름에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateCreateUserData(invalidUserData.emptyName)).toThrow(ValidationError);
    });

    it('너무 긴 이름에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateCreateUserData(invalidUserData.longName)).toThrow(ValidationError);
    });

    it('짧은 비밀번호에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateCreateUserData(invalidUserData.shortPassword)).toThrow(ValidationError);
    });

    it('여러 필드가 잘못된 경우 모든 오류를 포함해야 한다', () => {
      const invalidData = {
        username: '',
        password: '',
        name: ''
      };

      try {
        ValidationService.validateCreateUserData(invalidData);
        fail('ValidationError가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.errors).toHaveProperty('username');
        expect(validationError.errors).toHaveProperty('password');
        expect(validationError.errors).toHaveProperty('name');
      }
    });
  });

  describe('validateUpdateUserData', () => {
    it('유효한 사용자 업데이트 데이터를 검증해야 한다', () => {
      const updateData = { name: 'Updated Name' };
      const result = ValidationService.validateUpdateUserData(updateData);
      expect(result).toEqual(updateData);
    });

    it('빈 객체에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateUpdateUserData({})).toThrow(ValidationError);
    });

    it('알려지지 않은 필드는 제거되어야 한다', () => {
      const dataWithUnknownField = {
        name: 'Updated Name',
        unknownField: 'should be removed'
      };

      const result = ValidationService.validateUpdateUserData(dataWithUnknownField);
      expect(result).toEqual({ name: 'Updated Name' });
      expect(result).not.toHaveProperty('unknownField');
    });
  });

  describe('validateCreateProjectData', () => {
    it('유효한 프로젝트 생성 데이터를 검증해야 한다', () => {
      const result = ValidationService.validateCreateProjectData(validProjectData);
      expect(result).toEqual(validProjectData);
    });

    it('색상 코드가 포함된 프로젝트 데이터를 검증해야 한다', () => {
      const dataWithColor = {
        ...validProjectData,
        color: '#FF0000'
      };

      const result = ValidationService.validateCreateProjectData(dataWithColor);
      expect(result).toEqual(dataWithColor);
    });

    it('잘못된 색상 코드에 대해 ValidationError를 발생시켜야 한다', () => {
      const dataWithInvalidColor = {
        ...validProjectData,
        color: 'invalid-color'
      };

      expect(() => ValidationService.validateCreateProjectData(dataWithInvalidColor)).toThrow(ValidationError);
    });

    it('빈 프로젝트명에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateCreateProjectData(invalidProjectData.emptyName)).toThrow(ValidationError);
    });

    it('너무 긴 설명에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateCreateProjectData(invalidProjectData.longDescription)).toThrow(ValidationError);
    });
  });

  describe('validateCreateScheduleData', () => {
    it('유효한 스케줄 생성 데이터를 검증해야 한다', () => {
      const scheduleData = {
        ...validScheduleData,
        startDate: validScheduleData.startDate.toISOString(),
        endDate: validScheduleData.endDate.toISOString(),
        projectId: 'project-id',
        userId: 'user-id'
      };

      const result = ValidationService.validateCreateScheduleData(scheduleData);
      expect(result.title).toBe(scheduleData.title);
      expect(result.description).toBe(scheduleData.description);
      expect(result.projectId).toBe(scheduleData.projectId);
      expect(result.userId).toBe(scheduleData.userId);
    });

    it('시작일이 종료일보다 늦은 경우 ValidationError를 발생시켜야 한다', () => {
      const invalidScheduleData = {
        title: 'Test Schedule',
        description: 'Description',
        startDate: '2024-01-01T17:00:00Z',
        endDate: '2024-01-01T09:00:00Z',
        projectId: 'project-id',
        userId: 'user-id'
      };

      expect(() => ValidationService.validateCreateScheduleData(invalidScheduleData)).toThrow(ValidationError);
    });

    it('빈 제목에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidData = {
        title: '',
        description: 'Description',
        startDate: '2024-01-01T09:00:00Z',
        endDate: '2024-01-01T17:00:00Z',
        projectId: 'project-id',
        userId: 'user-id'
      };

      expect(() => ValidationService.validateCreateScheduleData(invalidData)).toThrow(ValidationError);
    });

    it('잘못된 날짜 형식에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidData = {
        title: 'Test Schedule',
        description: 'Description',
        startDate: 'invalid-date',
        endDate: '2024-01-01T17:00:00Z',
        projectId: 'project-id',
        userId: 'user-id'
      };

      expect(() => ValidationService.validateCreateScheduleData(invalidData)).toThrow(ValidationError);
    });
  });

  describe('validateQueryParams', () => {
    it('유효한 쿼리 파라미터를 검증해야 한다', () => {
      const queryParams = {
        page: 2,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        search: 'test'
      };

      const result = ValidationService.validateQueryParams(queryParams);
      expect(result).toEqual(queryParams);
    });

    it('기본값을 적용해야 한다', () => {
      const emptyParams = {};
      const result = ValidationService.validateQueryParams(emptyParams);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('잘못된 정렬 필드에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidParams = {
        sortBy: 'invalidField'
      };

      expect(() => ValidationService.validateQueryParams(invalidParams)).toThrow(ValidationError);
    });

    it('음수 페이지에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidParams = {
        page: -1
      };

      expect(() => ValidationService.validateQueryParams(invalidParams)).toThrow(ValidationError);
    });

    it('제한 수가 100을 초과하는 경우 ValidationError를 발생시켜야 한다', () => {
      const invalidParams = {
        limit: 101
      };

      expect(() => ValidationService.validateQueryParams(invalidParams)).toThrow(ValidationError);
    });
  });

  describe('validateId', () => {
    it('유효한 ID를 검증해야 한다', () => {
      const validId = 'valid-id';
      const result = ValidationService.validateId(validId);
      expect(result).toBe(validId);
    });

    it('빈 ID에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateId('')).toThrow(ValidationError);
    });

    it('null ID에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateId(null)).toThrow(ValidationError);
    });

    it('undefined ID에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validateId(undefined)).toThrow(ValidationError);
    });
  });

  describe('validatePassword (커스텀)', () => {
    it('강력한 비밀번호에 대해 isValid true를 반환해야 한다', () => {
      const strongPassword = 'StrongPass123!';
      const result = ValidationService.validatePassword(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('약한 비밀번호에 대해 isValid false와 오류 목록을 반환해야 한다', () => {
      const weakPassword = 'weak';
      const result = ValidationService.validatePassword(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('비밀번호는 최소 8자 이상이어야 합니다');
      expect(result.errors).toContain('비밀번호는 최소 1개의 대문자를 포함해야 합니다');
      expect(result.errors).toContain('비밀번호는 최소 1개의 숫자를 포함해야 합니다');
      expect(result.errors).toContain('비밀번호는 최소 1개의 특수문자를 포함해야 합니다');
    });

    it('대문자가 없는 비밀번호에 대해 적절한 오류를 반환해야 한다', () => {
      const passwordWithoutUppercase = 'lowercase123!';
      const result = ValidationService.validatePassword(passwordWithoutUppercase);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 1개의 대문자를 포함해야 합니다');
    });

    it('소문자가 없는 비밀번호에 대해 적절한 오류를 반환해야 한다', () => {
      const passwordWithoutLowercase = 'UPPERCASE123!';
      const result = ValidationService.validatePassword(passwordWithoutLowercase);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 1개의 소문자를 포함해야 합니다');
    });

    it('숫자가 없는 비밀번호에 대해 적절한 오류를 반환해야 한다', () => {
      const passwordWithoutNumber = 'PasswordOnly!';
      const result = ValidationService.validatePassword(passwordWithoutNumber);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 1개의 숫자를 포함해야 합니다');
    });

    it('특수문자가 없는 비밀번호에 대해 적절한 오류를 반환해야 한다', () => {
      const passwordWithoutSpecial = 'Password123';
      const result = ValidationService.validatePassword(passwordWithoutSpecial);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('비밀번호는 최소 1개의 특수문자를 포함해야 합니다');
    });
  });

  describe('validateEmail', () => {
    it('유효한 이메일에 대해 true를 반환해야 한다', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.kr',
        'admin+test@company.org',
        'numbers123@test.net'
      ];

      validEmails.forEach(email => {
        expect(ValidationService.validateEmail(email)).toBe(true);
      });
    });

    it('잘못된 이메일에 대해 false를 반환해야 한다', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user.domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(ValidationService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validateDateRange', () => {
    it('유효한 날짜 범위에 대해 true를 반환해야 한다', () => {
      const startDate = '2024-01-01T09:00:00Z';
      const endDate = '2024-01-01T17:00:00Z';

      expect(ValidationService.validateDateRange(startDate, endDate)).toBe(true);
    });

    it('시작일이 종료일보다 늦은 경우 false를 반환해야 한다', () => {
      const startDate = '2024-01-01T17:00:00Z';
      const endDate = '2024-01-01T09:00:00Z';

      expect(ValidationService.validateDateRange(startDate, endDate)).toBe(false);
    });

    it('동일한 날짜에 대해 false를 반환해야 한다', () => {
      const sameDate = '2024-01-01T09:00:00Z';

      expect(ValidationService.validateDateRange(sameDate, sameDate)).toBe(false);
    });
  });

  describe('validateHexColor', () => {
    it('유효한 헥스 코드에 대해 true를 반환해야 한다', () => {
      const validColors = [
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFF',
        '#000',
        '#123ABC',
        '#abc123'
      ];

      validColors.forEach(color => {
        expect(ValidationService.validateHexColor(color)).toBe(true);
      });
    });

    it('잘못된 헥스 코드에 대해 false를 반환해야 한다', () => {
      const invalidColors = [
        'FF0000', // # 없음
        '#GGGGGG', // 잘못된 문자
        '#FF00', // 길이 부족
        '#FF00000', // 너무 긴 길이
        'red', // 색상 이름
        '#',
        ''
      ];

      invalidColors.forEach(color => {
        expect(ValidationService.validateHexColor(color)).toBe(false);
      });
    });
  });

  describe('validateEmailSingle', () => {
    it('유효한 이메일을 반환해야 한다', () => {
      const validEmail = 'test@example.com';
      const result = ValidationService.validateEmailSingle(validEmail);
      expect(result).toBe(validEmail);
    });

    it('잘못된 이메일에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidEmail = 'invalid-email';
      expect(() => ValidationService.validateEmailSingle(invalidEmail)).toThrow(ValidationError);
    });
  });

  describe('validatePositiveInteger', () => {
    it('양의 정수를 반환해야 한다', () => {
      const validNumber = 42;
      const result = ValidationService.validatePositiveInteger(validNumber);
      expect(result).toBe(validNumber);
    });

    it('문자열 숫자를 정수로 변환해야 한다', () => {
      const stringNumber = '123';
      const result = ValidationService.validatePositiveInteger(stringNumber);
      expect(result).toBe(123);
    });

    it('0에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validatePositiveInteger(0)).toThrow(ValidationError);
    });

    it('음수에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validatePositiveInteger(-1)).toThrow(ValidationError);
    });

    it('소수에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validatePositiveInteger(3.14)).toThrow(ValidationError);
    });

    it('숫자가 아닌 값에 대해 ValidationError를 발생시켜야 한다', () => {
      expect(() => ValidationService.validatePositiveInteger('not-a-number')).toThrow(ValidationError);
    });
  });

  describe('validateHexColorSingle', () => {
    it('유효한 헥스 코드를 반환해야 한다', () => {
      const validColor = '#FF0000';
      const result = ValidationService.validateHexColorSingle(validColor);
      expect(result).toBe(validColor);
    });

    it('잘못된 헥스 코드에 대해 ValidationError를 발생시켜야 한다', () => {
      const invalidColor = 'invalid-color';
      expect(() => ValidationService.validateHexColorSingle(invalidColor)).toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    it('ValidationError는 적절한 메시지와 오류 객체를 포함해야 한다', () => {
      try {
        ValidationService.validateCreateUserData({
          username: '',
          password: '',
          name: ''
        });
        fail('ValidationError가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        
        expect(validationError.message).toBe('입력 데이터가 유효하지 않습니다');
        expect(typeof validationError.errors).toBe('object');
        expect(Object.keys(validationError.errors).length).toBeGreaterThan(0);
      }
    });

    it('단일 값 검증에서 ValidationError는 적절한 구조를 가져야 한다', () => {
      try {
        ValidationService.validatePositiveInteger(-1);
        fail('ValidationError가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        
        expect(validationError.errors).toHaveProperty('value');
        expect(Array.isArray(validationError.errors.value)).toBe(true);
      }
    });
  });
});
