# 간편한 하루 — AI 기반 개인 맞춤 간 건강 관리 서비스

지방간(NAFLD) 위험도를 AI 모델로 예측하고, Counterfactual 분석 기반 개선 지표와 LLM 개인화 챌린지를 제공하는 헬스케어 서비스입니다.

## 주요 기술 스택

### Frontend
- **React / TypeScript** - UI 구성
- **TailwindCSS** - 스타일링

### Backend
- **FastAPI** - 비동기 API 서버
- **SQLAlchemy (async)** - 비동기 ORM
- **PostgreSQL** - 데이터베이스
- **Alembic** - DB 마이그레이션
- **Redis** - LLM 추천 캐싱 / Celery 브로커
- **Celery** - 비동기 ML 추론 워커

### AI / ML
- **RandomForest / XGBoost / LightGBM Stacking** - 지방간 위험도 예측
- **Optuna** - 하이퍼파라미터 자동 튜닝
- **OpenAI** - 개인화 챌린지 추천 / 식단 이미지 분석

### Infra
- **Docker Compose** - 컨테이너 통합 관리
- **Nginx** - 리버스 프록시 / SSL / 정적 파일 서빙
- **GitHub Actions** - CI/CD 자동 배포
- **AWS EC2 / S3** - 서버 및 파일 스토리지

---

## 개발 시작 가이드 (처음 세팅하는 경우)

### Step 1. 필수 프로그램 설치

아래 3가지가 설치되어 있어야 합니다.

- **Python 3.13 이상** - [python.org](https://www.python.org/downloads/)
- **uv** - Python 패키지 매니저
  ```bash
  # macOS / Linux
  curl -LsSf https://astral.sh/uv/install.sh | sh

  # Windows (PowerShell)
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
- **Docker Desktop** - [docker.com](https://www.docker.com/products/docker-desktop/)

> ⚠️ Docker Desktop은 실행 중인 상태여야 합니다. 터미널에서 `docker ps` 쳤을 때 오류 없이 나오면 정상입니다.

### Step 2. 레포 클론

```bash
git clone https://github.com/AI-HealthCare-02/AI_02_03.git
cd AI_02_03
```

### Step 3. 의존성 설치

```bash
uv sync --group app --group dev
```

> ⚠️ `uv`가 설치되어 있지 않으면 Step 1로 돌아가세요.  
> `uv: command not found` 오류가 나면 터미널을 껐다 켜야 설치가 반영됩니다.

### Step 4. 환경 변수 설정

실행 방식에 따라 다른 예시 파일을 복사하세요:

```bash
# 도커로 실행할 경우
cp envs/example.prod.env .env

# 로컬에서 직접 실행할 경우 (uv run)
cp envs/example.local.env .env
```

> ⚠️ **`DB_HOST` 값이 실행 환경마다 달라요.**  
> - 도커로 실행 시: `DB_HOST=postgres` (도커 컨테이너 이름)  
> - 로컬에서 직접 실행 시: `DB_HOST=localhost`  
> 잘못 설정하면 DB 연결 오류가 납니다.

`.env` 파일을 열어서 아래 항목은 본인 환경에 맞게 수정하세요:

```env
SECRET_KEY=my-secret-key-change-this
OPENAI_API_KEY=your-openai-api-key
```

> ⚠️ **`.env` 파일은 절대 커밋하지 마세요.**

### Step 5. 도커 실행

```bash
docker compose up -d --build
```

> ⚠️ 처음 실행 시 이미지 다운로드로 시간이 걸릴 수 있습니다.  
> `--build` 옵션은 최초 실행 또는 코드 변경 후에만 필요합니다. 이후엔 `docker compose up -d`로 충분합니다.

정상 실행 확인:
```bash
docker ps
```

아래처럼 컨테이너가 `Up` 상태여야 합니다:
```
postgres    Up (healthy)
redis       Up (healthy)
fastapi     Up
ai-worker   Up
nginx       Up
```

**접속 확인:**
- API 문서: http://127.0.0.1:8000/api/docs

---

### Step 5-2. 로컬에서 직접 실행 (도커 없이 개발할 때)

DB와 Redis는 도커로, FastAPI와 프론트엔드는 로컬에서 직접 실행하는 방식입니다.

> ⚠️ Node.js가 설치되어 있지 않으면 [nodejs.org](https://nodejs.org/)에서 LTS 버전을 설치하세요.

---

#### 터미널 1 — 백엔드

```bash
# 1. 로컬용 환경변수 설정 (처음 한 번만)
cp envs/example.local.env .env

# 2. 백엔드 의존성 설치 (처음 한 번만)
uv sync --group app --group dev

# 3. DB · Redis만 도커로 실행
docker compose up -d postgres redis

# 4. DB 마이그레이션 (처음 한 번만 / pull 후 재실행)
uv run alembic upgrade head

# 5. 초기 데이터 삽입 (처음 한 번만)
uv run python -m app.db.seeds.challenges_seed

# 6. FastAPI 서버 실행
uv run uvicorn app.main:app --reload
```

접속 확인 → API 문서: http://localhost:8000/api/docs

---

#### 터미널 2 — 프론트엔드

```bash
cd frontend
npm install  # 처음 한 번만
npm run dev
```

접속 확인 → 프론트엔드: http://localhost:5173

---

## 프로젝트 구조

```
.
├── ai_worker/              # AI 모델 워커 (Celery)
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
├── frontend/               # React 프론트엔드
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── ui/     # shadcn 기본 컴포넌트
│       │   │   └── ...     # 공통 컴포넌트
│       │   ├── pages/      # 각 페이지
│       │   └── routes.tsx  # 라우팅 설정
│       ├── lib/
│       │   └── api.ts      # axios 인스턴스 및 인터셉터
│       ├── services/       # API 호출 함수
│       ├── store/          # 전역 상태 관리 (zustand)
│       └── styles/         # 전역 CSS
├── envs/                   # 환경 변수 예시 파일
├── nginx/                  # Nginx 설정
├── scripts/                # 배포 및 CI 스크립트
├── docker-compose.yml      # 개발용
├── docker-compose.prod.yml # 운영용
├── alembic.ini             # Alembic 설정
└── pyproject.toml          # 프로젝트 의존성
```

---

## DB 모델 추가 시

1. `app/models/`에 SQLAlchemy 모델 정의 (`Base` 상속)
2. 마이그레이션 파일 생성:
   ```bash
   uv run alembic revision --autogenerate -m "모델명 추가"
   ```
3. 마이그레이션 적용:
   ```bash
   uv run alembic upgrade head
   ```

## 테스트

```bash
./scripts/ci/run_test.sh
```

## 운영 배포

```bash
chmod +x scripts/deployment.sh
./scripts/deployment.sh
```
