import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { NotificationManager } from './services/notification.manager';

export class NotificationServer {
  private app: express.Application;
  private notificationManager: NotificationManager;
  private port: number;

  constructor() {
    this.app = express();
    this.notificationManager = new NotificationManager();
    this.port = parseInt(process.env.PORT || '3002');
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(morgan('combined'));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'notification-service',
      });
    });

    // Service status
    this.app.get('/status', (req, res) => {
      const stats = this.notificationManager.getStats();
      res.json({
        status: 'running',
        stats,
        timestamp: new Date().toISOString(),
      });
    });

    // Send custom notification
    this.app.post('/notify', async (req, res) => {
      try {
        const { userId, message, metadata } = req.body;
        
        if (!userId || !message) {
          return res.status(400).json({
            error: 'userId and message are required',
          });
        }

        await this.notificationManager.sendCustomNotification(userId, message, metadata);
        
        res.json({
          success: true,
          message: 'Notification queued successfully',
        });
      } catch (error) {
        console.error('Error sending custom notification:', error);
        res.status(500).json({
          error: 'Failed to send notification',
        });
      }
    });

    // Get service metrics
    this.app.get('/metrics', (req, res) => {
      const stats = this.notificationManager.getStats();
      
      // Prometheus 스타일 메트릭 (향후 모니터링 시스템 연동용)
      const metrics = `
# HELP calendar_events_processed_total Total number of calendar events processed
# TYPE calendar_events_processed_total counter
calendar_events_processed_total ${stats.eventsProcessed}

# HELP discord_notifications_sent_total Total number of Discord notifications sent
# TYPE discord_notifications_sent_total counter
discord_notifications_sent_total ${stats.notificationsSent}

# HELP reminders_scheduled_total Total number of reminders scheduled
# TYPE reminders_scheduled_total counter
reminders_scheduled_total ${stats.remindersScheduled}

# HELP service_uptime_seconds Service uptime in seconds
# TYPE service_uptime_seconds gauge
service_uptime_seconds ${stats.uptime}
      `.trim();

      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
          'GET /health',
          'GET /status', 
          'GET /metrics',
          'POST /notify'
        ],
      });
    });
  }

  private setupErrorHandling() {
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Express error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      });
    });
  }

  async start() {
    try {
      // Notification Manager 초기화
      await this.notificationManager.initialize();

      // Express 서버 시작
      this.app.listen(this.port, () => {
        console.log(`🌐 Notification API server running on port ${this.port}`);
        console.log(`📍 Health check: http://localhost:${this.port}/health`);
        console.log(`📊 Status endpoint: http://localhost:${this.port}/status`);
        console.log(`📈 Metrics endpoint: http://localhost:${this.port}/metrics`);
      });

      // Graceful shutdown 처리
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start notification server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        await this.notificationManager.shutdown();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}
