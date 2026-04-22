---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-SEC-003: 금지 표현 목록 관리 체계 구축 (건강기능식품법 준수, 뱃지 텍스트 질병 치료 표현 차단 룰셋)"
labels: 'feature, security, epic:E-NFR, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-SEC-003] 금지 표현 룰셋 거버넌스
- 목적: 질병 예방·치료 표현 차단 로직을 단발 구현에 그치지 않고, 사전 버전 관리, 검토 승인, 테스트 게이트, 운영 알림을 포함한 관리 체계로 만든다. REQ-NF-017과 CON-2를 지속 가능한 운영 정책으로 전환한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 보안/개인정보: [`/05_SRS_v1.md#4.2.3 Security (보안/개인정보)`](../05_SRS_v1.md) — REQ-NF-017
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-2
- 관련 구현 태스크: [`/TASKS/F2-C-002_prohibited_expression_validator.md`](./F2-C-002_prohibited_expression_validator.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#63-보안`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 금지 표현 사전의 저장 위치/형식/버전 정책 문서화
- [ ] 사전 변경 승인 프로세스 정의
  - 법률 검토자 1인 + 백엔드 리드 1인
- [ ] 사전 변경 시 자동 테스트 게이트 정의
  - 금지 표현 regression
  - 허용 표현 예외
- [ ] 운영 중 검출 이벤트 대응 절차 작성
  - Slack/Sentry 알림
  - hotfix 우선순위
- [ ] 분기별 룰셋 리뷰 일정 정의
- [ ] 룰셋 변경 이력 포맷 정의
  - `version`, `last_reviewed_at`, `reviewed_by`, `change_reason`

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 사전 변경 승인 강제
- Given: 금지 표현 사전 변경 PR이 생성되었다.
- When: 승인 절차를 확인한다.
- Then: 법률 검토와 기술 검토가 모두 없으면 머지되지 않는다.

Scenario 2: 변경 시 자동 테스트 실행
- Given: 금지 표현 사전이 수정되었다.
- When: CI를 실행한다.
- Then: 금지/허용 표현 회귀 테스트가 자동 실행된다.

Scenario 3: 운영 검출 대응
- Given: 프로덕션에서 금지 표현 검출 이벤트가 발생했다.
- When: 운영 알림을 수신한다.
- Then: 대응 절차에 따라 즉시 triage가 시작된다.

Scenario 4: 버전 추적 가능
- Given: 현재 룰셋이 배포 중이다.
- When: 메타데이터를 조회한다.
- Then: 누가 언제 어떤 사유로 룰셋을 수정했는지 추적할 수 있다.

Scenario 5: 정기 리뷰 수행
- Given: 분기 검토 시점이 도래했다.
- When: 룰셋 리뷰를 수행한다.
- Then: 최신 규제/우회 패턴이 반영된다.

## :gear: Technical & Non-Functional Constraints
- 금지 표현 검증 실패는 보안/법률 사고로 분류한다.
- 룰셋은 코드와 동일한 수준으로 버전 관리되어야 한다.
- 런타임에서 임의 수정되는 hot-reload 방식은 금지한다.
- 운영 경보는 중복 알림 억제 규칙을 가져야 하지만, critical 누락은 없어야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 룰셋 저장/승인/배포 프로세스가 문서화되는가?
- [ ] CI 테스트 게이트가 정의되는가?
- [ ] 운영 검출 대응 절차가 포함되는가?
- [ ] 분기 리뷰 정책과 버전 메타데이터 규칙이 정의되는가?

## :construction: Dependencies & Blockers
- Depends on: #F2-C-002
- Blocks: #NFR-MON-002, #TEST-F2-003
