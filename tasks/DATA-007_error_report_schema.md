---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] DATA-007: ERROR_REPORT 테이블 Prisma 스키마 정의 및 마이그레이션 생성 (FK → PRODUCT, USER, Enum: SUBMITTED/REVIEWING/RESOLVED/REJECTED)"
labels: 'feature, data, epic:E-DATA, priority:high, phase:1'
assignees: ''
---

## :dart: Summary
- 기능명: [DATA-007] ERROR_REPORT 엔티티 Prisma 모델 정의 및 마이그레이션
- 목적: F4 Data Trust System의 핵심 — **사용자 데이터 오류 제보의 구조화된 생명주기**(SUBMITTED → REVIEWING → RESOLVED/REJECTED)를 저장한다. REQ-FUNC-024(접수 확인 3초 이내), REQ-FUNC-025(48시간 SLA 검증·수정), REQ-FUNC-026(수정 완료 이메일+보상), REQ-FUNC-027(스팸/중복 차단), REQ-FUNC-028(구조화 폼)의 기반 테이블이다.
- Epic / Phase: E-DATA / Phase 1
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.6 ERROR_REPORT`](../05_SRS_v1.md) — 10개 필드 원천 명세
- SRS 문서 (F4 요구): [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-024~028
- SRS 문서 (F4 Full Lifecycle 시퀀스): [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 상태 전이 흐름
- SRS 문서 (SLA): [`/05_SRS_v1.md#4.2.2 REQ-NF-012`](../05_SRS_v1.md) — 48시간 SLA
- SRS 문서 (Class Diagram): [`/05_SRS_v1.md#6.2.9`](../05_SRS_v1.md) — `ErrorReport.isWithinSLA()`
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#3.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-002** (PRODUCT FK), **DATA-009** (USER FK)
- 후행 태스크: DATA-010, F4-C-001~005 (제보 생명주기 전체), ADM-Q-002, ADM-C-002, API-004, TEST-F4-003~006

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Prisma 모델 작성** — `prisma/schema.prisma`에 `model ErrorReport` 블록 추가
- [ ] **필드 매핑 (SRS §6.2.6 원문 + 운영 필드 확장)**:
  - `report_id: String @id @default(cuid())`
  - `product_id: String` + `product Product @relation(fields: [product_id], references: [product_id], onDelete: Restrict)` — 제품 삭제 시 제보 소실 방지
  - `reporter_id: String` + `reporter User @relation(fields: [reporter_id], references: [user_id], onDelete: Restrict)` — 감사 추적 보존
  - `field_name: String` (제보 대상 필드명, 예: `amount_per_serving`, `mfds_claim`)
  - `reported_value: String` (현재 표시 값, 최대 1,000자)
  - `correct_value: String` (제보자 주장 값, 최대 1,000자)
  - `evidence_url: String?` (근거 자료 URL, 선택)
  - `status: ReportStatus @default(SUBMITTED)` (Enum)
  - `reviewed_by: String?` (관리자 ID, 감사 추적)
  - `reject_reason: String?` (REJECTED 시 사유 기록)
  - `reported_at: DateTime @default(now())`
  - `reviewed_at: DateTime?` (SUBMITTED → REVIEWING 진입 시각)
  - `resolved_at: DateTime?` (RESOLVED/REJECTED 확정 시각)
  - `sla_deadline_at: DateTime` (제보 접수 시점 + 48시간 자동 계산, Application 레벨에서 주입)
- [ ] **Enum 정의** — `enum ReportStatus { SUBMITTED REVIEWING RESOLVED REJECTED }`
- [ ] **인덱스 설계**:
  - `@@index([product_id, reported_at(sort: Desc)])` — 제품별 제보 내역, 스팸 검증 핵심
  - `@@index([reporter_id, reported_at(sort: Desc)])` — 사용자별 제보 이력, REQ-FUNC-027 24h 5건+ 차단 핵심
  - `@@index([status])` — 관리자 대시보드 상태별 필터
  - `@@index([sla_deadline_at])` — NFR-MON-004 SLA 48h 초과 알림 배치 조회
- [ ] **상태 전이 가드** — `src/lib/error-report/state-machine.ts`에 허용 전이 매트릭스 구현:
  ```
  SUBMITTED → REVIEWING | REJECTED
  REVIEWING → RESOLVED | REJECTED
  RESOLVED → (terminal)
  REJECTED → (terminal)
  ```
  - 애플리케이션 레벨 가드 함수 `canTransition(from, to): boolean`
  - 역전이·스킵 금지
