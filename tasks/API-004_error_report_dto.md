---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-004: 오류 제보 Server Action (`POST`) FormData 스키마 및 응답 DTO TypeScript 타입 정의"
labels: 'feature, api, epic:E-API, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [API-004] 오류 제보 Server Action DTO 및 에러 코드 TypeScript 타입 정의
- 목적: Data Trust System(F4)의 오류 제보 접수 Server Action의 입력(FormData) 스키마와 응답 DTO를 TypeScript 타입으로 정의하여, 프론트엔드 제보 폼(UI-030)과 백엔드 제보 처리 로직(F4-C-001) 간의 SSOT를 확보한다. 스팸/중복 제보 차단 시나리오의 에러 타입도 포함한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-04 (Server Action, POST)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3 상세 시퀀스: 오류 제보 → 수정 → 보상`](../05_SRS_v1.md)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.6 ERROR_REPORT`](../05_SRS_v1.md)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-024~028
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-007** (ERROR_REPORT 테이블 Prisma 스키마)
- 후행 태스크: MOCK-004 (오류 제보 Mock Server Action), F4-C-001 (오류 제보 접수 로직), F4-C-002 (스팸 필터링)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **ReportStatus Enum 정의** — `src/types/api/report.ts`에 제보 처리 상태 열거형
  - `SUBMITTED` — 접수 완료
  - `REVIEWING` — 검증 중
  - `RESOLVED` — 수정 완료
  - `REJECTED` — 반려
- [ ] **제보 입력 DTO 타입 정의** — `ErrorReportInput` 인터페이스 (구조화된 폼, REQ-FUNC-028)
  - `product_id: string` (제보 대상 제품 ID, 필수)
  - `field_name: string` (제보 대상 필드명, 필수. 예: "amount_per_serving")
  - `reported_value: string` (현재 표시 값, 필수)
  - `correct_value: string` (제보자가 주장하는 올바른 값, 필수)
  - `evidence_url?: string` (근거 자료 URL, 선택)
- [ ] **제보 응답 DTO 타입 정의** — `ErrorReportResponse` 인터페이스
  - `report_id: string` (생성된 제보 ID)
  - `status: ReportStatus` (처리 상태, 초기값: SUBMITTED)
  - `estimated_resolution_time: string` (예상 처리 시간, "48시간")
  - `created_at: string` (접수 시각, ISO 8601)
- [ ] **스팸 차단 응답 타입 정의** — `SpamBlockResponse`
  - `blocked: true` (차단 플래그)
  - `reason: 'DUPLICATE_LIMIT' | 'EMPTY_CONTENT'` (차단 사유)
  - `message: string` (사용자 안내 메시지)
- [ ] **제보 목록 조회 DTO 정의** — `ErrorReportListItem` (관리자 백오피스 ADM-Q-002 연계)
  - `report_id: string`
  - `product_id: string`
  - `product_name: string`
  - `field_name: string`
  - `status: ReportStatus`
  - `reporter_email: string` (마스킹 처리: `***@domain.com`)
  - `reported_at: string`
  - `resolved_at?: string`
  - `elapsed_hours: number` (경과 시간, SLA 48h 모니터링용)
- [ ] **Zod 런타임 검증 스키마 작성** — `src/schemas/report.schema.ts`
  - Input: `product_id` 비어있지 않음, `field_name` 비어있지 않음, `reported_value` 비어있지 않음, `correct_value` 비어있지 않음, `evidence_url` URL 형식(선택)
  - 빈 문자열 차단: `correct_value.trim().length > 0` 검증 (REQ-FUNC-027)
- [ ] **에러 코드 Enum 정의** — Report API 전용 에러 코드
  - `REPORT_PRODUCT_NOT_FOUND` (404): 존재하지 않는 product_id
  - `REPORT_SPAM_BLOCKED` (429): 동일 제품 24h 내 5건 이상 중복 제보
  - `REPORT_EMPTY_CONTENT` (400): 빈 문자열 제출
  - `REPORT_INVALID_FIELD` (400): 존재하지 않는 필드명 지정
  - `REPORT_UNAUTHENTICATED` (401): 미인증 사용자
