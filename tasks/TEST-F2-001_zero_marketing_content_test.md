---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F2-001: [Unit Test] 마케팅 콘텐츠 0건 보장 테스트 (광고 배너, 리뷰, 별점, 체험단 링크 = 0)"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F2-001] 마케팅 콘텐츠 0건 보장 테스트
- 목적: Anti-BS Dashboard가 제품 상세 영역에서 광고성 정보 없이 근거 기반 뱃지와 성분 정보만 노출하는지 검증한다. REQ-FUNC-010을 테스트 코드로 고정해 UI/응답 모델에 마케팅 필드가 스며드는 회귀를 차단한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-010
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.2 상세 시퀀스: 팩트체크 뱃지 + 출처 확인`](../05_SRS_v1.md) — 마케팅 콘텐츠 0건 보장
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5-traceability-matrix`](../05_SRS_v1.md) — TC-FUNC-010
- 관련 구현 태스크: [`/TASKS/F2-RH-001_badge_route_handler.md`](./F2-RH-001_badge_route_handler.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#52-f2-anti-bs-dashboard-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 뱃지 응답/뷰모델 fixture 작성
- [ ] 광고 배너 필드 부재 검증
- [ ] 리뷰/별점 필드 부재 검증
- [ ] 체험단 링크/블로그 링크 부재 검증
- [ ] 회귀 방지용 금지 필드 목록 상수화

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 광고 배너 0건
- Given: 제품 상세용 Badge 응답 또는 뷰모델이 생성되었다.
- When: 허용 필드 목록을 기준으로 검증한다.
- Then: 광고 배너 관련 필드는 존재하지 않는다.

Scenario 2: 리뷰/별점 0건
- Given: 응답 payload가 준비되어 있다.
- When: 리뷰, 평점, 후기 관련 키 존재 여부를 확인한다.
- Then: 관련 필드는 0건이며 노출 모델에 포함되지 않는다.

Scenario 3: 체험단 링크 0건
- Given: 상세 페이지 구성 데이터가 준비되어 있다.
- When: 외부 홍보성 링크 키를 검사한다.
- Then: 체험단/블로그 링크가 포함되지 않는다.

Scenario 4: 허용 필드만 통과
- Given: API-002와 F2 Route Handler가 정의한 허용 응답 구조가 있다.
- When: 스냅샷 또는 schema-based assertion을 수행한다.
- Then: 허용된 근거 기반 필드만 존재한다.

Scenario 5: 회귀 감지
- Given: 누군가 광고/리뷰 필드를 payload에 추가했다.
- When: 테스트를 실행한다.
- Then: 테스트는 실패한다.

## :gear: Technical & Non-Functional Constraints
- 이 테스트는 콘텐츠 품질 회귀 방지용이다. 네트워크/DB 의존성 없이 고정 fixture로 검증한다.
- 금지 필드 목록은 테스트 코드에 명시해 우발적 추가를 빠르게 감지한다.
- 응답 스냅샷을 쓰더라도 의미 있는 assertion을 병행한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 광고/리뷰/별점/체험단 링크 금지 assertion이 포함되는가?
- [ ] 회귀 추가 시 테스트가 실패하도록 설계되는가?
- [ ] `pnpm test TEST-F2-001` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-RH-001
- Blocks: None
