---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-010: Prisma ERD 전체 관계 검증 및 통합 마이그레이션 실행 (prisma migrate dev)"
labels: 'feature, data, epic:E-DATA, priority:critical, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-010] Prisma ERD 전체 관계 검증 및 통합 마이그레이션 실행
- 목적: DATA-002 ~ DATA-009에서 독립적으로 정의된 **8개 엔티티**의 관계(FK, Cascade/Restrict, 역참조)를 **단일 ERD로 통합 검증**하고, 모든 마이그레이션이 올바른 순서로 클린 환경에 적용됨을 보장한다. 이 태스크 완료 시점부터 API-001~008, F1/F2/F4 비즈니스 로직 구현이 병렬 착수 가능하다(의존성 다이어그램 Phase 1 → Phase 2 전환점).
- Epic / Phase: E-DATA / Phase 1 (데이터 계층 Gate Keeper)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (ERD 전체): [`/05_SRS_v1.md#6.2.8 Entity Relationship Summary`](../05_SRS_v1.md)
- SRS 문서 (Class Diagram): [`/05_SRS_v1.md#6.2.9`](../05_SRS_v1.md) — 객체 관계 검증 근거
- SRS 문서 (제약): [`/05_SRS_v1.md#1.2.3 CON-9`](../05_SRS_v1.md) — Prisma + Supabase PostgreSQL
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 의존성 다이어그램: [`/TASKS/06_TASK_LIST_v1.md#9`](./06_TASK_LIST_v1.md) — Phase 1 Critical Path
- 선행 태스크: **DATA-002 ~ DATA-009** 8건 모두 완료
- 후행 태스크: DATA-011 (Seed 데이터), API-001 ~ API-008, F1/F2/F4 전체 로직, NFR-002

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **ERD 교차 검증 문서 작성** — `docs/erd-validation.md`에 SRS §6.2.8 원문 ERD와 `prisma/schema.prisma`의 실제 모델을 side-by-side 비교표로 정리 (엔티티 8개, FK 관계 6개, Enum 7개)
- [ ] **누락 역참조 관계 추가**:
  - `Product.ingredients Ingredient[]`
  - `Product.price_snapshots PriceSnapshot[]`
  - `Product.label_archives LabelArchive[]`
  - `Product.error_reports ErrorReport[]`
  - `Ingredient.badges Badge[]`
  - `User.reports ErrorReport[]`
  - `User.comparison_histories ComparisonHistory[]`
  - `LabelArchive.uploaded_by_user User? @relation(...)` (DATA-006에서 컬럼만 선언된 부분의 FK 관계 완성 — 본 태스크가 적정 시점)
- [ ] **전체 Prisma 스키마 정합성 검사** — `pnpm prisma format && pnpm prisma validate`로 문법·관계 무결성 확인 (에러 0건, 경고 0건 목표)
- [ ] **의존성 그래프 검증** — 각 FK의 `onDelete` 정책이 아래 매트릭스와 일치하는지 확인:
  | From | To | onDelete |
  |---|---|---|
  | Ingredient.product_id | Product | Cascade |
  | PriceSnapshot.product_id | Product | Cascade |
  | LabelArchive.product_id | Product | Cascade |
  | LabelArchive.uploaded_by | User | SetNull (업로더 탈퇴 시 라벨 보존) |
  | Badge.ingredient_id | Ingredient | Cascade |
  | ErrorReport.product_id | Product | **Restrict** |
  | ErrorReport.reporter_id | User | **Restrict** |
  | ComparisonHistory.user_id | User | Cascade |
- [ ] **클린 DB 환경에서 통합 마이그레이션 리허설**:
  - `docker compose up postgres`로 로컬 PostgreSQL 기동 (또는 Supabase 샌드박스)
  - `pnpm prisma migrate reset --force` 실행 후 모든 마이그레이션 순차 적용 검증
  - 각 마이그레이션이 이전 마이그레이션 없이는 **독립 적용 실패**함을 확인(의존성 올바름의 간접 증거)
- [ ] **Prisma Client 재생성 + 타입 검증** — `pnpm prisma generate && pnpm typecheck` → 모든 모델 타입이 `@prisma/client`에서 export되고 TypeScript 오류 0건
- [ ] **ERD 시각화 산출물 생성** — `prisma-erd-generator` 또는 DBML 변환 도구로 `docs/erd.svg` / `docs/erd.dbml` 자동 생성, SRS §6.2.8 mermaid ERD와 대조 문서 첨부
- [ ] **성능 쿼리 리그레션 세트** — `tests/data/erd-regression.test.ts`에 아래 3대 핵심 쿼리 `EXPLAIN` 스냅샷 테스트 작성:
  1. `Product → Ingredient[] → Badge[]` 중첩 조회 (F2-RH-001 핵심 경로)
  2. 제품별 최신 PriceSnapshot 조회 (F1-Q-002 폴백 핵심 경로)
  3. 사용자별 24h 내 ErrorReport 집계 (F4-C-002 스팸 필터 핵심 경로)
