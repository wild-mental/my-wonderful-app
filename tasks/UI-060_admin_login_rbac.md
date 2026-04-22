---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-060: 관리자 로그인 + RBAC 기반 접근 제어 UI"
labels: 'feature, frontend, epic:E-ADMIN, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-060] 관리자 로그인 + RBAC 접근 제어 UI
- 목적: 관리자만 접근 가능한 백오피스 영역을 위한 로그인 페이지와 RBAC(Role-Based Access Control) 기반 접근 제어 미들웨어를 구현한다.
- Epic / Phase: E-ADMIN / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#1.3`](../05_SRS_v1.md) — RBAC (관리자 역할)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.3`](./06_TASK_LIST_v1.md)
- 선행 태스크: **COM-C-002** (인증/세션 관리)
- 후행 태스크: UI-061 (등록 요청 대시보드), UI-062 (제보 관리 대시보드)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **관리자 라우트 그룹** — `src/app/admin/(dashboard)/layout.tsx`
  - 관리자 전용 레이아웃 (사이드바 + 콘텐츠)
- [ ] **관리자 로그인 페이지** — `src/app/admin/login/page.tsx`
  - 이메일 + 비밀번호 기반 관리자 로그인
  - 일반 사용자 가입과 별도 (관리자는 수동 등록)
- [ ] **RBAC 미들웨어** — `src/middleware.ts` 또는 레이아웃 서버 컴포넌트
  - `/admin/*` 라우트 접근 시 `role === 'ADMIN'` 확인
  - 비인가 시 `/admin/login`으로 리디렉션
  - 세션 만료 시 재인증 유도
- [ ] **관리자 사이드바 컴포넌트** — `src/components/admin/sidebar.tsx`
  - 메뉴: 대시보드, 등록 요청 관리, 오류 제보 관리, 로그아웃
  - 현재 페이지 하이라이트
- [ ] **역할 표시** — 헤더에 관리자 이메일 + 역할 표시
- [ ] **접근성 + 보안** — CSRF 보호, 세션 타임아웃(2시간)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 관리자 로그인**
- **Given**: 관리자 계정이 등록된 상태
- **When**: 관리자가 이메일/비밀번호로 로그인한다
- **Then**: 관리자 대시보드로 리디렉션된다.

**Scenario 2: 비인가 접근 차단**
- **Given**: 일반 사용자(role=USER)가 로그인한 상태
- **When**: `/admin/dashboard`에 접근을 시도한다
- **Then**: `/admin/login`으로 리디렉션되며, "관리자 권한이 필요합니다" 메시지가 표시된다.

**Scenario 3: 미인증 접근 차단**
- **Given**: 미인증(로그아웃) 상태
- **When**: `/admin/*` 라우트에 접근한다
- **Then**: `/admin/login`으로 리디렉션된다.

## :gear: Technical & Non-Functional Constraints
- **RBAC**: USER 모델에 `role: 'USER' | 'ADMIN'` 필드 존재 (DATA-009).
- **관리자 등록**: 관리자 계정은 DB 직접 삽입 또는 시드 스크립트로 생성. 자가 가입 불가.
- **보안**: 관리자 세션은 일반 사용자와 동일한 인증 메커니즘 사용. 역할 검증만 추가.

## :checkered_flag: Definition of Done (DoD)
- [ ] 관리자 로그인/인증이 동작하는가?
- [ ] 비인가/미인증 접근이 차단되는가?
- [ ] 사이드바 내비게이션이 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-C-002 (인증/세션 관리)
- **Blocks**: #UI-061, #UI-062 (관리자 대시보드 페이지들)
