---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-Q-001: 쿠팡 파트너스 API 단일 채널 가격 조회 로직 구현 (CoupangAdapter)"
labels: 'feature, backend, epic:E-F1, priority:high, phase:2, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-Q-001] 쿠팡 파트너스 단일 채널 가격 조회 Query 로직
- 목적: 사용자가 입력한 성분명/복용량 키워드를 기반으로 쿠팡 파트너스 API를 단일 조회하고, API-006에서 정의한 `ChannelAdapter` 계약을 통해 정규화된 비교 후보 목록을 반환한다. F1 Super-Calc 파이프라인의 첫 단계로서 외부 조회를 읽기 전용 Query 책임으로 격리한다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001, REQ-FUNC-009
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- SRS 외부 API 명세: [`/05_SRS_v1.md#6.1 API Endpoint List`](../05_SRS_v1.md) — EXT-API-01 (`https://api.coupang.com/v2/products`)
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1 External Systems`](../05_SRS_v1.md) — EXT-SYS-01 (Rate Limit 일 10,000건 추정)
- 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-1 (공식 Affiliate API만 사용)
- 관련 선행 명세: [`/TASKS/API-006_coupang_adapter_interface.md`](./API-006_coupang_adapter_interface.md), [`/TASKS/MOCK-005_coupang_fake_adapter.md`](./MOCK-005_coupang_fake_adapter.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/lib/compare/queries/fetch-coupang-prices.ts`에 F1 Query 진입 함수 정의
  - 입력: `ingredient`, `dosage?`, `limit?`
  - 출력: 정규화된 비교 후보 배열 (`ChannelProduct[]` 또는 F1 전용 Query DTO)
- [ ] 검색 키워드 조합 규칙 구현
  - 기본 규칙: `ingredient + dosage`를 공백 기준 결합
  - 입력 정규화: trim, 다중 공백 축소, limit 기본값 20
- [ ] `CoupangAdapter` 실제 구현 연결
  - `searchProducts(keyword, options)` 호출
  - 필요 시 `getAffiliateUrl(productId)` 및 `getShippingFee(productId)` 후처리 수행
- [ ] 외부 원시 응답 → 내부 비교 후보 정규화 매퍼 작성
  - 필수 필드: `external_product_id`, `product_name`, `price_krw`, `shipping_fee`, `affiliate_url`, `channel_id`
  - 원시 응답은 `raw_data`로 보존하되 API 응답에는 직접 노출 금지
- [ ] 결과 정제 규칙 구현
  - 가격 없는 항목 제거
  - 동일 `external_product_id` 중복 제거
  - `price_krw <= 0` 또는 빈 딥링크 항목 제외
- [ ] 장애 분류 및 도메인 에러 매핑
  - Timeout / 5xx / 429 → `ChannelApiError` 유지
  - 잘못된 파라미터 → validation 에러로 즉시 반환
- [ ] Query 전용 로깅 필드 정의
  - `ingredient`, `dosage`, `requested_limit`, `returned_count`, `channel_id=coupang`, `duration_ms`
- [ ] 단위 테스트 작성
  - 정상 응답
  - 빈 결과
  - 중복 제거
  - Timeout / Rate Limit 에러 매핑

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 정상적인 쿠팡 단일 조회
- Given: `ingredient=비타민D`, `dosage=1000IU` 요청과 동작하는 `CoupangAdapter`가 준비되어 있다.
- When: Query 함수를 호출한다.
- Then: 쿠팡 API가 1회 호출되고, 가격/배송비/딥링크가 포함된 정규화 결과 배열이 반환된다.

Scenario 2: 중복 상품 제거
- Given: 쿠팡 응답에 동일 `external_product_id`를 가진 상품이 2건 이상 포함되어 있다.
- When: Query 정규화가 수행된다.
- Then: 동일 상품은 1건으로 병합되며, 최종 결과에서 중복이 제거된다.

Scenario 3: 빈 결과 처리
- Given: 쿠팡 API가 유효한 200 응답이지만 매칭 상품 0건을 반환한다.
- When: Query 함수를 호출한다.
- Then: 예외가 아니라 빈 배열이 반환되며, 상위 Route Handler가 미등록/빈 결과 분기를 수행할 수 있다.

Scenario 4: 외부 API 장애 분류
- Given: 쿠팡 API가 Timeout 또는 HTTP 503을 반환한다.
- When: Query 함수를 호출한다.
- Then: `ChannelApiError`가 `isTimeout` 또는 `httpStatus=503` 정보를 유지한 채 상위 계층으로 전달되어 F1-Q-002 폴백 판단에 사용된다.

Scenario 5: 제휴 딥링크 보장
- Given: 쿠팡 검색 결과 원시 데이터가 반환되었다.
- When: 내부 비교 후보로 정규화한다.
- Then: 최종 결과의 각 항목에는 사용자 구매 이동에 사용할 제휴 딥링크가 포함된다.

## :gear: Technical & Non-Functional Constraints
- 공식 쿠팡 파트너스 API만 사용한다. HTML 스크래핑, 비공식 엔드포인트, 브라우저 자동화 수집 금지.
- 본 태스크는 Query 책임만 가진다. DB Write, 1일 단가 계산, 정렬, 캐시 폴백은 포함하지 않는다.
- 외부 조회 1회당 타임아웃 예산은 F1 전체 p95 3,500ms를 고려해 1,500ms 내외로 제한한다. 재시도는 최대 1회까지만 허용한다.
- 금액 계산은 `number` 임시 표현을 쓰더라도 후속 Command 레이어에서 `Decimal` 기반 계산으로 승격 가능해야 한다. 반올림/최종가 계산 로직을 이 태스크에 넣지 않는다.
- 응답 정규화는 결정론적이어야 한다. 동일 Mock 입력에 동일 출력이 나와야 하며 랜덤 정렬 금지.
- 로그에는 검색 키워드와 건수만 남기고, 제휴 키/시크릿 등 민감 정보는 절대 기록하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] `CoupangAdapter` 실구현이 `ChannelAdapter` 인터페이스와 정합하는가?
- [ ] Query 함수가 읽기 전용이며 DB 접근/Write를 수행하지 않는가?
- [ ] 중복 제거, 빈 결과, Timeout/5xx/429 분기 단위 테스트가 작성되고 통과하는가?
- [ ] 로그/에러 객체에 운영에 필요한 메타데이터(`duration_ms`, `channel_id`)가 포함되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #API-006, #MOCK-005
- Blocks: #F1-Q-002, #F1-RH-001, #CRON-001
