---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] P2-005: B2B 마켓 인텔리전스 대시보드 구현 (k-anonymity >= 5)"
labels: 'feature, admin, epic:E-ADMIN, priority:low, phase:post-mvp, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [P2-005] B2B 마켓 인텔리전스 대시보드
- 목적: REQ-FUNC-039와 REQ-NF-016에 따라 기업 고객에게 익명화된 가격 저항선(WTP) 데이터를 제공하는 전용 대시보드를 구축한다. 개인 단위 로그를 노출하지 않고, k-anonymity >= 5가 보장된 집계 데이터만 제공해야 한다.
- Epic / Phase: E-ADMIN / Post-MVP (Could-Have)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.7 Could-Have 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-039
- SRS 보안/개인정보: [`/05_SRS_v1.md#4.2.3 Security`](../05_SRS_v1.md) — REQ-NF-016
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-6 (B2B 데이터 제공 시 k-anonymity >= 5)
- 관련 선행 명세: [`/TASKS/DATA-010_erd_integration_migration.md`](./DATA-010_erd_integration_migration.md), [`/TASKS/COM-C-002_auth_session_management.md`](./COM-C-002_auth_session_management.md), [`/TASKS/UI-060_admin_login_rbac.md`](./UI-060_admin_login_rbac.md), [`/TASKS/DATA-008_comparison_history_schema.md`](./DATA-008_comparison_history_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#81-phase-2--post-mvp-scope-suggestion`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] B2B 전용 접근 제어 설계
  - 일반 사용자/관리자와 분리된 B2B role 또는 scope 정의
  - 계약 고객 단위 접근 권한 검증
- [ ] 익명화 집계 파이프라인 구현
  - 비교 이력, 가격 이벤트 등 원천 데이터에서 집계 테이블 생성
  - 개별 사용자 식별자 제거
- [ ] k-anonymity 가드 구현
  - 표본 수 5 미만 세그먼트 suppress
  - drill-down 시 재식별 가능성 방지
- [ ] 대시보드 UI 구성
  - 성분/카테고리별 가격 저항선 분포
  - 기간 필터, 버킷화, 추세 차트
- [ ] 데이터 내보내기 정책 정의
  - raw row export 금지
  - 집계 결과만 CSV/리포트로 제한
- [ ] 감사 로그 및 운영 문서화
  - 조회 이력, 다운로드 이력, 권한 변경 기록

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: B2B 사용자 접근
- Given: B2B 권한을 가진 인증 사용자가 있다.
- When: 마켓 인텔리전스 대시보드에 접근한다.
- Then: 익명화된 집계 데이터가 표시된다.

Scenario 2: k-anonymity 보장
- Given: 특정 세그먼트의 표본 수가 5 미만이다.
- When: 해당 세그먼트 결과를 조회한다.
- Then: 데이터는 숨김 처리되거나 상위 집계로만 표시된다.

Scenario 3: 개인 식별 정보 비노출
- Given: 대시보드 응답 payload를 확인한다.
- When: 데이터 필드를 검토한다.
- Then: 사용자 이메일, raw session, 개별 비교 기록 같은 직접 식별/준식별 정보가 포함되지 않는다.

Scenario 4: 집계 기반 내보내기
- Given: B2B 사용자가 데이터를 다운로드한다.
- When: 내보내기 기능을 사용한다.
- Then: 개별 행이 아닌 익명화된 집계 결과만 제공된다.

Scenario 5: 권한 없는 접근 차단
- Given: 일반 사용자 또는 권한 없는 관리자가 접근을 시도한다.
- When: 대시보드 라우트 또는 API를 호출한다.
- Then: 접근이 거부되고 감사 로그가 남는다.

## :gear: Technical & Non-Functional Constraints
- CON-6 및 REQ-NF-016을 위반할 수 있는 raw data drill-down, low-count bucket, 자유 텍스트 export는 금지한다.
- B2B 데이터는 운영 서비스 데이터와 논리적으로 분리된 집계 레이어에서 제공되어야 한다.
- 익명화 규칙은 UI에서만 가릴 것이 아니라 집계 생성 단계에서 적용해야 한다.
- 고객별 권한 관리와 접근 감사 로그가 있어야 하며, 계약 종료 시 즉시 회수 가능해야 한다.
- 가격 저항선(WTP)은 기존 서비스 데이터를 기반으로 한 통계적 추정치임을 명시하고, 개인 단위 판단 데이터로 오해되지 않도록 해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] B2B role/scope와 접근 제어가 정의되었는가?
- [ ] 익명화 집계 파이프라인이 구현되었는가?
- [ ] k-anonymity >= 5 가드가 API와 UI 양쪽에서 검증되는가?
- [ ] raw row export 금지 정책이 문서화되었는가?
- [ ] 감사 로그와 권한 변경 기록이 남는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #DATA-010, #COM-C-002
- Blocks: None
