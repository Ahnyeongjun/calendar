import { config } from 'dotenv';
import { join } from 'path';

// 환경별 .env 파일 로드
if (process.env.NODE_ENV === 'test') {
  config({ path: join(__dirname, '../.env.test') });
  // 테스트 환경에서는 DATABASE_URL 강제 설정
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/calendar_test';
} else {
  config({ path: join(__dirname, '../.env') });
}

// 기본 환경 변수 설정
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// JWT 설정
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.KAFKA_ENABLED = 'false';

// 🔥 중요: 테스트 전에 올바른 Prisma Client 확인
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
  console.log('📁 Database URL:', process.env.DATABASE_URL);
  console.log('🏷️ Environment:', process.env.NODE_ENV);
  
  // Prisma Client 연결 확인
  try {
    // TestDatabase 사용
    const { TestDatabase } = await import('./helpers/database');
    await TestDatabase.setup();
    console.log('✅ Test database setup successful');
  } catch (error: any) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // 테스트 종료 후 정리
  try {
    const { TestDatabase } = await import('./helpers/database');
    await TestDatabase.teardown();
    console.log('✅ Test suite completed');
  } catch (error: any) {
    console.log('⚠️ Database teardown failed:', error);
  }
});

// Jest timeout 증가
jest.setTimeout(30000);

// 콘솔 로그 제어 (테스트 환경에서는 에러만 출력)
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
  // console.error는 유지하여 실제 에러 확인 가능
}
