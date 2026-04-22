---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-MON-002: Slack Webhook 알림 파이프라인 구축 (p95 > 3s 또는 5xx > 1% 시 즉시 알림, `#platform-risk`)"
labels: 'feature, infra, epic:E-NFR, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-MON-002] Slack Webhook 운영 알림 파이프라인
- 목적: API 응답 지연, 5xx 급증, 외부 API 장애 등 운영 리스크 이벤트를 Slack으로 즉시 전달한다. REQ-NF-021, REQ-NF-023을 실제 운영 대응 채널로 연결하는 알림 레이어다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 모니터링: [`/05_SRS_v1.md#4.2.5 Monitoring (운영/모니터링)`](../05_SRS_v1.md) — REQ-NF-021, REQ-NF-023
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Slack Webhook
- 관련 선행 태스크: [`/TASKS/NFR-MON-001_vercel_analytics_logs.md`](./NFR-MON-001_vercel_analytics_logs.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#64-모니터링로깅`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] Slack Webhook 채널/비밀키 관리 방식 정의
- [ ] 경보 조건 정의
  - p95 > 3s
  - 5xx > 1%
  - 제휴/외부 API 장애
- [ ] 알림 메시지 포맷 설계
  - 서비스
  - 환경
  - 임계치
  - 최근 요청 ID 또는 대시보드 링크
- [ ] dedup/window 정책 정의
- [ ] 심각도 레벨 분류
  - warning
  - critical
- [ ] 테스트/샌드박스 알림 채널 정책 문서화

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: p95 초과 알림
- Given: p95 응답 시간이 3초를 초과했다.
- When: 모니터링 파이프라인이 평가된다.
- Then: Slack `#platform-risk` 채널로 경고 메시지가 전송된다.

Scenario 2: 5xx 급증 알림
- Given: 5xx 비율이 1%를 초과했다.
- When: 경보 조건을 평가한다.
- Then: 즉시 알림이 전송된다.

Scenario 3: 외부 API 장애 알림
- Given: 제휴 API 또는 MFDS API 장애 이벤트가 발생했다.
- When: 장애 이벤트가 기록된다.
- Then: Slack으로 장애 정보가 전달된다.

Scenario 4: 중복 알림 억제
- Given: 동일 조건의 경보가 짧은 시간 내 반복 발생한다.
- When: 알림 파이프라인이 평가된다.
- Then: dedup 정책에 따라 과도한 중복 알림이 억제된다.

Scenario 5: 메시지 가독성
- Given: 실제 알림 메시지가 발송되었다.
- When: 운영자가 Slack에서 확인한다.
- Then: 어떤 서비스가 왜 위험 상태인지 빠르게 이해할 수 있다.

## :gear: Technical & Non-Functional Constraints
- 알림 지연은 즉시성에 가깝게 유지되어야 한다.
- 민감 정보나 전체 payload를 Slack에 그대로 보내지 않는다.
- dedup은 과도한 소음을 줄이되 critical 누락을 만들면 안 된다.
- 운영/개발 환경 분리가 필요하다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 경보 조건과 임계치가 문서화되는가?
- [ ] 메시지 포맷과 severity 레벨이 정의되는가?
- [ ] dedup/window 정책이 정의되는가?
- [ ] `SLACK_WEBHOOK_URL` 등 필요한 환경변수가 식별되는가?

## :construction: Dependencies & Blockers
- Depends on: #NFR-MON-001
- Blocks: #NFR-MON-004, #NFR-COST-001
