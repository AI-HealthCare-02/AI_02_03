FROM node:22-alpine AS builder

WORKDIR /app

# 1. 의존성 패키지 관리 파일 복사
COPY package.json package-lock.json ./

# 2. 의존성 설치
RUN npm ci

# 3. 소스 코드 복사 및 빌드
COPY . .
RUN npx vite build

# --- 배포용 nginx 이미지 ---
FROM nginx:alpine

# 4. 빌드 결과물을 nginx 서빙 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 5. SPA 라우팅을 위한 nginx 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 6. 포트 노출
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
