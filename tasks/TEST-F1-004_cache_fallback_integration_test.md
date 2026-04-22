---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F1-004: [Integration Test] 쿠팡 API 장애 시 캐시 PRICE_SNAPSHOT 폴백 반환 + 기준 시각 인라인 표시 검증"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F1-004] 캐시 폴백 통합 테스트
- 목적: 쿠팡 API 장애 상황에서 `GET /api/v1/compare`가 `PRICE_SNAPSHOT` 캐시 폴백으로 정상 응답하고, UI가 기준 시각 문구를 렌더링할 수 있는 메타데이터를 받는지 통합 레벨에서 검증한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 외부 시스템 폴백: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — EXT-SYS-01
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- 관련 구현 태스크: [`/TASKS/F1-Q-002_price_snapshot_fallback.md`](./F1-Q-002_price_snapshot_fallback.md), [`/TASKS/F1-RH-001_super_calc_route_handler.md`](./F1-RH-001_super_calc_route_handler.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#51-f1-super-calc-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Compare Route Handler 통합 테스트 파일 작성
- [ ] 쿠팡 API 실패 mock 구성
- [ ] 24시간 이내 `PRICE_SNAPSHOT` fixture 준비
- [ ] HTTP 200 + `is_cached=true` 검증
- [ ] `cached_at` 값 존재 및 형식 검증
- [ ] stale 캐시 차단 시나리오 추가
- [ ] 기준 시각 인라인 표시용 UI/응답 메타 연계 검증

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: Timeout 시 캐시 폴백 성공
- Given: 쿠팡 API가 Timeout으로 실패하고 24시간 이내 스냅샷이 존재한다.
- When: `GET /api/v1/compare`를 호출한다.
- Then: HTTP 200, `is_cached=true`, `cached_at` 포함 응답이 반환된다.

Scenario 2: 5xx 시 캐시 폴백 성공
- Given: 쿠팡 API가 503을 반환하고 유효한 캐시가 존재한다.
- When: `GET /api/v1/compare`를 호출한다.
- Then: 캐시 데이터가 응답으로 반환된다.

Scenario 3: stale 캐시 차단
- Given: 캐시 스냅샷이 모두 24시간 초과 데이터다.
- When: `GET /api/v1/compare`를 호출한다.
- Then: 폴백은 실패하고 외부 API 장애 응답이 유지된다.

Scenario 4: 기준 시각 메타데이터 전달
- Given: 캐시 응답이 성공했다.
- When: 응답 body 또는 meta를 확인한다.
- Then: UI가 `"쿠팡 가격은 [YYYY-MM-DD HH:MM] 기준입니다"` 문구를 렌더링할 수 있는 기준 시각 값이 존재한다.

Scenario 5: 저장 부작용 없음
- Given: 캐시 폴백 경로가 실행되었다.
- When: DB 저장 호출 여부를 검증한다.
- Then: 캐시 응답 경로에서는 신규 `PRICE_SNAPSHOT` insert가 발생하지 않는다.

## :gear: Technical & Non-Functional Constraints
- 테스트는 통합 레벨이지만 외부 실쿠팡 API 호출 없이 mock/stub로 재현해야 한다.
- 폴백 허용 장애와 비허용 장애를 구분해야 한다.
- 응답 구조는 API-001 계약과 정합해야 한다.
- 저장 부작용이 없는지 spy/mock으로 확인해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] Timeout/5xx/stale 캐시 케이스가 모두 포함되는가?
- [ ] `is_cached`, `cached_at`, 저장 부작용 없음이 검증되는가?
- [ ] `pnpm test TEST-F1-004` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F1-Q-002, #F1-RH-001
- Blocks: None
