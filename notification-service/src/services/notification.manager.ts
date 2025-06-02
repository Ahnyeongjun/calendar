import { DiscordBotService, EventData } from '../discord/discord.service';
import { KafkaConsumerService, KafkaProducerService, CalendarEvent, NotificationMessage } from '../kafka/kafka.service';
import { KAFKA_TOPICS } from '../config/kafka.config';

export class NotificationManager {
  private discordBot: DiscordBotService;
  private kafkaConsumer: KafkaConsumerService;
  private kafkaProducer: KafkaProducerService;
  private stats = {
    eventsProcessed: 0,
    notificationsSent: 0,
    remindersScheduled: 0,
    startTime: new Date(),
  };

  constructor() {
    this.discordBot = new DiscordBotService();
    this.kafkaConsumer = new KafkaConsumerService();
    this.kafkaProducer = new KafkaProducerService();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Notification Service...');

      // Discord 봇 시작
      await this.discordBot.start();

      // Kafka 메시지 핸들러 등록
      this.registerKafkaHandlers();

      // Kafka 컨슈머 시작
      await this.kafkaConsumer.startConsuming();

      console.log('✅ Notification Service initialized successfully');
      this.logServiceStatus();
    } catch (error) {
      console.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  private registerKafkaHandlers() {
    // 캘린더 이벤트 처리
    this.kafkaConsumer.registerHandler(
      KAFKA_TOPICS.CALENDAR_EVENTS,
      this.handleCalendarEvent.bind(this)
    );

    // Discord 알림 처리
    this.kafkaConsumer.registerHandler(
      KAFKA_TOPICS.DISCORD_NOTIFICATIONS,
      this.handleDiscordNotification.bind(this)
    );

    // 사용자 활동 처리
    this.kafkaConsumer.registerHandler(
      KAFKA_TOPICS.USER_ACTIVITIES,
      this.handleUserActivity.bind(this)
    );

    // 이메일 알림 처리 (향후 확장)
    this.kafkaConsumer.registerHandler(
      KAFKA_TOPICS.EMAIL_NOTIFICATIONS,
      this.handleEmailNotification.bind(this)
    );

    // 푸시 알림 처리 (향후 확장)
    this.kafkaConsumer.registerHandler(
      KAFKA_TOPICS.PUSH_NOTIFICATIONS,
      this.handlePushNotification.bind(this)
    );
  }

  private async handleCalendarEvent(eventData: CalendarEvent) {
    try {
      console.log(`📅 Processing calendar event: ${eventData.type} - ${eventData.title}`);
      this.stats.eventsProcessed++;

      // Discord 알림 메시지 생성
      const notification: NotificationMessage = {
        type: this.mapEventTypeToNotificationType(eventData.type),
        userId: eventData.userId,
        message: this.generateEventMessage(eventData),
        eventData,
        timestamp: new Date().toISOString(),
      };

      // Discord 알림 큐로 발행
      await this.kafkaProducer.publishNotification(notification);

      // 새로운 이벤트인 경우 리마인더 스케줄링
      if (eventData.type === 'CREATE') {
        await this.scheduleReminder(eventData);
      }

    } catch (error) {
      console.error('❌ Error handling calendar event:', error);
    }
  }

  private async handleDiscordNotification(notification: NotificationMessage) {
    try {
      console.log(`🔔 Processing Discord notification: ${notification.type}`);

      if (notification.eventData) {
        await this.discordBot.sendEventNotification(
          notification.eventData,
          notification.eventData.type
        );
      } else {
        // 커스텀 알림 처리
        const channelId = process.env.DISCORD_CHANNEL_ID;
        if (channelId) {
          await this.discordBot.sendCustomNotification(channelId, notification.message);
        }
      }

      this.stats.notificationsSent++;
    } catch (error) {
      console.error('❌ Error handling Discord notification:', error);
    }
  }

  private async handleUserActivity(activity: any) {
    try {
      console.log(`👤 Processing user activity:`, activity.type);
      
      // 사용자 활동에 따른 추가 로직 (예: 로그인, 로그아웃 알림 등)
      if (activity.type === 'LOGIN') {
        const notification: NotificationMessage = {
          type: 'CUSTOM',
          userId: activity.userId,
          message: `👋 ${activity.username}님이 로그인했습니다!`,
          metadata: activity,
          timestamp: new Date().toISOString(),
        };

        await this.kafkaProducer.publishNotification(notification);
      }
    } catch (error) {
      console.error('❌ Error handling user activity:', error);
    }
  }

  private async handleEmailNotification(notification: any) {
    try {
      console.log(`📧 Email notification received:`, notification.subject);
      // TODO: 이메일 발송 로직 구현
    } catch (error) {
      console.error('❌ Error handling email notification:', error);
    }
  }

  private async handlePushNotification(notification: any) {
    try {
      console.log(`📱 Push notification received:`, notification.title);
      // TODO: 푸시 알림 발송 로직 구현
    } catch (error) {
      console.error('❌ Error handling push notification:', error);
    }
  }

  private async scheduleReminder(eventData: CalendarEvent) {
    try {
      const eventStart = new Date(eventData.startDate);
      const now = new Date();
      const reminderTime = new Date(eventStart.getTime() - 15 * 60 * 1000); // 15분 전

      if (reminderTime > now) {
        const delay = reminderTime.getTime() - now.getTime();

        setTimeout(async () => {
          const reminderNotification: NotificationMessage = {
            type: 'EVENT_REMINDER',
            userId: eventData.userId,
            message: `⏰ 곧 일정이 시작됩니다: ${eventData.title}`,
            eventData: { ...eventData, type: 'CREATE' },
            timestamp: new Date().toISOString(),
          };

          await this.kafkaProducer.publishNotification(reminderNotification);
        }, delay);

        this.stats.remindersScheduled++;
        console.log(`⏰ Reminder scheduled for: ${eventData.title} at ${reminderTime.toLocaleString()}`);
      }
    } catch (error) {
      console.error('❌ Error scheduling reminder:', error);
    }
  }

  private mapEventTypeToNotificationType(eventType: string): NotificationMessage['type'] {
    switch (eventType) {
      case 'CREATE':
        return 'EVENT_CREATED';
      case 'UPDATE':
        return 'EVENT_UPDATED';
      case 'DELETE':
        return 'EVENT_DELETED';
      default:
        return 'CUSTOM';
    }
  }

  private generateEventMessage(event: CalendarEvent): string {
    switch (event.type) {
      case 'CREATE':
        return `🆕 새로운 일정이 생성되었습니다: ${event.title}`;
      case 'UPDATE':
        return `✏️ 일정이 수정되었습니다: ${event.title}`;
      case 'DELETE':
        return `🗑️ 일정이 삭제되었습니다: ${event.title}`;
      default:
        return `📅 일정 알림: ${event.title}`;
    }
  }

  async sendCustomNotification(userId: string, message: string, metadata?: any) {
    try {
      const notification: NotificationMessage = {
        type: 'CUSTOM',
        userId,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      };

      await this.kafkaProducer.publishNotification(notification);
      console.log(`📤 Custom notification queued for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error sending custom notification:', error);
    }
  }

  getStats() {
    const uptime = new Date().getTime() - this.stats.startTime.getTime();
    return {
      ...this.stats,
      uptime: Math.floor(uptime / 1000), // seconds
      kafkaStatus: this.kafkaConsumer.getStatus(),
      discordStatus: this.discordBot.getStatus(),
    };
  }

  private logServiceStatus() {
    const status = this.getStats();
    console.log('\n📊 Notification Service Status:');
    console.log(`├── Events Processed: ${status.eventsProcessed}`);
    console.log(`├── Notifications Sent: ${status.notificationsSent}`);
    console.log(`├── Reminders Scheduled: ${status.remindersScheduled}`);
    console.log(`├── Uptime: ${status.uptime}s`);
    console.log(`├── Kafka Connected: ${status.kafkaStatus.isConnected}`);
    console.log(`└── Discord Ready: ${status.discordStatus.isReady}`);
  }

  async shutdown() {
    try {
      console.log('🛑 Shutting down Notification Service...');
      
      await this.kafkaConsumer.disconnect();
      await this.kafkaProducer.disconnect();
      await this.discordBot.stop();
      
      console.log('✅ Notification Service shut down successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}
