# Project Instructions — 건기식 성분·가격 비교 초자동화 플랫폼 (Super-Calc MVP)

본 문서는 Cursor / Antigravity / Gemini CLI / Claude Code 가 공통으로 읽는 최상위 글로벌 규칙(`AGENTS.md`) 입니다. 단일 진실 원천(SSOT)은 PRD 와 SRS 이며, 본 문서는 그 요약과 도구 라우팅 인덱스만 담습니다.

- 비즈니스 SSOT: [docs/00_PRD_v1_0.md](docs/00_PRD_v1_0.md) (v1.0)
- 기술 SSOT: [docs/05_SRS_v1.md](docs/05_SRS_v1.md) (SRS-001 v1.4, ISO/IEC/IEEE 29148:2018)
- 개정 시 본 파일이 아닌 PRD/SRS 를 먼저 수정하고, 본 파일은 요약만 동기화합니다.

---

## 1. Project Overview

### Vision
수동 엑셀 계산과 뒷광고 필터링에 지친 건강기능식품 소비자에게, **실시간 1일 단가 계산 + 의학 팩트체크 + 1탭 공유**를 제공하는 신뢰 기반 비교 플랫폼.

### Core Features (MVP, MoSCoW: Must)
- **F1. Super-Calc Engine** — 쿠팡 파트너스 단일 채널 1일 단가 정규화·정렬 (REQ-FUNC-001~009)
- **F2. Anti-BS Dashboard** — 식약처 건강기능식품공전 1:1 매칭 뱃지 + 일상어 번역, 광고 0건 (REQ-FUNC-010~015)
- **F3. Viral Engine** — 카카오톡 1-Tap 공유 카드, 앱 설치 불요 웹뷰 (REQ-FUNC-016~021)
- **F4. Data Trust System** — 원본 라벨 아카이브 + 오류 제보 48h SLA + 리워드 (REQ-FUNC-022~028)

### Target Personas
- **C1 한정훈** (36세, 개발자) — 가성비 최적화 직구족, 5초 내 최저가 확인
- **C2 박소연** (43세, 인사팀 과장) — 건강 계기 진입자, 30분 내 확신 있는 결정
- **A2 정수빈** (27세, 뷰티 마케터) — 트렌드 추종 탐색자, 5초 팩트체크 + 1탭 공유
- **E2 김도현** (29세, 데이터 분석가) — 극단적 신뢰 실패자, 출처 2클릭 + 48h 수정 SLA

### North Star KPI
- **TTC (Time-To-Completion)** — 탐색 시작 → 결제 링크 클릭 또는 SNS 공유 완료까지 **p50 ≤ 5분 / p95 ≤ 30분**

---

## 2. Confirmed Tech Stack (SRS §1.2.3 CON-7~13)

본 스택은 **확정**이며, 임의 변경 금지. 변경이 필요하면 SRS 부터 개정합니다.

| 영역 | 기술 | 근거 |
|---|---|---|
| 풀스택 프레임워크 | **Next.js (App Router) 14+ / TypeScript strict** — 프론트/백 분리 금지, 단일 모놀리스 | CON-7, CON-8 |
| 서버 로직 | **Route Handlers (`/app/api/v1/*`) + Server Actions (`/app/actions/*`)** — 별도 백엔드 서버 금지 | CON-8 |
| ORM / DB | **Prisma ORM + Supabase PostgreSQL** (로컬: SQLite, 배포: Supabase) | CON-9 |
| UI / 스타일 | **Tailwind CSS + shadcn/ui** | CON-10 |
| LLM (Phase 2) | **Vercel AI SDK** 배포 기반만 사전 셋업, MVP 단계 LLM 기능 미구현 | CON-11 |
| LLM Provider | **Google Gemini API** 인프라 기본 설정 | CON-12 |
| 배포 | **Vercel 단일 플랫폼, Git Push 자동 배포** | CON-13 |
| 캐시 | **Vercel KV (Redis 호환) / Next.js `unstable_cache` / `revalidate`** | SRS §3.6 |
| Cron | **Vercel Cron** (일 1회 가격 동기화 등) | SRS §3.6 |
| 이메일 | **Resend API** | REQ-FUNC-026 |
| 분석 / 트래킹 | **Mixpanel + Amplitude + Vercel Analytics** | REQ-NF-021, REQ-NF-022 |
| 외부 API | **쿠팡 파트너스 / 식약처 공공 API / 카카오 Link JS SDK** | SRS §3.1 |

