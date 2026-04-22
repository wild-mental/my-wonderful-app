---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-C-003: 미등록 제품 등록 요청 접수 Server Action 구현"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-C-003] 미등록 제품 등록 요청 접수 [Command]
- 목적: SRS REQ-FUNC-032에서 정의한 "사용자가 미등록 제품의 등록을 요청하는 워크플로"의 접수 단계를 구현한다. UI-013 [제품 등록 요청하기] CTA 또는 UI-061 관리자 대시보드에서 호출되며, API-005 FormData 스키마를 검증한 후 PRODUCT 테이블에 `status: 'PENDING_REVIEW'` 상태로 임시 레코드를 생성한다. 비로그인 사용자도 요청 가능하며(REQ-FUNC-008 AC 폼 제출 성공률 99%+ 보장), 관리자 워크플로(ADM-Q-001/ADM-C-001)의 트리거가 된다.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-032 (관리자 등록 요청 관리), REQ-FUNC-008 (제출 성공률 99%+)
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-05
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.1 PRODUCT`](../05_SRS_v1.md) — `status` 필드(PUBLISHED/PENDING_REVIEW/REJECTED)
- 선행 태스크: **API-005** (제품 등록 요청 Server Action FormData/응답 DTO), **DATA-002** (PRODUCT 테이블)
- 후행 태스크: ADM-Q-001 (등록 요청 목록 조회), ADM-C-001 (등록 요청 처리), UI-013 (CTA 버튼), UI-061 (관리자 대시보드)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Server Action 구현** — `src/app/(public)/_actions/register-request.ts`
  - `'use server'` + API-005 FormData 스키마 검증 (`ProductRegistrationRequestSchema.safeParse`)
  - 비로그인 사용자도 호출 가능 (RBAC 가드 미적용)
- [ ] **PRODUCT INSERT 로직** — `prisma.product.create`
  - 필수 필드: `name`, `brand_name`, `category`
  - 선택 필드: `submitter_email`, `evidence_url`, `evidence_text`, `requested_by` (로그인 시 user_id)
  - 기본 값: `status: 'PENDING_REVIEW'`, `created_at`, `updated_at`
- [ ] **중복 요청 차단**
  - 동일 `name + brand_name` 조합으로 24h 내 등록 요청이 있으면 409 반환
  - `error_code: "REGISTRATION_REQUEST_DUPLICATE"`
- [ ] **스팸 차단** — IP당 시간당 5건 제한
  - Vercel Edge Middleware 또는 단순 in-memory rate limit
  - `error_code: "REGISTRATION_REQUEST_RATE_LIMIT"` (429)
- [ ] **prefill 파라미터 활용** — COM-Q-002의 `?prefill=...`로 전달된 키워드를 폼 초기값으로 (UI-013 책임이지만 서버에서도 검증)
- [ ] **에러 처리** — API-008 공통 에러 스키마 준수
  - `REGISTRATION_REQUEST_INVALID_FIELD` (400)
  - `REGISTRATION_REQUEST_DUPLICATE` (409)
  - `REGISTRATION_REQUEST_RATE_LIMIT` (429)
  - `REGISTRATION_REQUEST_SERVER_ERROR` (500)
- [ ] **응답 구성** — API-005 응답 DTO 준수
  - `{ request_id: string, status: 'PENDING_REVIEW', expected_review_at: ISO8601 }`
  - `expected_review_at`은 현재 + 7일 (관리자 처리 SLA, REQ-FUNC-032 별도 명시 시 조정)
- [ ] **PII 마스킹 로깅** — `submitter_email` 마스킹 처리
- [ ] **이벤트 추적** — Mixpanel `product_registration_requested` 이벤트 발송 (COM-C-004와 유사 패턴, 별도 트리거)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 요청 — 비로그인 사용자**
- **Given**: 로그인 없이 `{ name: "신규비타민D", brand_name: "건강회사", category: "비타민" }` FormData 제출
- **When**: register-request Server Action을 호출함
- **Then**: HTTP 201, `request_id` 반환, PRODUCT 테이블에 `status: 'PENDING_REVIEW'` 레코드 생성, `requested_by: null`.

**Scenario 2: 정상 요청 — 로그인 사용자**
- **Given**: 로그인 사용자가 동일 FormData를 제출
- **When**: Server Action을 호출함
- **Then**: PRODUCT 레코드의 `requested_by`에 user_id가 저장된다.

**Scenario 3: 중복 요청 차단**
- **Given**: 24h 내 동일 `name + brand_name`으로 등록된 PENDING_REVIEW 레코드 존재
- **When**: 두 번째 동일 요청 제출
- **Then**: HTTP 409, `error_code: "REGISTRATION_REQUEST_DUPLICATE"`, `existing_request_id`가 응답에 포함된다.

**Scenario 4: 필수 필드 누락**
- **Given**: `name`이 빈 문자열인 FormData
- **When**: Server Action을 호출함
- **Then**: HTTP 400, `error_code: "REGISTRATION_REQUEST_INVALID_FIELD"`, Zod 에러 메시지가 반환된다.

**Scenario 5: 스팸 차단 — IP 시간당 5건**
- **Given**: 동일 IP에서 1시간 내 5건 등록 요청 완료
- **When**: 6번째 요청을 제출함
- **Then**: HTTP 429, `error_code: "REGISTRATION_REQUEST_RATE_LIMIT"`, `retry_after_seconds`가 반환된다.

**Scenario 6: 제출 성공률 ≥ 99% (REQ-FUNC-008 AC)**
- **Given**: 100건의 유효한 등록 요청을 시뮬레이션
- **When**: 모두 정상 폼 데이터로 제출함
- **Then**: 99건 이상이 HTTP 201로 성공한다 (서버 에러 < 1%).

## :gear: Technical & Non-Functional Constraints
- **비로그인 허용**: REQ-FUNC-008 AC "폼 제출 성공률 99%+"를 위해 가입 강요 금지. 로그인 시에만 `requested_by` 저장.
- **PRODUCT 테이블 재사용**: 별도 `product_registration_requests` 테이블 신설 대신, PRODUCT 테이블의 `status` 필드로 라이프사이클 관리 (PENDING_REVIEW → PUBLISHED/REJECTED).
- **DATA-002 의존**: PRODUCT 테이블에 `status`, `submitter_email`, `evidence_url`, `evidence_text`, `requested_by` 컬럼이 존재해야 함. 누락 시 별도 마이그레이션 추가.
- **중복 차단 24h 윈도우**: 합리적인 사용자 행동(즉시 재제출) 차단. 더 짧으면 이중 클릭 보호 부족, 더 길면 정당한 재요청 차단.
- **PII 마스킹 (REQ-NF-015)**: `submitter_email`은 로그·모니터링에서 마스킹.
- **Rate Limit**: IP당 시간당 5건. 본 태스크 범위에서는 in-memory 또는 Redis 키-값 카운터로 구현 (NFR 영역에서 정식화).
- **검색 키워드 prefill 안전성**: COM-Q-002에서 전달된 `prefill` 키워드는 sanitize 후 폼 초기값으로 사용.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] Server Action이 API-005 FormData 스키마와 응답 DTO에 100% 정합하는가?
- [ ] 비로그인 호출이 가능하며, 로그인 시 `requested_by`가 저장되는가?
- [ ] 24h 중복 차단 로직이 동작하는가?
- [ ] IP 시간당 5건 Rate Limit이 동작하는가?
- [ ] PRODUCT 레코드가 `status: 'PENDING_REVIEW'`로 생성되는가?
- [ ] Mixpanel `product_registration_requested` 이벤트가 발송되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit + Integration 테스트(scenario 1~6)가 작성되고 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-005 (제품 등록 요청 DTO), #DATA-002 (PRODUCT 테이블)
- **Blocks**:
  - #ADM-Q-001 (등록 요청 목록 조회)
  - #ADM-C-001 (등록 요청 상태 관리)
  - #UI-013 (미등록 성분 CTA → 등록 요청 폼 연결)
  - #UI-061 (관리자 등록 요청 관리 대시보드 UI)
  - #COM-Q-002 (CTA `action_url`의 endpoint)

## :bookmark_tabs: Notes
- 본 태스크는 데이터 신뢰성(F4)과 검색 커버리지(F1)의 사용자 참여 보강 메커니즘이다. 진입 장벽을 최소화하기 위해 비로그인 허용을 유지하되, 스팸 차단(rate limit)으로 균형을 맞춘다.
- `evidence_url` (제품 공식 페이지, 쿠팡 URL 등)을 강력 권장하되 필수는 아님. 필수 시 제출률 저하 우려. 관리자 검토 단계(ADM-C-001)에서 보강 요청 가능.
- 등록 요청 7일 SLA는 SRS REQ-FUNC-032에서 명시되지 않았으므로 본 태스크에서 임시 정의. 운영 데이터 누적 후 조정.
- COM-C-001 가입 후 등록 요청을 트리거하는 흐름은 별도 마케팅 시나리오로 분리(본 태스크 범위 외).
