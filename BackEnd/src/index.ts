import express from 'express';
import cors from 'cors';
import { config } from './config/config';
import { logger } from './services/logger';
import { testConnection, seedDatabase } from './config/prisma';
import { 
  errorHandler, 
  notFoundHandler, 
  requestIdMiddleware, 
  httpLoggingMiddleware 
} from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

class CalendarApp {
  private app: express.Application;
  private readonly APP_NAME = 'Calendar API Server';
  private readonly VERSION = '2.0.0';

  constructor() {
    this.app = express();
    this.validateConfiguration();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 환경 설정 검증
   */
  private validateConfiguration(): void {
    try {
      config.validate();
      logger.info('Configuration validated successfully', 'CONFIG');
      
      if (config.server.isDevelopment) {
        logger.debug('Configuration summary', 'CONFIG', config.getSummary());
      }
    } catch (error) {
      logger.error('Configuration validation failed', 'CONFIG', error);
      process.exit(1);
    }
  }

  /**
   * 미들웨어 설정
   */
  private setupMiddleware(): void {
    // Request ID 생성 (모든 요청에 고유 ID 부여)
    this.app.use(requestIdMiddleware);

    // CORS 설정
    this.app.use(cors({
      origin: this.getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }));

    // Body parser 설정
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // HTTP 요청 로깅 (개발 환경에서만)
    if (config.server.isDevelopment) {
      this.app.use(httpLoggingMiddleware);
    }

    // 보안 헤더 설정
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      if (config.server.isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      }
      
      next();
    });

    logger.info('Middleware setup completed', 'MIDDLEWARE');
  }

  /**
   * CORS origins 설정
   */
  private getCorsOrigins(): string | string[] | boolean {
    if (config.server.isDevelopment) {
      return true; // 개발 환경에서는 모든 origin 허용
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (allowedOrigins) {
      return allowedOrigins.split(',').map(origin => origin.trim());
    }

    return false; // 프로덕션에서 설정되지 않으면 모든 origin 차단
  }

  /**
   * 라우트 설정
   */
  private setupRoutes(): void {
    // API 라우트
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/projects', projectRoutes);
    this.app.use('/api/schedules', scheduleRoutes);

    // 루트 헬스 체크
    this.app.get('/', (req, res) => {
      res.json({
        name: this.APP_NAME,
        version: this.VERSION,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        requestId: req.requestId
      });
    });

    // 상세 헬스 체크
    this.app.get('/health', async (req, res) => {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: config.server.nodeEnv,
        version: this.VERSION,
        database: 'unknown',
        kafka: config.kafka.enabled ? 'enabled' : 'disabled',
        requestId: req.requestId
      };

      // 데이터베이스 연결 상태 확인
      try {
        const dbConnected = await testConnection();
        healthData.database = dbConnected ? 'connected' : 'disconnected';
        
        if (!dbConnected) {
          healthData.status = 'degraded';
        }
      } catch (error) {
        healthData.database = 'error';
        healthData.status = 'unhealthy';
      }

      const statusCode = healthData.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthData);
    });

    // API 정보 엔드포인트
    this.app.get('/api', (req, res) => {
      res.json({
        name: this.APP_NAME,
        version: this.VERSION,
        documentation: '/api/docs', // 향후 Swagger 문서 링크
        endpoints: {
          auth: '/api/auth',
          projects: '/api/projects',
          schedules: '/api/schedules'
        },
        requestId: req.requestId
      });
    });

    // API 상태 엔드포인트
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        services: {
          database: 'operational',
          authentication: 'operational',
          notification: config.kafka.enabled ? 'operational' : 'disabled'
        },
        requestId: req.requestId
      });
    });

    logger.info('Routes setup completed', 'ROUTES');
  }

  /**
   * 에러 핸들링 설정
   */
  private setupErrorHandling(): void {
    // 404 에러 핸들러 (라우트 다음에 위치)
    this.app.use(notFoundHandler);

    // 전역 에러 핸들러 (마지막에 위치)
    this.app.use(errorHandler);

    logger.info('Error handling setup completed', 'ERROR_HANDLING');
  }

  /**
   * 데이터베이스 초기화
   */
  private async initializeDatabase(): Promise<void> {
    try {
      logger.info('Initializing database connection...', 'DATABASE');
      
      // 데이터베이스 연결 테스트
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }
      
      // 초기 데이터 설정
      await seedDatabase();
      
      logger.info('Database initialization completed', 'DATABASE');
    } catch (error) {
      logger.error('Database initialization failed', 'DATABASE', error);
      throw error;
    }
  }

  /**
   * 프로세스 이벤트 핸들러 설정
   */
  private setupProcessHandlers(): void {
    // 예상치 못한 에러 처리
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception - shutting down', 'PROCESS', err);
      this.gracefulShutdown(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection - shutting down', 'PROCESS', { reason, promise });
      this.gracefulShutdown(1);
    });

    // 우아한 종료 신호 처리
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully', 'PROCESS');
      this.gracefulShutdown(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully', 'PROCESS');
      this.gracefulShutdown(0);
    });

    logger.info('Process handlers setup completed', 'PROCESS');
  }

  /**
   * 우아한 종료
   */
  private gracefulShutdown(exitCode: number): void {
    logger.info('Starting graceful shutdown...', 'SHUTDOWN');
    
    // 여기서 필요한 정리 작업 수행
    // - 데이터베이스 연결 종료
    // - Kafka 연결 종료
    // - 진행 중인 요청 완료 대기 등
    
    setTimeout(() => {
      logger.info('Graceful shutdown completed', 'SHUTDOWN');
      process.exit(exitCode);
    }, 5000); // 5초 후 강제 종료
  }

  /**
   * 서버 시작
   */
  public async start(): Promise<void> {
    try {
      logger.info(`Starting ${this.APP_NAME}...`, 'SERVER');
      
      // 데이터베이스 초기화
      await this.initializeDatabase();
      
      // 프로세스 이벤트 핸들러 설정
      this.setupProcessHandlers();
      
      // 서버 시작
      const server = this.app.listen(config.server.port, () => {
        logger.info(`Server running on http://localhost:${config.server.port}`, 'SERVER');
        logger.info(`Environment: ${config.server.nodeEnv}`, 'SERVER');
        logger.info(`Version: ${this.VERSION}`, 'SERVER');
        logger.info(`Kafka: ${config.kafka.enabled ? 'enabled' : 'disabled'}`, 'SERVER');
        logger.info('Server startup completed successfully', 'SERVER');
      });

      // 서버 에러 핸들링
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`Port ${config.server.port} is already in use`, 'SERVER', error);
        } else {
          logger.error('Server error', 'SERVER', error);
        }
        process.exit(1);
      });

    } catch (error) {
      logger.error('Server startup failed', 'SERVER', error);
      process.exit(1);
    }
  }

  /**
   * Express 앱 인스턴스 반환 (테스트용)
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// 서버 시작
const calendarApp = new CalendarApp();
calendarApp.start();

export default calendarApp;
