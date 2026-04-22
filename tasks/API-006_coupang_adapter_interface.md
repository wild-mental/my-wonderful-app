---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-006: 쿠팡 파트너스 외부 API 응답 타입 정의 및 ChannelAdapter 인터페이스 설계 (Strategy Pattern)"
labels: 'feature, api, epic:E-API, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [API-006] 쿠팡 파트너스 응답 타입 + ChannelAdapter Strategy Pattern 인터페이스 설계
- 목적: 쿠팡 파트너스 외부 API의 응답 데이터를 TypeScript 타입으로 정의하고, 신규 채널(예: 아마존) 추가 시 기존 코드 변경 없이 어댑터 모듈만 추가하면 되는 Strategy Pattern 기반의 `ChannelAdapter` 인터페이스를 설계한다. 이는 SRS REQ-NF-024 확장성 요구사항의 핵심 계약 정의이다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 외부 API 명세: [`/05_SRS_v1.md#6.1.1 외부 API`](../05_SRS_v1.md) — EXT-API-01 (쿠팡 파트너스 API)
- SRS 확장성 요구사항: [`/05_SRS_v1.md#4.2.6 Scalability / Maintainability`](../05_SRS_v1.md) — REQ-NF-024 (ChannelAdapter Strategy Pattern)
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1 External Systems`](../05_SRS_v1.md) — EXT-SYS-01 (쿠팡 파트너스)
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — EXT-SYS-01 폴백
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-1 (무단 크롤링 배제, 공식 API만 사용)
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — `src/lib/adapters/` 디렉토리
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩)
- 후행 태스크: MOCK-005 (쿠팡 Fake Adapter), F1-Q-001 (쿠팡 가격 조회 로직), NFR-ARCH-001 (Strategy Pattern 구현)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **쿠팡 파트너스 API 원시 응답 타입 정의** — `src/types/external/coupang.ts`에 외부 API 응답 원시 타입
  - `CoupangProductResponse`: 제품 검색 결과 원시 응답
    - `productId: string`
    - `productName: string`
    - `productPrice: number` (KRW)
    - `productImage: string`
    - `productUrl: string` (일반 URL)
    - `isRocket: boolean` (로켓배송 여부)
    - `isFreeShipping: boolean` (무료배송 여부)
    - `categoryName: string`
  - `CoupangDeepLinkResponse`: 제휴 딥링크 생성 응답
    - `shortenUrl: string` (제휴 단축 URL)
- [ ] **ChannelAdapter 추상 인터페이스 정의** — `src/lib/adapters/channel-adapter.ts`
  - `interface ChannelAdapter`
    - `readonly channelId: string` (채널 식별자, 예: 'coupang')
    - `readonly channelName: string` (채널 표시명, 예: '쿠팡')
    - `searchProducts(keyword: string, options?: SearchOptions): Promise<ChannelProduct[]>`
    - `getAffiliateUrl(productId: string): Promise<string>`
    - `getShippingFee(productId: string): Promise<number>`
    - `isAvailable(): Promise<boolean>` (채널 가용 상태 확인)
- [ ] **ChannelProduct 공통 타입 정의** — 채널 독립적인 정규화된 제품 타입
  - `channel_id: string`
  - `external_product_id: string` (채널별 고유 ID)
  - `product_name: string`
  - `price_krw: number`
  - `shipping_fee: number`
  - `affiliate_url: string`
  - `image_url: string`
  - `is_free_shipping: boolean`
  - `raw_data: unknown` (원시 응답 보존, 디버깅용)
- [ ] **SearchOptions 공통 타입 정의**
  - `limit?: number` (검색 결과 상한)
  - `category?: string` (카테고리 필터)
  - `sort_by?: 'price' | 'relevance'` (정렬 기준)
- [ ] **CoupangAdapter 클래스 인터페이스 선언** — `src/lib/adapters/coupang-adapter.ts` 스켈레톤
  - `class CoupangAdapter implements ChannelAdapter` (구현부는 F1-Q-001에서 작성)
  - 클래스 수준 JSDoc에 CON-1(무단 크롤링 금지), Rate Limit(일 10,000건) 주의사항 명시
- [ ] **채널 어댑터 레지스트리 인터페이스** — `src/lib/adapters/index.ts`
  - `type ChannelAdapterRegistry = Map<string, ChannelAdapter>`
  - `getAdapter(channelId: string): ChannelAdapter`
  - `listAvailableChannels(): string[]`
- [ ] **에러 타입 정의** — 외부 API 에러 전용
  - `ChannelApiError` 클래스 (extends Error)
    - `channelId: string`
    - `httpStatus?: number`
    - `isRateLimit: boolean`
    - `isTimeout: boolean`
    - `retryAfter?: number` (Rate Limit 시 대기 시간)
- [ ] **환경변수 타입 선언** — 쿠팡 파트너스 API 인증 키 환경변수
  - `COUPANG_ACCESS_KEY: string`
  - `COUPANG_SECRET_KEY: string`
  - `COUPANG_PARTNER_ID: string`
  - `.env.example`에 플레이스홀더 추가 (실키 노출 금지)
- [ ] **JSDoc 주석 + 사용 가이드** — 신규 채널 추가 시 "이 파일만 추가하면 됩니다" 가이드를 인터페이스 파일 상단에 명시

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: CoupangAdapter가 ChannelAdapter 인터페이스를 구현**
- **Given**: `ChannelAdapter` 인터페이스가 정의된 상태
- **When**: `CoupangAdapter implements ChannelAdapter` 클래스 스켈레톤을 작성한다
- **Then**: TypeScript 컴파일러가 모든 필수 메서드 구현을 요구하며, 미구현 시 컴파일 에러가 발생한다.

**Scenario 2: 채널 독립적 정규화 타입 검증**
- **Given**: 쿠팡 API 원시 응답(`CoupangProductResponse`)이 주어진 상태
- **When**: `ChannelProduct` 타입으로 변환하는 로직을 작성한다
- **Then**: 채널 이름, 가격 단위 등이 정규화되어 내부 시스템에서 채널 무관하게 처리 가능한 타입이 된다.

**Scenario 3: 신규 채널 추가 시 수정 파일 범위 (REQ-NF-024)**
- **Given**: 향후 아마존 채널을 추가하는 상황
- **When**: `AmazonAdapter implements ChannelAdapter` 파일을 `src/lib/adapters/` 디렉토리에 생성한다
- **Then**: 기존 코드(`coupang-adapter.ts`, `channel-adapter.ts`)의 **수정이 0건**이고, 레지스트리에 등록만 추가하면 된다.

**Scenario 4: ChannelApiError가 장애 유형을 구분**
- **Given**: 쿠팡 API가 429 Rate Limit 응답을 반환한 상황
- **When**: `ChannelApiError` 객체를 구성한다
- **Then**: `isRateLimit: true`, `httpStatus: 429`, `retryAfter` 값이 포함되어 폴백 로직(F1-Q-002)에서 장애 유형별 분기 처리가 가능하다.

**Scenario 5: 타입 안전성 보장**
- **Given**: 모든 어댑터 관련 타입이 정의된 상태
- **When**: `pnpm typecheck`를 실행한다
- **Then**: 어댑터 관련 파일에 TypeScript 에러가 0건이다.

## :gear: Technical & Non-Functional Constraints
- **Strategy Pattern (REQ-NF-024)**: 신규 채널 추가 시 기존 코드 변경 없이 `src/lib/adapters/` 디렉토리에 어댑터 모듈 1개 추가로 한정. **개방-폐쇄 원칙(OCP)** 준수.
- **무단 크롤링 금지 (CON-1)**: 쿠팡 파트너스 공식 Affiliate API만 사용. 웹 크롤링, 스크래핑 코드 일절 금지.
- **Rate Limit**: 쿠팡 파트너스 API 일 10,000건 추정. `ChannelApiError.isRateLimit`으로 Rate Limit 감지 후, Cron 배치(CRON-001)에서 적절히 분산 호출.
- **디렉토리 구조 (§3.6)**: `src/lib/adapters/`는 DATA-001에서 이미 생성된 디렉토리. 본 태스크는 인터페이스 정의만 포함.
- **구현 금지**: 본 태스크는 **타입/인터페이스 정의만** 수행. 실제 API 호출 로직은 F1-Q-001에서, Fake Adapter는 MOCK-005에서 구현.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `ChannelAdapter` 인터페이스가 `src/lib/adapters/channel-adapter.ts`에 정의되었는가?
- [ ] 쿠팡 원시 응답 타입이 `src/types/external/coupang.ts`에 정의되었는가?
- [ ] `ChannelProduct`, `SearchOptions` 공통 타입이 정의되었는가?
- [ ] `CoupangAdapter` 스켈레톤 클래스가 인터페이스를 구현(미완성)하며 컴파일 통과하는가?
- [ ] `ChannelApiError` 에러 클래스가 정의되었는가?
- [ ] `.env.example`에 쿠팡 API 키 플레이스홀더가 추가되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] 신규 채널 추가 가이드가 JSDoc으로 문서화되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩, `src/lib/adapters/` 디렉토리)
- **Blocks**:
  - #MOCK-005 (쿠팡 파트너스 Fake Adapter — ChannelAdapter 인터페이스 구현)
  - #F1-Q-001 (쿠팡 API 가격 조회 — CoupangAdapter 구현)
  - #F1-Q-002 (쿠팡 장애 시 캐시 폴백 — ChannelApiError 활용)
  - #NFR-ARCH-001 (Strategy Pattern 기반 채널 어댑터 레이어 완성)
  - #API-001 (Super-Calc DTO — ChannelProduct 타입 참조)

## :bookmark_tabs: Notes
- 본 태스크는 SRS REQ-NF-024의 핵심 아키텍처 계약을 정의하는 태스크이다. "채널 추가 시 어댑터 모듈 1개 추가로 한정"이라는 요구사항을 타입 시스템 수준에서 강제한다.
- `raw_data: unknown` 필드는 디버깅 및 문제 추적용이며, API 응답에는 포함하지 않는다. 내부 로깅/모니터링에서만 사용.
- MVP에서는 쿠팡 파트너스 단일 채널만 실구현하되, 인터페이스는 Multi-Channel 대비 설계한다 (Phase 2 OS-8 대응).
