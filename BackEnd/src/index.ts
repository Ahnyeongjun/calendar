import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/config';
import { logger } from './services/logger';
import { testConnection, seedDatabase } from './config/prisma';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

const app = express();

// 설정 검증
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

// 미들웨어
app.use(cors({
  origin: config.server.isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP 요청 로깅 (개발 환경에서만)
if (config.server.isDevelopment) {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.info(message.trim(), 'HTTP');
      }
    }
  }));
}

// 라우트
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schedules', scheduleRoutes);

// 헬스 체크
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Calendar API Server',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.server.nodeEnv
  });
});

app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.server.nodeEnv
  });
});

// 404 에러 핸들러 (라우트 다음에 위치)
app.use(notFoundHandler);

// 전역 에러 핸들러 (마지막에 위치)
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    logger.info('Starting Calendar API Server...', 'SERVER');
    
    // 데이터베이스 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    // 초기 데이터 설정
    await seedDatabase();
    
    // 서버 시작
    app.listen(config.server.port, () => {
      logger.info(
        `Server running on http://localhost:${config.server.port}`, 
        'SERVER'
      );
      logger.info(
        `Environment: ${config.server.nodeEnv}`, 
        'SERVER'
      );
      logger.info(
        `Kafka: ${config.kafka.enabled ? 'enabled' : 'disabled'}`, 
        'SERVER'
      );
    });
  } catch (error) {
    logger.error('Server startup failed', 'SERVER', error);
    process.exit(1);
  }
}

// 예상치 못한 에러 처리
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception - shutting down', 'SERVER', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection - shutting down', 'SERVER', { reason, promise });
  process.exit(1);
});

// 우아한 종료
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', 'SERVER');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', 'SERVER');
  process.exit(0);
});

startServer();
