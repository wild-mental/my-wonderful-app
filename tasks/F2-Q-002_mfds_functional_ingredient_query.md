---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-Q-002: 식약처 공공 API 기능성 인정 원료 조회 로직 (로컬 DB 우선, API 폴백)"
labels: 'feature, backend, epic:E-F2, priority:high, phase:2, cqrs:query'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-Q-002] 식약처 공공 API 기능성 인정 원료 조회 Query
- 목적: 성분 목록(F2-Q-001)의 `standard_name`을 기반으로, 해당 원료의 **식약처 건강기능식품공전** 등재 여부 및 공전 원문(기능성 인정 내용, 일일 섭취량, 주의사항)을 조회한다. **로컬 DB의 `INGREDIENT.mfds_claim`을 1차 조회**하고, 정보 누락 시에만 **MFDS 공공 API를 2차 조회**한 뒤 결과를 로컬에 업서트하여 향후 호출을 회피한다(§3.1.1 폴백 전략의 역방향 전략).
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-011`](../05_SRS_v1.md) — 공전 원문 1:1 매칭, 불일치율 < 0.5%
- SRS 문서 (폴백 전략): [`/05_SRS_v1.md#3.1.1 EXT-SYS-02`](../05_SRS_v1.md) — 로컬 DB가 기본, 외부 API는 보조
- SRS 문서 (비상 대응): [`/05_SRS_v1.md#1.2.5 CP-1`](../05_SRS_v1.md) — 월 1회 갱신 전략
- SRS 문서 (외부 API): [`/05_SRS_v1.md#6.1.1 EXT-API-02`](../05_SRS_v1.md) — `https://openapi.mfds.go.kr/v1/hfoods`
- SRS 문서 (시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — BadgeAPI → MFDS 상호작용
- 선행 타입 명세: [`API-007_mfds_api_types.md`](./API-007_mfds_api_types.md)
- 선행 태스크 명세: [`MOCK-006_mfds_api_stub.md`](./MOCK-006_mfds_api_stub.md) (개발 환경 폴백)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-003** (INGREDIENT 스키마), **API-007** (MFDS 타입), **MOCK-006** (Mock Adapter), **DATA-011** (시드 데이터)
- 후행 태스크: F2-C-001 (뱃지 판정), F2-C-003 (번역), F2-C-004 (회색 라벨)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **MfdsAdapter 인터페이스 구현** — `src/lib/adapters/mfds/index.ts`:
  - `interface MfdsAdapter { fetchFunctionalIngredient(name: string): Promise<NormalizedMfdsData | null>; }`
  - 구현체 2종: `MfdsHttpAdapter`(프로덕션), `MfdsFakeAdapter`(개발/테스트, MOCK-006 재활용)
  - 환경변수 `MFDS_API_ENABLED`로 HTTP/Fake 토글 (CON-13 Vercel 환경변수)
- [ ] **Query 함수 `resolveMfdsIngredient()` 작성** — `src/server/f2/queries/resolve-mfds-ingredient.ts`:
  - Signature: `(standardName: string, options?: { bypassCache?: boolean }) => Promise<MfdsResolution>`
  - Return 타입 `MfdsResolution`:
    - `status: "REGISTERED" | "NOT_REGISTERED" | "UNKNOWN"` — UNKNOWN은 API 장애+로컬 미적재
    - `claim?: string` — 공전 원문
    - `dailyIntake?: string`
    - `cautions?: string[]`
    - `source: "LOCAL_CACHE" | "MFDS_API" | "FALLBACK_EMPTY"` — 관측/디버깅용
    - `fetchedAt: Date`
- [ ] **조회 파이프라인 구현** (순서 엄수):
  1. **Step A — Local Lookup**: `prisma.ingredient.findFirst({ where: { standard_name }, select: { mfds_status: true, mfds_claim: true, updated_at: true } })`. 발견되고 `updated_at` ≥ 30일 이내면 즉시 반환 (`source: "LOCAL_CACHE"`).
  2. **Step B — API Fetch**: 로컬 미스 또는 오래된 경우, `MfdsAdapter.fetchFunctionalIngredient(standard_name)` 호출. 3초 타임아웃.
  3. **Step C — Local Upsert**: API 성공 시 해당 INGREDIENT 레코드의 `mfds_status`, `mfds_claim`을 업데이트(CP-1 추적성 위해 `data_source: MFDS_API` 동시 갱신). 실패 시 Step D.
  4. **Step D — Fallback**: API 실패 + 로컬도 없으면 `status: "UNKNOWN", source: "FALLBACK_EMPTY"` 반환. Sentry/Vercel Logs에 `event: "mfds_api_unavailable"` 구조화 로그.
- [ ] **성분명 정규화 헬퍼** — `src/server/f2/utils/normalize-ingredient-name.ts`:
  - 공백 통일, 영문 대소문자 통일(Title Case), "비타민D3" ↔ "Cholecalciferol" 매핑 딕셔너리 `ingredient-aliases.json` 참조
  - 정규화 후 동일성 확인용 Hash 키 생성 (조회 정확도 향상)
- [ ] **Rate Limit 가드** — `src/lib/adapters/mfds/rate-limit.ts`:
  - 공공 API 정책 준수: 분당 60건, 일 10,000건 가정 (실제 정책 PoC 시 확정)
  - `p-queue` 또는 간이 토큰 버킷으로 호출량 제한. 한도 초과 시 로컬 DB 우선 정책으로 우회
- [ ] **Batch Bulk Fetch 함수** — `src/server/f2/queries/resolve-mfds-ingredients-batch.ts`:
  - Signature: `(names: string[]) => Promise<Map<string, MfdsResolution>>`
  - 내부적으로 Local Lookup을 1회 `findMany`로 묶고, API 호출은 누락분에만 병렬(최대 동시 5건) 수행
  - F2-C-001(뱃지 판정)에서 성분 N개를 한 번에 해결할 때 사용
- [ ] **Timeout 및 Retry 정책** — `src/lib/adapters/mfds/http-adapter.ts`:
  - `fetch` + `AbortSignal.timeout(3000)`, 1회 재시도 (지수 백오프 500ms)
  - 재시도 실패 시 `MfdsApiError` 던지고 Query는 `FALLBACK_EMPTY`로 흡수
- [ ] **관측 로깅** — 구조화 로그 필드: `event="mfds.resolve"`, `source`, `status`, `duration_ms`, `cache_hit`, `standard_name_hash`(PII 아님이므로 원문 허용)
- [ ] **Unit Test 작성** — `tests/server/f2/queries/resolve-mfds-ingredient.test.ts`에 8건 이상
- [ ] **Integration Test** — Mock Adapter를 Fake로 주입해 Local→API→Fallback 전환 시나리오 3건

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 로컬 캐시 Hit (Hot Path)**
- **Given**: `INGREDIENT.standard_name="Cholecalciferol"`, `mfds_status=REGISTERED`, `mfds_claim="비타민 D의 체내 흡수를 돕습니다"`, `updated_at`이 7일 전
- **When**: `resolveMfdsIngredient("Cholecalciferol")` 호출
- **Then**: `{ status: "REGISTERED", claim: "비타민 D의 체내 흡수를 돕습니다", source: "LOCAL_CACHE" }` 반환, MFDS API는 호출되지 않는다.

**Scenario 2: 로컬 Miss → API 성공 → 로컬 Upsert**
- **Given**: `standard_name="NMN"`이 로컬 DB에 미적재 상태
- **When**: `resolveMfdsIngredient("NMN")` 호출
- **Then**: MFDS API가 호출되어 `status: "NOT_REGISTERED"` 반환, 동시에 `INGREDIENT` 레코드(또는 임시 성분 캐시 테이블)에 `mfds_status`가 저장되어 다음 호출은 `LOCAL_CACHE`가 된다.

**Scenario 3: API 장애 + 로컬 데이터 존재 (Graceful Degradation)**
- **Given**: 로컬에 `mfds_claim`이 15일 전 업데이트되어 있고, MFDS API가 503을 반환하는 상황
- **When**: `resolveMfdsIngredient("Cholecalciferol")` 호출
- **Then**: 로컬 데이터로 정상 응답 (`source: "LOCAL_CACHE"`), 실패 로그는 기록되지만 사용자 경로에는 영향 없음.

**Scenario 4: API 장애 + 로컬 Miss (Hard Fallback)**
- **Given**: `standard_name="UNKNOWN_INGREDIENT"`, 로컬 미적재, MFDS API 타임아웃
- **When**: `resolveMfdsIngredient("UNKNOWN_INGREDIENT")` 호출
- **Then**: `{ status: "UNKNOWN", source: "FALLBACK_EMPTY" }` 반환, `event="mfds_api_unavailable"` 로그 기록. F2-C-004에서 회색 라벨로 처리됨.

**Scenario 5: 성분명 정규화**
- **Given**: `standard_name="  cholecalciferol  "`(앞뒤 공백, 소문자)
- **When**: `resolveMfdsIngredient()` 호출
- **Then**: 내부에서 `"Cholecalciferol"`로 정규화되고, 로컬 Hit이 성공한다.

**Scenario 6: Bulk Fetch 최적화**
- **Given**: 성분 20개 중 15개가 로컬 Hit, 5개가 Miss
- **When**: `resolveMfdsIngredientsBatch([...20 names])` 호출
- **Then**: `prisma.findMany`는 1회만 호출되고, MFDS API는 5회(병렬 최대 5)만 호출된다. 전체 응답 ≤ 2,000ms.

**Scenario 7: 30일 초과 캐시 만료**
- **Given**: 로컬 Hit이지만 `updated_at`이 31일 전
- **When**: `resolveMfdsIngredient()` 호출
- **Then**: 오래된 데이터 판정 → API 재조회 시도. API 성공 시 업데이트, 실패 시 Stale 데이터로 폴백하며 `event: "mfds_cache_stale_served"` 경고 로그.

**Scenario 8: Rate Limit 도달**
- **Given**: 분당 60건 한도에 도달한 상태
- **When**: 61번째 호출이 발생
- **Then**: API 호출은 스킵되고, 로컬에서만 조회. 로컬 Miss면 `FALLBACK_EMPTY` 반환. Rate limit 해제 후 정상화.

## :gear: Technical & Non-Functional Constraints
- **폴백 전략 (EXT-SYS-02)**: "사전 벌크 수집된 로컬 DB가 기본, API는 보조". 따라서 **로컬 미스 시에만 API 호출**하는 방향이 원칙이며, "실질적 품질 저하 없음" SLA를 유지.
- **공전 원문 보존 (CON-2, REQ-FUNC-011)**: `claim` 값은 **식약처 공전 원문 그대로** 저장·반환. 편집·요약·번역 금지. 일상어 번역은 F2-C-003에서 별도 필드로 부가.
- **CQRS Query 순수성의 예외**: 본 Query는 `INGREDIENT` 업서트라는 **부수 효과(side effect)**를 포함한다. 이는 "캐시 워밍"이라는 명시적 read-through 패턴으로 정당화되며, 별도 Command 태스크로 분리하지 않는다. 대신 **업서트 경로에 feature flag `MFDS_CACHE_WRITEBACK_ENABLED`** 를 두어 읽기 전용 모드 운영 옵션 제공.
- **성능 (REQ-NF-002)**: Badge API p95 ≤ 1,000ms 예산 중 본 Query는 최악의 경우(API 호출 포함) 500ms를 초과해선 안 됨. Hot Path(로컬 Hit)는 10ms 이하.
- **가용성 (REQ-NF-006, CP-1)**: MFDS API 장애와 무관하게 99.9% 가용성 보장. 폴백 경로가 반드시 동작해야 함.
- **ChannelAdapter 패턴 (REQ-NF-024)**: `MfdsAdapter` 인터페이스로 추상화하여 구현체 교체 가능. 향후 다른 공공 데이터 소스 추가 시 기존 Query 로직 변경 없이 확장.
- **API 키 관리**: `MFDS_API_KEY`는 Vercel 환경변수로만 주입. 절대 코드에 하드코딩 금지.
- **PII 중립**: 성분명은 PII 아님. 로깅 자유. 단 응답의 `claim` 원문은 과도한 크기(>5KB)일 경우 truncate.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~8)를 충족하는가?
- [ ] `MfdsAdapter` 인터페이스 + HTTP/Fake 구현체가 `src/lib/adapters/mfds/`에 분리 배치되었는가?
- [ ] `resolveMfdsIngredient()` 단건 함수와 `resolveMfdsIngredientsBatch()` 배치 함수가 모두 제공되는가?
- [ ] 로컬 캐시 우선 → API 폴백 → Hard Fallback의 3단 경로가 Unit Test로 모두 검증되었는가?
- [ ] Rate Limit Guard가 작동하며, 한도 초과 시 로컬 Only 모드로 우회하는가?
- [ ] `MFDS_CACHE_WRITEBACK_ENABLED` feature flag가 `src/lib/features.ts`에 등록되고 기본값이 true인가?
- [ ] 구조화 로그에 `source`, `cache_hit`, `duration_ms`가 포함되는가?
- [ ] Stale 데이터 (>30일) 감지 로직이 동작하고, 경고 로그가 기록되는가?
- [ ] `pnpm typecheck`, `pnpm test` 모두 통과?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #DATA-003 (INGREDIENT 스키마)
  - #DATA-011 (시드 데이터, 사전 벌크 수집 데이터)
  - #API-007 (MFDS 타입 정의)
  - #MOCK-006 (MFDS API Stub, 개발/테스트용)
