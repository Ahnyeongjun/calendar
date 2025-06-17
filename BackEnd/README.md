# Calendar Backend (Enhanced with Sentry & Cache)

Calendar 애플리케이션의 백엔드 API 서버입니다. Prisma ORM을 사용하며, Sentry 에러 모니터링과 Redis/메모리 캐싱이 통합되어 있습니다.

## 🚀 새로운 기능

- ✅ **Sentry 에러 모니터링** - 실시간 에러 추적 및 성능 모니터링
- ✅ **Redis/메모리 캐싱** - 자동 캐시 관리 및 성능 최적화
- ✅ **성능 모니터링** - 요청 추적 및 응답 시간 측정
- ✅ **캐시 관리 API** - 개발/운영 환경에서 캐시 상태 확인 및 관리

## 기술 스택

- Node.js + Express.js + TypeScript
- Prisma (ORM) + MySQL/MariaDB
- **Sentry** (에러 모니터링 & 성능 추적)
- **Redis** (캐싱, optional) / **Node-Cache** (메모리 캐싱, fallback)
- JWT 인증

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
   ```env
   # 기본 설정
   PORT=3001
   NODE_ENV=development
   
   # JWT 설정
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   
   # 데이터베이스 설정
   DATABASE_URL=mysql://root:yourpassword@localhost:3306/calender
   
   # Sentry 설정 (필수)
   SENTRY_DSN=your_sentry_dsn_here
   
   # Redis 설정 (선택사항 - 없으면 메모리 캐시 사용)
   REDIS_URL=redis://localhost:6379
   ```

