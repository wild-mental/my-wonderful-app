---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-008: COMPARISON_HISTORY 테이블 Prisma 스키마 정의 (비교 이력 저장용, FK → USER)"
labels: 'feature, data, epic:E-DATA, priority:medium, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-008] COMPARISON_HISTORY 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: SRS §4.1.5 REQ-FUNC-035(비교 이력 저장/재조회) 및 CON-4(최소 수집 원칙: **email, 비교 이력만**) 원칙에 따라, 인증 사용자의 비교 조회 내역을 시계열로 저장하는 테이블을 구축한다. MVP에서는 **Phase 2 기능(REQ-FUNC-035)의 스키마만 선제적으로 준비**하고, 실제 UI/재조회 로직은 P2-001 태스크로 미룬다. 본 태스크는 CON-4 수집 필드 2개 중 "비교 이력"에 해당하는 SSOT이다.
- Epic / Phase: E-DATA / Phase 1 (스키마만), 실제 기능 소비는 Phase 2 (REQ-FUNC-035)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (Should-Have 요구): [`/05_SRS_v1.md#4.1.6 REQ-FUNC-035`](../05_SRS_v1.md)
- SRS 문서 (제약): [`/05_SRS_v1.md#1.2.3 CON-4`](../05_SRS_v1.md) — 최소 수집 원칙 (email, 비교 이력만)
- SRS 문서 (보안 NFR): [`/05_SRS_v1.md#4.2.3 REQ-NF-015`](../05_SRS_v1.md) — 수집 필드 2개
- SRS 문서 (Use Case): [`/05_SRS_v1.md#3.5 UC-13`](../05_SRS_v1.md) — 비교 이력 조회
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-009** (USER FK)
- 후행 태스크: DATA-010, P2-001 (Phase 2 기능 구현), NFR-SEC-002 (최소 수집 원칙 검증)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model ComparisonHistory` 블록 추가
- [ ] **필드 매핑 (SRS §4.1.6 AC 정합 + CON-4 최소화 원칙)**:
  - `history_id: String @id @default(cuid())`
  - `user_id: String` + `user User @relation(fields: [user_id], references: [user_id], onDelete: Cascade)` — 사용자 탈퇴 시 완전 삭제 (개인정보 보호)
  - `ingredient_query: String` (비교 트리거 검색어, 예: `비타민D 1000IU`, 최대 200자)
  - `dosage_query: String?` (용량 파라미터, 예: `1000IU`, 선택)
  - `result_snapshot: Json` (당시 비교 결과의 직렬화 스냅샷 — product_id[], daily_cost_krw[], captured_at 배열)
  - `compared_at: DateTime @default(now())`
  - `retention_until: DateTime` (저장 유지 기한, 기본 `compared_at + 180일`. 만료 시 자동 삭제 배치)
- [ ] **인덱스 설계**:
  - `@@index([user_id, compared_at(sort: Desc)])` — 사용자별 최근 이력 조회 (UC-13 핵심 경로)
  - `@@index([retention_until])` — 만료 배치 삭제 조회
- [ ] **Reverse Relation** — `model User`에 `comparison_histories ComparisonHistory[]` 추가
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_comparison_history_table --create-only` → 리뷰 → 적용
- [ ] **Zod 스키마 작성** — `src/lib/schemas/comparison-history.ts`:
  - `ingredient_query`: 1~200자, trim 필수
  - `result_snapshot`: 스키마 정의(product_id, daily_cost_krw, final_price_krw, captured_at 배열). Phase 2 기능에서 재현되므로 형식 고정 중요
- [ ] **개인정보 스캐닝 가드** — `ingredient_query`에 이메일/전화번호 패턴이 포함되면 저장 거부(CON-4 보호, best-effort)
- [ ] **보존 기한 헬퍼** — `src/lib/comparison-history/retention.ts`에 `computeRetentionUntil(comparedAt: Date, days = 180): Date` 정의
- [ ] **익명화 유틸 준비 (Phase 2 b2b 인텔리전스 연계)** — `anonymizeForBI(history): {...}` 스켈레톤. 실제 k-anonymity ≥ 5 보장은 P2-005에서 처리
- [ ] **feature flag 설정** — `src/lib/features.ts`에 `COMPARISON_HISTORY_WRITE_ENABLED`(MVP: false, Phase 2: true) 플래그. MVP 동안에는 **쓰기 경로를 기본 비활성**하여 오인 사용 방지
- [ ] **Unit Test 작성** — 4건 이상: Cascade 삭제, 만료 쿼리 인덱스 활용, JSON 스키마 검증, 개인정보 스캐닝 차단

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 비교 이력 레코드 저장**
- **Given**: USER `U1`, feature flag `COMPARISON_HISTORY_WRITE_ENABLED=true`인 상태
- **When**: `{ user_id: "U1", ingredient_query: "비타민D", dosage_query: "1000IU", result_snapshot: { items: [{ product_id: "P1", daily_cost_krw: 450, final_price_krw: 27000, captured_at: "..." }] } }`를 저장
- **Then**: 레코드가 저장되고 `retention_until = compared_at + 180d`로 자동 설정된다.

**Scenario 2: USER 탈퇴 시 Cascade 삭제 (CON-4 보호)**
- **Given**: USER 1건과 COMPARISON_HISTORY 10건이 연결된 상태
- **When**: `prisma.user.delete({ where: { user_id: "U1" } })`
- **Then**: COMPARISON_HISTORY 10건이 자동 삭제된다. (개인정보 완전 파기)

