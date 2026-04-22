---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F1-005: [Unit Test] 미등록 성분 검색 시 안내 메시지 + CTA 버튼 반환 검증 (300ms 이내, 제출 성공률 99%+)"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F1-005] 미등록 성분 CTA 반환 테스트
- 목적: REQ-FUNC-008의 Sad Path에서 시스템이 미등록 성분을 올바르게 감지하고, 안내 메시지와 제품 등록 요청 CTA를 신속하게 반환하는지 검증한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-008
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-008
- 관련 구현 태스크: COM-Q-002 (미등록 성분 안내 메시지 및 등록 CTA 반환)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#51-f1-super-calc-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 미등록 성분 응답 생성 함수 또는 Query 로직 테스트 파일 작성
- [ ] 안내 메시지 존재 검증
- [ ] CTA 메타데이터 존재 검증
- [ ] 300ms 이내 응답 성능 예산 검증
- [ ] 등록 요청 제출 흐름과 연계 가능한 CTA 식별자/링크 검증
- [ ] 빈 문자열/오탐(false positive) 차단 케이스 작성

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 미등록 성분 안내 메시지 반환
- Given: 사용자가 DB 미등록 성분 `NMN`을 검색한다.
- When: 미등록 성분 Query 또는 응답 생성 함수를 호출한다.
- Then: 안내 메시지가 포함된 결과가 반환된다.

Scenario 2: CTA 버튼 메타데이터 포함
- Given: 미등록 성분 안내 응답이 생성되었다.
- When: 응답 payload를 확인한다.
- Then: 제품 등록 요청으로 연결되는 CTA 메타데이터가 포함된다.

Scenario 3: 응답 시간 예산
- Given: 미등록 성분 시나리오가 준비되어 있다.
- When: 처리를 수행한다.
- Then: 300ms 이내에 안내 응답이 생성된다.

Scenario 4: 등록된 성분 오탐 차단
- Given: DB에 존재하는 등록 성분을 입력한다.
- When: 동일 로직을 수행한다.
- Then: 미등록 안내 메시지와 CTA가 반환되지 않는다.

Scenario 5: 빈 입력 차단
- Given: 빈 문자열 또는 공백만 있는 입력이 주어진다.
- When: 로직을 수행한다.
- Then: 미등록 안내 시나리오가 아니라 validation 오류로 분기한다.

## :gear: Technical & Non-Functional Constraints
- 테스트는 네트워크 호출 없이 Query/응답 생성 로직만 검증한다.
- CTA 응답은 UI와 Server Action이 모두 사용할 수 있는 구조여야 한다.
- 300ms 기준은 로컬/CI 환경에서 과도한 flaky를 만들지 않도록 여유 범위를 문서화한다.
- 등록 성분 오탐은 사용자 경험과 운영 비용에 직접 영향을 주므로 명시적으로 검증해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 안내 메시지, CTA 메타데이터, 오탐 방지 케이스가 포함되는가?
- [ ] 300ms 이내 처리 기준이 검증되는가?
- [ ] `pnpm test TEST-F1-005` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #COM-Q-002
- Blocks: None
