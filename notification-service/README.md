# Calendar Notification Service

Discord Bot과 Kafka를 활용한 캘린더 알림 마이크로서비스입니다.

## 🌟 기능

- **Discord Bot**: 캘린더 이벤트 알림 및 명령어 처리
- **Kafka Consumer**: 캘린더 백엔드로부터 이벤트 수신
- **자동 리마인더**: 일정 시작 15분 전 자동 알림
- **RESTful API**: 서비스 상태 모니터링 및 커스텀 알림
- **Graceful Shutdown**: 안전한 서비스 종료 처리

## 🏗️ 아키텍처

```
Calendar Backend → Kafka → Notification Service → Discord
                                ↓
                          Other Services (Email, Push, etc.)
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
PORT=3002

# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_CHANNEL_ID=your_channel_id_here

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=notification-service
KAFKA_GROUP_ID=notification-group

# API Configuration
CALENDAR_API_URL=http://localhost:3001
```

### 3. Discord Bot 설정

1. [Discord Developer Portal](https://discord.com/developers/applications)에서 새 애플리케이션 생성
2. Bot 탭에서 봇 토큰 복사
3. OAuth2 → URL Generator에서 봇 권한 설정:
   - `Send Messages`
   - `Read Message History`
   - `Use Slash Commands`
4. 생성된 URL로 봇을 서버에 초대

### 4. Kafka 설정

Apache Kafka가 실행 중이어야 합니다:

```bash
# Kafka 시작 (로컬 환경)
bin/kafka-server-start.sh config/server.properties
```

### 5. 서비스 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm run build
npm start
```

## 🤖 Discord Bot 명령어

- `!help` - 전체 도움말
- `!calendar help` - 캘린더 명령어 도움말
- `!calendar today` - 오늘의 일정 조회
- `!calendar week` - 이번 주 일정 조회
- `!calendar stats` - 서비스 통계 조회

## 📡 API 엔드포인트

### 서비스 상태 확인

```bash
GET /health
```

### 서비스 통계 조회

```bash
GET /status
```

### 커스텀 알림 전송

```bash
POST /notify
Content-Type: application/json

{
  "userId": "user123",
  "message": "커스텀 알림 메시지",
  "metadata": {}
}
```

### 메트릭 조회 (Prometheus 형식)

```bash
GET /metrics
```

## 📊 Kafka Topics

- `calendar-events` - 캘린더 이벤트 (생성/수정/삭제)
- `discord-notifications` - Discord 알림 메시지
- `user-activities` - 사용자 활동 로그
- `email-notifications` - 이메일 알림 (향후 확장)
- `push-notifications` - 푸시 알림 (향후 확장)

## 🔧 개발

### 프로젝트 구조

```
src/
├── config/           # Kafka 설정
├── discord/          # Discord Bot 서비스
├── kafka/            # Kafka 소비자/생산자
├── services/         # 비즈니스 로직
├── server.ts         # Express API 서버
└── index.ts          # 메인 진입점
```

### 타입스크립트 컴파일

```bash
npm run build
```

### 로그 모니터링

서비스는 구조화된 로그를 제공합니다:

- ✅ 성공 작업
- ❌ 오류 상황
- ⚠️ 경고 메시지
- 📅 캘린더 이벤트
- 🔔 알림 발송
- 📊 통계 정보

## 🐳 Docker 실행

```bash
# Dockerfile 생성 후
docker build -t calendar-notification-service .
docker run -p 3002:3002 --env-file .env calendar-notification-service
```

## 📈 모니터링

### Health Check

```bash
curl http://localhost:3002/health
```

### Prometheus 메트릭

```bash
curl http://localhost:3002/metrics
```
