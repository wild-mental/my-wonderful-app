---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-003: Search API (`GET /api/v1/search`) Request/Response DTO 및 에러 코드 TypeScript 타입 정의"
labels: 'feature, api, epic:E-API, priority:high, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [API-003] Search API DTO 및 에러 코드 TypeScript 타입 정의
- 목적: 영양소/성분 검색 및 자동완성 API의 요청/응답 데이터 계약을 TypeScript 타입과 Zod 스키마로 정의하여, 검색 Route Handler와 프론트엔드 검색 UI 간의 SSOT를 확보한다. 미등록 성분 검색 시 안내 메시지와 등록 요청 CTA 반환 타입도 포함한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-03 (`GET /api/v1/search`)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1`](../05_SRS_v1.md) — REQ-FUNC-008 (미등록 성분 안내)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-030 (영양소 검색 + 자동완성)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.1 PRODUCT`](../05_SRS_v1.md), [`/05_SRS_v1.md#6.2.2 INGREDIENT`](../05_SRS_v1.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-002** (PRODUCT 스키마), **DATA-003** (INGREDIENT 스키마)
- 후행 태스크: MOCK-003 (Search Mock 엔드포인트), COM-Q-001 (검색 + 자동완성 로직), COM-RH-001 (Search Route Handler 통합)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Request DTO 타입 정의** — `src/types/api/search.ts`에 `SearchRequest` 인터페이스 정의
  - `query: string` (검색어, 필수, 최소 1자)
  - `category?: string` (카테고리 필터, 선택)
  - `limit?: number` (반환 건수 상한, 기본값: 10, 최대: 30)
  - `offset?: number` (페이지네이션 오프셋, 기본값: 0)
- [ ] **AutocompleteItem 타입 정의** — 자동완성 후보 항목
  - `name: string` (성분명 또는 제품명)
  - `type: 'ingredient' | 'product'` (후보 유형)
  - `id: string` (대상 ID)
  - `highlight: string` (검색어 매칭 하이라이트 HTML)
- [ ] **SearchResultItem 타입 정의** — 검색 결과 제품 항목
  - `product_id: string`
  - `product_name: string`
  - `brand_name: string`
  - `category: string`
  - `matched_ingredients: string[]` (매칭된 성분명 목록)
- [ ] **Response DTO 타입 정의** — `SearchResponse` 인터페이스 정의
  - `autocomplete: AutocompleteItem[]` (자동완성 후보 목록)
  - `results: SearchResultItem[]` (검색 결과 제품 목록)
  - `total_count: number` (전체 매칭 건수)
  - `is_registered: boolean` (검색 성분 등록 여부)
  - `unregistered_message?: string` (미등록 성분 안내 메시지, REQ-FUNC-008)
  - `registration_cta?: { label: string; action: string }` (등록 요청 CTA 버튼 정보)
- [ ] **Zod 런타임 검증 스키마 작성** — `src/schemas/search.schema.ts`
  - Request: `query` 최소 1자, 최대 200자 / `limit` 1~30 범위
  - Response: `type` Enum 검증, `total_count` 비음수
- [ ] **에러 코드 Enum 정의** — Search API 전용 에러 코드
  - `SEARCH_QUERY_REQUIRED` (400): 검색어 미입력
  - `SEARCH_QUERY_TOO_SHORT` (400): 검색어가 최소 길이 미달
  - `SEARCH_NO_RESULTS` (200): 검색 결과 0건 (에러는 아니지만 상태 표시용)
- [ ] **타입 Export 정리** — `src/types/api/index.ts` barrel export에 Search 관련 타입 등록
- [ ] **JSDoc 주석 작성** — 모든 필드에 한국어 설명, SRS 참조, 예시 값 기술

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 검색 요청**
- **Given**: `{ query: "비타민D", limit: 10 }` 요청이 주어진 상태
- **When**: `SearchRequestSchema.parse()`로 유효성 검증을 수행한다
- **Then**: 에러 없이 파싱이 성공한다.

**Scenario 2: 빈 검색어 거부**
- **Given**: `{ query: "" }` 요청이 주어진 상태
- **When**: `SearchRequestSchema.parse()`로 유효성 검증을 수행한다
- **Then**: `ZodError`가 발생하며, `query` 최소 길이 위반 에러가 포함된다.

**Scenario 3: 미등록 성분 안내 메시지 표현**
- **Given**: 미등록 성분 "NMN"을 검색한 상황
- **When**: `SearchResponse` 객체를 `is_registered: false`로 구성한다
- **Then**: `unregistered_message`에 안내 메시지가 포함되고, `registration_cta`에 CTA 버튼 정보가 포함되어, 프론트엔드에서 REQ-FUNC-008 UI를 구성할 수 있다.

**Scenario 4: 자동완성 후보 타입 구분**
- **Given**: "비타민" 검색 시 성분(ingredient)과 제품(product) 후보가 혼합된 상황
- **When**: `AutocompleteItem[]` 배열을 구성한다
- **Then**: 각 항목의 `type`이 `'ingredient'` 또는 `'product'`로 구분되며, TypeScript 유니온 타입 검증을 통과한다.

## :gear: Technical & Non-Functional Constraints
- **검색 응답 성능**: 자동완성 후보 반환은 300ms 이내 목표 (REQ-FUNC-008 AC). DTO 구조가 직렬화 부담을 주지 않도록 경량 설계.
- **등록 요청 CTA (REQ-FUNC-008)**: 미등록 성분 검색 시 `registration_cta` 필드는 프론트엔드에서 `[제품 등록 요청하기]` 버튼 렌더링에 사용. 제출 성공률 99% 이상 요구사항과 연계.
- **데이터 모델 정합**: `SearchResultItem`은 PRODUCT/INGREDIENT 테이블의 필드 서브셋. Prisma 타입과 의미적으로 일치해야 하되, API 계약으로서 별도 DTO로 격리.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~4)를 충족하는가?
- [ ] Request/Response DTO 타입, AutocompleteItem, SearchResultItem이 정의되었는가?
- [ ] Zod 스키마가 작성되고 파싱 테스트가 통과하는가?
- [ ] 에러 코드가 정의되고 API-008 공통 에러 스키마와 호환되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] JSDoc 주석 및 barrel export 완료?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-002 (PRODUCT 스키마), #DATA-003 (INGREDIENT 스키마)
- **Blocks**:
  - #MOCK-003 (Search API Mock 엔드포인트)
  - #COM-Q-001 (성분 검색 + 자동완성 로직)
  - #COM-Q-002 (미등록 성분 안내 + CTA 반환 로직)
  - #COM-RH-001 (Search Route Handler 통합)
  - #UI-010 (메인 페이지 검색 + 자동완성 UI)

## :bookmark_tabs: Notes
- 자동완성 `highlight` 필드는 검색어 매칭 부분을 `<mark>` 태그로 감싼 HTML 문자열을 저장한다. 프론트엔드에서 `dangerouslySetInnerHTML` 사용 시 XSS 방지를 위해 서버에서 sanitize 처리 필수 (COM-Q-001에서 구현).
- `is_registered` 필드는 프론트엔드에서 미등록 성분 안내 UI 분기의 핵심 플래그. 미등록 상태에서도 HTTP 200을 반환하되, `results`가 빈 배열이고 `unregistered_message`가 채워진 형태.
