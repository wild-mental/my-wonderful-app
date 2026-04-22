---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-009: USER 테이블 Prisma 스키마 정의 및 마이그레이션 생성 (최소 수집: email, persona_type)"
labels: 'feature, data, security, epic:E-DATA, priority:critical, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-009] USER 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: CON-4(사용자 데이터 최소 수집 원칙: email, 비교 이력만) 및 REQ-FUNC-029(이메일 기반 계정 관리)를 **스키마 레벨에서 강제**한다. 사용자 식별자로서 ERROR_REPORT, COMPARISON_HISTORY 등 인증 기반 엔티티의 FK 앵커 역할. 최소 수집 원칙을 **기본 스키마에 코드로 박제**하여 향후 무분별한 개인정보 필드 추가를 차단한다.
- Epic / Phase: E-DATA / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.7 USER`](../05_SRS_v1.md) — 4개 필드 원문 명세
- SRS 문서 (제약): [`/05_SRS_v1.md#1.2.3 CON-4`](../05_SRS_v1.md) — 최소 수집 원칙
- SRS 문서 (요구): [`/05_SRS_v1.md#4.1.5 REQ-FUNC-029`](../05_SRS_v1.md) — 이메일 기반 계정 관리
- SRS 문서 (보안 NFR): [`/05_SRS_v1.md#4.2.3 REQ-NF-015`](../05_SRS_v1.md) — 수집 필드 2개 기술 검증
- SRS 문서 (Auth 서비스): [`/05_SRS_v1.md#6.3.1`](../05_SRS_v1.md) — 인증 서비스 연계
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (Prisma 초기화)
- 후행 태스크: DATA-007 (ERROR_REPORT FK), DATA-008 (COMPARISON_HISTORY FK), DATA-010, COM-C-001 (가입), COM-C-002 (인증/세션), TEST-COM-001, NFR-SEC-002

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model User` 블록 추가
- [ ] **필드 매핑 (SRS §6.2.7 원문 + 최소 필수 운영 필드)**:
  - `user_id: String @id @default(cuid())`
  - `email: String @unique` (정규식 검증 스키마 레벨 및 Zod 레벨 이중 적용)
  - `email_verified_at: DateTime?` (이메일 검증 완료 시각, 미검증은 null)
  - `persona_type: PersonaType?` (Enum: `C1` / `C2` / `A2` / `E2` — 선택적, 온보딩 설문)
  - `role: UserRole @default(USER)` (Enum: `USER` / `ADMIN` — RBAC, SRS §1.3)
  - `created_at: DateTime @default(now())`
  - `updated_at: DateTime @updatedAt`
  - `last_login_at: DateTime?`
  - `deleted_at: DateTime?` (Soft delete 마커. 탈퇴 요청 시 즉시 NULL→now(), 30일 후 실 삭제 배치)
- [ ] **Enum 정의**:
  - `enum PersonaType { C1 C2 A2 E2 }`
  - `enum UserRole { USER ADMIN }`
- [ ] **금지 필드 명시** — 스키마 주석으로 "**DO NOT ADD**: name, phone, birth_date, gender, address, height, weight, medical_history" 명시 (CON-4 보호 아키텍처 박제)
- [ ] **인덱스 설계**:
  - `email`은 `@unique`로 자동 인덱스
  - `@@index([persona_type])` — 세그먼트 분석용
  - `@@index([role])` — 관리자 필터
  - `@@index([deleted_at])` — 탈퇴 대기 배치
- [ ] **Reverse Relation** — `model User`에 `reports ErrorReport[]`, `comparison_histories ComparisonHistory[]` 관계 필드 추가(DATA-007, 008 FK 역참조)
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_user_table --create-only` → SQL 리뷰 → 적용
- [ ] **Zod 검증 스키마** — `src/lib/schemas/user.ts`:
  - `email`: RFC 5322 호환 정규식 + 소문자 정규화(`.toLowerCase()`), 254자 상한
  - `persona_type`: Enum 범위 검증
  - `role`: 가입 경로에서는 `USER`만 허용(관리자 권한 승격은 별도 admin API)
