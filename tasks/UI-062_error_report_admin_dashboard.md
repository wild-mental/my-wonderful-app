---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-062: 오류 제보 관리 대시보드 UI (제보 목록, 필터, 검증·수정·반려 워크플로)"
labels: 'feature, frontend, epic:E-ADMIN, priority:high, phase:5, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-062] 오류 제보 관리 대시보드
- 목적: 관리자가 사용자의 오류 제보를 목록으로 확인하고, 필터링·검증·수정·반려의 전체 워크플로를 수행하는 백오피스 대시보드 UI를 구현한다. SLA 48시간 준수 모니터링을 시각적으로 지원한다.
- Epic / Phase: E-ADMIN / Phase 5 (프론트엔드)
- 복잡도: H

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-025 (48시간 내 검증·수정)
- SRS 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 관리자 검증→수정/반려 분기
- 백엔드: [`/TASKS/ADM-Q-002_error_report_list_query.md`](./ADM-Q-002_error_report_list_query.md), [`/TASKS/ADM-C-002_error_report_workflow.md`](./ADM-C-002_error_report_workflow.md)
- 상태 로직: [`/TASKS/F4-C-003_report_status_lifecycle.md`](./F4-C-003_report_status_lifecycle.md) — SUBMITTED→REVIEWING→RESOLVED/REJECTED
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.3`](./06_TASK_LIST_v1.md)
- 선행 태스크: **ADM-Q-002** (제보 목록 조회), **UI-002** (공통 레이아웃)
- 후행 태스크: 없음 (최종 UI)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **페이지 라우트** — `src/app/admin/(dashboard)/reports/page.tsx` (Server Component)
- [ ] **제보 목록 테이블** — `src/components/admin/report-table.tsx`
  - 컬럼: 제보 ID, 제품명, 필드명, 제보자(마스킹), 제보일, 상태, SLA 잔여시간, 액션
  - shadcn/ui DataTable + 정렬/필터/페이지네이션
- [ ] **상태 필터** — 탭 또는 드롭다운
  - 전체 | SUBMITTED (접수) | REVIEWING (검토 중) | RESOLVED (완료) | REJECTED (반려)
  - 각 탭에 건수 뱃지 표시
- [ ] **SLA 잔여 시간 표시**
  - 접수 후 48시간 이내: 녹색 `"24h 남음"`
  - 접수 후 24시간 초과: 노랑 `"12h 남음"` ⚠️
  - 접수 후 48시간 초과: 빨강 `"SLA 초과"` 🚨
  - 실시간 카운트다운 또는 5분 간격 갱신
- [ ] **제보 상세 모달** — 행 클릭 시 상세 정보
  - 제보 대상 필드명, 기존 값, 올바른 값, 근거 자료 (구조화된 폼 내용)
  - 원본 출처(식약처/라벨/논문)와 대조 검증 지원
- [ ] **워크플로 액션 버튼**
  - **검토 시작**: SUBMITTED → REVIEWING (상태 전이)
  - **수정 완료**: REVIEWING → RESOLVED (데이터 수정 + 이메일 + 보상 트리거)
  - **반려**: REVIEWING → REJECTED (사유 입력 필수 + 이메일 트리거)
  - 각 버튼에 확인 모달 (의도치 않은 상태 변경 방지)
- [ ] **반려 사유 입력 모달** — `reason` 텍스트 필수 입력 후 확인
- [ ] **이메일 마스킹** — 제보자 이메일 `k***@example.com` 마스킹 (CON-4)
- [ ] **대시보드 통계 헤더** — 요약 카드
  - 접수 건수, 검토 중, 완료, SLA 초과 건수

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 제보 목록 표시 및 필터링**
- **Given**: 관리자가 제보 관리 대시보드에 접근한 상태
- **When**: "SUBMITTED" 필터를 선택한다
- **Then**: 접수 상태인 제보만 필터링되어 표시된다.

**Scenario 2: 검토 시작 워크플로**
- **Given**: SUBMITTED 상태 제보가 존재하는 상태
- **When**: 관리자가 "검토 시작" 버튼을 클릭한다
- **Then**: 상태가 REVIEWING으로 변경되고 목록에 반영된다.

**Scenario 3: 수정 완료 → 이메일 + 보상 트리거 (REQ-FUNC-025~026)**
- **Given**: REVIEWING 상태 제보
- **When**: 관리자가 "수정 완료"를 클릭한다
- **Then**: RESOLVED 상태로 전이되고, 이메일 알림과 보상 지급이 트리거된다.

**Scenario 4: SLA 48시간 초과 시각적 경고**
- **Given**: 접수 후 48시간이 경과한 SUBMITTED 제보
- **When**: 목록에 표시된다
- **Then**: SLA 잔여 시간이 빨간색 "SLA 초과 🚨"로 표시된다.

**Scenario 5: 반려 시 사유 필수**
- **Given**: REVIEWING 상태 제보
- **When**: 관리자가 사유 없이 "반려"를 시도한다
- **Then**: "반려 사유를 입력해주세요" 경고가 표시되고 반려가 차단된다.

## :gear: Technical & Non-Functional Constraints
- **관리자 전용**: RBAC 미들웨어 보호 (UI-060).
- **SLA 모니터링**: SLA 초과 건은 NFR-MON-004(Slack 알림)과 연계.
- **개인정보 마스킹 (CON-4)**: 이메일 마스킹 필수.
- **상태 전이**: F4-C-003의 상태 머신 규칙을 UI에서도 준수. 무효한 전이 버튼 비활성화.

## :checkered_flag: Definition of Done (DoD)
- [ ] 제보 목록 + 필터 + 페이지네이션이 동작하는가?
- [ ] 검토 시작 / 수정 완료 / 반려 워크플로가 동작하는가?
- [ ] SLA 잔여 시간이 시각적으로 표시되는가?
- [ ] 반려 시 사유 필수 검증이 동작하는가?
- [ ] 이메일 마스킹이 적용되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #ADM-Q-002, #ADM-C-002, #UI-002, #UI-060
- **Blocks**: 없음 (최종 관리자 UI)