**Scenario 3: 만료 이력 배치 조회**
- **Given**: `retention_until`이 현재 시각 이전인 레코드 5건, 이후인 레코드 10건 존재
- **When**: `prisma.comparisonHistory.findMany({ where: { retention_until: { lt: now } } })`
- **Then**: 5건이 반환되며, `@@index([retention_until])`가 활용된다.

**Scenario 4: 개인정보 포함 쿼리 차단**
- **Given**: Zod 스키마
- **When**: `ingredient_query: "내 이메일은 test@example.com"` 저장 시도
- **Then**: 저장 레이어에서 거부되며 감사 로그에 기록된다.

**Scenario 5: MVP에서 쓰기 경로 차단 (Feature Flag 기본값)**
- **Given**: MVP 환경(`COMPARISON_HISTORY_WRITE_ENABLED=false`)
- **When**: 서비스 레이어에서 이력 저장 호출
- **Then**: `FeatureDisabledError`가 발생 또는 no-op 처리되며, 레코드가 생성되지 않는다.

**Scenario 6: result_snapshot JSON 스키마 검증**
- **Given**: Zod `ComparisonHistorySnapshotSchema`
- **When**: `{ result_snapshot: { items: [{ product_id: "P1" }] } }` (필드 누락)
- **Then**: ZodError 발생, 필수 필드(`daily_cost_krw`, `final_price_krw`, `captured_at`) 누락 메시지 반환.

## :gear: Technical & Non-Functional Constraints
- **최소 수집 원칙 (CON-4, REQ-NF-015)**: 수집 필드는 **email(USER) + 비교 이력(COMPARISON_HISTORY)** 2개로 한정된다. 본 테이블의 필드 확장 시 반드시 **CON-4 재검토 및 법률 자문**을 요구.
- **보존 정책**: 기본 180일 이후 자동 삭제. NFR-SEC-002(최소 수집 원칙 기술 검증)에서 삭제 배치 존재를 검증. Phase 2 배치 태스크로 "expire-comparison-history" cron 추가 예정.
- **Cascade 정책**: USER 삭제 시 Cascade. 이는 개인정보 완전 파기 의무(CON-4 보호)의 기술적 구현.
- **Feature Flag**: MVP 단계에서는 **쓰기 경로 자체를 기본 차단**. 이는 REQ-FUNC-035가 Should-Have(Phase 2) 요구사항이므로 오작동으로 인한 개인정보 수집 방지.
- **CQRS 분리 (P2)**: 본 태스크는 스키마·보존 헬퍼·feature flag에 한정. 실제 비교 이력 저장 Command와 재조회 Query는 P2-001에서 담당.
- **Phase 2 B2B 연계 (REQ-FUNC-039)**: `anonymizeForBI()` 스켈레톤은 k-anonymity ≥ 5 요건(REQ-NF-016, CON-6) 대비 인터페이스만 정의. 실제 익명화는 P2-005에서 처리.
- **JSON 필드 한계**: PostgreSQL JSONB 타입 활용. 하지만 복잡한 인덱싱이 필요한 쿼리(특정 product_id 포함 이력 등)는 Phase 2에서 별도 조인 테이블로 정규화 고려.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `model ComparisonHistory`가 정의되고 `prisma validate` 통과하는가?
- [ ] 2개 인덱스가 모두 생성되었는가?
- [ ] USER FK가 `onDelete: Cascade`로 설정되어 CON-4 보호가 보장되는가?
- [ ] Feature flag(`COMPARISON_HISTORY_WRITE_ENABLED`)가 구현되고 **MVP 기본값 false**인가?
- [ ] Zod 스키마가 JSON 형식과 개인정보 스캐닝을 검증하는가?
- [ ] 마이그레이션 SQL이 리뷰되고 Cascade 동작이 검증되는가?
- [ ] NFR-SEC-002(최소 수집 원칙 기술 검증)에서 참조할 수 있는 **수집 필드 목록 docstring**이 포함되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-009 (USER FK)
- **Blocks**: 
  - #DATA-010 (ERD 통합 검증)
  - #P2-001 (Phase 2: 비교 이력 저장/재조회 기능 구현)
  - #NFR-SEC-002 (최소 수집 원칙 기술 검증)
  - #P2-005 (B2B 인텔리전스 — 익명화)

## :bookmark_tabs: Notes
- 본 태스크는 **스키마 선제 구축** 목적으로, 실제 사용자 대면 기능(UC-13, REQ-FUNC-035)은 MVP 출시 후 3개월 시점의 Phase 2 스코프(P2-001)에서 활성화된다. MVP 단계에서 스키마를 미리 만들어 두는 이유:
  1. DATA-010 ERD 통합 검증에서 누락 방지
  2. CON-4 "email + 비교 이력" 최소 수집 원칙의 기술적 준비 증빙
  3. Phase 2 전환 시 스키마 마이그레이션으로 인한 서비스 중단 방지
- `result_snapshot` JSONB 필드의 형식 변경은 하위 호환성 파괴 리스크가 크므로, **버전 필드**(`snapshot_version: Int @default(1)`) 추가를 권장. 본 문서는 기본 v1로 시작.
- Phase 2 가격 하락 알림(REQ-FUNC-037)은 별도 `price_alerts` 테이블로 독립. COMPARISON_HISTORY와는 결합하지 않는다(책임 분리).
