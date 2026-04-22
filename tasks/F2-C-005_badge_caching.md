---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-C-005: 뱃지 결과 캐싱 로직 (BADGE 테이블 영속 캐시 + 메모리 LRU)"
labels: 'feature, backend, epic:E-F2, priority:high, phase:2, cqrs:command, performance'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-C-005] 뱃지 결과 캐싱 Command 로직
- 목적: F2-C-001의 뱃지 판정 결과를 **2단 캐시**(DB BADGE 테이블 영속 + 메모리 LRU 휘발)로 관리하여 REQ-NF-002(p95 ≤ 1,000ms)를 안정적으로 달성한다. 공전 갱신 주기(월 1회)에 맞춘 TTL 정책과 **캐시 무효화**(Invalidation) 경로를 함께 제공한다. 본 Command는 F2-RH-001 Route Handler에서 판정 전/후에 호출된다.
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (성능): [`/05_SRS_v1.md#4.2.1 REQ-NF-002`](../05_SRS_v1.md) — 뱃지 p95 ≤ 1,000ms, 식약처 DB 캐시 활용
- SRS 문서 (폴백): [`/05_SRS_v1.md#3.1.1 EXT-SYS-02`](../05_SRS_v1.md) — 사전 벌크 수집 로컬 DB 기본 + 월 1회 갱신
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.4 BADGE`](../05_SRS_v1.md)
- 관련 태스크: [`F2-C-001_badge_decision_logic.md`](./F2-C-001_badge_decision_logic.md), [`DATA-005_badge_schema.md`](./DATA-005_badge_schema.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F2-C-001** (판정), **DATA-005** (BADGE 스키마)
- 후행 태스크: F2-RH-001 (Route Handler 조립), CRON-001 (월 1회 벌크 갱신), COM-C-004 (관리자 뱃지 재판정)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **캐시 계층 설계 문서 작성** — `docs/architecture/badge-cache.md`:
  - L1: 메모리 LRU (NodeJS 프로세스 내, 500 제품 × 5성분 = 2,500 엔트리, TTL 10분)
  - L2: DB BADGE 테이블 (영속, `updated_at` 기반 TTL 30일, 공전 갱신 주기와 정합)
  - L3: 판정 로직 재실행 (L1/L2 Miss 시)
  - 캐시 Key 규약: `product:{product_id}:v{schema_version}`
- [ ] **메모리 LRU 구현** — `src/server/f2/cache/memory-lru.ts`:
  - `lru-cache` 또는 자체 구현 (`Map` + `insertOrder` 기반)
  - 단일 인스턴스 싱글톤 (`src/lib/singleton.ts` 활용)
  - Vercel Serverless 환경 고려: Cold Start 시 캐시는 비어있음, Warm 인스턴스만 활용. **Redis 도입은 MVP 예산상 배제(REQ-NF-020)**
- [ ] **`getBadgeCache()` 함수** — `src/server/f2/cache/get-badge-cache.ts`:
  - Signature: `(productId: string) => Promise<BadgeCacheEntry | null>`
  - 순서: L1 Memory Hit → L2 DB Hit → null(Miss)
  - L2 Hit 시 L1으로 승격(warm up)
  - TTL 검증: `updated_at + 30일 < now()`이면 Stale 취급 → null 반환 (재계산 유도)
- [ ] **`setBadgeCache()` 함수** — `src/server/f2/cache/set-badge-cache.ts`:
  - Signature: `(productId: string, result: BadgePipelineResult) => Promise<void>`
  - L1/L2 동시 쓰기
  - L2 쓰기는 `saveBadge()`와 연계되어 이미 DB에 저장된 경우 update만 수행
  - **Write-Through 전략** (L1/L2 동시 갱신, Race Condition 방어)
- [ ] **`invalidateBadgeCache()` 함수** — `src/server/f2/cache/invalidate-badge-cache.ts`:
  - 트리거:
    - MFDS 공전 월 1회 갱신 이후 전체 무효화 (CRON-001에서 호출)
    - 관리자 수동 재판정 (ADM-C-001/002)
    - 제보 검증 완료 시 데이터 변경 반영 (**F4-C-003 `RESOLVED` 상태 전이 시점**) — 보상 지급(F4-C-005)과는 별개 호출 경로
  - Signature: `(scope: "ALL" | { productId: string } | { ingredientId: string }) => Promise<{ invalidated: number }>`
  - L1 Memory: 해당 Key 제거
  - L2 DB: `updated_at`을 `now()-31일`로 강제 조정하여 Stale 취급 (DELETE가 아닌 Tombstone 전략 — 감사 이력 보존)
- [ ] **BadgePipelineResult 타입 정의** — `src/server/f2/types/badge-pipeline-result.ts`:
  - 캐시 엔트리 단위:
    - `productId: string`
    - `badges: BadgeView[]` (각 성분별 APPROVED/CAUTION/NOT_APPROVED)
    - `grayLabels: GrayLabel[]` (F2-C-004 산출물)
    - `computedAt: Date`
    - `schemaVersion: number` (스키마 변경 시 캐시 전면 무효화용)
- [ ] **캐시 Hit/Miss 메트릭**:
  - 구조화 로그: `event="badge_cache"`, `result="hit_l1"|"hit_l2"|"miss"`, `product_id`, `duration_ms`
  - Hit Rate = `(hit_l1 + hit_l2) / total`을 NFR-MON-001 대시보드에 노출
  - 목표: L1 Hit Rate ≥ 60%, L2 Hit Rate ≥ 85% (통합 Hit Rate)
- [ ] **Stampede 방어** — `src/server/f2/cache/single-flight.ts`:
  - 동일 productId에 대해 동시 요청이 몰릴 때 판정 로직이 N번 실행되는 것을 방지 (SingleFlight 패턴)
  - 내부 Promise 맵 `inFlight: Map<string, Promise<BadgePipelineResult>>`
  - 첫 요청이 판정 중이면 후속 요청은 동일 Promise를 await
- [ ] **Schema Version 관리**:
  - `BADGE_CACHE_SCHEMA_VERSION` 상수 (`src/server/f2/cache/version.ts`)
  - 캐시 엔트리 스키마 변경 시 버전 bump → 기존 캐시 모두 무효화 (Key에 포함된 버전이 다르면 Miss 처리)
- [ ] **Feature Flag** — `src/lib/features.ts`:
  - `BADGE_CACHE_ENABLED` (기본 true)
  - 장애 대응 시 `false`로 전환하면 L1/L2 모두 Bypass (순수 재계산)
- [ ] **Unit Test 작성** — `tests/server/f2/cache/*.test.ts` 15건 이상:
  - L1 Hit / L2 Hit / Miss 시나리오 각 2건
  - TTL 만료 처리 3건
  - Write-Through 일관성 2건
  - SingleFlight 동시성 테스트 2건
  - 무효화 범위(ALL / productId / ingredientId) 3건
  - Feature Flag off 시 Bypass 1건
- [ ] **Integration Test** — CRON-001이 전체 무효화 → 재판정 루프가 정상 작동 1건
- [ ] **성능 벤치마크** — `tests/perf/badge-cache.bench.ts`:
  - L1 Hit p95 ≤ 5ms
  - L2 Hit p95 ≤ 50ms
  - Miss (재계산) p95 ≤ 800ms

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: L1 Memory Cache Hit**
- **Given**: productId `P1`의 뱃지 결과가 L1에 5분 전 저장됨
- **When**: `getBadgeCache("P1")` 호출
- **Then**: L1에서 반환, DB 쿼리 발생 없음. 구조화 로그 `result="hit_l1"`, `duration_ms <= 5`.

**Scenario 2: L2 DB Cache Hit → L1 Warm Up**
- **Given**: L1에 없음, L2 DB의 BADGE 레코드 5건 존재 (`updated_at`: 3일 전)
- **When**: `getBadgeCache("P1")` 호출
- **Then**: L2에서 성공적으로 조회 후 L1에 저장됨. 이후 호출은 L1 Hit. 로그 `result="hit_l2"`.

**Scenario 3: TTL 만료 처리**
- **Given**: L2 DB의 BADGE `updated_at`이 31일 전
- **When**: `getBadgeCache("P1")` 호출
- **Then**: Stale 취급으로 null 반환 → 호출자가 F2-C-001 재계산 후 `setBadgeCache()` 호출.

**Scenario 4: Write-Through 일관성**
- **Given**: 새로운 판정 결과 저장
- **When**: `setBadgeCache("P1", result)` 호출
- **Then**: L1과 L2 모두 동일한 데이터로 갱신. DB 트랜잭션 내에서 BADGE upsert + memory set 원자 처리.

**Scenario 5: 전체 무효화 (CRON)**
- **Given**: CRON-001이 월 1회 공전 갱신 후 `invalidateBadgeCache("ALL")` 호출
- **When**: 무효화 실행
- **Then**: L1 메모리 전량 삭제, L2 `updated_at` 전체 31일 전 강제 설정. 다음 요청은 모두 Miss → 재계산.

**Scenario 6: 제품 단위 무효화**
- **Given**: 관리자가 P1의 데이터 수정 후 `invalidateBadgeCache({ productId: "P1" })` 호출
- **When**: 무효화 실행
- **Then**: P1만 무효화, 다른 제품 캐시는 영향 없음.

**Scenario 7: SingleFlight — 동시성 방어**
- **Given**: P1 캐시 Miss 상태에서 동시에 50건 요청 유입
- **When**: 각 요청이 `getBadgeCache` → Miss → 재계산 경로
- **Then**: F2-C-001 판정 로직은 **단 1회만** 실행. 나머지 49건은 동일 Promise를 공유. DB INSERT도 1건.

**Scenario 8: Stale 데이터 서빙 거부**
- **Given**: L2 `updated_at`이 45일 전
- **When**: 조회
- **Then**: null 반환, 재계산 유도. Stale 데이터를 절대 서빙하지 않음 (공전 원문 정합성).

**Scenario 9: Hit Rate 목표 달성**
- **Given**: 상위 300개 제품 기준 일 10,000건 조회
- **When**: 일 마감 시 메트릭 집계
- **Then**: L1+L2 통합 Hit Rate ≥ 85%.

**Scenario 10: Feature Flag Off**
- **Given**: `BADGE_CACHE_ENABLED=false` 설정
- **When**: 모든 요청 처리
- **Then**: L1/L2 모두 Bypass, 매 요청마다 F2-C-001 재실행. Hit Rate = 0%.

**Scenario 11: Schema Version Bump**
- **Given**: `BADGE_CACHE_SCHEMA_VERSION`을 2 → 3으로 상승
- **When**: 배포 후 요청 처리
- **Then**: 기존 Key(`product:P1:v2`)는 전부 Miss → 신규 Key(`...v3`)로 재생성.

## :gear: Technical & Non-Functional Constraints
- **성능 예산 (REQ-NF-002)**: 
  - 뱃지 API 전체 p95 ≤ 1,000ms
  - 본 캐시 레이어는 L1 Hit 시 5ms 이내, L2 Hit 시 50ms 이내 완료 목표
  - Miss 시 재계산 포함 800ms 이내
- **공전 갱신 주기 (CP-1, EXT-SYS-02)**: 월 1회 → TTL 30일. 공전 갱신 이벤트가 CRON-001에서 발생하면 즉시 무효화.
- **Vercel Serverless 제약**: 
  - Cold Start 시 L1 비어있음 → L2(DB)에 의존도 높음
  - Warm 인스턴스 수명: ~15분. L1 TTL 10분은 이보다 짧게 설정
  - **Redis 도입은 MVP 범위 외** (월 $10~20 추가 비용, REQ-NF-020 한계)
- **Race Condition 방어 (SingleFlight)**: 동일 productId에 대해 동시 Miss가 발생해도 판정 로직은 1회만 실행. 후속 요청은 in-flight Promise를 공유.
- **Write Strategy**: **Write-Through** (동기 이중 쓰기). Write-Back은 장애 시 데이터 유실 리스크 → 채택하지 않음.
- **Invalidation Strategy**: L2는 DELETE가 아닌 `updated_at` Tombstone. BADGE 레코드의 감사 이력(audit trail)을 보존해야 함.
- **Schema Version**: 캐시 Key에 버전 포함. 타입 변경 시 bump하여 배포 직후 기존 캐시 자동 무효화.
- **CQRS 경계 (P2)**: 본 Command는 **읽기 측면에서는 Query-like**지만 쓰기/무효화도 포함하므로 Command로 분류. 캐시 관리는 **경계 외 I/O를 감싸는 인프라 레이어**로 자리매김.
- **장애 내성**: L1/L2 장애 시 자동 Bypass → F2-C-001 직접 호출. Feature Flag로 수동 차단 가능.
- **보안**: 캐시 Key는 공개 가능한 product_id만 포함 (PII 무관). L1/L2 모두 암호화 불필요.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~11)를 충족하는가?
- [ ] L1 Memory LRU + L2 DB BADGE 2단 캐시가 작동하는가?
- [ ] `getBadgeCache`, `setBadgeCache`, `invalidateBadgeCache`, SingleFlight 4개 함수가 모두 구현되었는가?
- [ ] TTL 30일 정책이 공전 갱신 주기(월 1회)와 정합되는가?
- [ ] Write-Through 일관성이 Unit Test로 검증되는가?
- [ ] SingleFlight 동시성 테스트가 통과하는가?
- [ ] Hit/Miss 메트릭이 구조화 로그로 기록되고 NFR-MON-001 대시보드에 반영되는가?
- [ ] Schema Version Bump 시 자동 무효화가 작동하는가?
- [ ] `BADGE_CACHE_ENABLED` feature flag가 작동하는가?
- [ ] 성능 벤치마크(L1 ≤ 5ms, L2 ≤ 50ms, Miss ≤ 800ms)가 CI에서 통과하는가?
- [ ] CRON-001 연계를 위한 `invalidateBadgeCache("ALL")` 공개 API가 제공되는가?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #DATA-005 (BADGE 스키마 — L2 영속 저장소)
  - #F2-C-001 (뱃지 판정 로직 — Miss 시 재계산 소스)
  - #F2-C-004 (회색 라벨 — BadgePipelineResult에 포함)
- **Blocks**:
  - #F2-RH-001 (Badge Route Handler — 본 캐시를 통해 p95 달성)
  - #CRON-001 (월 1회 벌크 갱신 — `invalidateBadgeCache("ALL")` 호출자)
  - #F4-C-003 (제보 RESOLVED 전이 — 제품 단위 무효화 호출자)
  - #ADM-C-001 (관리자 등록 요청 승인 — 제품 단위 무효화 호출자)
  - #ADM-C-002 (관리자 제보 처리 워크플로 — 성분 단위 무효화 호출자)
  - #NFR-MON-001 (Hit Rate 모니터링 대시보드)
  - #TEST-F2-006 (Badge API p95 1,000ms 검증)

## :bookmark_tabs: Notes
- **왜 Redis 아님?** 초기 MVP는 Vercel + Supabase 스택이며, Redis 도입은 월 비용 증가($10~20) + 관리 복잡도 상승. L2 DB 캐시로 충분히 요건 달성 가능하며, 성장 후 L3 Redis 추가가 자연스러운 확장.
- **Warm Instance L1 효과(가설)**: Vercel Serverless warm instance 재사용 특성 상 L1 Hit Rate 20~40%를 기대하나, **본 수치는 실측 근거 없는 가설**이다. MVP 배포 후 NFR-MON-001 대시보드에서 실측하여 TTL·엔트리 수를 조정(Phase 2). L2 Hit Rate 45%+까지 결합해 통합 85% 목표.
- **Tombstone vs Delete**: BADGE 영속 레코드는 법률 리스크(재판정 이력) 때문에 DELETE 금지. `updated_at`을 과거로 돌려서 Stale 처리.
- **Phase 2 확장**: 
  - Redis 도입 시 L1.5 계층 추가 (cross-instance 공유)
  - Tag-based 무효화 (ingredient tag → 관련 제품 모두 무효화)
  - Hit Rate 실시간 튜닝 (NFR-COST-001 모니터링 연계)
