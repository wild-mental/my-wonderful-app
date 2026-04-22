---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-C-002: 사용자 인증/세션 관리 로직 구현 (Supabase Auth 또는 NextAuth 연동)"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-C-002] 인증/세션 관리 [Command]
- 목적: COM-C-001에서 생성된 USER 레코드에 대해 이메일 매직 링크/OTP 기반 인증을 처리하고, 인증 완료 후 안전한 세션(JWT 또는 Supabase Session)을 발급·검증·갱신·만료시키는 인증 인프라를 구축한다. 비밀번호 미수집 원칙(CON-4)을 유지하며, RBAC(관리자/일반 사용자)의 기반이 된다.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-029 (이메일 인증)
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Auth 모듈
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2 비기능 요구사항`](../05_SRS_v1.md) — REQ-NF-014 (TLS 1.2+), REQ-NF-018 (보안)
- SRS RBAC 정의: [`/05_SRS_v1.md#1.3 Stakeholders & Personas`](../05_SRS_v1.md) — 관리자 / 일반 사용자 권한 분리
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-4 (비밀번호 미수집), CON-9 (Supabase 인프라)
- 선행 태스크: **COM-C-001** (이메일 기반 가입), **DATA-009** (USER 테이블)
- 후행 태스크: ADM-* (관리자 백오피스 RBAC), F4-C-001 (제보 작성자 식별), DATA-008 (COMPARISON_HISTORY 사용자 연계), UI-050 (로그인 UI), UI-060 (관리자 RBAC UI)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **인증 공급자 선택 결정 문서화** — Supabase Auth vs NextAuth Email Provider
  - 선택 기준: SRS CON-9 (Supabase 인프라 채택), 매직 링크 지원, RBAC 확장성
  - 선택 결과: **Supabase Auth Email OTP** (CON-9 정합)
- [ ] **Supabase Auth 클라이언트 초기화** — `src/lib/auth/supabase.ts`
  - Server Component용 `createServerClient`
  - Client Component용 `createBrowserClient` (`@supabase/ssr` 활용)
  - Service Role 키는 서버 전용 환경변수로만 노출
- [ ] **이메일 인증 토큰 발송 액션** — `src/app/(auth)/_actions/send-magic-link.ts`
  - `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })`
  - Rate Limit (1분에 1회/이메일)
  - COM-C-001의 `authProvider.sendVerificationEmail` 인터페이스 구현
- [ ] **콜백 라우트 구현** — `src/app/(auth)/callback/route.ts`
  - 매직 링크 클릭 시 `code` 쿼리로 세션 교환 (`exchangeCodeForSession`)
  - 성공 시 USER `email_verified_at` 갱신, 홈으로 리다이렉트
  - 실패 시 `?error=invalid_token`으로 로그인 페이지 리다이렉트
- [ ] **세션 미들웨어 구현** — `src/middleware.ts`
  - 보호 경로(`/admin/*`, `/me/*`)에 진입 시 세션 검증
  - 만료 임박 세션 자동 갱신 (`refreshSession`)
  - 쿠키 SameSite=Lax, HttpOnly, Secure 설정
- [ ] **`getCurrentUser()` 유틸 함수** — `src/lib/auth/get-current-user.ts`
  - Server Component/Server Action에서 호출하는 표준 인터페이스
  - 반환: `{ id, email, role: 'user' | 'admin' } | null`
- [ ] **RBAC 권한 모듈** — `src/lib/auth/rbac.ts`
  - `requireUser()`, `requireAdmin()` 가드 함수
  - 권한 미달 시 401/403 throw
  - `role`은 USER 테이블에 추가 컬럼 또는 Supabase Auth `user_metadata`로 저장
- [ ] **로그아웃 액션** — `src/app/(auth)/_actions/sign-out.ts`
  - `supabase.auth.signOut()` + 쿠키 정리 + 홈 리다이렉트
- [ ] **에러 처리** — API-008 공통 에러 스키마 준수
  - `AUTH_INVALID_TOKEN` (400), `AUTH_TOKEN_EXPIRED` (401), `AUTH_RATE_LIMIT` (429), `AUTH_FORBIDDEN` (403)
- [ ] **PII 마스킹 로깅** — 모든 인증 로그에서 이메일 마스킹 처리

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 매직 링크 정상 발송**
- **Given**: 가입된 이메일(`user@example.com`)이 주어진 상태
- **When**: `sendMagicLink` Server Action을 호출함
- **Then**: HTTP 200, Supabase가 OTP 이메일을 발송하며, 이전 1분 내 동일 이메일로의 재요청은 429를 반환한다.

**Scenario 2: 매직 링크 클릭 → 세션 발급**
- **Given**: 유효한 매직 링크 토큰이 콜백 URL에 포함된 상태
- **When**: 사용자가 콜백 URL을 방문함
- **Then**: 세션이 발급되고 쿠키에 저장되며, USER `email_verified_at`이 갱신되고 홈으로 리다이렉트된다.

