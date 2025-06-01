# Calendar Application Frontend

이 프로젝트는 React + TypeScript + Vite로 구성된 일정 관리 애플리케이션의 Frontend입니다.

## 주요 기능

### 인증 시스템
- JWT 토큰 기반 인증
- 로그인/로그아웃
- 사용자 프로필 관리
- 자동 토큰 만료 처리

### 프로젝트 관리
- 프로젝트 생성, 수정, 삭제
- 색상별 프로젝트 구분
- 프로젝트별 일정 필터링

### 일정 관리
- 일정 생성, 수정, 삭제
- 달력 뷰와 테이블 뷰 지원
- 상태별 일정 관리 (계획/진행/완료)
- 우선순위별 일정 관리 (낮음/보통/높음)
- 프로젝트별 일정 연결

## 기술 스택

- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Vite**: 빌드 도구
- **Zustand**: 상태 관리
- **React Router**: 라우팅
- **Shadcn/UI**: UI 컴포넌트
- **Tailwind CSS**: 스타일링
- **React Query**: 서버 상태 관리

## 프로젝트 구조

```
src/
├── components/         # UI 컴포넌트
│   ├── CalendarView/   # 달력 뷰 컴포넌트
│   ├── Header/         # 헤더 컴포넌트
│   ├── LoginForm/      # 로그인 폼
│   ├── ScheduleModal/  # 일정 모달
│   ├── TableView/      # 테이블 뷰
│   └── ui/            # 기본 UI 컴포넌트
├── services/          # API 서비스
│   ├── api.ts         # 기본 API 설정
│   ├── authService.ts # 인증 서비스
│   ├── projectService.ts # 프로젝트 서비스
│   └── scheduleService.ts # 일정 서비스
├── stores/            # Zustand 상태 관리
│   ├── useAuthStore.ts    # 인증 상태
│   ├── useProjectStore.ts # 프로젝트 상태
│   └── useScheduleStore.ts # 일정 상태
├── types/             # TypeScript 타입 정의
├── pages/             # 페이지 컴포넌트
└── hooks/             # 커스텀 훅
```

