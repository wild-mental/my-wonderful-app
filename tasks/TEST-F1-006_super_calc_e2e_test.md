---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F1-006: [Integration Test] Super-Calc API E2E — 검색→조회→정규화→정렬→저장→응답 · p95 ≤ 3,500ms · 실패율 < 1%"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F1-006] Super-Calc API E2E 통합 테스트
- 목적: `GET /api/v1/compare` 전체 파이프라인(요청 검증 → 외부 조회/폴백 → 1일 단가 정규화 → 최종가 계산 → 정렬 → PRICE_SNAPSHOT 저장 → API-001 응답 직렬화)을 **실 Prisma + Mock 쿠팡 어댑터 + 실제 Next.js Route Handler** 기준으로 검증한다. 기능적 정합성(API-001 Zod 스키마), 운영적 시나리오(캐시 폴백·미등록 성분·저장 실패 완화), 성능 예산(REQ-FUNC-006 p95 ≤ 3,500ms, 실패율 < 1.0%)을 한 파일에서 보증하는 **최종 게이트 테스트**다.
- Epic / Phase: E-TEST / Phase 3 (테스트)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001/002/005/006/007/008/009
- SRS 비기능: [`/05_SRS_v1.md#4.2`](../05_SRS_v1.md) — REQ-NF-001 (Super-Calc p95 ≤ 3,500ms), REQ-NF-021 (관측성)
- SRS 핵심 시퀀스: [`/05_SRS_v1.md#3.4.1`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1`](../05_SRS_v1.md)
- SRS 추적성 매트릭스: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-006
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1.1 EXT-SYS-01 쿠팡 파트너스 API`](../05_SRS_v1.md)
- 관련 구현 태스크:
  - [`/TASKS/F1-RH-001_super_calc_route_handler.md`](./F1-RH-001_super_calc_route_handler.md) — 대상 엔드포인트
  - [`/TASKS/API-001_super_calc_dto.md`](./API-001_super_calc_dto.md) — 응답 스키마(Zod 검증 기준)
  - [`/TASKS/API-008_common_error_schema.md`](./API-008_common_error_schema.md) — 에러 포맷
  - [`/TASKS/MOCK-005_coupang_fake_adapter.md`](./MOCK-005_coupang_fake_adapter.md) — 쿠팡 Mock 어댑터
  - [`/TASKS/F1-Q-002_price_snapshot_fallback.md`](./F1-Q-002_price_snapshot_fallback.md) — 캐시 폴백
  - [`/TASKS/F1-C-004_price_snapshot_persistence.md`](./F1-C-004_price_snapshot_persistence.md) — 저장 레이어
  - [`/TASKS/DATA-011_seed_data_script.md`](./DATA-011_seed_data_script.md) — 시드 fixture
- 선행 태스크: **F1-RH-001** (엔드포인트), **API-001/008** (DTO), **MOCK-005** (쿠팡 Mock), **DATA-011** (시드)
- 후행 태스크: NFR-PERF-002 (부하 테스트), NFR-MON-001 (로그 대시보드)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#5.1 F1 테스트`](./06_TASK_LIST_v1.md)

## :test_tube: 기술 스택 & 도구 (확정)

| 영역 | 도구 | 이유 |
|---|---|---|
| 테스트 프레임워크 | **Vitest** | 프로젝트 표준(TEST-F1-001~005 일관), Next.js · ESM 친화 |
| HTTP 호출 | **Next.js Route Handler 직접 호출** (`import { GET } from "@/app/api/v1/compare/route"`) | 네트워크 스택 우회로 flaky 최소화 + 실제 핸들러 커버 |
| Prisma | **실 Supabase 테스트 DB**(별도 `DATABASE_URL_TEST`) + `beforeEach` 트랜잭션 래퍼 | 실제 스키마·제약·인덱스 동작 검증 |
| 쿠팡 API | **MOCK-005 FakeCoupangAdapter** (의존성 주입) | 외부 의존성 제거, deterministic 응답 |
| 시간 제어 | **Vitest `vi.useFakeTimers`** | 캐시 TTL·타임스탬프 검증 |
| 성능 측정 | **`performance.now()` 반복 측정 + tdigest** (`@ndhoule/tdigest` 또는 `hdr-histogram-js`) | 신뢰성 있는 p95/p99 계산, flaky 최소화 |
| 동시성 시뮬레이션 | **`Promise.all` + `p-limit`** (단일 프로세스 내 동시 요청) | Vercel Serverless 동시성 모델 모사 |
| 부하 테스트(선택) | **k6 script**(`tests/perf/compare.k6.js`) | 실 네트워크 레벨 50 VU 검증(Phase 2 또는 NFR-PERF-002 연계) |

