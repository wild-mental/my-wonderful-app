---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-005: 쿠팡 파트너스 외부 API Stub 서비스 (개발/테스트 환경용 Fake Adapter)"
labels: 'feature, mock, epic:E-MOCK, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-005] 쿠팡 파트너스 Fake Adapter (`FakeCoupangAdapter implements ChannelAdapter`)
- 목적: API-006에서 정의한 `ChannelAdapter` 인터페이스를 구현하는 가짜 어댑터를 제공하여, 개발/테스트 환경에서 실제 쿠팡 파트너스 API 호출 없이 F1-Q-001(가격 조회)·F1-Q-002(폴백)·F1-RH-001(Route Handler) 로직을 결정론적으로 검증할 수 있게 한다. 정상 응답, Rate Limit, 타임아웃, 5xx 에러 등 장애 시나리오를 트리거 가능해야 하며, Strategy Pattern(REQ-NF-024) 검증의 첫 번째 사례가 된다.
- Epic / Phase: E-MOCK / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 외부 API 명세: [`/05_SRS_v1.md#6.1.1 외부 API`](../05_SRS_v1.md) — EXT-API-01 (쿠팡 파트너스)
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1 External Systems`](../05_SRS_v1.md) — EXT-SYS-01
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — EXT-SYS-01 폴백
- SRS 확장성 요구사항: [`/05_SRS_v1.md#4.2.6 Scalability / Maintainability`](../05_SRS_v1.md) — REQ-NF-024 (Strategy Pattern)
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-1 (무단 크롤링 금지)
- 선행 태스크: **API-006** (쿠팡 응답 타입 + ChannelAdapter 인터페이스)
- 후행 태스크: F1-Q-001 (실 CoupangAdapter), F1-Q-002 (장애 폴백), F1-RH-001 (Route Handler), TEST-F1-004, NFR-ARCH-001
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.3 Mock 데이터·Stub 서비스 태스크`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **FakeCoupangAdapter 클래스 구현** — `src/lib/adapters/__fakes__/fake-coupang-adapter.ts`
  - `class FakeCoupangAdapter implements ChannelAdapter` (API-006 인터페이스 구현)
  - `channelId = 'coupang-fake'`, `channelName = '쿠팡(Fake)'`
- [ ] **시드 제품 데이터 작성** — `src/lib/adapters/__fakes__/data/coupang-products.json`
  - 비타민D 5건, 오메가-3 5건, 마그네슘 3건 등 13개 키워드 × 3~10건의 가짜 제품
  - 각 제품에 `productId`, `productName`, `productPrice`, `productImage`, `productUrl`, `isRocket`, `isFreeShipping` 필드 (CoupangProductResponse 정합)
- [ ] **searchProducts 메서드 구현** — `keyword`로 시드 데이터 필터링
  - `ChannelProduct[]`로 정규화 변환 (raw_data에 원시 응답 보존)
  - `options.limit`, `options.sort_by` 처리
- [ ] **getAffiliateUrl 메서드 구현** — productId → 가짜 제휴 단축 URL
  - 패턴: `https://link.coupang.com/a/fake_${productId}`
  - 실제 외부 호출 없음
- [ ] **getShippingFee 메서드 구현** — 시드 데이터 기준 배송비 반환
  - 로켓배송: 0원, 무료배송: 0원, 일반: 2,500원
- [ ] **isAvailable 메서드 구현** — 시나리오 트리거 환경변수에 따라 분기
  - `FAKE_COUPANG_SCENARIO=available|unavailable|rate_limit|timeout|5xx`
- [ ] **장애 시나리오 트리거** — 환경변수 또는 메서드 인자
  - `rate_limit`: `ChannelApiError` throw with `isRateLimit: true, httpStatus: 429, retryAfter: 60`
  - `timeout`: 5초 후 `ChannelApiError` throw with `isTimeout: true`
  - `5xx`: `ChannelApiError` throw with `httpStatus: 503`
  - `unavailable`: `isAvailable()` → `false`
- [ ] **응답 지연 시뮬레이션** — `FAKE_COUPANG_LATENCY_MS=200` (기본 200ms)
  - 실제 쿠팡 API 평균 응답 시간 모사
- [ ] **레지스트리 등록** — `src/lib/adapters/index.ts`의 `getAdapter()`가 `MOCK_MODE=true` 시 FakeCoupangAdapter 반환
- [ ] **Fake Adapter 사용 가이드 문서화** — `src/lib/adapters/__fakes__/README.md`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: ChannelAdapter 인터페이스 100% 구현**
- **Given**: API-006의 `ChannelAdapter` 인터페이스가 정의됨
- **When**: `FakeCoupangAdapter` 클래스를 컴파일함
- **Then**: TypeScript 컴파일러가 모든 필수 메서드(`searchProducts`, `getAffiliateUrl`, `getShippingFee`, `isAvailable`) 구현을 검증하며, 컴파일 에러 0건이다.

