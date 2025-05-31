# Calendar 애플리케이션 백엔드

이 프로젝트는 Calendar 애플리케이션의 백엔드 API를 제공합니다.

## 기술 스택

- Node.js
- Express.js
- TypeScript
- MariaDB

## 시작하기

### 환경 설정

1. `.env` 파일의 DB 설정을 확인하고 필요에 따라 수정하세요.

```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=calender
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드로 실행
npm run dev

# 빌드
npm run build

# 프로덕션 모드로 실행
npm start
```

## API 엔드포인트

### 인증

- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 로그인한 사용자 정보 조회

### 프로젝트

- `GET /api/projects` - 모든 프로젝트 목록 조회
- `GET /api/projects/:id` - 특정 프로젝트 조회
- `POST /api/projects` - 새 프로젝트 생성
- `PUT /api/projects/:id` - 프로젝트 정보 업데이트
- `DELETE /api/projects/:id` - 프로젝트 삭제

### 일정

- `GET /api/schedules` - 모든 일정 조회 (필터링 가능)
- `GET /api/schedules/:id` - 특정 일정 조회
- `POST /api/schedules` - 새 일정 생성
- `PUT /api/schedules/:id` - 일정 정보 업데이트
- `DELETE /api/schedules/:id` - 일정 삭제

## 필터링 예시

일정 조회시 다양한 필터링이 가능합니다:

```
/api/schedules?date=2025-05-31
/api/schedules?startDate=2025-05-01&endDate=2025-05-31
/api/schedules?status=planned
/api/schedules?priority=high
/api/schedules?projectId=personal
```