## :white_check_mark: Task Breakdown (실행 계획)

- [ ] **테스트 환경 구성** — `vitest.config.e2e.ts`
  - `testTimeout: 60_000` (성능 시나리오 대응)
  - `setupFiles: ["./tests/setup/e2e.ts"]`
  - `pool: "forks"` (동시성 테스트 격리)
- [ ] **E2E 셋업 파일** — `tests/setup/e2e.ts`
  - 환경변수 `DATABASE_URL=DATABASE_URL_TEST`로 전환
  - Prisma migrate status 확인 + 필요 시 `migrate deploy`
  - 각 테스트 전 fixture seed: `seedCompareFixtures()` 호출
- [ ] **fixture 시드 헬퍼** — `tests/fixtures/compare.ts`
  - 성분 `비타민D`(id: `ing_vitd`), `비타민D_unregistered`(시드 미포함)
  - 제품 10종: product_id `P01`~`P10`, 각각 (용량, 단위, 1일 복용량, 기본가, 할인 가격) 다양하게 배치
  - 기대 정렬 결과(1일 단가 asc) 고정 배열로 정답지 제공
  - `beforeEach`에서 트랜잭션 rollback 가능하도록 `prisma.$transaction` 래핑 헬퍼 제공
- [ ] **DB 격리 전략**
  - 1차: 각 테스트 전후 `TRUNCATE TABLE price_snapshot, product, ingredient CASCADE;` + 시드 재적재
  - 2차(성능 시나리오): Savepoint + ROLLBACK 패턴으로 fixture 재사용
  - CI에서는 Supabase Branch DB 또는 Dockerized Postgres 사용
- [ ] **Mock 쿠팡 어댑터 주입** — `tests/helpers/inject-coupang-mock.ts`
  - MOCK-005의 `FakeCoupangAdapter`를 DI 컨테이너에 주입
  - 시나리오별 응답 설정: `adapter.setResponse("비타민D", fixtureProducts)`
  - 실패 시뮬레이션: `adapter.setFailureMode("RATE_LIMIT_429")`, `"SERVER_ERROR_503"`, `"TIMEOUT_5000ms"`
- [ ] **헬퍼: 엔드포인트 호출 유틸** — `tests/helpers/call-compare.ts`
  ```ts
  export async function callCompareApi(query: CompareQuery): Promise<{ status: number; body: unknown; headers: Headers; duration_ms: number }> {
    const url = new URL("http://localhost/api/v1/compare");
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const request = new Request(url.toString());
    const t0 = performance.now();
    const response = await GET(request);
    const duration_ms = performance.now() - t0;
    return { status: response.status, body: await response.json(), headers: response.headers, duration_ms };
  }
  ```
- [ ] **응답 스키마 검증 헬퍼**
  - `API-001`의 `CompareResponseSchema.safeParse(body)`로 전체 응답 필드 검증
  - 실패 시 Zod 에러를 assertion 실패 메시지로 매핑
