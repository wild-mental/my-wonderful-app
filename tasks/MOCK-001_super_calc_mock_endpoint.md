---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-001: Super-Calc API Mock 엔드포인트 구성 (성공/쿠팡 장애 폴백/빈 결과 시나리오)"
labels: 'feature, mock, epic:E-MOCK, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-001] Super-Calc API (`GET /api/v1/compare`) Mock 엔드포인트
- 목적: 백엔드 Route Handler(F1-RH-001) 구현 이전에, 프론트엔드(UI-011, UI-012)와 통합 테스트(TEST-F1-*)가 API-001에서 정의한 DTO 계약을 기반으로 독립 개발할 수 있도록 결정론적(Deterministic) Mock 응답을 제공한다. 정상/쿠팡 장애 폴백/빈 결과의 3대 시나리오를 시드 데이터 또는 쿼리 파라미터로 분기 가능해야 한다.
- Epic / Phase: E-MOCK / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md)
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — EXT-SYS-01 폴백 (캐시 PRICE_SNAPSHOT + 기준 시각)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001~006, 008
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-01
- 선행 태스크: **API-001** (Super-Calc Request/Response DTO 및 에러 코드 타입)
- 후행 태스크: UI-010 (검색창), UI-011 (비교 결과 페이지), UI-012 (캐시 기준 시각 인라인 표시), TEST-F1-004/006
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.3 Mock 데이터·Stub 서비스 태스크`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Mock 라이브러리 선정 및 설정** — MSW(Mock Service Worker) 또는 Next.js Route Handler를 활용한 In-process Mock 모드 구성
  - `MOCK_MODE=true` 환경변수 분기 또는 `/api/v1/compare?__mock=success` 쿼리 파라미터로 시나리오 트리거
- [ ] **Mock 데이터 시드 작성** — `src/mocks/data/compare-fixtures.ts`
  - `vitamin_d_success.json` (5건의 비타민D 제품, 1일 단가 오름차순)
  - `vitamin_d_cache_fallback.json` (`is_cached: true`, `cached_at` 기준 시각 포함)
  - `unknown_ingredient_empty.json` (`results: []`, `total_count: 0`)
- [ ] **Success 시나리오 핸들러 구현** — `/api/v1/compare?ingredient=비타민D` 호출 시
  - API-001의 `CompareResponse` 형식 준수
  - `daily_cost_krw` 오름차순 정렬된 5~20건의 결과
  - `is_cached: false`, `final_price_krw` 필드 포함
- [ ] **Cache Fallback 시나리오 핸들러** — `?__scenario=cache_fallback` 또는 시드 트리거
  - `is_cached: true`, `cached_at: "2026-04-17T09:00:00Z"` 등 ISO 8601
  - HTTP 200 + `X-Data-Source: cache` 응답 헤더
  - SRS §3.1.1 EXT-SYS-01 폴백 시나리오 검증용
- [ ] **Empty Result 시나리오 핸들러** — 미등록 성분 검색 시
  - HTTP 404 + `error_code: "COMPARE_INGREDIENT_NOT_FOUND"` (API-001 에러 코드 Enum 활용)
  - 또는 200 + `results: []` + 안내 메시지 (REQ-FUNC-008과 정합)
- [ ] **에러 시나리오 핸들러** — Rate Limit (429), 외부 API 장애 (502), 잘못된 요청 (400)
  - API-008의 공통 에러 응답 스키마 포맷 준수
- [ ] **응답 지연 시뮬레이션** — `?__delay=2000` 옵션으로 0~3,500ms 가변 지연 (REQ-NF-001 p95 검증용)
- [ ] **Mock 사용 가이드 문서화** — `src/mocks/README.md`에 시나리오 트리거 방법, 응답 예시, 환경변수 정리

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 응답 — 비타민D 검색**
- **Given**: Mock 모드가 활성화된 상태에서 시드 데이터에 비타민D 5개 제품이 있음
- **When**: `GET /api/v1/compare?ingredient=비타민D&sort_by=daily_cost`를 호출함
- **Then**: HTTP 200과 함께 `daily_cost_krw` 오름차순으로 정렬된 5건의 `PriceComparisonItem` 배열이 반환되며, `is_cached: false`이다.

**Scenario 2: 쿠팡 장애 폴백 — 캐시 기준 시각 명시**
- **Given**: `?__scenario=cache_fallback` 트리거가 주어진 상태
- **When**: Compare API를 호출함
- **Then**: HTTP 200, `is_cached: true`, `cached_at` 필드에 유효한 ISO 8601 타임스탬프가 포함되며, `X-Data-Source: cache` 응답 헤더가 설정된다.

**Scenario 3: 미등록 성분 — 빈 결과**
- **Given**: 시드 데이터에 존재하지 않는 성분명이 주어짐 (예: `xyz123`)
- **When**: `GET /api/v1/compare?ingredient=xyz123`을 호출함
- **Then**: HTTP 404와 함께 `{ error_code: "COMPARE_INGREDIENT_NOT_FOUND", message: "..." }` 응답이 반환된다 (API-008 공통 에러 스키마 준수).

**Scenario 4: 응답 시간 시뮬레이션**
- **Given**: `?__delay=3000` 파라미터가 주어짐
- **When**: Compare API를 호출함
- **Then**: 응답이 약 3,000ms 후 반환되며, REQ-NF-001 p95 ≤ 3,500ms 임계 검증에 활용 가능하다.

**Scenario 5: DTO 계약 준수 검증**
- **Given**: API-001 Zod 스키마(`CompareResponseSchema`)가 정의된 상태
- **When**: Mock 응답을 `CompareResponseSchema.parse()`로 검증함
- **Then**: 모든 시나리오의 응답이 Zod 검증을 통과한다 (계약 정합성 보장).

## :gear: Technical & Non-Functional Constraints
- **DTO 계약 정합성 (P1, SSOT)**: Mock 응답은 반드시 API-001의 `CompareResponse` 타입과 `CompareResponseSchema` Zod 검증을 모두 통과해야 한다. 임의 필드 추가·누락 금지.
- **결정론성 (Deterministic)**: 동일 요청은 동일 응답을 반환해야 한다. 랜덤 데이터 생성 금지 (테스트 재현성 확보).
- **운영 환경 분리 (CON-9)**: Mock 코드는 `NODE_ENV !== 'production'` 또는 `MOCK_MODE=true` 환경에서만 활성화. 프로덕션 빌드에서는 트리 셰이킹으로 제거되어야 함.
- **시나리오 트리거 명시성**: 쿼리 파라미터(`__scenario`, `__delay`)는 더블 언더스코어 prefix로 Mock 전용임을 명시하여 실제 API 파라미터와 충돌 방지.
- **외부 호출 금지**: Mock 핸들러는 쿠팡 API, DB, 외부 시스템에 일절 접근하지 않는다 (격리성 보장).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `src/mocks/data/compare-fixtures.ts`에 시드 데이터 3종(success, cache_fallback, empty)이 작성되었는가?
- [ ] Mock 핸들러가 API-001 DTO 및 Zod 스키마와 100% 정합하는가?
- [ ] `MOCK_MODE` 환경변수 또는 쿼리 파라미터로 시나리오 분기가 동작하는가?
- [ ] `src/mocks/README.md`에 사용 가이드가 작성되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(각 시나리오별 응답 검증)가 작성되고 통과하는가?
- [ ] 프로덕션 빌드(`pnpm build`)에서 Mock 코드가 번들에 포함되지 않음을 확인했는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-001 (Super-Calc DTO 및 에러 코드 타입), #API-008 (공통 에러 응답 스키마)
- **Blocks**:
  - #UI-010 (검색창 + 자동완성 드롭다운)
  - #UI-011 (1일 단가 비교 결과 페이지)
  - #UI-012 (쿠팡 캐시 기준 시각 인라인 표시 UI)
  - #TEST-F1-004 (쿠팡 장애 폴백 통합 테스트)
  - #TEST-F1-006 (Super-Calc E2E p95 검증)

## :bookmark_tabs: Notes
- Mock 핸들러는 Phase 1의 핵심 산출물이다: 백엔드 F1-Q-001/F1-RH-001가 미완성이어도 프론트가 UI-011/UI-012를 완전한 형태로 개발할 수 있어야 한다.
- 추후 F1-RH-001 구현 완료 시 Mock 핸들러는 그대로 보존하되, `MOCK_MODE=false`로 비활성화하여 실 API와 동일 인터페이스 회귀 테스트에 재활용한다.
- `__scenario`, `__delay` 같은 Mock 트리거 파라미터는 Swagger/OpenAPI 문서에는 노출하지 않는다 (개발 전용 파라미터).
