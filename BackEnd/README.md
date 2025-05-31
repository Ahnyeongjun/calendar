# Calendar Backend (Prisma 버전)

Calendar 애플리케이션의 백엔드 API 서버입니다. ORM으로 Prisma를 사용합니다.

## 기술 스택

- Node.js
- Express.js
- TypeScript
- Prisma (ORM)
- MySQL/MariaDB

## 설치 및 실행

### 필수 요구사항

- Node.js 14.x 이상
- MySQL 또는 MariaDB

### 설치 단계

1. 저장소 클론
   ```bash
   git clone <repository-url>
   cd calendar/BackEnd
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   `.env` 파일을 생성하고 다음 내용을 추가합니다:
   ```
   PORT=3001
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=calender
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   
   # Prisma DATABASE_URL
   DATABASE_URL=mysql://root:yourpassword@localhost:3306/calender
   ```

4. Prisma 설정
   ```bash
   # Prisma 클라이언트 생성
   npm run prisma:generate
   
   # 데이터베이스 마이그레이션 (개발 환경)
   npm run prisma:migrate
   ```

5. 서버 실행
   ```bash
   # 개발 모드 실행
   npm run dev
   
   # 또는 빌드 후 실행
   npm run build
   npm start
   ```

## 프로젝트 구조

```
/BackEnd
  /prisma
    schema.prisma        # Prisma 스키마 정의
  /src
    /config              # 설정 파일
      prisma.ts          # Prisma 클라이언트 설정
    /controllers         # 컨트롤러
    /middleware          # 미들웨어
    /models              # 데이터 모델
    /routes              # API 라우트
    /types               # 타입 정의
    index.ts             # 애플리케이션 시작점
  .env                   # 환경 변수
  package.json
  tsconfig.json
```

## API 엔드포인트

### 인증 API

- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

### 프로젝트 API

- `GET /api/projects` - 모든 프로젝트 조회
- `GET /api/projects/:id` - 특정 프로젝트 조회
- `POST /api/projects` - 프로젝트 생성
- `PUT /api/projects/:id` - 프로젝트 업데이트
- `DELETE /api/projects/:id` - 프로젝트 삭제

### 일정 API

- `GET /api/schedules` - 모든 일정 조회 (필터링 가능)
- `GET /api/schedules/:id` - 특정 일정 조회
- `POST /api/schedules` - 일정 생성
- `PUT /api/schedules/:id` - 일정 업데이트
- `DELETE /api/schedules/:id` - 일정 삭제

## Prisma 사용법

### Prisma Studio 실행 (데이터베이스 시각화 도구)

```bash
npm run prisma:studio
```

### 스키마 변경 후 마이그레이션

1. `prisma/schema.prisma` 파일 수정
2. 마이그레이션 실행:
   ```bash
   npm run prisma:migrate
   ```

### Prisma 클라이언트 재생성

스키마 변경 후 클라이언트 업데이트:
```bash
npm run prisma:generate
```

## 마이그레이션 정보

이 프로젝트는 기존에 직접 SQL 쿼리를 사용하던 방식에서 Prisma ORM을 사용하는 방식으로 마이그레이션되었습니다. 주요 변경 내용은 다음과 같습니다:

1. Prisma 스키마 정의 (`prisma/schema.prisma`)
2. 모델 계층 수정 (SQL → Prisma 클라이언트)
3. 환경 변수 확장 (DATABASE_URL 추가)
4. 데이터베이스 초기화 로직 변경 (sql 직접 실행 → Prisma 사용)

## 참고 문서

- [Prisma 공식 문서](https://www.prisma.io/docs/)
- [Express.js 공식 문서](https://expressjs.com/)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