### 금지 스택 (Out of Scope)
- 별도 백엔드 서버 (Java/Spring, FastAPI 등) — CON-7, CON-8 위반
- 별도 프론트엔드 SPA (Vite/React Router 등) — CON-7 위반
- Kafka / RabbitMQ / 별도 메시지 큐 — Vercel Cron 으로 충분
- 네이티브 앱 (iOS/Android, Flutter) — 모바일 웹 퍼스트 (OS-3)
- 자체 DB 호스팅 (MySQL/PostgreSQL 직접 운영) — Supabase 사용 (CON-9)
- 자체 Redis 운영 (Lettuce/Redisson) — Vercel KV 또는 Next.js Cache 사용

---

## 3. Hard Constraints (반드시 준수)

### 3-1. 법률 / 규제
- **CON-2 / REQ-NF-017** 건강기능식품법 — 뱃지 텍스트는 **식약처 건강기능식품공전 고시 문구만 래핑**. 질병 예방·치료 표현 **0건** 보장 (빌드 시 lint 검수 강제).
- **CON-1** 무단 크롤링 배제, **공식 Affiliate API 만 사용** (R1: 리스크 점수 20, Critical).

### 3-2. 보안 / 개인정보
- **REQ-NF-014** 전 구간 TLS 1.2+, SSL Labs 등급 A 이상
- **REQ-NF-015 / CON-4** 사용자 데이터 최소 수집 (MVP: 이메일, 비교 이력만)
- **REQ-NF-016 / CON-6** B2B 데이터 제공 시 k-anonymity ≥ 5
- Supabase RLS 정책 모든 테이블 적용

### 3-3. 성능 SLA (REQ-NF-001~005)
- 단가 비교 API: **p95 ≤ 3,500ms**
- 뱃지 렌더링: **p95 ≤ 1,000ms**
- 카카오 공유 카드 생성: **p95 ≤ 1,500ms**
- 출처 아코디언: **p95 ≤ 500ms**
- 전체 페이지 LCP: **≤ 2,500ms**

### 3-4. 비용
- **REQ-NF-019** MVP 월 인프라 비용 **≤ $50/월** (Vercel Pro + Supabase Pro 기본 가정)

### 3-5. 아키텍처
- **REQ-NF-024** 신규 외부 채널 추가는 `lib/adapters/` 의 `ChannelAdapter` 인터페이스 구현으로 한정 (전략 패턴). 기존 코드 변경 금지.
- 외부 API 비가용 시 `PRICE_SNAPSHOT` 캐시 폴백 적용 (SRS §3.1.1).
- 카카오 API 장애 시 CP-2 5단계 우회 전략 즉시 실행 (SRS §1.2.5).

---

## 4. Code & Workflow Standards

- **언어:** 코드 / 주석 / 식별자는 영어, 사용자 메시지·문서는 한국어 우선
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess`, 런타임 입력은 모두 Zod 로 검증
- **네이밍:** 파일 kebab-case, 컴포넌트 PascalCase, 함수/변수 camelCase, DB 컬럼 snake_case, 환경변수 UPPER_SNAKE
- **커밋:** Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`) — atomic commits
- **브랜치:** `<type>/<issue-number>-<short-desc>` (예: `feat/123-super-calc`). `main` 직접 커밋 금지
- **주석:** 의미 있는 주석만 작성 (WHY 중심, WHAT 은 코드로). 진부한 주석 즉시 삭제

---

## 5. Subagent / Skill Routing Index

