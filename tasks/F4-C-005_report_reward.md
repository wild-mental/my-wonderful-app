---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-C-005: 제보 보상 지급 Command (포인트 Ledger + 누적 배지 + 트랜잭션 원자성)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, cqrs:command, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-C-005] 제보 보상(포인트/배지) 지급 Command
- 목적: REQ-FUNC-026("오류 수정 완료 시 리워드를 지급한다")를 구현한다. F4-C-003이 ERROR_REPORT 상태를 `RESOLVED`로 전이할 때 **동일 트랜잭션 내에서** DATA-012 REWARD_LEDGER에 포인트를 적립하고, 누적 RESOLVED 카운트에 따라 USER_BADGE를 부여한다. 이중 지급은 DB 유니크 제약으로 차단하고, 멱등성·관측성·F4-C-004 이메일 알림 연계·Mixpanel 분석 이벤트를 모두 제공한다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (CQRS Command)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-026 (리워드 지급)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 UC-11`](../05_SRS_v1.md) — 보상 수령
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6 Reward Module`](../05_SRS_v1.md) — `grantReward(userId, rewardType)`
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 검증 완료 → Ledger 기록 → 이메일 알림
- 관련 구현 태스크:
  - [`/TASKS/DATA-012_reward_ledger_schema.md`](./DATA-012_reward_ledger_schema.md) — **선행 스키마**
  - [`/TASKS/F4-C-003_report_status_lifecycle.md`](./F4-C-003_report_status_lifecycle.md) — 상태 전이 트리거
  - [`/TASKS/F4-C-004_report_email_notification.md`](./F4-C-004_report_email_notification.md) — 이메일 본문 보상 정보 포함
  - [`/TASKS/COM-C-004_affiliate_click_tracking.md`](./COM-C-004_affiliate_click_tracking.md) — Mixpanel 인프라 재사용
- 선행 태스크: **DATA-012** (REWARD_LEDGER/USER_BADGE 스키마), **F4-C-003** (RESOLVED 전이), **F4-C-004** (이메일 템플릿)
- 후행 태스크: TEST-F4-005 (생명주기 E2E), ADM-C-002 (관리자 수동 보상 조정)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)

## :memo: 보상 정책 (MVP 확정안)

> **주의**: 하기 포인트 수량·배지 기준은 본 태스크에서 제안한 **MVP 기본값**이며, **제품/기획 승인**을 받아야 한다. 승인 후 값이 변경되면 `src/lib/trust/reward-policy.ts` 상수만 수정하여 반영.

| 구분 | 트리거 | 보상 |
|---|---|---|
| 기본 포인트 | 제보 `RESOLVED` | +100P |
| 배지 1 (`DATA_GUARDIAN`) | 누적 1회 `RESOLVED` | 배지 부여 |
| 배지 2 (`INFO_PROTECTOR`) | 누적 5회 `RESOLVED` | 배지 부여 |
| 배지 3 (`TRUTH_CHAMPION`) | 누적 10회 `RESOLVED` | 배지 부여 |
| `REJECTED` 제보 | — | 보상 0 (지급 없음) |
| 관리자 수동 지급 | `ADJUSTMENT` 사유 | 가변 (감사 기록) |

- **정책 변경 프로세스**: 상수 변경 → 제품 승인 확인 → Changelog 기재 → 다음 RESOLVED부터 적용. 과거 보상은 **소급 적용 금지**(감사 일관성).
- **A/B 실험**: Phase 2에서 포인트 액수 A/B 테스트 가능(Feature Flag `REWARD_POLICY_VARIANT`).

## :white_check_mark: Task Breakdown (실행 계획)

- [ ] **보상 정책 상수 정의** — `src/lib/trust/reward-policy.ts`
  ```ts
  export const REWARD_POLICY = {
    POINTS_PER_RESOLVED_REPORT: 100,
    BADGE_THRESHOLDS: [
      { threshold: 1, code: "DATA_GUARDIAN" as const },
      { threshold: 5, code: "INFO_PROTECTOR" as const },
      { threshold: 10, code: "TRUTH_CHAMPION" as const },
    ],
    POLICY_VERSION: "v1.0",  // 변경 시 bump
  } as const;
  ```
