import { consumer, producer, KAFKA_TOPICS, KafkaTopics } from '../config/kafka.config';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: string;
}

export interface NotificationMessage {
  type: 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_DELETED' | 'EVENT_REMINDER' | 'CUSTOM';
  userId: string;
  message: string;
  eventData?: CalendarEvent;
  metadata?: any;
  timestamp: string;
}

export class KafkaConsumerService {
  private isConnected = false;
  private messageHandlers: Map<string, (message: any) => Promise<void>> = new Map();

  async connect() {
    try {
      if (!this.isConnected) {
        await consumer.connect();
        await consumer.subscribe({ 
          topics: Object.values(KAFKA_TOPICS),
          fromBeginning: false 
        });
        this.isConnected = true;
        console.log('✅ Kafka consumer connected and subscribed to topics');
      }
    } catch (error) {
      console.error('❌ Failed to connect Kafka consumer:', error);
      throw error;
    }
  }

  async startConsuming() {
    try {
      await this.connect();

      await consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          try {
            const messageValue = message.value?.toString();
            if (!messageValue) return;

            const parsedMessage = JSON.parse(messageValue);
            const handler = this.messageHandlers.get(topic);
            
            if (handler) {
              await handler(parsedMessage);
            } else {
              console.log(`📨 No handler registered for topic: ${topic}`);
            }

            // 주기적으로 heartbeat 전송 (긴 처리 시간 대비)
            await heartbeat();
          } catch (error) {
            console.error(`❌ Error processing message from topic ${topic}:`, error);
          }
        },
      });

      console.log('🎯 Kafka consumer started processing messages');
    } catch (error) {
      console.error('❌ Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  registerHandler(topic: KafkaTopics, handler: (message: any) => Promise<void>) {
    this.messageHandlers.set(topic, handler);
    console.log(`📝 Handler registered for topic: ${topic}`);
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await consumer.disconnect();
        this.isConnected = false;
        console.log('✅ Kafka consumer disconnected');
      }
    } catch (error) {
      console.error('❌ Failed to disconnect Kafka consumer:', error);
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      registeredHandlers: Array.from(this.messageHandlers.keys()),
    };
  }
}

export class KafkaProducerService {
  private isConnected = false;

  async connect() {
    try {
      if (!this.isConnected) {
        await producer.connect();
        this.isConnected = true;
        console.log('✅ Kafka producer connected');
      }
    } catch (error) {
      console.error('❌ Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async publishMessage(topic: KafkaTopics, key: string, message: any) {
    try {
      await this.connect();
      
      await producer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });

      console.log(`📤 Message published to topic: ${topic}, key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to publish message to topic ${topic}:`, error);
      throw error;
    }
  }

  async publishNotification(notification: NotificationMessage) {
    await this.publishMessage(
      KAFKA_TOPICS.DISCORD_NOTIFICATIONS, 
      notification.userId, 
      notification
    );
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await producer.disconnect();
        this.isConnected = false;
        console.log('✅ Kafka producer disconnected');
      }
    } catch (error) {
      console.error('❌ Failed to disconnect Kafka producer:', error);
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
    };
  }
}
