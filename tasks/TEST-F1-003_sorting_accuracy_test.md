---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F1-003: [Unit Test] 오름차순 정렬 정확성 테스트 (1일 단가 기준 최저가 상위)"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F1-003] 1일 단가 정렬 정확성 단위 테스트
- 목적: REQ-FUNC-005의 결과 정렬 규칙이 `daily_cost_krw` 오름차순을 기준으로 정확히 동작하는지 검증한다. 동점자 tie-breaker와 입력 불변성도 함께 검증한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-005
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-005
- 관련 구현 태스크: [`/TASKS/F1-C-003_daily_cost_sorting.md`](./F1-C-003_daily_cost_sorting.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#51-f1-super-calc-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 정렬 함수 단위 테스트 파일 작성
- [ ] 기본 오름차순 케이스 작성
- [ ] 동점자 tie-breaker 케이스 작성
- [ ] 원본 배열 불변성 케이스 작성
- [ ] NaN/누락 데이터 차단 케이스 작성

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 기본 오름차순 정렬
- Given: 단가 값이 서로 다른 결과 3건이 있다.
- When: 정렬 함수를 실행한다.
- Then: 가장 낮은 `daily_cost_krw`가 첫 번째로 온다.

Scenario 2: 동점자 tie-breaker
- Given: `daily_cost_krw`가 동일한 결과 2건이 있다.
- When: 정렬 함수를 실행한다.
- Then: `final_price_krw`가 더 낮은 항목이 먼저 온다.

Scenario 3: 입력 불변성
- Given: 정렬 전 원본 배열이 있다.
- When: 정렬 함수를 실행한다.
- Then: 원본 배열 순서는 변경되지 않는다.

Scenario 4: 잘못된 단가 데이터 차단
- Given: NaN 또는 누락된 `daily_cost_krw`가 포함된 배열이 있다.
- When: 정렬 함수를 실행한다.
- Then: 유효성 오류가 발생하거나 사전 검증에서 차단된다.

Scenario 5: 결정론적 결과
- Given: 동일 입력을 여러 번 실행한다.
- When: 정렬 테스트를 수행한다.
- Then: 항상 같은 순서가 반환된다.

## :gear: Technical & Non-Functional Constraints
- 정렬 테스트는 작은 고정 fixture만 사용한다.
- tie-breaker 규칙은 명시적 기대값으로 검증한다.
- 테스트는 DB 정렬이 아니라 애플리케이션 정렬 함수 자체를 검증한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 기본 정렬, tie-breaker, 불변성 케이스가 포함되는가?
- [ ] `pnpm test TEST-F1-003` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F1-C-003
- Blocks: None
