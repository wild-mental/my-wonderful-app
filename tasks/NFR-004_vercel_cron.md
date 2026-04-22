---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-004: Vercel Cron Job 설정 (일 1회 가격 동기화 스케줄)"
labels: 'feature, infra, epic:E-NFR, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-004] Vercel Cron Job 설정
- 목적: 쿠팡 파트너스 API를 통한 일 1회 가격 동기화 배치(CRON-001)를 Vercel Cron 인프라에서 실행할 수 있도록 스케줄 설정을 완료한다.
- Epic / Phase: E-NFR / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Price Sync Cron
- SRS 폴백: [`/05_SRS_v1.md#3.1.1`](../05_SRS_v1.md) — 가격 데이터 갱신 전략
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **NFR-001** (Vercel 배포)
- 후행 태스크: CRON-001 (가격 동기화 배치 구현)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **vercel.json Cron 설정** — `vercel.json`에 Cron Job 정의
  ```json
  {
    "crons": [{
      "path": "/api/cron/price-sync",
      "schedule": "0 3 * * *"
    }]
  }
  ```
  - 실행 시각: KST 12:00 (UTC 03:00) — 트래픽 최저 시간대
- [ ] **Cron Route Handler 스켈레톤** — `src/app/api/cron/price-sync/route.ts`
  - `CRON_SECRET` 환경변수 기반 인증 (Vercel에서 자동 주입)
  - 인증 실패 시 401 반환
  - 실제 로직은 CRON-001에서 구현, 여기서는 스켈레톤만
- [ ] **환경변수 설정** — `CRON_SECRET` Vercel Dashboard에 등록
- [ ] **Vercel Hobby 플랜 Cron 제한 확인** — 일 1회, 최대 실행 시간 60초 (Hobby 기준)
  - Pro 플랜에서는 10분까지 확장 가능. 필요 시 업그레이드 검토
- [ ] **실행 로그 확인** — Vercel Dashboard → Cron Jobs에서 실행 이력 확인 가능 여부

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: Cron Job 등록 확인**
- **Given**: `vercel.json`에 Cron 설정이 포함된 상태
- **When**: Vercel에 배포한다
- **Then**: Vercel Dashboard → Cron Jobs에서 등록된 스케줄이 표시된다.

**Scenario 2: Cron 엔드포인트 인증**
- **Given**: `/api/cron/price-sync` Route Handler가 존재하는 상태
- **When**: `CRON_SECRET` 없이 직접 호출한다
- **Then**: 401 Unauthorized가 반환된다.

**Scenario 3: 수동 트리거 테스트**
- **Given**: Cron Job이 등록된 상태
- **When**: Vercel Dashboard에서 수동 실행(Run)을 트리거한다
- **Then**: 정상 실행되며 200 응답이 반환된다.

## :gear: Technical & Non-Functional Constraints
- **Vercel Hobby Cron 제한**: 일 1회 실행, 최대 60초. 500개 제품 가격 업데이트가 60초 내 완료되어야 함.
- **인증**: Vercel Cron은 `CRON_SECRET` 헤더를 자동 주입. 외부 호출 차단 필수.

## :checkered_flag: Definition of Done (DoD)
- [ ] `vercel.json`에 Cron 설정이 포함되었는가?
- [ ] Route Handler 스켈레톤 + 인증 검증이 작성되었는가?
- [ ] Vercel Dashboard에서 Cron Job 등록이 확인되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #NFR-001 (Vercel 배포)
- **Blocks**: #CRON-001 (가격 동기화 배치 구현)
