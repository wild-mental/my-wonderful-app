---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] ADM-C-002: 오류 제보 검증·수정·반려 처리 (관리자 워크플로)"
labels: 'feature, backend, epic:E-ADMIN, priority:medium, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [ADM-C-002] 오류 제보 관리자 처리 워크플로
- 목적: 관리자가 오류 제보를 검증하고, 실제 데이터 수정 또는 반려를 수행하며, `ERROR_REPORT` 상태를 생명주기에 맞게 갱신할 수 있도록 한다. F4의 48시간 SLA를 관리자 운영 플로우로 구체화한 Command 태스크다.
- Epic / Phase: E-ADMIN / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS F4 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-025, REQ-FUNC-026
- SRS F4 상세 시퀀스: [`/05_SRS_v1.md#6.3.3 상세 시퀀스: 오류 제보 → 수정 → 보상`](../05_SRS_v1.md)
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.2 Reliability`](../05_SRS_v1.md) — REQ-NF-012
- 관련 선행 명세: [`/TASKS/DATA-007_error_report_schema.md`](./DATA-007_error_report_schema.md)
- 관련 선행 Query 태스크: [`/TASKS/ADM-Q-002_error_report_list_query.md`](./ADM-Q-002_error_report_list_query.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#47-e-admin-관리자-백오피스`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 관리자 처리 Command 정의
  - 입력: `report_id`, `action`, `review_note`, `reject_reason?`
- [ ] 처리 액션 지원
  - `start_review`
  - `resolve`
  - `reject`
- [ ] 상태 전이 규칙 연동
  - `SUBMITTED -> REVIEWING`
  - `REVIEWING -> RESOLVED | REJECTED`
- [ ] 실제 데이터 수정 훅 정의
  - 관련 PRODUCT/INGREDIENT/BADGE 데이터 수정은 트랜잭션 또는 후행 서비스 호출로 연결
- [ ] 반려 사유 필수 검증
- [ ] 처리자/처리 시각 기록
- [ ] SLA 초과 여부 계산 및 로그 메타데이터 포함
- [ ] 후속 트리거 연계 포인트 정의
  - 이메일 알림(F4-C-004)
  - 보상 지급(F4-C-005)
- [ ] 테스트 작성
  - 검토 시작
  - 해결 완료
  - 반려
  - 잘못된 전이 차단

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 검토 시작
- Given: `SUBMITTED` 상태의 오류 제보가 있다.
- When: 관리자가 `start_review` 액션을 수행한다.
- Then: 제보 상태가 `REVIEWING`으로 변경되고 `reviewed_at`, `reviewed_by`가 기록된다.

Scenario 2: 수정 완료 처리
- Given: `REVIEWING` 상태의 유효한 오류 제보가 있다.
- When: 관리자가 실제 데이터 수정 후 `resolve` 액션을 수행한다.
- Then: 제보 상태가 `RESOLVED`가 되고 후속 이메일/보상 트리거에 필요한 메타데이터가 남는다.

Scenario 3: 반려 처리
- Given: `REVIEWING` 상태의 오류 제보가 있다.
- When: 관리자가 사유를 포함해 `reject` 액션을 수행한다.
- Then: 제보 상태가 `REJECTED`로 변경되고 반려 사유가 저장된다.

Scenario 4: 허용되지 않는 전이 차단
- Given: `SUBMITTED` 상태 제보가 있다.
- When: 관리자가 바로 `resolve` 액션을 수행하려 한다.
- Then: 상태 전이 규칙에 의해 차단된다.

Scenario 5: SLA 추적 가능성
- Given: 48시간에 근접하거나 초과한 제보가 있다.
- When: 관리자가 처리 액션을 수행한다.
- Then: 로그/메타데이터에서 SLA 초과 여부를 식별할 수 있다.

## :gear: Technical & Non-Functional Constraints
- 상태 전이는 DATA-007의 상태 머신을 반드시 따른다.
- 관리자 처리 워크플로는 감사 가능해야 하며, 누가 언제 어떤 액션을 했는지 기록해야 한다.
- 실제 데이터 수정과 상태 변경은 가능한 한 원자적으로 처리하거나 실패 복구 전략을 명시해야 한다.
- 이메일 발송과 보상 지급은 이 태스크에서 직접 완료하지 않고 후속 태스크 훅으로 연결한다.
- SLA 48시간 준수를 방해하지 않도록 처리 경로는 단순하고 명확해야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 허용 액션과 상태 전이 규칙이 코드로 구현되는가?
- [ ] 반려 사유 검증이 포함되는가?
- [ ] 처리자/처리 시각/리뷰 메모가 기록되는가?
- [ ] 이메일/보상 후속 트리거 연계 포인트가 문서화되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #ADM-Q-002, #F4-C-003
- Blocks: #UI-062, #F4-C-004, #F4-C-005, #TEST-F4-005
