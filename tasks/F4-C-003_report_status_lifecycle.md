---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-C-003: 오류 제보 처리 상태 변경 로직 (SUBMITTED → REVIEWING → RESOLVED/REJECTED)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-C-003] 오류 제보 처리 상태 변경 로직 (생명주기 관리)
- 목적: 오류 제보의 전체 생명주기(SUBMITTED → REVIEWING → RESOLVED/REJECTED)를 관리하는 상태 머신 로직을 구현한다. 각 상태 전이(transition)에 대한 유효성 검증과 부수 효과(이메일 알림 트리거, 보상 트리거)를 제어한다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-025 (48h 내 검증·수정)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 관리자 검증 → 수정/반려 분기
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.6 ERROR_REPORT`](../05_SRS_v1.md) — `status` Enum
- API DTO: [`/TASKS/API-004_error_report_dto.md`](./API-004_error_report_dto.md) — `ReportStatus`
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F4-C-001** (오류 제보 접수)
- 후행 태스크: F4-C-004 (이메일 알림), F4-C-005 (보상 지급), ADM-C-002 (관리자 워크플로), TEST-F4-005

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **상태 머신 정의** — `src/lib/trust/report-state-machine.ts`
  - 유효한 상태 전이 매핑:
    - `SUBMITTED → REVIEWING` (관리자가 검증 시작)
    - `REVIEWING → RESOLVED` (수정 완료)
    - `REVIEWING → REJECTED` (제보 무효 반려)
  - 무효한 전이 차단: `RESOLVED → SUBMITTED`, `REJECTED → REVIEWING` 등
- [ ] **상태 전이 함수** — `transitionReportStatus()`
  - 입력: `reportId: string`, `targetStatus: ReportStatus`, `adminId: string`, `reason?: string`
  - 현재 상태 조회 → 전이 유효성 검증 → DB 업데이트
  - `resolved_at` 자동 설정: `RESOLVED` 또는 `REJECTED` 전이 시 서버 시각 기록
- [ ] **SLA 경과 시간 계산** — `getElapsedHours(reportedAt: Date): number`
  - 접수 시점부터 현재까지 경과 시간 계산
  - SLA 48시간 초과 여부 판별
- [ ] **부수 효과 트리거 포인트 예약** — 상태 전이 후 호출 지점 확보
  - `REVIEWING → RESOLVED`: F4-C-004 (이메일 알림) + F4-C-005 (보상 지급) 트리거
  - `REVIEWING → REJECTED`: F4-C-004 (반려 사유 이메일) 트리거
  - 현재는 pass-through, 각 후행 태스크 완료 후 연동
- [ ] **반려 사유 기록** — `REJECTED` 전이 시 `reason` 필드 필수
  - Prisma 모델에 `rejection_reason` 필드 추가 필요 여부 검토 (DATA-007 확장 또는 별도 컬럼)
- [ ] **단위 테스트** — 유효 전이, 무효 전이 차단, SLA 계산, resolved_at 자동 설정

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 상태 전이 (SUBMITTED → REVIEWING)**
- **Given**: `status=SUBMITTED`인 제보가 존재하는 상태
- **When**: 관리자가 `REVIEWING`으로 상태 전이를 요청한다
- **Then**: 상태가 `REVIEWING`으로 변경되고 DB가 업데이트된다.

**Scenario 2: 수정 완료 (REVIEWING → RESOLVED)**
- **Given**: `status=REVIEWING`인 제보가 존재하는 상태
- **When**: 관리자가 `RESOLVED`로 상태 전이를 요청한다
- **Then**: 상태가 `RESOLVED`로 변경되고, `resolved_at`에 현재 시각이 기록된다.

**Scenario 3: 무효한 상태 전이 차단**
- **Given**: `status=RESOLVED`인 제보가 존재하는 상태
- **When**: `SUBMITTED`로 상태 전이를 요청한다
- **Then**: 전이가 거부되고 `INVALID_STATUS_TRANSITION` 에러가 반환된다.

**Scenario 4: 48시간 SLA 검증 (REQ-FUNC-025)**
- **Given**: 접수 후 48시간이 경과한 `SUBMITTED` 상태 제보
- **When**: SLA 경과 시간을 조회한다
- **Then**: `elapsedHours > 48`이며, SLA 초과 플래그가 설정된다.

**Scenario 5: 반려 시 사유 필수**
- **Given**: `status=REVIEWING`인 제보
- **When**: 사유 없이 `REJECTED`로 전이를 요청한다
- **Then**: `REJECTION_REASON_REQUIRED` 에러가 반환된다.

## :gear: Technical & Non-Functional Constraints
- **SLA 48시간 (REQ-NF-012, REQ-FUNC-025)**: 접수(`reported_at`) → 수정 완료(`resolved_at`) 사이 48시간 이내. SLA 초과 시 NFR-MON-004(Slack 알림)에 연계.
- **상태 머신 엄격성**: 정의되지 않은 상태 전이는 일절 허용하지 않음. 타입 레벨에서 강제.
- **닫힌 문맥 (P4)**: 상태 변경만 수행. 실제 데이터 수정(관리자 직접 수정)은 ADM-C-002에서, 이메일 알림은 F4-C-004에서, 보상은 F4-C-005에서 처리.
- **감사 추적**: 상태 전이 시 `adminId`, `reason`, `transitionedAt`을 로깅하여 감사 추적 가능.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 상태 머신이 유효 전이만 허용하는가?
- [ ] `resolved_at`이 RESOLVED/REJECTED 시 자동 설정되는가?
- [ ] SLA 경과 시간 계산이 정확한가?
- [ ] 반려 시 사유 필수 검증이 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #F4-C-001 (오류 제보 접수)
- **Blocks**:
  - #F4-C-004 (이메일 알림 — RESOLVED/REJECTED 트리거)
  - #F4-C-005 (보상 지급 — RESOLVED 트리거)
  - #ADM-C-002 (관리자 워크플로 — 상태 전이 호출)
  - #NFR-MON-004 (SLA 48h 초과 Slack 알림)
  - #TEST-F4-005 (제보 전체 생명주기 테스트)
