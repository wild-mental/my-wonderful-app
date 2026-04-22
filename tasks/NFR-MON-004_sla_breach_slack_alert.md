---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-MON-004: SLA 48시간 초과 제보 발생 시 Slack 자동 알림 구현"
labels: 'feature, infra, epic:E-NFR, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-MON-004] 오류 제보 SLA 초과 알림
- 목적: `ERROR_REPORT`가 48시간 SLA를 초과했을 때 Slack으로 자동 경보를 발송해 운영 누락을 줄인다. REQ-NF-023을 F4 제보 생명주기와 직접 연결하는 특화 알림 태스크다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 신뢰성: [`/05_SRS_v1.md#4.2.2 Reliability (신뢰성/가용성)`](../05_SRS_v1.md) — REQ-NF-012
- SRS 모니터링: [`/05_SRS_v1.md#4.2.5 Monitoring (운영/모니터링)`](../05_SRS_v1.md) — REQ-NF-023
- SRS 오류 제보 시퀀스: [`/05_SRS_v1.md#6.3.3 상세 시퀀스: 오류 제보 → 수정 → 보상`](../05_SRS_v1.md)
- 관련 구현 태스크: [`/TASKS/F4-C-003_report_status_lifecycle.md`](./F4-C-003_report_status_lifecycle.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#64-모니터링로깅`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] SLA 초과 판정 기준 정의
  - `reported_at -> now > 48h`
  - 상태가 `SUBMITTED` 또는 `REVIEWING`
- [ ] 대상 조회 쿼리 정의
- [ ] Slack 알림 메시지 포맷 정의
  - `report_id`, `product_id`, 경과 시간, 현재 상태
- [ ] 반복 알림 정책 정의
  - 최초 초과 시 1회
  - 이후 주기적 재알림 여부 결정
- [ ] 수동 해결/재오픈 시 알림 상태 정합성 정의

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: SUBMITTED 상태 SLA 초과 알림
- Given: 접수 후 49시간이 지난 `SUBMITTED` 제보가 있다.
- When: SLA 점검 로직을 수행한다.
- Then: Slack 경보가 발송된다.

Scenario 2: REVIEWING 상태 SLA 초과 알림
- Given: `REVIEWING` 상태로 48시간을 넘긴 제보가 있다.
- When: 점검 로직을 수행한다.
- Then: Slack 경보가 발송된다.

Scenario 3: 이미 해결된 제보 제외
- Given: `RESOLVED` 상태 제보가 있다.
- When: SLA 점검 로직을 수행한다.
- Then: 알림 대상에서 제외된다.

Scenario 4: 중복 알림 제어
- Given: 같은 제보가 계속 SLA 초과 상태다.
- When: 점검이 반복 실행된다.
- Then: 정의된 정책에 따라 과도한 중복 알림이 억제된다.

Scenario 5: 메시지 실행 가능성
- Given: 운영자가 Slack 메시지를 받았다.
- When: 메시지를 확인한다.
- Then: 어떤 제보를 우선 처리해야 하는지 바로 알 수 있다.

## :gear: Technical & Non-Functional Constraints
- SLA 기준은 48시간 절대 시간 기준이다.
- 해결된 제보나 반려된 제보는 초과 알림 대상이 아니다.
- 운영 소음을 줄이기 위한 dedup이 필요하지만, 누락은 허용하지 않는다.
- 알림 payload에는 민감 정보 대신 추적에 필요한 최소 식별자만 포함한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] SLA 초과 판정 규칙이 명시되는가?
- [ ] 알림 대상 상태와 제외 상태가 명확히 정의되는가?
- [ ] 메시지 포맷과 dedup 정책이 정의되는가?
- [ ] `SLACK_WEBHOOK_URL` 및 실행 주기 입력이 식별되는가?

## :construction: Dependencies & Blockers
- Depends on: #F4-C-003, #NFR-MON-002
- Blocks: None