4. Sentry 프로젝트 설정
   - [Sentry.io](https://sentry.io)에 가입 및 프로젝트 생성
   - DSN을 받아 `.env` 파일에 설정

5. Redis 설정 (선택사항)
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   
   # macOS
   brew install redis
   
   # Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

6. Prisma 설정
   ```bash
   # Prisma 클라이언트 생성
   npm run prisma:generate
   
   # 데이터베이스 마이그레이션
   npm run prisma:migrate
   ```

7. 서버 실행
   ```bash
   # 개발 모드
   npm run dev
   
   # 빌드 후 실행
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
      sentry.ts          # Sentry 설정
      cache.ts           # Redis/메모리 캐시 설정
    /controllers         # 컨트롤러 (Sentry & 캐시 통합)
    /middleware          # 미들웨어
      auth.ts            # JWT 인증
      sentryMiddleware.ts # Sentry 에러 추적
      cacheMiddleware.ts  # 캐시 관리
    /models              # 데이터 모델
    /routes              # API 라우트 (캐시 적용)
    /types               # 타입 정의
    index.ts             # 애플리케이션 시작점 (Sentry 초기화)
  .env                   # 환경 변수 (Sentry DSN, Redis URL 포함)
  package.json           # 새로운 패키지 포함
  tsconfig.json
```

## 🚀 새로운 API 엔드포인트

### 모니터링 & 관리 API

- `GET /health` - 서버 상태 확인
- `GET /api/cache/status` - 캐시 상태 및 통계
- `DELETE /api/cache/flush` - 캐시 플러시 (개발용)
- `DELETE /api/cache/flush?pattern=projects:*` - 패턴별 캐시 삭제

### 기존 API (캐시 적용)

#### 인증 API
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입

#### 프로젝트 API (캐시 적용)
- `GET /api/projects` - 모든 프로젝트 조회 **[캐시 10분]**
- `GET /api/projects/:id` - 특정 프로젝트 조회 **[캐시 15분]**
- `POST /api/projects` - 프로젝트 생성 **[캐시 무효화]**
- `PUT /api/projects/:id` - 프로젝트 업데이트 **[캐시 무효화]**
- `DELETE /api/projects/:id` - 프로젝트 삭제 **[캐시 무효화]**

#### 일정 API (사용자별 캐시 적용)
- `GET /api/schedules` - 모든 일정 조회 (필터링 가능) **[캐시 5분]**
- `GET /api/schedules/:id` - 특정 일정 조회 **[캐시 5분]**
- `POST /api/schedules` - 일정 생성 **[캐시 무효화]**
- `PUT /api/schedules/:id` - 일정 업데이트 **[캐시 무효화]**
- `DELETE /api/schedules/:id` - 일정 삭제 **[캐시 무효화]**

## 📊 캐시 시스템

### 캐시 전략

1. **이중 캐시 시스템**
   - **Redis** (기본): 고성능 커리 캐시, 클러스터 지원
   - **Node-Cache** (대체): Redis 없을 때 메모리 캐시

2. **캐시 전략별 TTL**
   - 프로젝트 목록: 10분 (600초)
   - 개별 프로젝트: 15분 (900초)
   - 일정 목록: 5분 (300초)
   - 개별 일정: 5분 (300초)

3. **사용자별 캐시 분리**
   - 사용자 ID를 포함한 캐시 키 생성
   - 인증된 사용자만 자신의 캐시된 데이터 접근

4. **자동 캐시 무효화**
   - CUD 작업 시 관련 캐시 자동 삭제
   - 태그 기반 일괄 무효화

### 캐시 사용 예시

```bash
# 캐시 상태 확인
curl http://localhost:3001/api/cache/status

# 전체 캐시 플러시 (개발 환경만)
curl -X DELETE http://localhost:3001/api/cache/flush

# 프로젝트 관련 캐시만 삭제
curl -X DELETE "http://localhost:3001/api/cache/flush?pattern=projects:*"
```

## 🚨 Sentry 에러 모니터링

### 기능

1. **실시간 에러 추적**
   - 모든 에러 자동 수집 및 대시보드 전송
   - 사용자 점수 및 에러 빈도 추적

2. **성능 모니터링**
   - HTTP 요청 응답 시간 측정
   - 느린 요청 (1초 이상) 자동 태그
   - 데이터베이스 쿠리 성능 추적

3. **컨텍스트 정보**
   - 사용자 정보 (로그인 상태에서)
   - 요청 정보 (URL, 메서드, 파라미터)
   - 컨트롤러 및 액션 별 눆류

4. **에러 필터링**
   - JWT 만료 에러 제외 (정상 플로우)
   - 개발 환경 Prisma 연결 에러 제외
   - 실제 서비스 장애만 추적

### Sentry 대시보드 확인 사항

- 에러 발생 빈도 및 트렌드
- 성능 병목 지점 식별
- 사용자별 에러 패턴
- 서버 상태 및 업타임 지표

## 📝 개발 가이드

### 새로운 API 추가 시 캐시 적용

1. **컨트롤러에 캐시 로직 추가**:
   ```typescript
   import { CacheManager, createCacheKey } from '../config/cache';
   
   // 조회 API
   const cacheKey = createCacheKey('resource', 'user', userId);
   const cached = await CacheManager.get(cacheKey);
   if (cached) {
     res.set('X-Cache', 'HIT');
     return res.json(cached);
   }
   ```

2. **라우트에 미들웨어 적용**:
   ```typescript
   import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cacheMiddleware';
   
   router.get('/', auth, cacheMiddleware({ ttl: 300 }), controller.getAll);
   router.post('/', auth, invalidateCacheMiddleware(['resource']), controller.create);
   ```

### Sentry 에러 추적 추가

```typescript
import { Sentry } from '../config/sentry';

try {
  // 비즈니스 로직
} catch (error) {
  Sentry.withScope((scope) => {
    scope.setTag('controller', 'resource');
    scope.setTag('action', 'operation');
    scope.setContext('request', { userId, params });
    scope.setLevel('error');
    Sentry.captureException(error as Error);
  });
  
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    timestamp: new Date().toISOString()
  });
}
```

## 🚀 배포 가이드

### 프로덕션 환경 설정

1. **환경 변수 설정**:
   ```env
   NODE_ENV=production
   SENTRY_DSN=your_production_sentry_dsn
   REDIS_URL=redis://your_redis_host:6379
   DATABASE_URL=mysql://user:pass@host:port/db
   ```

2. **Redis 설정** (예: AWS ElastiCache, Google Cloud Memorystore)
3. **Sentry 프로젝트** 생성 및 DSN 설정
4. **로드 밸런서** 설정 시 헬스 체크 엔드포인트 설정: `/health`

### 모니터링 설정

- **Sentry**: 에러 알림 및 대시보드 설정
- **Redis**: 메모리 사용량 및 연결 모니터링
- **성능**: 응답 시간 및 처리량 모니터링

## ⚠️ 주의사항

1. **Sentry DSN** 설정이 필수입니다 (에러 때문에 서버 시작 실패 가능)
2. **Redis 없이도 동작**하지만, 메모리 캐시는 서버 재시작 시 사라집니다
3. **개발 환경에서만 전체 캐시 플러시** 가능
4. **인증된 사용자별로 캐시 분리**되어 데이터 누수 방지

## Prisma 사용법

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
