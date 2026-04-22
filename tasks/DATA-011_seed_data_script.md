---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-011: MVP 초기 Seed 데이터 스크립트 작성 (상위 300~500개 제품, 성분, 식약처 공전 데이터 로컬 적재)"
labels: 'feature, data, epic:E-DATA, priority:high, phase:1, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-011] MVP 초기 Seed 데이터 스크립트 작성 (300~500개 제품 로컬 적재)
- 목적: 서비스 최소 보장 데이터셋(Minimum Viable Dataset)을 확보하여 외부 API 장애 시에도 기본 서비스를 유지하며, 프론트엔드 개발 및 테스트에 필요한 현실적인 데이터 기반을 구축한다.
- Epic / Phase: E-DATA / Phase 1 (계약·데이터 명세)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (사전 데이터 확보 원칙): [`/05_SRS_v1.md#3.1.1 외부 시스템 비가용 시 내부 폴백 전략`](../05_SRS_v1.md) — §3.1.1 사전 데이터 확보 원칙
- SRS 문서 (In-Scope IS-5): [`/05_SRS_v1.md#1.2.1 In-Scope`](../05_SRS_v1.md) — 상위 300~500개 영양제 제품
- SRS 문서 (비상 대응 CP-1): [`/05_SRS_v1.md#1.2.5 Contingency Plans`](../05_SRS_v1.md) — 식약처 공전 로컬 DB 대안
- SRS 데이터 모델 (ERD): [`/05_SRS_v1.md#6.2 Entity & Data Model`](../05_SRS_v1.md) — PRODUCT, INGREDIENT, BADGE, LABEL_ARCHIVE, PRICE_SNAPSHOT
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.1 데이터베이스 스키마 태스크`](./06_TASK_LIST_v1.md) — DATA-011
- 선행 태스크: **DATA-010** (ERD 통합 검증 + 마이그레이션 실행 완료)
- 후행 태스크: MOCK-001~006 (Mock 엔드포인트), F1-RH-001, F2-RH-001 (실 데이터 기반 로직 검증)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **시드 데이터 소스 선정 및 수집 범위 확정** — 국내 건기식 시장 상위 카테고리(비타민, 미네랄, 프로바이오틱스, 오메가3, 콜라겐 등) 기준 300~500개 제품 목록 정의 (CSV/JSON)
- [ ] **PRODUCT Seed 데이터 작성** — 300~500개 제품의 `product_name`, `brand_name`, `manufacturer`, `category`, `source_channel(쿠팡)`, `original_url` 정보 수집 및 JSON/CSV 파일 생성
- [ ] **INGREDIENT Seed 데이터 작성** — 제품별 성분 정보(`standard_name`, `common_name`, `amount_per_serving`, `unit`, `mfds_status`, `mfds_claim`) 수집. 제품당 평균 3~8개 성분 기준 최소 1,500~4,000건
- [ ] **식약처 건강기능식품공전 벌크 데이터 적재** — 공전 등재 기능성 인정 원료 전량 사전 수집 → `INGREDIENT.mfds_status`, `INGREDIENT.mfds_claim` 필드에 매핑 (월 1회 갱신 기준과 동일 품질)
- [ ] **PRICE_SNAPSHOT 초기 가격 Seed** — 300~500개 제품의 초기 가격 스냅샷(`price_krw`, `shipping_fee`, `daily_cost_krw`, `captured_at`) 생성. 실제 쿠팡 API 또는 수집 데이터 기반
- [ ] **BADGE Seed 데이터 생성** — 식약처 공전 기반 뱃지 판정 결과(`badge_type`, `badge_label`, `evidence_source`, `evidence_url`) 사전 산출. APPROVED/CAUTION/NOT_APPROVED 분포 유지
- [ ] **Prisma Seed 스크립트 작성** — `prisma/seed.ts`에 TypeScript 기반 시드 작성. `prisma db seed` 커맨드로 실행 가능하도록 `package.json#prisma.seed` 필드 설정
- [ ] **멱등성 보장** — 시드 스크립트가 여러 번 실행되어도 중복 데이터가 생성되지 않도록 `upsert` 패턴 적용
- [ ] **데이터 출처 추적** — 대안 데이터 소스를 사용한 경우, 각 INGREDIENT 레코드의 `data_source` 필드에 원천 정보 기록 (SRS CP-1 준수). 스키마에 해당 필드가 없으면 사전 협의
- [ ] **데이터 무결성 검증 스크립트 작성** — 시드 실행 후 데이터 건수, FK 참조 무결성, 필수 필드 비어있음(NULL) 체크, 뱃지 분포 확인을 수행하는 검증 스크립트 작성
- [ ] **간이 데이터 품질 리포트** — 시드 실행 후 카테고리별 제품 수, 성분 커버리지, 식약처 등록/미등록 비율, 가격 분포 통계 출력

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 시드 스크립트 정상 실행**
- **Given**: DATA-010까지 마이그레이션이 완료된 깨끗한 DB 상태
- **When**: `pnpm prisma db seed` 커맨드를 실행한다
- **Then**: PRODUCT 테이블에 300개 이상의 레코드가 적재되고, INGREDIENT 테이블에 1,500건 이상, PRICE_SNAPSHOT에 300건 이상, BADGE에 100건 이상이 적재되며, 에러 0건으로 완료된다.

