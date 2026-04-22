---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-MON-003: Mixpanel/Amplitude 대시보드 항목 설정 (MAU, 퍼널 전환율, CTR, K-Factor, DB 오류율, TTC)"
labels: 'feature, analytics, epic:E-NFR, priority:medium, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-MON-003] Product KPI 대시보드 설정
- 목적: Mixpanel/Amplitude에 제품/운영 핵심 지표를 구성해 MAU, 전환 퍼널, CTR, K-Factor, DB 오류율, TTC를 주간 리뷰 가능한 형태로 시각화한다. REQ-NF-022의 실행 항목을 정의한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 모니터링: [`/05_SRS_v1.md#4.2.5 Monitoring (운영/모니터링)`](../05_SRS_v1.md) — REQ-NF-022
- 관련 구현 태스크: [`/TASKS/COM-C-004_affiliate_click_tracking.md`](./COM-C-004_affiliate_click_tracking.md), [`/TASKS/COM-C-005_kakao_share_tracking.md`](./COM-C-005_kakao_share_tracking.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#64-모니터링로깅`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] KPI 목록과 정의 문서화
  - MAU
  - 퍼널 전환율
  - CTR
  - K-Factor
  - DB 오류율
  - TTC
- [ ] 이벤트-지표 매핑 정의
  - `affiliate_link_click`
  - `kakao_share_send`
  - 검색/비교 완료 이벤트
- [ ] 주간 리뷰 대시보드 레이아웃 설계
- [ ] 속성(attribute) 표준 정의
  - `product_id`, `channel`, `source`, `duration_bucket`
- [ ] 데이터 품질 체크리스트 정의
  - 이벤트 누락
  - 중복 전송
  - 속성 불일치

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: KPI 6개 노출
- Given: 이벤트 수집이 동작 중이다.
- When: 대시보드를 연다.
- Then: MAU, 퍼널 전환율, CTR, K-Factor, DB 오류율, TTC 6개 지표를 확인할 수 있다.

Scenario 2: 이벤트-지표 매핑 확인
- Given: 클릭/공유 이벤트가 발생했다.
- When: 지표를 조회한다.
- Then: 해당 이벤트가 KPI 계산에 반영된다.

Scenario 3: 속성 표준 일관성
- Given: 이벤트 payload가 수집된다.
- When: 속성 스키마를 점검한다.
- Then: 핵심 속성이 일관된 이름으로 저장된다.

Scenario 4: 주간 리뷰 가능성
- Given: 한 주간 데이터가 누적되었다.
- When: 운영/기획 리뷰를 수행한다.
- Then: 대시보드만으로 주간 트렌드를 판단할 수 있다.

Scenario 5: 누락/중복 탐지
- Given: 이벤트 누락 또는 중복 전송이 발생했다.
- When: 데이터 품질 체크를 수행한다.
- Then: 이상을 탐지할 수 있다.

## :gear: Technical & Non-Functional Constraints
- Mixpanel 또는 Amplitude 중 실제 선택은 운영 편의에 따르되, 지표 정의는 도구 중립적으로 유지한다.
- 이벤트 명과 속성 명은 변경 비용이 크므로 초기에 표준화해야 한다.
- 개인정보는 KPI 대시보드에 직접 노출하지 않는다.
- DB 오류율과 TTC처럼 제품/운영 지표가 함께 보이도록 설계한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] KPI 정의와 이벤트 매핑이 문서화되는가?
- [ ] 대시보드 레이아웃 또는 구성 항목이 정의되는가?
- [ ] 속성 표준과 데이터 품질 체크리스트가 포함되는가?
- [ ] 주간 리뷰용 산출물로 사용 가능함이 확인되는가?

## :construction: Dependencies & Blockers
- Depends on: #NFR-001
- Blocks: #TEST-COM-003
