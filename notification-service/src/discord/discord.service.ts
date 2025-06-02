import { Client, GatewayIntentBits, TextChannel, EmbedBuilder, ActivityType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export interface EventData {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
}

export class DiscordBotService {
  private client: Client;
  private isReady = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.client.once('ready', () => {
      console.log(`✅ Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
      
      // 봇 상태 설정
      this.client.user?.setActivity('📅 Calendar Events', { type: ActivityType.Watching });
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      if (message.content.startsWith('!calendar')) {
        await this.handleCalendarCommand(message);
      }
      
      if (message.content.startsWith('!help')) {
        await this.sendHelpMessage(message);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ Discord bot error:', error);
    });

    this.client.on('disconnect', () => {
      console.log('⚠️ Discord bot disconnected');
    });
  }

  private async handleCalendarCommand(message: any) {
    const args = message.content.split(' ').slice(1);
    
    if (args.length === 0) {
      await this.sendCommandsHelp(message);
      return;
    }

    switch (args[0].toLowerCase()) {
      case 'help':
        await this.sendCommandsHelp(message);
        break;
      case 'today':
        await this.sendTodayEvents(message);
        break;
      case 'week':
        await this.sendWeekEvents(message);
        break;
      case 'stats':
        await this.sendStats(message);
        break;
      default:
        await message.reply('❌ Unknown command. Use `!calendar help` for available commands.');
    }
  }

  private async sendCommandsHelp(message: any) {
    const embed = new EmbedBuilder()
      .setTitle('📅 Calendar Bot Commands')
      .setColor(0x0099FF)
      .setDescription('Available commands for the Calendar Bot')
      .addFields(
        { name: '!calendar help', value: 'Show this help message', inline: true },
        { name: '!calendar today', value: 'Show today\'s events', inline: true },
        { name: '!calendar week', value: 'Show this week\'s events', inline: true },
        { name: '!calendar stats', value: 'Show calendar statistics', inline: true }
      )
      .setFooter({ text: 'Calendar Notification Service v1.0' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }

  private async sendHelpMessage(message: any) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Help')
      .setColor(0x00FF00)
      .setDescription('Available commands for this bot')
      .addFields(
        { name: '!help', value: 'Show this help message' },
        { name: '!calendar [command]', value: 'Calendar related commands' }
      )
      .setFooter({ text: 'Type !calendar help for calendar-specific commands' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }

  private async sendTodayEvents(message: any) {
    // TODO: API 호출로 실제 오늘의 이벤트 가져오기
    const embed = new EmbedBuilder()
      .setTitle('📅 Today\'s Events')
      .setColor(0x0099FF)
      .setDescription('Here are your events for today:')
      .addFields(
        { name: 'No events found', value: 'You have no events scheduled for today.' }
      )
      .setFooter({ text: 'Fetched from Calendar API' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }

  private async sendWeekEvents(message: any) {
    // TODO: API 호출로 실제 이번 주의 이벤트 가져오기
    const embed = new EmbedBuilder()
      .setTitle('📅 This Week\'s Events')
      .setColor(0x0099FF)
      .setDescription('Here are your events for this week:')
      .addFields(
        { name: 'No events found', value: 'You have no events scheduled for this week.' }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }

  private async sendStats(message: any) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Calendar Statistics')
      .setColor(0x9932CC)
      .addFields(
        { name: '📈 Events Processed', value: '0', inline: true },
        { name: '🔔 Notifications Sent', value: '0', inline: true },
        { name: '⏰ Reminders Set', value: '0', inline: true },
        { name: '🟢 Bot Status', value: 'Online', inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }

  async start() {
    try {
      const token = process.env.DISCORD_BOT_TOKEN;
      if (!token) {
        throw new Error('DISCORD_BOT_TOKEN is not set in environment variables');
      }

      await this.client.login(token);
      console.log('🚀 Discord bot service started successfully');
    } catch (error) {
      console.error('❌ Failed to start Discord bot:', error);
      throw error;
    }
  }

  async sendEventNotification(eventData: EventData, notificationType: string) {
    try {
      if (!this.isReady) {
        console.warn('⚠️ Discord bot is not ready yet');
        return;
      }

      const channelId = process.env.DISCORD_CHANNEL_ID;
      if (!channelId) {
        console.warn('⚠️ DISCORD_CHANNEL_ID is not set');
        return;
      }

      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        console.error('❌ Channel not found:', channelId);
        return;
      }

      const embed = this.createEventEmbed(eventData, notificationType);
      const message = this.createEventMessage(eventData, notificationType);

      await channel.send({ content: message, embeds: [embed] });
      console.log(`✅ Discord notification sent: ${notificationType} - ${eventData.title}`);
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error);
    }
  }

  private createEventEmbed(eventData: EventData, type: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .addFields(
        { name: 'Title', value: eventData.title, inline: true },
        { name: 'Start Date', value: new Date(eventData.startDate).toLocaleString('ko-KR'), inline: true },
        { name: 'End Date', value: new Date(eventData.endDate).toLocaleString('ko-KR'), inline: true }
      )
      .setTimestamp();

    if (eventData.description) {
      embed.addFields({ name: 'Description', value: eventData.description });
    }

    switch (type) {
      case 'CREATE':
        embed.setTitle('🆕 New Event Created').setColor(0x00FF00);
        break;
      case 'UPDATE':
        embed.setTitle('✏️ Event Updated').setColor(0xFFFF00);
        break;
      case 'DELETE':
        embed.setTitle('🗑️ Event Deleted').setColor(0xFF0000);
        break;
      case 'REMINDER':
        embed.setTitle('⏰ Event Reminder').setColor(0x0099FF);
        embed.addFields({ name: 'Reminder', value: 'This event starts in 15 minutes!' });
        break;
      default:
        embed.setTitle('📅 Event Notification').setColor(0x0099FF);
    }

    return embed;
  }

  private createEventMessage(eventData: EventData, type: string): string {
    switch (type) {
      case 'CREATE':
        return `📅 **새로운 일정이 생성되었습니다!**`;
      case 'UPDATE':
        return `📅 **일정이 수정되었습니다!**`;
      case 'DELETE':
        return `📅 **일정이 삭제되었습니다!**`;
      case 'REMINDER':
        return `🔔 **일정 알림**: 곧 시작됩니다!`;
      default:
        return `📅 **일정 알림**`;
    }
  }

  async sendCustomNotification(channelId: string, message: string, embed?: EmbedBuilder) {
    try {
      if (!this.isReady) {
        console.warn('⚠️ Discord bot is not ready yet');
        return;
      }

      const channel = await this.client.channels.fetch(channelId) as TextChannel;
      if (!channel) {
        console.error('❌ Channel not found:', channelId);
        return;
      }

      if (embed) {
        await channel.send({ content: message, embeds: [embed] });
      } else {
        await channel.send(message);
      }
    } catch (error) {
      console.error('❌ Failed to send custom notification:', error);
    }
  }

  async stop() {
    try {
      if (this.client) {
        await this.client.destroy();
        console.log('✅ Discord bot stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop Discord bot:', error);
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      user: this.client.user?.tag,
      guilds: this.client.guilds.cache.size,
    };
  }
}
