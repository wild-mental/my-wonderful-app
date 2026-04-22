---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F1-002: [Unit Test] 실지불가(최종가) 산출 오차율 ≤ 3% 검증 테스트 (배송비·관세·할인 포함)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F1-002] 최종가 산출 정확도 단위 테스트
- 목적: REQ-FUNC-004의 실지불가 계산이 배송비, 할인, 관세 입력을 정확히 반영하는지 검증하고, 샘플 계산 대비 오차율이 3% 이하인지 자동화한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-004
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-004
- 관련 구현 태스크: [`/TASKS/F1-C-002_final_price_calculation.md`](./F1-C-002_final_price_calculation.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#51-f1-super-calc-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `calculateFinalPrice()` 단위 테스트 파일 작성
- [ ] 무료배송 케이스 작성
- [ ] 유료배송 케이스 작성
- [ ] 할인 적용 케이스 작성
- [ ] 과다 할인 차단 케이스 작성
- [ ] 수기 계산표 기반 오차율 비교 케이스 작성

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 무료배송 계산
- Given: `price=30000`, `shipping=0`, `discount=3000`, `customs=0` 입력이 있다.
- When: 최종가 계산을 수행한다.
- Then: `final_price_krw=27000`이 반환된다.

Scenario 2: 유료배송 계산
- Given: `price=25000`, `shipping=3000`, `discount=0`, `customs=0` 입력이 있다.
- When: 최종가 계산을 수행한다.
- Then: `final_price_krw=28000`이 반환된다.

Scenario 3: 과다 할인 차단
- Given: 할인금액이 소계보다 큰 입력이 있다.
- When: 최종가 계산을 수행한다.
- Then: 유효성 오류가 발생한다.

Scenario 4: 샘플 데이터셋 오차율 검증
- Given: 수기 계산된 샘플 데이터셋이 있다.
- When: 계산 결과와 비교한다.
- Then: 모든 케이스의 오차율이 3% 이하이다.

Scenario 5: 음수 결과 방지
- Given: 계산 결과가 음수가 되는 비정상 입력이 있다.
- When: 최종가 계산을 수행한다.
- Then: 명시적 오류가 발생한다.

## :gear: Technical & Non-Functional Constraints
- 테스트는 입력 조합과 기대값이 명확한 결정론적 케이스를 사용한다.
- 오차율 계산 공식을 테스트에 명시한다.
- 외부 API나 DB 없이 순수 계산 함수만 검증한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 배송비/할인/관세 조합 케이스가 포함되는가?
- [ ] 오차율 ≤ 3% 검증이 자동화되는가?
- [ ] `pnpm test TEST-F1-002` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F1-C-002
- Blocks: None