- [ ] **타입 Export 정리** — barrel export에 Report 관련 타입 등록
- [ ] **JSDoc 주석 작성** — 모든 필드에 한국어 설명, SRS 참조, 예시 값, 스팸 차단 규칙 설명 기술

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 오류 제보 입력 검증**
- **Given**: `{ product_id: "PROD-001", field_name: "amount_per_serving", reported_value: "500mg", correct_value: "1000mg" }` 입력이 주어진 상태
- **When**: `ErrorReportInputSchema.parse()`로 유효성 검증을 수행한다
- **Then**: 에러 없이 파싱이 성공한다.

**Scenario 2: 빈 문자열 제보 거부 (REQ-FUNC-027)**
- **Given**: `{ product_id: "PROD-001", field_name: "amount_per_serving", reported_value: "500mg", correct_value: "  " }` 공백만 포함된 correct_value
- **When**: `ErrorReportInputSchema.parse()`로 유효성 검증을 수행한다
- **Then**: `ZodError`가 발생하며, `correct_value` 필드의 빈 문자열 에러가 포함된다.

**Scenario 3: 접수 응답에 예상 처리 시간 포함 (REQ-FUNC-024)**
- **Given**: 유효한 제보가 성공적으로 접수된 상태
- **When**: `ErrorReportResponse` 객체를 구성한다
- **Then**: `estimated_resolution_time`이 "48시간"으로 설정되고, `status`가 `SUBMITTED`이다.

**Scenario 4: 스팸 차단 응답 구조**
- **Given**: 동일 제품에 24시간 내 5건 이상 중복 제보 상황
- **When**: `SpamBlockResponse` 객체를 구성한다
- **Then**: `blocked: true`, `reason: 'DUPLICATE_LIMIT'`, `message`에 사용자 안내 메시지가 포함된다.

**Scenario 5: 관리자용 제보 목록 이메일 마스킹**
- **Given**: `ErrorReportListItem`에 제보자 이메일이 포함된 상태
- **When**: `reporter_email` 필드를 조회한다
- **Then**: 이메일이 `***@domain.com` 형태로 마스킹되어 개인정보 최소 노출 원칙(CON-4)을 준수한다.

## :gear: Technical & Non-Functional Constraints
- **Server Action 구현 (CON-8)**: 본 API는 Route Handler가 아닌 **Server Action**으로 구현되므로, FormData 기반 입력을 지원해야 한다. Zod 스키마는 `FormData` → `Object` 변환 후 적용.
- **개인정보 최소 수집 (CON-4)**: 제보자 개인정보는 `reporter_id`(FK → USER)로만 참조. 관리자 조회 시 이메일 마스킹 필수.
- **SLA 48시간 모니터링 (REQ-NF-012)**: `ErrorReportListItem.elapsed_hours` 필드는 SLA 초과 Slack 알림(NFR-MON-004)과 연계.
- **스팸 차단 정확도 (REQ-FUNC-027)**: 차단 정확도 ≥ 95%, 유효 제보 오차단률(false positive) ≤ 2%. 로직은 F4-C-002에서 구현하되, DTO에서 차단 사유 타입을 정확히 정의.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `ReportStatus` Enum, `ErrorReportInput`, `ErrorReportResponse`, `SpamBlockResponse`, `ErrorReportListItem` 타입이 정의되었는가?
- [ ] Zod 스키마가 FormData 변환 후 검증 가능한 구조로 작성되었는가?
- [ ] 에러 코드 5건이 정의되었는가?
- [ ] 빈 문자열 차단 Zod 검증이 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-007 (ERROR_REPORT 테이블 Prisma 스키마)
- **Blocks**:
  - #MOCK-004 (오류 제보 Mock Server Action)
  - #F4-C-001 (오류 제보 접수 Server Action 구현)
  - #F4-C-002 (스팸/중복 제보 필터링 로직)
  - #UI-030 (오류 신고 구조화된 폼 모달)
  - #ADM-Q-002 (관리자 제보 목록 조회)

## :bookmark_tabs: Notes
- Server Action은 Next.js의 `'use server'` 디렉티브를 사용하므로, DTO 타입은 서버-클라이언트 경계를 넘어 공유된다. 직렬화 가능 타입(JSON-serializable)만 사용해야 하며, `Date` 객체 대신 ISO 8601 문자열을 사용한다.
- `field_name` 유효성은 PRODUCT + INGREDIENT 테이블의 실제 컬럼명과 매칭 검증이 필요하지만, DTO 레벨에서는 문자열로 정의하고 F4-C-001에서 런타임 검증한다.
