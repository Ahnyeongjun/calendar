module.exports = {
  slient: false, // 콘솔 출력 억제 
  // 테스트 환경 설정
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 테스트 파일 패턴
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],

  // 커버리지 설정
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**',
    '!src/types/**'
  ],

  // 커버리지 임계값
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // 모듈 경로 설정
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // 테스트 설정 파일
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // 타임아웃 설정
  testTimeout: 30000,

  // 트랜스폼 무시 패턴
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // 기타 설정
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,

  // ESM 모듈 지원
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        module: 'commonjs'
      }
    }
  }
};