- [ ] **보상 지급 Command** — `src/server/trust/commands/grant-reward.ts`
  - Signature: `grantReward({ tx, reportId, userId, triggeredBy }: GrantRewardInput): Promise<GrantRewardResult>`
  - **`tx: PrismaTransaction` 인자 필수** — 상위 F4-C-003의 트랜잭션 컨텍스트에서만 호출 가능.
  - 출력: `{ points_granted, total_balance, newly_awarded_badges, already_granted }`
- [ ] **트랜잭션 원자성 보장** — F4-C-003과 동일 트랜잭션
  ```ts
  await prisma.$transaction(async (tx) => {
    // F4-C-003: 상태 전이
    await tx.errorReport.update({ where: { id: reportId }, data: { status: "RESOLVED", resolved_at: new Date() } });
    // F4-C-005 (본 태스크):
    const reward = await grantReward({ tx, reportId, userId, triggeredBy: "F4-C-003" });
    // F4-C-004 트리거(트랜잭션 밖에서 비동기 — outbox 패턴)
    await tx.outbox.create({ data: { event: "REPORT_RESOLVED_WITH_REWARD", payload: { reportId, reward } } });
  });
  ```
- [ ] **F4-C-004 이메일 템플릿 확장 의존**
  - F4-C-004의 `resolved.html` 템플릿에 변수 `{{points_granted}}`, `{{total_points}}`, `{{newly_awarded_badges}}` 추가(F4-C-004 개정 필요).
  - 템플릿 본문: "이번 제보로 **{{points_granted}}P**가 적립되어 총 **{{total_points}}P**가 되었습니다. {{#if newly_awarded_badges}}축하합니다! **{{newly_awarded_badges}}** 배지를 획득했습니다.{{/if}}"
  - 배지 미획득 시 해당 섹션 자동 생략.
- [ ] **멱등성 — DB 유니크 제약 + Prisma P2002 핸들링**
  - DATA-012의 `@@unique([source_kind, source_ref_id])` 활용.
  - INSERT 시도 → P2002 캐치 → `already_granted: true` 반환(에러 throw 대신 silent).
  - 이로써 F4-C-003이 재시도되거나 중복 호출되어도 이중 적립 0.
- [ ] **배지 부여 로직**
  - 현재 누적 RESOLVED 카운트 조회: `SELECT COUNT(*) FROM error_report WHERE reporter_id = ? AND status = 'RESOLVED'`
  - `REWARD_POLICY.BADGE_THRESHOLDS` 순회하며 현재 카운트가 임계를 넘었고, USER_BADGE에 미보유 시 INSERT
  - USER_BADGE 유니크 제약(`(user_id, badge_code)`)으로 동시성 중복 방지
- [ ] **RESOLVED 전이만 트리거, REJECTED 무시**
  - Input 가드: `status === "RESOLVED"` 이외 호출은 `REWARD_NOT_ELIGIBLE` 반환(에러 아닌 정상 응답).
- [ ] **Edge Case 방어**
  - **Soft-deleted user**: `user.deleted_at !== null`이면 Ledger 기록은 보존(감사)하되, `points_delta = 0`으로 기록 + `memo: "user_deleted_at_grant_time"`. 이메일 발송 생략.
  - **존재하지 않는 user**: FK 제약 위반으로 P2003 → `REWARD_USER_NOT_FOUND` 매핑.
  - **배지 동시 승급**: 한 사용자가 한 트랜잭션에서 5회→10회로 건너뛴다면 2~3개 배지를 일괄 부여. `newly_awarded_badges` 배열에 모두 포함.
- [ ] **Mixpanel 분석 이벤트** — COM-C-004 인프라 재사용
  - `reward_granted`(user_id hash, report_id, points_delta, total_balance, newly_awarded_badges, policy_version)
  - `badge_awarded`(user_id hash, badge_code, total_resolved_count)
  - fire-and-forget, 트랜잭션 외부에서 발송(실패해도 지급 롤백 금지)
- [ ] **구조화 로깅**
  - `event="trust.reward.granted"`, `report_id`, `user_id_hash`, `points_delta`, `newly_awarded_badges`, `duration_ms`
  - 중복 지급 차단 시: `event="trust.reward.already_granted"` + `level="info"`
  - P2003/에러 시: `level="error"` + Sentry breadcrumb