작업 성격에 따라 적합한 서브에이전트 또는 스킬이 자동으로 위임됩니다.

### Subagents (`.claude/agents/`, `.cursor/agents/`, `.gemini/agents/`)
| 에이전트 | 도구 | 사용 시점 |
|---|---|---|
| `nextjs-fullstack` | Claude | Next.js App Router + Route Handlers + Server Actions + UI 구현 |
| `prisma-supabase` | Claude | Prisma 스키마 / 마이그레이션 / 시드, Supabase Auth·Storage·RLS |
| `external-api-integration` | Claude | 쿠팡 / 식약처 / 카카오 / Resend / Mixpanel 어댑터 |
| `document-updater` | Claude · Cursor | 커밋 직전 README / AGENTS.md / CLAUDE.md / docs 자동 동기화 |
| `mfds-compliance-auditor` | Cursor | 식약처 공전 1:1 매칭 + 금지 표현 검수 |
| `security-auditor` | Gemini | TLS · k-anonymity · OWASP · `.env` 누출 · RLS 점검 |
| `compliance-checker` | Gemini | 건강기능식품법 금지 표현 / 뱃지 텍스트 적법성 |
| `readme-architect` | Gemini | README 초안 작성 |

### Skills (`.agents/skills/`, 모든 도구에서 공유)
| 번호 | 범주 | 스킬 |
|---|---|---|
| 100 | Process | `100-error-fixing-process` 7단계 진단·수정 |
| 101 | Process | `101-build-and-env-setup` Next.js / Vercel / Supabase / Prisma 빌드·환경변수 |
| 102 | Process | `102-gitflow-agent` Git Flow 자동화 |
| 200 | Pattern | `200-git-commit-push-pr` 커밋·PR 표준 |
| 201 | Pattern | `201-code-commenting` 의미 있는 주석 정책 |
| 202 | Pattern | `202-github-issue-handling` `gh` CLI 기반 이슈·프로젝트 관리 |
| 300 | Stack | `300-nextjs-app-router-rules` App Router 구조·캐시 |
| 301 | Stack | `301-typescript-strict-rules` TS strict + Zod |
| 302 | Stack | `302-prisma-supabase-rules` Prisma 스키마 + Supabase Auth/Storage/RLS |
| 303 | Stack | `303-tailwind-shadcn-ui-rules` Tailwind + shadcn/ui + 카카오 웹뷰 호환 |
| 304 | Stack | `304-route-handler-server-action-rules` Route Handler + Server Action |
| 305 | Stack | `305-vercel-deploy-cron-kv-rules` Vercel 배포·Cron·KV |
| 306 | Stack | `306-coupang-mfds-kakao-integration-rules` 외부 API 어댑터 + 폴백 |
| 307 | Stack | `307-mfds-compliance-prohibited-expression-rules` 식약처 준수 |
| 308 | Stack | `308-mixpanel-analytics-rules` 이벤트 트래킹 표준 |
| 309 | Stack | `309-mobile-web-performance-a11y-rules` 성능 SLA + 접근성 |
| - | Meta | `generate-cursor-rule` / `generate-tasks-from-srs` 생성 가이드 |

### Workflows (`.agents/workflows/`, Antigravity)
- `generate-agent-rule` — 신규 에이전트 룰 생성 절차
- `generate-tasks-from-srs` — SRS → 개발 Task 추출
- `release-readiness-checklist` — Closed Beta / Public Launch 출시 점검
- `h1-h5-experiment-instrumentation` — H1~H5 가설 측정 셋업

---

## 6. Tool-Specific Harness Documents

- [README-common-harness.md](README-common-harness.md) — Cross-tool 공통 구성
- [README-cursor-harness.md](README-cursor-harness.md) — Cursor Rules / Skills / Agents / Hooks
- [README-claude-harness.md](README-claude-harness.md) — Claude Code CLAUDE.md / Skills / Agents
- [README-gemini-harness.md](README-gemini-harness.md) — Antigravity & Gemini CLI Rules / Skills / Workflows / Subagents
