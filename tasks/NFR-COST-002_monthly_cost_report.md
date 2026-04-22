---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-COST-002: 월 1회 클라우드 비용 리포트 자동 생성 파이프라인 (경영진 공유용)"
labels: 'feature, infra, epic:E-NFR, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-COST-002] 월간 비용 리포트 자동화
- 목적: 월 1회 인프라 비용 리포트를 생성해 경영진/운영진에게 공유할 수 있는 형태로 정리한다. 단순 경고를 넘어서 비용 추세와 원인 분석을 남기는 운영 문서 자동화 태스크다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 비용: [`/05_SRS_v1.md#4.2.4 Cost (비용)`](../05_SRS_v1.md) — REQ-NF-020
- 관련 선행 태스크: [`/TASKS/NFR-COST-001_infra_cost_monitoring.md`](./NFR-COST-001_infra_cost_monitoring.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#65-비용-관리`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 월간 리포트 구성 항목 정의
  - 총 비용
  - 서비스별 비용
  - 전월 대비 증감
  - 임계치 초과 여부
- [ ] 리포트 생성 시점 정의
  - 매월 1일
- [ ] 전달 채널 정의
  - 이메일 또는 Slack 요약
- [ ] CSV/Markdown/Notion 등 산출 형식 정의
- [ ] 경영진 요약용 1페이지 포맷 정의

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 월초 리포트 생성
- Given: 한 달치 비용 데이터가 집계되었다.
- When: 월 1일 리포트 생성 작업을 실행한다.
- Then: 월간 비용 요약 리포트가 생성된다.

Scenario 2: 전월 대비 비교
- Given: 지난달과 이번달 비용 데이터가 있다.
- When: 리포트를 생성한다.
- Then: 증감 추이를 확인할 수 있다.

Scenario 3: 임계치 초과 표시
- Given: 월 비용이 8만 원을 초과했다.
- When: 리포트를 생성한다.
- Then: 초과 사실과 주요 원인이 표시된다.

Scenario 4: 서비스별 분해
- Given: 여러 인프라 공급자의 비용이 있다.
- When: 리포트를 확인한다.
- Then: 공급자별 비용 분해를 볼 수 있다.

Scenario 5: 경영진 공유 가능 형식
- Given: 리포트가 생성되었다.
- When: 공유한다.
- Then: 비기술 이해관계자도 읽을 수 있는 요약 형식이다.

## :gear: Technical & Non-Functional Constraints
- 리포트는 운영자가 추가 가공 없이 공유 가능한 형태여야 한다.
- 금액 기준, 환율 기준, 집계 기간은 일관되어야 한다.
- 과도한 세부 로그 대신 의사결정 가능한 요약을 우선한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 월간 리포트 항목과 생성 시점이 정의되는가?
- [ ] 전월 대비 비교와 초과 표시 규칙이 포함되는가?
- [ ] 공유 형식이 정의되는가?
- [ ] 자동 생성 파이프라인의 입력/출력이 문서화되는가?

## :construction: Dependencies & Blockers
- Depends on: #NFR-COST-001
- Blocks: None
