---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] P2-001: 비교 이력 저장·재조회 기능 구현"
labels: 'feature, fullstack, epic:E-COMMON, priority:medium, phase:post-mvp, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [P2-001] 비교 이력 저장·재조회
- 목적: REQ-FUNC-035와 UC-13에 따라 인증 사용자의 비교 결과를 저장하고, 재방문 시 이전 비교 결과에 연속적으로 접근할 수 있도록 한다. 사용자는 "비교 이력" 메뉴에서 시간순 목록을 보고, 각 항목을 탭해 당시 결과를 다시 확인할 수 있어야 한다.
- Epic / Phase: E-COMMON / Post-MVP (Should-Have)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.6 Should-Have 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-035
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — UC-13 (비교 이력 저장 및 재조회)
- SRS 보안/개인정보: [`/05_SRS_v1.md#4.2.3 Security`](../05_SRS_v1.md) — REQ-NF-015 (이메일, 비교 이력만 수집)
- 관련 선행 명세: [`/TASKS/DATA-008_comparison_history_schema.md`](./DATA-008_comparison_history_schema.md), [`/TASKS/COM-C-002_auth_session_management.md`](./COM-C-002_auth_session_management.md), [`/TASKS/F1-RH-001_super_calc_route_handler.md`](./F1-RH-001_super_calc_route_handler.md), [`/TASKS/UI-050_auth_signup_page.md`](./UI-050_auth_signup_page.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#81-phase-2--post-mvp-scope-suggestion`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 비교 성공 시 이력 저장 트리거 구현
  - 인증 사용자에 한해 compare 완료 시 `COMPARISON_HISTORY` 저장
  - 검색어, 정렬 기준, 결과 스냅샷, 비교 시각 저장
- [ ] 비교 이력 조회 화면 또는 메뉴 진입점 구현
  - 최근 항목 시간순 정렬
  - 검색어, 건수, 비교 시각, 요약 메타 표시
- [ ] 이력 상세 재현 기능 구현
  - 저장된 스냅샷 기반 read-only 재현
  - 필요 시 최신 결과로 재조회하는 refresh 액션 분리
- [ ] 인증 가드 및 비인증 UX 정의
  - 비인증 사용자는 이력 저장 비활성
  - 이력 접근 시 로그인 유도
- [ ] 보존 및 삭제 정책 연동
  - DATA-008의 retention 정책 준수
  - 사용자 삭제 시 cascade 정리 확인
- [ ] 추적 이벤트 정의
  - `comparison_history_saved`
  - `comparison_history_opened`
  - `comparison_history_replayed`

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 비교 완료 후 이력 저장
- Given: 인증 사용자가 비교를 완료했다.
- When: 결과 페이지가 정상 렌더링된다.
- Then: 해당 비교 결과가 `COMPARISON_HISTORY`에 저장된다.

Scenario 2: 시간순 목록 조회
- Given: 사용자가 3건 이상의 비교 이력을 보유하고 있다.
- When: "비교 이력" 메뉴에 접근한다.
- Then: 최신 항목이 상단에 오도록 시간순으로 목록이 표시된다.

Scenario 3: 이력 재현
- Given: 이력 목록의 특정 항목에 결과 스냅샷이 저장되어 있다.
- When: 사용자가 해당 항목을 탭한다.
- Then: 당시 비교 결과가 재현되며, 사용자는 구매/공유 등 후속 액션을 다시 수행할 수 있다.

Scenario 4: 비인증 사용자 제한
- Given: 비인증 사용자가 비교 기능을 사용했다.
- When: 결과를 확인하거나 이력 메뉴에 접근한다.
- Then: 자동 저장은 수행되지 않으며, 이력 기능은 로그인 유도 UI를 표시한다.

Scenario 5: 최소 수집 원칙 유지
- Given: 비교 이력 저장 로직이 동작한다.
- When: 저장 payload를 검토한다.
- Then: 이메일과 비교 이력 범위를 넘는 추가 개인정보가 저장되지 않는다.

## :gear: Technical & Non-Functional Constraints
- 비교 이력은 DATA-008의 `result_snapshot` 구조를 SSOT로 사용해야 하며, 별도 ad-hoc 직렬화 포맷을 추가하지 않는다.
- 재현 화면은 기본적으로 read-only 스냅샷 뷰여야 하며, 최신 시세와 혼동되지 않도록 refresh 액션을 명시적으로 분리한다.
- REQ-NF-015에 따라 개인정보 수집 범위를 확장하면 안 되며, 비교 이력 외 행동 데이터는 별도 동의 없이 저장하지 않는다.
- 이력 저장 실패가 실시간 비교 성공 자체를 깨뜨리면 안 된다. 저장 실패는 비동기 로그/모니터링으로만 처리한다.
- 목록/재현 UX는 모바일 우선이며, 긴 검색어와 많은 결과 건수도 한 화면에서 스캔 가능해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 비교 완료 시 인증 사용자에 한해 이력이 저장되는가?
- [ ] 이력 목록이 시간순으로 정렬되어 조회되는가?
- [ ] 저장된 스냅샷 기반 재현이 동작하는가?
- [ ] 비인증 사용자 제한과 로그인 유도 흐름이 정의되었는가?
- [ ] 최소 수집 원칙과 retention 정책을 위반하지 않는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #DATA-008, #COM-C-002, #F1-RH-001, #UI-050
- Blocks: #P2-005