- [ ] **최소 수집 원칙 가드** — `src/lib/user/minimum-collection-guard.ts` 작성: 
  - 런타임 타입 가드로 USER 레코드의 키 집합이 허용 리스트(`['user_id', 'email', 'email_verified_at', 'persona_type', 'role', 'created_at', 'updated_at', 'last_login_at', 'deleted_at']`) 외 키를 **절대 포함하지 않음**을 검증
  - 테스트 레벨에서 실행되는 `validateUserSchemaMinimality()` 함수 제공 (NFR-SEC-002에서 호출)
- [ ] **개인정보 로깅 마스킹 헬퍼** — `src/lib/user/mask-email.ts` 작성: `maskEmail("user@example.com") => "u***@example.com"`. 로그·에러 리포트에 본 함수 경유 강제.
- [ ] **Soft Delete 헬퍼** — `src/lib/user/soft-delete.ts`에 `softDeleteUser(userId): Promise<void>` 정의. `deleted_at=now()` 설정 + 세션 무효화 hook.
- [ ] **Unit Test 작성** — 7건 이상: 이메일 정규화·유니크, persona Enum, Role 기본값 USER, 금지 필드 가드, 마스킹 유틸, Soft delete, `validateUserSchemaMinimality()`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 회원가입 (REQ-FUNC-029)**
- **Given**: 유효한 이메일 `user@example.com`이 제공되고 중복 없음
- **When**: Zod 파싱 후 `prisma.user.create({ data: { email: "user@example.com" } })`
- **Then**: USER 레코드가 생성되며, `user_id`, `created_at`, `role=USER`가 자동 주입된다. `email_verified_at`은 null.

**Scenario 2: 중복 이메일 가입 시도**
- **Given**: `user@example.com`이 이미 저장된 상태
- **When**: 동일 이메일로 INSERT 시도
- **Then**: Prisma `P2002` 유니크 제약 위반 에러. 애플리케이션 레이어에서 HTTP 409 Conflict로 매핑.

**Scenario 3: 대소문자 정규화**
- **Given**: Zod 스키마
- **When**: `"User@Example.COM"`을 파싱
- **Then**: `"user@example.com"`으로 소문자 변환된 상태로 저장되어, 대소문자 변형 재가입이 불가능하다.

**Scenario 4: 최소 수집 원칙 기술 검증 (REQ-NF-015)**
- **Given**: `validateUserSchemaMinimality()` 테스트
- **When**: Prisma 모델 필드 목록을 런타임 리플렉션으로 추출
- **Then**: 허용 리스트 외 필드(`name`, `phone`, `birth_date` 등)가 존재하면 테스트 실패. 모든 필드가 허용 리스트에 속하면 통과.

**Scenario 5: 개인정보 로그 마스킹**
- **Given**: 에러 로깅 유틸
- **When**: `logger.error({ email: user.email })`를 호출(직접 로깅 경로)
- **Then**: Pino/Winston 시리얼라이저가 `email` 키를 감지하여 `"u***@example.com"`으로 자동 마스킹한다. (본 태스크에서는 마스킹 함수만 제공, logger 설정은 NFR-MON-001에서 적용)

**Scenario 6: Soft Delete 흐름**
- **Given**: USER `U1` 활성 상태
- **When**: `softDeleteUser("U1")` 호출
- **Then**: `deleted_at`이 현재 시각으로 설정되고, 세션 관련 hook이 호출된다. 조회 쿼리에서 `deleted_at: null` 필터가 기본 적용된다.

**Scenario 7: 관리자 Role 승격 경로 보호**
- **Given**: 일반 가입 Zod 스키마
- **When**: `{ email, role: "ADMIN" }`을 가입 엔드포인트로 전송
- **Then**: `role` 필드는 Zod 파싱에서 무시(또는 거부)되어 기본값 `USER`로 저장된다. ADMIN 승격은 별도 관리자 도구로만 가능.