## 설정 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:
```
VITE_API_URL=http://localhost:3000/api
VITE_NODE_ENV=development
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 빌드
```bash
npm run build
```

## Backend 연동

이 Frontend는 Express.js + Prisma로 구성된 Backend API와 연동됩니다.

### API 엔드포인트

#### 인증
- `POST /api/auth/login` - 로그인
- `GET /api/auth/profile` - 사용자 프로필

#### 프로젝트
- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 프로젝트 생성
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제

#### 일정
- `GET /api/schedules` - 일정 목록 (필터링 지원)
- `POST /api/schedules` - 일정 생성
- `PUT /api/schedules/:id` - 일정 수정
- `DELETE /api/schedules/:id` - 일정 삭제

### 데이터 타입

#### 사용자 (User)
```typescript
interface User {
  id: string;
  username: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 프로젝트 (Project)
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 일정 (Schedule)
```typescript
interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime?: string; // ISO datetime string
  endTime?: string; // ISO datetime string
  status: 'planned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  userId: string;
  project?: Project; // populated from backend
  createdAt: string;
  updatedAt: string;
}
```

## 상태 관리

### Auth Store
```typescript
const useAuthStore = create<AuthState>((set, get) => ({
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  login: (username: string, password: string) => Promise<boolean>,
  logout: () => void,
  initializeAuth: () => Promise<void>
}));
```

### Project Store
```typescript
const useProjectStore = create<ProjectState>((set, get) => ({
  projects: Project[],
  isLoading: boolean,
  error: string | null,
  fetchProjects: () => Promise<void>,
  addProject: (project: ProjectData) => Promise<Project>,
  updateProject: (id: string, updates: Partial<ProjectData>) => Promise<Project>,
  deleteProject: (id: string) => Promise<void>
}));
```

### Schedule Store
```typescript
const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedules: Schedule[],
  isLoading: boolean,
  error: string | null,
  fetchSchedules: (filters?: ScheduleFilters) => Promise<void>,
  addSchedule: (schedule: ScheduleFormData) => Promise<Schedule>,
  updateSchedule: (id: string, updates: Partial<ScheduleFormData>) => Promise<Schedule>,
  deleteSchedule: (id: string) => Promise<void>
}));
```

## 컴포넌트 구조

### 인증 관련
- `AuthLayout`: 인증 상태에 따른 라우팅 처리
- `LoginForm`: 로그인 폼
- `LoginFormFields`: 로그인 입력 필드
- `TestAccountInfo`: 테스트 계정 정보

### 메인 UI
- `Header`: 상단 헤더 (사용자 정보, 뷰 전환, 액션 버튼)
- `CalendarView`: 달력 형태의 일정 표시
- `TableView`: 테이블 형태의 일정 표시
- `ScheduleModal`: 일정 생성/수정 모달

### 일정 관련
- `ScheduleItem`: 개별 일정 아이템
- `ScheduleListPopup`: 날짜별 일정 목록 팝업
- `DatePicker`: 날짜 선택기
- `TimeRangePicker`: 시간 범위 선택기
- `ProjectSelector`: 프로젝트 선택기
- `ScheduleOptions`: 상태/우선순위 선택

### 프로젝트 관리
- `ProjectManageModal`: 프로젝트 생성/수정/삭제 모달
- `ProjectFilter`: 프로젝트별 필터링

## API 서비스 구조

### ApiService (Base)
```typescript
class ApiService {
  get<T>(endpoint: string): Promise<T>
  post<T>(endpoint: string, data?: any): Promise<T>
  put<T>(endpoint: string, data?: any): Promise<T>
  delete<T>(endpoint: string): Promise<T>
}
```

### AuthService
```typescript
const authService = {
  login(credentials: LoginRequest): Promise<AuthResult>
  getProfile(): Promise<{ user: User }>
  logout(): void
  getToken(): string | null
  isAuthenticated(): boolean
}
```

### ProjectService
```typescript
const projectService = {
  getAllProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project>
  createProject(data: ProjectData): Promise<Project>
  updateProject(id: string, data: Partial<ProjectData>): Promise<Project>
  deleteProject(id: string): Promise<void>
}
```

### ScheduleService
```typescript
const scheduleService = {
  getAllSchedules(filters?: ScheduleFilters): Promise<Schedule[]>
  getSchedule(id: string): Promise<Schedule>
  createSchedule(data: ScheduleFormData): Promise<Schedule>
  updateSchedule(id: string, data: Partial<ScheduleFormData>): Promise<Schedule>
  deleteSchedule(id: string): Promise<void>
}
```

## 주요 변경사항 (Backend API 연동)

### 1. 타입 시스템 통합
- Backend Prisma 스키마와 Frontend 타입 일치
- ISO 날짜 문자열 사용
- API 응답 타입 정의

### 2. 상태 관리 개선
- Mock 데이터 제거
- 실제 API 호출로 변경
- 에러 처리 및 로딩 상태 추가
- JWT 토큰 기반 인증

### 3. API 서비스 레이어
- 중앙화된 API 클라이언트
- 자동 토큰 처리
- 에러 처리 표준화

### 4. 컴포넌트 업데이트
- 비동기 데이터 처리
- 로딩 상태 UI
- 에러 상태 처리

## 개발 가이드

### 새로운 API 엔드포인트 추가
1. `src/services/` 에 서비스 함수 추가
2. `src/types/` 에 타입 정의
3. 해당 store에 액션 추가
4. 컴포넌트에서 사용

### 새로운 컴포넌트 추가
1. `src/components/` 에 컴포넌트 생성
2. TypeScript 타입 정의
3. 필요시 store 연결
4. 라우터에 등록 (페이지인 경우)

### 에러 처리
- API 에러는 각 서비스에서 처리
- UI 에러는 toast 알림으로 표시
- 로딩 상태는 각 store에서 관리

## 배포

### 개발 환경
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

### 환경 변수
- `VITE_API_URL`: Backend API URL
- `VITE_NODE_ENV`: 환경 설정

## 문제 해결

### 일반적인 문제
1. **API 연결 실패**: Backend 서버가 실행 중인지 확인
2. **인증 오류**: 토큰 만료 시 자동 로그아웃
3. **데이터 동기화**: 각 액션 후 데이터 재로드

### 디버깅
- 브라우저 개발자 도구의 Network 탭에서 API 호출 확인
- Redux DevTools로 상태 변화 추적
- Console에서 에러 로그 확인

## 기여 가이드

1. 코드 스타일: ESLint + Prettier 설정 준수
2. 타입 안전성: TypeScript strict 모드 사용
3. 컴포넌트: 함수형 컴포넌트 + React Hooks 사용
4. 테스트: 중요한 로직에 대한 테스트 작성

---

더 자세한 정보는 각 컴포넌트와 서비스의 JSDoc 주석을 참고하세요.
