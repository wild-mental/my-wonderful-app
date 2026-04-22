---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F4-004: [Unit Test] 스팸/중복 제보 차단 테스트 (동일 제품 24h 5건+ 차단, 빈 문자열 400 에러, 유효 제보 미영향)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F4-004] 스팸·중복 제보 필터링 단위 테스트
- 목적: F4-C-002의 스팸 필터링 로직이 REQ-FUNC-027 AC를 충족하는지 검증한다: (1) 동일 제품 24h 내 5건+ 차단, (2) 빈 문자열 제출 400 에러, (3) 정상 제보는 영향받지 않음(false positive ≤ 2%), (4) 전체 차단 정확도 ≥ 95%. 사용자 식별자(로그인) 및 IP·쿠키(비로그인) 양쪽 축에서 결정적으로 동작해야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-027
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-027
- 관련 구현 태스크: [`/TASKS/F4-C-002_spam_filter.md`](./F4-C-002_spam_filter.md), [`/TASKS/F4-C-001_error_report_submission.md`](./F4-C-001_error_report_submission.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#54-f4-data-trust-system-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f4/spam-filter.test.ts`
- [ ] 24h 윈도우 5건+ 차단 시나리오: 동일 user + 동일 product_id로 1~4건 허용, 5번째 차단
- [ ] 24h+1h 경과 후 카운트 리셋 검증 (rolling window)
- [ ] 빈 문자열/공백만 구성된 본문 400 에러
- [ ] 구조화 폼 필수 필드(REQ-FUNC-028 참조) 누락 시 400 에러
- [ ] 유효 제보 false positive ≤ 2%: 정상 50건 + 스팸 50건 혼합 샘플에서 정확도/오차단률 계산
- [ ] IP·쿠키 기반 식별자 차단 경로 테스트 (비로그인 컨텍스트)
- [ ] 차단 메시지: "중복 또는 불완전한 제보입니다" 문구 포함 검증
- [ ] 차단 기록의 감사 로깅 (Sentry breadcrumb 또는 DB count)

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 24h 내 5번째 제출 차단
- Given: 동일 사용자가 product_A에 대해 24h 내 4건 제출한 상태다.
- When: 5번째 제출을 시도한다.
- Then: 429 또는 400 에러와 "중복 또는 불완전한 제보입니다" 메시지가 반환된다.

Scenario 2: 24h 경과 후 카운트 리셋
- Given: 마지막 제출로부터 24h+1분이 경과했다.
- When: 새 제출을 시도한다.
- Then: 정상 접수되며 카운트가 1로 리셋된다.

Scenario 3: 빈 문자열 차단
- Given: 본문 필드가 공백만 있는 문자열이다.
- When: 제출을 시도한다.
- Then: 400 에러가 반환되며 DB에 저장되지 않는다.

Scenario 4: 다른 제품·다른 사용자 미영향
- Given: user_A가 product_A에 5건 제출해 차단된 상태다.
- When: user_A가 product_B에, user_B가 product_A에 각각 1건 제출한다.
- Then: 두 제출 모두 정상 접수된다.

Scenario 5: 비로그인 IP·쿠키 차단
- Given: 비로그인 동일 IP + 동일 쿠키가 product_A에 5건 제출했다.
- When: 6번째 제출을 시도한다.
- Then: 차단되고 해당 IP/쿠키 관점에서 카운트가 증가한다.

Scenario 6: 정확도·오차단률 기준
- Given: 100건 혼합 샘플(정상 50 + 스팸 50)이 있다.
- When: 필터를 적용한다.
- Then: 차단 정확도 ≥ 95%, 정상 제보 false positive ≤ 2%.

## :gear: Technical & Non-Functional Constraints
- 24h 윈도우는 DB 인덱스 `(product_id, submitted_by, submitted_at DESC)` 기반으로 동작해야 하며, 풀스캔 금지.
- 빈 문자열 검증은 API-004 Zod 스키마와 이중 방어가 되어야 한다.
- 시간 관련 테스트는 Fake Timers로 결정적으로 재현한다.
- 차단 시나리오도 audit 로그에 기록되어 관리자가 오차단 원인을 역추적할 수 있어야 한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 24h 윈도우 + rolling 리셋이 Fake Timers로 검증되는가?
- [ ] 빈 문자열 400 + 구조화 필드 누락 400이 모두 보호되는가?
- [ ] 정확도 ≥ 95% / false positive ≤ 2% 게이트가 통과하는가?
- [ ] IP·쿠키 기반 식별자 차단이 테스트에 포함되는가?
- [ ] `pnpm test TEST-F4-004` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F4-C-002, #F4-C-001
- Blocks: None
