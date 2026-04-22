---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-C-001: 뱃지 판정 로직 (APPROVED/CAUTION/NOT_APPROVED 분류 및 공전 원문 매핑)"
labels: 'feature, backend, epic:E-F2, priority:critical, phase:2, cqrs:command, legal:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-C-001] 뱃지 판정 Command 로직
- 목적: 성분 목록(F2-Q-001)과 식약처 공전 데이터(F2-Q-002)를 입력으로 받아, 각 성분에 대해 **APPROVED / CAUTION / NOT_APPROVED** 중 하나의 뱃지를 부여한다. 뱃지 텍스트는 반드시 식약처 건강기능식품공전 원문과 1:1 매칭되어야 하며(REQ-FUNC-011), 금지 표현이 포함되면 판정이 즉시 거부된다(CON-2). 근거 출처(§6.2.4 `evidence_source`, `evidence_url`)를 포함한 `Badge` 레코드를 생성한다.
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층)
- 복잡도: XL

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-011`](../05_SRS_v1.md) — 공전 원문 1:1 매칭, 불일치율 < 0.5%, p95 ≤ 1초
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-012`](../05_SRS_v1.md) — 질병 예방·치료 표현 절대 금지
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-015`](../05_SRS_v1.md) — 근거 출처 1탭 도달
- SRS 문서 (제약): [`/05_SRS_v1.md#1.2.3 CON-2`](../05_SRS_v1.md) — 법률·규제 리스크 R2
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.4 BADGE`](../05_SRS_v1.md)
- SRS 문서 (시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — BadgeAPI 판정 흐름
- 선행 태스크 명세: [`F2-Q-001_ingredient_list_query.md`](./F2-Q-001_ingredient_list_query.md), [`F2-Q-002_mfds_functional_ingredient_query.md`](./F2-Q-002_mfds_functional_ingredient_query.md), [`DATA-005_badge_schema.md`](./DATA-005_badge_schema.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F2-Q-001, F2-Q-002, F2-C-002** (금지표현 검증), **DATA-005** (BADGE 스키마)
- 후행 태스크: F2-C-004 (회색 라벨), F2-C-005 (캐싱), F2-RH-001 (Route Handler 조립)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **판정 함수 `decideBadge()` 작성** — `src/server/f2/commands/decide-badge.ts`:
  - Signature: `(input: BadgeDecisionInput) => Promise<BadgeDecisionResult>`
  - Input 타입 `BadgeDecisionInput`:
    - `ingredient: IngredientView` (F2-Q-001 결과)
    - `mfdsResolution: MfdsResolution` (F2-Q-002 결과)
    - `dosageMg?: number` — 제품의 1일 섭취량 대비 기준량 비교용 (옵션)
  - Output 타입 `BadgeDecisionResult`:
    - `badgeType: BadgeType` — APPROVED / CAUTION / NOT_APPROVED
    - `badgeLabel: string` — 공전 원문
    - `evidenceSource: EvidenceSource` — MFDS / PAPER / MANUFACTURER
    - `evidenceUrl: string`
    - `decisionReason: string` — 판정 사유 메타데이터
    - `prohibitedCheckPassed: boolean` — 금지표현 검증 통과 플래그
- [ ] **판정 규칙 구현** (우선순위 순서 엄수):
  1. **UNKNOWN 입력 방어**: `mfdsResolution.status === "UNKNOWN"` → 예외 던지지 않고 `null` 반환 (F2-C-004의 회색 라벨 경로로 인계)
  2. **NOT_REGISTERED 분기**: `mfdsResolution.status === "NOT_REGISTERED"` → `null` 반환 (회색 라벨 처리)
  3. **APPROVED 분기**: REGISTERED 이면서 다음 모두 충족 시
     - 제품의 `amount_per_serving`이 공전 권장 `dailyIntake` 범위 내 (±20% 허용)
     - `mfdsResolution.claim`이 존재
     - `badgeLabel`에 대해 F2-C-002 금지 표현 검증 통과
  4. **CAUTION 분기**: REGISTERED 이지만 다음 중 하나
     - 함량이 권장 범위 -30%~+50% 밖
     - `mfdsResolution.cautions`에 "임산부·수유부 섭취 시 의사 상담 필요" 등 주의사항 존재
     - 함량 정보 미확보 (`amount_per_serving=0` 또는 unit 불일치)
  5. **NOT_APPROVED 분기**: 공전 원문에 "기능성 인정되지 않음" 명시된 원료 (예: 특정 허브)
- [ ] **금지 표현 검증 통합** — `src/server/f2/commands/decide-badge.ts` 내:
  - `await validateProhibitedExpressions(candidateLabel)` 호출 (F2-C-002 재사용)
  - 검증 실패 시 `ProhibitedExpressionError` 던지고, 해당 성분은 `badgeType=NOT_APPROVED`로 강등 + `decisionReason="PROHIBITED_EXPRESSION_DETECTED"`
  - **이중 방어**: `prohibitedCheckPassed=false`면 DB 저장 단계(DATA-005의 application guard)에서 한 번 더 차단
- [ ] **근거 URL 매핑** — `src/server/f2/commands/resolve-evidence-url.ts`:
  - MFDS 공전 URL 포맷: `https://www.mfds.go.kr/brd/m_206/view.do?seq={ingredient_id}` (실제 포맷은 PoC 시 확정)
  - 논문 DOI: Phase 2 확장, MVP에선 MFDS 출처만 지원
  - 제조사 라벨: `LABEL_ARCHIVE.image_url` 참조 (F4 도메인)
