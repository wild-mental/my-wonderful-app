---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-C-001: 이메일 기반 사용자 가입 로직 구현 (최소 수집: email만, 추가 개인정보 필드 존재 금지)"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-C-001] 이메일 기반 사용자 가입 [Command]
- 목적: SRS REQ-FUNC-029 및 CON-4 "최소 수집 원칙"을 코드 수준에서 강제하는 사용자 가입 로직을 구현한다. 수집 필드를 `email`(필수)와 `persona_type`(선택, 페르소나 분석용)로 한정하며, 이름·전화번호·생년월일 등 추가 개인정보 필드의 존재 자체를 차단한다. 가입 성공 시 USER 레코드를 생성하고, 이메일 인증 토큰 발송 트리거를 호출한다.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-029 (이메일 기반 회원가입)
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-4 (개인정보 최소 수집)
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2 비기능 요구사항`](../05_SRS_v1.md) — REQ-NF-015 (개인정보 보호)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.7 USER`](../05_SRS_v1.md)
- 선행 태스크: **DATA-009** (USER 테이블 Prisma 스키마)
- 후행 태스크: COM-C-002 (인증/세션 관리), DATA-008 (COMPARISON_HISTORY FK), UI-050 (회원가입 UI), TEST-COM-001
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Signup DTO 및 Zod 스키마 정의** — `src/types/auth/signup.ts`, `src/schemas/signup.schema.ts`
  - `SignupRequest`: `{ email: string; persona_type?: PersonaType }`
  - `PersonaType` enum: `BUSY_PROFESSIONAL | HEALTH_BEGINNER | INFORMED_OPTIMIZER` (SRS Section 1.3 Persona)
  - Zod: `email` RFC 5322 검증, `persona_type` enum 검증
- [ ] **Signup Server Action 구현** — `src/app/(auth)/_actions/signup.ts`
  - `'use server'` 디렉티브 + `SignupRequestSchema.safeParse()` 검증
  - 중복 이메일 체크 (Prisma `findUnique({ where: { email } })`)
  - USER 레코드 INSERT (`prisma.user.create`)
- [ ] **최소 수집 정적 검증 가드** — Sentinel 패턴
  - `src/lib/auth/__guards/no-extra-pii.ts`: `SignupRequest` 타입에서 `name | phone | birthdate | address` 등 키를 union으로 거부
  - 컴파일 타임에 추가 PII 필드 시도를 차단 (`Exclude<keyof T, ForbiddenPiiKeys>`)
- [ ] **이메일 인증 토큰 생성 트리거** — Supabase Auth 또는 NextAuth 연동 인터페이스 호출
  - 본 태스크는 트리거만 호출, 실제 토큰 발송 로직은 COM-C-002에서 구현
  - `await authProvider.sendVerificationEmail(email)`
- [ ] **에러 처리** — API-008 공통 에러 스키마 준수
  - `EMAIL_ALREADY_REGISTERED` (409)
  - `EMAIL_INVALID_FORMAT` (400)
  - `SIGNUP_RATE_LIMIT_EXCEEDED` (429): IP당 시간당 5건 (스팸 가입 방지)
- [ ] **개인정보 마스킹 로깅** — 가입 로그에 이메일 마스킹 처리
  - `[INFO] User signup: a***@example.com, persona=HEALTH_BEGINNER`
  - REQ-NF-015 준수
- [ ] **CON-4 준수 자동 검증 테스트** — USER 테이블 Prisma 스키마와 SignupRequest 타입에서 허용된 필드가 `{email, persona_type}` 외에 없음을 단위 테스트로 보장
- [ ] **JSDoc 주석** — `@privacy CON-4 minimum collection`, `@security REQ-NF-015 PII masking required` 표기

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 가입**
- **Given**: 유효한 이메일(`new-user@example.com`)과 `persona_type: HEALTH_BEGINNER`가 주어진 상태
- **When**: signup Server Action을 호출함
- **Then**: HTTP 201과 함께 `user_id`가 반환되고, USER 테이블에 `email`과 `persona_type`만 저장되며, 이메일 인증 토큰 발송이 트리거된다.

**Scenario 2: 중복 이메일 차단**
- **Given**: DB에 이미 존재하는 이메일(`existing@example.com`)이 주어진 상태
- **When**: signup을 호출함
- **Then**: HTTP 409, `error_code: "EMAIL_ALREADY_REGISTERED"`가 반환되며 USER 레코드는 생성되지 않는다.

**Scenario 3: 잘못된 이메일 형식 차단**
- **Given**: `not-an-email` 같은 형식 위반 이메일이 주어진 상태
- **When**: signup을 호출함
- **Then**: HTTP 400, `error_code: "EMAIL_INVALID_FORMAT"`이 반환되며 Zod 에러 메시지가 포함된다.

