---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-Q-001: 영양소/성분 검색 + 자동완성 로직 구현"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-Q-001] 성분 검색 + 자동완성 [Query]
- 목적: SRS REQ-FUNC-030 자동완성 검색 요구사항을 충족하는 Read 전용 쿼리 로직을 구현한다. 사용자가 입력한 키워드를 기반으로 INGREDIENT 테이블에서 영양소·성분명을 fuzzy 매칭하고, 가중치(인기도, 매칭 정확도)에 따라 최대 10건의 자동완성 후보를 200ms 이내로 반환한다. 또한 키워드와 일치하는 PRODUCT 목록도 함께 조회하여 검색 결과 페이지를 구성한다.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-030 (자동완성 검색)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — UC-01 (검색)
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-03 (`GET /api/v1/search`)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.1 PRODUCT`](../05_SRS_v1.md), [`/05_SRS_v1.md#6.2.2 INGREDIENT`](../05_SRS_v1.md)
- 선행 태스크: **API-003** (Search DTO), **DATA-002** (PRODUCT), **DATA-003** (INGREDIENT)
- 후행 태스크: COM-Q-002 (미등록 안내), COM-RH-001 (Search Route Handler), UI-010 (검색창)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **자동완성 쿼리 함수** — `src/lib/queries/search/autocomplete.ts`
  - `autocompleteIngredients(keyword: string, limit = 10): Promise<IngredientSuggestion[]>`
  - INGREDIENT.name에 대해 prefix 매칭(`LIKE '키워드%'`) + contains 매칭(`LIKE '%키워드%'`) 2단계 우선순위
  - 가중치: 정확 일치 > prefix 일치 > contains 일치, 동일 우선순위 내에서는 인기도(연관 PRODUCT 수) 내림차순
- [ ] **제품 검색 쿼리 함수** — `src/lib/queries/search/products.ts`
  - `searchProducts(keyword: string, options?: { limit?: number; offset?: number }): Promise<ProductSummary[]>`
  - INGREDIENT.name과 PRODUCT.name 모두에서 keyword 매칭
  - 결과 배열의 각 항목에 product_id, product_name, brand_name, thumbnail_url, ingredient_summary 필드
- [ ] **한국어 NFC/NFD 정규화 처리** — 입력 키워드 정규화
  - `keyword.normalize('NFC')` 적용
  - 자모 분리("ㅂㅣㅌㅏ") 입력은 빈 결과 반환 (방어적)
- [ ] **PostgreSQL 트라이그램 인덱스 활용** — `pg_trgm` 확장 활용 검토
  - INGREDIENT.name에 GIN trigram 인덱스 생성 검토 (마이그레이션 추가)
  - 단순 LIKE보다 fuzzy 매칭 정확도 향상
- [ ] **검색 결과 캐싱** — Next.js `unstable_cache` 활용
  - 동일 키워드 1분 TTL 캐싱 (인기 키워드 응답 시간 절감)
  - 캐시 키: `search:autocomplete:${normalized_keyword}`
- [ ] **방어적 입력 검증**
  - 빈 문자열, 1자 미만(한국어/영어 모두): 빈 배열 반환 (200 OK, 사일런트 무시)
  - SQL 인젝션 패턴: Prisma ORM 사용으로 자동 방어, 추가 sanitize 불필요
  - 최대 길이 100자 초과: 잘라내기(truncate)
- [ ] **응답 시간 측정 로깅** — 200ms 임계 모니터링
  - `console.time` / OpenTelemetry span 활용
  - p95 > 200ms 시 NFR-MON-002 알림 트리거
- [ ] **Unit 테스트 작성** — 정확 일치/prefix/contains 우선순위, 한글 NFC, 빈 입력, 100자+ 입력

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 자동완성 정상 응답 (REQ-FUNC-030)**
- **Given**: INGREDIENT 테이블에 비타민D, 비타민C, 비타민B, 비타민E가 시드되어 있고, 입력 "비타"가 주어진 상태
- **When**: `autocompleteIngredients('비타')`을 호출함
- **Then**: 4건의 영양소명이 정확 일치 > prefix > 인기도 순으로 정렬되어 반환되며, 응답 시간 < 200ms.

**Scenario 2: 정확 일치 우선순위**
- **Given**: INGREDIENT에 "비타민D", "비타민D2", "비타민D3"가 있고, 입력 "비타민D"가 주어짐
- **When**: 자동완성을 호출함
- **Then**: "비타민D"가 1번째로 반환되며, "비타민D2"와 "비타민D3"가 뒤따른다.

