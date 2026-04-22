---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-012: REWARD_LEDGER + USER_BADGE 스키마 정의 및 마이그레이션 (F4-C-005 보상 지급 선행)"
labels: 'feature, data, epic:E-DATA, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-012] REWARD_LEDGER + USER_BADGE 스키마 정의
- 목적: REQ-FUNC-026("오류 수정 완료 시 리워드(포인트/배지) 지급")를 **데이터 모델 레벨에서 지원**하기 위한 전용 테이블 2종을 추가한다. USER 테이블은 최소 수집 원칙(CON-4, DATA-009)에 따라 보상 필드를 직접 추가할 수 없으므로, 별도 장부(Ledger) 테이블로 분리하여 **이중 지급 방지(DB 유니크 제약)**·**감사 이력 보존**·**포인트 잔액의 SUM 계산**을 보장한다. 본 태스크는 F4-C-005(보상 지급 로직)의 선행 의존이며, DATA-010 ERD 통합 검증에도 포함된다.
- Epic / Phase: E-DATA / Phase 1 (데이터·스키마)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-026 (리워드 지급)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 UC-11`](../05_SRS_v1.md) — 오류 제보 보상 수령
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6 Reward Module`](../05_SRS_v1.md) — `grantReward(userId, rewardType)`
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — Reward 서비스 → DB 기록 + 알림
- SRS 제약: [`/05_SRS_v1.md#1.2.3 CON-4`](../05_SRS_v1.md) + [`4.2.3 REQ-NF-015`](../05_SRS_v1.md) — 최소 수집 원칙(USER 테이블 확장 금지)
- 관련 태스크: [`/TASKS/DATA-009_user_schema.md`](./DATA-009_user_schema.md), [`/TASKS/DATA-007_error_report_schema.md`](./DATA-007_error_report_schema.md), [`/TASKS/DATA-010_erd_integration_migration.md`](./DATA-010_erd_integration_migration.md)
- 선행 태스크: **DATA-001** (Prisma 초기화), **DATA-009** (USER PK 참조), **DATA-007** (ERROR_REPORT PK 참조)
- 후행 태스크: **F4-C-005** (보상 지급 로직), **DATA-010** (ERD 통합 검증에 포함), TEST-F4-005 (생명주기 E2E)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.1 E-DATA`](./06_TASK_LIST_v1.md) (DATA-010 이전 슬롯)

## :white_check_mark: Task Breakdown (실행 계획)

- [ ] **REWARD_LEDGER 모델 작성** — `prisma/schema.prisma`
  ```prisma
  model RewardLedger {
    id              String         @id @default(cuid())
    user_id         String
    source_kind     RewardSource
    source_ref_id   String         // report_id 등 외부 엔티티 FK (문자열로 일반화)
    points_delta    Int            // + 적립 / - 차감 (Phase 1은 + 만)
    reason_code     RewardReason   // ENUM: REPORT_RESOLVED | MANUAL_GRANT | ADJUSTMENT
    memo            String?        @db.VarChar(500)
    granted_at      DateTime       @default(now())
    granted_by      String?        // 관리자 수동 지급 시 admin user_id

    user            User           @relation(fields: [user_id], references: [user_id])

    @@unique([source_kind, source_ref_id], name: "uq_reward_source")
    @@index([user_id, granted_at])
    @@index([source_kind, source_ref_id])
  }

  enum RewardSource {
    ERROR_REPORT
    REGISTRATION_REQUEST  // Phase 2 확장 여지
    MANUAL
  }

  enum RewardReason {
    REPORT_RESOLVED
    MANUAL_GRANT
    ADJUSTMENT
  }
  ```
- [ ] **USER_BADGE 모델 작성** — `prisma/schema.prisma`
  ```prisma
  model UserBadge {
    id              String         @id @default(cuid())
    user_id         String
    badge_code      BadgeCode
    granted_at      DateTime       @default(now())
    granted_reason  String?        @db.VarChar(200)

    user            User           @relation(fields: [user_id], references: [user_id])

    @@unique([user_id, badge_code], name: "uq_user_badge")
    @@index([badge_code])
  }

  enum BadgeCode {
    DATA_GUARDIAN       // 1회 RESOLVED
    INFO_PROTECTOR      // 5회 RESOLVED
    TRUTH_CHAMPION      // 10회 RESOLVED
  }
  ```
- [ ] **USER 모델에 역참조 추가** — `DATA-009` 스키마에 **필드만 추가**(최소 수집 원칙 위배 아님 — 역참조는 실 컬럼 아님)
  ```prisma
  model User {
    // ...기존 필드 유지...
    reward_ledger   RewardLedger[]
    badges          UserBadge[]
  }
  ```
  - DATA-009의 "금지 필드 리스트(name, phone, ...)"에는 **영향 없음**. 역참조는 Prisma 런타임 객체 관계이며 DB 컬럼이 아니므로 CON-4를 위배하지 않는다.
- [ ] **포인트 잔액 계산 뷰/헬퍼** — `src/server/trust/reward-balance.ts`
  - 함수: `getUserRewardBalance(userId: string): Promise<{ points: number; badges: BadgeCode[] }>`
  - 구현: `SELECT SUM(points_delta) WHERE user_id = ?` + `SELECT badge_code WHERE user_id = ?`
  - **컬럼 캐시 금지**: USER 테이블에 `reward_points: Int` 같은 **denormalized 필드 추가 금지**. 잔액은 항상 Ledger SUM으로 계산.
  - **성능**: 1 user당 평균 ~10건 Ledger 예상, SUM 쿼리 p95 ≤ 20ms. Ledger가 수백 건으로 늘면 materialized view(Phase 2)로 전환.
- [ ] **멱등성 보장 — DB 유니크 제약**
  - `@@unique([source_kind, source_ref_id])` — 동일 report_id에 대한 중복 보상 **DB 레벨에서 차단**.
  - 애플리케이션 로직이 재시도하더라도 두 번째 INSERT는 Prisma `P2002` 에러 → F4-C-005에서 `REWARD_ALREADY_GRANTED`로 매핑.
- [ ] **FK on-delete 정책**
  - `RewardLedger.user_id` ON DELETE **RESTRICT** (USER soft-delete 이후에도 감사 이력 보존, 하드 삭제 방지)
  - `UserBadge.user_id` ON DELETE **CASCADE** (배지는 개인 성취, 사용자 삭제 시 함께 삭제)
  - 실 USER 삭제(30일 경과 배치)는 DATA-009의 soft-delete 30일 후에 cascade 포함하는 별도 cleanup job 실행
- [ ] **감사 필드**
  - `granted_by: String?` — 관리자 수동 지급 시 admin user_id 기록
  - `memo: String?` — ADJUSTMENT/MANUAL_GRANT 시 사유 기록 의무화(애플리케이션에서 강제)
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_reward_system --create-only`
  - SQL 리뷰 체크리스트:
    - [ ] 2개 테이블 생성 DDL
    - [ ] 2개 FK 제약
    - [ ] 2개 유니크 제약(`uq_reward_source`, `uq_user_badge`)
    - [ ] 3개 인덱스
    - [ ] 3개 Enum(`RewardSource`, `RewardReason`, `BadgeCode`)
  - SQL 리뷰 후 적용
