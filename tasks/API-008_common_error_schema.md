---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-008: 공통 에러 응답 스키마 정의 (HTTP Status Code 체계, 에러 코드 Enum, 에러 메시지 포맷)"
labels: 'feature, api, epic:E-API, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [API-008] 공통 에러 응답 스키마 정의
- 목적: 시스템 전체 API(Route Handlers + Server Actions)에서 사용하는 통합 에러 응답 포맷을 정의한다. HTTP Status Code 체계, 도메인별 에러 코드 Enum, 에러 메시지 포맷, 에러 응답 유틸리티를 일관되게 구성하여 프론트엔드의 에러 핸들링과 사용자 경험을 표준화한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS API 명세: [`/05_SRS_v1.md#6.1 API Endpoint List`](../05_SRS_v1.md) — 전체 내/외부 API
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.2 Reliability`](../05_SRS_v1.md) — REQ-NF-010 (API 오류율 5xx ≤ 0.5%)
- SRS 모니터링: [`/05_SRS_v1.md#4.2.5 Monitoring`](../05_SRS_v1.md) — REQ-NF-021 (에러 코드 로깅)
- SRS API 개요: [`/05_SRS_v1.md#3.3 API Overview`](../05_SRS_v1.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md) — API-008
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩)
- 후행 태스크: API-001~005 (각 도메인 API DTO에서 import), 모든 Route Handler 및 Server Action 구현 태스크

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **HTTP Status Code 사용 체계 문서화** — `src/types/api/errors.ts`에 프로젝트 전체 HTTP 상태 코드 사용 규칙 JSDoc 정의
  - `200 OK` — 성공 (경고 플래그 포함 가능)
  - `201 Created` — 리소스 생성 성공 (제보 접수 등)
  - `400 Bad Request` — 클라이언트 요청 오류 (유효성 검증 실패, 빈 문자열 등)
  - `401 Unauthorized` — 미인증
  - `403 Forbidden` — 권한 부족 (관리자 전용 API)
  - `404 Not Found` — 리소스 미존재 (제품, 성분 등)
  - `409 Conflict` — 중복 요청 (동일 등록 요청 등)
  - `429 Too Many Requests` — Rate Limit 초과 (스팸 차단 포함)
  - `500 Internal Server Error` — 서버 내부 오류
  - `502 Bad Gateway` — 외부 API 호출 실패
  - `503 Service Unavailable` — 서비스 점검 중
- [ ] **ApiErrorResponse 공통 인터페이스 정의**
  - `success: false` (실패 플래그, 리터럴 타입)
  - `error: { code: string; message: string; details?: Record<string, string[]>; timestamp: string; request_id?: string }`
    - `code`: 도메인별 에러 코드 (예: `COMPARE_INGREDIENT_NOT_FOUND`)
    - `message`: 사용자 표시 가능한 한국어 메시지
    - `details`: 필드별 유효성 검증 에러 (Zod 에러 매핑)
    - `timestamp`: 에러 발생 시각 (ISO 8601)
    - `request_id`: 요청 추적 ID (디버깅용)
- [ ] **ApiSuccessResponse<T> 공통 인터페이스 정의**
  - `success: true` (성공 플래그, 리터럴 타입)
  - `data: T` (응답 데이터, 제네릭)
  - `meta?: { cached: boolean; cached_at?: string; total_count?: number }` (메타 정보)
- [ ] **ApiResponse<T> Discriminated Union 타입**
  - `type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse`
  - TypeScript Discriminated Union으로 `success` 필드 기반 타입 가드 지원
