import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, seedDatabase } from './config/prisma';
import { initSentry, Sentry } from './config/sentry';
import { initRedis } from './config/cache';
import {
  sentryRequestHandler,
  sentryErrorHandler,
  sentryTracingHandler,
  performanceMiddleware,
  errorResponseMiddleware,
  setupGlobalErrorHandlers
} from './middleware/sentryMiddleware';
import { cacheStatusMiddleware, cacheFlushMiddleware } from './middleware/cacheMiddleware';

// 라우트 가져오기
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

// 환경 변수 로드
dotenv.config();

// Sentry 초기화 (가장 먼저!)
initSentry();

// 전역 에러 핸들러 설정
setupGlobalErrorHandlers();

const app: Express = express();
const port = process.env.PORT || 3001;

// 미들웨어 설정
// Sentry 요청 핸들러 (가장 먼저)
app.use(sentryRequestHandler);

// 성능 모니터링
app.use(performanceMiddleware);

// 기본 미들웨어
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Sentry 트랜잭션 추적
app.use(sentryTracingHandler);

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/schedules', scheduleRoutes);

// 관리/모니터링 라우트
app.get('/api/cache/status', cacheStatusMiddleware);
app.delete('/api/cache/flush', cacheFlushMiddleware);

// 건강 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// 기본 라우트
app.get('/', (_req, res) => {
  res.json({ message: 'Calendar API 서버에 오신 것을 환영합니다!' });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Sentry 에러 핸들러 (마지막에)
app.use(sentryErrorHandler);

// 커스텀 에러 핸들러
app.use(errorResponseMiddleware);

// 서버 시작
const startServer = async () => {
  try {
    console.log('🚀 서버 시작 중...');

    // Redis 초기화
    console.log('💾 Redis 초기화 중...');
    await initRedis();

    // 데이터베이스 연결 테스트
    console.log('💾 데이터베이스 연결 테스트 중...');
    const isConnected = await testConnection();

    if (!isConnected) {
      throw new Error('데이터베이스 연결에 실패했습니다.');
    }

    // 초기 데이터 설정
    console.log('🌱 초기 데이터 설정 중...');
    await seedDatabase();

    // 서버 시작
    app.listen(port, () => {
      console.log(`🎉 서버가 http://localhost:${port} 에서 실행 중입니다.`);
      console.log(`🔍 모니터링: http://localhost:${port}/health`);
      console.log(`💾 캐시 상태: http://localhost:${port}/api/cache/status`);

      // Sentry에 서버 시작 이벤트 전송
      Sentry.addBreadcrumb({
        message: 'Server started successfully',
        level: 'info',
        data: { port, environment: process.env.NODE_ENV }
      });
    });
  } catch (error) {
    console.error('❌ 서버 시작 중 오류 발생:', error);

    // Sentry에 시작 실패 에러 전송
    Sentry.captureException(error as Error, {
      tags: { component: 'server-startup' },
      level: 'fatal'
    });

    // Sentry 전송 완료 후 종료
    await Sentry.flush(2000);
    process.exit(1);
  }
};

startServer();