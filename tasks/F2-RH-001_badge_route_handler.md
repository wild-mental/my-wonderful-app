---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-RH-001: Badge Route Handler 조립 (GET /api/v1/badges)"
labels: 'feature, backend, api, epic:E-F2, priority:critical, phase:2, cqrs:route-handler'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-RH-001] Badge API Route Handler 조립
- 목적: `GET /api/v1/badges?product_id=xxx` HTTP 엔드포인트를 Next.js Route Handler로 구현하여 F2 Anti-BS Dashboard 백엔드 파이프라인을 외부에 노출한다. 요청 검증(API-002 DTO) → 캐시 조회(F2-C-005) → Miss 시 성분 조회(F2-Q-001) + 공전 조회(F2-Q-002) + 판정(F2-C-001) + 번역(F2-C-003) + 회색 라벨(F2-C-004) → 캐시 저장 → 응답 직렬화까지의 **전체 흐름을 CQRS 원칙으로 조립**한다. REQ-NF-002(p95 ≤ 1,000ms)를 충족한다.
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS Route Handler 계층)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API: [`/05_SRS_v1.md#6.1.2 INT-API-02`](../05_SRS_v1.md) — `GET /api/v1/badges`
- SRS 시퀀스: [`/05_SRS_v1.md#3.4.2`](../05_SRS_v1.md), [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md)
- SRS 핵심 요구: [`/05_SRS_v1.md#4.1.2 REQ-FUNC-010~015`](../05_SRS_v1.md)
- SRS 성능: [`/05_SRS_v1.md#4.2.1 REQ-NF-002`](../05_SRS_v1.md) — p95 ≤ 1,000ms
- SRS 제약: [`/05_SRS_v1.md#1.2.3 CON-7, CON-8`](../05_SRS_v1.md) — Next.js 모놀리스, Route Handler 필수
- 선행 DTO 명세: [`API-002_badge_dto.md`](./API-002_badge_dto.md)
- 선행 Query/Command: [`F2-Q-001_ingredient_list_query.md`](./F2-Q-001_ingredient_list_query.md), [`F2-Q-002_mfds_functional_ingredient_query.md`](./F2-Q-002_mfds_functional_ingredient_query.md), [`F2-C-001_badge_decision_logic.md`](./F2-C-001_badge_decision_logic.md), [`F2-C-003_common_language_translation.md`](./F2-C-003_common_language_translation.md), [`F2-C-004_unregistered_ingredient_gray_label.md`](./F2-C-004_unregistered_ingredient_gray_label.md), [`F2-C-005_badge_caching.md`](./F2-C-005_badge_caching.md)
- 관련 에러 스키마: [`API-008_common_error_schema.md`](./API-008_common_error_schema.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **API-002** (DTO), **API-008** (공통 에러), **F2-Q-001/002, F2-C-001/002/003/004/005** 전원
- 후행 태스크: TEST-F2-006 (p95 검증), UI-020 (클라이언트 연동)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Route Handler 파일 생성** — `src/app/api/v1/badges/route.ts`:
  - `export async function GET(request: NextRequest): Promise<NextResponse<BadgeResponse>>`
  - `runtime: "nodejs"` (Edge Runtime 사용 금지 — Prisma 호환성 + MFDS HTTP Adapter)
  - `dynamic: "force-dynamic"` (캐시는 내부 F2-C-005가 담당, Next.js 캐시 비활성)
- [ ] **요청 검증 레이어** — `src/app/api/v1/badges/_lib/validate-request.ts`:
  - `URL.searchParams`에서 `product_id` 추출
  - Zod 스키마(`BadgeRequestSchema`, API-002 재사용) 검증
  - 검증 실패 → `API-008`의 `CommonErrorResponse` 포맷으로 400 반환
- [ ] **의존성 주입 컨테이너** — `src/app/api/v1/badges/_lib/container.ts`:
  - Factory 함수 `createBadgeHandlerDeps()`가 prisma, mfdsAdapter, cache, decideBadges, translator를 묶어 반환
  - 테스트 시 주입 교체 가능 (DI 원칙)
- [ ] **핸들러 메인 로직** — 다음 순서로 조립:
  1. **Validation**: `validateRequest(request)` → 실패 시 400 + 에러 응답
  2. **Cache Lookup**: `getBadgeCache(product_id)` → Hit 시 직렬화 + `X-Cache: HIT` 헤더 + 200 응답 즉시 반환
  3. **Miss Path** (아래 순서):
     - a. `getIngredientsByProductId(product_id)` → `ProductNotFoundError` 시 404, `EmptyIngredientSetError`는 빈 응답
     - b. `resolveMfdsIngredientsBatch(standardNames)` → Map 생성
     - c. `decideBadgesForProduct()` → `BadgeDecisionResult[]` + `gray_label` 후보 분리
     - d. `translateIngredientsBatch(standardNames)` → `common_name` 병기
     - e. `createGrayLabelsForMissing()` → `GrayLabel[]`
     - f. `setBadgeCache(product_id, pipelineResult)` → L1/L2 Write-Through
  4. **응답 직렬화**: `BadgeResponse` DTO로 변환, `from_cache: false`, `cache_expires_at` 계산하여 반환
- [ ] **응답 헤더 정책**:
  - `Cache-Control: private, max-age=60` (브라우저 단에서 60초 재사용, CDN 캐시는 비활성)
  - `X-Cache: HIT | MISS | BYPASS | STALE`
    - `HIT`: L1/L2 정상 적중
    - `MISS`: 파이프라인 실행 후 저장
    - `BYPASS`: 아래 **한정된 조건**에서만 발급 (아래 별도 체크)
    - `STALE`: MFDS 폴백으로 이전 캐시 값 재사용 시
  - `X-Response-Source: cache_l1 | cache_l2 | computed | stale_fallback`
  - `Server-Timing: validate;dur=X, cache;dur=X, pipeline;dur=X` (관측성)
  - `X-Feature-Flags: badge_cache=${BADGE_CACHE_ENABLED},mfds_api=${MFDS_API_ENABLED}` (운영 디버깅용)
- [ ] **`X-Cache: BYPASS` 발급 조건 (엄격 제한)** — 4가지 외 사용 금지:
  1. `BADGE_CACHE_ENABLED=false` Feature Flag로 캐시 완전 비활성
  2. 요청 헤더 `Cache-Control: no-cache` 수신 시 (디버깅/어드민 용도, 내부 IP 화이트리스트 필요)
  3. 관리자 강제 재판정 쿼리 `?force_recompute=1` + RBAC 검증 통과
  4. 캐시 레이어 자체가 에러(Redis down 등) — 구조화 로그 `event="badges.cache.unavailable"` 동반
  - 일반 cache miss는 `BYPASS`가 아닌 `MISS`로 기록. 혼동 방지.
- [ ] **Feature Flag 처리**:
  - `BADGE_CACHE_ENABLED`(기본 true): false면 캐시 bypass, 전 요청 파이프라인 실행 + `X-Cache: BYPASS`
  - `MFDS_API_ENABLED`(기본 true): false면 MFDS 실 API 호출 생략하고 즉시 Graceful Degradation 경로로 진입(`meta.fallback=true`, `meta.fallback_reason="MFDS_API_DISABLED_BY_FLAG"`). 성능 문제·MFDS 장기 장애 시 운영자가 즉시 회피 가능.
  - 두 플래그 상태는 구조화 로그 + `X-Feature-Flags` 응답 헤더로 관측.
- [ ] **에러 핸들링 & Escalation 정책** — `src/app/api/v1/badges/_lib/error-handler.ts`:
  - `ProductNotFoundError` → 404 `PRODUCT_NOT_FOUND`, Sentry=info
  - `EmptyIngredientSetError` → 200 + 빈 `badges[]`, `unregistered[]` + `meta.warning` 필드
  - `ProhibitedExpressionError` → **법률 리스크 최우선 대응**:
    1. 500 `INTERNAL_SERVER_ERROR`로 사용자 응답(상세 노출 금지)
    2. Sentry severity=`fatal`, tag `domain=legal`, context에 `product_id` + 원인 성분(해시) 포함
    3. Slack `#legal-alert` + `#platform-oncall` 양 채널 Webhook 발송
    4. PagerDuty 트리거(on-call 엔지니어 즉시 호출) — NFR-SEC-006 연계
    5. 해당 `product_id`의 캐시 **즉시 tombstone 처리**(잘못된 표현이 캐시에 남아 재노출되는 사고 방지)
    6. 구조화 로그 `event="badges.prohibited_expression.detected"` + `level="error"` + `audit=true`
    7. 관리자 대시보드(ADM) `legal_review_queue`에 자동 티켓 생성
  - `MfdsApiError` + `FALLBACK_EMPTY` 경로 도달 → 200으로 처리(Graceful Degradation), `meta.fallback=true`, `meta.fallback_reason="MFDS_UPSTREAM_ERROR"` 표시. Sentry=warn, 5분 내 3건 초과 시 `#platform-oncall` 경보.
  - 그 외 예외 → 500 `INTERNAL_SERVER_ERROR`, trace id 발급, Sentry=error.
- [ ] **Rate Limiting** (선택, Phase 2 준비):
  - `src/app/api/v1/badges/_lib/rate-limit.ts`에 placeholder
  - IP 기반 60 req/min (공개 API 학습 기준). 실제 Redis 도입 시 활성화
- [ ] **타임아웃 가드** — `AbortController` + `setTimeout(5000)`:
  - 전체 핸들러가 5초 내 완료되지 않으면 강제 중단 + 504 반환
  - 이는 Vercel Functions 10초 기본 타임아웃보다 짧게 설정해 **의미 있는 에러 응답**을 보장
- [ ] **관측 로깅** — 구조화 로그:
  - `event="badges.api.request"`, `product_id`, `cache_result`, `duration_ms`, `status_code`, `trace_id`
  - 200 이외 응답은 `level="warn"` 또는 `"error"`, Sentry breadcrumb 기록
- [ ] **Request/Response 직렬화** — `src/app/api/v1/badges/_lib/serializer.ts`:
  - 내부 도메인 모델(`BadgePipelineResult`) → `BadgeResponse`(API-002) 변환
  - Decimal → string 직렬화 확인
  - `common_name: null` 표현 정책 (Phase 2에서 회색 라벨 통합 여부 결정)
- [ ] **보안**: 
  - `product_id`는 공개 식별자이므로 인증 불요
  - 단, `X-Forwarded-For` IP 집계로 비정상 패턴 탐지 (NFR-SEC-001 연계)
- [ ] **OPTIONS 처리** (CORS): 
  - MVP는 동일 Origin 모놀리스이므로 CORS 비활성. Phase 2 외부 API 공개 시 확장
- [ ] **Unit Test 작성** — `tests/app/api/v1/badges/route.test.ts` 12건 이상:
  - 정상 응답 (Cache Hit / Miss)
  - 잘못된 요청(product_id 누락 / 빈 문자열)
  - 제품 부존재 → 404
  - 성분 0건 → 200 빈 응답 + warning
  - MFDS Fallback → 200 + `meta.fallback: true`
  - `ProhibitedExpressionError` 포착 → 500 + Sentry Critical
  - 타임아웃 5초 초과 → 504
  - Server-Timing / X-Cache 헤더 검증
- [ ] **Integration Test (E2E)** — `tests/e2e/badges-api.e2e.test.ts` 5건:
  - 실제 DB + Mock MFDS + 실제 Route Handler 호출
  - Cache Hit → Miss → Cache Hit 순서로 3회 호출 검증
  - 제품 P1(성분 5개)에 대해 응답 스키마 정합성 검증
- [ ] **성능 벤치마크** — `tests/perf/badges-api.bench.ts`:
  - 캐시 Warm 상태에서 p95 ≤ 1,000ms
  - 캐시 Cold(1st request) 포함 p99 ≤ 2,500ms

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 요청 — Cache Hit**
- **Given**: `product_id=P1`의 뱃지 결과가 L2 캐시에 존재 (3일 전 업데이트)
- **When**: `GET /api/v1/badges?product_id=P1` 호출
- **Then**: 200 응답, `from_cache: true`, `badges: [...]`, `X-Cache: HIT`, `Server-Timing`에 pipeline=0ms. 전체 응답 ≤ 50ms.

**Scenario 2: 정상 요청 — Cache Miss → 파이프라인 실행**
- **Given**: `product_id=P2`, 캐시 Cold
- **When**: 요청
- **Then**: 200 응답, `from_cache: false`, BADGE DB 레코드 저장됨, `X-Cache: MISS`, `Server-Timing`에 각 단계 시간 기록.

**Scenario 3: product_id 누락 — 400**
- **Given**: `GET /api/v1/badges` (쿼리 파라미터 없음)
- **When**: 요청
- **Then**: 400 응답, `{ error: { code: "INVALID_REQUEST", message: "product_id is required" } }` (API-008 포맷).

**Scenario 4: 존재하지 않는 제품 — 404**
- **Given**: `product_id=INVALID`
- **When**: 요청
- **Then**: 404 응답, `{ error: { code: "PRODUCT_NOT_FOUND" } }`.

**Scenario 5: 성분 0건 — 200 빈 응답 + warning**
- **Given**: PRODUCT P3 존재하나 INGREDIENT 0건
- **When**: 요청
- **Then**: 200 응답, `badges: [], unregistered: [], meta: { warning: "No ingredients found" }`.

**Scenario 6: MFDS API 장애 — Graceful Degradation**
- **Given**: MFDS API 503, 로컬 DB에 일부 데이터 존재
- **When**: 요청
- **Then**: 200 응답, `meta.fallback: true`, `unregistered`에 UNKNOWN 성분 포함. 클라이언트는 일부 결과 + 폴백 안내 표시.

**Scenario 7: 금지 표현 검출 — 500 + Fatal Escalation**
- **Given**: 판정 과정에서 `ProhibitedExpressionError` 발생 (데이터 오염, CON-2 위반)
- **When**: 요청
- **Then**: 500 응답, `{ error: { code: "INTERNAL_SERVER_ERROR", trace_id: "xxx" } }` (상세 노출 금지). Sentry severity=`fatal` + Slack `#legal-alert` + `#platform-oncall` + PagerDuty 트리거. 해당 `product_id` 캐시가 tombstone 처리되어 재조회 시 동일 오염이 다시 노출되지 않음. 관리자 `legal_review_queue`에 티켓 자동 생성.

**Scenario 7b: MFDS 비활성 Feature Flag**
- **Given**: 운영자가 `MFDS_API_ENABLED=false`로 전환(MFDS 장기 장애 대응)
- **When**: `GET /api/v1/badges?product_id=P1`
- **Then**: 200 응답, `meta.fallback=true`, `meta.fallback_reason="MFDS_API_DISABLED_BY_FLAG"`, `X-Feature-Flags` 헤더에 `mfds_api=false` 포함. 외부 호출 0건. 응답 시간 ≤ 300ms.

**Scenario 7c: 캐시 레이어 에러 (Redis down)**
- **Given**: Redis 연결 실패로 `getBadgeCache`가 throw
- **When**: 요청
- **Then**: 200 응답(파이프라인 계속 실행), `X-Cache: BYPASS`, `X-Response-Source: computed`, 구조화 로그 `event="badges.cache.unavailable"` + Sentry=warn. 5분 내 10건 초과 시 on-call 경보.

**Scenario 8: 타임아웃 — 504**
- **Given**: 판정 파이프라인이 의도적 지연 5초 초과
- **When**: 요청
- **Then**: 504 응답, `{ error: { code: "REQUEST_TIMEOUT" } }`, `AbortController` 동작 확인.

**Scenario 9: 성능 요건 p95 ≤ 1,000ms**
- **Given**: 100 제품 대상 1,000회 반복 요청 (캐시 Warm)
- **When**: 벤치마크
- **Then**: p95 ≤ 1,000ms, p99 ≤ 2,000ms.

**Scenario 10: 응답 헤더 검증**
- **Given**: 정상 응답
- **When**: 응답 수신
- **Then**: `X-Cache`, `X-Response-Source`, `Server-Timing`, `Cache-Control` 모두 존재.

**Scenario 11: Cache 동시성 — SingleFlight**
- **Given**: 동일 product_id로 동시 100건 요청, 캐시 Miss 상태
- **When**: 동시 처리
- **Then**: 판정 파이프라인이 1회만 실행 (F2-C-005 SingleFlight), BADGE DB INSERT도 1건, 나머지 99건은 동일 결과 공유.

**Scenario 12: 응답 스키마 정합성**
- **Given**: API-002의 `BadgeResponseSchema` Zod 스키마
- **When**: 실제 응답을 스키마로 parse
- **Then**: 모든 필드가 정확히 일치, validation 에러 없음.

## :gear: Technical & Non-Functional Constraints
- **아키텍처 (CON-7, CON-8)**: 반드시 Next.js `app/api/` Route Handler로 구현. Express/NestJS 등 별도 서버 절대 금지.
- **Runtime**: `nodejs` (not `edge`) — Prisma Client + MFDS HTTP Adapter 의존성 때문.
- **성능 (REQ-NF-002)**: 캐시 Warm 기준 p95 ≤ 1,000ms. 캐시 Miss 시 판정 + DB + MFDS 폴백 포함 800ms 이내.
- **CQRS 조립 (P2)**: Route Handler는 **Query/Command 모듈을 호출만** 수행. 비즈니스 로직 중복 구현 절대 금지. 판정/캐시/번역은 각각 F2-C-001/005/003에 위임.
- **타입 안정성**: 요청은 API-002의 Zod 스키마로 검증, 응답은 직렬화 헬퍼로 타입 일치 보장.
- **에러 응답 통일 (API-008)**: 모든 에러 응답은 `CommonErrorResponse` 포맷. `trace_id` 포함, 사용자에게 내부 정보 누출 금지.
- **관측성 (REQ-NF-021)**: Vercel Logs 구조화 로그 + Server-Timing 헤더. p95 > 3초 또는 5xx > 1% 시 Slack 경보.
- **보안 (NFR-SEC-001)**: 
  - product_id는 공개 식별자 → 인증 불요
  - 비정상 요청 패턴(초당 100건 이상)은 IP 기반 로깅
- **Graceful Degradation**: MFDS 장애가 전체 API 장애로 번지지 않도록 Fallback 경로 필수. 로컬 DB 기반으로 부분 응답 제공.
- **폴백 응답**: `meta.fallback: true` + `unregistered`에 UNKNOWN 포함. UI는 이를 보고 사용자에게 "일시적 데이터 부족" 안내.
- **타임아웃**: 5초 내부 타임아웃 (Vercel 10초 한계보다 짧게). 초과 시 명시적 504.
- **CORS**: MVP는 동일 Origin 모놀리스로 CORS 비활성. 외부 공개 시 Phase 2 확장.
- **멱등성**: GET은 멱등. 부수 효과는 캐시 저장만 (실제 상태 변경 없음).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~12)를 충족하는가?
- [ ] `src/app/api/v1/badges/route.ts`에 `GET` 핸들러가 구현되었는가?
- [ ] 요청 검증 → 캐시 조회 → 파이프라인 실행 → 캐시 저장 → 응답 직렬화의 전 흐름이 조립되었는가?
- [ ] CQRS 원칙에 따라 비즈니스 로직이 Route Handler 외부(commands/queries)에 위임되었는가?
- [ ] API-008 공통 에러 포맷으로 모든 에러 응답이 통일되었는가?
- [ ] Server-Timing, X-Cache(HIT/MISS/BYPASS/STALE 4-value), X-Response-Source, X-Feature-Flags 헤더가 정확히 설정되는가?
- [ ] `X-Cache: BYPASS`가 4가지 허용 조건에서만 발급되고, 일반 cache miss에는 발급되지 않는가?
- [ ] `MFDS_API_ENABLED`, `BADGE_CACHE_ENABLED` Feature Flag가 각각 동작하고 응답 헤더에 반영되는가?
- [ ] MFDS 장애 시 Graceful Degradation(fallback meta + fallback_reason)이 동작하는가?
- [ ] 5초 타임아웃 가드가 동작하는가?
- [ ] `ProhibitedExpressionError` 발생 시 5-tier Escalation(Sentry fatal + Slack #legal-alert + #platform-oncall + PagerDuty + 캐시 tombstone + 관리자 큐)이 모두 동작하는가?
- [ ] 성능 벤치마크(p95 ≤ 1,000ms)가 CI 게이트로 통과하는가?
- [ ] Unit Test 12건 + E2E Test 5건이 모두 통과하는가?
- [ ] 응답 스키마 정합성이 API-002 Zod 스키마로 검증되는가?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #API-002 (Badge Request/Response DTO)
  - #API-008 (공통 에러 스키마)
  - #DATA-005 (BADGE 스키마)
  - #F2-Q-001 (성분 목록 Query)
  - #F2-Q-002 (MFDS 공전 Query)
  - #F2-C-001 (뱃지 판정)
  - #F2-C-002 (금지 표현 검증, 간접)
  - #F2-C-003 (번역)
  - #F2-C-004 (회색 라벨)
  - #F2-C-005 (캐싱)
- **Blocks**:
  - #UI-020 (제품 상세 페이지 — 본 API 소비)
  - #TEST-F2-006 (Badge API 성능·정합성 E2E)
  - #NFR-PERF-001 (전체 API p95 모니터링)
  - #NFR-MON-001 (구조화 로그 대시보드)

## :bookmark_tabs: Notes
- 본 Route Handler는 F2 파이프라인의 **외부 공개 경계**이자, CQRS 아키텍처의 **조립 지점**이다. 내부에 비즈니스 로직을 쓰지 말고 Query/Command 호출로만 유지해야 추후 gRPC, GraphQL, 또는 다른 트랜스포트로의 이전이 용이해진다.
- Phase 2 확장 시:
  - **공개 API화**: API Key 기반 인증 + Rate Limit 활성화 (NFR-SEC-001)
  - **GraphQL 병행**: 같은 Query/Command를 resolver에서 호출 (본 Route Handler는 REST 전용 유지)
  - **CDN 캐시**: `Cache-Control: public, s-maxage=60`으로 전환 시 L3 캐시 추가 효과
- `Server-Timing` 헤더는 Chrome DevTools Network 탭에서 시각화되어 **성능 병목 분석에 필수**. 운영 환경에서도 유지.
- 본 Route Handler가 **Next.js 모놀리스 아키텍처의 진수**를 보여주는 모듈이다. F1(Super-Calc Route Handler)과 함께 MVP의 2대 핵심 API이며, 여기서 확립한 패턴이 F3/F4로 확산된다.
