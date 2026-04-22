---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F1-001: [Unit Test] 1일 단가 정규화 산출 정확도 테스트 (공식: `가격 ÷ 복용횟수`, 소수점 첫째 자리 반올림 검증)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F1-001] 1일 단가 정규화 정확도 단위 테스트
- 목적: REQ-FUNC-002의 핵심 공식 `제품 가격 ÷ 총 복용 횟수`가 구현 코드에서 정확히 지켜지는지 자동화된 단위 테스트로 검증한다. 반올림 규칙과 잘못된 입력 차단을 함께 검증해 F1 계산 SSOT를 보호한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-002
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-002
- 관련 구현 태스크: [`/TASKS/F1-C-001_daily_cost_normalization.md`](./F1-C-001_daily_cost_normalization.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#51-f1-super-calc-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `normalizeDailyCost()` 단위 테스트 파일 작성
- [ ] 정상 계산 케이스 작성
- [ ] 소수점 첫째 자리 반올림 케이스 작성
- [ ] 분모 0/음수 차단 케이스 작성
- [ ] 음수 가격 차단 케이스 작성
- [ ] 큰 금액/큰 복용횟수 정밀도 케이스 작성
- [ ] 테스트 명과 기대값을 공식과 직접 매핑

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 기본 공식 정확도
- Given: `price_krw=30000`, `servings_per_container=60` 입력이 있다.
- When: 정규화 함수를 실행한다.
- Then: `daily_cost_krw=500.0`이 반환된다.

Scenario 2: 반올림 규칙 검증
- Given: 소수점이 발생하는 입력이 있다.
- When: 정규화 함수를 실행한다.
- Then: 결과는 소수점 첫째 자리 기준으로 반올림된다.

Scenario 3: 잘못된 분모 차단
- Given: `servings_per_container=0` 또는 음수 입력이 있다.
- When: 정규화 함수를 실행한다.
- Then: 유효성 오류가 발생한다.

Scenario 4: 잘못된 가격 차단
- Given: `price_krw<0` 입력이 있다.
- When: 정규화 함수를 실행한다.
- Then: 유효성 오류가 발생한다.

Scenario 5: 반복 실행 안정성
- Given: 동일 입력을 10회 반복 실행한다.
- When: 테스트를 수행한다.
- Then: 10회 모두 동일한 결과가 반환된다.

## :gear: Technical & Non-Functional Constraints
- 테스트는 외부 API, DB, 네트워크에 의존하면 안 된다.
- 공식 문자열과 기대값이 요구사항과 직접 대응되도록 케이스명을 작성한다.
- 부동소수점 오차를 피하기 위해 Decimal 기반 결과 비교 또는 명시적 rounding helper를 사용한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 정상/경계/예외 케이스가 모두 포함되는가?
- [ ] 테스트가 F1-C-001의 순수 함수만 직접 검증하는가?
- [ ] `pnpm test TEST-F1-001` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F1-C-001
- Blocks: None
