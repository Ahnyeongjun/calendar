# Multi-stage build for React Vite app
FROM node:18 AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
COPY bun.lockb* ./

# 캐시 클리어 후 설치
RUN rm -rf node_modules package-lock.json
RUN npm install

# 소스 코드 복사
COPY . .

# 환경 변수 설정 (빌드 시점)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# 프로덕션 빌드
RUN npm run build

# Production stage - Nginx 서빙
FROM nginx:alpine AS production

# curl 설치 (헬스체크용)
RUN apk add --no-cache curl

# 빌드된 파일을 nginx로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 커스텀 nginx 설정 복사 (SPA 라우팅 지원)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

# nginx 시작
CMD ["nginx", "-g", "daemon off;"]