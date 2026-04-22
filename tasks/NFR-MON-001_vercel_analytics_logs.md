---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-MON-001: Vercel Analytics + Vercel Logs 연동 설정 (API 응답 시간, 에러 코드 집계)"
labels: 'feature, infra, epic:E-NFR, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-MON-001] Vercel Analytics/Logs 모니터링 연동
- 목적: API 응답 시간, 에러 코드, 캐시 hit/miss, 주요 운영 이벤트를 Vercel Analytics 및 Vercel Logs로 수집한다. REQ-NF-021의 모니터링 기반을 마련해 이후 Slack 알림과 비용/성능 운영 태스크의 데이터 소스로 사용한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 모니터링: [`/05_SRS_v1.md#4.2.5 Monitoring (운영/모니터링)`](../05_SRS_v1.md) — REQ-NF-021
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Vercel Analytics / Logs / Slack Webhook
- 관련 선행 태스크: [`/TASKS/NFR-001_vercel_deployment.md`](./NFR-001_vercel_deployment.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#64-모니터링로깅`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Vercel Analytics 활성화 절차 문서화
- [ ] Vercel Logs 수집 대상 이벤트 목록 정의
  - `duration_ms`, `status_code`, `error_code`, `request_id`
- [ ] 구조화 로그 포맷 표준 정의
- [ ] 핵심 API 모니터링 지표 정의
  - F1 compare p95
  - F2 badge p95
  - 5xx 비율
  - cache hit/miss
- [ ] 로그 샘플/필드 가이드 작성
- [ ] 운영 대시보드 기본 뷰 정의

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: API 응답 시간 수집
- Given: Route Handler가 요청을 처리한다.
- When: 요청이 종료된다.
- Then: 응답 시간 메트릭이 Analytics/Logs에 기록된다.

Scenario 2: 에러 코드 집계
- Given: API-008 기반 에러 응답이 발생한다.
- When: 로그를 확인한다.
- Then: `error_code`와 HTTP 상태 코드가 함께 수집된다.

Scenario 3: 구조화 로그 포맷 유지
- Given: F1/F2/F4 관련 서버 로그가 발생한다.
- When: 로그를 조회한다.
- Then: 공통 키(`event`, `request_id`, `duration_ms`)가 일관되게 존재한다.

Scenario 4: 핵심 지표 대시보드 확인 가능
- Given: 모니터링 연동이 완료되었다.
- When: 운영자가 대시보드를 확인한다.
- Then: p95와 5xx 비율을 한눈에 볼 수 있다.

Scenario 5: 후속 알림 태스크 연계 가능
- Given: 로그/메트릭 수집이 동작 중이다.
- When: NFR-MON-002가 Slack 알림 조건을 붙인다.
- Then: 필요한 입력 데이터가 이미 준비되어 있다.

## :gear: Technical & Non-Functional Constraints
- 구조화 로그는 JSON 친화적이어야 하며 free-form 문자열만 남기지 않는다.
- 개인정보는 로그에서 마스킹 또는 제외한다.
- 모니터링 필드는 Route Handler/Server Action 전반에서 재사용 가능해야 한다.
- 로그 volume이 과도하게 증가하지 않도록 샘플링/중복 억제 전략을 고려한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] Analytics/Logs 수집 대상 필드가 문서화되는가?
- [ ] 구조화 로그 포맷 표준이 정의되는가?
- [ ] 핵심 API 지표 뷰가 정의되는가?
- [ ] NFR-MON-002/003/004가 사용할 입력 메트릭이 식별되는가?

## :construction: Dependencies & Blockers
- Depends on: #NFR-001
- Blocks: #NFR-MON-002, #NFR-MON-003
