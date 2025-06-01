# Frontend to Backend API Integration Guide

## 개요

이 문서는 기존 Mock 데이터를 사용하던 Frontend를 실제 Backend API와 연동하기 위해 수행한 모든 변경사항을 정리합니다.

## 주요 변경사항 요약

### 1. 타입 시스템 통합 ✅
- **변경된 파일**: `src/types/auth.ts`, `src/types/schedule.ts`
- **내용**: Backend Prisma 스키마와 Frontend 타입 일치
- **주요 변화**:
  - 날짜 타입을 `Date` → `string` (ISO format)으로 변경
  - Backend API 응답 타입 추가
  - JWT 토큰 기반 인증 타입 추가

### 2. API 서비스 레이어 구축 ✅
- **새로 생성된 파일**:
  - `src/services/api.ts` - 기본 API 클라이언트
  - `src/services/authService.ts` - 인증 관련 API
  - `src/services/projectService.ts` - 프로젝트 관련 API  
  - `src/services/scheduleService.ts` - 일정 관련 API

### 3. 상태 관리 개선 ✅
- **변경된 파일**:
  - `src/stores/useAuthStore.ts` - JWT 토큰 기반 인증으로 변경
  - `src/stores/useProjectStore.ts` - 실제 API 호출로 변경
  - `src/stores/useScheduleStore.ts` - 새로 생성, 일정 관리

### 4. Mock 데이터 제거 ✅
- **변경된 파일**: `src/data/index.ts`
- **내용**: Mock 데이터 제거 및 API 엔드포인트 문서로 변경

### 5. 컴포넌트 업데이트 ✅
- **변경된 파일**:
  - `src/components/ScheduleModal/ScheduleModal.tsx` - 새로운 타입 구조 적용
  - `src/components/ProjectManageModal.tsx` - 실제 API 연동
  - `src/pages/MainPage.tsx` - 새로운 store 구조 사용

### 6. 환경 설정 ✅
- **새로 생성된 파일**: `FrontEnd/.env`
- **내용**: Backend API URL 및 환경 변수 설정

## 변경된 데이터 플로우

### Before (Mock 데이터)
```
Component → Store (Local State) → Mock Data
```

### After (Backend API)
```
Component → Store → API Service → Backend API → Database
```

## API 엔드포인트 매핑

### 인증
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 사용자 프로필

### 프로젝트
- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 프로젝트 생성
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제

### 일정
- `GET /api/schedules` - 일정 목록 (필터링 지원)
- `POST /api/schedules` - 일정 생성
- `PUT /api/schedules/:id` - 일정 수정
- `DELETE /api/schedules/:id` - 일정 삭제

## 주요 기능별 변경사항

### 🔐 인증 시스템
**Before**: 하드코딩된 테스트 계정
```typescript
const TEST_ACCOUNTS = [
  { id: '1', username: 'admin', password: '1234', name: '관리자' }
];
```

**After**: JWT 토큰 기반 실제 인증
```typescript
const authResult = await authService.login({ username, password });
localStorage.setItem('auth-token', authResult.token);
```

### 📁 프로젝트 관리
**Before**: 로컬 상태 관리
```typescript
const DEFAULT_PROJECTS = [
  { id: 'personal', name: '개인', color: '#10b981' }
];
```

**After**: Database 연동
```typescript
const projects = await projectService.getAllProjects();
await projectService.createProject(projectData);
```

### 📅 일정 관리
**Before**: Mock 데이터 배열
```typescript
export const mockSchedules: Schedule[] = [...]
```

**After**: 실시간 Database 연동
```typescript
const schedules = await scheduleService.getAllSchedules(filters);
await scheduleService.createSchedule(scheduleData);
```

## 타입 변경사항 상세

### User 타입
```typescript
// Before
interface User {
  id: string;
  username: string;
  name: string;
}

// After  
interface User {
  id: string;
  username: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Schedule 타입
```typescript
// Before
interface Schedule {
  date: Date;
  startTime?: string;
  endTime?: string;
  category: string; // 카테고리 기반
}

// After
interface Schedule {
  date: string; // ISO string
  startTime?: string; // ISO datetime string
  endTime?: string; // ISO datetime string  
  projectId?: string; // 프로젝트 연결
  userId: string; // 사용자 연결
}
```

## 에러 처리 개선

### API 에러 처리
```typescript
try {
  const result = await apiService.get('/endpoint');
  return result;
} catch (error) {
  console.error('API Error:', error);
  throw new Error(error.message || '서버 오류가 발생했습니다.');
}
```

### UI 에러 표시
```typescript
toast({
  title: "오류가 발생했습니다",
  description: error instanceof Error ? error.message : "알 수 없는 오류",
  variant: "destructive"
});
```

## 로딩 상태 관리

각 Store에 로딩 상태 추가:
```typescript
interface StoreState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
```

## 보안 강화

### JWT 토큰 관리
```typescript
// 토큰 자동 포함
private getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// 토큰 유효성 검사
isAuthenticated(): boolean {
  const token = this.getToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    return payload.exp > now;
  } catch {
    return false;
  }
}
```

## 실행 방법

### 1. Backend 서버 실행
```bash
cd BackEnd
npm install
npm run dev
```

### 2. Frontend 서버 실행  
```bash
cd FrontEnd
npm install
npm run dev
```

### 3. 환경 변수 확인
`.env` 파일에서 API URL 확인:
```
VITE_API_URL=http://localhost:3000/api
```

## 테스트 가이드

### 1. 인증 테스트
- Backend에서 사용자 계정 생성
- Frontend에서 로그인 시도
- JWT 토큰 저장 확인

### 2. 프로젝트 관리 테스트
- 새 프로젝트 생성
- 프로젝트 수정/삭제
- 데이터베이스 반영 확인

### 3. 일정 관리 테스트
- 새 일정 생성 (프로젝트 연결)
- 일정 수정/삭제
- 필터링 기능 확인

## 잠재적 이슈 및 해결방안

### 1. CORS 문제
**문제**: Frontend와 Backend가 다른 포트에서 실행
**해결**: Backend에 CORS 설정 추가

### 2. 토큰 만료
**문제**: JWT 토큰 만료 시 API 호출 실패
**해결**: 자동 로그아웃 및 재로그인 유도

### 3. 네트워크 오류
**문제**: Backend 서버 연결 실패
**해결**: 에러 메시지 표시 및 재시도 옵션

## 추후 개선 사항

### 1. 오프라인 지원
- Service Worker 추가
- Local Storage 캐싱

### 2. 실시간 업데이트  
- WebSocket 연결
- 다중 사용자 동시 편집

### 3. 성능 최적화
- React Query 캐싱 활용
- 무한 스크롤 적용

---

이제 Frontend가 완전히 Backend API와 연동되어 실제 데이터베이스와 상호작용할 수 있습니다. 모든 Mock 데이터가 제거되고 실제 API 호출로 대체되었습니다.
