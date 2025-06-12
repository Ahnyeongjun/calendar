interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // Kafka 설정
  KAFKA_BROKERS: string;
  KAFKA_CLIENT_ID: string;
  KAFKA_GROUP_ID: string;
  
  // Discord 설정
  DISCORD_BOT_TOKEN?: string;
  DISCORD_CHANNEL_ID?: string;
  
  // 기타 설정
  ALLOWED_ORIGINS?: string;
  LOG_LEVEL?: string;
}

/**
 * 환경 변수 검증 및 파싱
 */
export function validateEnvVars(): EnvConfig {
  const errors: string[] = [];
  
  // NODE_ENV 검증
  const nodeEnv = process.env.NODE_ENV as 'development' | 'production' | 'test';
  if (!nodeEnv || !['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push('NODE_ENV must be one of: development, production, test');
  }
  
  // PORT 검증
  const port = parseInt(process.env.PORT || '3002', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }
  
  // Kafka 설정 검증
  const kafkaBrokers = process.env.KAFKA_BROKERS;
  if (!kafkaBrokers) {
    errors.push('KAFKA_BROKERS is required');
  }
  
  const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'notification-service';
  const kafkaGroupId = process.env.KAFKA_GROUP_ID || 'notification-group';
  
  // Discord 설정 검증 (선택적)
  const discordBotToken = process.env.DISCORD_BOT_TOKEN;
  const discordChannelId = process.env.DISCORD_CHANNEL_ID;
  
  if (discordBotToken && !discordChannelId) {
    errors.push('DISCORD_CHANNEL_ID is required when DISCORD_BOT_TOKEN is provided');
  }
  
  // 에러가 있으면 예외 발생
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    KAFKA_BROKERS: kafkaBrokers!,
    KAFKA_CLIENT_ID: kafkaClientId,
    KAFKA_GROUP_ID: kafkaGroupId,
    DISCORD_BOT_TOKEN: discordBotToken,
    DISCORD_CHANNEL_ID: discordChannelId,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    LOG_LEVEL: process.env.LOG_LEVEL
  };
}

/**
 * 환경별 설정 가져오기
 */
export function getConfig(): EnvConfig {
  return validateEnvVars();
}

/**
 * 개발 환경 여부 확인
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 프로덕션 환경 여부 확인
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 테스트 환경 여부 확인
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
