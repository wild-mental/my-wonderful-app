---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] ADM-C-001: 등록 요청 건별 처리 상태 관리 (승인/반려/보류)"
labels: 'feature, backend, epic:E-ADMIN, priority:medium, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [ADM-C-001] 등록 요청 상태 관리 Command
- 목적: 관리자가 미등록 제품 등록 요청을 승인, 반려, 보류 상태로 처리할 수 있게 한다. REQ-FUNC-032의 관리 단계이며, 요청 목록 조회 이후의 실제 백오피스 운영 액션을 담당한다.
- Epic / Phase: E-ADMIN / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 공통 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-032
- 관련 DTO 명세: [`/TASKS/API-005_product_registration_dto.md`](./API-005_product_registration_dto.md) — `RegistrationStatus`
- 선행 Query 태스크: [`/TASKS/ADM-Q-001_registration_request_list_query.md`](./ADM-Q-001_registration_request_list_query.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#47-e-admin-관리자-백오피스`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 등록 요청 상태 변경 Command 함수 정의
- [ ] 허용 상태 전이 규칙 구현
  - `PENDING -> APPROVED | REJECTED | ON_HOLD`
  - `ON_HOLD -> APPROVED | REJECTED`
  - 종료 상태 재변경 정책 명시
- [ ] 관리자 권한 가드 구현
- [ ] 상태 변경 사유/메모 입력 지원
  - `REJECTED`, `ON_HOLD`는 사유 필수
- [ ] 감사 로그 필드 반영
  - `reviewed_at`, `reviewed_by`
- [ ] 승인 시 후속 액션 훅 정의
  - 실제 PRODUCT 등록 자동화 여부는 후행 태스크로 분리
- [ ] 테스트 작성
  - 승인
  - 반려
  - 보류
  - 잘못된 전이 차단

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 보류 중 요청 승인
- Given: `ON_HOLD` 상태의 등록 요청이 존재한다.
- When: 관리자가 `APPROVED`로 상태를 변경한다.
- Then: 요청 상태가 `APPROVED`로 갱신되고 `reviewed_at`, `reviewed_by`가 기록된다.

Scenario 2: 반려 사유 필수
- Given: `PENDING` 상태 요청이 존재한다.
- When: 관리자가 사유 없이 `REJECTED`로 변경하려 한다.
- Then: 상태 변경은 거부되고 사유 필수 검증 오류가 반환된다.

Scenario 3: 권한 없는 사용자 차단
- Given: 관리자가 아닌 사용자가 상태 변경 Command를 호출한다.
- When: 권한 검사를 수행한다.
- Then: `403 Forbidden` 또는 동등한 권한 오류가 반환된다.

Scenario 4: 종료 상태 재변경 정책
- Given: 이미 `APPROVED` 상태인 요청이 존재한다.
- When: 다시 `REJECTED`로 변경하려 한다.
- Then: 허용되지 않는 전이로 차단되거나 명시된 운영 정책에 따라 거부된다.

Scenario 5: 감사 필드 기록
- Given: 관리자가 요청 상태를 처리했다.
- When: 저장 결과를 조회한다.
- Then: 누가 언제 처리했는지 감사 필드가 남는다.

## :gear: Technical & Non-Functional Constraints
- 승인/반려/보류 상태 전이 규칙은 코드로 고정되어야 하며 UI에만 의존하면 안 된다.
- 본 태스크는 상태 관리에 집중한다. 실제 PRODUCT 생성, 알림 발송, 이벤트 추적은 별도 태스크로 분리한다.
- 관리자 워크플로는 감사 가능해야 한다. 처리자와 처리 시각 기록 필수.
- 권한 검사는 서버 측에서 강제되어야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 허용 상태 전이 규칙이 코드와 테스트로 명시되는가?
- [ ] 반려/보류 사유 검증이 포함되는가?
- [ ] 감사 필드가 기록되는가?
- [ ] 관리자 권한 가드가 구현되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #ADM-Q-001
- Blocks: #UI-061
