---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-003: INGREDIENT 테이블 Prisma 스키마 정의 및 마이그레이션 생성 (FK → PRODUCT)"
labels: 'feature, data, epic:E-DATA, priority:critical, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-003] INGREDIENT 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: 제품의 **성분·함량·식약처 등록 상태**를 저장하는 핵심 엔티티를 구축한다. 이는 F2 Anti-BS Dashboard의 뱃지 판정(REQ-FUNC-011), 전문 용어 일상어 번역(REQ-FUNC-013), 미등재 원료 회색 라벨(REQ-FUNC-014)의 기반 데이터가 되며, 대안 데이터 소스(CP-1) 추적성(`data_source`) 확보가 핵심이다.
- Epic / Phase: E-DATA / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.2 INGREDIENT`](../05_SRS_v1.md) — 8개 필드 원천 명세
- SRS 문서 (비상 대응): [`/05_SRS_v1.md#1.2.5 CP-1`](../05_SRS_v1.md) — `INGREDIENT.data_source` 필드 추적성 원칙
- SRS 문서 (뱃지 시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — INGREDIENT → BADGE 파이프라인
- SRS 문서 (REQ-FUNC-011~014): [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-002** (PRODUCT 스키마 완료)
- 후행 태스크: DATA-005 (BADGE — FK → INGREDIENT), DATA-010, F2-Q-001, F2-C-001~003, API-002, API-003, COM-Q-001

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model Ingredient` 블록 추가
- [ ] **필드 매핑 (SRS §6.2.2 + CP-1 원칙 확장)**:
  - `ingredient_id: String @id @default(cuid())`
  - `product_id: String` + `product Product @relation(fields: [product_id], references: [product_id], onDelete: Cascade)`
  - `standard_name: String` (영문 표준 성분명, 예: `Cholecalciferol`)
  - `common_name: String?` (일상어 번역명, 예: `비타민 D3`)
  - `amount_per_serving: Decimal @db.Decimal(12, 4)` (소수점 정밀도 확보)
  - `unit: String` (`mg` / `IU` / `CFU` / `mcg` / `g` / `billion` 등)
  - `mfds_status: MfdsStatus` (Enum: `REGISTERED` / `NOT_REGISTERED`)
  - `mfds_claim: String?` (식약처 기능성 인정 문구 공전 원문, Long Text 허용)
  - `data_source: IngredientDataSource` (Enum: `COUPANG_META` / `MFDS_API` / `LABEL_OCR` / `MANUAL` — CP-1 추적성)
  - `created_at: DateTime @default(now())` / `updated_at: DateTime @updatedAt`
- [ ] **Enum 정의** — `enum MfdsStatus { REGISTERED NOT_REGISTERED }`, `enum IngredientDataSource { COUPANG_META MFDS_API LABEL_OCR MANUAL }`
- [ ] **인덱스 설계**:
  - `@@index([product_id])` (제품 → 성분 집합 조회, F2-Q-001 핵심 경로)
  - `@@index([standard_name])` (성분 검색 자동완성, COM-Q-001)
  - `@@index([mfds_status])` (미등재 원료 필터링, REQ-FUNC-014)
- [ ] **중복 방지 유니크** — 동일 제품 내 동일 표준 성분 중복 등록 방지: `@@unique([product_id, standard_name])`
- [ ] **Reverse Relation 업데이트** — `model Product`에 `ingredients Ingredient[]` 관계 필드 추가 (DATA-002 PR 이후 후속 추가)
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_ingredient_table --create-only` → SQL 리뷰 → `pnpm prisma migrate dev`
- [ ] **Zod 검증 스키마** — `src/lib/schemas/ingredient.ts`에 `CreateIngredientSchema` 정의: `amount_per_serving > 0`, `unit`은 허용 리스트, `standard_name` 공백 금지
- [ ] **단위(unit) 정규화 헬퍼** — `src/lib/ingredient-units.ts`에 단위 상수 및 변환 맵 정의 (`mcg→mg`, `IU→mcg`(비타민D 계수 등)) — 실제 변환 로직은 F1-C-001에서 사용
- [ ] **전문 용어 → 일상어 매핑 시드 테이블 구조 준비** — 본 태스크에서는 `common_name` 컬럼만 확보. 매핑 테이블 자체는 F2-C-003에서 별도 테이블로 분리 예정
- [ ] **Unit Test 작성** — 중복 방지, FK Cascade, Enum 검증, Decimal 정밀도 테스트 4건 이상

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 성분 레코드 생성 및 제품 연계**
- **Given**: PRODUCT 레코드(`product_id=P1`)가 존재하는 상태
- **When**: `{ product_id: "P1", standard_name: "Cholecalciferol", common_name: "비타민 D3", amount_per_serving: 25.0000, unit: "mcg", mfds_status: "REGISTERED", mfds_claim: "칼슘과 인이 체내에서 흡수 및 이용되는데 필요...", data_source: "MFDS_API" }`를 생성한다
- **Then**: INGREDIENT가 저장되고, `product.ingredients` 관계로 역조회 시 해당 레코드가 반환된다.

**Scenario 2: Product 삭제 시 Cascade 동작**
- **Given**: PRODUCT 1건, 해당 제품의 INGREDIENT 3건이 저장된 상태
- **When**: `prisma.product.delete({ where: { product_id: "P1" } })`를 실행한다
- **Then**: 관련 INGREDIENT 3건이 자동 삭제되고, `count`가 0을 반환한다.

**Scenario 3: 동일 제품 내 동일 표준 성분 중복 차단**
- **Given**: `(product_id=P1, standard_name="Cholecalciferol")`가 이미 저장된 상태
- **When**: 동일 조합으로 재등록을 시도한다
- **Then**: `P2002` 유니크 제약 에러가 발생하며, 레코드 수는 1건으로 유지된다.

**Scenario 4: 미등재 원료 마킹 및 조회**
- **Given**: `mfds_status: "NOT_REGISTERED"`인 성분 2건이 저장된 상태
- **When**: `prisma.ingredient.findMany({ where: { mfds_status: "NOT_REGISTERED" } })`를 실행한다
- **Then**: 2건이 반환되며, 모두 `mfds_claim`이 null이다. (REQ-FUNC-014 회색 라벨의 전제)

**Scenario 5: 데이터 소스 추적성 (CP-1)**
- **Given**: OCR 파이프라인에서 수집한 성분 레코드가 저장된 상태 (`data_source: "LABEL_OCR"`)
- **When**: `prisma.ingredient.groupBy({ by: ["data_source"], _count: true })`를 실행한다
- **Then**: `data_source`별 집계가 반환되어, 월 1회 품질 검수(오류율 ≤ 5%) 기준 데이터를 확보할 수 있다.

**Scenario 6: Decimal 정밀도 보존**
- **Given**: `amount_per_serving: 0.0125`(mg)로 저장된 레코드
- **When**: 조회 후 문자열화한다
- **Then**: 반올림·절사 없이 `0.0125`(또는 `0.01250000` 형태)가 그대로 유지된다.

## :gear: Technical & Non-Functional Constraints
- **데이터 무결성 (CON-2)**: `mfds_claim`은 **식약처 건강기능식품공전 원문**만 저장한다. 질병 예방·치료 표현 가공·변형 **절대 금지**. 삽입 시 `src/lib/prohibited-expressions.ts` 룰셋과 매칭 검증(테스트 레벨).
- **정밀도**: `amount_per_serving`은 `Decimal(12, 4)` 최소 보장. 비타민 D 등 μg 단위 저용량·프로바이오틱스 `billion CFU` 대용량을 동시 수용.
- **CP-1 추적성**: `data_source`가 누락되면 제보·검수 프로세스가 원천 출처를 추적할 수 없으므로 **NOT NULL 필수**. Enum 범위 밖 값은 마이그레이션 레벨에서 차단.
- **확장성**: `unit`은 문자열로 유지(Enum 아님) — 신규 단위(예: `%DV`, `mL`) 수요 시 스키마 변경 없이 수용. 대신 애플리케이션 레이어(`ingredient-units.ts`)에서 허용 리스트로 검증.
- **CQRS 분리 (P2)**: 본 태스크는 **스키마·마이그레이션·검증 스키마**에 한정. 뱃지 판정·번역 로직은 F2-C-001 ~ F2-C-003로 분리.
- **다국어 대응**: `common_name`은 한국어 기본이며, Phase 2 다국어 확장 시 별도 `ingredient_translations` 테이블로 분리 가능하도록 **현재는 단일 필드로 단순화**.
- **개인정보 (CON-4)**: INGREDIENT는 개인정보 포함 없음.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `model Ingredient` + 2개 Enum이 `prisma/schema.prisma`에 추가되고 `prisma validate` 통과하는가?
- [ ] `Product.ingredients` 역방향 관계가 정상 작동하는가?
- [ ] 마이그레이션 SQL이 리뷰되고 `onDelete: Cascade`가 반영되었는가?
- [ ] 단위 테스트 4건 이상이 통과하는가?
- [ ] Zod 스키마가 `unit` 허용 리스트, `amount_per_serving > 0` 제약을 검증하는가?
- [ ] ERD(SRS §6.2.8)와 관계 카디널리티(`Product 1 —* Ingredient`)가 정합하는가?
- [ ] `data_source` 필드가 CP-1 원칙에 따라 추적성을 보장하는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-002 (PRODUCT FK 대상)
- **Blocks**: 
  - #DATA-005 (BADGE — FK → Ingredient)
  - #DATA-010 (ERD 통합 검증)
  - #F2-Q-001 (제품 성분 목록 조회)
  - #F2-C-001 (뱃지 판정)
  - #F2-C-003 (전문 용어 일상어 번역)
  - #API-002 (Badge DTO)
  - #API-003 (Search DTO)
  - #COM-Q-001 (성분 검색/자동완성)

## :bookmark_tabs: Notes
- SRS §6.2.2 원문은 `data_source` 필드를 포함하지 않으나, SRS §1.2.5 CP-1에서 "대안 데이터의 원천은 반드시 `INGREDIENT.data_source` 필드에 기록"이라 **명시적으로 요구**하므로 본 태스크에서 확장 반영한다.
- Phase 1에서는 단일 제품에 속한 성분으로 모델링한다. Phase 2에서 "공통 성분 마스터 테이블 + 제품별 함량 관계 테이블"로 분리할 여지가 있으나, MVP 복잡도를 이유로 현 구조(denormalized)를 유지한다.
