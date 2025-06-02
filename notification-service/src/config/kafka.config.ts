import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'notification-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

export const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

// Kafka Topics
export const KAFKA_TOPICS = {
  CALENDAR_EVENTS: 'calendar-events',
  DISCORD_NOTIFICATIONS: 'discord-notifications',
  USER_ACTIVITIES: 'user-activities',
  EMAIL_NOTIFICATIONS: 'email-notifications',
  PUSH_NOTIFICATIONS: 'push-notifications',
} as const;

export type KafkaTopics = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];
