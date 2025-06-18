// tests/helpers/test-helpers.ts - 공통 테스트 헬퍼
import { TestDatabase } from './database';

// 모든 테스트에서 사용할 수 있는 공통 setup
export const setupTestDatabase = async () => {
  await TestDatabase.setup();
  return TestDatabase.getPrisma();
};

export const cleanupTestDatabase = async () => {
  await TestDatabase.cleanup();
};

export const teardownTestDatabase = async () => {
  await TestDatabase.teardown();
};

// 테스트에서 사용할 Prisma 인스턴스 가져오기
export const getTestPrisma = () => {
  return TestDatabase.getPrisma();
};

// 테스트에서 사용할 공통 beforeEach/afterEach
export const setupTestSuite = () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });
};

export { TestDatabase };