- [ ] **관리자 수동 조정 API (ADM-C-002 연계)**
  - 별도 Server Action `adjustReward({ userId, pointsDelta, memo, grantedBy })`
  - `source_kind: "MANUAL"`, `reason_code: "ADJUSTMENT"`, `memo` 필수(400자 이내), `granted_by: admin.user_id` 필수
  - 관리자 RBAC 검증(COM-C-002의 `role: ADMIN` 확인)
- [ ] **Feature Flag** — `REWARD_ENABLED`(기본 true)
  - 장애·법률 이슈 시 `false`로 전환하면 지급 bypass(Ledger 기록 없음, 경고 로그만)
  - F4-C-003 상태 전이는 정상 수행(보상만 차단)
- [ ] **Unit Test 작성** — `tests/server/trust/commands/grant-reward.test.ts` **15건 이상**
  - 정상 지급: RESOLVED → 100P + DATA_GUARDIAN 배지 1건
  - 누적 5회: INFO_PROTECTOR 추가 부여 1건
  - 누적 10회: TRUTH_CHAMPION 추가 부여 1건
  - 누적 1→5회 점프: 2개 배지 일괄 부여 1건
  - 멱등성: 동일 report_id 2회 호출 → 두 번째 `already_granted: true` 1건
  - REJECTED 상태: `REWARD_NOT_ELIGIBLE` 1건
  - soft-deleted user: `points_delta=0`, memo 기록, 이메일 생략 1건
  - 존재하지 않는 user: `REWARD_USER_NOT_FOUND` 1건
  - Feature Flag off: bypass 1건
  - 관리자 수동 지급: `MANUAL_GRANT` 정상 기록 1건
  - 관리자 수동 지급 — memo 누락 거부 1건
  - 잔액 계산 정확성(SUM) 1건
  - Mixpanel 이벤트 발송 실패해도 지급 성공 1건
  - 배지 유니크 제약 — 동시 요청 2건 중 1건만 INSERT 1건
  - 정책 버전(`policy_version`) 로그 기록 1건
- [ ] **Integration Test** — `tests/e2e/reward-lifecycle.test.ts` 3건
  - F4-C-003 상태 전이 → F4-C-005 지급 → F4-C-004 이메일 발송 E2E 1건
  - 트랜잭션 롤백: F4-C-005가 실패하면 F4-C-003 상태 전이도 롤백 1건
  - Outbox 패턴 — 트랜잭션 커밋 후 이메일 작업자 pickup 1건

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-026 — 정상 지급**
- **Given**: 사용자 U1의 ERROR_REPORT R1이 RESOLVED 전이
- **When**: `grantReward({ tx, reportId: R1, userId: U1 })` 호출
- **Then**: REWARD_LEDGER에 `points_delta=100, source_kind=ERROR_REPORT, source_ref_id=R1` 1건 INSERT. `newly_awarded_badges=["DATA_GUARDIAN"]`.

**Scenario 2: 누적 5회 달성 시 배지 승급**
- **Given**: U1이 이미 4회 RESOLVED(DATA_GUARDIAN 보유) + R5가 RESOLVED
- **When**: grantReward 호출
- **Then**: `INFO_PROTECTOR` 배지 추가 INSERT. `newly_awarded_badges=["INFO_PROTECTOR"]`.

**Scenario 3: 배지 점프 — 1→10 동시 달성 시**
- **Given**: 마이그레이션·관리자 소급 조치 등으로 카운트가 한 번에 10으로 점프
- **When**: grantReward 호출
- **Then**: DATA_GUARDIAN + INFO_PROTECTOR + TRUTH_CHAMPION 3개 배지 모두 INSERT. `newly_awarded_badges` 배열 길이 3.

**Scenario 4: 멱등성 — 동일 report_id 재호출 차단**
- **Given**: R1에 대해 이미 Ledger 기록 존재
- **When**: `grantReward({ reportId: R1, ... })` 재호출
- **Then**: Prisma P2002 캐치 → `already_granted: true` 반환. 새 Ledger/Badge INSERT 없음.

