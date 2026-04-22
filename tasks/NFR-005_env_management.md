---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-005: 환경변수 관리 체계 구성 (API Key 일괄 관리, Zod 검증 레이어)"
labels: 'feature, infra, epic:E-NFR, priority:high, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-005] 환경변수 관리 체계 구성
- 목적: 프로젝트에서 사용하는 모든 외부 API Key와 인프라 환경변수를 체계적으로 관리하고, 런타임 시 누락/오류를 즉시 감지하는 Zod 기반 검증 레이어를 구축한다.
- Epic / Phase: E-NFR / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
- SRS 외부 API: [`/05_SRS_v1.md#6.1.1`](../05_SRS_v1.md) — 쿠팡, 식약처, 카카오 API Key
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3`](../05_SRS_v1.md) — CON-5 (민감 정보 커밋 금지)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **NFR-001** (Vercel 배포)
- 후행 태스크: API-006 (쿠팡 환경변수), API-007 (식약처 환경변수), F3-C-002 (카카오 환경변수)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **환경변수 전체 목록 정의** — `.env.example` 완성
  ```env
  # Database
  DATABASE_URL=
  DIRECT_URL=
  
  # App
  NEXT_PUBLIC_APP_URL=
  
  # Coupang Partners API
  COUPANG_ACCESS_KEY=
  COUPANG_SECRET_KEY=
  COUPANG_PARTNER_ID=
  
  # MFDS API
  MFDS_API_KEY=
  
  # Kakao
  NEXT_PUBLIC_KAKAO_APP_KEY=
  
  # Resend (Email)
  RESEND_API_KEY=
  EMAIL_FROM_ADDRESS=
  
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  
  # Analytics
  NEXT_PUBLIC_MIXPANEL_TOKEN=
  
  # AI (Phase 2 예약)
  GOOGLE_AI_API_KEY=
  
  # Vercel Cron
  CRON_SECRET=
  ```
- [ ] **Zod 환경변수 검증 레이어** — `src/lib/env.ts`
  - 서버 전용 환경변수(`z.object`)와 클라이언트 공개 환경변수(`z.object`) 분리
  - 서버: `DATABASE_URL`, `COUPANG_ACCESS_KEY`, `RESEND_API_KEY` 등
  - 클라이언트: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_KAKAO_APP_KEY` 등
  - 앱 기동 시 즉시 검증: 누락 시 명확한 에러 메시지와 함께 프로세스 종료
- [ ] **타입 안전한 환경변수 접근** — `env.COUPANG_ACCESS_KEY` 형태로 타입 추론 접근
- [ ] **환경별 분류 문서화** — Development / Preview / Production 각 환경에 필요한 변수 목록 README 반영
- [ ] **보안 검증** — `NEXT_PUBLIC_` 접두사가 없는 변수가 클라이언트에 노출되지 않는지 확인

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 환경변수 누락 시 즉시 에러**
- **Given**: `DATABASE_URL`이 설정되지 않은 상태
- **When**: 앱을 기동(`pnpm dev`)한다
- **Then**: "Missing required env: DATABASE_URL" 에러 메시지와 함께 프로세스가 즉시 종료된다.

**Scenario 2: 타입 안전한 접근**
- **Given**: 모든 환경변수가 설정된 상태
- **When**: `env.COUPANG_ACCESS_KEY`로 접근한다
- **Then**: TypeScript가 `string` 타입으로 자동 추론하며, 컴파일 에러가 없다.

**Scenario 3: 민감 정보 노출 차단**
- **Given**: `COUPANG_SECRET_KEY`가 서버 전용 변수로 정의된 상태
- **When**: 클라이언트 컴포넌트에서 접근을 시도한다
- **Then**: 접근이 불가하며, 번들에 포함되지 않는다.

## :gear: Technical & Non-Functional Constraints
- **민감 정보 (CON-5)**: `.env.local`, `.env.*.local` 파일 절대 커밋 금지. `.gitignore` 포함 확인.
- **`NEXT_PUBLIC_` 규칙**: Next.js 규칙에 따라 클라이언트 노출 변수만 `NEXT_PUBLIC_` 접두사 사용.

## :checkered_flag: Definition of Done (DoD)
- [ ] `.env.example`에 모든 환경변수 플레이스홀더가 포함되었는가?
- [ ] `src/lib/env.ts` Zod 검증 레이어가 구현되었는가?
- [ ] 환경변수 누락 시 명확한 에러 메시지가 출력되는가?
- [ ] 민감 변수가 클라이언트 번들에 포함되지 않는 것이 확인되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #NFR-001 (Vercel 배포)
- **Blocks**: #API-006, #API-007, #F3-C-002, #F4-C-004, #NFR-006
