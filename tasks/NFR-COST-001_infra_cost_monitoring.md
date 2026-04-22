---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-COST-001: 월간 인프라 비용 모니터링 + 8만원 초과 시 Slack `#infra-cost` 자동 경고 설정"
labels: 'feature, infra, epic:E-NFR, priority:medium, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-COST-001] 인프라 비용 모니터링 및 경고
- 목적: Vercel, Supabase 등 MVP 핵심 인프라 비용을 월 단위로 추적하고 8만 원 초과 시 자동 경고를 보낸다. REQ-NF-019, REQ-NF-020의 비용 제어 기준을 운영 액션으로 바꾼다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 비용: [`/05_SRS_v1.md#4.2.4 Cost (비용)`](../05_SRS_v1.md) — REQ-NF-019, REQ-NF-020
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-3
- 관련 선행 태스크: [`/TASKS/NFR-001_vercel_deployment.md`](./NFR-001_vercel_deployment.md), [`/TASKS/NFR-002_supabase_postgresql.md`](./NFR-002_supabase_postgresql.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#65-비용-관리`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 비용 소스 목록 정의
  - Vercel
  - Supabase
  - 기타 API/이메일 공급자
- [ ] 월간 비용 집계 방식 정의
- [ ] 원화 기준 8만 원 경고 임계치 고정
- [ ] Slack `#infra-cost` 경보 포맷 정의
- [ ] 예산 대비 사용률 계산 규칙 정의
- [ ] 비용 이상 징후 대응 체크리스트 작성

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 임계치 미만
- Given: 월간 누적 비용이 8만 원 미만이다.
- When: 비용 점검을 수행한다.
- Then: 경고가 발송되지 않는다.

Scenario 2: 임계치 초과
- Given: 월간 누적 비용이 8만 원을 초과했다.
- When: 비용 점검을 수행한다.
- Then: Slack `#infra-cost` 채널에 경고가 발송된다.

Scenario 3: 서비스별 비용 구분
- Given: Vercel과 Supabase 비용이 각각 집계된다.
- When: 리포트를 확인한다.
- Then: 어떤 서비스가 비용 상승 원인인지 구분할 수 있다.

Scenario 4: 예산 대비 사용률 표시
- Given: 월 중간 시점이다.
- When: 비용 현황을 본다.
- Then: 예산 대비 사용률을 확인할 수 있다.

Scenario 5: 대응 가능 메시지
- Given: 경고 메시지가 발송되었다.
- When: 운영자가 확인한다.
- Then: 어느 서비스의 비용을 줄여야 할지 판단할 수 있다.

## :gear: Technical & Non-Functional Constraints
- 비용 수집 주기와 환산 기준은 일관되어야 한다.
- 단순 총액뿐 아니라 서비스별 분해가 가능해야 한다.
- 비용 경보는 운영 소음이 되지 않도록 월별/주별 window를 명시한다.
- 실제 결제 정보나 민감한 청구 세부정보를 Slack에 과도하게 노출하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 비용 소스와 집계 규칙이 문서화되는가?
- [ ] 8만 원 초과 경고 기준이 명시되는가?
- [ ] Slack 메시지 포맷과 채널이 정의되는가?
- [ ] 서비스별 비용 분해가 가능한 구조가 정의되는가?

## :construction: Dependencies & Blockers
- Depends on: #NFR-001, #NFR-002
- Blocks: #NFR-COST-002