- **Blocks**:
  - #F2-C-001 (뱃지 판정 로직 — `MfdsResolution`을 입력으로 사용)
  - #F2-C-003 (전문용어 일상어 번역 — `claim` 원문 입력)
  - #F2-C-004 (미등재 원료 회색 라벨 — `status: NOT_REGISTERED | UNKNOWN` 분기)
  - #TEST-F2-001 (공전 1:1 매칭 불일치율 < 0.5% 검증)
  - #CRON-001 (월 1회 벌크 갱신 배치의 기반 함수로 재사용)

## :bookmark_tabs: Notes
- SRS §3.1.1의 "실질적 품질 저하 없음"을 유지하려면 **사전 벌크 수집(DATA-011) 커버리지가 90% 이상**이어야 한다. 본 Query 자체는 "잘 설계된 폴백 경로"일 뿐, 진짜 가용성은 시드 데이터 커버리지가 결정함.
- `MfdsResolution.source` 필드는 **관측성 핵심 신호**. 운영 시 `LOCAL_CACHE` 비율이 95% 이상이면 건강, `MFDS_API` 직접 호출이 10%를 넘으면 시드 데이터 갱신 주기 단축 검토.
- 30일 캐시 만료 정책은 SRS CP-1의 "월 1회 갱신"과 일치. Phase 2에서 공전 갱신 이벤트를 수신하는 webhook이 추가되면 만료 정책 완화 가능.
