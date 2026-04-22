---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-C-002: 배송비·관세·할인코드 포함 실지불가(최종가) 산출 로직 구현 (오차율 ≤ 3%)"
labels: 'feature, backend, epic:E-F1, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-C-002] 실지불가(최종가) 산출 Command 로직
- 목적: 기본 상품 가격에 배송비, 할인금액, 필요 시 관세를 반영해 사용자가 실제로 결제하게 되는 `final_price_krw`를 계산한다. 1일 단가와 별도 컬럼으로 표시되는 최종가 기준을 표준화하여 REQ-FUNC-004의 오차율 3% 이내 요구를 충족한다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-004
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md) — `배송비 포함 최종가 산출`
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- 관련 선행 명세: [`/TASKS/F1-C-001_daily_cost_normalization.md`](./F1-C-001_daily_cost_normalization.md), [`/TASKS/DATA-004_price_snapshot_schema.md`](./DATA-004_price_snapshot_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/lib/compare/commands/calculate-final-price.ts`에 최종가 계산 함수 정의
  - 입력: `price_krw`, `shipping_fee`, `discount_krw`, `customs_krw?`
  - 출력: `final_price_krw`
- [ ] MVP 기본 규칙 고정
  - 국내 쿠팡 단일 채널 기준 `customs_krw` 기본값은 `0`
  - 할인 미적용 시 `discount_krw=0`
- [ ] 금액 계산식 구현
  - `final_price_krw = price_krw + shipping_fee + customs_krw - discount_krw`
  - 음수 최종가 방지
- [ ] 할인 적용 검증 구현
  - 할인금액은 subtotal(`price + shipping + customs`) 초과 금지
  - 음수 할인/배송비 입력 차단
- [ ] 정밀도 정책 구현
  - 내부 계산은 `Decimal`
  - 외부 반환은 KRW 정수 또는 소수점 2자리 이하로 유지
- [ ] 오차율 검증 테스트 케이스 작성
  - 수기 계산 대비 ±3% 이내 보장
  - 경계값: 무료배송, 할인 적용, 대형 금액
- [ ] 계산 에러 코드 정의
  - `INVALID_SHIPPING_FEE`
  - `INVALID_DISCOUNT_VALUE`
  - `FINAL_PRICE_NEGATIVE`

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 무료배송 제품 최종가 계산
- Given: `price_krw=30000`, `shipping_fee=0`, `discount_krw=3000`, `customs_krw=0` 입력이 주어진다.
- When: 최종가 계산을 수행한다.
- Then: `final_price_krw=27000`이 반환된다.

Scenario 2: 유료배송 제품 최종가 계산
- Given: `price_krw=25000`, `shipping_fee=3000`, `discount_krw=0`, `customs_krw=0` 입력이 주어진다.
- When: 최종가 계산을 수행한다.
- Then: `final_price_krw=28000`이 반환된다.

Scenario 3: 할인금액 과다 입력 차단
- Given: `price_krw=10000`, `shipping_fee=0`, `discount_krw=15000` 입력이 주어진다.
- When: 최종가 계산을 수행한다.
- Then: 계산은 실패하고 `INVALID_DISCOUNT_VALUE` 에러가 발생한다.

Scenario 4: 음수 결과 차단
- Given: 잘못된 입력으로 인해 계산 결과가 음수가 된다.
- When: 최종가 계산을 수행한다.
- Then: 계산은 실패하고 `FINAL_PRICE_NEGATIVE` 에러가 발생한다.

Scenario 5: 수기 계산 대비 오차율 검증
- Given: 배송비와 할인금액이 포함된 샘플 데이터셋이 준비되어 있다.
- When: 최종가 계산 결과를 수기 계산값과 비교한다.
- Then: 모든 케이스에서 오차율이 3% 이내다.

## :gear: Technical & Non-Functional Constraints
- REQ-FUNC-004 충족을 위해 배송비와 할인금액은 반드시 최종가 계산에 포함한다.
- MVP의 쿠팡 단일 채널에서는 관세를 기본 0원으로 처리하되, 함수 시그니처에는 확장 파라미터를 유지한다.
- 계산 로직은 F1-C-001과 분리한다. 1일 단가 공식 자체를 이 태스크에서 변경하지 않는다.
- 음수 금액, NaN, Infinity 입력은 모두 명시적 에러로 차단한다.
- 계산 로직은 순수 함수여야 하며, 외부 API/DB/환경변수에 의존하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 최종가 계산식이 코드와 테스트에서 동일하게 문서화되는가?
- [ ] 할인금액, 배송비, 관세 입력 유효성 검사가 구현되는가?
- [ ] 오차율 검증 테스트가 포함되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F1-C-001
- Blocks: #F1-RH-001, #TEST-F1-002