- [ ] **Cross-Entity Integration Test 작성** — `tests/data/integration.test.ts`에 6건 이상:
  - 완전한 시나리오: USER 생성 → PRODUCT 생성 → INGREDIENT·PRICE_SNAPSHOT·LABEL_ARCHIVE 연결 → BADGE 부여 → ERROR_REPORT 제출 → COMPARISON_HISTORY 저장
  - USER 삭제 시 COMPARISON_HISTORY만 Cascade / ERROR_REPORT는 Restrict
  - PRODUCT 삭제 시 ERROR_REPORT가 참조 중이면 Restrict로 삭제 실패
- [ ] **마이그레이션 롤백 리허설** — Prisma `migrate resolve`를 사용한 롤백 시뮬레이션 절차를 `docs/runbook-db-rollback.md`에 문서화
- [ ] **Shadow DB 설정 검증** — Prisma Migrate가 요구하는 Shadow Database 연결이 Supabase 환경에서도 작동하는지 확인 (NFR-002 선행 확인 포인트)
- [ ] **final `pnpm prisma migrate dev` 실행** — 클린 로컬 DB에서 모든 마이그레이션 적용 후 `_prisma_migrations` 테이블의 레코드 수가 DATA-002~009 각각에 해당하는 건수만큼 존재하는지 확인

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 클린 환경에서 전체 마이그레이션 정상 적용**
- **Given**: 비어있는 PostgreSQL 데이터베이스
- **When**: `pnpm prisma migrate deploy` 실행
- **Then**: 모든 마이그레이션이 순차적으로 적용되고, `pnpm prisma db pull` 결과가 현재 `schema.prisma`와 100% 일치한다.

**Scenario 2: Prisma ERD와 SRS §6.2.8 ERD 일치**
- **Given**: `docs/erd-validation.md` 비교표 작성 완료
- **When**: SRS 원문 ERD의 8개 엔티티·6개 관계를 1:1 체크
- **Then**: 누락·추가 관계가 0건이며, 추가된 보조 필드는 모두 CP-1 추적성·SLA 운영성 사유로 문서화되어 있다.

**Scenario 3: E2E 시나리오 통합 테스트**
- **Given**: 클린 테스트 DB
- **When**: 아래 시나리오를 순차 실행:
  1. USER `U1` 생성
  2. PRODUCT `P1` 생성 (source_channel=COUPANG)
  3. INGREDIENT `I1` (product_id=P1) 생성
  4. PRICE_SNAPSHOT 생성 (final=27000, daily=450)
  5. LABEL_ARCHIVE 생성 (uploaded_by=U1)
  6. BADGE 생성 (ingredient_id=I1, badge_type=APPROVED, prohibited_check_passed=true)
  7. ERROR_REPORT 생성 (reporter=U1, product=P1)
- **Then**: 모든 INSERT가 성공하고, `Product` 한 건에서 `include: { ingredients: { include: { badges: true } }, price_snapshots: true, label_archives: true, error_reports: true }` 복합 조회 시 모든 관련 레코드가 반환된다.

**Scenario 4: Cascade/Restrict 정책 동작 검증**
- **Given**: Scenario 3 상태
- **When**: 
  (a) `prisma.product.delete({ where: { product_id: "P1" } })` — 연결된 ERROR_REPORT로 인해 **Restrict 실패 예상**
  (b) ERROR_REPORT 삭제 후 재시도 → Cascade로 INGREDIENT/PRICE_SNAPSHOT/LABEL_ARCHIVE/BADGE 자동 삭제
- **Then**: (a) `P2003` FK 제약 에러, (b) 관련 레코드 0건 남음 (ERROR_REPORT 제외)

**Scenario 5: USER Cascade/Restrict 정책**
- **Given**: USER 1건, 연결된 COMPARISON_HISTORY 3건, ERROR_REPORT 2건 존재
- **When**: `prisma.user.delete({ where: { user_id: "U1" } })`
- **Then**: ERROR_REPORT Restrict로 삭제 실패. Soft delete(`deleted_at=now()`)로 대체 처리됨을 가이드 문서에서 확인.

**Scenario 6: 성능 쿼리 인덱스 활용 보장**
- **Given**: 시드 데이터 300건(10개 제품 × 평균 5 성분 × 평균 6 스냅샷) 적재
- **When**: 아래 3대 쿼리의 `EXPLAIN ANALYZE` 실행:
  1. 제품별 최신 스냅샷 조회
  2. 성분별 뱃지 + 일상어 번역 조회
  3. 사용자별 24h 제보 집계
- **Then**: 모든 쿼리가 Index Scan을 사용하며 Seq Scan이 0건이다.

**Scenario 7: Prisma ERD 시각화 산출물 존재**
- **Given**: 파이프라인 실행 후
- **When**: `docs/erd.svg` 확인
- **Then**: 8개 엔티티가 모두 표시되고, SRS §6.2.8 mermaid ERD와 구조적으로 동일하다.

