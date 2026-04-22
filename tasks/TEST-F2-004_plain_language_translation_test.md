---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F2-004: [Unit Test] 전문 용어 일상어 번역 커버리지 ≥ 95% 및 정확도 ≥ 98% 테스트"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F2-004] 일상어 번역 품질 테스트
- 목적: F2-C-003 번역 매핑 로직이 식약처 등록 원료 기준 커버리지 95% 이상, 정확도 98% 이상을 만족하는지 검증한다. 사전 hit, alias hit, fallback miss를 구분해서 번역 품질 회귀를 잡는다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-013
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-013
- 관련 구현 태스크: [`/TASKS/F2-C-003_common_language_translation.md`](./F2-C-003_common_language_translation.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#52-f2-anti-bs-dashboard-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] translation golden dataset 구성
- [ ] 커버리지 측정 스크립트 테스트 작성
- [ ] 정확도 비교 테스트 작성
- [ ] alias hit/fallback miss 케이스 분리
- [ ] 금지 표현 검증 연계 케이스 추가

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 정확 매칭 번역
- Given: 번역 사전에 수록된 전문 용어 fixture가 있다.
- When: 번역 함수를 호출한다.
- Then: 기대한 common language가 반환된다.

Scenario 2: alias 매칭
- Given: alias로 수록된 입력이 있다.
- When: 번역 함수를 호출한다.
- Then: 동일한 common language 결과가 반환된다.

Scenario 3: fallback miss 분리
- Given: 사전에 없는 성분명이 있다.
- When: 번역 함수를 호출한다.
- Then: `FALLBACK_STANDARD_NAME` 또는 동등한 miss 결과가 반환된다.

Scenario 4: 커버리지 95% 이상
- Given: REGISTERED 원료 기준 데이터셋이 있다.
- When: 커버리지 측정을 수행한다.
- Then: 번역 커버리지는 95% 이상이다.

Scenario 5: 정확도 98% 이상
- Given: golden translation dataset이 있다.
- When: 정확도 측정을 수행한다.
- Then: 정확도는 98% 이상이다.

## :gear: Technical & Non-Functional Constraints
- 커버리지와 정확도는 서로 다른 메트릭으로 분리 측정한다.
- golden dataset은 사전 변경과 별도로 리뷰 가능한 fixture 파일로 유지한다.
- fallback miss는 실패가 아니라 측정 대상이므로 별도 집계한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] exact hit, alias hit, fallback miss가 모두 테스트되는가?
- [ ] 커버리지/정확도 리포트가 자동화되는가?
- [ ] `pnpm test TEST-F2-004` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-C-003
- Blocks: None
