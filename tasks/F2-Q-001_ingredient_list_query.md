---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-Q-001: 제품 성분 목록 조회 로직 구현 (product_id → INGREDIENT[])"
labels: 'feature, backend, epic:E-F2, priority:high, phase:2, cqrs:query'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-Q-001] 제품 성분 목록 조회 Query 로직
- 목적: 제품 상세 페이지 진입 시 F2 Anti-BS Dashboard가 **뱃지 판정 파이프라인(F2-C-001)의 입력**으로 사용할 성분 목록을 Supabase PostgreSQL에서 조회한다. 순수 읽기(Read) 경로만 담당하며, 뱃지 판정·번역·캐싱과는 엄격히 분리된다(CQRS P2 원칙).
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-011`](../05_SRS_v1.md) — 공전 원문 1:1 매칭의 전제 데이터
- SRS 문서 (시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — "BadgeAPI → DB: SELECT ingredients WHERE product_id" 단계
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.2 INGREDIENT`](../05_SRS_v1.md)
- SRS 문서 (성능): [`/05_SRS_v1.md#4.2.1 REQ-NF-002`](../05_SRS_v1.md) — 뱃지 p95 ≤ 1,000ms 전제
- 선행 태스크 명세: [`DATA-003_ingredient_schema.md`](./DATA-003_ingredient_schema.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-003** (INGREDIENT 스키마), **DATA-010** (ERD 통합)
- 후행 태스크: F2-C-001 (뱃지 판정), F2-RH-001 (Route Handler 조립)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Query 모듈 디렉토리 구조 확립** — `src/server/f2/queries/` 아래에 각 Query 모듈 배치 (CQRS Query 전용 경계)
- [ ] **`getIngredientsByProductId()` 함수 작성** — `src/server/f2/queries/get-ingredients-by-product-id.ts`:
  - Signature: `(productId: string) => Promise<IngredientView[]>`
  - Prisma 조회: `prisma.ingredient.findMany({ where: { product_id }, orderBy: [{ mfds_status: "asc" }, { standard_name: "asc" }] })`
  - `include: { product: false }` 명시 — Query의 책임 범위 축소 (Product 메타 필요 시 별도 Query로 분리)
- [ ] **IngredientView 타입 정의** — `src/server/f2/types/ingredient-view.ts`에 뷰 모델 정의:
  - `ingredient_id`, `standard_name`, `common_name`, `amount_per_serving`(Decimal → string 직렬화), `unit`, `mfds_status`, `mfds_claim`, `data_source`
  - `created_at`, `updated_at`은 외부 노출 불필요 → 뷰에서 제외
  - Prisma Model → View 변환 헬퍼 `toIngredientView(row: Ingredient): IngredientView`
- [ ] **에러 처리 체계**:
  - `ProductNotFoundError` — `product_id` 존재 여부를 먼저 확인(`prisma.product.findUnique({ where: { product_id }, select: { product_id: true } })`)
  - `EmptyIngredientSetError` — 제품은 존재하나 성분 0건: 로깅 후 빈 배열 반환(뱃지 판정 단계에서 "데이터 미확보" 처리)
- [ ] **성능 최적화**:
  - 인덱스 활용 보장: `@@index([product_id])` (DATA-003에서 정의) 활용
  - N+1 방지: 본 Query는 단일 `findMany` 호출로 완료되어야 함 (for loop 내 Prisma 호출 절대 금지)
  - 응답 크기 제한: 정상적인 제품은 성분 ≤ 30개. 100개 초과 시 경고 로그 + 상위 100개로 절사
- [ ] **Decimal 직렬화 전략** — `amount_per_serving`은 Prisma `Decimal`이므로 JSON 전송 시 `.toString()`으로 문자열화. View 타입에서 `string` 명시
- [ ] **로깅 관측성** — Vercel Logs에 `query="f2.getIngredients"`, `product_id`, `row_count`, `duration_ms` 구조화 로그 기록 (PII 없음)
- [ ] **Unit Test 작성** — `tests/server/f2/queries/get-ingredients-by-product-id.test.ts`에 5건 이상:
  - 정상 조회 (3성분 포함 제품)
  - 존재하지 않는 product_id → `ProductNotFoundError`
  - 성분 0건 제품 → 빈 배열 + 경고 로그
  - Decimal 정밀도 보존 테스트 (`0.0125` mg 입력 → 문자열 `"0.0125"` 반환)
  - 정렬 검증 (REGISTERED → NOT_REGISTERED, 동일 등급 내 standard_name ASC)
- [ ] **Integration Test** — 실제 테스트 DB와 연결한 시나리오 1건 (Scenario 1 기준)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 제품의 성분 목록 조회**
- **Given**: PRODUCT `P1`에 3개 INGREDIENT(`Cholecalciferol`, `Calcium Carbonate`, `Magnesium`)가 연결된 상태
- **When**: `getIngredientsByProductId("P1")`를 호출
- **Then**: 3건의 `IngredientView` 배열이 반환되며, 각 항목의 `standard_name`, `common_name`, `mfds_status`가 정확히 매핑된다.

**Scenario 2: 존재하지 않는 제품 조회**
- **Given**: DB에 `product_id=P_INVALID`가 존재하지 않음
- **When**: `getIngredientsByProductId("P_INVALID")`를 호출
- **Then**: `ProductNotFoundError`가 던져지며, Vercel Logs에 `{ level: "warn", event: "product_not_found", product_id }`가 기록된다.

**Scenario 3: 성분 0건 제품**
- **Given**: PRODUCT `P2`는 존재하지만 연결된 INGREDIENT 레코드가 0건
- **When**: `getIngredientsByProductId("P2")`를 호출
- **Then**: 빈 배열 `[]`이 반환되고, `{ level: "warn", event: "empty_ingredient_set", product_id: "P2" }` 로그가 기록된다.

**Scenario 4: 정렬 정책 검증**
- **Given**: PRODUCT `P1`에 4개 성분이 있고, 2건은 REGISTERED, 2건은 NOT_REGISTERED 상태
- **When**: `getIngredientsByProductId("P1")`를 호출
- **Then**: 앞 2건이 REGISTERED, 뒤 2건이 NOT_REGISTERED 순서이며, 각 그룹 내에서 `standard_name` 오름차순 정렬이다.

**Scenario 5: Decimal 정밀도 보존**
- **Given**: INGREDIENT의 `amount_per_serving`이 DB에 `0.0125`(mg)로 저장된 상태
- **When**: Query 호출 후 View의 `amount_per_serving` 필드 확인
- **Then**: 문자열 `"0.0125"`로 반환되며, 반올림·Float 손실이 없다.

**Scenario 6: 성능 기준 — p95 ≤ 50ms**
- **Given**: 500건의 PRODUCT, 각 제품당 평균 5개 성분이 적재된 상태
- **When**: 100회 반복 조회
- **Then**: p95 응답 시간이 50ms 이내이다 (상위 레이어 F2-RH-001의 1,000ms 전체 예산 중 본 Query는 5% 이하 소비).

**Scenario 7: N+1 쿼리 방지**
- **Given**: Prisma 쿼리 로그가 활성화된 상태
- **When**: Query를 1회 호출
- **Then**: `SELECT` 문이 1~2건만 발생한다 (product 존재 확인 + ingredient findMany).

## :gear: Technical & Non-Functional Constraints
- **CQRS Query 순수성 (P2)**: 본 함수는 **상태 변경 절대 금지**. `prisma.$transaction` 내에서도 `create/update/delete` 호출 없이 `findMany/findUnique/count`만 사용.
- **성능 (REQ-NF-002)**: 전체 Badge API 예산 p95 ≤ 1,000ms 중 본 Query는 50ms 이하를 목표. 인덱스 `@@index([product_id])` 활용 필수.
- **캐싱 금지**: 본 Query 레벨에서는 **캐싱하지 않는다**. 캐싱은 F2-C-005(뱃지 결과 캐싱)에서 통합 적용. Query는 항상 최신 DB 상태를 반영.
- **경계 원칙 (P4)**: 본 Query는 **성분 목록 조회 단일 책임**. 뱃지 정보, 가격 정보, 라벨 이미지 등은 별도 Query로 분리(F4-Q-001, F4-Q-002). `include` 절 남용 금지.
- **에러 vs 빈 결과 구분**: "제품 부존재"는 명시적 에러(`ProductNotFoundError`), "성분 부재"는 정상 빈 배열. 상위 Route Handler(F2-RH-001)가 이를 각각 404/200으로 매핑.
- **개인정보 (CON-4)**: 본 Query는 개인정보 미포함. 로깅 시에도 `user_id`를 요구하지 않음.
- **데이터 신선도**: 성분 데이터는 관리자·CP-1 파이프라인에서만 업데이트되므로 실시간성 불필요. 그러나 본 Query 자체는 캐시 없이 DB 직접 조회.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] `getIngredientsByProductId()` 함수가 `src/server/f2/queries/`에 배치되고 CQRS Query 경계를 지키는가?
- [ ] `IngredientView` 타입이 정의되고 Prisma Model과 직접 노출이 분리되었는가?
- [ ] Unit Test 5건 + Integration Test 1건이 통과하는가?
- [ ] 성능 벤치마크(p95 ≤ 50ms)가 CI에서 검증되는가?
- [ ] 구조화 로깅이 적용되고 PII 노출이 없는가?
- [ ] N+1 쿼리가 발생하지 않음이 Prisma 로그로 확인되는가?
- [ ] `ProductNotFoundError` / `EmptyIngredientSetError` 에러 타입이 `src/server/f2/errors.ts`에 정의되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-003 (INGREDIENT 스키마)
  - #DATA-010 (ERD 통합 검증)
- **Blocks**: 
  - #F2-C-001 (뱃지 판정 로직의 입력)
  - #F2-RH-001 (Badge Route Handler 조립)
  - #F2-C-004 (미등재 원료 회색 라벨 — 본 Query 결과의 `mfds_status` 사용)
  - #TEST-F2-006 (Badge API p95 ≤ 1,000ms 검증)

## :bookmark_tabs: Notes
- 본 Query는 단순하지만 F2 전체 파이프라인의 **입구(entry point)**이다. 정렬 정책(REGISTERED 우선)은 UI 렌더링(UI-020 제품 상세 페이지)에서 등록 원료를 먼저 보여주는 UX 가치가 크므로 **Query 레벨에서 책임**을 진다.
- Phase 2 확장 시 `include: { badges: true }` 옵션 요구가 생길 수 있으나, 그 경우 **별도 Query 함수**(`getIngredientsWithBadges`)로 분리해 CQRS 경계를 유지한다.
