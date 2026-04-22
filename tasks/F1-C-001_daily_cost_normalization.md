---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-C-001: 1일 단가 정규화 산출 엔진 구현 (`제품 가격 ÷ 총 복용 횟수`, 소수점 첫째 자리)"
labels: 'feature, backend, epic:E-F1, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-C-001] 1일 단가 정규화 산출 엔진
- 목적: 쿠팡에서 조회한 제품 가격과 총 복용 횟수를 이용해 SRS가 정의한 공식 `제품 가격 ÷ 총 복용 횟수` 기준의 1일 단가를 계산한다. 계산 책임을 순수 Command 로직으로 분리하여 정렬, 응답 조립, 테스트 자동화의 SSOT로 사용한다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-002
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md) — `1일 복용량 기준 원화 단가 정규화`
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.3 PRICE_SNAPSHOT`](../05_SRS_v1.md)
- 관련 선행 명세: [`/TASKS/API-001_super_calc_dto.md`](./API-001_super_calc_dto.md), [`/TASKS/DATA-004_price_snapshot_schema.md`](./DATA-004_price_snapshot_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/lib/compare/commands/normalize-daily-cost.ts`에 순수 함수 정의
  - 입력: `price_krw`, `servings_per_container`
  - 출력: `daily_cost_krw`
- [ ] 총 복용 횟수 산출 규칙 명시
  - 기본 입력이 이미 `servings_per_container`로 들어오면 그대로 사용
  - 원시 메타데이터가 `units_per_package`, `servings_per_day` 형태라면 상위 계층에서 변환 후 주입
- [ ] 반올림 규칙 구현
  - 내부 계산은 `Decimal`
  - 최종 반환은 소수점 첫째 자리 반올림
- [ ] 분모 검증 로직 구현
  - `servings_per_container < 1` 차단
  - NaN/Infinity 차단
- [ ] 에러 타입 정의
  - `INVALID_SERVINGS_PER_CONTAINER`
  - `INVALID_PRICE_VALUE`
- [ ] DATA-004와 계산 의미 정합성 검토
  - REQ-FUNC-002의 정식 랭킹 공식은 `price_krw / servings_per_container`
  - `final_price_krw`는 F1-C-002의 별도 표시 컬럼으로 유지
- [ ] 단위 테스트 작성
  - 정수 가격
  - 소수점 반올림
  - 분모 0/음수 차단
  - 큰 금액 정밀도 유지

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 기본 1일 단가 계산
- Given: `price_krw=30000`, `servings_per_container=60` 입력이 주어진다.
- When: 정규화 엔진을 실행한다.
- Then: `daily_cost_krw=500.0`이 반환된다.

Scenario 2: 소수점 첫째 자리 반올림
- Given: `price_krw=19990`, `servings_per_container=37` 입력이 주어진다.
- When: 정규화 엔진을 실행한다.
- Then: 계산 결과는 소수점 첫째 자리로 반올림된 값으로 반환된다.

Scenario 3: 분모 0 차단
- Given: `servings_per_container=0` 입력이 주어진다.
- When: 정규화 엔진을 실행한다.
- Then: 계산은 실패하고 `INVALID_SERVINGS_PER_CONTAINER` 에러가 발생한다.

Scenario 4: 음수 가격 차단
- Given: `price_krw=-1000` 입력이 주어진다.
- When: 정규화 엔진을 실행한다.
- Then: 계산은 실패하고 `INVALID_PRICE_VALUE` 에러가 발생한다.

Scenario 5: 순수 함수 보장
- Given: 동일 입력이 10회 반복 호출된다.
- When: 정규화 엔진을 실행한다.
- Then: 부수효과 없이 동일한 결과가 10회 모두 반환된다.

## :gear: Technical & Non-Functional Constraints
- REQ-FUNC-002의 공식 `제품 가격 ÷ 총 복용 횟수`를 랭킹용 단가 계산의 원천 규칙으로 사용한다.
- 금액 계산은 `Float` 기반 누적 오차를 피하기 위해 `Decimal` 또는 이에 준하는 정밀 계산 유틸을 사용한다.
- 본 태스크는 가격 조회, 배송비 포함 최종가 계산, 정렬, DB 저장을 수행하지 않는다.
- 반환값은 숫자 1개 또는 명시적 실패만 가져야 한다. 부가 메타데이터는 상위 계층에서 조립한다.
- 계산 함수는 서버/테스트 어디서든 재사용 가능해야 하므로 I/O 의존성, 환경변수 의존성, DB 의존성 금지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 계산 함수가 순수 함수로 분리되는가?
- [ ] `price_krw`와 `servings_per_container` 유효성 검사가 포함되는가?
- [ ] 소수점 첫째 자리 반올림 테스트가 포함되는가?
- [ ] REQ-FUNC-002 기준과 DATA-004 스키마 간 의미 충돌이 주석/JSDoc로 정리되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #API-001, #DATA-004
- Blocks: #F1-C-002, #F1-C-003, #F1-C-004, #F1-RH-001, #TEST-F1-001
