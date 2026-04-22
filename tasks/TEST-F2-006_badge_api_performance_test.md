---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F2-006: [Integration Test] Badge API 엔드포인트 응답 시간 p95 ≤ 1,000ms 검증"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F2-006] Badge API 성능 통합 테스트
- 목적: `GET /api/v1/badges` 엔드포인트가 REQ-FUNC-011 및 REQ-NF-002의 p95 1,000ms 목표를 충족하는지 검증한다. 캐시 Hit/Miss, 공전 조회, 뱃지 판정, 번역, 회색 라벨 조립까지 포함한 실제 통합 경로를 측정 대상으로 삼는다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-011
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.1 Performance`](../05_SRS_v1.md) — REQ-NF-002
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1 API Endpoint List`](../05_SRS_v1.md) — INT-API-02
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.2 상세 시퀀스: 팩트체크 뱃지 + 출처 확인`](../05_SRS_v1.md)
- 관련 구현 태스크: [`/TASKS/F2-RH-001_badge_route_handler.md`](./F2-RH-001_badge_route_handler.md), [`/TASKS/F2-C-005_badge_caching.md`](./F2-C-005_badge_caching.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#52-f2-anti-bs-dashboard-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `/api/v1/badges` 통합 성능 테스트 작성
- [ ] 캐시 warm/cold 시나리오 분리
- [ ] MFDS stub과 DB fixture 준비
- [ ] p50/p95/p99 측정 로직 추가
- [ ] Hit/Miss 분리 리포트 출력
- [ ] 1,000ms 초과 시 실패 게이트 구성

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 캐시 Warm p95 1,000ms 이하
- Given: 동일 `product_id` 요청으로 캐시가 warm 된 상태다.
- When: 반복 호출로 성능을 측정한다.
- Then: p95 응답 시간이 1,000ms 이하이다.

Scenario 2: 캐시 Miss 재계산 경로
- Given: 캐시가 비어 있는 상태와 MFDS stub 응답이 있다.
- When: 첫 요청 성능을 측정한다.
- Then: Miss 경로도 정의된 예산 내에서 완료되며, 이후 요청은 hit로 전환된다.

Scenario 3: 응답 구조 유지
- Given: 성능 측정 중인 실제 응답이 있다.
- When: 응답 schema 검증을 수행한다.
- Then: 성능 측정 중에도 API-002 응답 계약을 유지한다.

Scenario 4: Hit/Miss 메트릭 구분
- Given: warm/cold 요청이 섞여 있다.
- When: 성능 테스트 리포트를 생성한다.
- Then: L1/L2 hit 또는 miss 분포를 식별할 수 있다.

Scenario 5: 성능 회귀 감지
- Given: 최근 코드 변경으로 Badge API가 느려졌다.
- When: 테스트를 실행한다.
- Then: p95가 1,000ms를 초과하면 테스트가 실패한다.

## :gear: Technical & Non-Functional Constraints
- 실외부 API 호출 없이 stubbed MFDS 응답으로 재현해야 한다.
- 성능 측정은 cold start 노이즈와 warm cache 케이스를 분리 기록한다.
- 캐시 계층(F2-C-005)의 hit/miss 메타를 리포트에 포함해야 한다.
- 측정 중에도 응답 계약 위반을 허용하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] warm/miss 시나리오가 모두 측정되는가?
- [ ] p95 ≤ 1,000ms 실패 게이트가 설정되는가?
- [ ] API-002 schema 검증이 함께 수행되는가?
- [ ] `pnpm test TEST-F2-006` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-RH-001
- Blocks: None
