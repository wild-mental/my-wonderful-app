---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-PERF-002: 동시 접속 50명(피크 100명) 성능 검증 시나리오 문서화 + 간이 테스트 스크립트"
labels: 'feature, infra, epic:E-NFR, priority:medium, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-PERF-002] 동시 접속 성능 검증 시나리오 + 간이 부하 테스트
- 목적: MVP 운영 조건(동시 접속 50명, 피크 100명)에서 모든 성능 기준(p95 응답 시간 등)이 충족되는지 검증하기 위한 시나리오 문서와 간이 부하 테스트 스크립트를 작성한다.
- Epic / Phase: E-NFR / Phase 1
- 복잡도: M

## :link: References (Spec & Context)
- SRS 성능 요구사항: [`/05_SRS_v1.md#4.2.1`](../05_SRS_v1.md) — REQ-NF-006 (동시 50명/피크 100명)
- SRS API 응답 시간: [`/05_SRS_v1.md#4.2.1`](../05_SRS_v1.md) — REQ-NF-001 (단가 비교 p95 ≤ 3,500ms), REQ-NF-002 (뱃지 p95 ≤ 1,000ms)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F1-RH-001**, **F2-RH-001** (Route Handler 완성)
- 후행 태스크: 운영 모니터링 연계

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **부하 테스트 시나리오 문서 작성** — `docs/load-test-scenario.md`
  - 시나리오 1: 정상 부하(50 VU, 5분 지속) — 모든 API p95 기준 충족
  - 시나리오 2: 피크 부하(100 VU, 2분 지속) — 5xx 에러율 ≤ 0.5%
  - 시나리오 3: 스파이크(0→100 VU, 30초 ramp-up) — 응답 시간 점진적 증가 허용 범위
  - 대상 엔드포인트:
    - `GET /api/v1/compare?ingredient=비타민D` (F1)
    - `GET /api/v1/badges?product_id=PROD-001` (F2)
    - `GET /api/v1/search?query=비타민` (COM)
- [ ] **간이 부하 테스트 스크립트** — k6 또는 Artillery 기반
  - `tests/load/k6-script.js` 또는 `tests/load/artillery.yml`
  - VU(Virtual Users) 설정: 50명 기본, 100명 피크
  - 측정 항목: p50, p95, p99 응답 시간, 에러율, 처리량(req/s)
- [ ] **성공 기준 정의**
  - 단가 비교 API: p95 ≤ 3,500ms, 에러율 ≤ 1%
  - 뱃지 API: p95 ≤ 1,000ms, 에러율 ≤ 0.5%
  - 검색 API: p95 ≤ 500ms
  - 전체 5xx 에러율: ≤ 0.5% (REQ-NF-010)
- [ ] **npm script 등록** — `"load-test": "k6 run tests/load/k6-script.js"` 또는 Artillery 기반
- [ ] **결과 리포트 템플릿** — 부하 테스트 결과를 정리하는 Markdown 템플릿

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 부하(50 VU) 성능 충족**
- **Given**: 시드 데이터가 적재되고 앱이 배포된 상태
- **When**: 50 VU로 5분간 부하 테스트를 실행한다
- **Then**: 단가 비교 p95 ≤ 3,500ms, 뱃지 p95 ≤ 1,000ms, 전체 에러율 ≤ 0.5%이다.

**Scenario 2: 피크 부하(100 VU) 안정성**
- **Given**: 100 VU 피크 부하 상황
- **When**: 2분간 부하 테스트를 실행한다
- **Then**: 5xx 에러율 ≤ 0.5%이며, 서비스가 중단되지 않는다.

**Scenario 3: 부하 테스트 스크립트 실행 가능**
- **Given**: k6 또는 Artillery가 설치된 상태
- **When**: `pnpm load-test`를 실행한다
- **Then**: 테스트가 완료되고 결과 리포트가 출력된다.

## :gear: Technical & Non-Functional Constraints
- **MVP 규모 (REQ-NF-006)**: MAU 2,200명 기준 동시 접속 50명, 피크 100명. 대규모 부하 테스트는 Phase 2.
- **Vercel Serverless 특성**: Cold Start 영향 고려. 첫 요청은 응답 시간이 길 수 있음.
- **테스트 환경**: Preview 배포 또는 로컬 `pnpm build && pnpm start` 기반.

## :checkered_flag: Definition of Done (DoD)
- [ ] 부하 테스트 시나리오 문서가 작성되었는가?
- [ ] 간이 부하 테스트 스크립트가 작성되었는가?
- [ ] 정상 부하(50 VU) 성능 기준이 충족되었는가?
- [ ] 결과 리포트 템플릿이 준비되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #F1-RH-001, #F2-RH-001 (Route Handler 완성)
- **Blocks**: 운영 성능 기준선(Baseline) 확립
