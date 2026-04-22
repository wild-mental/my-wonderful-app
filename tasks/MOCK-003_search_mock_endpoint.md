---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-003: Search API Mock 엔드포인트 구성 (자동완성 후보, 미등록 성분 시나리오)"
labels: 'feature, mock, epic:E-MOCK, priority:high, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-003] Search API (`GET /api/v1/search`) Mock 엔드포인트
- 목적: 백엔드 검색 Route Handler(COM-RH-001)와 자동완성 로직(COM-Q-001/002) 구현 이전에, 메인 페이지(UI-010)와 미등록 성분 안내 UI(UI-013)가 API-003 DTO 계약을 기반으로 독립 개발될 수 있도록 결정론적 Mock 응답을 제공한다. 자동완성 후보 반환과 미등록 성분(REQ-FUNC-008) 시나리오를 분기 가능해야 한다.
- Epic / Phase: E-MOCK / Phase 1 (계약·데이터 명세)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-030 (자동완성 검색)
- SRS 미등록 성분 처리: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-008 (미등록 성분 안내 + CTA)
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-03
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — UC-01 (검색)
- 선행 태스크: **API-003** (Search API DTO 및 에러 코드 타입)
- 후행 태스크: UI-010 (검색창 + 자동완성 드롭다운), UI-013 (미등록 성분 CTA), TEST-F1-005, TEST-COM-002
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.3 Mock 데이터·Stub 서비스 태스크`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Mock 데이터 시드 작성** — `src/mocks/data/search-fixtures.ts`
  - `autocomplete_vitamin.json` — 입력 "비타" → ["비타민D", "비타민C", "비타민B", "비타민E"] 4건
  - `autocomplete_omega.json` — 입력 "오메" → ["오메가-3", "오메가-6"] 2건
  - `unregistered_ingredient.json` — 입력 "xyz123" → 빈 결과 + 등록 요청 CTA 메타
  - `single_char_ignored.json` — 입력 "ㄱ" → 빈 결과 (1자 미만 무시 정책)
- [ ] **Autocomplete 시나리오 핸들러** — `GET /api/v1/search?q=비타&type=autocomplete`
  - HTTP 200 + `suggestions: string[]` + `total_count`
  - 응답 시간 시뮬레이션 < 200ms (자동완성 UX 임계)
  - 최대 10건 반환 (REQ-FUNC-030 자동완성 후보 상한)
- [ ] **Product Search 시나리오 핸들러** — `GET /api/v1/search?q=비타민D&type=product`
  - HTTP 200 + `products: ProductSummary[]` + `total_count`
  - product_id, product_name, brand_name, thumbnail_url, ingredient_summary 포함
- [ ] **미등록 성분 시나리오 핸들러** — REQ-FUNC-008 핵심 시나리오
  - HTTP 200 + `suggestions: []` + `is_unregistered: true`
  - `cta: { label: "제품 등록 요청하기", action_url: "/admin/register-request" }` 메타 포함
  - 응답 시간 < 300ms (REQ-FUNC-008 AC: 안내 메시지 300ms 이내)
- [ ] **빈 쿼리/특수문자 핸들러** — 1자 미만, SQL 인젝션 패턴, 빈 문자열
  - 1자 미만: HTTP 200 + `suggestions: []` (사일런트 무시)
  - 빈 문자열: HTTP 400 + `error_code: "SEARCH_QUERY_REQUIRED"`
- [ ] **에러 시나리오 핸들러** — Rate Limit (429), 서버 오류 (500)
  - API-008 공통 에러 응답 스키마 준수
- [ ] **Mock 사용 가이드 문서화** — `src/mocks/README.md`에 Search 시나리오 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 자동완성 — "비타" 입력**
- **Given**: Mock 모드 활성화 + 자동완성 시드에 비타민D/C/B/E가 있음
- **When**: `GET /api/v1/search?q=비타&type=autocomplete`을 호출함
- **Then**: HTTP 200, `suggestions` 배열에 4건의 영양소명이 반환되며, 응답 시간 < 200ms.

**Scenario 2: 미등록 성분 — CTA 반환 (REQ-FUNC-008)**
- **Given**: 시드에 존재하지 않는 성분명 "xyz123"이 주어짐
- **When**: `GET /api/v1/search?q=xyz123&type=autocomplete`을 호출함
- **Then**: HTTP 200, `suggestions: []`, `is_unregistered: true`, `cta` 객체가 포함되며, 응답 시간 < 300ms.

**Scenario 3: 1자 미만 사일런트 무시**
- **Given**: 단일 문자 "ㄱ"이 입력됨
- **When**: `GET /api/v1/search?q=ㄱ&type=autocomplete`을 호출함
- **Then**: HTTP 200, `suggestions: []`이 반환되며 에러는 발생하지 않는다.

**Scenario 4: 빈 쿼리 거부**
- **Given**: `q=` (빈 문자열)이 주어짐
- **When**: Search API를 호출함
- **Then**: HTTP 400, `error_code: "SEARCH_QUERY_REQUIRED"`가 반환된다 (API-008 공통 에러 스키마 준수).

**Scenario 5: DTO 계약 준수**
- **Given**: API-003의 `SearchResponseSchema` Zod 스키마가 정의됨
- **When**: Mock 응답을 `SearchResponseSchema.parse()`로 검증함
- **Then**: 모든 시나리오의 응답이 Zod 검증을 통과한다.

## :gear: Technical & Non-Functional Constraints
- **DTO 계약 정합성 (P1)**: API-003의 `SearchResponse` 타입과 Zod 스키마를 100% 준수.
- **자동완성 응답 시간**: < 200ms (UX 임계). 미등록 안내 < 300ms (REQ-FUNC-008 AC).
- **결정론성**: 동일 쿼리는 동일 응답. 시드 기반.
- **운영 환경 분리 (CON-9)**: `MOCK_MODE=true` 또는 `NODE_ENV !== 'production'`에서만 활성화.
- **유니코드 안전성**: 한국어 NFC/NFD 정규화에 모두 대응 (예: "비타민" 입력의 자모 분리/조합 처리).
- **외부 호출 금지**: 시드 데이터 외 외부 시스템·DB 접근 금지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `src/mocks/data/search-fixtures.ts`에 시드 4종(autocomplete 2건, unregistered, single_char)이 작성되었는가?
- [ ] Mock 핸들러가 API-003 DTO 및 Zod 스키마와 100% 정합하는가?
- [ ] 미등록 성분 응답에 `cta` 메타가 포함되어 UI-013에서 활용 가능한가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] `src/mocks/README.md`에 Search Mock 사용법이 추가되었는가?
- [ ] Unit 테스트(시나리오별 응답 검증)가 작성되고 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-003 (Search API DTO), #API-008 (공통 에러 스키마)
- **Blocks**:
  - #UI-010 (검색창 + 자동완성 드롭다운)
  - #UI-013 (미등록 성분 안내 + CTA 버튼)
  - #TEST-F1-005 (미등록 성분 CTA 반환 검증)
  - #TEST-COM-002 (검색 자동완성 E2E 검증)

## :bookmark_tabs: Notes
- 자동완성은 검색 입력 ≥ 2자부터 트리거되도록 UI-010에서 디바운싱(150~200ms) 처리하나, Mock은 1자 미만이라도 안전하게 빈 배열을 반환해야 한다 (방어적 동작).
- `cta.action_url`은 MVP에서는 `/admin/register-request` 또는 모달 트리거 키(`#open-register-modal`)로 설정. 실제 등록 요청 Server Action은 COM-C-003에서 구현.
- 향후 COM-RH-001 구현 후 Mock은 `MOCK_MODE=false`로 비활성화하되, 시드 데이터는 회귀 테스트 픽스처로 보존한다.
