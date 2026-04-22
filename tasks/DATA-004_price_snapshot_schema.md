---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-004: PRICE_SNAPSHOT 테이블 Prisma 스키마 정의 및 마이그레이션 생성 (FK → PRODUCT)"
labels: 'feature, data, epic:E-DATA, priority:critical, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-004] PRICE_SNAPSHOT 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: 쿠팡 파트너스 단일 채널로부터 수집한 **가격·배송비·1일 단가** 정규화 결과를 시계열로 적재하는 저장소를 구축한다. F1 Super-Calc Engine(REQ-FUNC-001~006)의 정렬 기준, 쿠팡 장애 시 24시간 이내 폴백 캐시(EXT-SYS-01, §3.1.1)의 단일 진실 원천으로 기능한다.
- Epic / Phase: E-DATA / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.3 PRICE_SNAPSHOT`](../05_SRS_v1.md) — 7개 필드 원천 명세
- SRS 문서 (폴백 전략): [`/05_SRS_v1.md#3.1.1 EXT-SYS-01`](../05_SRS_v1.md) — 24시간 이내 캐시 데이터 보장
- SRS 문서 (F1 시퀀스): [`/05_SRS_v1.md#6.3.1`](../05_SRS_v1.md) — "PRICE_SNAPSHOT[] 저장" 단계
- SRS 문서 (REQ-FUNC-002/004/005): [`/05_SRS_v1.md#4.1.1`](../05_SRS_v1.md) — 단가 산출 공식
- SRS 문서 (Cron 배치): [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Price Sync Cron 일 1회
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-002** (PRODUCT)
- 후행 태스크: DATA-010, F1-Q-002, F1-C-001~004, F1-RH-001, CRON-001, API-001, TEST-F1-004

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model PriceSnapshot` 블록 추가
- [ ] **필드 매핑 (SRS §6.2.3 + 운영 요구 확장)**:
  - `snapshot_id: String @id @default(cuid())`
  - `product_id: String` + `product Product @relation(fields: [product_id], references: [product_id], onDelete: Cascade)`
  - `price_krw: Decimal @db.Decimal(12, 2)` (원화 단가, 10억원 미만 범위 충분)
  - `shipping_fee: Decimal @db.Decimal(10, 2) @default(0)` (기본 0원, 유료 배송 시 금액)
  - `discount_krw: Decimal @db.Decimal(10, 2) @default(0)` (적용 가능 쿠폰/할인 금액, REQ-FUNC-004)
  - `final_price_krw: Decimal @db.Decimal(12, 2)` (배송비·할인 적용 실지불가, REQ-FUNC-004)
  - `servings_per_container: Int` (총 복용 횟수, 1일 단가 공식 분모)
  - `daily_cost_krw: Decimal @db.Decimal(12, 2)` (= `final_price_krw / servings_per_container`, 소수점 첫째 자리 반올림은 표시 레벨에서 처리)
  - `source: PriceSnapshotSource` (Enum: `COUPANG_API` / `MANUAL_BACKFILL`)
  - `captured_at: DateTime` (가격 수집 실제 시각, 쿠팡 응답 시각 또는 수집 시각)
  - `created_at: DateTime @default(now())`
- [ ] **Enum 정의** — `enum PriceSnapshotSource { COUPANG_API MANUAL_BACKFILL }` (신규 채널 추가 시 확장, REQ-NF-024 정합)
- [ ] **인덱스 설계** (핵심):
  - `@@index([product_id, captured_at(sort: Desc)])` — 제품별 최신 가격 조회 (F1-Q-002 폴백 핵심 경로, p95 성능의 핵심)
  - `@@index([captured_at])` — Cron 배치·관리자 대시보드 시계열 조회
  - `@@index([daily_cost_krw])` — 정렬 조회 가속(REQ-FUNC-005 오름차순 정렬)
- [ ] **불변 스냅샷 정책 선언** — 레코드 생성 후 `price_krw`, `final_price_krw` 등 가격 관련 필드는 **수정 금지**(append-only). 갱신은 **새 스냅샷 레코드 삽입**으로만 수행. 애플리케이션 레이어에서 `update` 호출 차단 가드 작성.
- [ ] **Reverse Relation** — `model Product`에 `price_snapshots PriceSnapshot[]` 추가
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_price_snapshot_table --create-only` → SQL 리뷰 → 적용
- [ ] **Zod 검증 스키마** — `src/lib/schemas/price-snapshot.ts`에 `CreatePriceSnapshotSchema`: 모든 금액 ≥ 0, `servings_per_container ≥ 1`, `final_price_krw = price_krw + shipping_fee - discount_krw` 교차 검증
- [ ] **DailyCost 계산 헬퍼** — `src/lib/pricing/daily-cost.ts`에 `computeDailyCost(final, servings) => Decimal` 순수 함수 정의 (F1-C-001에서 사용)
- [ ] **스테일 판정 유틸** — `src/lib/pricing/is-stale.ts`에 `isStale(snapshot, thresholdMinutes = 1440) => boolean` 함수 정의 (24시간 기본값, F1-Q-002 폴백 안내 UI 트리거 용도)
- [ ] **Unit Test 작성** — 5건 이상: 금액 교차 검증, append-only 가드, Decimal 정밀도, 최신 스냅샷 조회 인덱스 활용, `isStale` 경계값

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 스냅샷 저장 및 1일 단가 자동 산출**
- **Given**: PRODUCT `P1`이 존재하며, 쿠팡 어댑터가 `{ price: 30000, shipping: 0, discount: 3000, servings: 60 }`를 반환한 상태
- **When**: 서비스 레이어에서 `CreatePriceSnapshotSchema`를 통해 PRICE_SNAPSHOT을 생성한다
- **Then**: `final_price_krw = 27000`, `daily_cost_krw = 450.00`으로 계산된 단일 레코드가 저장되고, `captured_at`이 주입된다.

**Scenario 2: 최신 스냅샷 조회 (F1-Q-002 폴백 경로)**
- **Given**: PRODUCT `P1`에 대해 `captured_at`이 각각 3시간 전, 10시간 전, 25시간 전인 스냅샷 3건이 존재
- **When**: `prisma.priceSnapshot.findFirst({ where: { product_id: "P1" }, orderBy: { captured_at: "desc" } })`를 실행한다
- **Then**: 3시간 전 스냅샷이 반환되며, 인덱스 `@@index([product_id, captured_at(sort: Desc)])`가 활용됨이 `EXPLAIN`으로 확인된다.

**Scenario 3: 24시간 이상 경과 스냅샷의 Stale 판정**
- **Given**: `captured_at`이 현재 시각 기준 25시간 전인 스냅샷
- **When**: `isStale(snapshot, 1440)`을 호출한다
- **Then**: `true`가 반환된다. (UI-012의 "쿠팡 가격은 [YYYY-MM-DD HH:MM] 기준입니다" 인라인 표시 트리거)

**Scenario 4: Append-Only 가드 작동**
- **Given**: 저장된 PRICE_SNAPSHOT 1건
- **When**: 서비스 레이어를 우회한 `prisma.priceSnapshot.update({...})` 호출이 시도된다
- **Then**: 애플리케이션 가드(ESLint 커스텀 룰 또는 런타임 래퍼)가 호출을 차단하고 에러를 던진다.

**Scenario 5: Product 삭제 시 Cascade**
- **Given**: PRODUCT 1건과 연결된 PRICE_SNAPSHOT 5건이 존재
- **When**: PRODUCT가 삭제된다
- **Then**: 5건의 PRICE_SNAPSHOT이 자동 삭제된다.

**Scenario 6: 필수 필드 누락 및 금액 교차 검증 실패**
- **Given**: `CreatePriceSnapshotSchema`가 정의된 상태
- **When**: `{ price_krw: 10000, shipping_fee: 0, discount_krw: 5000, final_price_krw: 9000, servings_per_container: 30 }`를 파싱한다 (5000 차감 시 5000이어야 함, 9000 불일치)
- **Then**: ZodError가 발생하며 "final_price_krw 교차 검증 실패" 메시지가 포함된다.

## :gear: Technical & Non-Functional Constraints
- **Append-Only 원칙**: PRICE_SNAPSHOT은 시계열 이력 보존이 목적이므로 **UPDATE 금지**. 시세 변경은 신규 스냅샷 INSERT로만 수행. 이는 F1 폴백 정확성(SRS §3.1.1) 및 Phase 2 가격 하락 알림(REQ-FUNC-037)의 전제 조건.
- **CON-9**: Prisma + PostgreSQL 강제. `Decimal` 타입은 PostgreSQL의 `NUMERIC(p, s)`로 매핑됨을 전제로 한다.
- **단가 정확성 (REQ-FUNC-002, 004)**: `final_price_krw`의 오차율 ≤ 3% 요건(REQ-FUNC-004)은 **계산 레이어 책임**이지만, **Decimal 정밀도 손실**이 없어야 충족 가능 → `Float` 절대 금지.
- **폴백 경로 성능 (REQ-NF-001)**: `product_id` + `captured_at DESC` 복합 인덱스는 Super-Calc p95 ≤ 3,500ms의 핵심. 쿠팡 장애 시 이 인덱스 스캔만으로 수 ms 응답 가능해야 함.
- **배치 부하 (CRON-001)**: 일 1회 300~500건 INSERT. 배치 시간대 인덱스 rebuild 비용이 2분 이내로 제한되도록 인덱스 수 최소화(3개 한정).
- **데이터 보존 정책**: MVP는 무기한 보존. Phase 2에서 90일 이후 롤업 테이블로 이동하는 파티셔닝 전략 도입 검토. 본 태스크에서는 파티셔닝 미적용.
- **개인정보 (CON-4)**: PRICE_SNAPSHOT은 개인정보 미포함. `user_id` FK 연결 금지(CON-4 최소 수집 원칙 보호).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `model PriceSnapshot`이 `Decimal` 타입 기반으로 정의되고 `prisma validate` 통과하는가?
- [ ] 3개 인덱스가 모두 적용되고, 최신 스냅샷 조회의 `EXPLAIN` 결과에 Index Scan이 나타나는가?
- [ ] Append-Only 가드가 구현되고 테스트로 검증되는가?
- [ ] `computeDailyCost`, `isStale` 유틸 함수가 순수 함수로 분리되고 단위 테스트가 통과하는가?
- [ ] Zod 스키마의 금액 교차 검증(`final = price + shipping - discount`)이 작동하는가?
- [ ] 마이그레이션 SQL이 리뷰되고 Cascade 동작이 검증되는가?
- [ ] ERD(SRS §6.2.8)와 정합하는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-002 (PRODUCT FK)
- **Blocks**: 
  - #DATA-010 (ERD 통합 검증)
  - #F1-Q-002 (쿠팡 장애 폴백)
  - #F1-C-001 (1일 단가 정규화)
  - #F1-C-004 (PRICE_SNAPSHOT 저장)
  - #F1-RH-001 (Route Handler 조립)
  - #CRON-001 (가격 동기화 배치)
  - #API-001 (Super-Calc DTO)
  - #TEST-F1-002 (오차율 테스트)
  - #TEST-F1-004 (폴백 검증)

## :bookmark_tabs: Notes
- SRS §6.2.3 원문은 `final_price_krw`와 `discount_krw`를 별도 필드로 명시하지 않았으나, REQ-FUNC-004(배송비·관세·할인코드 포함 실지불가) 요구사항 충족을 위해 본 태스크에서 명시적으로 분해 저장한다. ERD 검증(DATA-010)에서도 이 확장을 반영해야 한다.
- `관세`(customs duty)는 쿠팡 단일 채널(국내) 기준 MVP에서는 0원으로 가정(SRS §1.2.1 IS-1). Phase 2 다채널(iHerb 등) 확장 시 `customs_krw` 필드 추가를 고려.
- 본 태스크는 **스키마·헬퍼·가드**에 한정하며, 쿠팡 API 호출/정규화 비즈니스 로직은 F1-Q-001, F1-C-001 태스크에서 담당한다 (CQRS P2 원칙).
