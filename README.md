# AI Healthcare Project

지방간(NAFLD) 위험도를 AI 모델로 예측하고, SHAP 기반 설명과 개인화된 챌린지를 제공하는 헬스케어 서비스입니다.

## 주요 기술 스택

- **FastAPI** - 비동기 API 서버
- **SQLAlchemy (async)** - 비동기 ORM
- **PostgreSQL** - 데이터베이스
- **Alembic** - DB 마이그레이션
- **Redis** - 메시지 브로커 / 캐싱
- **AI Worker** - 지방간 예측 모델 추론 (Celery/Redis 기반)
- **JWT** - 인증
- **Docker Compose** - 컨테이너 실행

## 프로젝트 구조

```
.
├── ai_worker/              # AI 모델 워커
│   ├── core/               # 워커 설정 및 로거
│   ├── schemas/            # 입출력 스키마
│   ├── tasks/              # 예측 작업 로직
│   └── main.py             # 워커 진입점
├── app/                    # FastAPI 애플리케이션
│   ├── apis/v1/            # API 라우터 (v1)
│   ├── core/               # 앱 설정
│   ├── db/                 # DB 세션 및 Alembic 마이그레이션
│   ├── dependencies/       # 의존성 주입 (인증 등)
│   ├── dtos/               # 요청/응답 스키마
│   ├── models/             # SQLAlchemy 모델
│   ├── repositories/       # 데이터 접근 계층
│   ├── services/           # 비즈니스 로직
│   ├── tests/              # 테스트 코드
│   ├── utils/              # 유틸리티
│   ├── validators/         # 입력값 검증
│   └── main.py             # FastAPI 진입점
├── envs/                   # 환경 변수 예시 파일
├── nginx/                  # Nginx 설정
├── scripts/                # 배포 및 CI 스크립트
├── docker-compose.yml      # 개발용
├── docker-compose.prod.yml # 운영용
├── alembic.ini             # Alembic 설정
└── pyproject.toml          # 프로젝트 의존성
```

## 사전 준비

- Python 3.13 이상
- [uv](https://github.com/astral-sh/uv) 패키지 매니저
- Docker & Docker Compose

## 설치 및 실행

### 1. 의존성 설치

```bash
uv sync --group app   # API 서버용
uv sync --group ai    # AI 워커용
uv sync --group dev   # 개발/테스트용
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요. `envs/example.prod.env`를 참고하세요.

```bash
cp envs/example.prod.env .env
```

`.env` 파일에서 아래 항목을 본인 환경에 맞게 수정하세요:

```env
# docker 이미지 정보
DOCKER_USER=your_dockerhub_id
DOCKER_REPOSITORY=your_repo_name

# 앱 버전
APP_VERSION=v1.0.0
AI_WORKER_VERSION=v1.0.0

# 보안 키 (반드시 변경!)
SECRET_KEY=your-secret-key-here

# 도메인 (로컬 개발 시 localhost)
COOKIE_DOMAIN=localhost

# PostgreSQL 설정
DB_HOST=localhost         # 도커 실행 시: postgres
DB_PORT=5432
DB_EXPOSE_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=ai_health

# Redis
REDIS_PORT=6379
```

> **주의**: `.env` 파일은 `.gitignore`에 포함되어 있어 커밋되지 않습니다. 절대 커밋하지 마세요.

### 3. 도커로 전체 실행 (권장)

```bash
# 최초 실행 또는 코드 변경 후
docker compose up -d --build

# 이후 실행
docker compose up -d
```

**접속 주소:**
- API 문서: http://localhost/api/docs
- API 서버: http://localhost/api

### 4. 로컬에서 직접 실행 (도커 없이)

PostgreSQL과 Redis가 별도로 실행 중이어야 합니다.

```bash
# FastAPI 서버
uv run uvicorn app.main:app --reload

# AI Worker
uv run python -m ai_worker.main
```

## DB 마이그레이션

```bash
# 마이그레이션 파일 생성
uv run alembic revision --autogenerate -m "설명"

# 마이그레이션 적용
uv run alembic upgrade head

# 롤백
uv run alembic downgrade -1
```

## 모델 추가 시

1. `app/models/`에 SQLAlchemy 모델 정의
2. `app/db/databases.py`의 `Base`를 상속받았는지 확인
3. `alembic revision --autogenerate`로 마이그레이션 파일 생성

## 테스트

```bash
# 전체 테스트
./scripts/ci/run_test.sh

# 코드 포맷팅
./scripts/ci/code_fommatting.sh

# 타입 검사
./scripts/ci/check_mypy.sh
```

## 운영 배포

```bash
chmod +x scripts/deployment.sh
./scripts/deployment.sh
```