- [ ] **Zod 검증 스키마** — `src/lib/schemas/reward.ts`
  - `RewardLedgerEntrySchema`: `source_kind`, `source_ref_id`, `points_delta`(양수만), `reason_code`
  - `UserBadgeSchema`: `badge_code`(Enum)
- [ ] **CON-4 최소 수집 가드 확장** — `src/lib/user/minimum-collection-guard.ts`(DATA-009)에 **REWARD_LEDGER/USER_BADGE 허용 필드 화이트리스트 추가**
  - REWARD_LEDGER 허용: `id, user_id, source_kind, source_ref_id, points_delta, reason_code, memo, granted_at, granted_by`
  - USER_BADGE 허용: `id, user_id, badge_code, granted_at, granted_reason`
  - 금지 필드 주석: "**DO NOT ADD**: ip_address, device_id, geolocation, external_account_id"
- [ ] **Unit Test 작성** — `tests/data/reward-schema.test.ts` **10건 이상**
  - CRUD 기본(insert/select) 2건
  - 멱등성: 동일 `(source_kind, source_ref_id)` INSERT 2회 → 두 번째 P2002 1건
  - FK 제약: 존재하지 않는 user_id로 INSERT 시 에러 1건
  - Enum 검증: 잘못된 `source_kind` 거부 1건
  - `getUserRewardBalance` SUM 계산 2건 (positive / empty)
  - 배지 유니크: 동일 `(user_id, badge_code)` 2회 INSERT 거부 1건
  - soft-delete user의 ledger 조회 가능 1건
  - 음수 points_delta 검증(Phase 1 Zod 차단) 1건