- [ ] **Reverse Relation** — `model Product`에 `error_reports ErrorReport[]` 추가, `model User`에 `reports ErrorReport[]` 추가
- [ ] **마이그레이션 생성** — `pnpm prisma migrate dev --name add_error_report_table --create-only` → 리뷰 → 적용
- [ ] **Zod 검증 스키마** — `src/lib/schemas/error-report.ts`:
  - `field_name`: 허용 리스트(ingredient.amount_per_serving, ingredient.mfds_claim, product.brand_name 등)
  - `reported_value`/`correct_value`: 빈 문자열 금지(REQ-FUNC-027의 빈 문자열 차단)
  - `evidence_url`: 선택이지만 제공 시 URL 형식 필수
- [ ] **스팸 검사 헬퍼 인터페이스** — `src/lib/error-report/spam-filter.ts`에 `checkSpam(reporterId, productId, since): Promise<{ blocked: boolean, reason?: string }>` 스켈레톤. 실제 로직은 F4-C-002에서 구현
- [ ] **SLA 계산 헬퍼** — `src/lib/error-report/sla.ts`에 `computeSlaDeadline(reportedAt: Date): Date` (48시간 가산), `isWithinSLA(report, now): boolean`
- [ ] **Unit Test 작성** — 7건 이상: 상태 전이 매트릭스, SLA 계산, FK Restrict 동작, 빈 문자열 차단, Enum 초기값 `SUBMITTED`, reviewed_at/resolved_at 시간 순서, 중복 제보 조회

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 제보 접수 (REQ-FUNC-024)**
- **Given**: USER `U1`, PRODUCT `P1`이 존재
- **When**: `{ product_id: "P1", reporter_id: "U1", field_name: "ingredient.amount_per_serving", reported_value: "100mg", correct_value: "1000mg", evidence_url: "https://..." }`을 접수한다
- **Then**: 레코드가 저장되고 `status=SUBMITTED`, `sla_deadline_at = reported_at + 48h`가 자동 설정된다.

**Scenario 2: 상태 전이 정합성 (SUBMITTED → RESOLVED 직접 전이 차단)**
- **Given**: `status=SUBMITTED` 제보
- **When**: 서비스 레이어가 `SUBMITTED → RESOLVED`로 직접 전이 시도
- **Then**: `InvalidTransitionError`가 발생하며 `SUBMITTED → REVIEWING → RESOLVED` 경로만 허용됨을 안내한다.

**Scenario 3: 48시간 SLA 경과 제보 조회 (NFR-MON-004)**
- **Given**: `reported_at`이 49시간 전, `status=REVIEWING`인 제보 2건 존재
- **When**: `prisma.errorReport.findMany({ where: { sla_deadline_at: { lt: now }, status: { in: ["SUBMITTED", "REVIEWING"] } } })`를 실행
- **Then**: 2건이 반환되며, `@@index([sla_deadline_at])`가 활용됨이 `EXPLAIN`으로 확인된다.

**Scenario 4: 스팸 제보 차단 기반 — 동일 제품 24h 내 5건+ 조회**
- **Given**: USER `U1`이 24시간 이내에 PRODUCT `P1`에 대해 5건의 제보를 제출한 상태
- **When**: `checkSpam("U1", "P1", 24h)`를 호출
- **Then**: `{ blocked: true, reason: "24h 내 5건 초과" }`가 반환된다 (F4-C-002 로직이 사용할 집계 쿼리).

**Scenario 5: 빈 문자열 제보 차단 (REQ-FUNC-027)**
- **Given**: Zod 검증 스키마
- **When**: `{ reported_value: "  ", correct_value: "" }`를 파싱
- **Then**: ZodError 발생, "reported_value/correct_value는 공백 불가" 메시지 반환.

**Scenario 6: PRODUCT/USER 삭제 시 Restrict 동작**
- **Given**: ERROR_REPORT 레코드가 참조하는 PRODUCT 존재
- **When**: 해당 PRODUCT 삭제 시도
- **Then**: FK Restrict로 인해 삭제가 실패하며, 제보 감사 이력이 보존된다.

**Scenario 7: REJECTED 시 사유 필수 (비즈니스 규칙)**
- **Given**: 제보 상태를 `REJECTED`로 전이하는 서비스 호출
- **When**: `reject_reason`이 누락된 상태로 전이 시도
- **Then**: 애플리케이션 레이어 가드가 `RejectReasonRequiredError`를 던진다.

