import request from 'supertest';
import express from 'express';
import { TestDatabase } from './database';
import { v4 as uuidv4 } from 'uuid';
import { Status, Priority } from '@prisma/client';

export class TestServer {
  private app!: express.Application;
  private server: any;

  constructor() {
    this.setupApp();
  }

  private setupApp(): void {
    this.app = express();
    this.app.use(express.json());
    
    // 테스트용 기본 미들웨어 설정
    this.app.use((req, res, next) => {
      req.requestId = 'test-request-id';
      next();
    });
  }

  public setupRoutes(basePath: string, routes: any): void {
    this.app.use(basePath, routes);
    
    // 404 핸들러
    this.app.use('*', (req: any, res: any) => {
      res.status(404).json({
        success: false,
        error: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'test-request-id'
      });
    });
    
    // 전역 에러 핸들러
    this.app.use((error: any, req: any, res: any, next: any) => {
      return res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'test-request-id'
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getRequest() {
    return request(this.app);
  }

  public async start(port: number = 3001): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          resolve();
        });
      });
    }
  }
}

export const createTestServer = (): TestServer => {
  return new TestServer();
};

// 테스트용 인증 토큰 생성
export const generateTestToken = (userId: string = 'test-user-id', username: string = 'testuser', name: string = 'Test User'): string => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      id: userId,
      username: username,
      name: name
    },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

// 테스트용 사용자 생성
export const createTestUser = async (overrides: any = {}) => {
  let prisma;
  try {
    prisma = TestDatabase.getPrisma();
  } catch (error) {
    await TestDatabase.setup();
    prisma = TestDatabase.getPrisma();
  }
  
  const bcrypt = require('bcryptjs');
  
  const defaultPassword = 'TestPassword123!';
  const passwordToUse = overrides.password || defaultPassword;
  
  const { password, ...otherOverrides } = overrides;
  
  const userData = {
    id: uuidv4(),
    username: `test${Math.random().toString(36).substr(2, 8)}`,
    name: 'Test User',
    ...otherOverrides,
    password: await bcrypt.hash(passwordToUse, 12)
  };

  return await prisma.user.create({
    data: userData
  });
};

// 테스트용 프로젝트 생성
export const createTestProject = async (userId: string, overrides: any = {}) => {
  let prisma;
  try {
    prisma = TestDatabase.getPrisma();
  } catch (error) {
    await TestDatabase.setup();
    prisma = TestDatabase.getPrisma();
  }
  
  const projectData = {
    id: uuidv4(),
    name: 'Test Project',
    description: 'Test project description',
    color: '#FF0000',
    userId,
    ...overrides
  };

  return await prisma.project.create({
    data: projectData
  });
};

// 테스트용 스케줄 생성 - 수정된 필드명 사용
export const createTestSchedule = async (projectId: string, userId: string, overrides: any = {}) => {
  let prisma;
  try {
    prisma = TestDatabase.getPrisma();
  } catch (error) {
    await TestDatabase.setup();
    prisma = TestDatabase.getPrisma();
  }
  
  const now = new Date();
  const scheduleData = {
    id: uuidv4(),
    title: 'Test Schedule',
    description: 'Test schedule description',
    startDate: now, // 수정: date -> startDate
    endDate: new Date(now.getTime() + 60 * 60 * 1000), // 수정: 1시간 후
    status: Status.PENDING, // 수정: enum 값 사용
    priority: Priority.MEDIUM, // 수정: enum 값 사용
    projectId,
    userId,
    ...overrides
  };

  return await prisma.schedule.create({
    data: scheduleData
  });
};

// UUID 생성 (테스트용)
export const generateTestId = (): string => {
  return uuidv4();
};

// 테스트용 날짜 헬퍼
export const getTestDate = (daysFromNow: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

// 테스트용 시간 헬퍼
export const getTestDateTime = (hoursFromNow: number = 0): Date => {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date;
};

// 테스트 데이터 정리 헬퍼
export const cleanupTestData = async (): Promise<void> => {
  await TestDatabase.cleanup();
};

// 데이터베이스 연결 확인 헬퍼
export const ensureDatabaseConnection = async (): Promise<void> => {
  const isConnected = await TestDatabase.testConnection();
  if (!isConnected) {
    throw new Error('Test database connection failed');
  }
};

// Status, Priority export
export { Status, Priority };
