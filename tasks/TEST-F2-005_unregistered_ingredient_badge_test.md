---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F2-005: [Unit Test] 미등재 원료 회색 라벨 식별 정확도 ≥ 99%, 뱃지 오발급률 0% 테스트"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F2-005] 미등재 원료 회색 라벨 정확도 테스트
- 목적: F2-C-004가 미등재 성분을 정확히 회색 라벨로 분류하고, BADGE 발급 경로로 잘못 흘려보내지 않는지 검증한다. REQ-FUNC-014의 식별 정확도 99% 이상과 오발급률 0%를 직접 테스트한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-014
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-014
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.2 상세 시퀀스: 팩트체크 뱃지 + 출처 확인`](../05_SRS_v1.md)
- 관련 구현 태스크: [`/TASKS/F2-C-004_unregistered_ingredient_gray_label.md`](./F2-C-004_unregistered_ingredient_gray_label.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#52-f2-anti-bs-dashboard-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 미등재/등재 샘플 fixture 구축
- [ ] `createGrayLabel()` 단위 테스트 작성
- [ ] `NOT_REGISTERED`, `UNKNOWN`, `INSUFFICIENT_DATA` 분기 테스트 작성
- [ ] BADGE 발급 차단 assertion 추가
- [ ] 정확도 집계 테스트 작성

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: NOT_REGISTERED 분류
- Given: `mfds_status=NOT_REGISTERED` 입력이 있다.
- When: 회색 라벨 생성 함수를 호출한다.
- Then: 회색 라벨이 생성되고 정식 뱃지는 생성되지 않는다.

Scenario 2: UNKNOWN 분류
- Given: MFDS 조회 실패로 `UNKNOWN` 상태가 있다.
- When: 회색 라벨 생성 함수를 호출한다.
- Then: 회색 라벨이 생성되고 일시적 문제 안내 툴팁이 포함된다.

Scenario 3: 데이터 부족 분류
- Given: 함량 정보가 비어 있는 입력이 있다.
- When: 회색 라벨 생성 함수를 호출한다.
- Then: `INSUFFICIENT_DATA` 회색 라벨이 생성된다.

Scenario 4: 오발급률 0%
- Given: 미등재 원료 샘플셋이 있다.
- When: 전체 분류 테스트를 수행한다.
- Then: BADGE 발급 건수는 0건이다.

Scenario 5: 식별 정확도 99% 이상
- Given: 등재/미등재 혼합 샘플셋이 있다.
- When: 전체 분류 정확도를 측정한다.
- Then: 정확도는 99% 이상이다.

## :gear: Technical & Non-Functional Constraints
- 정확도 계산식과 샘플셋 기준을 테스트 코드에 명시한다.
- 회색 라벨 분기와 정식 뱃지 분기는 타입/런타임 양쪽에서 검증한다.
- UNKNOWN과 NOT_REGISTERED를 동일 취급하지 말고 툴팁 차이까지 확인한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 세 가지 회색 라벨 분기가 모두 테스트되는가?
- [ ] 오발급률 0% assertion이 포함되는가?
- [ ] 정확도 ≥ 99% 집계가 자동화되는가?
- [ ] `pnpm test TEST-F2-005` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-C-004
- Blocks: None
