---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-002: PRODUCT 테이블 Prisma 스키마 정의 및 마이그레이션 생성"
labels: 'feature, data, epic:E-DATA, priority:critical, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-002] PRODUCT 엔티티 Prisma 모델 정의 및 초기 마이그레이션 생성
- 목적: 건기식 제품 정보의 **SSOT(Single Source of Truth)** 테이블을 최우선 구축하여, 성분(INGREDIENT), 가격(PRICE_SNAPSHOT), 라벨(LABEL_ARCHIVE), 제보(ERROR_REPORT) 등 모든 후행 엔티티의 FK 앵커(anchor)가 되는 기반 스키마를 확정한다.
- Epic / Phase: E-DATA / Phase 1 (데이터·계약 SSOT)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.1 PRODUCT`](../05_SRS_v1.md) — 8개 필드 원천 명세
- SRS 문서 (ER 다이어그램): [`/05_SRS_v1.md#6.2.8 Entity Relationship Summary`](../05_SRS_v1.md)
- SRS 문서 (클래스 다이어그램): [`/05_SRS_v1.md#6.2.9 Class Diagram`](../05_SRS_v1.md) — Product 객체 오퍼레이션
- SRS 문서 (사전 데이터 확보 원칙): [`/05_SRS_v1.md#3.1.1`](../05_SRS_v1.md) — MVD 300~500개
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (Next.js + Prisma 스캐폴딩 완료)
- 후행 태스크: DATA-003 (INGREDIENT), DATA-004 (PRICE_SNAPSHOT), DATA-006 (LABEL_ARCHIVE), DATA-007 (ERROR_REPORT), DATA-010 (ERD 통합 검증), API-003, API-005, COM-C-003

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model Product` 블록 추가 (SRS §6.2.1의 9개 필드 전수 매핑)
- [ ] **PK 전략 결정** — `product_id String @id @default(cuid())` (협업·이식성 우선) 또는 UUID v7. 결정 사유를 PR description에 명시
- [ ] **필드 타입 매핑**:
  - `product_id: String @id` / `product_name: String` / `brand_name: String` / `manufacturer: String?` / `category: String` / `source_channel: String` / `original_url: String` / `created_at: DateTime @default(now())` / `updated_at: DateTime @updatedAt`
- [ ] **인덱스 설계** — 고빈도 조회 경로 최적화: `@@index([brand_name])`, `@@index([category])`, `@@index([source_channel, created_at])`, `@@index([product_name])` (검색 자동완성 대비, COM-Q-001)
- [ ] **유니크 제약** — 동일 쿠팡 상품 중복 등록 방지용 `@@unique([source_channel, original_url])` 추가
- [ ] **카테고리 유효 값 정의** — 초기 7개 카테고리 상수(VITAMIN, MINERAL, PROBIOTICS, OMEGA, PROTEIN, HERB, OTHER)를 `src/lib/constants/product-category.ts`에 TypeScript enum-like 객체로 정의 (DB 컬럼은 String 유지, 애플리케이션 레벨 검증)
- [ ] **source_channel 값 정의** — `COUPANG` 단일 값으로 시작(Phase 1 단일 채널 원칙, SRS §1.2.1 IS-1), 확장 대비 상수 파일 분리
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_product_table --create-only`로 SQL만 먼저 생성, SQL 리뷰 후 `pnpm prisma migrate dev` 실행
- [ ] **Zod 검증 스키마 작성** — `src/lib/schemas/product.ts`에 `CreateProductSchema`, `ProductSchema`(읽기용) 정의, URL 형식/카테고리 Enum 검증 포함
- [ ] **Prisma Client 재생성** — `pnpm prisma generate` → 타입이 `@prisma/client`에서 export되는지 검증
- [ ] **Unit Test 작성** — `tests/schemas/product.test.ts`에 모델 생성/중복 유니크 위반/유효성 검증 테스트 3건 이상 (Vitest + 테스트 DB 또는 Prisma Mock)
- [ ] **Seed 최소 데이터 연계 준비** — DATA-011에서 재사용할 수 있도록 `prisma/seed/fixtures/products.sample.json` 파일에 샘플 5개 레코드 작성 (실제 대량 Seed는 DATA-011로 위임)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 제품 레코드 생성**
- **Given**: `DATABASE_URL`이 로컬 PostgreSQL로 설정되고 마이그레이션이 적용된 상태
- **When**: Prisma Client로 `{ product_name: "고려은단 비타민C", brand_name: "고려은단", category: "VITAMIN", source_channel: "COUPANG", original_url: "https://www.coupang.com/vp/products/12345" }` 레코드를 생성한다
- **Then**: `product_id`(cuid), `created_at`, `updated_at`이 자동 주입된 단일 PRODUCT 레코드가 저장되고, 조회 결과가 입력과 일치한다.

**Scenario 2: 동일 채널 내 중복 URL 등록 차단**
- **Given**: `(source_channel="COUPANG", original_url="https://www.coupang.com/vp/products/12345")`가 이미 저장된 상태
- **When**: 동일한 `source_channel` + `original_url` 조합으로 재등록을 시도한다
- **Then**: Prisma가 `P2002` 유니크 제약 위반 에러를 던지며, 레코드 수는 1건으로 유지된다.