**Scenario 5: REJECTED 제보 — 지급 미수행**
- **Given**: ERROR_REPORT R2가 REJECTED 전이
- **When**: (방어적으로) grantReward 호출
- **Then**: `REWARD_NOT_ELIGIBLE` 반환. Ledger INSERT 0건.

**Scenario 6: 트랜잭션 롤백**
- **Given**: F4-C-003이 상태 전이 후 F4-C-005 grantReward 내부 에러 발생
- **When**: 트랜잭션 롤백
- **Then**: ERROR_REPORT.status가 RESOLVED로 남지 않고 REVIEWING으로 복원됨. Ledger INSERT도 없음.

**Scenario 7: Soft-deleted user**
- **Given**: U1.deleted_at = 3일 전. R7 RESOLVED 전이
- **When**: grantReward 호출
- **Then**: Ledger 1건 INSERT되나 `points_delta=0, memo="user_deleted_at_grant_time"`. 이메일 발송 생략. `total_balance` 변화 없음.

**Scenario 8: 관리자 수동 지급 — memo 필수**
- **Given**: 관리자가 `adjustReward({ userId: U1, pointsDelta: 50 })` 호출(memo 누락)
- **When**: 유효성 검증
- **Then**: 400 에러 "memo is required for manual grant". Ledger 미기록.

**Scenario 9: Feature Flag off**
- **Given**: `REWARD_ENABLED=false`
- **When**: RESOLVED 전이 → grantReward 호출
- **Then**: bypass. Ledger INSERT 없음. 구조화 로그에 `event="trust.reward.bypassed"` 기록.

**Scenario 10: F4-C-004 이메일 본문 확장**
- **Given**: grantReward 성공(100P, DATA_GUARDIAN)
- **When**: F4-C-004 이메일 전송(Outbox pickup)
- **Then**: 본문에 "100P 적립, 총 100P, DATA_GUARDIAN 배지 획득" 문구 포함.

**Scenario 11: Mixpanel 실패 → 지급 유지**
- **Given**: Mixpanel API 5xx
- **When**: grantReward 호출
- **Then**: Ledger/Badge INSERT는 커밋됨. Mixpanel 실패는 silent 로그만. 사용자 보상 누락 0.

**Scenario 12: 잔액 조회 정확성**
- **Given**: U1이 3회 RESOLVED 완료(각 100P)
- **When**: `getUserRewardBalance("U1")` 호출
- **Then**: `{ points: 300, badges: ["DATA_GUARDIAN"] }` 반환. (배지는 임계 5 미만이므로 1개)

## :gear: Technical & Non-Functional Constraints

- **트랜잭션 원자성**: F4-C-003과 동일 Prisma 트랜잭션 내 실행. 부분 실패 시 전체 롤백.
- **Outbox 패턴**: 이메일/Mixpanel 등 외부 I/O는 **트랜잭션 커밋 후** 별도 워커가 pickup. 트랜잭션 내부에서 외부 API 호출 금지(rollback 시 이메일 오발송 방지).
- **멱등성 (DB 레벨)**: DATA-012의 `@@unique([source_kind, source_ref_id])` 제약이 이중 지급을 물리적으로 차단. 애플리케이션 체크만 의존 금지.
- **정책 상수 분리**: 포인트·배지 임계는 `reward-policy.ts` 상수로 고정. 직접 수치 매직 넘버 금지. `POLICY_VERSION` 로그에 기록하여 정책 변경 이력 추적.
- **관측성**: 구조화 로그 + Mixpanel 이벤트 + Sentry breadcrumb 3중. NFR-MON-003 대시보드에 포인트 발행량·배지 발급 추이 반영.
- **REQ-NF-015 PII 최소화**: Mixpanel 이벤트에 `user_id` 원본 미전송. `user_id_hash`(sha256+salt) 사용.
- **Feature Flag (`REWARD_ENABLED`)**: 장애/법률/재무 이슈 시 즉시 bypass 가능. 상태 전이(F4-C-003)는 영향받지 않음.
- **REJECTED 명시적 거부**: 방어적 호출 허용하되 `REWARD_NOT_ELIGIBLE` 반환. 실수로 보상되지 않도록 이중 가드.
- **CON-4 준수**: USER 테이블에 `reward_points` 컬럼 추가 금지(DATA-012 SUM 방식 유지).
- **Policy Version 로그**: 정책 변경(예: 100P → 150P) 시점을 Ledger `memo` 또는 별도 로그로 보존. 과거 지급 소급 금지.

