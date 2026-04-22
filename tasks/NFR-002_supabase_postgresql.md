---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-002: Supabase 프로젝트 생성 + PostgreSQL 연결 + Prisma DATABASE_URL 설정"
labels: 'feature, infra, epic:E-NFR, priority:critical, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-002] Supabase PostgreSQL 연결 구성
- 목적: Supabase 프로젝트를 생성하고 PostgreSQL 데이터베이스를 Prisma ORM과 연결하여, 모든 데이터 스키마 태스크(DATA-002~011)의 마이그레이션 실행 환경을 확보한다.
- Epic / Phase: E-NFR (비기능·인프라) / Phase 1
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3`](../05_SRS_v1.md) — CON-9 (Prisma ORM + PostgreSQL)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Supabase (PostgreSQL, Storage, Auth)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (프로젝트 스캐폴딩, Prisma 초기화)
- 후행 태스크: NFR-003 (Storage), DATA-002~011 (스키마 마이그레이션 실행)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Supabase 프로젝트 생성** — Supabase Dashboard에서 New Project
  - Region: Northeast Asia (ap-northeast-1 / Seoul 또는 Tokyo)
  - Database Password: 강력한 비밀번호 생성 + 안전 보관
  - Free 플랜 기준 (DB 500MB, Auth 50K MAU)
- [ ] **PostgreSQL 연결 정보 수집**
  - Host: `db.{project-ref}.supabase.co`
  - Port: `5432` (Direct) / `6543` (Connection Pooler)
  - Database: `postgres`
  - `DATABASE_URL` (Connection Pooler, Prisma query용): `postgresql://postgres.{ref}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres?pgbouncer=true`
  - `DIRECT_URL` (Direct Connection, Prisma migrate용): `postgresql://postgres.{ref}:{password}@aws-0-{region}.pooler.supabase.com:5432/postgres`
- [ ] **Prisma 데이터소스 설정** — `prisma/schema.prisma` 업데이트
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```
- [ ] **로컬 환경 설정** — `.env.local`에 연결 정보 설정 (`.gitignore` 포함 확인)
- [ ] **Vercel 환경변수 등록** — `DATABASE_URL`, `DIRECT_URL`을 Vercel Dashboard에 설정
  - Production / Preview 환경에 각각 등록
- [ ] **연결 테스트** — `pnpm prisma db push` 또는 `pnpm prisma migrate dev` 실행하여 연결 확인
- [ ] **DB Studio 접근** — `pnpm prisma studio` 실행하여 GUI 접근 확인
- [ ] **Supabase Row Level Security (RLS)** — 기본 RLS 정책 확인
  - Prisma 직접 연결 시 RLS 우회 설정 또는 서비스 키 사용

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Prisma 마이그레이션 실행 가능**
- **Given**: Supabase PostgreSQL이 생성되고 `DATABASE_URL`이 설정된 상태
- **When**: `pnpm prisma migrate dev --name init`을 실행한다
- **Then**: 마이그레이션이 성공적으로 적용되고 에러 0건이다.

**Scenario 2: Prisma Studio로 DB 접근**
- **Given**: 연결 정보가 올바르게 설정된 상태
- **When**: `pnpm prisma studio`를 실행한다
- **Then**: 브라우저에서 Prisma Studio가 열리고 DB 테이블 목록이 표시된다.

**Scenario 3: Vercel 배포 환경에서 DB 연결**
- **Given**: Vercel 환경변수에 `DATABASE_URL`이 설정된 상태
- **When**: Vercel Preview 배포에서 `/api/health`를 호출한다
- **Then**: DB 연결이 정상이며 에러가 발생하지 않는다.

**Scenario 4: Free 티어 용량 확인**
- **Given**: Supabase Free 플랜 (DB 500MB)
- **When**: 초기 스키마 + 시드 데이터(DATA-011)를 적재한다
- **Then**: DB 사용량이 500MB의 50% 이하이다.

## :gear: Technical & Non-Functional Constraints
- **PostgreSQL 전용 (CON-9)**: MySQL, MongoDB 등 타 DB 금지.
- **Connection Pooler 필수**: Supabase는 Serverless 환경에서 Connection Pooler(PgBouncer) 사용 필수. `DATABASE_URL`에 `?pgbouncer=true` 포함.
- **Direct URL 분리**: Prisma migrate는 Direct Connection(`DIRECT_URL`)을 사용. PgBouncer 경유 시 마이그레이션 실패 가능.
- **Free 티어 제한**: DB 500MB, API 요청 50K/일, 실시간 연결 200개. MVP 규모에서 충분.

## :checkered_flag: Definition of Done (DoD)
- [ ] Supabase 프로젝트가 생성되었는가?
- [ ] Prisma `DATABASE_URL` + `DIRECT_URL` 이중 연결이 설정되었는가?
- [ ] `pnpm prisma migrate dev` 실행이 성공하는가?
- [ ] Vercel 환경변수에 등록되었는가?
- [ ] `.env.example`에 플레이스홀더만 포함(실키 미포함)되는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 스캐폴딩 + Prisma 초기화)
- **Blocks**:
  - #NFR-003 (Supabase Storage)
  - #DATA-002 ~ #DATA-011 (모든 Prisma 스키마 마이그레이션)