**Scenario 3: 필수 필드 누락 시 검증 실패**
- **Given**: Zod `CreateProductSchema`가 정의된 상태
- **When**: `{ product_name: "", brand_name: "", category: "UNKNOWN", source_channel: "NAVER" }`를 파싱한다
- **Then**: `ZodError`가 발생하고, 에러 메시지에 `product_name 필수`, `category: VITAMIN|MINERAL|...` 중 하나여야 한다는 힌트가 포함된다.

**Scenario 4: 수정 시각 자동 갱신**
- **Given**: 제품 레코드가 10초 전에 생성된 상태
- **When**: `prisma.product.update({ where: { product_id }, data: { manufacturer: "유한양행" } })`를 실행한다
- **Then**: `updated_at`이 현재 시각으로 갱신되고 `created_at`은 변하지 않는다.

**Scenario 5: 인덱스 기반 검색 성능 확보**
- **Given**: 500건 규모의 PRODUCT 레코드가 적재된 상태 (DATA-011 Seed 기준)
- **When**: `prisma.product.findMany({ where: { product_name: { contains: "비타민" } } })`를 실행한다
- **Then**: p95 응답 시간이 로컬 기준 100ms 이내이며, `EXPLAIN ANALYZE` 결과에 `product_name` 인덱스가 활용된다.

## :gear: Technical & Non-Functional Constraints
- **기술 제약 (CON-9)**: 반드시 Prisma ORM 기반. Raw SQL·TypeORM·Drizzle 사용 금지.
- **CQRS 분리 (P2 원칙)**: 본 태스크는 **스키마 정의·마이그레이션**에 한정한다. Read/Write 비즈니스 로직은 별도 Query/Command 태스크에서 다룬다.
- **데이터 무결성**: `original_url`은 반드시 HTTPS URL 형식 (Zod `.url()` + `.startsWith("https://")`). `category`는 애플리케이션 레벨에서 상수 Enum과 매칭 검증.
- **확장성 (REQ-NF-024)**: `source_channel`은 `ChannelAdapter` 전략 패턴과 정합한다. 신규 채널 추가 시 컬럼 스키마 변경 없이 값만 확장 가능해야 한다.
- **개인정보**: PRODUCT는 개인정보를 포함하지 않는다 (CON-4와 무관). 단, `manufacturer` 필드가 선택적(optional)임에 유의.
- **성능**: 인덱스 설계는 REQ-NF-002(뱃지 p95 ≤ 1,000ms), REQ-NF-001(Super-Calc p95 ≤ 3,500ms) 목표의 전제 조건. 누락된 인덱스로 인한 Full Scan은 원천 차단.
- **네이밍 컨벤션**: 컬럼은 `snake_case`(SRS §6.2.1 원문 유지), Prisma 모델은 `PascalCase`(`model Product`), TypeScript 타입은 Prisma 자동 생성분 재사용.
- **마이그레이션 원칙**: 프로덕션 대비 `--create-only`로 SQL을 먼저 리뷰 후 적용한다. 롤백 스크립트는 Prisma 자동 생성 down.sql로 관리.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `prisma/schema.prisma`에 `model Product` 블록이 추가되고, `pnpm prisma format` + `pnpm prisma validate`가 통과하는가?
- [ ] `prisma/migrations/<timestamp>_add_product_table/migration.sql`이 생성되고 **리뷰어 승인**을 받았는가?
- [ ] `pnpm prisma migrate dev` 실행 시 에러 없이 스키마가 동기화되는가?
- [ ] 단위 테스트(Scenario 1~4 기반) 3건 이상이 통과하는가?
- [ ] Zod 스키마(`CreateProductSchema`)가 정의되고 에러 메시지가 사용자 친화적인가?
- [ ] ERD(SRS §6.2.8) 및 Class Diagram(§6.2.9)과 필드·관계가 1:1 정합하는가?
- [ ] 샘플 fixture JSON 5건이 실제 쿠팡 상품 URL 패턴과 일관성 있는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화 선행)
- **Blocks**: 
  - #DATA-003 (INGREDIENT — FK → Product)
  - #DATA-004 (PRICE_SNAPSHOT — FK → Product)
  - #DATA-006 (LABEL_ARCHIVE — FK → Product)
  - #DATA-007 (ERROR_REPORT — FK → Product)
  - #DATA-010 (ERD 통합 검증)
  - #API-003 (Search API DTO)
  - #API-005 (제품 등록 요청 DTO)
  - #COM-C-003 (미등록 제품 등록 요청 Server Action)

## :bookmark_tabs: Notes
- **MVP 데이터 규모**: SRS §3.1.1에 따라 상위 300~500개 제품 기준. 인덱스·제약 설계 시 이 규모를 기준으로 하되, 10배 증가(~5,000개)까지는 스키마 변경 없이 감당 가능해야 한다.
- **Phase 2 확장 여지**: 다채널 확장 시 `source_channel`에 `AMAZON`, `IHERB` 등을 추가할 수 있도록 Enum이 아닌 String으로 의도적 설계.
- `manufacturer`를 Optional(`?`)로 둔 이유: 쿠팡 메타데이터가 제조사 정보를 누락할 수 있으며, 이 경우 CP-1(대안 데이터 소스)의 라벨 OCR·수동 입력 파이프라인으로 후속 보정.