- [ ] **ERD 문서 업데이트** — `docs/erd.md` 및 SRS 보충 자료(Phase 1 확정된 보상 모델 도해)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 보상 기록 정상 적립**
- **Given**: USER P1, ERROR_REPORT R1 (RESOLVED 상태)
- **When**: `prisma.rewardLedger.create({ data: { user_id: "P1", source_kind: "ERROR_REPORT", source_ref_id: "R1", points_delta: 100, reason_code: "REPORT_RESOLVED" } })`
- **Then**: 신규 레코드가 생성되고 `granted_at`이 자동 채워진다.

**Scenario 2: 멱등성 — 동일 source_ref_id 중복 INSERT 차단 (DB 레벨)**
- **Given**: Scenario 1의 레코드가 이미 존재
- **When**: 동일 `(source_kind="ERROR_REPORT", source_ref_id="R1")`로 재 INSERT
- **Then**: Prisma `P2002` 유니크 제약 위반 에러. 애플리케이션 레이어에서 `REWARD_ALREADY_GRANTED`로 매핑 가능.

**Scenario 3: 포인트 잔액 계산 (SUM 기반)**
- **Given**: USER P1에 100P, 100P, 100P 3건의 Ledger 레코드
- **When**: `getUserRewardBalance("P1")` 호출
- **Then**: `{ points: 300, badges: [...] }` 반환. USER 테이블에 `reward_points` 컬럼은 존재하지 않는다.

**Scenario 4: 배지 유니크 — 동일 사용자가 동일 배지 중복 획득 불가**
- **Given**: P1이 `DATA_GUARDIAN` 배지 이미 보유
- **When**: 동일 `(P1, DATA_GUARDIAN)` INSERT 시도
- **Then**: P2002 에러. 애플리케이션에서 "이미 보유" 무시(silent).

**Scenario 5: FK RESTRICT — soft-delete 후 Ledger 보존**
- **Given**: P1 soft-delete(deleted_at=now()), Ledger 3건 보유
- **When**: USER 행을 하드 삭제 시도
- **Then**: FK RESTRICT로 실패. 감사 이력 보존 정책 유지.

**Scenario 6: CON-4 최소 수집 가드 확장**
- **Given**: `validateUserSchemaMinimality()` + `validateRewardLedgerMinimality()` 실행
- **When**: REWARD_LEDGER/USER_BADGE 필드 집합을 리플렉션
- **Then**: 화이트리스트 외 필드(예: `ip_address`)가 모델에 있으면 테스트 실패.

**Scenario 7: 음수 points_delta 차단 (Phase 1)**
- **Given**: `RewardLedgerEntrySchema.safeParse({ points_delta: -50, ... })`
- **When**: Zod 파싱
- **Then**: 검증 실패. Phase 1은 지급만 허용(Phase 2에서 환불/차감 정책 도입 시 완화).

**Scenario 8: 관리자 수동 지급 시 granted_by + memo 필수**
- **Given**: `reason_code="MANUAL_GRANT"`
- **When**: Zod 또는 애플리케이션 가드 검증
- **Then**: `granted_by`(admin user_id)와 `memo`(사유)가 비어있으면 거부.

**Scenario 9: 잔액 쿼리 성능**
- **Given**: P1에 Ledger 100건
- **When**: `getUserRewardBalance` 실행 × 100회 반복
- **Then**: p95 ≤ 20ms (SUM 쿼리 인덱스 `(user_id, granted_at)` 활용).

**Scenario 10: ERD 무결성 — DATA-010 통합 검증 통과**
- **Given**: DATA-010이 본 테이블을 포함하여 마이그레이션 실행
- **When**: `prisma migrate dev` 후 `prisma db pull` 역생성
- **Then**: 스키마 drift 0, Enum 3종 포함 전체 ERD가 일치.

## :gear: Technical & Non-Functional Constraints

