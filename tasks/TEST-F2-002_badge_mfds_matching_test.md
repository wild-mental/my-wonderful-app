---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F2-002: [Unit Test] 뱃지-공전 원문 1:1 매칭 정확도 테스트 (불일치율 < 0.5%)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F2-002] 뱃지-공전 원문 매칭 정확도 테스트
- 목적: F2-C-001이 생성한 `badge_label`이 식약처 공전 원문과 정확히 1:1 대응하는지 검증한다. REQ-FUNC-011의 불일치율 0.5% 미만 목표를 golden dataset 기반 단위 테스트로 고정한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-011
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-011
- 관련 구현 태스크: [`/TASKS/F2-C-001_badge_decision_logic.md`](./F2-C-001_badge_decision_logic.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#52-f2-anti-bs-dashboard-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] MFDS 원문 golden dataset 구성
- [ ] `decideBadge()` 결과와 원문 비교 테스트 작성
- [ ] APPROVED/CAUTION/NOT_APPROVED 케이스 분리
- [ ] 공백/괄호/대소문자 차이도 불일치로 간주하는 비교 규칙 고정
- [ ] 불일치율 집계 리포트 출력

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: APPROVED 원문 매칭
- Given: REGISTERED 원료와 공전 원문 fixture가 있다.
- When: 뱃지 판정 결과를 생성한다.
- Then: `badge_label`은 원문과 정확히 일치한다.

Scenario 2: CAUTION 원문 매칭
- Given: 주의 대상 함량 조건의 원료 fixture가 있다.
- When: 판정 결과를 생성한다.
- Then: `badge_label`은 공전 원문 기준으로 매칭된다.

Scenario 3: NOT_APPROVED 원문 매칭
- Given: 기능성 미인정 시나리오 fixture가 있다.
- When: 판정 결과를 생성한다.
- Then: 결과 라벨은 정의된 비인정 원문과 일치한다.

Scenario 4: 공백/괄호 차이 검출
- Given: 일부 라벨이 공백이나 괄호가 변형된 상태다.
- When: 매칭 정확도 테스트를 수행한다.
- Then: 해당 항목은 불일치로 집계된다.

Scenario 5: 불일치율 기준 검증
- Given: 충분한 샘플 수의 golden dataset이 있다.
- When: 전체 테스트를 수행한다.
- Then: 불일치율은 0.5% 미만이어야 한다.

## :gear: Technical & Non-Functional Constraints
- 원문 비교는 느슨한 contains 검사가 아니라 exact match 기준으로 수행한다.
- golden dataset은 MFDS 원문 변경 시 명시적으로 갱신되어야 한다.
- 테스트 데이터는 운영 코드와 분리된 고정 fixture로 관리한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] exact match 기반 비교가 구현되는가?
- [ ] 불일치율 집계가 자동화되는가?
- [ ] `pnpm test TEST-F2-002` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-C-001
- Blocks: None
