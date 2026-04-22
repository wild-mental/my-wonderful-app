---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F4-006: [Unit Test] 구조화된 제보 폼 필드 유효성 검증 (필드명, 기존 값, 올바른 값 필수, 근거 선택)"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F4-006] 구조화 제보 폼 유효성 단위 테스트
- 목적: F4-C-001의 제보 접수 Server Action이 사용하는 API-004 FormData 스키마가 REQ-FUNC-028 AC를 충족하는지 검증한다. 구조화된 폼은 (1) 필드명, (2) 기존 값, (3) 올바른 값, (4) 근거 자료(선택)의 4필드를 수용하며 앞 3개는 필수다. Zod 스키마와 Server Action 양쪽 방어선에서 일관된 실패 메시지를 반환해야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-028
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-028
- 관련 구현 태스크: [`/TASKS/API-004_error_report_dto.md`](./API-004_error_report_dto.md), [`/TASKS/F4-C-001_error_report_submission.md`](./F4-C-001_error_report_submission.md), [`/TASKS/DATA-007_error_report_schema.md`](./DATA-007_error_report_schema.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#54-f4-data-trust-system-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f4/structured-form-validation.test.ts`
- [ ] API-004 Zod 스키마 import 및 4개 필드 제약 단위 검증
- [ ] 필수 필드 누락 시 400 에러 + 필드별 에러 메시지 맵 반환 검증
- [ ] 필드 길이 상한(예: 필드명 ≤ 100자, 값 ≤ 2,000자) 경계 테스트
- [ ] `evidence_url`(선택)이 주어질 때 HTTPS 포맷 검증
- [ ] `evidence_url` 미제출 시 `null` 허용, 빈 문자열은 400으로 거부
- [ ] HTML/XSS 페이로드 입력 시 sanitization 또는 escape 적용 검증
- [ ] 금지 표현(F2-C-002) 입력 시 경고 또는 차단 플래그 확인(연동 방식 존재 시)
- [ ] 한글·특수문자·이모지 입력 정상 허용
- [ ] Server Action 계층에서 스키마 위반 시 DB 저장이 수행되지 않는 이중 방어 검증

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 필수 3필드 누락
- Given: 필드명·기존값·올바른값 중 하나를 누락한 FormData다.
- When: 스키마 파싱을 시도한다.
- Then: 400 에러와 함께 누락 필드 목록이 에러 응답에 포함된다.

Scenario 2: 필드 길이 상한 초과
- Given: 필드명이 101자다.
- When: 스키마 파싱을 시도한다.
- Then: `field_name` 필드에 대한 길이 초과 메시지가 반환된다.

Scenario 3: `evidence_url` 선택 허용
- Given: `evidence_url` 필드가 누락된 정상 FormData다.
- When: 스키마 파싱을 시도한다.
- Then: 성공하며 `evidence_url`은 `null`로 저장된다.

Scenario 4: `evidence_url` 포맷 검증
- Given: `evidence_url` 값이 `ftp://...`다.
- When: 파싱을 시도한다.
- Then: HTTPS URL 포맷 위반으로 400 에러가 반환된다.

Scenario 5: XSS 페이로드 sanitization
- Given: 필드 값에 `<script>` 태그 문자열이 포함된다.
- When: 저장이 시도된다.
- Then: 리터럴 `<script>` 문자가 DB에 저장되지 않거나 escape된 형태로 저장되며, 추후 렌더링 시에도 실행되지 않는다.

Scenario 6: 한글·이모지 허용
- Given: 필드 값에 한글·이모지가 혼재한다.
- When: 파싱·저장을 수행한다.
- Then: 정상 저장되며 인코딩 깨짐이 없다.

Scenario 7: 이중 방어 (Zod + Server Action)
- Given: Zod를 우회하는 저수준 입력이 주입된다.
- When: Server Action이 실행된다.
- Then: Server Action 내부 validation이 재검증하여 DB 저장을 차단한다.

## :gear: Technical & Non-Functional Constraints
- 스키마는 API-004의 단일 SSOT로 관리되며, Zod → TypeScript 타입 파생으로 계약 일관성을 유지한다.
- 에러 응답 형식은 API-008 공통 에러 스키마와 일치해야 한다.
- Sanitization은 서버 저장·응답·UI 렌더 3단계 모두에서 일관되어야 한다(defense-in-depth).
- 테스트는 DB I/O 없이 순수 Zod 파싱 경로와 Server Action mock 2가지로 분리한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 필수 3필드 누락/길이 초과/URL 포맷 검증이 모두 보호되는가?
- [ ] `evidence_url` 선택 허용과 빈 문자열 거부가 테스트로 박제되는가?
- [ ] XSS sanitization과 한글·이모지 허용이 함께 검증되는가?
- [ ] `pnpm test TEST-F4-006` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #API-004, #F4-C-001, #DATA-007
- Blocks: None