- [ ] **성능 측정 하네스** — `tests/helpers/perf-harness.ts`
  ```ts
  export async function measurePercentiles(fn: () => Promise<void>, opts: { warmup: number; samples: number }) {
    for (let i = 0; i < opts.warmup; i++) await fn();  // JIT·Prisma 커넥션 pool warm-up
    const times: number[] = [];
    for (let i = 0; i < opts.samples; i++) {
      const t0 = performance.now();
      await fn();
      times.push(performance.now() - t0);
    }
    return { p50: pct(times, 50), p95: pct(times, 95), p99: pct(times, 99), max: Math.max(...times) };
  }
  ```
  - warmup: 20회, samples: 100회 (MVP 기준) / 300회 (엄격 모드, nightly CI)
  - 퍼센타일 라이브러리(`hdr-histogram-js`) 사용으로 flaky 감소
- [ ] **실패율 측정 하네스**
  - `runN(100)`으로 100회 반복 호출 → `5xx`/타임아웃/스키마 실패 건수 집계 → `failureRate = failures / 100`
  - 실패 정의: HTTP ≥ 500 OR 응답 스키마 safeParse 실패 OR 타임아웃 > 5s

## :test_tube: Acceptance Criteria (BDD/GWT) — 10개 시나리오

**Scenario 1: 정상 E2E 흐름 (Live Path)**
- **Given**: MOCK-005에 `비타민D` 키워드로 10개 제품 응답이 설정되고 fixture seed 완료
- **When**: `GET /api/v1/compare?ingredient=비타민D&dosage=1000IU` 호출
- **Then**: HTTP 200, 응답이 `CompareResponseSchema.parse()` 통과, `results[].daily_cost_krw`가 오름차순, `meta.is_cached=false`, `meta.result_count=10`, `meta.request_id` 존재.

**Scenario 2: 정렬 정확성 (REQ-FUNC-005)**
- **Given**: fixture의 기대 정렬 결과(정답지) 배열
- **When**: 응답 수신
- **Then**: `results.map(r => r.product_id)`이 정답지 배열과 완전 일치.

**Scenario 3: 캐시 폴백 플로우 (REQ-FUNC-007)**
- **Given**: MOCK-005가 `SERVER_ERROR_503`을 반환하고, PRICE_SNAPSHOT에 2시간 전 저장된 `비타민D` 데이터 존재
- **When**: API 호출
- **Then**: HTTP 200, `meta.is_cached=true`, `meta.cached_at` 타임스탬프 존재, UI-012에서 노출될 문구 포맷 충족. 응답 정렬 정확성은 Scenario 2와 동일.

**Scenario 4: 미등록 성분 분기 (REQ-FUNC-008)**
- **Given**: 시드에 없는 `?ingredient=xyz_unknown`
- **When**: API 호출
- **Then**: HTTP 404, `error.code="COMPARE_INGREDIENT_NOT_FOUND"`, API-008 포맷 준수. 응답 시간 < 300ms.

**Scenario 5: 저장 실패 완화 (REQ-FUNC-006 운영 회복력)**
- **Given**: F1-C-004 `savePriceSnapshot`이 의도적으로 throw하도록 spy 주입
- **When**: API 호출
- **Then**: HTTP 200 (사용자 응답 정상), 응답 body는 Scenario 1과 동일, 단 **구조화 로그에 `event="price_snapshot.persist.failed"` + `level="warn"`** 기록. 클라이언트는 저장 실패를 알 수 없음.

**Scenario 6: 요청 검증 실패**
- **Given**: `?dosage=abc` (숫자 아님)
- **When**: API 호출
- **Then**: HTTP 400, `error.code="COMPARE_INVALID_PARAM"`, 응답 body가 API-008 포맷 준수. Zod 에러 메시지 포함.

**Scenario 7: 외부 API 완전 장애 + 폴백 불가**
- **Given**: MOCK-005 `SERVER_ERROR_503` + PRICE_SNAPSHOT에 관련 데이터 0건
- **When**: API 호출
- **Then**: HTTP 502, `error.code="COMPARE_UPSTREAM_UNAVAILABLE"`, `meta.fallback_attempted=true`.

**Scenario 8: 응답 스키마 정합성 (API-001)**
- **Given**: Scenario 1~7의 모든 응답 body
- **When**: 각 body를 `CompareResponseSchema` 또는 `CommonErrorSchema`로 parse
- **Then**: 모두 parse 성공. 추가 필드/누락 필드 0건.

