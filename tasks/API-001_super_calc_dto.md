---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-001: Super-Calc API (`GET /api/v1/compare`) Request/Response DTO 및 에러 코드 TypeScript 타입 정의"
labels: 'feature, api, epic:E-API, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [API-001] Super-Calc API DTO 및 에러 코드 TypeScript 타입 정의
- 목적: 1일 단가 비교 API의 요청/응답 데이터 계약(Contract)을 TypeScript 타입으로 선언하여, 백엔드(Route Handler)와 프론트엔드(UI) 간의 SSOT(Single Source of Truth)를 확보한다. 런타임 유효성 검증 스키마(Zod)도 함께 정의하여 데이터 무결성을 보장한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-01 (`GET /api/v1/compare`)
- SRS 시퀀스 다이어그램: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.3 PRICE_SNAPSHOT`](../05_SRS_v1.md)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001~006, 008, 009
- 공통 에러 스키마: **API-008** (후행 또는 병렬 진행 시 인터페이스 협의)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-004** (PRICE_SNAPSHOT 테이블 스키마)
- 후행 태스크: MOCK-001 (Super-Calc Mock 엔드포인트), F1-C-001 (단가 정규화 엔진), F1-RH-001 (Route Handler 통합)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Request DTO 타입 정의** — `src/types/api/compare.ts`에 `CompareRequest` 인터페이스 정의
  - `ingredient: string` (영양소/성분명, 필수)
  - `dosage?: string` (복용량 스펙, 선택. 예: "1000IU")
  - `sort_by?: 'daily_cost' | 'price' | 'brand'` (정렬 기준, 기본값: `daily_cost`)
  - `limit?: number` (반환 건수 상한, 기본값: 20, 최대: 50)
- [ ] **Response DTO 타입 정의** — `CompareResponse` 인터페이스 정의
  - `results: PriceComparisonItem[]` (정렬된 비교 결과 배열)
  - `total_count: number` (전체 매칭 제품 수)
  - `is_cached: boolean` (캐시 데이터 사용 여부)
  - `cached_at?: string` (캐시 데이터 기준 시각, ISO 8601. `is_cached=true`일 때만)
  - `query: { ingredient: string; dosage?: string }` (요청 파라미터 에코백)
- [ ] **PriceComparisonItem 타입 정의** — 개별 비교 결과 항목
  - `product_id: string`
  - `product_name: string`
  - `brand_name: string`
  - `daily_cost_krw: number` (1일 단가, 소수점 첫째 자리)
  - `price_krw: number` (원래 제품 가격)
  - `final_price_krw: number` (배송비·관세·할인 포함 실지불가)
  - `shipping_fee: number` (배송비)
  - `affiliate_url: string` (쿠팡 파트너스 제휴 딥링크)
  - `captured_at: string` (가격 수집 시각, ISO 8601)
  - `servings_per_container: number` (총 복용 횟수)
- [ ] **Zod 런타임 검증 스키마 작성** — `src/schemas/compare.schema.ts`에 Request/Response Zod 스키마 정의
  - Request: `ingredient` 최소 1자, 최대 100자 / `limit` 1~50 범위 / `sort_by` enum 검증
  - Response: 자동 타입 추론(`z.infer<typeof CompareResponseSchema>`)
- [ ] **에러 코드 Enum 정의** — `src/types/api/compare.ts`에 Compare API 전용 에러 코드
  - `COMPARE_INGREDIENT_REQUIRED` (400): 성분명 미입력
  - `COMPARE_INGREDIENT_NOT_FOUND` (404): 미등록 성분 (REQ-FUNC-008과 연계)
  - `COMPARE_EXTERNAL_API_ERROR` (502): 쿠팡 API 호출 실패
  - `COMPARE_CACHE_FALLBACK` (200, 경고): 캐시 데이터 반환 중 (헤더 또는 body 플래그)
  - `COMPARE_RATE_LIMIT_EXCEEDED` (429): API Rate Limit 초과
- [ ] **에러 응답 타입 정의** — API-008(공통 에러 스키마)의 `ApiErrorResponse` 인터페이스를 import하여 사용. 미완성 시 임시 인터페이스 정의 후 API-008 완료 시 마이그레이션
- [ ] **타입 Export 정리** — `src/types/api/index.ts` barrel export 파일에 Compare 관련 타입 등록
- [ ] **JSDoc 주석 작성** — 모든 DTO 필드에 한국어 설명, 단위, 예시 값, SRS 참조 섹션을 JSDoc으로 기술

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Request DTO가 유효한 요청을 수용한다**
- **Given**: `{ ingredient: "비타민D", dosage: "1000IU", sort_by: "daily_cost", limit: 20 }` 요청 객체가 주어진 상태
- **When**: `CompareRequestSchema.parse()`로 유효성 검증을 수행한다
- **Then**: 에러 없이 파싱이 성공하고, 타입 추론된 객체가 반환된다.

**Scenario 2: Request DTO가 잘못된 요청을 거부한다**
- **Given**: `{ ingredient: "", limit: 100 }` (빈 성분명, 초과 limit) 요청이 주어진 상태
- **When**: `CompareRequestSchema.parse()`로 유효성 검증을 수행한다
- **Then**: `ZodError`가 발생하며, `ingredient` 최소 길이 위반과 `limit` 범위 초과 에러 메시지가 포함된다.

**Scenario 3: Response DTO가 캐시 폴백 상태를 표현한다**
- **Given**: 쿠팡 API 장애로 캐시 데이터를 사용하는 상황
- **When**: `CompareResponse` 객체를 `is_cached: true, cached_at: "2026-04-17T09:00:00Z"`로 구성한다
- **Then**: TypeScript 컴파일 에러 없이 타입이 만족되며, 프론트엔드에서 `is_cached` 플래그로 캐시 UI를 분기할 수 있다.

**Scenario 4: 에러 코드가 미등록 성분 시나리오를 커버한다**
- **Given**: 에러 코드 Enum에 `COMPARE_INGREDIENT_NOT_FOUND`가 정의된 상태
- **When**: 미등록 성분 검색 시 해당 에러 코드를 반환한다
- **Then**: HTTP 404와 함께 `{ error_code: "COMPARE_INGREDIENT_NOT_FOUND", message: "..." }` 응답이 API-008 공통 에러 스키마 포맷을 준수한다.

**Scenario 5: 타입 안전성 보장**
- **Given**: Compare 관련 모든 타입이 정의된 상태
- **When**: `pnpm typecheck`를 실행한다
- **Then**: Compare DTO 관련 파일에 TypeScript 에러가 0건이다.

## :gear: Technical & Non-Functional Constraints
- **SSOT 원칙 (P1)**: Prisma 스키마(`PRICE_SNAPSHOT` 모델)의 타입과 DTO 타입이 의미적으로 정합해야 함. Prisma의 자동 생성 타입(`Prisma.PriceSnapshotGetPayload`)을 DTO로 직접 노출하지 않고, 별도 DTO 레이어를 통해 API 계약을 격리한다.
- **Zod + TypeScript 이중 보장**: 컴파일 타임(TypeScript)과 런타임(Zod) 양쪽에서 타입 안전성을 보장한다. `z.infer<>` 패턴을 사용하여 Zod 스키마로부터 TypeScript 타입을 자동 추론한다.
- **API 응답 시간 (REQ-NF-001)**: DTO 구조가 p95 ≤ 3,500ms 응답 시간에 영향을 주지 않도록, 불필요한 중첩 구조를 지양하고 플랫한 구조를 유지한다.
- **소수점 정밀도 (REQ-FUNC-002)**: `daily_cost_krw` 필드는 소수점 첫째 자리까지 표현. Zod 스키마에서 `.refine()` 또는 `.transform()`으로 반올림 규칙 적용.
- **최종가 오차율 (REQ-FUNC-004)**: `final_price_krw` 필드는 배송비, 관세, 할인코드를 포함한 실지불가. 오차율 ≤ 3% 요구사항은 F1-C-002에서 로직으로 보장하되, DTO에서 필드 정의를 명확히 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `src/types/api/compare.ts`에 Request/Response DTO 타입이 정의되었는가?
- [ ] `src/schemas/compare.schema.ts`에 Zod 런타임 검증 스키마가 작성되었는가?
- [ ] 에러 코드 Enum이 정의되고, API-008 공통 에러 스키마와 호환되는가?
- [ ] 모든 DTO 필드에 JSDoc 주석(설명, 단위, 예시, SRS 참조)이 포함되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(Zod 스키마 파싱 성공/실패 케이스)가 작성되고 통과하는가?
- [ ] barrel export(`src/types/api/index.ts`)에 등록되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-004 (PRICE_SNAPSHOT 테이블 Prisma 스키마)
- **Blocks**:
  - #MOCK-001 (Super-Calc API Mock 엔드포인트 — DTO 기반 응답 구성)
  - #F1-C-001 (1일 단가 정규화 엔진 — DTO 입출력 타입 참조)
  - #F1-RH-001 (Super-Calc Route Handler 통합 — DTO 기반 Request/Response 핸들링)

## :bookmark_tabs: Notes
- API-008(공통 에러 스키마)이 병렬 진행될 수 있으므로, 에러 응답 타입은 우선 임시 인터페이스로 정의하고 API-008 완료 후 import 경로를 통합한다.
- Prisma 자동 생성 타입을 API 응답에 직접 노출하면 내부 스키마 변경이 API 계약 파괴(Breaking Change)로 전파되므로, 반드시 **DTO 변환 레이어**를 분리한다. 변환 유틸리티 함수는 F1-RH-001에서 구현한다.
- `sort_by` 필드의 `brand` 옵션은 Phase 2 확장 대비 예약. MVP에서는 `daily_cost`를 기본으로 하되 타입에는 미리 포함한다.
