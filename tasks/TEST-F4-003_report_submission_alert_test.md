---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F4-003: [Unit Test] 오류 제보 접수 확인 알림 3초 이내 표시 + 예상 처리 시간(48h) 안내 검증"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F4-003] 오류 제보 접수 알림 단위 테스트
- 목적: F4-C-001의 오류 제보 접수 Server Action이 REQ-FUNC-024 AC를 충족하는지 검증한다: (1) 접수 확인 알림이 3초 이내 표시, (2) 예상 처리 시간(48시간) 안내 문구 포함. ERROR_REPORT 저장과 SLA 카운트다운 개시, 그리고 UI 친화적 응답 메시지가 함께 반환되어야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-024
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3 오류 제보·라벨 아카이브 업데이트`](../05_SRS_v1.md)
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-024
- 관련 구현 태스크: [`/TASKS/F4-C-001_error_report_submission.md`](./F4-C-001_error_report_submission.md), [`/TASKS/API-004_error_report_dto.md`](./API-004_error_report_dto.md), [`/TASKS/DATA-007_error_report_schema.md`](./DATA-007_error_report_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#54-f4-data-trust-system-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f4/report-submission.test.ts`
- [ ] F4-C-001의 `submitErrorReport()` Server Action 호출 성능 계측
- [ ] 정상 입력 → `status: SUBMITTED`, `sla_deadline_at` = 접수 시각 + 48h 검증
- [ ] 응답 메시지에 "48시간 이내" 등 SLA 문구 포함 검증 (i18n 키 또는 리터럴)
- [ ] Server Action 응답 시간 p95 ≤ 3,000ms 검증 (100회 반복)
- [ ] DB 저장 → 응답 반환의 일관성: 저장 실패 시 에러 반환 + DB 미변경
- [ ] 접수 ID 반환 → UI 토스트에서 "[제보 #12345]" 식별자 노출 가능성 검증
- [ ] 중복 제출 방지: 동일 FormData 2회 호출 시 2번째 응답 처리 확인 (스팸 차단은 TEST-F4-004에서 별도)

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 응답 시간 p95 ≤ 3초
- Given: ERROR_REPORT 테이블이 초기 상태다.
- When: 100회 연속 제보 접수를 호출한다.
- Then: p95 응답 시간이 3,000ms 이하다.

Scenario 2: SLA 메시지 포함
- Given: 정상 FormData가 제출된다.
- When: Server Action이 성공 응답을 반환한다.
- Then: 응답 본문에 "48시간" 또는 해당 i18n 키가 포함된다.

Scenario 3: `sla_deadline_at` 정확성
- Given: 접수 시각이 `T`다.
- When: 응답이 반환된다.
- Then: 저장된 레코드의 `sla_deadline_at`이 `T + 48h ± 1s` 범위 내에 있다.

Scenario 4: 접수 ID 반환
- Given: 정상 제출이 성공했다.
- When: 응답을 확인한다.
- Then: 응답에 UI가 사용 가능한 접수 ID(CUID 또는 숫자)가 포함된다.

Scenario 5: DB 저장 실패 시 에러 반환
- Given: DB 커넥션이 일시적으로 끊긴다.
- When: 제출이 시도된다.
- Then: Server Action은 5xx 에러를 반환하며 DB 상태가 변경되지 않는다.

## :gear: Technical & Non-Functional Constraints
- 실제 Resend/외부 알림은 TEST-F4-005에서 검증하고, 본 테스트는 DB 저장 + 응답 메시지에 집중한다.
- 시간 비교는 `Date.now()` 고정값으로 mocking하여 결정적 검증을 보장한다.
- API-004 DTO/스키마 위반은 즉시 실패한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 3초 응답 게이트가 CI에서 검증되는가?
- [ ] 48h SLA 문구 포함 및 `sla_deadline_at` 정확성이 박제되는가?
- [ ] 접수 ID 반환 계약이 테스트로 보호되는가?
- [ ] `pnpm test TEST-F4-003` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F4-C-001, #API-004, #DATA-007
- Blocks: None
