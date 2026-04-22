---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] ADM-Q-002: 오류 제보 목록 조회 및 필터링 (관리자 전용)"
labels: 'feature, backend, epic:E-ADMIN, priority:medium, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [ADM-Q-002] 오류 제보 관리자 목록 Query
- 목적: 관리자 백오피스에서 `ERROR_REPORT` 제보 내역을 상태, SLA 위험도, 제품 기준으로 조회할 수 있도록 한다. F4 운영의 읽기 관문이며, 48시간 SLA 준수 여부를 판단하는 실무용 목록 Query다.
- Epic / Phase: E-ADMIN / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS F4 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-025
- SRS F4 상세 시퀀스: [`/05_SRS_v1.md#6.3.3 상세 시퀀스: 오류 제보 → 수정 → 보상`](../05_SRS_v1.md)
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.2 Reliability`](../05_SRS_v1.md) — REQ-NF-012 (48시간 SLA)
- 관련 선행 명세: [`/TASKS/DATA-007_error_report_schema.md`](./DATA-007_error_report_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#47-e-admin-관리자-백오피스`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 관리자용 오류 제보 목록 Query 함수 정의
- [ ] 기본 정렬 규칙 구현
  - SLA 임박/초과 우선
  - 동일 우선순위에서는 최신 `reported_at DESC`
- [ ] 필터 구현
  - `status`
  - `product_id`
  - `reporter_id`
  - `sla_overdue`
- [ ] 목록 응답 DTO 설계
  - `report_id`, `product_id`, `field_name`, `status`, `reported_at`, `sla_deadline_at`, `reporter_email_masked`
- [ ] 관리자 권한 가드 구현
- [ ] 페이징 구현
- [ ] 단위 테스트 작성
  - 상태 필터
  - SLA 초과 우선 정렬
  - 관리자 권한 가드

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: SLA 초과 제보 우선 조회
- Given: `sla_deadline_at`을 초과한 제보와 그렇지 않은 제보가 함께 존재한다.
- When: 관리자 목록 Query를 호출한다.
- Then: SLA 초과 제보가 목록 상단에 우선 노출된다.

Scenario 2: 상태별 필터링
- Given: `SUBMITTED`, `REVIEWING`, `RESOLVED`, `REJECTED` 제보가 존재한다.
- When: `status=REVIEWING` 조건으로 조회한다.
- Then: `REVIEWING` 상태 제보만 반환된다.

Scenario 3: 제품 기준 필터링
- Given: 여러 제품에 대한 제보가 저장되어 있다.
- When: 특정 `product_id`로 필터링한다.
- Then: 해당 제품의 제보만 반환된다.

Scenario 4: 관리자 권한 차단
- Given: 일반 사용자가 목록 Query를 호출한다.
- When: 권한 검사를 수행한다.
- Then: `403 Forbidden` 또는 동등한 권한 오류가 반환된다.

Scenario 5: 마스킹된 제보자 식별 정보
- Given: 제보자 이메일이 연결된 제보 목록이 있다.
- When: 관리자가 목록을 조회한다.
- Then: 응답에는 마스킹된 식별 정보만 포함된다.

## :gear: Technical & Non-Functional Constraints
- 목록 Query는 읽기 전용이다. 상태 변경이나 데이터 수정 금지.
- SLA 위험도 계산은 `sla_deadline_at` 기반으로 일관되게 수행한다.
- 관리자 응답은 대시보드 렌더링에 필요한 최소 필드만 포함한다.
- 권한 검사는 서버 측에서 강제한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 상태/SLA/제품 기준 필터가 구현되는가?
- [ ] SLA 초과 우선 정렬이 구현되는가?
- [ ] 관리자 권한 가드가 포함되는가?
- [ ] 제보자 정보가 마스킹되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F4-C-001
- Blocks: #ADM-C-002, #UI-062
