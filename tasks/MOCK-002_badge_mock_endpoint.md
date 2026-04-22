---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-002: Badge API Mock 엔드포인트 구성 (캐시 Hit/Miss, 미등재 원료 시나리오)"
labels: 'feature, mock, epic:E-MOCK, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-002] Badge API (`GET /api/v1/badges`) Mock 엔드포인트
- 목적: 백엔드 Badge Route Handler(F2-RH-001) 구현 이전에, 프론트엔드(UI-020 ~ UI-023, UI-051)와 캐시 동작 검증 테스트(TEST-F2-006)가 API-002에서 정의한 DTO 계약 기반으로 독립 개발할 수 있도록 결정론적 Mock 응답을 제공한다. 캐시 Hit/Miss, 식약처 미등재 원료의 회색 라벨 처리 시나리오를 분기 가능해야 한다.
- Epic / Phase: E-MOCK / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.2 핵심 흐름: 식약처 뱃지 판정`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.2 상세 시퀀스: 뱃지 판정`](../05_SRS_v1.md)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-010~015
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-02
- SRS 비기능: [`/05_SRS_v1.md#4.2 비기능 요구사항`](../05_SRS_v1.md) — REQ-NF-002 (Badge p95 ≤ 1,000ms)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Next.js Cache TTL 24h
- 선행 태스크: **API-002** (Badge API DTO 및 에러 코드 타입)
- 후행 태스크: UI-020 (제품 상세), UI-021 (뱃지 컴포넌트), UI-022 (일상어 번역), UI-023 (뱃지 근거 출처), UI-051 (마케팅 0건 검증), TEST-F2-006
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.3 Mock 데이터·Stub 서비스 태스크`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Mock 데이터 시드 작성** — `src/mocks/data/badge-fixtures.ts`
  - `vitamin_d_approved.json` — 뱃지 4건: APPROVED 2, CAUTION 1, NOT_APPROVED 1
  - `unknown_ingredient_gray.json` — 식약처 미등재 원료의 회색 라벨 (REQ-FUNC-014)
  - `cache_hit_response.json` — `is_cached: true`, `cache_age_seconds: 3600`
  - `cache_miss_response.json` — `is_cached: false`, 신규 판정 결과
- [ ] **Cache Hit 시나리오 핸들러** — `?__scenario=cache_hit` 또는 동일 product_id 2회 연속 호출
  - HTTP 200 + `is_cached: true` + `cache_age_seconds`
  - 응답 헤더 `X-Cache: HIT`
  - 응답 시간 시뮬레이션 < 100ms (캐시 Hit 가속 효과 표현)
- [ ] **Cache Miss 시나리오 핸들러** — `?__scenario=cache_miss` 또는 신규 product_id
  - HTTP 200 + `is_cached: false`
  - 응답 헤더 `X-Cache: MISS`
  - 응답 시간 시뮬레이션 ~500ms (식약처 API 조회 + 판정 로직 시간 모사)
- [ ] **미등재 원료 회색 라벨 시나리오** — `?ingredient=unknown` 또는 시드 트리거
  - `verdict: NOT_APPROVED` 대신 `verdict: UNREGISTERED` 또는 별도 플래그
  - `reason_message: "식약처 공전 미등재 원료입니다. 회색 라벨로 표시됩니다."` (REQ-FUNC-014)
  - 뱃지 색상 코드 `gray`
- [ ] **금지 표현 0건 검증 시드 데이터** — REQ-FUNC-012 (질병 예방·치료 표현 차단)
  - 모든 Mock 응답의 `description`, `effect_summary` 필드에 금지 표현 미포함을 보장하는 단위 테스트 동반
- [ ] **에러 시나리오 핸들러** — 식약처 API 장애 (502), 잘못된 product_id (404)
  - API-008 공통 에러 스키마 준수
- [ ] **Mock 사용 가이드 문서화** — `src/mocks/README.md`에 Badge 시나리오 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Cache Hit — 동일 제품 2회 호출**
- **Given**: Mock 모드 활성화 + 동일 product_id로 1회 선행 호출 완료
- **When**: 동일 product_id로 두 번째 `GET /api/v1/badges?product_id=p001`을 호출함
- **Then**: HTTP 200, `is_cached: true`, 응답 헤더 `X-Cache: HIT`, 응답 시간 < 100ms.

**Scenario 2: Cache Miss — 신규 제품**
- **Given**: 시드 캐시에 없는 product_id가 주어짐
- **When**: `GET /api/v1/badges?product_id=p999`을 호출함
- **Then**: HTTP 200, `is_cached: false`, `X-Cache: MISS`, 응답 시간 ~500ms.

**Scenario 3: 미등재 원료 — 회색 라벨**
- **Given**: 식약처 공전에 미등재된 원료를 포함한 product_id가 주어짐
- **When**: Badge API를 호출함
- **Then**: 응답 객체의 해당 원료 항목에 `verdict: "UNREGISTERED"` 또는 동등 플래그가 포함되며, `reason_message`에 "공전 미등재" 안내가 명시된다.

**Scenario 4: 금지 표현 0건 보장 (REQ-FUNC-012)**
- **Given**: Badge Mock의 모든 시드 응답
- **When**: 응답 텍스트 필드(`description`, `effect_summary`, `reason_message`)에 금지 표현 패턴(예: "치료", "예방", "완치")을 정규식으로 검사함
- **Then**: 검출 0건이 보장된다.

**Scenario 5: DTO 계약 준수**
- **Given**: API-002의 `BadgeResponseSchema` Zod 스키마가 정의됨
- **When**: Mock 응답을 `BadgeResponseSchema.parse()`로 검증함
- **Then**: 모든 시나리오의 응답이 Zod 검증을 통과한다.

## :gear: Technical & Non-Functional Constraints
- **DTO 계약 정합성 (P1)**: API-002의 `BadgeResponse` 타입과 Zod 스키마를 100% 준수.
- **마케팅 콘텐츠 0건 (REQ-FUNC-010)**: Mock 응답에 광고 배너, 리뷰 텍스트, 별점 필드, 체험단 링크 일절 포함 금지. UI-051의 검증 대상이 되므로 시드 데이터 자체에서 차단.
- **금지 표현 0건 (REQ-FUNC-012, CON-2)**: 건강기능식품법 위반 표현(질병 예방·치료) 시드 데이터에 포함 금지. 자동 검증 테스트 동반.
- **응답 시간 시뮬레이션 (REQ-NF-002)**: Cache Hit < 100ms, Cache Miss < 1,000ms 모사로 p95 검증 시뮬레이션 가능.
- **결정론성**: 동일 product_id는 동일 응답. 캐시 시뮬레이션 역시 in-memory Map으로 결정적 동작.
- **운영 환경 분리 (CON-9)**: `MOCK_MODE=true` 또는 `NODE_ENV !== 'production'`에서만 활성화. 프로덕션 빌드 시 트리 셰이킹 제거.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `src/mocks/data/badge-fixtures.ts`에 시드 4종(approved, gray, cache_hit, cache_miss)이 작성되었는가?
- [ ] Mock 핸들러가 API-002 DTO 및 Zod 스키마와 100% 정합하는가?
- [ ] In-memory 캐시 시뮬레이션 로직이 동작하며 `X-Cache` 헤더를 정확히 반환하는가?
- [ ] 금지 표현 자동 검증 테스트가 통과하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] `src/mocks/README.md`에 Badge Mock 사용법이 추가되었는가?
- [ ] 프로덕션 빌드에서 Mock 코드가 번들에 포함되지 않음을 확인했는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-002 (Badge API DTO 및 에러 코드), #API-008 (공통 에러 스키마)
- **Blocks**:
  - #UI-020 (제품 상세 페이지)
  - #UI-021 (뱃지 컴포넌트 — APPROVED/CAUTION/NOT_APPROVED/회색)
  - #UI-022 (일상어 번역 괄호 표시)
  - #UI-023 (뱃지 근거 출처 표시 UI)
  - #UI-051 (마케팅 콘텐츠 0건 검증)
  - #TEST-F2-006 (Badge API p95 ≤ 1,000ms 검증)

## :bookmark_tabs: Notes
- Mock 응답에서 `cache_age_seconds`는 캐시 TTL 24h(86,400초) 이내의 임의 값을 사용한다 (§3.4.2, §3.6 Next.js Cache).
- 회색 라벨(미등재) 처리는 SRS REQ-FUNC-014의 핵심: 뱃지 미부여 + 사유 툴팁이 UI-021의 분기 로직을 결정하므로, Mock에서 `verdict` 외에 `display_color`, `tooltip_message` 필드를 추가 노출 검토.
- 추후 F2-C-005(뱃지 캐싱 로직) 구현 시 Mock의 in-memory 캐시 동작은 Next.js `unstable_cache` 또는 React `cache()` 호환 인터페이스로 마이그레이션 가능하도록 키/TTL 형식을 일치시킨다.