- [ ] **Batch 판정 함수** — `decideBadgesForProduct()`:
  - Signature: `(productId: string) => Promise<BadgeDecisionResult[]>`
  - F2-Q-001 + F2-Q-002 Batch를 순차 호출해 제품 전체 성분의 뱃지를 단일 트랜잭션으로 판정
  - 결과 중 `null`(UNKNOWN/NOT_REGISTERED)은 `gray_label` 목록으로 별도 반환 (F2-C-004와 연계)
  - 트랜잭션: `prisma.$transaction`으로 BADGE upsert + INGREDIENT.mfds_status 동기화를 원자 처리
- [ ] **BADGE 레코드 영속화** — `src/server/f2/commands/persist-badge.ts`:
  - `saveBadge(result: BadgeDecisionResult, ingredientId: string)` 함수
  - **DATA-005 guard**: `prohibited_check_passed=false`이면 INSERT 거부 (이중 방어 2차 레이어)
  - Upsert 키: `@@unique([ingredient_id, evidence_source])` (DATA-005 정의)
  - 동일 근거로 기존 뱃지 존재 시 `updated_at` 갱신 + 변경 이력 로깅 (`badge.audit_log.ts`)
- [ ] **판정 사유 로깅** — 구조화 로그:
  - `event="badge.decide"`, `ingredient_id`, `badge_type`, `decision_reason`, `evidence_source`, `prohibited_passed`
  - 판정 실패 시 `level="error"`, `stack_trace` 포함
- [ ] **Performance Guard** — 판정 함수는 순수 함수(side-effect 없이 I/O 제외). 동일 입력에 대해 결과가 결정적(deterministic)이어야 함. 랜덤·시간 기반 분기 금지.
- [ ] **Unit Test 작성** — `tests/server/f2/commands/decide-badge.test.ts` 15건 이상:
  - APPROVED/CAUTION/NOT_APPROVED/UNKNOWN 각 분기 검증
  - 금지 표현 검출 → 강등 케이스 (5건)
  - 공전 원문 1:1 매칭 검증 (3건, 원문과 1글자라도 다르면 실패)
  - 권장 섭취량 ±20% 경계 테스트 (3건)
- [ ] **Integration Test** — `tests/integration/badge-decision.test.ts` 5건:
  - 실제 DB + Mock MFDS Adapter로 엔드투엔드 판정 시나리오
  - 제품 P1(비타민D3 1000IU) → APPROVED 뱃지 저장
  - 제품 P2(NMN) → 회색 라벨 경로로 인계(null 반환 확인)
- [ ] **불일치율 측정 테스트** — `tests/integration/badge-mfds-match.test.ts`:
  - 공전 원문 샘플 200건과 저장된 `badge_label`의 일치율 측정
  - **불일치율 < 0.5%** 요건(REQ-FUNC-011) CI 게이트로 강제

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: APPROVED 뱃지 판정 — 정상 경로**
- **Given**: INGREDIENT `Cholecalciferol` (amount=25mcg, unit=mcg), MFDS 공전에 "비타민 D의 체내 흡수를 돕습니다"로 등재, 권장 일일 섭취량 10~25mcg
- **When**: `decideBadge({ ingredient, mfdsResolution })` 호출
- **Then**: `{ badgeType: "APPROVED", badgeLabel: "비타민 D의 체내 흡수를 돕습니다", evidenceSource: "MFDS", prohibitedCheckPassed: true }`이 반환되고, 공전 원문과 정확히 일치한다.

