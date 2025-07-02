import { CreateUserInput, UpdateUserInput } from '../../src/models/User';
import { Status, Priority } from '@prisma/client';

// 유효한 사용자 생성 데이터
export const validUserData: CreateUserInput = {
  username: 'testuser',
  password: 'TestPassword123!',
  name: 'Test User'
};

// 유효한 사용자 업데이트 데이터
export const validUpdateData: UpdateUserInput = {
  name: 'Updated Test User'
};

// 잘못된 사용자 데이터 모음
export const invalidUserData = {
  emptyUsername: {
    username: '',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  shortUsername: {
    username: 'ab',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  longUsername: {
    username: 'a'.repeat(51),
    password: 'TestPassword123!',
    name: 'Test User'
  },
  invalidUsernameChars: {
    username: 'test@user',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  emptyPassword: {
    username: 'testuser',
    password: '',
    name: 'Test User'
  },
  shortPassword: {
    username: 'testuser',
    password: '123',
    name: 'Test User'
  },
  weakPassword: {
    username: 'testuser',
    password: 'password',
    name: 'Test User'
  },
  emptyName: {
    username: 'testuser',
    password: 'TestPassword123!',
    name: ''
  },
  longName: {
    username: 'testuser',
    password: 'TestPassword123!',
    name: 'a'.repeat(101)
  }
};

// 로그인 데이터
export const validLoginData = {
  username: 'testuser',
  password: 'TestPassword123!'
};

export const invalidLoginData = {
  emptyUsername: {
    username: '',
    password: 'TestPassword123!'
  },
  emptyPassword: {
    username: 'testuser',
    password: ''
  },
  wrongPassword: {
    username: 'testuser',
    password: 'WrongPassword123!'
  },
  nonExistentUser: {
    username: 'nonexistent',
    password: 'TestPassword123!'
  }
};

// 프로젝트 데이터
export const validProjectData = {
  name: 'Test Project',
  description: 'This is a test project description',
  color: '#FF0000',
  userId: 'user-id'
};

export const invalidProjectData = {
  emptyName: {
    name: '',
    description: 'Description',
    color: '#FF0000',
    userId: 'user-id'
  },
  longName: {
    name: 'a'.repeat(256),
    description: 'Description',
    color: '#FF0000',
    userId: 'user-id'
  },
  longDescription: {
    name: 'Project Name',
    description: 'a'.repeat(1001),
    color: '#FF0000',
    userId: 'user-id'
  },
  invalidColor: {
    name: 'Project Name',
    description: 'Description',
    color: 'invalid-color',
    userId: 'user-id'
  },
  missingUserId: {
    name: 'Project Name',
    description: 'Description',
    color: '#FF0000'
  }
};

// 스케줄 데이터
export const validScheduleData = {
  title: 'Test Schedule',
  description: 'This is a test schedule',
  startDate: new Date('2024-01-01T09:00:00Z'),
  endDate: new Date('2024-01-01T17:00:00Z'),
  status: Status.PENDING,
  priority: Priority.MEDIUM,
  projectId: 'project-id',
  userId: 'user-id'
};

export const invalidScheduleData = {
  emptyTitle: {
    title: '',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id'
  },
  longTitle: {
    title: 'a'.repeat(256),
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id'
  },
  longDescription: {
    title: 'Test Schedule',
    description: 'a'.repeat(1001),
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id'
  },
  invalidDateRange: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T17:00:00Z'),
    endDate: new Date('2024-01-01T09:00:00Z'), // 시작일이 종료일보다 늦음
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id'
  },
  sameDateTime: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T09:00:00Z'), // 시작일과 종료일이 같음
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id'
  },
  invalidStatus: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: 'INVALID_STATUS' as any,
    priority: Priority.MEDIUM,
    projectId: 'project-id',
    userId: 'user-id'
  },
  invalidPriority: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.PENDING,
    priority: 'INVALID_PRIORITY' as any,
    projectId: 'project-id',
    userId: 'user-id'
  },
  missingProjectId: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    userId: 'user-id'
  },
  missingUserId: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z'),
    status: Status.PENDING,
    priority: Priority.MEDIUM,
    projectId: 'project-id'
  }
};

// 업데이트용 스케줄 데이터
export const validScheduleUpdateData = {
  title: 'Updated Schedule',
  description: 'Updated description',
  status: Status.IN_PROGRESS,
  priority: Priority.HIGH
};

// 쿼리 파라미터 테스트 데이터
export const validQueryParams = {
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
  search: 'test'
};

