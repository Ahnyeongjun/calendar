// Mock 데이터는 제거되었습니다.
// 이제 실제 Backend API를 사용합니다.
// 
// 데이터는 다음과 같이 관리됩니다:
// - 인증: /api/auth/login, /api/auth/profile
// - 프로젝트: /api/projects
// - 일정: /api/schedules
//
// 사용법:
// 1. Backend 서버를 실행합니다 (npm run dev)
// 2. 데이터베이스가 연결되어 있는지 확인합니다
// 3. Frontend에서 실제 API 호출이 수행됩니다

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile'
  },
  PROJECTS: {
    LIST: '/projects',
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`
  },
  SCHEDULES: {
    LIST: '/schedules',
    CREATE: '/schedules',
    UPDATE: (id: string) => `/schedules/${id}`,
    DELETE: (id: string) => `/schedules/${id}`
  }
} as const;