## :gear: Technical & Non-Functional Constraints
- **법률·개인정보 (CON-4, REQ-NF-015)**: USER 스키마에 **CON-4 허용 필드 외 추가 금지**. PR 리뷰에서 스키마 변경 시 개인정보/법률 검토자 승인 필수. 본 태스크의 `validateUserSchemaMinimality()` 테스트는 **CI 필수 게이트**.
- **이메일 유효성 (REQ-FUNC-029)**: Zod `.email()` + RFC 5322 준수 정규식 + 소문자 정규화. 대소문자 변형으로 인한 중복 가입 공격 원천 차단.
- **보안 (REQ-NF-014)**: TLS 1.2+는 배포 레이어(Vercel)에서 보장됨. 본 태스크의 DB 측 요건은 email을 평문 저장하되, 로그·외부 전송 시 마스킹 필수.
- **비밀번호 저장 미포함**: MVP는 이메일 기반 magic link 또는 OAuth 전제(Supabase Auth, COM-C-002). USER 테이블에 `password_hash` 컬럼 **추가 금지**. 비밀번호 기반 인증 도입 시 별도 보안 검토 태스크 선행.
- **RBAC (SRS §1.3)**: `role` Enum은 `USER`, `ADMIN` 2단계로 MVP 단순화. Phase 2 B2B 고객용 별도 role(예: `B2B_VIEWER`) 추가는 P2-005 태스크에서 진행.
- **Soft Delete 정책**: 30일 유예기간 후 물리 삭제 배치 운영. 유예기간 동안 관련 COMPARISON_HISTORY/ERROR_REPORT는 유지. 물리 삭제 시 COMPARISON_HISTORY는 Cascade, ERROR_REPORT는 Restrict(제보는 감사 보존).
- **CQRS 분리 (P2)**: 본 태스크는 스키마·검증·헬퍼에 한정. 회원가입 비즈니스 로직은 COM-C-001, 인증/세션은 COM-C-002에서 담당.
- **CP-1 FK 회고 적용**: LABEL_ARCHIVE(DATA-006)의 `uploaded_by`는 DATA-009 완료 후 DATA-010에서 FK로 연결 처리.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] `model User` + 2개 Enum이 정의되고 `prisma validate` 통과하는가?
- [ ] **금지 필드 주석**(DO NOT ADD)이 스키마에 명시되었는가?
- [ ] `validateUserSchemaMinimality()` 테스트가 CI에 등록되어 필드 추가 시 실패하는가?
- [ ] Zod 스키마가 이메일 소문자 정규화·유니크·Enum을 검증하는가?
- [ ] `role` 승격 경로가 일반 가입에서 차단되는가?
- [ ] `maskEmail()` 헬퍼와 Soft Delete 헬퍼가 테스트로 검증되는가?
- [ ] 마이그레이션 SQL이 리뷰되고 `@unique email` 인덱스가 확인되는가?
- [ ] NFR-SEC-002(최소 수집 원칙 기술 검증)에서 참조할 **수집 필드 2개 docstring**이 포함되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
- **Blocks**: 
  - #DATA-007 (ERROR_REPORT — reporter_id FK)
  - #DATA-008 (COMPARISON_HISTORY — user_id FK)
  - #DATA-010 (ERD 통합 검증, LABEL_ARCHIVE.uploaded_by FK 추가)
  - #COM-C-001 (이메일 기반 가입 Server Action)
  - #COM-C-002 (인증/세션 관리)
  - #TEST-COM-001 (최소 수집 원칙 테스트)
  - #NFR-SEC-002 (기술 적용 검증)
  - #UI-050 (회원가입/로그인 페이지)
  - #UI-060 (관리자 RBAC)

## :bookmark_tabs: Notes
- SRS §6.2.7 원문은 `user_id`, `email`, `persona_type`, `created_at` 4개 필드만 명시. 본 태스크는 운영 최소 필수(`email_verified_at`, `role`, `updated_at`, `last_login_at`, `deleted_at`)를 추가한다. **추가된 필드는 모두 CON-4 허용 범주 내의 시스템 운영 메타데이터**이며 사용자 식별/프로파일링 정보는 아니다. ERD 검증(DATA-010)에서 이 판단을 재확인한다.
- `persona_type`은 선택적(`?`)으로 두어 CON-4에 저촉되지 않는다(사용자가 직접 동의한 범주 태그).
- 실제 이메일 인증, Magic Link 발송, OAuth 연동은 COM-C-002(Supabase Auth) 태스크에서 다룬다. 본 테이블은 Supabase Auth와 별도로 우리 도메인 레벨의 USER 레코드를 관리한다 (양쪽 user_id를 일치시키거나 매핑 테이블 운영).
- **아키텍처 결정(ADR) 필요**: Supabase Auth의 `auth.users`와 본 `public.User`의 관계(shared user_id vs separate mapping)를 COM-C-002 착수 전 결정할 것.