**Scenario 2: CAUTION 뱃지 — 권장 함량 초과**
- **Given**: INGREDIENT `Cholecalciferol` (amount=100mcg, unit=mcg), 권장 상한 50mcg
- **When**: `decideBadge()` 호출
- **Then**: `{ badgeType: "CAUTION", decisionReason: "AMOUNT_EXCEEDS_RECOMMENDED" }`, UI 레이어에서 주의 아이콘 표시.

**Scenario 3: NOT_REGISTERED → 회색 라벨 경로 (null 반환)**
- **Given**: INGREDIENT `NMN` (amount=100mg), MFDS 응답 `status=NOT_REGISTERED`
- **When**: `decideBadge()` 호출
- **Then**: `null` 반환. 호출자(F2-RH-001)가 F2-C-004 회색 라벨 생성기로 경로 변경.

**Scenario 4: 금지 표현 검출 → NOT_APPROVED 강등**
- **Given**: 공전 원문이 임의로 "암 예방에 도움"처럼 조작된 상태 (데이터 오염 시나리오)
- **When**: `decideBadge()` 호출
- **Then**: `ProhibitedExpressionError`가 내부에서 포착되어 `{ badgeType: "NOT_APPROVED", decisionReason: "PROHIBITED_EXPRESSION_DETECTED", prohibitedCheckPassed: false }` 반환. **DB 저장은 거부**되고 Sentry 경보 발생.

**Scenario 5: UNKNOWN 상태 — 폴백 경로 인계**
- **Given**: MFDS API 실패로 `mfdsResolution.status="UNKNOWN"`, 로컬 데이터 없음
- **When**: `decideBadge()` 호출
- **Then**: `null` 반환, F2-C-004 회색 라벨 생성기로 인계. 예외는 던지지 않는다.

**Scenario 6: 제품 전체 Batch 판정**
- **Given**: PRODUCT `P1`에 4개 성분 (`Cholecalciferol`=REGISTERED, `NMN`=NOT_REGISTERED, `Magnesium`=REGISTERED, `Unknown Herb`=UNKNOWN)
- **When**: `decideBadgesForProduct("P1")` 호출
- **Then**: 2개 `BadgeDecisionResult` + 2개 `gray_label` 항목 반환, `prisma.$transaction` 내에서 BADGE 2건 INSERT됨.

**Scenario 7: 공전 원문 1:1 매칭 정확도**
- **Given**: 200개 REGISTERED 원료 샘플
- **When**: 각각 `decideBadge()` 실행 후 `badgeLabel` 수집
- **Then**: 공전 원문과의 불일치 건수 ≤ 1건 (< 0.5%). 대·소문자, 공백, 괄호까지 정확히 일치.

**Scenario 8: 뱃지 렌더링 시간 p95 ≤ 1,000ms**
- **Given**: 제품당 평균 5개 성분, 캐시 Hit 기반
- **When**: 100회 `decideBadgesForProduct()` 실행
- **Then**: p95 ≤ 1,000ms 달성 (REQ-NF-002). 캐시 Miss 케이스도 외부 API 3초 타임아웃 내에 완료.

**Scenario 9: 판정 결정성 (Determinism)**
- **Given**: 동일 입력 10회 반복
- **When**: `decideBadge()` 호출
- **Then**: 모든 호출에서 동일한 `badgeType`, `badgeLabel`, `evidenceUrl`을 반환.

## :gear: Technical & Non-Functional Constraints
- **법률 준수 (CON-2, REQ-FUNC-012, R2 High Risk)**: 뱃지 텍스트는 **식약처 공전 원문 외 어떤 변형도 금지**. 판정 로직 내에서 문자열 가공(슬라이싱, 치환, 요약) 금지. 원문을 그대로 `badgeLabel`에 전달.
- **이중 방어 (DATA-005)**: 
  - 1차: 판정 로직에서 F2-C-002 검증
  - 2차: DATA-005의 application guard가 `prohibited_check_passed=false` INSERT 거부
  - 우회 불가 (guard 생략 시 `pnpm lint`의 custom rule로 차단)