**Scenario 3: 만료된 토큰 거부**
- **Given**: 발급 후 1시간 경과한 매직 링크 토큰
- **When**: 콜백 URL을 방문함
- **Then**: HTTP 401, `error_code: "AUTH_TOKEN_EXPIRED"`가 반환되며 로그인 페이지로 리다이렉트된다.

**Scenario 4: RBAC — 일반 사용자가 관리자 경로 접근**
- **Given**: 일반 사용자(`role: 'user'`) 세션
- **When**: `/admin/reports` 경로에 접근함
- **Then**: 미들웨어가 HTTP 403을 반환하며 `requireAdmin()` 가드가 통과하지 않는다.

**Scenario 5: 세션 자동 갱신**
- **Given**: 만료 5분 전 세션 쿠키
- **When**: 보호 경로에 접근함
- **Then**: 미들웨어가 `refreshSession()`을 호출하여 새 토큰으로 쿠키를 갱신한다.

**Scenario 6: 로그아웃**
- **Given**: 활성 세션
- **When**: `signOut` 액션을 호출함
- **Then**: 쿠키가 제거되고 Supabase 세션이 무효화되며 홈으로 리다이렉트된다.

## :gear: Technical & Non-Functional Constraints
- **CON-4 비밀번호 미수집**: Supabase Auth `signInWithPassword`는 사용 금지. OTP/매직 링크만 허용.
- **CON-9 Supabase 인프라**: 인증 공급자는 Supabase Auth 채택. NextAuth는 검토 후 배제.
- **REQ-NF-014 TLS 1.2+**: 모든 인증 통신은 HTTPS. 쿠키는 `Secure` 플래그 필수.
- **REQ-NF-018 보안**: 쿠키 `HttpOnly`, `SameSite=Lax`, JWT 토큰은 클라이언트 JS에서 접근 불가.
- **세션 수명**: 액세스 토큰 1시간, 리프레시 토큰 7일 (Supabase 기본값 검증). 슬라이딩 만료.
- **RBAC**: `role` 컬럼은 USER 테이블에 추가 (DATA-009 마이그레이션 보강 필요 시 별도 마이그레이션). 기본값 `'user'`, 관리자는 수동 승격.
- **PII 마스킹 (REQ-NF-015)**: 인증 실패 로그에서도 이메일은 마스킹.
- **Service Role 키 노출 금지**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 환경변수. `NEXT_PUBLIC_*` prefix 절대 금지.
- **Rate Limit**: 매직 링크 요청 1분당 1회/이메일, IP당 시간당 10회.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] Supabase Auth 클라이언트 초기화(서버/브라우저)가 분리 구현되었는가?
- [ ] 매직 링크 발송, 콜백, 로그아웃 액션이 동작하는가?
- [ ] 미들웨어가 보호 경로에 대해 세션 검증 및 자동 갱신을 수행하는가?
- [ ] `getCurrentUser`, `requireUser`, `requireAdmin` 유틸이 제공되는가?
- [ ] RBAC가 일반 사용자/관리자 분리를 정확히 강제하는가?
- [ ] 모든 인증 로그에서 이메일이 마스킹되는가?
- [ ] Service Role 키가 클라이언트 번들에 포함되지 않음을 검증했는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit + Integration 테스트(scenario 1~6)가 작성되고 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-C-001 (이메일 가입), #DATA-009 (USER 테이블), #API-008 (공통 에러 스키마), #NFR-002 (Supabase 프로젝트)
- **Blocks**:
  - #ADM-Q-001, #ADM-C-001, #ADM-Q-002, #ADM-C-002 (관리자 백오피스 RBAC 의존)
  - #F4-C-001 (제보 작성자 식별)
  - #UI-050 (로그인 UI)
  - #UI-060 (관리자 RBAC UI)
  - #DATA-008 (COMPARISON_HISTORY 사용자 연계)

## :bookmark_tabs: Notes
- Supabase Auth는 USER 레코드를 자체적으로도 관리하므로, 우리 도메인 USER 테이블과의 동기화 전략을 명확히 해야 한다. 권장: Supabase `auth.users.id`를 우리 USER 테이블의 PK로 직접 사용 (`id UUID REFERENCES auth.users(id)`).
- `role` 컬럼이 DATA-009 스키마에 누락되어 있다면, 본 태스크의 일부로 마이그레이션 추가 (별도 후속 마이그레이션 또는 DATA-009 보강).
- 매직 링크 이메일 템플릿은 Supabase Dashboard에서 한국어로 커스터마이징 (NFR-005 환경변수 영역 외).
- RBAC 향후 확장(에디터, 모더레이터 역할 추가) 대비, `role`은 enum이 아닌 string으로 저장하되 애플리케이션 레벨에서 검증.
