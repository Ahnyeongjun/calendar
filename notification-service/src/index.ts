import dotenv from 'dotenv';
import { NotificationServer } from './server';

// 환경 변수 로드
dotenv.config();

console.log('🚀 Starting Calendar Notification Service...');
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Kafka Brokers: ${process.env.KAFKA_BROKERS || 'localhost:9092'}`);
console.log(`🤖 Discord Bot: ${process.env.DISCORD_BOT_TOKEN ? 'Configured' : 'Not configured'}`);

async function main() {
  try {
    const server = new NotificationServer();
    await server.start();
  } catch (error) {
    console.error('❌ Failed to start notification service:', error);
    process.exit(1);
  }
}

// 서비스 시작
main();