## :gear: Technical & Non-Functional Constraints
- **FK 정책**: PRODUCT/USER FK는 `onDelete: Restrict`. 제보는 **감사 추적이 중요**하므로 참조 무결성 위반으로 삭제 차단. (PRICE_SNAPSHOT의 Cascade와 의도적으로 다름)
- **SLA 48h (REQ-NF-012)**: `sla_deadline_at`은 `reported_at + 48h`로 계산하되, 업무 시간 기준이 아닌 **물리 시간 기준**이다(SRS §4.2.2 명시). 주말·공휴일 제외 없음.
- **상태 머신 엄격성**: 역전이(RESOLVED → REVIEWING 등) 절대 금지. 잘못된 판정 정정 시 새 제보를 생성하거나 관리자가 `reject_reason`에 기록 후 별도 플로우 진행.
- **개인정보 (CON-4)**: `reporter_id`는 USER FK로 연결되며, USER 테이블의 email 최소 수집 원칙(CON-4) 준수. 제보 내용에 민감 개인정보가 포함되지 않도록 Zod에서 이메일·전화번호 패턴 경고(optional).
- **스팸 차단 정확도 (REQ-FUNC-027)**: 본 태스크는 **인덱스·집계 기반 쿼리 성능 확보**에 집중. 정확도 ≥ 95% / FP ≤ 2% 검증은 F4-C-002 + TEST-F4-004에서 담당.
- **알림 연계 (REQ-FUNC-026)**: `status=RESOLVED` 변경 시 이메일 알림 트리거는 F4-C-004에서 처리. 본 태스크는 상태 값만 제공.
- **CQRS 분리 (P2)**: 본 태스크는 스키마·상태 머신 가드·SLA 계산·Zod 검증에 한정. 실제 접수 Server Action은 F4-C-001, 상태 전이 Command는 F4-C-003에서 분리.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] `model ErrorReport` + `ReportStatus` Enum이 정의되고 `prisma validate` 통과하는가?
- [ ] 4개 인덱스가 모두 생성되고 SLA/스팸 쿼리가 인덱스를 활용하는가?
- [ ] 상태 전이 매트릭스가 코드(`state-machine.ts`)와 테스트로 명시되어 있는가?
- [ ] `sla_deadline_at` 자동 계산이 Application 레이어에서 주입되고 테스트되었는가?
- [ ] Zod 스키마가 빈 문자열/필드명 허용 리스트/URL을 검증하는가?
- [ ] FK `onDelete: Restrict`가 PRODUCT/USER 양쪽에 적용되었는가?
- [ ] 마이그레이션 SQL 리뷰 및 ERD 정합성 확인이 완료되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: 
  - #DATA-001 (Prisma 초기화)
  - #DATA-002 (PRODUCT FK)
  - #DATA-009 (USER FK)
- **Blocks**: 
  - #DATA-010 (ERD 통합 검증)
  - #F4-C-001 (오류 제보 접수 Server Action)
  - #F4-C-002 (스팸/중복 필터링)
  - #F4-C-003 (상태 변경 생명주기)
  - #F4-C-004 (수정 완료 이메일)
  - #F4-C-005 (보상 지급)
  - #ADM-Q-002, #ADM-C-002 (관리자 백오피스)
  - #API-004 (Server Action DTO)
  - #TEST-F4-003 ~ TEST-F4-006

## :bookmark_tabs: Notes
- SRS §6.2.6 원문은 9개 필드(`report_id`, `product_id`, `reporter_id`, `field_name`, `reported_value`, `correct_value`, `evidence_url`, `status`, `reported_at`, `resolved_at`)를 명시. 본 태스크는 운영 실효성과 SLA/감사 추적을 위해 `reviewed_by`, `reviewed_at`, `reject_reason`, `sla_deadline_at`을 추가한다. ERD 검증(DATA-010)에서 반영한다.
- `field_name` 허용 리스트는 MVP 초기에는 INGREDIENT/PRODUCT의 핵심 필드로 한정. Phase 2에서 동적 확장 가능(관리자 설정 기반).
- Jira 보드 자동 이슈 생성(SRS §6.3.3 참고)은 F4-C-001에서 별도 외부 연동으로 처리. 본 태스크는 이에 대한 참조 없음.
