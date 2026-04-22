---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-061: 미등록 제품 등록 요청 관리 대시보드 UI (요청 목록, 상태 변경)"
labels: 'feature, frontend, epic:E-ADMIN, priority:medium, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-061] 미등록 제품 등록 요청 관리 대시보드
- 목적: 관리자가 사용자로부터 접수된 미등록 제품 등록 요청을 목록으로 확인하고, 건별로 승인/반려/보류 상태를 관리하는 백오피스 대시보드 UI를 구현한다.
- Epic / Phase: E-ADMIN / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-032 (미등록 제품 등록 요청 관리)
- 백엔드: [`/TASKS/ADM-Q-001_registration_request_list_query.md`](./ADM-Q-001_registration_request_list_query.md), [`/TASKS/ADM-C-001_registration_request_status_management.md`](./ADM-C-001_registration_request_status_management.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.3`](./06_TASK_LIST_v1.md)
- 선행 태스크: **ADM-Q-001** (등록 요청 목록 조회), **UI-002** (공통 레이아웃)
- 후행 태스크: 없음 (최종 UI)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **페이지 라우트** — `src/app/admin/(dashboard)/registrations/page.tsx` (Server Component)
- [ ] **요청 목록 테이블** — `src/components/admin/registration-table.tsx`
  - 컬럼: 요청 ID, 성분명, 요청자 이메일(마스킹), 요청일, 상태, 액션
  - shadcn/ui DataTable 컴포넌트 활용
  - 페이지네이션 (10건/페이지)
  - 상태 필터: 전체, 대기, 승인, 반려, 보류
- [ ] **상태 변경 드롭다운** — 각 행의 액션 컬럼
  - 승인(APPROVED): 제품 DB 등록 프로세스 트리거
  - 반려(REJECTED): 사유 입력 모달
  - 보류(ON_HOLD): 추가 검토 대기
- [ ] **상세 보기 패널** — 행 클릭 시 사이드 패널 또는 모달
  - 요청 내용 전문, 요청자 메시지, 처리 이력
- [ ] **이메일 마스킹** — 관리자 조회 시 이메일 마스킹 처리 (`u***@example.com`)
- [ ] **빈 상태** — 요청이 0건일 때 "등록 요청이 없습니다" 안내

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 등록 요청 목록 표시 (REQ-FUNC-032)**
- **Given**: 관리자가 백오피스에 접근한 상태
- **When**: 등록 요청 관리 페이지에 진입한다
- **Then**: 등록 요청 목록이 표시되고, 요청 건별 처리 상태를 관리할 수 있다.

**Scenario 2: 상태 변경(승인/반려/보류)**
- **Given**: 대기 상태의 등록 요청이 존재하는 상태
- **When**: 관리자가 "승인"을 선택한다
- **Then**: 상태가 APPROVED로 변경되고, 목록에 반영된다.

**Scenario 3: 이메일 마스킹**
- **Given**: 등록 요청 목록이 표시된 상태
- **When**: 요청자 이메일을 확인한다
- **Then**: `u***@example.com` 형태로 마스킹 표시된다.

## :gear: Technical & Non-Functional Constraints
- **관리자 전용**: `/admin/` 라우트 그룹 내 배치. RBAC 미들웨어 보호.
- **개인정보 마스킹**: 이메일 마스킹 필수 (CON-4 보안 준수).
- **shadcn/ui DataTable**: 정렬, 필터, 페이지네이션 내장 활용.

## :checkered_flag: Definition of Done (DoD)
- [ ] 등록 요청 목록이 표시되는가?
- [ ] 상태 변경(승인/반려/보류)이 동작하는가?
- [ ] 이메일 마스킹이 적용되었는가?
- [ ] 페이지네이션과 필터가 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #ADM-Q-001, #UI-002, #UI-060 (관리자 로그인)
- **Blocks**: 없음 (최종 UI)
