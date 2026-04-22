---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-005: BADGE 테이블 Prisma 스키마 정의 및 마이그레이션 생성 (FK → INGREDIENT, Enum: APPROVED/CAUTION/NOT_APPROVED)"
labels: 'feature, data, epic:E-DATA, priority:critical, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-005] BADGE 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: F2 Anti-BS Dashboard의 **식약처 건강기능식품공전 기반 기능성 인정 뱃지**(APPROVED/CAUTION/NOT_APPROVED) 판정 결과와 근거 출처를 영속화한다. REQ-FUNC-011(공전 원문 1:1 매칭), REQ-FUNC-012(금지 표현 0건 보장), REQ-FUNC-015(근거 출처 1탭 확인)의 기반 테이블이다.
- Epic / Phase: E-DATA / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.4 BADGE`](../05_SRS_v1.md) — 6개 필드 원천 명세
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-011/012/015
- SRS 문서 (뱃지 시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — 판정 분기 로직
- SRS 문서 (제약사항): [`/05_SRS_v1.md#1.2.3 CON-2`](../05_SRS_v1.md) — 질병 예방·치료 표현 금지
- SRS 문서 (Class Diagram): [`/05_SRS_v1.md#6.2.9`](../05_SRS_v1.md) — `Badge.validateAgainstMFDS()`, `containsProhibitedExpression()`
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-003** (INGREDIENT FK)
- 후행 태스크: DATA-010, F2-C-001 (뱃지 판정), F2-C-005 (캐싱), F2-RH-001, F4-Q-001, API-002, TEST-F2-002

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model Badge` 블록 추가
- [ ] **필드 매핑 (SRS §6.2.4 + 추적성 확장)**:
  - `badge_id: String @id @default(cuid())`
  - `ingredient_id: String` + `ingredient Ingredient @relation(fields: [ingredient_id], references: [ingredient_id], onDelete: Cascade)`
  - `badge_type: BadgeType` (Enum: `APPROVED` / `CAUTION` / `NOT_APPROVED`)
  - `badge_label: String` (공전 원문 래핑 텍스트, 최대 500자)
  - `evidence_source: EvidenceSource` (Enum: `MFDS` / `PAPER` / `MANUFACTURER`)
  - `evidence_url: String` (HTTPS 형식 강제)
  - `decision_reason: String?` (판정 사유 — CAUTION 시 함량 초과/부족 등 내부 기록용)
  - `prohibited_check_passed: Boolean @default(false)` (REQ-FUNC-012 금지 표현 검증 통과 플래그, `true` 없이는 노출 금지)
  - `created_at: DateTime @default(now())`
  - `updated_at: DateTime @updatedAt`
- [ ] **Enum 정의**:
  - `enum BadgeType { APPROVED CAUTION NOT_APPROVED }`
  - `enum EvidenceSource { MFDS PAPER MANUFACTURER }`
- [ ] **인덱스 설계**:
  - `@@index([ingredient_id])` — 성분 → 뱃지 조회(F2-RH-001 핵심 경로)
  - `@@index([badge_type])` — 관리자 백오피스 필터 (ADM 계열 태스크에서 사용)
- [ ] **유니크 제약** — 동일 성분에 대해 동일 `evidence_source` 출처의 뱃지 중복 부여 방지: `@@unique([ingredient_id, evidence_source])`
- [ ] **Reverse Relation** — `model Ingredient`에 `badges Badge[]` 추가
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_badge_table --create-only` → SQL 리뷰 → 적용
- [ ] **Zod 스키마** — `src/lib/schemas/badge.ts`에 `CreateBadgeSchema`: `evidence_url`은 `.url()`, `badge_label`은 1~500자, `evidence_source=MFDS`일 때 `evidence_url`이 `mfds.go.kr` 도메인 포함 검증
- [ ] **금지 표현 검사 훅** — `src/lib/badge/prohibited-expression-guard.ts` 스켈레톤 작성: `containsProhibitedExpression(label: string): boolean`. 실제 룰셋은 NFR-SEC-003 태스크에서 주입, 본 태스크는 인터페이스만 정의
- [ ] **저장 가드 (Application Layer)** — `saveBadge()` 서비스 헬퍼에서 `prohibited_check_passed=false`이면 INSERT 거부하는 가드 작성
- [ ] **Unit Test 작성** — 6건 이상: Enum 범위, evidence_url https 검증, 금지 표현 가드, FK Cascade, 중복 출처 차단, BadgeType별 조회

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: APPROVED 뱃지 정상 생성**
- **Given**: INGREDIENT `I1` (standard_name=`Cholecalciferol`, mfds_status=`REGISTERED`)이 존재하는 상태
- **When**: `{ ingredient_id: "I1", badge_type: "APPROVED", badge_label: "칼슘과 인이 체내에서 흡수 및 이용되는데 필요", evidence_source: "MFDS", evidence_url: "https://www.foodsafetykorea.go.kr/...", prohibited_check_passed: true }`로 저장한다
- **Then**: 레코드가 저장되고, `ingredient.badges` 역조회 시 해당 뱃지가 조회된다.

**Scenario 2: 금지 표현 포함 뱃지 저장 차단 (REQ-FUNC-012)**
- **Given**: `badge_label: "고혈압 예방·치료에 효과적"` (금지 표현 포함)
- **When**: 서비스 레이어 `saveBadge()`를 호출한다
- **Then**: `prohibited_check_passed`가 `false`로 유지되고, 저장이 차단되며 `ProhibitedExpressionError`가 던져진다.

