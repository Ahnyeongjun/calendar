import dotenv from 'dotenv';
import { NotificationServer } from './server';
import { Logger } from './utils/logger';
import { getConfig, isDevelopment } from './config/env.validation';

// 환경 변수 로드
dotenv.config();

const logger = new Logger('Main');

/**
 * 메인 함수
 */
async function main(): Promise<void> {
  try {
    // 환경 설정 검증 및 로딩
    const config = getConfig();
    
    logger.info('🚀 Starting Calendar Notification Service...');
    logger.info(`📝 Environment: ${config.NODE_ENV}`);
    logger.info(`🔗 Kafka Brokers: ${config.KAFKA_BROKERS}`);
    logger.info(`🤖 Discord Bot: ${config.DISCORD_BOT_TOKEN ? 'Configured' : 'Not configured'}`);
    logger.info(`🌐 Port: ${config.PORT}`);
    
    // 개발 환경에서 추가 정보 출력
    if (isDevelopment()) {
      logger.debug('Development mode enabled');
      logger.debug('Configuration details', 'CONFIG', {
        kafkaClientId: config.KAFKA_CLIENT_ID,
        kafkaGroupId: config.KAFKA_GROUP_ID,
        allowedOrigins: config.ALLOWED_ORIGINS
      });
    }
    
    // 서버 인스턴스 생성 및 시작
    const server = new NotificationServer();
    await server.start();
    
    logger.info('✅ Calendar Notification Service started successfully');
    
  } catch (error) {
    logger.error('❌ Failed to start notification service', 'STARTUP', error);
    process.exit(1);
  }
}

/**
 * 예외 처리 설정
 */
function setupExceptionHandlers(): void {
  // 처리되지 않은 예외
  process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception - shutting down', 'PROCESS', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

  // 처리되지 않은 Promise 거부
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection - shutting down', 'PROCESS', {
      reason,
      promise: promise.toString()
    });
    process.exit(1);
  });

  // 프로세스 종료 신호 처리
  process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received, shutting down gracefully', 'PROCESS');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received, shutting down gracefully', 'PROCESS');
    process.exit(0);
  });

  logger.info('Exception handlers setup completed', 'PROCESS');
}

/**
 * 서비스 시작
 */
(async () => {
  // 예외 처리 설정
  setupExceptionHandlers();
  
  // 메인 함수 실행
  await main();
})();
