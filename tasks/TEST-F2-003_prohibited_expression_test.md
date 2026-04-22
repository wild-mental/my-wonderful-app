---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F2-003: [Unit Test] 금지 표현(질병 예방·치료) 검출 0건 테스트 (QA 금지 표현 목록 기반)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F2-003] 금지 표현 검출 0건 테스트
- 목적: 뱃지 텍스트와 일상어 번역 결과에 건강기능식품법상 금지 표현이 포함되지 않음을 검증한다. REQ-FUNC-012와 CON-2의 법률 리스크를 테스트 게이트로 고정한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-2
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-012
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-012
- 관련 구현 태스크: [`/TASKS/F2-C-002_prohibited_expression_validator.md`](./F2-C-002_prohibited_expression_validator.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#52-f2-anti-bs-dashboard-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] QA 금지 표현 fixture 구성
- [ ] `validateProhibitedExpressions()` 단위 테스트 작성
- [ ] badge_label, common_name, tooltip 경로별 케이스 추가
- [ ] 허용 표현 예외 케이스 추가
- [ ] 회피 입력(공백, 변형) 케이스 추가

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 직접 금지 키워드 차단
- Given: `암 예방`, `치료`, `완치` 등 금지 표현 fixture가 있다.
- When: 검증 함수를 호출한다.
- Then: 모두 차단된다.

Scenario 2: 뱃지 텍스트 0건 검출
- Given: 실제 badge_label 샘플들이 있다.
- When: 전체 검증을 수행한다.
- Then: 금지 표현 검출 건수는 0건이다.

Scenario 3: 번역 결과 0건 검출
- Given: common language 번역 샘플들이 있다.
- When: 전체 검증을 수행한다.
- Then: 금지 표현 검출 건수는 0건이다.

Scenario 4: 허용 문구 통과
- Given: 식약처 허용 표현 fixture가 있다.
- When: 검증 함수를 호출한다.
- Then: 허용 문구는 차단되지 않는다.

Scenario 5: 회피 입력 차단
- Given: 공백 삽입, 변형 표기 등 우회 입력이 있다.
- When: 검증을 수행한다.
- Then: 우회 입력도 차단된다.

## :gear: Technical & Non-Functional Constraints
- 법률 리스크 대응 테스트이므로 false negative 허용이 사실상 0이어야 한다.
- QA 금지 표현 목록은 버전 관리되는 fixture로 유지한다.
- 허용 표현 예외 테스트를 함께 넣어 false positive도 관리한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 금지/허용/우회 입력 케이스가 포함되는가?
- [ ] badge_label과 common_name 경로 모두 검증되는가?
- [ ] `pnpm test TEST-F2-003` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-C-002
- Blocks: None