- **CON-4 최소 수집 원칙 준수**: USER 테이블은 `reward_points` 같은 **denormalized 필드 추가 금지**. 보상은 Ledger SUM으로 계산.
- **멱등성 DB 레벨 보장**: 애플리케이션 로직이 재시도해도 이중 지급이 발생하지 않도록 `@@unique([source_kind, source_ref_id])`를 **DB 제약**으로 강제.
- **감사 이력 보존 (법률·투명성)**: soft-delete된 사용자의 Ledger는 보존. 하드 삭제 시에도 감사 목적 ledger는 별도 archive 테이블로 이관(Phase 2).
- **FK on-delete 정책**: Ledger=RESTRICT(감사), Badge=CASCADE(개인 성취 자체 삭제). 운영 정책 차이 명확화.
- **음수 차단 (Phase 1)**: Zod로 양수만 허용. Phase 2에서 환불·차감 도입 시 정책 재검토.
- **인덱스 전략**: `(user_id, granted_at)`로 잔액 계산 최적화, `(source_kind, source_ref_id)`로 멱등성 체크 최적화.
- **확장성(Phase 2)**: materialized view 또는 Redis 캐시(잔액), 포인트 교환/환급 기능, REGISTRATION_REQUEST 보상 확대.
- **Enum 확장 규칙**: `RewardSource`/`RewardReason`/`BadgeCode` 확장 시 DB 마이그레이션 필수. 기존 값 변경 금지(하위 호환).
- **Decimal vs Int**: points는 **정수**로 고정(소수점 포인트 정책 없음, 금전 환산 시 환율 이슈 방지).
- **보안**: `granted_by` 필드는 관리자 user_id만 허용. 일반 사용자는 null. Row-Level Security 또는 애플리케이션 가드.

## :checkered_flag: Definition of Done (DoD)

- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] REWARD_LEDGER / USER_BADGE 2개 모델이 Prisma 스키마에 추가되었는가?
- [ ] 3개 Enum(`RewardSource`, `RewardReason`, `BadgeCode`)이 정의되었는가?
- [ ] `@@unique([source_kind, source_ref_id])` DB 제약이 적용되었는가?
- [ ] `@@unique([user_id, badge_code])` DB 제약이 적용되었는가?
- [ ] USER 모델에 역참조(`reward_ledger`, `badges`)가 추가되었는가?
- [ ] 마이그레이션이 생성·리뷰·적용되었는가?
- [ ] `getUserRewardBalance` 헬퍼가 USER 컬럼 캐시 없이 SUM 기반으로 동작하는가?
- [ ] CON-4 가드(`minimum-collection-guard.ts`)에 REWARD_LEDGER/USER_BADGE 화이트리스트가 추가되었는가?
- [ ] Zod 스키마가 `points_delta >= 0`, `reason_code` Enum 검증을 수행하는가?
- [ ] Unit Test 10건 이상 통과?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] ERD 문서·06_TASK_LIST_v1.md에 DATA-012가 반영되었는가?

## :construction: Dependencies & Blockers

- **Depends on**:
  - #DATA-001 (Prisma 초기화)
  - #DATA-009 (USER PK 참조 + 역참조 필드 추가)
  - #DATA-007 (ERROR_REPORT PK 참조 — `source_ref_id`)
- **Blocks**:
  - #F4-C-005 (보상 지급 로직 — 본 스키마 없으면 구현 불가)
  - #DATA-010 (ERD 통합 검증 — 본 스키마 포함 필요)
  - #DATA-011 (Seed 데이터 스크립트 — Phase 1에서는 Ledger/Badge 시드 불필요하나 스키마는 존재해야 migration 통과)
  - #TEST-F4-005 (제보 생명주기 E2E — 보상 지급 검증)
  - #ADM-C-001/002 (관리자가 수동 보상 지급/조정하는 경우)

## :bookmark_tabs: Notes

- **왜 Ledger 패턴인가?** Double-entry accounting에서 차용한 **불변 거래 기록** 패턴. USER 테이블에 `reward_points` 컬럼을 두면 동시성·정합성·감사 모두 취약. Ledger는 INSERT-only로 감사 완벽, SUM으로 잔액 계산.
- **왜 reward_points 컬럼 추가를 명시적으로 거부했는가?** CON-4 최소 수집 원칙 박제(DATA-009)와 정합. Denormalization은 Phase 2 materialized view 또는 Redis 캐시로 해결.
- **source_ref_id를 String 일반화한 이유**: Phase 2에서 `REGISTRATION_REQUEST`, 캠페인 참여, 친구 추천 등 다양한 source가 붙을 때 FK 타입 다형성을 피하기 위함.
- **배지 vs 업적**: Phase 1은 "누적 RESOLVED 카운트"로 트리거되는 고정 배지 3종만. Phase 2에서 `Achievement` 모델로 일반화(예: "3일 연속 제보", "100P 달성").
- **CON-4 확장 화이트리스트**: REWARD_LEDGER/USER_BADGE에 절대 추가 금지 필드는 `ip_address, device_fingerprint, geolocation, external_account_id, phone_number`. 이는 NFR-SEC-002 검증에 포함.
- **운영 쿼리**: 전체 포인트 발행량 = `SUM(points_delta)`, 배지 발급 추이 = `COUNT BY badge_code, DATE(granted_at)`. NFR-MON-003 대시보드에 반영.