**Scenario 4: 추가 개인정보 필드 시도 거부 (CON-4 핵심)**
- **Given**: 클라이언트가 `{ email, name: "홍길동", phone: "010-1234-5678" }`로 호출 시도
- **When**: signup Server Action이 페이로드를 검증함
- **Then**: Zod의 `.strict()` 모드로 `name`, `phone` 필드가 거부되고 HTTP 400을 반환한다 (USER 테이블에 해당 컬럼이 존재하지 않으므로 DB 레벨에서도 이중 차단).

**Scenario 5: PII 마스킹 로깅**
- **Given**: 가입 성공 시
- **When**: 서버 로그를 확인함
- **Then**: `email`은 `a***@example.com` 형태로 마스킹되어 출력되며, 평문 이메일은 로그에 등장하지 않는다.

## :gear: Technical & Non-Functional Constraints
- **최소 수집 원칙 (CON-4)**: USER 테이블 컬럼은 `id, email, persona_type, created_at, updated_at` 5개로 한정. `name | phone | birthdate | address` 등 PII 필드 추가는 본 태스크 범위에서 절대 금지.
- **비밀번호 미수집**: 비밀번호 인증을 사용하지 않고 이메일 매직 링크/OTP 방식(Supabase Auth 또는 NextAuth Email Provider) 채택. 비밀번호 컬럼 자체가 USER 테이블에 존재하지 않아야 함.
- **이메일 정규화**: 입력 이메일은 lowercase + trim 처리 후 저장 (대소문자 차이로 인한 중복 가입 방지).
- **Zod `.strict()` 모드**: SignupRequestSchema는 정의되지 않은 필드를 거부하는 `.strict()` 모드로 작성하여 추가 필드 시도를 런타임에서 차단.
- **개인정보 마스킹 (REQ-NF-015)**: 모든 로그·에러 메시지·모니터링 페이로드에서 이메일은 `local[0] + "***@" + domain` 형태로 마스킹.
- **Rate Limit**: IP당 시간당 5건 (스팸 가입 방지). 본 태스크는 인터페이스만 호출하고 실 구현은 NFR-MON-002 또는 미들웨어에서 처리.
- **트랜잭션**: USER 생성과 인증 토큰 발송 트리거는 동일 트랜잭션 내에서 실행하지 않음 (외부 호출 실패 시 USER가 생성되지 않으면 재가입 시 중복 에러). 대신 USER는 `email_verified_at: null` 상태로 생성하고, 인증 메일 재발송을 별도 액션으로 제공.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `SignupRequest` 타입과 `SignupRequestSchema` Zod 스키마가 `.strict()` 모드로 정의되었는가?
- [ ] USER 테이블 컬럼이 `{id, email, persona_type, email_verified_at, created_at, updated_at}` 외에 존재하지 않는가?
- [ ] 이메일 정규화(lowercase + trim) 로직이 구현되었는가?
- [ ] 모든 로그·에러 메시지에서 이메일이 마스킹되는가?
- [ ] CON-4 자동 검증 테스트(추가 PII 필드 부재)가 통과하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(scenario 1~5)와 Integration 테스트(DB 통합)가 작성되고 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-009 (USER 테이블 Prisma 스키마), #API-008 (공통 에러 스키마)
- **Blocks**:
  - #COM-C-002 (인증/세션 관리 — 이메일 인증 토큰 발송 실 구현)
  - #UI-050 (회원가입/로그인 UI)
  - #DATA-008 (COMPARISON_HISTORY FK 의존)
  - #TEST-COM-001 (최소 수집 원칙 검증 테스트)
  - #NFR-SEC-002 (최소 수집 원칙 기술적 적용 검증)

## :bookmark_tabs: Notes
- 본 태스크는 SRS CON-4의 핵심 통제 지점이다: 단순 코드 작성이 아니라, 추가 PII 필드 도입을 코드 수준에서 영구적으로 차단하는 가드 패턴(타입 시스템 + Zod strict + DB 스키마 3중 방어)을 구축한다.
- `persona_type`은 페르소나 분석용 비식별 카테고리 데이터이므로 PII로 분류하지 않는다 (개인을 특정할 수 없음).
- 비밀번호 인증을 의도적으로 배제하는 이유: (1) 비밀번호 = 추가 PII성 데이터, (2) 비밀번호 분실/재설정 플로우의 복잡성, (3) MVP 범위 단순화. 매직 링크 방식이 모바일 웹 UX에도 적합.
- COM-C-002에서 Supabase Auth/NextAuth 결정 후, 본 태스크의 `authProvider.sendVerificationEmail()` 인터페이스 구현체를 주입한다.
