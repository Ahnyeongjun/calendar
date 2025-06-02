import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

class SimpleKafkaProducer {
  private kafka: Kafka;
  private producer: any;
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'calendar-backend',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 3,
      },
    });
    this.producer = this.kafka.producer();
  }

  async connect() {
    try {
      if (!this.isConnected) {
        await this.producer.connect();
        this.isConnected = true;
        console.log('✅ Backend Kafka producer connected');
      }
    } catch (error) {
      console.warn('⚠️ Kafka connection failed, notifications will be disabled:', error);
    }
  }

  async publishEvent(topic: string, key: string, data: any) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (this.isConnected) {
        await this.producer.send({
          topic,
          messages: [
            {
              key,
              value: JSON.stringify({
                ...data,
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        });
        console.log(`📤 Event published to ${topic}: ${data.title || key}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to publish event to Kafka:', error);
      // Kafka 실패해도 앱 동작은 계속되도록
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log('✅ Backend Kafka producer disconnected');
      }
    } catch (error) {
      console.warn('⚠️ Error disconnecting Kafka producer:', error);
    }
  }
}

export const kafkaProducer = new SimpleKafkaProducer();

// 애플리케이션 시작 시 연결
kafkaProducer.connect().catch(console.warn);

// 애플리케이션 종료 시 정리
process.on('SIGTERM', () => kafkaProducer.disconnect());
process.on('SIGINT', () => kafkaProducer.disconnect());