export const invalidQueryParams = {
  negativePage: {
    page: -1,
    limit: 10
  },
  zeroPage: {
    page: 0,
    limit: 10
  },
  invalidLimit: {
    page: 1,
    limit: 101 // 최대 100을 초과
  },
  invalidSortBy: {
    page: 1,
    limit: 10,
    sortBy: 'invalidField'
  },
  invalidSortOrder: {
    page: 1,
    limit: 10,
    sortOrder: 'invalid' as any
  }
};

// 에러 테스트용 데이터
export const errorTestData = {
  databaseError: {
    message: 'Database connection failed',
    code: 'DB_CONNECTION_ERROR'
  },
  validationError: {
    message: 'Validation failed',
    errors: {
      username: ['Username is required'],
      password: ['Password must be at least 8 characters']
    }
  },
  authenticationError: {
    message: 'Authentication failed',
    code: 'AUTH_FAILED'
  },
  authorizationError: {
    message: 'Access denied',
    code: 'ACCESS_DENIED'
  },
  notFoundError: {
    message: 'Resource not found',
    code: 'NOT_FOUND'
  },
  conflictError: {
    message: 'Resource already exists',
    code: 'CONFLICT'
  }
};

// 성능 테스트용 데이터
export const performanceTestData = {
  largeDataset: {
    userCount: 1000,
    projectCount: 100,
    scheduleCount: 10000
  },
  bulkOperations: {
    batchSize: 100,
    totalItems: 1000
  }
};

// Edge case 테스트 데이터
export const edgeCaseData = {
  veryLongStrings: {
    maxLengthName: 'a'.repeat(255),
    maxLengthDescription: 'b'.repeat(1000),
    exceedsMaxName: 'a'.repeat(256),
    exceedsMaxDescription: 'b'.repeat(1001)
  },
  specialCharacters: {
    unicodeTitle: '특수문자 테스트 🚀 ✨ 📅',
    emojiDescription: '이모지가 포함된 설명 😀 🎉 📝',
    sqlInjection: "'; DROP TABLE users; --",
    xssAttempt: '<script>alert("xss")</script>',
    pathTraversal: '../../../etc/passwd'
  },
  boundaryDates: {
    earlyDate: new Date('1900-01-01T00:00:00Z'),
    farFutureDate: new Date('2100-12-31T23:59:59Z'),
    leapYearDate: new Date('2024-02-29T12:00:00Z'),
    dstTransition: new Date('2024-03-10T07:00:00Z') // DST transition in US
  },
  timeZones: {
    utc: '2024-01-01T12:00:00Z',
    est: '2024-01-01T12:00:00-05:00',
    pst: '2024-01-01T12:00:00-08:00',
    kst: '2024-01-01T12:00:00+09:00',
    ist: '2024-01-01T12:00:00+05:30'
  }
};

// 동시성 테스트용 데이터
export const concurrencyTestData = {
  duplicateOperations: {
    simultaneousCreates: 10,
    simultaneousUpdates: 5,
    simultaneousDeletes: 3
  },
  raceConditions: {
    userCreation: {
      username: 'racetest',
      password: 'RaceTest123!',
      name: 'Race Test User'
    },
    projectCreation: {
      name: 'Race Test Project',
      description: 'Project for race condition testing',
      color: '#FF0000',
      userId: 'race-user-id'
    }
  }
};

// 보안 테스트용 데이터
export const securityTestData = {
  injection: {
    sqlInjection: [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1' UNION SELECT * FROM users --"
    ],
    nosqlInjection: [
      "{ $ne: null }",
      "{ $regex: '.*' }",
      "{ $where: 'this.password.length > 0' }"
    ],
    xss: [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>"
    ]
  },
  authentication: {
    invalidTokens: [
      'invalid.token.here',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
    ],
    expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid'
  },
  authorization: {
    unauthorizedActions: [
      'delete other user account',
      'modify other user data',
      'access admin endpoints',
      'bypass permission checks'
    ]
  }
};

// API 응답 형식 테스트용 데이터
export const apiResponseTestData = {
  successResponse: {
    success: true,
    data: {},
    message: 'Operation completed successfully',
    timestamp: new Date().toISOString(),
    requestId: 'test-request-id'
  },
  errorResponse: {
    success: false,
    error: 'Operation failed',
    timestamp: new Date().toISOString(),
    requestId: 'test-request-id'
  },
  validationErrorResponse: {
    success: false,
    error: 'Validation failed',
    errors: {
      field1: ['Error message 1'],
      field2: ['Error message 2']
    },
    timestamp: new Date().toISOString(),
    requestId: 'test-request-id'
  }
};
