#!/bin/bash
set -e

# .env에서 변수 로드
export $(grep -v '^#' .env | xargs)

APP_IMAGE="${DOCKER_USER}/${DOCKER_REPOSITORY}:app-${APP_VERSION}"
AI_IMAGE="${DOCKER_USER}/${DOCKER_REPOSITORY}:ai-${AI_WORKER_VERSION}"
FRONTEND_IMAGE="${DOCKER_USER}/${DOCKER_REPOSITORY}:frontend-${FRONTEND_VERSION}"

echo "=============================="
echo " Build & Push 시작"
echo "=============================="
echo " app      : $APP_IMAGE"
echo " ai-worker: $AI_IMAGE"
echo " frontend : $FRONTEND_IMAGE"
echo "=============================="

# 1. FastAPI 빌드 & 푸시
echo ""
echo "[1/3] FastAPI 빌드 중..."
docker build -f app/Dockerfile -t "$APP_IMAGE" .
echo "[1/3] FastAPI 푸시 중..."
docker push "$APP_IMAGE"

# 2. AI Worker 빌드 & 푸시
echo ""
echo "[2/3] AI Worker 빌드 중..."
docker build -f ai_worker/Dockerfile -t "$AI_IMAGE" .
echo "[2/3] AI Worker 푸시 중..."
docker push "$AI_IMAGE"

# 3. Frontend 빌드 & 푸시
echo ""
echo "[3/3] Frontend 빌드 중..."
docker build -f frontend/Dockerfile -t "$FRONTEND_IMAGE" ./frontend
echo "[3/3] Frontend 푸시 중..."
docker push "$FRONTEND_IMAGE"

echo ""
echo "=============================="
echo " 모든 이미지 빌드 & 푸시 완료"
echo "=============================="
echo " app      : $APP_IMAGE"
echo " ai-worker: $AI_IMAGE"
echo " frontend : $FRONTEND_IMAGE"
echo "=============================="
