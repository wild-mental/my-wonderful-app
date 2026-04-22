---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-001: Next.js App Router + Prisma + Tailwind + shadcn/ui 프로젝트 초기 스캐폴딩"
labels: 'feature, infra, epic:E-INFRA, priority:critical, phase:0'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-001] Next.js App Router 기반 풀스택 모놀리스 초기 스캐폴딩
- 목적: SRS가 명시한 기술 스택(Next.js App Router + Prisma + Tailwind + shadcn/ui)을 기준으로 Vercel 단일 배포 가능한 프로젝트 골격을 구축하여, 이후 모든 Phase 1 데이터·계약 태스크(DATA-002~010, API-001~008)의 선행 기반(SSOT)을 확보한다.
- Epic / Phase: E-INFRA / Phase 0 (인프라·스캐폴딩)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (제약사항): [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-7 ~ CON-13
- SRS 문서 (컴포넌트 다이어그램): [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.1 데이터베이스 스키마 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **None** (Critical Path의 시작점)
- 후행 태스크: DATA-002 ~ DATA-010, API-006/007/008, NFR-001/002, UI-001

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **프로젝트 초기화** — `pnpm create next-app@latest` 실행 (TypeScript, App Router, ESLint, Tailwind, src/ 디렉토리, Import Alias `@/*` 활성)
- [ ] **Node.js / 패키지 매니저 버전 고정** — `.nvmrc` (Node 20 LTS 이상), `package.json#packageManager` 필드에 `pnpm@9.x` 고정
- [ ] **Prisma 설치 및 초기화** — `pnpm add -D prisma`, `pnpm add @prisma/client` → `pnpm prisma init` (provider: `postgresql`, schema location: `prisma/schema.prisma`)
- [ ] **이중 DB Provider 대응** — `prisma/schema.prisma`의 `datasource db { provider = "postgresql" url = env("DATABASE_URL") }` 설정, 로컬 개발용 SQLite 대비 스크립트 주석 포함 (CON-9 준수)
- [ ] **Tailwind CSS v3.x 설정 점검** — `tailwind.config.ts`에 `content: ["./src/**/*.{ts,tsx,mdx}"]`, 기본 테마 확장 영역 준비 (UI-001과 연결)
- [ ] **shadcn/ui CLI 초기화** — `pnpm dlx shadcn@latest init` → `components.json` 생성 (style: `new-york`, base color: `neutral`, CSS variables 활성), 샘플 컴포넌트 1개(`Button`) 설치로 동작 검증
- [ ] **디렉토리 구조 확정** — `src/app/`(App Router), `src/app/api/v1/`(Route Handlers), `src/actions/`(Server Actions), `src/lib/adapters/`(ChannelAdapter, REQ-NF-024 대비), `src/lib/db.ts`(Prisma Singleton), `src/components/ui/`(shadcn), `prisma/`(schema, migrations)
- [ ] **Prisma Client Singleton 작성** — `src/lib/db.ts`에 전역 싱글톤 패턴 구현 (Next.js Dev 모드 HMR 대응, `globalThis.prisma` 재사용)
- [ ] **환경변수 템플릿 작성** — `.env.example` 생성 (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL` 등 Phase 1 필수 변수 플레이스홀더만 포함, 실제 키 노출 금지)
- [ ] **`.gitignore` 정비** — `node_modules/`, `.next/`, `.env*.local`, `prisma/dev.db*`, `coverage/`, `.vercel/` 포함 확인
- [ ] **기본 페이지 및 헬스체크 추가** — `src/app/page.tsx` 최소 Hello World, `src/app/api/health/route.ts` (GET → `{ ok: true, ts: ISOString }`) 반환
- [ ] **코드 품질 도구 설정** — ESLint (`next/core-web-vitals`), Prettier, TypeScript `strict: true`, `noUncheckedIndexedAccess: true`
- [ ] **테스트 프레임워크 스캐폴드** — Vitest + React Testing Library 설치, `vitest.config.ts` 작성, `tests/smoke.test.ts` 1건 (`1 + 1 === 2`)
- [ ] **빌드·타입체크·린트 스크립트** — `package.json#scripts`에 `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate:dev`, `db:studio` 등록
- [ ] **README 작성** — 로컬 실행 방법, 환경변수 세팅 절차, Prisma 마이그레이션 커맨드, 아키텍처 다이어그램 링크(SRS §3.6) 명시

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 신규 개발자가 로컬에서 프로젝트를 기동할 수 있다**
- **Given**: 저장소를 clone한 깨끗한 개발 머신(Node 20+, pnpm 9+ 설치 완료)
- **When**: `cp .env.example .env.local` → `pnpm install` → `pnpm dev`를 순차 실행한다
- **Then**: 3분 이내에 `http://localhost:3000` 접속 시 HTTP 200과 기본 페이지가 렌더링되고, `http://localhost:3000/api/health`가 `{ "ok": true }`를 응답한다.

**Scenario 2: Prisma Client가 싱글톤으로 동작한다**
- **Given**: `src/lib/db.ts`에 Prisma Client Singleton이 구현된 상태
- **When**: 개발 모드에서 HMR(Hot Module Reload)을 10회 트리거한다
- **Then**: 콘솔에 `warn(prisma-client) ... already 10 instances` 경고가 발생하지 않으며, DB 커넥션 풀이 재생성되지 않는다.

**Scenario 3: shadcn/ui 컴포넌트가 정상 렌더링된다**
- **Given**: `pnpm dlx shadcn@latest add button`으로 Button 컴포넌트가 설치된 상태
- **When**: 임시 페이지에 `<Button variant="default">Test</Button>`을 배치하고 빌드한다
- **Then**: Tailwind 유틸리티 클래스가 적용된 상태로 렌더링되며, `pnpm build` 시 에러·경고가 0건이다.

**Scenario 4: 품질 게이트가 모두 통과한다**
- **Given**: 초기 스캐폴딩이 완료된 상태
- **When**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`를 순차 실행한다
- **Then**: 모든 커맨드가 exit code 0으로 종료되며, `.next/` 빌드 산출물이 생성된다.

**Scenario 5: Vercel 배포 호환성이 확인된다 (CON-13)**
- **Given**: `main` 브랜치에 초기 스캐폴딩이 푸시된 상태
- **When**: Vercel Preview Deployment를 트리거한다 (NFR-001 후행 연계)
- **Then**: Preview URL이 HTTP 200을 반환하며, `/api/health` 엔드포인트가 정상 응답한다.

## :gear: Technical & Non-Functional Constraints
- **아키텍처 (CON-7, CON-8)**: 반드시 단일 Next.js 프로젝트 내에서 프론트/백이 통합된다. 별도 Express/NestJS 백엔드 분리 금지. 서버 로직은 **Route Handlers** 또는 **Server Actions**로만 작성.
- **DB (CON-9)**: Prisma ORM + PostgreSQL(Supabase 배포) 기준. 로컬 개발에서 SQLite를 써야 할 경우, Prisma schema의 provider 스위칭 전략을 주석으로 남기되 **기본은 PostgreSQL**.
- **UI (CON-10)**: Tailwind CSS + shadcn/ui 조합 외 CSS-in-JS 라이브러리(styled-components, Emotion 등) 도입 금지.
- **AI 준비 (CON-11, CON-12)**: `@vercel/ai` 패키지 `devDependencies` 수준 설치까지 허용하되, 실제 LLM 호출 구현은 **금지**. 환경변수 `GOOGLE_AI_API_KEY` 플레이스홀더만 `.env.example`에 선언.
- **배포 (CON-13)**: Vercel 단일 플랫폼 전제. `vercel.json`은 최소 설정(framework 자동 감지 허용).
- **성능 기준 (후행 REQ-NF-005 대비)**: 초기 페이지 LCP ≤ 2,500ms 만족할 수 있도록 불필요한 글로벌 임포트 금지, 기본 번들 사이즈 ≤ 150KB gzip 유지.
- **보안 (CON-5)**: `.env.local`, `.env.*.local` 파일은 절대 커밋 금지. 환경변수 로딩 시 검증 레이어(`src/lib/env.ts`, Zod 기반) 구조만 준비.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `pnpm install` → `pnpm dev` → `pnpm build`가 **클린 머신에서 에러 없이** 수행되는가?
- [ ] `pnpm lint` 경고 0건, `pnpm typecheck` 에러 0건, `pnpm test` 통과(smoke 테스트)
- [ ] `prisma/schema.prisma` 스켈레톤이 존재하며 `pnpm prisma generate`가 성공하는가?
- [ ] `README.md`에 로컬 실행, Prisma 마이그레이션, 환경변수 절차가 문서화되었는가?
- [ ] `.env.example`에 민감 정보 없이 **키 이름만** 포함되는가? (실키는 Vercel Dashboard/Secrets로 위임)
- [ ] SRS §3.6 컴포넌트 다이어그램과 디렉토리 구조(`src/app/api/v1`, `src/actions`, `src/lib/adapters`)가 1:1 정합하는가?
- [ ] PR 리뷰에서 **최소 1명의 아키텍처 검토자 승인**이 있는가?

## :construction: Dependencies & Blockers
- **Depends on**: None (Phase 0 시작점)
- **Blocks**: 
  - #DATA-002 (PRODUCT 스키마) — Prisma 초기화 선행 필요
  - #DATA-003 ~ #DATA-010 (전 스키마 태스크)
  - #API-006, #API-007, #API-008 (어댑터/타입 정의)
  - #NFR-001 (Vercel 배포 파이프라인)
  - #NFR-002 (Supabase 연결)
  - #UI-001 (디자인 시스템 기초)

## :bookmark_tabs: Notes
- 본 태스크는 **닫힌 문맥(Closed Context, P4 원칙)**을 엄격히 준수한다. 실제 스키마 정의(`prisma/schema.prisma`의 model 블록)는 **DATA-002 이후에 순차 추가**하며, 본 태스크에서는 **빈 스켈레톤**(generator + datasource 블록)만 커밋한다.
- shadcn/ui 컴포넌트 대량 설치는 금지. 본 태스크에서는 **동작 검증용 Button 1개**만 설치하고, 나머지는 UI-001~004에서 요구 단위로 추가한다.
- LLM·AI 관련 런타임 코드는 일체 포함하지 않는다 (CON-11).
