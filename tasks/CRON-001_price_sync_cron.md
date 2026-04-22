---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] CRON-001: Vercel Cron 일 1회 가격 동기화 배치 구현 (쿠팡 파트너스 → PRICE_SNAPSHOT 갱신)"
labels: 'feature, backend, epic:E-F1, priority:high, phase:2, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [CRON-001] Price Sync Cron 배치
- 목적: Vercel Cron을 통해 쿠팡 파트너스 API를 일 1회 호출하여 주요 제품의 최신 가격을 수집하고 `PRICE_SNAPSHOT`을 갱신한다. 외부 API 장애 시 폴백 캐시로 활용할 수 있는 24시간 이내 가격 신선도를 유지하는 운영 배치다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — `Price Sync Cron /cron/sync-prices`
- SRS 외부 시스템 폴백: [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — EXT-SYS-01, `PRICE_SNAPSHOT` 24시간 이내 데이터
- SRS 컴포넌트 개요: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Vercel Cron, Coupang, DB 연결
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001, REQ-FUNC-006
- 관련 선행 명세: [`/TASKS/F1-Q-001_coupang_price_query.md`](./F1-Q-001_coupang_price_query.md), [`/TASKS/F1-C-004_price_snapshot_persistence.md`](./F1-C-004_price_snapshot_persistence.md)
- 선행 인프라 태스크: **NFR-001** (Vercel 프로젝트 생성 + Git Push 자동 배포 파이프라인 구성)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#46-e-f1-배치-price-sync-cron`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/app/cron/sync-prices/route.ts` 또는 Vercel Cron 대상 Route Handler 구현
- [ ] 배치 대상 제품 선정 로직 구현
  - MVP 핵심 제품군 300~500개 기준
  - 비활성/삭제 제품 제외
- [ ] 제품별 가격 조회 파이프라인 구성
  - F1-Q-001 쿠팡 조회 재사용
  - F1-C-001/F1-C-002 계산
  - F1-C-004 append-only 저장
- [ ] 배치 단위 처리 전략 구현
  - 한 번에 전체를 처리하지 않고 chunk 단위 분할
  - 부분 실패 허용, 전체 중단 최소화
- [ ] 장애/재시도 정책 구현
  - 429/Timeout/5xx 재시도 최대 1회
  - 반복 실패는 구조화 로그 + 다음 제품 계속 진행
- [ ] 실행 결과 메타데이터 수집
  - `processed_count`, `success_count`, `failed_count`, `started_at`, `finished_at`, `duration_ms`
- [ ] 중복 실행 가드 구현
  - 동일 시간대 중복 Cron 트리거 시 실행 1건만 유효
- [ ] 운영 로그/알림 연계 포인트 정의
  - 실패율 과다 시 Slack/Webhook 후행 연동 가능 메타데이터 출력
- [ ] 통합 테스트/배치 시뮬레이션 작성
  - 정상 실행
  - 부분 실패
  - 중복 실행 차단

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 일 1회 가격 동기화 성공
- Given: Cron 스케줄과 쿠팡 API 연결이 정상이고 동기화 대상 제품 목록이 존재한다.
- When: `/cron/sync-prices` 배치가 실행된다.
- Then: 각 제품의 최신 가격이 조회되어 `PRICE_SNAPSHOT`에 append-only 방식으로 저장된다.

Scenario 2: 부분 실패 허용
- Given: 100개 제품 중 일부 제품 조회가 Timeout 또는 429로 실패한다.
- When: 배치를 실행한다.
- Then: 실패한 일부 제품만 기록되고, 나머지 제품은 계속 처리되어 전체 배치가 중단되지 않는다.

Scenario 3: 중복 실행 차단
- Given: 동일 시각에 Cron이 중복 트리거된다.
- When: 두 번째 실행이 시작된다.
- Then: 두 번째 실행은 즉시 종료되거나 no-op 처리되어 중복 저장이 발생하지 않는다.

Scenario 4: 실행 메타데이터 기록
- Given: 배치가 완료되었다.
- When: 실행 결과를 확인한다.
- Then: 처리 건수, 성공/실패 건수, 소요 시간 메타데이터가 로그 또는 응답에 남는다.

Scenario 5: 24시간 신선도 유지 지원
- Given: 배치가 하루 1회 정상 실행된다.
- When: F1-Q-002가 캐시 폴백 조회를 수행한다.
- Then: 최근 24시간 이내 `PRICE_SNAPSHOT`이 존재하여 폴백 사용 가능 상태가 유지된다.

## :gear: Technical & Non-Functional Constraints
- Cron 엔드포인트는 인증되지 않은 외부 호출로부터 보호되어야 하며, Vercel Cron 헤더 검증 또는 비밀 토큰 검증이 필요하다.
- 배치는 append-only 저장만 수행한다. 기존 스냅샷 update/upsert 금지.
- 쿠팡 Rate Limit 일 10,000건 추정치를 넘지 않도록 chunk 크기와 호출 수를 제어한다.
- 단일 배치 실패가 F1 실시간 비교 기능 전체 장애로 전파되지 않도록 격리한다.
- 배치 로직은 F1 Query/Command 모듈을 재사용하고, 계산 로직을 중복 구현하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] Cron 엔드포인트와 스케줄 구성이 문서화되는가?
- [ ] 부분 실패 허용 및 중복 실행 차단이 구현되는가?
- [ ] 실행 메타데이터 로그가 남는가?
- [ ] append-only 저장 원칙을 지키는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F1-Q-001, #F1-C-004, #NFR-001
- Blocks: #NFR-004, #F1-Q-002