**Scenario 8: 타입 안전성**
- **Given**: 모든 마이그레이션 적용 후
- **When**: `pnpm prisma generate && pnpm typecheck` 실행
- **Then**: TypeScript 에러 0건, 8개 모델 타입이 `@prisma/client`에서 export된다.

## :gear: Technical & Non-Functional Constraints
- **결정적(Deterministic) 마이그레이션**: 동일한 마이그레이션 파일 집합을 다른 DB에 적용해도 **100% 동일한 스키마**가 생성되어야 한다. 환경 의존 SQL(예: `CURRENT_USER`) 금지.
- **Cascade vs Restrict 설계 원칙**:
  - **Cascade**: 종속 레코드가 부모 없이 의미를 잃는 경우 (Ingredient/PriceSnapshot/LabelArchive/Badge/ComparisonHistory)
  - **Restrict**: 감사 추적이 필수인 경우 (ErrorReport — 법적·신뢰성 이슈 대응 기록)
  - **SetNull**: 부모 삭제돼도 자식이 독립 의미를 가지는 경우 (LabelArchive.uploaded_by)
- **CON-4 교차 검증**: USER 관련 모든 Cascade 경로가 개인정보 완전 파기 원칙과 일치하는지 확인 (단, ErrorReport Restrict는 예외적 감사 필요 — Soft Delete로 우회).
- **성능 기준 (REQ-NF-001/002)**: 성능 회귀 테스트는 로컬 기준이지만 인덱스 활용 검증은 **필수**. Supabase 실제 환경 검증은 NFR-002에서 수행.
- **트랜잭션 안전성**: 통합 테스트 시 각 시나리오는 독립 트랜잭션 또는 테스트 간 DB 리셋으로 격리.
- **Shadow DB**: Prisma Migrate Dev는 Shadow DB를 요구한다. Supabase Free tier에서 Shadow DB 권한이 제한될 수 있으므로 대안 전략을 Runbook에 명시(Dedicated shadow DB URL 또는 `--skip-generate` 우회).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~8)를 충족하는가?
- [ ] `docs/erd-validation.md`에 SRS 원문 vs 실제 스키마 비교표가 완성되고 누락 0건인가?
- [ ] 8개 엔티티의 FK 정책(Cascade/Restrict/SetNull)이 설계 매트릭스와 1:1 일치하는가?
- [ ] `pnpm prisma migrate deploy` 클린 적용 리허설이 성공하는가?
- [ ] Cross-Entity Integration Test 6건 이상이 통과하는가?
- [ ] 성능 쿼리 3대 핵심 경로의 `EXPLAIN`에서 Index Scan만 사용됨을 자동 테스트로 검증하는가?
- [ ] ERD 시각화(`docs/erd.svg`)가 생성되고 CI 산출물로 유지되는가?
- [ ] DB 롤백 Runbook(`docs/runbook-db-rollback.md`)이 작성되었는가?
- [ ] PR 리뷰에서 **아키텍처·DB 리뷰어 2인 승인**을 받았는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-002 (PRODUCT)
  - #DATA-003 (INGREDIENT)
  - #DATA-004 (PRICE_SNAPSHOT)
  - #DATA-005 (BADGE)
  - #DATA-006 (LABEL_ARCHIVE)
  - #DATA-007 (ERROR_REPORT)
  - #DATA-008 (COMPARISON_HISTORY)
  - #DATA-009 (USER)
- **Blocks**: 
  - #DATA-011 (Seed 스크립트는 통합 ERD 기반)
  - #API-001 ~ API-008 (DTO 타입 정의, Prisma 타입 재사용)
  - #MOCK-001 ~ MOCK-006 (Mock 서비스, DTO 의존)
  - #F1-Q-001 ~ F1-C-004 (Super-Calc 로직)
  - #F2-Q-001 ~ F2-C-005 (Badge 로직)
  - #F4-C-001 ~ F4-C-005 (제보 로직)
  - #COM-C-001 ~ COM-C-002 (가입·인증)
  - #NFR-002 (Supabase 연결)

## :bookmark_tabs: Notes
- 본 태스크는 **Phase 1의 Gate Keeper**이다. 이 태스크 완료 시점부터 의존성 다이어그램상 Phase 2(핵심 로직 CQRS)와 Phase 3(UI)의 병렬 착수가 가능하다. SRS §9 Critical Path에서 `DATA-002~009 → DATA-010 → DATA-011`이 명시되어 있다.
- **추가된 필드의 사후 ERD 문서화**: DATA-003~009에서 SRS 원문에 없는 운영 필드(예: `INGREDIENT.data_source`, `ERROR_REPORT.sla_deadline_at`)를 추가했으므로, 본 태스크의 `docs/erd-validation.md`에 **(a) 원문 필드, (b) 추가 필드, (c) 추가 사유**를 표로 명시 필수.
- DATA-011(Seed 300~500개 제품 스크립트)은 본 태스크와 병렬 시작 가능하나, **Seed 실 실행은 DATA-010 완료 후**에만 안전하다.
- 본 태스크 완료 시 `CHANGELOG.md`에 "Phase 1 Data Layer 완료" 릴리스 태그 부여 권장.