**Scenario 3: 공전 URL 도메인 검증**
- **Given**: `evidence_source: "MFDS"`, `evidence_url: "https://example.com/fake"` 입력
- **When**: `CreateBadgeSchema`로 파싱한다
- **Then**: ZodError가 발생하며 "MFDS 출처는 foodsafetykorea.go.kr 또는 mfds.go.kr 도메인이어야 함" 메시지가 포함된다.

**Scenario 4: 동일 출처 중복 뱃지 차단**
- **Given**: INGREDIENT `I1`에 대해 `evidence_source: "MFDS"` 뱃지가 이미 존재
- **When**: 동일 성분·동일 출처의 새 뱃지 생성 시도
- **Then**: `P2002` 유니크 제약 위반 에러가 발생. (재판정 시 기존 레코드를 update/upsert로 처리해야 함을 강제)

**Scenario 5: NOT_APPROVED 뱃지 및 근거 부재 처리**
- **Given**: INGREDIENT `I2` (mfds_status=`NOT_REGISTERED` 원료)
- **When**: 뱃지 판정 로직이 `NOT_APPROVED` 결정
- **Then**: `evidence_url`은 식약처 "미등재 안내" 공식 페이지 URL을 넣거나, 본 태스크에서는 `NOT_APPROVED`의 경우 별도 파이프라인으로 처리됨을 명시(회색 라벨은 BADGE 테이블이 아닌 애플리케이션 레이어 — F2-C-004).

**Scenario 6: FK Cascade 동작**
- **Given**: INGREDIENT 1건과 연결된 BADGE 2건이 존재
- **When**: INGREDIENT 삭제
- **Then**: BADGE 2건이 자동 삭제된다.

## :gear: Technical & Non-Functional Constraints
- **법률 준수 (CON-2, REQ-FUNC-012)**: `badge_label`에 질병 예방·치료 표현이 저장되면 사업 존속 리스크. 저장 레이어에서 **이중 방어**:
  1. Zod 레벨 정규식 차단
  2. `prohibited_check_passed=true` 플래그 없이는 INSERT 거부하는 DB 트리거 또는 애플리케이션 가드
- **공전 원문 1:1 매칭 (REQ-FUNC-011)**: `badge_label`은 **가공·요약 금지**. 식약처 공전 원문 그대로 저장. 불일치율 < 0.5% 목표(TEST-F2-002에서 검증).
- **CQRS 분리 (P2)**: 본 태스크는 **저장·검증 스키마·가드 인터페이스**에 한정. 판정 알고리즘·공전 조회·번역은 F2-Q-002, F2-C-001~003에서 담당.
- **캐싱 (REQ-NF-002)**: 뱃지 로드 p95 ≤ 1,000ms는 Next.js Cache TTL 24h(F2-C-005)로 충족. BADGE 테이블 자체 쿼리는 5건 이내 레코드 조회이므로 인덱스만으로 충분.
- **근거 출처 (REQ-FUNC-015)**: `evidence_url`은 NOT NULL 필수 (1탭 출처 확인 보장).
- **Phase 2 확장 여지**: 논문 DOI 다수 첨부 요구 시 `badge_evidences` 조인 테이블로 정규화 가능. 본 태스크는 단일 출처로 단순화.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] 2개 Enum (`BadgeType`, `EvidenceSource`)이 정의되고 `prisma validate` 통과하는가?
- [ ] `prohibited_check_passed` 가드가 스키마 레벨 `@default(false)` + 애플리케이션 레벨 `saveBadge()` 가드로 **이중 적용**되는가?
- [ ] `evidence_url` HTTPS + 출처별 도메인 검증이 Zod 스키마에 반영되었는가?
- [ ] 유니크 제약(`ingredient_id + evidence_source`)이 작동하는가?
- [ ] 단위 테스트 6건 이상이 통과하는가?
- [ ] ERD(SRS §6.2.8) 및 Class Diagram(§6.2.9)과 필드·관계가 정합하는가?
- [ ] 마이그레이션 SQL이 리뷰되고 Cascade 동작이 검증되는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-003 (INGREDIENT FK)
- **Blocks**: 
  - #DATA-010 (ERD 통합 검증)
  - #F2-C-001 (뱃지 판정 로직)
  - #F2-C-005 (뱃지 캐싱)
  - #F2-RH-001 (Badge Route Handler)
  - #F4-Q-001 (출처 조회)
  - #API-002 (Badge DTO)
  - #NFR-SEC-003 (금지 표현 룰셋) — 상호 참조
  - #TEST-F2-002 (뱃지-공전 매칭 테스트)

## :bookmark_tabs: Notes
- SRS §6.2.4 원문에 없는 `prohibited_check_passed`와 `decision_reason`은 본 태스크에서 운영 요구사항(REQ-FUNC-012 금지 표현 0건 보장)을 **데이터 레벨에서 강제**하기 위해 도입한다. ERD 검증(DATA-010)에서 반영.
- `NOT_APPROVED`와 "식약처 미등재 원료"(REQ-FUNC-014 회색 라벨)는 **다른 개념**이다:
  - `NOT_APPROVED` = 공전 등재되었으나 기능성 인정 실패
  - "미등재 원료" = 공전 자체에 없음 → 뱃지 **미부여**, BADGE 테이블에 레코드 **없음**
- 룰셋 관리는 NFR-SEC-003 태스크에서 별도로 진행하며, 본 태스크는 가드 **인터페이스만** 정의한다.
