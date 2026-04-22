---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-006: 식약처 공공 데이터 API Stub 서비스 (개발/테스트 환경용)"
labels: 'feature, mock, epic:E-MOCK, priority:high, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-006] 식약처(MFDS) 건강기능식품 공공 데이터 API Stub 서비스
- 목적: API-007에서 정의한 식약처 공공 데이터 API 응답 타입을 기반으로, 개발/테스트 환경에서 외부 API 호출 없이 F2-Q-002(기능성 원료 조회) 및 F2-C-001(뱃지 판정 로직)을 결정론적으로 검증할 수 있도록 Stub 서비스를 제공한다. 등재 원료, 미등재 원료, 일일 호출 한도 초과, 응답 지연 등 시나리오를 트리거 가능해야 한다.
- Epic / Phase: E-MOCK / Phase 1 (계약·데이터 명세)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 외부 API 명세: [`/05_SRS_v1.md#6.1.1 외부 API`](../05_SRS_v1.md) — EXT-API-02 (식약처 건강기능식품)
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1 External Systems`](../05_SRS_v1.md) — EXT-SYS-02
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — EXT-SYS-02 폴백 (캐시 + 재시도)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-011 (식약처 공전 1:1 매칭), REQ-FUNC-014 (미등재 회색 라벨)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.4 BADGE`](../05_SRS_v1.md)
- 선행 태스크: **API-007** (식약처 공공 API 응답 타입 정의)
- 후행 태스크: F2-Q-002 (식약처 API 기능성 원료 조회), F2-C-001 (뱃지 판정), F2-C-004 (회색 라벨), TEST-F2-002, TEST-F2-005
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.3 Mock 데이터·Stub 서비스 태스크`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **MfdsApiStub 모듈 구현** — `src/lib/external/__stubs__/mfds-api-stub.ts`
  - API-007의 식약처 응답 타입(`MfdsIngredientResponse`, `MfdsFunctionalClaim`)과 동일 시그니처
  - `searchFunctionalIngredient(name: string): Promise<MfdsIngredientResponse>` 등 핵심 메서드
- [ ] **시드 데이터 작성** — `src/lib/external/__stubs__/data/mfds-functional-ingredients.json`
  - 등재 원료 30건+ (비타민D, 오메가-3, 마그네슘, 루테인, 프로바이오틱스, EPA, DHA 등)
  - 각 원료에 식약처 공전 원문(`raw_claim_text`), 인정 기능(`functional_claim`), 일일 섭취 권장량(`daily_intake_recommendation`), 공전 URL 포함
  - 미등재 원료 시드: `xyz_unknown`, `fake_ingredient` 등 명시적으로 비어있는 결과 반환
- [ ] **searchFunctionalIngredient 메서드 구현**
  - 등재 원료: HTTP 200 + `is_registered: true` + 공전 원문 반환
  - 미등재 원료: HTTP 200 + `is_registered: false` + 빈 결과 (404 아님, 정상 응답)
- [ ] **장애 시나리오 트리거** — 환경변수 `STUB_MFDS_SCENARIO`
  - `available`: 정상 응답 (기본값)
  - `daily_limit_exceeded`: HTTP 429 + 일일 호출 한도 초과 (식약처 공공 API 특성 모사)
  - `timeout`: 5초 후 timeout 에러
  - `unavailable`: HTTP 503 (점검/장애)
- [ ] **응답 지연 시뮬레이션** — `STUB_MFDS_LATENCY_MS=300` (기본 300ms, 공공 API 특성 모사)
- [ ] **공전 원문 정합성 시드 검증** — REQ-FUNC-011 핵심 (뱃지-공전 1:1 매칭)
  - 모든 시드의 `raw_claim_text`가 식약처 공식 표현 패턴(예: "...에 도움을 줄 수 있음", "...의 흡수에 필요")과 일치
  - 금지 표현(질병 치료·예방) 시드 데이터에 0건 보장
- [ ] **레지스트리 등록** — `src/lib/external/index.ts`의 `getMfdsApiClient()`가 `MOCK_MODE=true` 시 Stub 반환
- [ ] **Stub 사용 가이드 문서화** — `src/lib/external/__stubs__/README.md`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 등재 원료 조회 — 비타민D**
- **Given**: 시드에 비타민D 등재 정보가 있음, `STUB_MFDS_SCENARIO=available`
- **When**: `await stub.searchFunctionalIngredient('비타민D')`을 호출함
- **Then**: HTTP 200, `is_registered: true`, `raw_claim_text`에 식약처 공전 원문, `functional_claim`에 인정 기능 표현이 반환된다.

**Scenario 2: 미등재 원료 조회 — 회색 라벨 분기 (REQ-FUNC-014)**
- **Given**: 시드에 미등재된 원료명 "xyz_unknown"이 주어짐
- **When**: `searchFunctionalIngredient('xyz_unknown')`을 호출함
- **Then**: HTTP 200, `is_registered: false`, 빈 `functional_claim` 객체가 반환된다 (404가 아닌 정상 응답으로 미등재 신호).

**Scenario 3: 일일 호출 한도 초과 — 폴백 트리거 (EXT-SYS-02)**
- **Given**: `STUB_MFDS_SCENARIO=daily_limit_exceeded`
- **When**: API를 호출함
- **Then**: HTTP 429와 함께 에러가 throw되며, F2 폴백 로직(캐시 + 재시도)에서 캐시 응답을 반환할 수 있다.

**Scenario 4: 공전 원문 정합성 (REQ-FUNC-011)**
- **Given**: 모든 시드의 `raw_claim_text` 필드
- **When**: 식약처 공식 표현 패턴 정규식으로 검증함
- **Then**: 모든 시드 텍스트가 패턴과 일치하며, 금지 표현(질병 치료·예방)은 0건이다.

**Scenario 5: 외부 호출 0건 보장**
- **Given**: MfdsApiStub이 활성화된 테스트 환경
- **When**: 모든 메서드를 임의로 호출함
- **Then**: 네트워크 모니터링상 식약처 도메인(`*.mfds.go.kr`, `*.data.go.kr`)에 대한 호출이 0건이다.

## :gear: Technical & Non-Functional Constraints
- **타입 정합성 (P1)**: API-007의 `MfdsIngredientResponse` 타입을 100% 준수.
- **공전 원문 1:1 매칭 (REQ-FUNC-011)**: 시드 `raw_claim_text`는 반드시 식약처 공식 표현 패턴 사용. 임의 수정·재작성 금지. 추후 실제 공전 데이터와 1:1 매칭 가능성 보장.
- **금지 표현 0건 (REQ-FUNC-012, CON-2)**: 시드 데이터에 질병 예방·치료 표현 일절 포함 금지. 자동 검증 테스트 동반.
- **결정론성**: 동일 입력 + 동일 환경변수 = 동일 출력. 비결정적 요소 금지.
- **운영 환경 분리 (CON-9)**: `MOCK_MODE=true` 또는 `NODE_ENV !== 'production'`에서만 활성화. 프로덕션 빌드 시 트리 셰이킹 제거.
- **응답 시간**: 기본 지연 300ms (공공 API 평균 응답 시간 모사).
- **폴백 시뮬레이션 (EXT-SYS-02)**: 일일 호출 한도 초과 시나리오는 식약처 공공 API의 실제 특성. F2의 캐시 폴백 로직 검증에 필수.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `MfdsApiStub`가 API-007의 응답 타입 시그니처를 100% 구현하는가?
- [ ] 시드 데이터(`mfds-functional-ingredients.json`)가 등재 원료 30건+ 및 미등재 시드 2건+를 포함하는가?
- [ ] 4종 시나리오(`available`, `daily_limit_exceeded`, `timeout`, `unavailable`)가 환경변수로 트리거되는가?
- [ ] 공전 원문 패턴 자동 검증 테스트가 통과하는가?
- [ ] 금지 표현 자동 검증 테스트가 통과하는가? (검출 0건)
- [ ] 레지스트리(`getMfdsApiClient()`)가 `MOCK_MODE`에 따라 Stub/실 클라이언트를 분기 반환하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] `src/lib/external/__stubs__/README.md` 사용 가이드가 작성되었는가?
- [ ] 프로덕션 빌드에서 Stub 코드가 번들에 포함되지 않음을 확인했는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-007 (식약처 공공 API 응답 타입)
- **Blocks**:
  - #F2-Q-002 (식약처 API 기능성 원료 조회 로직)
  - #F2-C-001 (뱃지 판정 로직 — Stub 응답 기반 판정 검증)
  - #F2-C-004 (미등재 원료 회색 라벨 생성)
  - #MOCK-002 (Badge API Mock — Stub 데이터 기반 판정 결과 시드 구성)
  - #TEST-F2-002 (뱃지-공전 1:1 매칭 정확도 테스트)
  - #TEST-F2-005 (미등재 원료 식별 정확도 테스트)

## :bookmark_tabs: Notes
- 식약처 공공 데이터 API는 일일 호출 한도 제약이 강한 외부 시스템이므로(EXT-SYS-02), 개발·테스트 환경에서는 반드시 본 Stub을 사용해야 한다. 실 API 키로 개발 중 호출 한도를 소진하면 운영 영향이 발생할 수 있다.
- 시드 데이터는 식약처 공식 공전 표현을 정확히 인용하여 작성하되, 저작권·법적 이슈가 없도록 공개 자료를 기반으로 한다. 실제 공전 데이터는 DATA-011(Seed 데이터 스크립트)에서 로컬 적재.
- 본 Stub은 F2의 폴백 로직(캐시 + 재시도) 검증에 핵심: `daily_limit_exceeded` 시나리오에서 캐시 분기로 정확히 라우팅되는지 통합 테스트(TEST-F2-002)에서 검증.
- 향후 F2-Q-002 실 구현 완료 시 Stub은 그대로 보존하여, 회귀 테스트와 CI 환경에서 외부 의존성 없이 검증 가능하게 유지한다.