- [ ] **에러 코드 마스터 Enum 정의** — `src/types/api/error-codes.ts`
  - 공통: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`, `EXTERNAL_API_ERROR`, `RATE_LIMIT_EXCEEDED`, `SERVICE_UNAVAILABLE`
  - 도메인별 네임스페이스: `COMPARE_*`, `BADGE_*`, `SEARCH_*`, `REPORT_*`, `REGISTRATION_*`
  - 각 에러 코드에 기본 HTTP Status Code 매핑
- [ ] **에러 응답 팩토리 유틸리티 작성** — `src/lib/errors.ts`
  - `createErrorResponse(code, message, details?, httpStatus?): NextResponse<ApiErrorResponse>`
  - `createValidationErrorResponse(zodError): NextResponse<ApiErrorResponse>` (Zod 에러 → 표준 에러 변환)
  - `createExternalApiErrorResponse(channelId, originalError): NextResponse<ApiErrorResponse>`
  - `isApiError(response): response is ApiErrorResponse` (타입 가드)
- [ ] **AppError 커스텀 에러 클래스 작성** — `src/lib/app-error.ts`
  - `class AppError extends Error`
    - `code: string` (에러 코드 Enum 값)
    - `httpStatus: number`
    - `details?: Record<string, string[]>`
    - `isOperational: boolean` (운영 에러 vs 프로그래밍 에러 구분)
- [ ] **Zod 에러 → 표준 에러 변환기** — `src/lib/zod-error-mapper.ts`
  - `mapZodError(zodError): Record<string, string[]>` (Zod `fieldErrors` → API 응답 `details` 매핑)
- [ ] **에러 응답 Zod 스키마** — `src/schemas/error.schema.ts`
  - `ApiErrorResponseSchema`: 에러 응답 런타임 검증용
- [ ] **JSDoc 주석 + 에러 응답 예시** — 모든 에러 코드에 예시 응답 JSON 포함

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Discriminated Union 타입 가드**
- **Given**: `ApiResponse<CompareResponse>` 타입의 응답 객체가 주어진 상태
- **When**: `if (response.success)` 조건문으로 분기한다
- **Then**: TypeScript가 `true` 분기에서 `response.data`를 `CompareResponse`로 자동 추론하고, `false` 분기에서 `response.error`를 `{code, message, ...}`로 추론한다.

**Scenario 2: Zod 유효성 에러 변환**
- **Given**: `ZodError`가 `[{ path: ['ingredient'], message: '필수 입력' }]` 에러를 포함한 상태
- **When**: `createValidationErrorResponse(zodError)`를 호출한다
- **Then**: HTTP 400 응답에 `{ success: false, error: { code: "VALIDATION_ERROR", details: { ingredient: ["필수 입력"] } } }` 형태가 반환된다.

**Scenario 3: 외부 API 에러 래핑**
- **Given**: 쿠팡 API가 503 에러를 반환한 상황
- **When**: `createExternalApiErrorResponse('coupang', originalError)`를 호출한다
- **Then**: HTTP 502 응답에 `{ success: false, error: { code: "EXTERNAL_API_ERROR", message: "외부 서비스 연결에 실패했습니다..." } }` 형태가 반환되며, 원본 에러는 서버 로그에만 기록된다.

**Scenario 4: 에러 코드-HTTP Status 매핑 일관성**
- **Given**: 에러 코드 마스터 Enum이 정의된 상태
- **When**: 모든 에러 코드에 대해 `httpStatus` 매핑을 조회한다
- **Then**: 각 에러 코드에 대응하는 HTTP Status Code가 명확히 매핑되며, 누락된 코드가 0건이다.

**Scenario 5: 프론트엔드 에러 핸들링 호환**
- **Given**: 프론트엔드에서 `fetch()` 응답을 처리하는 상황
- **When**: 응답을 `ApiResponse<T>`로 파싱한 후 `!response.success` 분기에서 에러를 처리한다
- **Then**: `response.error.message`로 사용자 표시 가능한 한국어 메시지에 접근 가능하고, `response.error.details`로 필드별 에러 표시가 가능하다.

**Scenario 6: 에러 응답에 민감 정보 미포함**
- **Given**: 서버 내부 에러(500)가 발생한 상황
- **When**: `createErrorResponse()`로 에러 응답을 생성한다
- **Then**: 응답 body에 스택 트레이스, DB 연결 문자열, API 키 등 민감 정보가 일절 포함되지 않으며, 디버깅 정보는 서버 로그(`request_id`로 추적)에만 기록된다.

## :gear: Technical & Non-Functional Constraints
- **에러율 (REQ-NF-010)**: API 5xx 에러율 ≤ 0.5%. `isOperational` 플래그로 예상 가능한 운영 에러(4xx)와 버그(5xx)를 구분하여, 5xx 발생 시 즉시 모니터링 알림.
- **로깅 연계 (REQ-NF-021)**: 에러 응답 생성 시 `request_id`를 포함하여 Vercel Logs에서 요청 추적 가능하게 한다. `console.error()`에는 원본 에러 스택을 기록하되, 클라이언트 응답에는 제거.
- **Slack 알림 (REQ-NF-021)**: 5xx 에러 발생률이 1% 초과 시 알림 연계를 위해, 에러 코드와 HTTP Status를 구조화하여 로깅.
- **보안**: 에러 응답에 내부 시스템 정보(DB 캐릭터, 파일 경로, 환경변수 등)를 절대 포함하지 않는다.
- **국제화 대비**: 에러 `message`는 한국어를 기본으로 하되, 향후 다국어 지원 경로(`i18n` 키 방식)를 JSDoc에 예약.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `ApiErrorResponse`, `ApiSuccessResponse<T>`, `ApiResponse<T>` 타입이 정의되었는가?
- [ ] 에러 코드 마스터 Enum(공통 8건 + 도메인 예약)이 정의되었는가?
- [ ] 에러 응답 팩토리 유틸리티(`createErrorResponse` 등)가 작성되었는가?
- [ ] Zod 에러 변환기(`mapZodError`)가 작성되었는가?
- [ ] `AppError` 커스텀 에러 클래스가 정의되었는가?
- [ ] Discriminated Union 타입 가드가 동작하는 단위 테스트가 통과하는가?
- [ ] 에러 응답에 민감 정보가 포함되지 않는 것이 검증되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩)
- **Blocks**:
  - #API-001 (Super-Calc DTO — `ApiErrorResponse` import)
  - #API-002 (Badge DTO — `ApiErrorResponse` import)
  - #API-003 (Search DTO — `ApiErrorResponse` import)
  - #API-004 (오류 제보 DTO — `ApiErrorResponse` import)
  - #API-005 (등록 요청 DTO — `ApiErrorResponse` import)
  - #F1-RH-001 (Super-Calc Route Handler — 에러 팩토리 사용)
  - #F2-RH-001 (Badge Route Handler — 에러 팩토리 사용)
  - #COM-RH-001 (Search Route Handler — 에러 팩토리 사용)
  - #NFR-MON-001 (Vercel Logs 연동 — 에러 코드 기반 로깅)

## :bookmark_tabs: Notes
- 본 태스크는 **시스템 전체의 에러 핸들링 기반**을 구축하는 횡단 관심사(Cross-cutting Concern) 태스크이다. API-001~005보다 먼저 또는 병렬로 완료되어야 각 도메인 DTO에서 에러 타입을 import할 수 있다.
- `ApiResponse<T>` Discriminated Union 패턴은 프론트엔드에서 `fetch` 응답 처리 시 타입 안전한 에러 핸들링을 가능하게 한다. 이 패턴은 모든 `use client` 컴포넌트에서 일관되게 사용된다.
- 에러 메시지는 사용자 친화적 한국어로 작성하되, 기술 디버깅 정보는 서버 로그에만 기록한다. `request_id`는 UUID v4로 생성하여 요청-로그 매칭에 사용.
- `isOperational` 플래그는 에이전트 자동 리커버리 판단에 사용:
  - `true` (운영 에러): 재시도 또는 폴백 처리 가능 (예: 외부 API 타임아웃)
  - `false` (프로그래밍 에러): 즉시 Slack 알림 + 코드 수정 필요
