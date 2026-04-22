---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] P2-002: 트렌드 성분 팩트체크 콘텐츠 제공"
labels: 'feature, fullstack, epic:E-F2, priority:medium, phase:post-mvp, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [P2-002] 트렌드 성분 팩트체크 콘텐츠
- 목적: REQ-FUNC-036에 따라 NMN, 글루타치온 같은 트렌드 성분에 대해 식약처/논문 기반 팩트체크 콘텐츠를 제공한다. 사용자는 마케팅 문구가 아닌 검증 가능한 근거 중심 요약, 허용 표현, 주의사항, 출처 링크를 볼 수 있어야 한다.
- Epic / Phase: E-F2 / Post-MVP (Should-Have)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.6 Should-Have 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-036
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-010~015
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-2 (건강기능식품법 및 과장/치료 표현 금지)
- 관련 선행 명세: [`/TASKS/F2-RH-001_badge_route_handler.md`](./F2-RH-001_badge_route_handler.md), [`/TASKS/F2-C-002_prohibited_expression_validator.md`](./F2-C-002_prohibited_expression_validator.md), [`/TASKS/F4-Q-001_data_source_query.md`](./F4-Q-001_data_source_query.md), [`/TASKS/UI-020_product_detail_page.md`](./UI-020_product_detail_page.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#81-phase-2--post-mvp-scope-suggestion`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 트렌드 성분 팩트체크 콘텐츠 모델 정의
  - 성분 slug, 요약, 핵심 주장, 근거 출처, 허용 표현, 주의 표현 구조화
- [ ] 성분 상세/전용 페이지 렌더 경로 구현
  - 트렌드 성분 목록 진입점
  - 성분별 팩트체크 상세 페이지
- [ ] Badge/Source 파이프라인 재사용
  - F2/F4 기존 근거 데이터와 출처 UI 연결
  - 식약처/논문 링크를 명시적으로 노출
- [ ] 금지 표현 필터 적용
  - 치료/예방/과장 문구 원천 차단
  - publish 전 검수 체크리스트 정의
- [ ] 마케팅 콘텐츠 0건 보장 검증
  - 후기, 별점, 과장 카피, 구매 유도 문구 비노출
- [ ] 콘텐츠 운영 규칙 문서화
  - 새 트렌드 성분 추가 절차
  - 출처 갱신 주기와 검수 책임 명시

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 트렌드 성분 페이지 제공
- Given: 팩트체크 콘텐츠가 등록된 트렌드 성분이 있다.
- When: 사용자가 해당 성분 페이지에 접근한다.
- Then: 근거 기반 팩트체크 콘텐츠가 표시된다.

Scenario 2: 출처 명시
- Given: 콘텐츠에 식약처 또는 논문 근거가 연결되어 있다.
- When: 사용자가 근거 영역을 확인한다.
- Then: 출처 링크와 요약이 함께 제공되어 검증 가능하다.

Scenario 3: 마케팅 콘텐츠 차단
- Given: 콘텐츠 초안에 과장 표현이나 구매 유도 문구가 포함되어 있다.
- When: 게시 검증을 수행한다.
- Then: 금지 표현 필터에 의해 게시가 차단되거나 수정이 요구된다.

Scenario 4: 콘텐츠 미존재 fallback
- Given: 사용자가 아직 등록되지 않은 트렌드 성분 페이지에 접근한다.
- When: 콘텐츠를 조회한다.
- Then: 깨진 페이지 대신 준비 중 안내와 일반 검색/비교 진입 경로를 제공한다.

Scenario 5: 상세 페이지 연계
- Given: 제품 상세 또는 검색 결과에서 트렌드 성분 링크가 노출된다.
- When: 사용자가 해당 링크를 탭한다.
- Then: 관련 팩트체크 페이지로 자연스럽게 이동한다.

## :gear: Technical & Non-Functional Constraints
- 팩트체크 콘텐츠는 마케팅 카피가 아니라 근거 데이터의 편집/해설 레이어여야 한다.
- 출처 없는 주장, 후기성 문구, 치료 암시 표현은 게시 금지다.
- 콘텐츠 렌더는 정적 또는 캐시 가능한 경로를 우선 사용해 비용과 응답 시간을 제어한다.
- 근거 UI는 기존 출처 확인 컴포넌트와 의미 체계를 맞춰 중복 구현을 줄여야 한다.
- 법적 리스크가 큰 표현은 자동 필터와 수동 검수 두 단계를 모두 통과해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 팩트체크 콘텐츠 데이터 구조와 렌더 경로가 정의되었는가?
- [ ] 식약처/논문 근거 링크가 구조적으로 연결되는가?
- [ ] 금지 표현 필터와 게시 전 검수 절차가 포함되는가?
- [ ] 미존재 콘텐츠 fallback UX가 정의되는가?
- [ ] 마케팅 콘텐츠 0건 검증 기준이 문서화되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F2-RH-001, #F2-C-002, #F4-Q-001, #UI-020
- Blocks: None