- **CQRS Command 경계 (P2)**: 본 Command는 **상태 변경**(BADGE INSERT/UPDATE)을 수반한다. 따라서 Query 모듈이 아닌 `src/server/f2/commands/` 아래 배치.
- **경계 원칙 (P4)**: 본 Command는 "판정 + 영속화"만 담당. 캐싱(F2-C-005), Route Handler 조립(F2-RH-001), 번역(F2-C-003)은 별도 태스크. `decideBadge` 내부에서 HTTP 응답 작성·캐시 쓰기 절대 금지.
- **데이터 출처 추적 (CP-1)**: 판정 시 `ingredient.data_source` 값을 확인해 `COUPANG_META`만으로 판정하면 신뢰도 낮음 → `CAUTION` 또는 `UNKNOWN` 경로로 분기.
- **결정성**: 판정 결과는 입력에 대해 결정적(deterministic). `Math.random()`, `Date.now()` 기반 분기 절대 금지. 시간 기반 검증은 입력으로 주입.
- **성능 예산 (REQ-NF-002)**:
  - 판정 로직 순수 계산: ≤ 10ms
  - DB 저장: ≤ 50ms
  - 전체(5성분 배치): ≤ 300ms (캐시 Hit 시)
- **트랜잭션 원자성**: 제품 단위 Batch 판정 시 `prisma.$transaction` 사용. 부분 실패 시 롤백.
- **감사 추적 (Audit)**: BADGE 생성/수정 시 별도 `BadgeAuditLog` 테이블에 이력 저장 (Phase 2 선택 확장).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] `decideBadge()` 단건 함수와 `decideBadgesForProduct()` Batch 함수가 모두 제공되는가?
- [ ] 4가지 분기(APPROVED/CAUTION/NOT_APPROVED/null) 로직이 명확히 구현되었는가?
- [ ] 공전 원문 1:1 매칭 정확도 ≥ 99.5% (CI 게이트 통과)?
- [ ] 금지 표현 검출 시 자동 강등 + DB 저장 거부 + Sentry 경보가 모두 동작하는가?
- [ ] 판정 결과의 결정성(determinism)이 테스트로 검증되었는가?
- [ ] `prohibited_check_passed` 플래그가 BADGE 레코드에 정확히 저장되는가?
- [ ] 트랜잭션 원자성이 Integration Test로 검증되었는가?
- [ ] 판정 로직이 순수하며(I/O 제외), `prisma` 호출이 명시적 입력으로 주입 가능한가? (테스트 격리 용이)
- [ ] 로깅에 PII가 없고, 판정 이벤트가 구조화 로그로 기록되는가?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #DATA-005 (BADGE 스키마 — prohibited_check_passed 필드 포함)
  - #F2-Q-001 (성분 목록 Query)
  - #F2-Q-002 (MFDS 공전 Query)
  - #F2-C-002 (금지 표현 검증 — 본 Command의 내부 호출)
- **Blocks**:
  - #F2-C-004 (미등재 원료 회색 라벨 — null 반환 케이스를 수신)
  - #F2-C-005 (뱃지 캐싱 — 본 Command 결과를 캐시)
  - #F2-RH-001 (Badge Route Handler — 본 Command 호출)
  - #TEST-F2-002 (공전 매칭 정확도 테스트)
  - #TEST-F2-003 (금지 표현 차단 테스트)
  - #F4-Q-001 (뱃지 근거 출처 표시 — 본 Command가 저장한 evidenceUrl 사용)

## :bookmark_tabs: Notes
- 본 Command는 **법률 리스크 R2**를 기술적으로 방어하는 핵심 모듈이다. PR 리뷰 시 법률 검토자 1인 + 백엔드 리드 1인의 **이중 승인**을 필수로 한다(SRS §1.2.4 R2 대응).
- `badgeLabel`이 공전 원문과 다른 경우는 **크리티컬 버그**로 취급하며, Sentry `severity=critical`로 즉시 알림. Slack `#legal-alert` 채널로 전파.
- Phase 2 확장 시 `evidenceSource=PAPER`(논문 DOI) 경로가 추가될 예정. 본 Command의 분기 로직을 전략 패턴으로 확장 가능한 구조로 설계할 것.
- `decideBadge()`의 순수성 보장을 위해 `prisma` 인스턴스는 **함수 외부에서 의존성 주입**받는 구조를 권장. 예: `createBadgeDecider({ prisma, mfdsAdapter })` 팩토리.