**Scenario 3: 한국어 NFC 정규화**
- **Given**: 클라이언트에서 NFD 형태("비타미")로 입력이 전송된 상태
- **When**: 자동완성을 호출함
- **Then**: 서버가 NFC로 정규화한 후 매칭하여 "비타민D" 등 정상 후보를 반환한다.

**Scenario 4: 1자 미만 사일런트 무시**
- **Given**: 입력 "ㄱ" (자모 1자)이 주어짐
- **When**: 자동완성을 호출함
- **Then**: 빈 배열 `[]`이 반환되며 에러는 발생하지 않는다.

**Scenario 5: 제품 검색**
- **Given**: PRODUCT에 비타민D를 함유한 5개 제품이 시드되어 있고, 입력 "비타민D"가 주어진 상태
- **When**: `searchProducts('비타민D')`을 호출함
- **Then**: 5개 ProductSummary가 반환되며, 각 항목에 ingredient_summary로 비타민D가 포함되어 있다.

**Scenario 6: 응답 시간 임계 (REQ-FUNC-030 AC)**
- **Given**: 1,000건의 INGREDIENT가 시드된 상태
- **When**: 100개의 다양한 키워드로 자동완성을 반복 호출함
- **Then**: p95 응답 시간 ≤ 200ms를 충족한다.

## :gear: Technical & Non-Functional Constraints
- **응답 시간 < 200ms (REQ-FUNC-030)**: 자동완성 UX 임계. trigram 인덱스 + 캐싱으로 달성.
- **캐싱 TTL 1분**: 동일 키워드 단기 캐싱. INGREDIENT 데이터는 자주 변하지 않으므로 안전.
- **방어적 입력**: 빈 문자열·1자 미만은 사일런트 무시 (UI 디바운싱 미흡 시에도 안전).
- **Prisma ORM 전용**: SQL 인젝션 방어. Raw query는 trigram 인덱스 활용 시에만 제한적으로 사용하되, 파라미터 바인딩 필수.
- **PII 미포함**: 검색 쿼리는 USER 정보를 일절 참조하지 않음. 익명 검색 가능.
- **Read-only**: 본 태스크는 [Query]이므로 INSERT/UPDATE/DELETE 일절 금지. 검색 이벤트 로깅이 필요하면 별도 [Command] 태스크로 분리.
- **한글 정규화**: 입력 keyword는 NFC 정규화 후 매칭. INGREDIENT.name도 시드 시 NFC로 저장 (DATA-011에서 보장).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `autocompleteIngredients`, `searchProducts` 함수가 구현되었는가?
- [ ] 한국어 NFC 정규화가 적용되었는가?
- [ ] PostgreSQL trigram 인덱스 활용 여부 결정 및 마이그레이션 처리되었는가?
- [ ] Next.js `unstable_cache`로 1분 TTL 캐싱이 동작하는가?
- [ ] 1자 미만/빈 입력에서 사일런트 빈 배열을 반환하는가?
- [ ] 응답 시간 측정 로깅이 활성화되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(scenario 1~5) + 부하 테스트(scenario 6, 1,000건 INGREDIENT)가 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-003 (Search DTO), #DATA-002 (PRODUCT), #DATA-003 (INGREDIENT)
- **Blocks**:
  - #COM-Q-002 (미등록 성분 안내 + CTA — 본 태스크 결과가 빈 배열일 때 분기)
  - #COM-RH-001 (Search Route Handler 통합 조립)
  - #UI-010 (검색창 + 자동완성 드롭다운)
  - #TEST-COM-002 (검색 자동완성 E2E 검증)

## :bookmark_tabs: Notes
- 자동완성과 제품 검색은 동일 엔드포인트(`GET /api/v1/search`)에서 `?type=autocomplete | product` 파라미터로 분기 처리되며, 본 태스크는 두 쿼리 함수만 제공한다. 통합 조립은 COM-RH-001에서 수행.
- INGREDIENT 인기도(`popularity_score`)는 PRODUCT_INGREDIENT 조인 카운트로 계산하되, 자주 호출되므로 컴퓨티드 컬럼 또는 머터리얼라이즈드 뷰 도입을 검토. MVP에서는 단순 카운트 쿼리로 시작하고 성능 모니터링 후 결정.
- pg_trgm 확장이 Supabase Free 플랜에서 활성화 가능한지 사전 확인 필요. 비활성화 시 LIKE 기반 단순 매칭으로 후퇴.
- 추후 검색 키워드 분석을 위한 `search_query_log` 테이블 도입 검토(Phase 2). 본 태스크는 Read-only이므로 로깅 책임 없음.
