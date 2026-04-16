# AI Healthcare Project

지방간(NAFLD) 위험도를 AI 모델로 예측하고, SHAP 기반 설명과 개인화된 챌린지를 제공하는 헬스케어 서비스입니다.

## 주요 기술 스택

- **FastAPI** - 비동기 API 서버
- **SQLAlchemy (async)** - 비동기 ORM
- **PostgreSQL** - 데이터베이스
- **Alembic** - DB 마이그레이션
- **Redis** - 메시지 브로커 / 캐싱
- **AI Worker** - 지방간 예측 모델 추론
- **JWT** - 인증
- **Docker Compose** - 컨테이너 실행

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

### Step 2. 레포 클론 및 브랜치 설정

```bash
git clone https://github.com/AI-HealthCare-02/AI_02_03.git
cd AI_02_03

# dev 브랜치로 전환
git checkout dev
```

> ⚠️ **반드시 내 브랜치를 만들고 작업하세요.**  
> `git checkout dev` 한 뒤 바로 파일을 수정하면 dev 브랜치에 직접 작업하는 것입니다.  
> 아래 명령어로 내 브랜치를 먼저 만든 후 작업을 시작하세요.

```bash
# 내 작업 브랜치 생성 (이름은 본인 이름 또는 기능명으로)
# 예: feat/kim-auth, feat/lee-dashboard, feat/survey-api
git checkout -b feat/본인이름-기능명
```

작업 중 내가 어느 브랜치에 있는지 항상 확인하는 습관을 들이세요:
```bash
git branch
# * feat/본인이름-기능명   ← 앞에 * 표시가 현재 브랜치
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
# Docker Hub 계정 정보
DOCKER_USER=본인_도커허브_아이디
DOCKER_REPOSITORY=ai-health

# 보안 키 (아무 문자열로 변경)
SECRET_KEY=my-secret-key-change-this
```

> ⚠️ **`.env` 파일은 절대 커밋하지 마세요.**  
> 비밀번호, 시크릿 키 등 민감한 정보가 담겨 있습니다.  
> `.gitignore`에 등록되어 있어 `git add .` 해도 자동으로 제외되지만,  
> `git add .env` 처럼 직접 추가하면 올라가버립니다. 절대 하지 마세요.  
> 혹시 실수로 올렸다면 즉시 팀장에게 알려주세요.

### Step 5. 도커 실행

```bash
docker compose up -d --build
```

> ⚠️ 처음 실행 시 이미지 다운로드로 시간이 걸릴 수 있습니다. 기다려주세요.  
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
ai-worker   Restarting  ← 아직 미구현 상태로 정상
nginx       Up
```

**접속 확인:**
- API 문서: http://localhost/api/docs

> ⚠️ http://localhost:8000 이 아니라 http://localhost/api/docs 입니다. Nginx를 통해 접속합니다.

### Step 5-2. 로컬에서 직접 실행 (도커 없이 개발할 때)

DB와 Redis는 도커로, FastAPI와 프론트엔드는 로컬에서 직접 실행하는 방식입니다.  
코드 수정 시 즉시 반영되어 개발할 때 편리합니다.

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

# 4. DB 마이그레이션 (처음 한 번만 / dev pull 후 재실행)
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
# 1. 프론트엔드 디렉토리로 이동
cd frontend

# 2. 의존성 설치 (처음 한 번만)
npm install

# 3. 개발 서버 실행
npm run dev
```

접속 확인 → 프론트엔드: http://localhost:5173

---

> ⚠️ 백엔드와 프론트엔드는 터미널을 **각각 따로** 열어서 실행해야 합니다.  
> Step 4 · 5 (마이그레이션 · 시드)는 **처음 세팅할 때, 또는 `dev`를 pull 한 뒤 마이그레이션 파일이 추가됐을 때**만 다시 실행하면 됩니다.

---

## 개발 워크플로우

### 매일 작업 시작할 때

```bash
# 1. dev 최신 내용 가져오기
git checkout dev
git pull origin dev

# 2. 내 브랜치로 돌아와서 dev 내용 반영
git checkout feat/본인이름-기능명
git rebase origin/dev
```

> ⚠️ `git pull` 하기 전에 내 변경사항을 커밋하거나 stash 해두지 않으면 충돌이 날 수 있습니다.  
> 작업 중이라면 먼저 커밋하고 pull 하세요.

### 작업 후 커밋 & 푸시

```bash
git add .
git commit -m "feat: 기능 설명"
git push origin feat/본인이름-기능명
```

커밋 메시지 앞에 아래 prefix를 붙여주세요:
- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 코드 구조 변경
- `docs:` 문서 수정
- `chore:` 설정, 패키지 등 기타

### PR 올리기

1. GitHub 레포에서 **Pull requests** 탭 클릭
2. **New pull request** 버튼 클릭
3. 상단 드롭다운에서 타겟 브랜치 설정:
   ```
   base: dev  ←  compare: feat/본인이름-기능명
   ```
   - `base` = 코드를 받을 브랜치 → **반드시 `dev`로 설정**
   - `compare` = 내가 작업한 브랜치
4. **Create pull request** 클릭 후 제목/설명 작성

> ⚠️ `base`가 기본값인 `main`으로 되어있을 수 있습니다. 반드시 `dev`로 바꾸고 PR을 올리세요.  
> PR 올리기 전에 `git rebase origin/dev`로 최신 dev 내용을 반영해주세요.

---

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
├── frontend/               # React 프론트엔드
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── ui/     # shadcn 기본 컴포넌트 (수정 금지)
│       │   │   └── ...     # 공통 컴포넌트 (Layout, LiverCharacter 등)
│       │   ├── pages/      # 각 페이지 (Home, Login, Challenges 등)
│       │   └── routes.tsx  # 라우팅 설정
│       ├── lib/
│       │   └── api.ts      # axios 인스턴스 및 인터셉터
│       ├── services/       # API 호출 함수 (auth, survey, challenge 등)
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