**Scenario 2: 시드 멱등성 검증**
- **Given**: 시드 스크립트가 1회 정상 실행된 상태
- **When**: 동일 시드 스크립트를 재실행한다
- **Then**: 기존 데이터와 중복된 레코드가 생성되지 않으며, 기존 레코드 수가 유지되고, 에러 0건으로 완료된다.

**Scenario 3: 카테고리별 적정 분포**
- **Given**: 시드 데이터가 적재된 상태
- **When**: 카테고리별 제품 수를 집계한다
- **Then**: 최소 5개 이상의 카테고리(비타민, 미네랄, 프로바이오틱스, 오메가3, 콜라겐 등)에 제품이 분포하며, 단일 카테고리에 전체의 50%를 초과하는 편중이 없다.

**Scenario 4: 식약처 공전 데이터 품질**
- **Given**: 시드 데이터가 적재된 상태
- **When**: INGREDIENT 테이블에서 `mfds_status = 'REGISTERED'`인 레코드의 `mfds_claim` 필드를 조회한다
- **Then**: 등록 상태 성분의 95% 이상이 비어있지 않은 `mfds_claim`을 보유하며, 무작위 50건 샘플 검수에서 오류율이 5% 이하이다.

**Scenario 5: FK 참조 무결성 확인**
- **Given**: 시드 데이터가 적재된 상태
- **When**: INGREDIENT.product_id, PRICE_SNAPSHOT.product_id, BADGE.ingredient_id에 대해 FK 참조 검증을 수행한다
- **Then**: 고아(orphan) 레코드가 0건이며, 모든 FK가 유효한 부모 레코드를 참조한다.

## :gear: Technical & Non-Functional Constraints
- **데이터 규모 (IS-5)**: 최소 300개, 최대 500개 제품. 과도한 데이터는 Free 티어 DB 용량 한도(Supabase Free: 500MB) 고려하여 제한.
- **시드 실행 시간**: 전체 시드 스크립트 실행 시간 ≤ 5분 (로컬 환경 기준). 대량 insert는 배치(batch) 처리 적용.
- **데이터 출처 추적 (CP-1)**: 대안 데이터 소스를 사용한 레코드는 반드시 원천 표시. 추후 갱신·검수 대상 식별 가능해야 함.
- **오류율 기준 (REQ-NF-011)**: Phase 1 성분 DB 오류율 ≤ 5% 목표. 시드 데이터의 무작위 50건 샘플 정합성 검사 필수.
- **환경 분리**: 시드 스크립트는 로컬(`SQLite`) 및 배포(`PostgreSQL`) 양쪽 환경에서 모두 실행 가능해야 함 (CON-9).
- **재현 가능성**: 시드 데이터 원본(CSV/JSON)은 `prisma/seed-data/` 디렉토리에 버전 관리하여 누구나 동일 결과 재현 가능.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `pnpm prisma db seed` 실행 시 에러 0건으로 완료되는가?
- [ ] PRODUCT ≥ 300건, INGREDIENT ≥ 1,500건, PRICE_SNAPSHOT ≥ 300건, BADGE ≥ 100건 적재 검증?
- [ ] 데이터 무결성 검증 스크립트가 모든 항목 PASS하는가?
- [ ] 시드 데이터 원본 파일(`prisma/seed-data/`)이 Git에 포함되어 재현 가능한가?
- [ ] 카테고리별 분포 편중 없이 최소 5개 카테고리에 데이터가 분산되는가?
- [ ] SonarQube / Linter 정적 분석 경고 0건?
- [ ] PR 리뷰에서 **데이터 품질 검토자 1명 이상 승인**?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-010 (ERD 통합 검증 + 마이그레이션 실행 완료)
- **Blocks**:
  - #MOCK-001~006 (실 데이터 기반 Mock 엔드포인트 검증)
  - #F1-RH-001 (Super-Calc 통합 조립 시 실 데이터 필요)
  - #F2-RH-001 (Badge 판정 시 실 성분/공전 데이터 필요)
  - #UI-010~020 (프론트엔드 개발 시 실 데이터 렌더링 검증)

## :bookmark_tabs: Notes
- 본 태스크는 전체 Phase 1 의존성 그래프에서 **DATA 스키마 계층의 최종 태스크**이다. 본 태스크 완료 후 Step 2(로직) 및 Step 5(UI) 태스크가 본격적으로 병렬 시작될 수 있다.
- 초기 시드 데이터는 **완벽할 필요 없다**. Phase 1 오류율 ≤ 5% 기준만 충족하면 되며, 이후 F4 Data Trust System(오류 제보)을 통해 점진적으로 품질을 개선한다.
- 가격 데이터는 시드 시점의 스냅샷이며, 운영 환경에서는 CRON-001(일 1회 가격 동기화 배치)에 의해 자동 갱신된다.
- 시드 데이터 수집 과정에서 무단 크롤링은 절대 금지 (CON-1). 공식 Affiliate API 또는 공공 데이터 API, 제조사 공개 정보만 사용한다.
