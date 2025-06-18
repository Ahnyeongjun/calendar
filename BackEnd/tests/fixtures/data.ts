import { CreateUserInput, UpdateUserInput } from '../../src/models/User';

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
  description: 'This is a test project description'
};

export const invalidProjectData = {
  emptyName: {
    name: '',
    description: 'Description'
  },
  longName: {
    name: 'a'.repeat(101),
    description: 'Description'
  },
  longDescription: {
    name: 'Project Name',
    description: 'a'.repeat(501)
  }
};

// 스케줄 데이터
export const validScheduleData = {
  title: 'Test Schedule',
  description: 'This is a test schedule',
  startDate: new Date('2024-01-01T09:00:00Z'),
  endDate: new Date('2024-01-01T17:00:00Z')
};

export const invalidScheduleData = {
  emptyTitle: {
    title: '',
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z')
  },
  longTitle: {
    title: 'a'.repeat(201),
    description: 'Description',
    startDate: new Date('2024-01-01T09:00:00Z'),
    endDate: new Date('2024-01-01T17:00:00Z')
  },
  invalidDateRange: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2024-01-01T17:00:00Z'),
    endDate: new Date('2024-01-01T09:00:00Z') // 시작일이 종료일보다 늦음
  },
  pastDate: {
    title: 'Test Schedule',
    description: 'Description',
    startDate: new Date('2020-01-01T09:00:00Z'),
    endDate: new Date('2020-01-01T17:00:00Z')
  }
};
