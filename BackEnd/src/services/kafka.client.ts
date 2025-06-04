import { Kafka, Producer } from 'kafkajs';
import dotenv from 'dotenv';

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
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.KAFKA_ENABLED === 'true';

    if (this.isEnabled) {
      this.initializeKafka();
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
      }
    } catch (error) {
      this.isEnabled = false;
    }
  }

  async publishEvent(topic: string, key: string, data: KafkaEventData): Promise<void> {
    if (!this.isEnabled) return;

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
      }
    } catch (error) {
      // Silent fail - 카프카 실패가 애플리케이션 실행을 방해하지 않음
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isEnabled || !this.isConnected || !this.producer) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
    } catch (error) {
      // Silent fail
    }
  }
}

export const kafkaProducer = new KafkaProducer();

// 서버 시작 시 연결
kafkaProducer.connect();

// 서버 종료 시 정리
process.on('SIGTERM', () => kafkaProducer.disconnect());
process.on('SIGINT', () => kafkaProducer.disconnect());