**Scenario 9: 성능 — p95 ≤ 3,500ms (REQ-FUNC-006 / REQ-NF-001)**
- **Given**: warmup 20회 + samples 100회, 단일 VU 직렬 호출, 쿠팡 Mock 지연 300ms 시뮬레이션
- **When**: `measurePercentiles` 실행
- **Then**: `p95 <= 3500`, `p99 <= 5000` (p99는 여유 임계), flaky 방지를 위해 3회 재측정 허용.

**Scenario 10: 실패율 — 동시 50 VU 시뮬레이션**
- **Given**: `p-limit(50)` 기반 200회 병렬 호출, Mock 어댑터가 5% 확률로 `SERVER_ERROR_503` 반환 + 폴백 데이터 존재
- **When**: `runN(200)` 실행
- **Then**: `failureRate < 0.01` (1.0% 미만 — SRS REQ-FUNC-006), 모든 5xx는 폴백으로 200 회복됨.

## :gear: Technical & Non-Functional Constraints

- **실 DB 사용 원칙**: SQLite in-memory 대신 **실 Postgres(Supabase 테스트 브랜치 또는 Dockerized Postgres)** 사용. Prisma 스키마 drift·인덱스 동작까지 검증.
- **외부 API 격리**: 쿠팡 실 API 호출 금지. MOCK-005 어댑터를 DI로 강제 주입. 환경변수 `E2E_MODE=true`일 때 실 어댑터 로드 차단.
- **Flaky 방지**:
  - warmup 구간 분리(20회)
  - `hdr-histogram-js` 또는 tdigest로 퍼센타일 계산(간단 Array sort 보다 안정)
  - 3회 재측정 허용(median of 3 runs)
  - CI 머신 CPU/메모리 고정(예: GitHub Actions `ubuntu-latest`, 기본 runner)
- **격리 전략**:
  - `beforeEach`: fixture seed
  - `afterEach`: `TRUNCATE ... CASCADE` 또는 tx rollback
  - `afterAll`: connection pool 종료
- **실패율 측정 기준**: HTTP ≥ 500, 타임아웃 > 5s, API-001 스키마 violation 세 가지를 "실패"로 정의. 4xx(400/404)는 정상 응답으로 간주(사용자 입력 오류).
- **성능 임계 여유**: SRS REQ-FUNC-006은 "p95 ≤ 3,500ms, 실패율 < 1%" — CI 게이트는 **p95 ≤ 3,000ms, 실패율 < 0.5%**로 **내부 20% 여유** 둠. 운영 환경 노이즈 대비.
- **타임아웃 정책**: 단일 호출 5초 초과 시 강제 abort(F1-RH-001의 내부 타임아웃과 일치).
- **관측성 검증**: 구조화 로그가 `event`, `request_id`, `duration_ms`, `is_cached`, `result_count`, `failure_cause` 6개 필드를 모두 포함하는지 Scenario 1/3/5에서 spy로 확인.
- **재현성**: 모든 시드 데이터 고정 seed(`faker.seed(42)`), `Date.now` mock(`vi.setSystemTime`) 사용하여 deterministic.
- **병렬 실행 안전성**: Vitest `pool: "forks"` + fixture별 고유 prefix(예: `TEST-F1-006-...`)로 테스트 간 데이터 충돌 방지.
- **k6 연계(선택)**: Scenario 9/10을 Vitest 내부에서 검증하되, 실 네트워크 포함 재현은 `tests/perf/compare.k6.js`로 분리하여 NFR-PERF-002에서 실행.

## :checkered_flag: Definition of Done (DoD)

- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] Vitest 기반 E2E 설정 파일(`vitest.config.e2e.ts`) + setup 파일이 분리 구성되었는가?
- [ ] 실 Postgres 테스트 DB에서 실행되며 Prisma migrate가 사전 완료되는가?
- [ ] MOCK-005 쿠팡 어댑터가 DI로 주입되어 실 API 호출 0건인가?
- [ ] fixture seed 헬퍼가 정답 정렬 배열을 제공하는가?
- [ ] 요청 검증 / live / cache fallback / 미등록 / 저장 실패 / upstream 장애 / 스키마 검증 / 성능 / 실패율 8개 영역이 커버되는가?
- [ ] `hdr-histogram-js`(또는 등가) 기반 p95/p99 계산이 적용되었는가?
- [ ] 구조화 로그 필드 6종(`event`, `request_id`, `duration_ms`, `is_cached`, `result_count`, `failure_cause`)이 모두 검증되는가?
- [ ] API-001 / API-008 스키마 Zod 검증이 전 응답에 적용되는가?
- [ ] CI 게이트 임계(p95 ≤ 3,000ms, 실패율 < 0.5%)가 설정되고 3회 재측정 허용이 구현되는가?
- [ ] `pnpm test:e2e TEST-F1-006` 명령으로 단독 실행 가능?
- [ ] 실 쿠팡 API 호출 방지 가드(`E2E_MODE` 환경변수)가 작동하는가?
- [ ] 실패 시 로그/리포트가 사람이 읽을 수 있는 요약(p50/p95/p99/max/failure_rate)으로 출력되는가?

## :construction: Dependencies & Blockers

- **Depends on**:
  - #F1-RH-001 (대상 엔드포인트)
  - #API-001 (응답 DTO)
  - #API-008 (에러 포맷)
  - #MOCK-005 (쿠팡 Mock 어댑터 — DI 주입)
  - #F1-Q-002 (캐시 폴백)
  - #F1-C-004 (저장 레이어)
  - #DATA-011 (시드 데이터)
- **Blocks**: None (본 태스크 자체가 게이트)
- **연계**:
  - #NFR-PERF-002 (k6 부하 테스트로 실 네트워크 포함 재현)
  - #NFR-MON-001 (구조화 로그 대시보드 검증)

## :bookmark_tabs: Notes

- **왜 Route Handler를 직접 호출하나?** Supertest/fetch 방식은 네트워크 스택의 랜덤 지연으로 퍼센타일 측정이 flaky해진다. Next.js Route Handler는 `(req) => Response` 순수 함수이므로 직접 호출이 가장 정확한 pipeline 시간을 측정한다. 네트워크 포함 측정은 k6로 분리.
- **fixture 정답지 고정 원칙**: 실 쿠팡 API는 가격이 시시각각 변하므로 테스트가 flaky해진다. 본 태스크는 정답 배열을 코드에 하드코딩하여 **정렬 로직 자체**를 검증한다. 실 네트워크 회귀는 NFR-PERF-002 부하 테스트에서 확인.
- **저장 실패 완화 검증의 난이도**: `savePriceSnapshot` spy 주입이 핵심. Vitest `vi.spyOn(prisma.priceSnapshot, "create").mockRejectedValueOnce(new Error(...))` 패턴. 이후 구조화 로그 spy(`vi.spyOn(logger, "warn")`)로 기록 여부 확인.
- **hdr-histogram-js 선택 이유**: 단순 Array sort는 N=100일 때 outlier 1개가 p95를 크게 왜곡. HdrHistogram은 로그 스케일 버킷으로 안정적. 추가 번들 크기는 테스트 전용이라 무관.
- **CI 실행 시간 최적화**: Scenario 9(p95 측정, 120회 호출)가 가장 오래 걸림. 평소 PR에서는 samples=50으로 빠르게, nightly CI에서는 samples=300으로 엄격하게 2-tier 실행.
- **Phase 2 확장**:
  - 실 네트워크 k6 시나리오(Vercel Preview URL 대상)
  - Chaos 테스트(쿠팡 Mock이 무작위 지연/실패)
  - 다국어 성분명 검색 회귀
  - Contract Test(MOCK-005 ↔ 실 쿠팡 Adapter 응답 포맷 동등성)
