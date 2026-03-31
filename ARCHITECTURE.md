# AI Healthcare Project Architecture

## 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│              (React/TSX Frontend)                           │
├─────────────────────────────────────────────────────────────┤
│                   Nginx (Reverse Proxy)                     │
├─────────────────────────────────────────────────────────────┤
│                    FastAPI Application                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   APIs(v1)  │  │ Dependencies│  │     DTOs            │ │
│  │  (Routers)  │  │  (Auth, DB) │  │  (Request/Response) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Services   │  │ Repositories│  │     Validators      │ │
│  │ (Business)  │  │ (Data Layer)│  │   (Input Check)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      AI Worker                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Tasks    │  │   Schemas   │  │       Core          │ │
│  │ (ML Logic)  │  │ (Data DTOs) │  │  (Config, Logger)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL  │  │    Redis    │  │      Docker         │ │
│  │ (Database)  │  │  (Broker)   │  │   (Containers)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 데이터 흐름

### API 요청 처리
```
Client → Nginx → FastAPI Router → Service → Repository → PostgreSQL
                                                ↑
                                          AsyncSession
                                         (SQLAlchemy)
```

### AI 예측 흐름
```
API 요청 → Service → Redis(큐) → AI Worker → 모델 추론 → SHAP 계산 → DB 저장
```

### 인증 흐름
```
로그인 요청 → AuthService → DB 조회 → JWT 발급 → 쿠키(refresh) + 응답(access)
보호된 요청 → HTTPBearer → JWT 검증 → 유저 조회 → 서비스 실행
```

## 컴포넌트 설명

### FastAPI App (`app/`)

| 레이어 | 경로 | 역할 |
|--------|------|------|
| API | `apis/v1/` | HTTP 요청/응답, 라우팅 |
| Service | `services/` | 비즈니스 로직, 트랜잭션 |
| Repository | `repositories/` | DB 쿼리 추상화 |
| Model | `models/` | SQLAlchemy 테이블 정의 |
| DTO | `dtos/` | 요청/응답 Pydantic 스키마 |
| Dependency | `dependencies/` | FastAPI 의존성 주입 |

### DB 세션 관리

`get_db()` 의존성을 통해 요청마다 세션을 생성하고, 성공 시 자동 commit, 실패 시 자동 rollback합니다.

```
Request → get_db() → AsyncSession → Service/Repository → commit or rollback
```

### AI Worker (`ai_worker/`)

| 디렉토리 | 역할 |
|----------|------|
| `tasks/` | 예측 작업 로직 (Redis 큐에서 꺼내서 모델 실행) |
| `schemas/` | 예측 입출력 데이터 구조 |
| `core/` | 설정, 로거 |

## 배포 구성

### 개발 환경 (`docker-compose.yml`)
```
postgres    - PostgreSQL 16
redis       - Redis (메시지 브로커)
fastapi     - API 서버 (소스코드 볼륨 마운트, reload 모드)
ai-worker   - AI 추론 워커
nginx       - 리버스 프록시 (포트 80)
```

### 운영 환경 (`docker-compose.prod.yml`)
```
EC2 Instance
├── postgres
├── redis
├── fastapi
├── ai-worker
├── nginx (포트 80, 443 + SSL)
└── certbot (SSL 자동 갱신)
```

## 보안

- **JWT**: Access Token(응답 바디) + Refresh Token(HttpOnly 쿠키)
- **Password**: bcrypt 해싱
- **환경변수**: `.env` 파일로 분리 (커밋 금지)
- **SQL Injection 방지**: SQLAlchemy ORM 파라미터 바인딩

## 코드 품질

- **Ruff**: 린팅 + 포맷팅
- **MyPy**: 정적 타입 검사
- **Pytest + pytest-asyncio**: 비동기 통합 테스트
