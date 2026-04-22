---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F4-001: [Unit Test] 출처 아코디언 펼침 시간 p95 ≤ 500ms 검증"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F4-001] 출처 아코디언 펼침 성능 단위 테스트
- 목적: F4-Q-001의 데이터 출처 조회 로직이 REQ-FUNC-022 AC와 REQ-NF-004(p95 ≤ 500ms)를 충족하는지 검증한다. 제품 성분의 근거 URL(식약처 DB, 제조사 라벨, 논문 DOI)을 반환하는 쿼리가 아코디언 UI의 1탭 → 펼침 인터랙션 예산 안에 종료되어야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-022
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.1 Performance`](../05_SRS_v1.md) — REQ-NF-004
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-NF-004
- SRS UC: [`/05_SRS_v1.md#3.5 UC-09`](../05_SRS_v1.md) — 데이터 원본 출처 확인 (2클릭 이내)
- 관련 구현 태스크: [`/TASKS/F4-Q-001_data_source_query.md`](./F4-Q-001_data_source_query.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#54-f4-data-trust-system-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f4/data-source-query.test.ts`
- [ ] F4-Q-001의 `getDataSources(ingredientId)` 호출 성능 계측 (`performance.now()`)
- [ ] 단일 성분 조회 p95 ≤ 500ms 검증 (100회 반복)
- [ ] 출처 3종(MFDS / PAPER / MANUFACTURER) 모두 포함한 성분 시나리오 1건 이상
- [ ] 라벨 이미지 URL + 식약처 DB URL + 논문 DOI의 URL 유효성 (HTTPS, 절대경로)
- [ ] N+1 쿼리 미발생 검증 — Prisma query log로 단일 SELECT 확인
- [ ] 2클릭 이내 도달 가능성 검증: 응답 payload가 아코디언 1회 열람만으로 모두 렌더 가능한지 확인
- [ ] 누락 케이스: 일부 성분이 PAPER 출처 부재 → `null` 반환이 UI에 친화적인 구조인지 검증

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: p95 ≤ 500ms
- Given: INGREDIENT 500건이 시드된 상태다.
- When: 100회 `getDataSources()` 조회를 실행한다.
- Then: p95 응답 시간이 500ms 이하다.

Scenario 2: 출처 3종 모두 포함
- Given: 식약처·제조사·논문 근거가 모두 존재하는 성분이다.
- When: 출처 조회를 호출한다.
- Then: 3종 URL이 모두 응답에 포함되고 각각 절대 HTTPS URL이다.

Scenario 3: 출처 일부 누락
- Given: 논문 DOI가 없는 성분이다.
- When: 출처 조회를 호출한다.
- Then: 응답의 `paper_url` 필드가 `null`이며 나머지 2종은 정상 반환된다.

Scenario 4: N+1 미발생
- Given: Prisma query log 캡처가 활성화되어 있다.
- When: 단일 성분 조회를 호출한다.
- Then: SELECT 쿼리는 1~2건만 실행된다.

Scenario 5: 2클릭 도달 가능성
- Given: 아코디언 UI 구조가 응답 payload를 기반으로 구성된다.
- When: payload 구조를 검증한다.
- Then: 중첩된 원격 호출 없이 한 번의 렌더로 모든 출처 URL이 노출 가능하다.

## :gear: Technical & Non-Functional Constraints
- 테스트는 DB 시드 기반 결정적 환경에서 수행되며, 외부 HTTP 호출 없이 순수 쿼리 성능만 계측한다.
- p95 계산은 warm-up(10회) 제외한 샘플 100건 기준이다.
- 응답 스키마는 API-002/F4 DTO와 일치해야 한다 (계약 위반 감지).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] p95 ≤ 500ms 실패 게이트가 CI에 설정되는가?
- [ ] N+1 리그레션 가드가 Prisma query log 수집으로 검증되는가?
- [ ] 출처 누락 케이스가 `null` 친화적으로 반환되는가?
- [ ] `pnpm test TEST-F4-001` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F4-Q-001
- Blocks: None
