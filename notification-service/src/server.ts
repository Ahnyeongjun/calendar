import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { NotificationManager } from './services/notification.manager';
import { Logger } from './utils/logger';
import { validateEnvVars } from './config/env.validation';
import { MetricsCollector } from './utils/metrics';

export class NotificationServer {
  private app: express.Application;
  private notificationManager: NotificationManager;
  private metricsCollector: MetricsCollector;
  private logger: Logger;
  private port: number;
  private startTime: Date;

  constructor() {
    this.app = express();
    this.logger = new Logger('NotificationServer');
    this.metricsCollector = new MetricsCollector();
    this.notificationManager = new NotificationManager(this.logger, this.metricsCollector);
    this.port = parseInt(process.env.PORT || '3002');
    this.startTime = new Date();
    
    // 환경 변수 검증
    this.validateEnvironment();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 환경 변수 검증
   */
  private validateEnvironment(): void {
    try {
      validateEnvVars();
      this.logger.info('Environment variables validated successfully');
    } catch (error) {
      this.logger.error('Environment validation failed', error);
      process.exit(1);
    }
  }

  /**
   * 미들웨어 설정
   */
  private setupMiddleware(): void {
    // CORS 설정
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // HTTP 요청 로깅
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          this.logger.info(message.trim(), 'HTTP');
        }
      }
    }));

    // JSON 파싱
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 요청 ID 추가
    this.app.use((req, res, next) => {
      req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // 메트릭스 수집
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordHttpRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration
        );
      });
      
      next();
    });

    this.logger.info('Middleware setup completed');
  }

  /**
   * 라우트 설정
   */
  private setupRoutes(): void {
    // 헬스 체크
    this.app.get('/health', (req, res) => {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'notification-service',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        environment: process.env.NODE_ENV || 'development',
        dependencies: this.notificationManager.getHealthStatus(),
        requestId: req.id
      };

      const isHealthy = Object.values(healthStatus.dependencies).every(status => status === 'healthy');
      
      res.status(isHealthy ? 200 : 503).json(healthStatus);
    });

    // 상세 상태 정보
    this.app.get('/status', (req, res) => {
      const stats = this.notificationManager.getStats();
      const metrics = this.metricsCollector.getMetrics();
      
      res.json({
        status: 'running',
        stats,
        metrics,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    });

    // 커스텀 알림 전송
    this.app.post('/notify', async (req, res) => {
      try {
        const { userId, message, metadata, type = 'CUSTOM' } = req.body;
        
        // 입력 검증
        if (!userId || !message) {
          return res.status(400).json({
            error: 'userId and message are required',
            requestId: req.id
          });
        }

        await this.notificationManager.sendCustomNotification(userId, message, type, metadata);
        
        this.logger.info('Custom notification sent successfully', 'API', { 
          userId, 
          type,
          requestId: req.id 
        });
        
        res.json({
          success: true,
          message: 'Notification queued successfully',
          requestId: req.id
        });
      } catch (error) {
        this.logger.error('Error sending custom notification', 'API', { 
          error,
          requestId: req.id 
        });
        
        res.status(500).json({
          error: 'Failed to send notification',
          requestId: req.id
        });
      }
    });

    // 알림 기록 조회
    this.app.get('/notifications/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const notifications = await this.notificationManager.getNotificationHistory(
          userId,
          parseInt(limit as string),
          parseInt(offset as string)
        );
        
        res.json({
          success: true,
          data: notifications,
          requestId: req.id
        });
      } catch (error) {
        this.logger.error('Error fetching notification history', 'API', { 
          error,
          requestId: req.id 
        });
        
        res.status(500).json({
          error: 'Failed to fetch notification history',
          requestId: req.id
        });
      }
    });

    // 메트릭스 (Prometheus 형식)
    this.app.get('/metrics', (req, res) => {
      const stats = this.notificationManager.getStats();
      const metrics = this.metricsCollector.getMetrics();
      
      const prometheusMetrics = `
# HELP notification_events_processed_total Total number of notification events processed
# TYPE notification_events_processed_total counter
notification_events_processed_total ${stats.eventsProcessed}

# HELP discord_notifications_sent_total Total number of Discord notifications sent
# TYPE discord_notifications_sent_total counter
discord_notifications_sent_total ${stats.notificationsSent}

# HELP reminders_scheduled_total Total number of reminders scheduled
# TYPE reminders_scheduled_total counter
reminders_scheduled_total ${stats.remindersScheduled}

# HELP service_uptime_seconds Service uptime in seconds
# TYPE service_uptime_seconds gauge
service_uptime_seconds ${stats.uptime}

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.totalRequests}

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum ${metrics.totalDuration / 1000}
http_request_duration_seconds_count ${metrics.totalRequests}

# HELP notification_errors_total Total number of notification errors
# TYPE notification_errors_total counter
notification_errors_total ${stats.errors || 0}
      `.trim();

      res.set('Content-Type', 'text/plain');
      res.send(prometheusMetrics);
    });

    // 알림 설정 관리
    this.app.get('/settings/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const settings = await this.notificationManager.getUserSettings(userId);
        
        res.json({
          success: true,
          data: settings,
          requestId: req.id
        });
      } catch (error) {
        this.logger.error('Error fetching user settings', 'API', { 
          error,
          requestId: req.id 
        });
        
        res.status(500).json({
          error: 'Failed to fetch user settings',
          requestId: req.id
        });
      }
    });

    this.app.put('/settings/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const settings = req.body;
        
        await this.notificationManager.updateUserSettings(userId, settings);
        
        res.json({
          success: true,
          message: 'Settings updated successfully',
          requestId: req.id
        });
      } catch (error) {
        this.logger.error('Error updating user settings', 'API', { 
          error,
          requestId: req.id 
        });
        
        res.status(500).json({
          error: 'Failed to update user settings',
          requestId: req.id
        });
      }
    });

    // 관리자 API - 통계 조회
    this.app.get('/admin/stats', (req, res) => {
      const stats = this.notificationManager.getDetailedStats();
      const systemMetrics = this.metricsCollector.getSystemMetrics();
      
      res.json({
        success: true,
        data: {
          ...stats,
          system: systemMetrics
        },
        requestId: req.id
      });
    });

    // 관리자 API - 서비스 재시작
    this.app.post('/admin/restart', async (req, res) => {
      try {
        this.logger.info('Service restart requested', 'ADMIN', { requestId: req.id });
        
        res.json({
          success: true,
          message: 'Service restart initiated',
          requestId: req.id
        });
        
        // 우아한 재시작
        setTimeout(() => {
          this.gracefulShutdown('restart');
        }, 1000);
        
      } catch (error) {
        this.logger.error('Error during restart', 'ADMIN', { 
          error,
          requestId: req.id 
        });
        
        res.status(500).json({
          error: 'Failed to restart service',
          requestId: req.id
        });
      }
    });

    // 404 핸들러
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
          'GET /health',
          'GET /status',
          'GET /metrics',
          'POST /notify',
          'GET /notifications/:userId',
          'GET /settings/:userId',
          'PUT /settings/:userId',
          'GET /admin/stats',
          'POST /admin/restart'
        ],
        requestId: req.id
      });
    });

    this.logger.info('Routes setup completed');
  }

  /**
   * 에러 핸들링 설정
   */
  private setupErrorHandling(): void {
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.error('Express error handler', 'EXPRESS', { 
        error: error.message,
        stack: error.stack,
        requestId: req.id
      });
      
      res.status(error.status || 500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        requestId: req.id
      });
    });

    this.logger.info('Error handling setup completed');
  }

  /**
   * 서버 시작
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting Notification Service...');
      
      // Notification Manager 초기화
      await this.notificationManager.initialize();

      // Express 서버 시작
      const server = this.app.listen(this.port, () => {
        this.logger.info(`🌐 Notification API server running on port ${this.port}`);
        this.logger.info(`📍 Health check: http://localhost:${this.port}/health`);
        this.logger.info(`📊 Status endpoint: http://localhost:${this.port}/status`);
        this.logger.info(`📈 Metrics endpoint: http://localhost:${this.port}/metrics`);
        this.logger.info('Notification service started successfully');
      });

      // 서버 에러 핸들링
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          this.logger.error(`Port ${this.port} is already in use`, 'SERVER');
        } else {
          this.logger.error('Server error', 'SERVER', error);
        }
        process.exit(1);
      });

      // Graceful shutdown 처리
      this.setupGracefulShutdown(server);

    } catch (error) {
      this.logger.error('Failed to start notification server', 'SERVER', error);
      process.exit(1);
    }
  }

  /**
   * 우아한 종료 설정
   */
  private setupGracefulShutdown(server: any): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`🛑 Received ${signal}, starting graceful shutdown...`, 'SHUTDOWN');
      
      try {
        // 새로운 요청 받지 않기
        server.close(() => {
          this.logger.info('HTTP server closed', 'SHUTDOWN');
        });
        
        // Notification Manager 종료
        await this.notificationManager.shutdown();
        
        this.logger.info('✅ Graceful shutdown completed', 'SHUTDOWN');
        process.exit(0);
      } catch (error) {
        this.logger.error('❌ Error during shutdown', 'SHUTDOWN', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      this.logger.error('❌ Uncaught Exception', 'PROCESS', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('❌ Unhandled Rejection', 'PROCESS', { reason, promise });
      shutdown('unhandledRejection');
    });
  }

  /**
   * 우아한 재시작
   */
  private gracefulShutdown(reason: string): void {
    this.logger.info(`Graceful shutdown initiated: ${reason}`, 'SHUTDOWN');
    process.exit(0);
  }
}

// Request 타입 확장
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
