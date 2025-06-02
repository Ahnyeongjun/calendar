FROM node:18-alpine

# 필요한 패키지들 설치
RUN apk add --no-cache \
    curl \
    netcat-openbsd \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# 패키지 파일만 먼저 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 컴파일 확인
RUN npm run build
RUN ls -la dist/

# 포트 노출
EXPOSE 3002

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# 시작 스크립트 생성
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Waiting for Kafka..."' >> /app/start.sh && \
    echo 'while ! nc -z kafka 9092; do' >> /app/start.sh && \
    echo '  echo "Kafka is unavailable - sleeping"' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "Kafka is up - starting notification service"' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# 애플리케이션 실행
CMD ["/app/start.sh"]