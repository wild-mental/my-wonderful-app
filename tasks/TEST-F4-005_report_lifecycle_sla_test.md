---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F4-005: [Integration Test] 오류 제보 전체 생명주기 테스트 (접수→검증→수정→이메일 알림→보상 지급, SLA 48h)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F4-005] 오류 제보 생명주기 통합 테스트 (SLA 48h)
- 목적: F4-C-001 → F4-C-003 → F4-C-004 → F4-C-005로 이어지는 오류 제보 생명주기 전체가 REQ-FUNC-025 및 REQ-FUNC-026 AC를 충족하는지 end-to-end로 검증한다. 상태 전이(SUBMITTED → REVIEWING → RESOLVED/REJECTED), 48h SLA 준수, Resend API 이메일 발송(수정 후 1시간 이내), 포인트·배지 리워드 지급을 결정적으로 재현한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-025, REQ-FUNC-026
- SRS 비기능: [`/05_SRS_v1.md#4.2`](../05_SRS_v1.md) — REQ-NF-023 (SLA 48h Slack 알림)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3 오류 제보 생명주기`](../05_SRS_v1.md)
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-025, TC-FUNC-026
- 관련 구현 태스크: [`/TASKS/F4-C-001_error_report_submission.md`](./F4-C-001_error_report_submission.md), [`/TASKS/F4-C-003_report_status_lifecycle.md`](./F4-C-003_report_status_lifecycle.md), [`/TASKS/F4-C-004_report_email_notification.md`](./F4-C-004_report_email_notification.md), [`/TASKS/F4-C-005_report_reward.md`](./F4-C-005_report_reward.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#54-f4-data-trust-system-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f4/report-lifecycle.integration.test.ts`
- [ ] Resend API Mock: 발송 성공/실패(5xx) 각 분기 재현
- [ ] Fake Timers로 시간 진행(`T+0` → `T+12h` → `T+48h` → `T+49h`) 제어
- [ ] 단계별 상태 전이 검증: SUBMITTED → REVIEWING → RESOLVED / SUBMITTED → REJECTED
- [ ] 허용되지 않는 전이(예: RESOLVED → SUBMITTED) 차단 검증
- [ ] RESOLVED 확정 시 F4-C-004 이메일 발송 호출 + 1시간 이내 발송 검증
- [ ] F4-C-005 리워드 지급 호출 및 USER의 포인트/배지 상태 업데이트 검증
- [ ] SLA 48h 초과 시 Slack 알림 트리거 스파이(REQ-NF-023, NFR-MON-004와 연동) 호출 여부 검증
- [ ] REJECTED 경로: 이메일 발송은 "미확인 사유" 템플릿, 리워드 미지급
- [ ] 동시성 테스트: 같은 report에 대한 동시 상태 변경 시도 시 낙관적 락 또는 DB 제약으로 차단

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 정상 해결 경로 (SLA 준수)
- Given: T=0에 제보가 SUBMITTED로 접수되었다.
- When: T+12h에 관리자가 REVIEWING→RESOLVED로 전이시킨다.
- Then: 최종 상태가 RESOLVED이고, RESOLVED 전이 후 1시간 이내 이메일이 발송되며, 리워드가 지급된다.

Scenario 2: 반려 경로
- Given: T=0에 제보가 접수되었다.
- When: T+24h에 REJECTED로 전이된다.
- Then: "미확인 사유" 이메일이 발송되고, 리워드는 지급되지 않는다.

Scenario 3: SLA 48h 초과 알림
- Given: T=0 접수 후 SUBMITTED 상태 그대로 T+48h+1분이 경과했다.
- When: SLA 감시 루틴이 동작한다.
- Then: Slack 알림 스파이가 1회 호출된다(REQ-NF-023).

Scenario 4: 허용되지 않는 상태 전이 차단
- Given: 현재 상태가 RESOLVED다.
- When: SUBMITTED로 되돌리는 전이를 시도한다.
- Then: 400/409 에러가 반환되고 상태가 변경되지 않는다.

Scenario 5: 이메일 발송 실패 재시도
- Given: Resend API가 첫 호출에서 5xx를 반환한다.
- When: F4-C-004가 동작한다.
- Then: 지수 백오프로 재시도되며, 최종 실패 시 관리자 알림과 수동 재발송 큐 적재가 발생한다.

Scenario 6: 리워드 멱등성
- Given: 동일 report에 대해 RESOLVED 이벤트가 중복 발생한다.
- When: F4-C-005가 호출된다.
- Then: 리워드가 1회만 지급된다(멱등 키 보장).

Scenario 7: 동시 상태 변경 방지
- Given: 두 관리자가 동시에 같은 report를 REVIEWING으로 전이시키려 한다.
- When: 충돌 감지 로직이 동작한다.
- Then: 둘 중 하나만 성공하고 다른 쪽은 409 충돌 에러를 받는다.

## :gear: Technical & Non-Functional Constraints
- 외부 의존성(Resend, Slack, Mixpanel)은 모두 모킹하고 호출 인자·횟수를 스파이로 검증한다.
- 시간 제어는 Fake Timers 또는 의존성 주입된 clock으로 결정적이어야 한다.
- DB는 트랜잭션 격리가 보장된 환경에서 테스트하며, 각 시나리오 후 롤백한다.
- 48h SLA 카운트는 `sla_deadline_at` 컬럼(DATA-007) 기준으로 계산한다.
- 리워드 멱등 키는 `report_id:status_transition_id` 형식으로 가정한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 정상 해결 + 반려 + SLA 초과 3분기가 모두 커버되는가?
- [ ] 이메일 재시도·리워드 멱등성·동시성 차단이 테스트로 보호되는가?
- [ ] 허용되지 않는 상태 전이가 enum FSM 수준에서 차단되는가?
- [ ] `pnpm test TEST-F4-005` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F4-C-001, #F4-C-003, #F4-C-004, #F4-C-005
- Blocks: #NFR-MON-004 (SLA Slack 알림 구현 전제 테스트)
