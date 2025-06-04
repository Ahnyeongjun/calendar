import { Kafka, Producer } from 'kafkajs';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

interface KafkaEventData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
}

class KafkaProducer {
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private isConnected = false;
  private isEnabled: boolean; // readonly 제거

  constructor() {
    this.isEnabled = process.env.KAFKA_ENABLED === 'true';
    
    if (this.isEnabled) {
      this.initializeKafka();
    } else {
      logger.info('Kafka is disabled - running in local mode', 'KAFKA');
    }
  }

  private initializeKafka(): void {
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

  async connect(): Promise<void> {
    if (!this.isEnabled || !this.producer) return;

    try {
      if (!this.isConnected) {
        await this.producer.connect();
        this.isConnected = true;
        logger.info('Kafka producer connected successfully', 'KAFKA');
      }
    } catch (error) {
      this.isEnabled = false; // 이제 수정 가능
      logger.warn('Kafka connection failed, switching to local mode', 'KAFKA', error);
    }
  }

  async publishEvent(topic: string, key: string, data: KafkaEventData): Promise<void> {
    if (!this.isEnabled) {
      logger.debug(`Local mode: Event skipped - ${topic}:${key} (${data.type}: ${data.title})`, 'KAFKA');
      return;
    }

    const startTime = Date.now();

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (this.isConnected && this.producer) {
        await this.producer.send({
          topic,
          messages: [{
            key,
            value: JSON.stringify({
              ...data,
              timestamp: new Date().toISOString(),
            }),
          }],
        });

        const duration = Date.now() - startTime;
        logger.kafka(topic, `published event ${data.type}`, true);
        logger.debug(`Event published to ${topic}: ${data.title} (${duration}ms)`, 'KAFKA');
      }
    } catch (error) {
      logger.kafka(topic, `publish event ${data.type}`, false, error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isEnabled || !this.isConnected || !this.producer) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka producer disconnected', 'KAFKA');
    } catch (error) {
      logger.warn('Error disconnecting Kafka producer', 'KAFKA', error);
    }
  }

  // 현재 상태를 확인할 수 있는 getter 메서드들
  get enabled(): boolean {
    return this.isEnabled;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const kafkaProducer = new KafkaProducer();

// 서버 시작 시 연결
kafkaProducer.connect();

// 서버 종료 시 정리
process.on('SIGTERM', () => kafkaProducer.disconnect());
process.on('SIGINT', () => kafkaProducer.disconnect());