## :checkered_flag: Definition of Done (DoD)

- [ ] 모든 Acceptance Criteria (Scenario 1~12)를 충족하는가?
- [ ] DATA-012 스키마를 기반으로 `grantReward` Command가 구현되었는가?
- [ ] Prisma 트랜잭션을 F4-C-003과 공유하도록 `tx` 인자를 받는가?
- [ ] 멱등성이 **DB 유니크 제약**으로 보장되는가?
- [ ] 누적 카운트 기반 배지 부여가 배지 점프 케이스까지 처리하는가?
- [ ] REJECTED / soft-deleted / 존재하지 않는 user 3개 엣지 케이스가 모두 방어되는가?
- [ ] F4-C-004 이메일 템플릿에 보상 정보 변수가 포함되도록 조정되었는가?
- [ ] `REWARD_ENABLED` Feature Flag가 동작하는가?
- [ ] 관리자 수동 지급(`adjustReward`) API가 RBAC + memo 필수 검증을 수행하는가?
- [ ] Mixpanel `reward_granted`, `badge_awarded` 이벤트가 fire-and-forget으로 발송되는가?
- [ ] 구조화 로그 `trust.reward.*` 이벤트가 기록되는가?
- [ ] Outbox 패턴으로 외부 I/O가 트랜잭션 외부에서 실행되는가?
- [ ] Unit Test 15건 + Integration Test 3건이 모두 통과하는가?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?

## :construction: Dependencies & Blockers

- **Depends on**:
  - **#DATA-012** (REWARD_LEDGER/USER_BADGE 스키마 — 필수 선행)
  - **#F4-C-003** (상태 전이 트리거 + 트랜잭션 컨텍스트 제공)
  - **#F4-C-004** (이메일 템플릿 확장 협업)
  - **#DATA-009** (USER + soft-delete 정책)
  - **#COM-C-004** (Mixpanel 인프라 재사용)
  - **#COM-C-002** (관리자 RBAC — 수동 지급)
- **Blocks**:
  - **#TEST-F4-005** (제보 전체 생명주기 E2E — 보상 지급 검증)
  - **#ADM-C-002** (관리자 보상 조정 대시보드)
  - **#NFR-MON-003** (포인트·배지 대시보드 항목)

## :bookmark_tabs: Notes

- **왜 Ledger에 trigger 자동 작성이 아닌 Command로?** DB 트리거는 관찰성·테스트·A/B 실험이 어렵다. 애플리케이션 레이어 Command로 유지하되 멱등성을 DB 제약으로 보강하는 **hybrid 모델**이 운영 친화적.
- **정책 변경 시 주의**: 상수 변경은 다음 RESOLVED부터 적용되고, 과거 보상은 건드리지 않는다. 소급 조정이 필요하면 `adjustReward` 관리자 API를 별도 사용.
- **배지 점프(Scenario 3)**: 시드 데이터 입력, 관리자 소급 조치, 대량 제보 일괄 승인 등에서 발생 가능. 각 임계치를 한 번에 복수 통과해도 누락 없이 모두 부여하도록 루프 처리.
- **soft-deleted user**: GDPR/개인정보 보호 원칙에 따라 탈퇴자에게 보상 통지·지급 금지. 그러나 감사 이력(Ledger)은 0P로 기록하여 "처리 시도했음" 흔적은 남김.
- **Phase 2 확장 여지**:
  - 포인트 교환 기능(기프티콘, 프로모션 쿠폰)
  - 포인트 차감(환불, 정책 위반)
  - Achievement 시스템(배지를 일반화)
  - 리더보드(상위 제보자 순위, k-anonymity 고려)
  - 보상 정책 A/B 테스트(`REWARD_POLICY_VARIANT` Feature Flag)
- **법률 고려**: 포인트는 "가상 성과 지표"로 통지하며 화폐 교환 권리를 약속하지 않는다. Phase 2 현금성 전환 시 전자금융거래법·선불 전자지급 수단 규제 검토 필요.
