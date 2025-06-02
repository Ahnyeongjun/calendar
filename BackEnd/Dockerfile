FROM node:18-alpine

# 필요한 패키지들 설치
RUN apk add --no-cache \
    mysql-client \
    openssl \
    libc6-compat \
    netcat-openbsd \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# 패키지 파일만 먼저 복사
COPY package*.json ./

# Prisma 스키마 파일 복사
COPY prisma ./prisma/

# 의존성 설치
RUN npm ci

# Prisma 클라이언트 생성
RUN npx prisma generate

# 소스 코드 복사
COPY . ./

# TypeScript 컴파일
RUN npm run build

# 포트 노출
EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# 시작 스크립트 생성
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Waiting for MySQL..."' >> /app/start.sh && \
    echo 'while ! nc -z mysql 3306; do' >> /app/start.sh && \
    echo '  echo "MySQL is unavailable - sleeping"' >> /app/start.sh && \
    echo '  sleep 2' >> /app/start.sh && \
    echo 'done' >> /app/start.sh && \
    echo 'echo "MySQL is up - running migrations"' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Starting application"' >> /app/start.sh && \
    echo 'npm start' >> /app/start.sh && \
    chmod +x /app/start.sh

# 애플리케이션 실행
CMD ["/app/start.sh"]
