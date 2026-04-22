---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] P2-004: 3탭 비교 결론 UX 최적화"
labels: 'feature, frontend, epic:E-UI, priority:low, phase:post-mvp, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [P2-004] 3탭 비교 결론 UX 최적화
- 목적: REQ-FUNC-038에 따라 사용자가 메인 화면 진입 이후 검색→비교→결론(구매 또는 공유)에 3탭 이내로 도달할 수 있도록 퍼널을 재설계한다. 핵심은 단순히 버튼 수를 줄이는 것이 아니라, 사용자가 다음 행동을 고민하지 않게 하는 정보 우선순위와 액션 배치를 만드는 것이다.
- Epic / Phase: E-UI / Post-MVP (Could-Have)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.7 Could-Have 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-038
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.1 Performance`](../05_SRS_v1.md) — REQ-NF-008 (TTC)
- 관련 선행 명세: [`/TASKS/UI-010_main_search_page.md`](./UI-010_main_search_page.md), [`/TASKS/UI-011_compare_result_page.md`](./UI-011_compare_result_page.md), [`/TASKS/UI-040_kakao_share_button.md`](./UI-040_kakao_share_button.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#81-phase-2--post-mvp-scope-suggestion`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 현재 검색→비교→결론 퍼널 계측/진단
  - 실제 탭 수, 이탈 지점, 로딩 구간 식별
- [ ] 3탭 목표 UX 설계
  - 메인에서 즉시 비교 진입
  - 결과 화면에서 최우선 결론 CTA 1개 강조
- [ ] 검색 입력/자동완성 마찰 최소화
  - 추천 성분 chip, 최근 검색, 기본 선택값 검토
  - 불필요한 중간 확인 단계 제거
- [ ] 결과 화면 결론 카드 구현
  - 최저가 제품 요약
  - 구매하기/공유하기 중 상황별 primary action 지정
- [ ] 이벤트 계측 및 A/B 실험 포인트 정의
  - 탭 수, 결론 도달률, 공유/구매 전환율 측정
- [ ] 접근성/법적 검수
  - CTA 강조가 오인 유도 또는 광고성 과장으로 변질되지 않도록 검토

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 검색 기반 3탭 여정
- Given: 사용자가 메인 화면에 진입했다.
- When: 검색어 입력 후 비교를 수행하고 결론 CTA를 선택한다.
- Then: 검색→비교→결론까지 3탭 이내로 도달할 수 있다.

Scenario 2: 추천 chip 기반 단축 여정
- Given: 메인 화면에 추천 성분 chip이 있다.
- When: 사용자가 chip을 탭한다.
- Then: 별도 중간 단계 없이 비교 결과 또는 결론 카드로 빠르게 진입한다.

Scenario 3: 결과 화면 결론 명확화
- Given: 비교 결과가 성공적으로 렌더링되었다.
- When: 사용자가 결과 화면을 본다.
- Then: 가장 우선해야 할 행동(구매 또는 공유)이 즉시 식별된다.

Scenario 4: 기존 기능 회귀 없음
- Given: 정렬, 캐시 시각, 공유, 제휴 링크 기능이 이미 존재한다.
- When: 3탭 UX 최적화를 적용한다.
- Then: 기존 기능의 가시성이나 법적 제약 준수는 훼손되지 않는다.

Scenario 5: 퍼널 측정 가능성
- Given: 최적화 버전이 배포되었다.
- When: 분석 이벤트를 수집한다.
- Then: 실제 평균 탭 수와 결론 도달률 개선 여부를 검증할 수 있다.

## :gear: Technical & Non-Functional Constraints
- 탭 수 감소를 위해 정보 밀도를 무작정 높이면 안 되며, 모바일 가독성과 한 손 사용성을 우선해야 한다.
- primary CTA는 상황별 하나만 강하게 강조하고, 나머지 액션은 보조 계층으로 내려야 한다.
- 구매/공유 유도는 사용자 편의 중심이어야 하며, 다크 패턴이나 오클릭 유도 배치는 금지한다.
- 기존 URL 기반 상태 관리와 분석 이벤트 구조를 최대한 유지해 회귀 비용을 줄여야 한다.
- 개선 효과는 정성 판단이 아니라 탭 수, TTC, 전환율로 측정해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 3탭 목표 기준의 사용자 여정 정의가 문서화되었는가?
- [ ] 메인 검색과 결과 화면의 핵심 상호작용이 단축되었는가?
- [ ] 결론 카드 또는 primary CTA 규칙이 구현되었는가?
- [ ] 탭 수/전환율 측정 이벤트가 정의되었는가?
- [ ] 접근성 및 법적 제약 검수가 포함되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #UI-010, #UI-011
- Blocks: None
