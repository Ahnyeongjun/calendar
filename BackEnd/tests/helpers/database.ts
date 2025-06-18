import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export class TestDatabase {
  private static prisma: PrismaClient;

  static async setup(): Promise<PrismaClient> {
    if (!this.prisma) {
      // 테스트용 환경 변수 설정 (MySQL)
      const testDatabaseUrl = 'mysql://root:password@localhost:3306/calendar_test';
      process.env.DATABASE_URL = testDatabaseUrl;
      process.env.NODE_ENV = 'test';

      try {
        console.log('🔧 Setting up MySQL test database...');
        
        // Prisma 클라이언트 생성 (기본 스키마 사용)
        this.prisma = new PrismaClient({
          datasources: {
            db: {
              url: testDatabaseUrl
            }
          }
        });

        // 연결 테스트
        await this.prisma.$connect();
        console.log('✅ Test database connected successfully');

        // 테스트 데이터 정리
        await this.cleanup();

        return this.prisma;

      } catch (error: any) {
        console.error('❌ MySQL test database setup failed:', error);
        console.error('💡 Make sure MySQL is running and calendar_test database exists');
        throw new Error('Could not setup test database. Please ensure MySQL is running and calendar_test database exists.');
      }
    }

    return this.prisma;
  }

  static async cleanup(): Promise<void> {
    if (this.prisma) {
      try {
        // 외래 키 제약 조건을 고려한 순서로 데이터 삭제
        await this.prisma.schedule.deleteMany();
        await this.prisma.project.deleteMany();
        await this.prisma.user.deleteMany();
        
        console.log('🧹 Test database cleaned');
      } catch (error: any) {
        // 테이블이 없는 경우는 무시
        if (error?.code !== 'P2021') {
          console.warn('Cleanup warning:', error);
        }
      }
    }
  }

  static async teardown(): Promise<void> {
    if (this.prisma) {
      try {
        await this.cleanup();
        await this.prisma.$disconnect();
        this.prisma = null as any;
        console.log('🗑️ Test database disconnected');
      } catch (error: any) {
        console.warn('Teardown warning:', error);
      }
    }
  }

  static getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not initialized. Call setup() first.');
    }
    return this.prisma;
  }

  static async testConnection(): Promise<boolean> {
    try {
      if (!this.prisma) return false;
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // 테스트용 헬퍼 메서드들
  static async createTestUser(userData: any) {
    return await this.prisma.user.create({
      data: userData
    });
  }

  static async createTestProject(projectData: any) {
    return await this.prisma.project.create({
      data: projectData
    });
  }

  static async createTestSchedule(scheduleData: any) {
    return await this.prisma.schedule.create({
      data: scheduleData
    });
  }
}

export const testDb = TestDatabase;