**Scenario 2: 정상 검색 — 비타민D**
- **Given**: 시드에 비타민D 5건이 있음, `FAKE_COUPANG_SCENARIO=available`
- **When**: `await adapter.searchProducts('비타민D')`을 호출함
- **Then**: 5건의 `ChannelProduct[]`이 반환되며, `channel_id: 'coupang-fake'`, `raw_data`에 원시 응답이 보존된다.

**Scenario 3: Rate Limit 장애 시뮬레이션 (REQ-FUNC-001 폴백)**
- **Given**: `FAKE_COUPANG_SCENARIO=rate_limit`
- **When**: `searchProducts`를 호출함
- **Then**: `ChannelApiError`가 throw되며 `isRateLimit: true`, `httpStatus: 429`, `retryAfter: 60`이 포함된다. F1-Q-002의 폴백 분기가 동작한다.

**Scenario 4: Timeout 장애 시뮬레이션**
- **Given**: `FAKE_COUPANG_SCENARIO=timeout`
- **When**: `searchProducts`를 호출함
- **Then**: ~5초 후 `ChannelApiError`가 throw되며 `isTimeout: true`. 캐시 폴백 분기 검증 가능.

**Scenario 5: 외부 호출 0건 보장**
- **Given**: FakeCoupangAdapter가 활성화된 테스트 환경
- **When**: 모든 메서드를 임의로 호출함
- **Then**: 네트워크 모니터링상 외부 도메인(`*.coupang.com`)에 대한 호출이 0건이다.

## :gear: Technical & Non-Functional Constraints
- **인터페이스 100% 구현 (REQ-NF-024)**: API-006의 `ChannelAdapter`를 누락 없이 구현. Strategy Pattern 검증의 첫 사례.
- **무단 크롤링 금지 (CON-1)**: 시드 데이터는 가공된 가짜 데이터. 실제 쿠팡 페이지 크롤링·HTML 파싱 코드 일절 금지.
- **결정론성**: 동일 환경변수 + 동일 입력 = 동일 출력. Math.random() 등 비결정적 요소 금지.
- **운영 환경 분리 (CON-9)**: `MOCK_MODE=true` 또는 `NODE_ENV !== 'production'`에서만 레지스트리에 등록. 프로덕션 빌드 시 제거.
- **에러 타입 일관성**: 모든 장애 시뮬레이션은 API-006의 `ChannelApiError`를 사용 (커스텀 에러 클래스 신규 도입 금지).
- **응답 시간**: 기본 지연 200ms (실제 쿠팡 API 평균 모사). 환경변수로 조정 가능.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `FakeCoupangAdapter`가 `ChannelAdapter` 인터페이스를 100% 구현하고 `pnpm typecheck`가 통과하는가?
- [ ] 시드 데이터(`coupang-products.json`)가 13개+ 키워드, 3~10건/키워드로 작성되었는가?
- [ ] 5종 시나리오(`available`, `unavailable`, `rate_limit`, `timeout`, `5xx`)가 환경변수로 트리거되는가?
- [ ] 레지스트리(`getAdapter('coupang')`)가 `MOCK_MODE`에 따라 Fake/실 어댑터를 분기 반환하는가?
- [ ] `pnpm lint` 경고 0건?
- [ ] Unit 테스트(시나리오별 응답 및 에러 검증)가 작성되고 통과하는가?
- [ ] `src/lib/adapters/__fakes__/README.md` 사용 가이드가 작성되었는가?
- [ ] 프로덕션 빌드에서 Fake Adapter 코드가 번들에 포함되지 않음을 확인했는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-006 (쿠팡 응답 타입 + ChannelAdapter 인터페이스)
- **Blocks**:
  - #F1-Q-001 (실 CoupangAdapter — 동일 인터페이스 구현 검증 기준)
  - #F1-Q-002 (장애 시 캐시 폴백 — Fake Adapter로 장애 시뮬레이션)
  - #F1-RH-001 (Super-Calc Route Handler 통합 테스트)
  - #MOCK-001 (Super-Calc Mock 엔드포인트 — Fake Adapter 응답을 기반으로 시드 구성)
  - #TEST-F1-004 (쿠팡 장애 폴백 통합 테스트)
  - #NFR-ARCH-001 (Strategy Pattern 어댑터 레이어 구현 — Fake로 OCP 검증)

## :bookmark_tabs: Notes
- Fake Adapter는 실 어댑터(F1-Q-001)의 회귀 테스트 기준선이다: 동일 인터페이스를 구현하므로 실 어댑터로 교체 시에도 호출 측 코드 변경이 0건이어야 한다 (REQ-NF-024 검증).
- 장애 시뮬레이션은 환경변수로 트리거하되, 테스트 코드에서는 인스턴스 생성 시 옵션 객체로도 주입 가능하게 설계 (`new FakeCoupangAdapter({ scenario: 'rate_limit' })`).
- 시드 제품의 가격 분포는 1일 단가 비교 결과에 차별성을 두어, 정렬 로직(F1-C-003) 검증이 의미 있게 동작하도록 설계한다 (예: 동일 키워드 내 1일 단가 100원 ~ 1,500원 범위).
- 본 태스크는 SRS REQ-NF-024 "신규 채널 추가 시 어댑터 모듈만 추가" 원칙의 첫 번째 검증 케이스이다.
