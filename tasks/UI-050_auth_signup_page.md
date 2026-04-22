---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-050: 이메일 기반 회원가입/로그인 페이지 UI"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-050] 이메일 기반 회원가입/로그인 페이지
- 목적: 사용자가 이메일만으로 가입/로그인할 수 있는 인증 페이지를 구현한다. 개인정보 최소 수집 원칙(CON-4)에 따라 이메일 외 추가 입력 필드는 일절 배치하지 않는다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-029 (이메일 기반 계정, 최소 수집)
- 선행 태스크: **UI-002** (공통 레이아웃)
- 후행 태스크: COM-C-001 (가입 로직), COM-C-002 (인증/세션)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **페이지 라우트** — `src/app/auth/page.tsx`
  - 가입/로그인 탭 전환 (동일 폼, 모드 스위칭)
- [ ] **인증 폼 컴포넌트** — `src/components/auth/auth-form.tsx` (Client Component)
  - 이메일 입력 필드 1개 (email type, 자동완성)
  - 비밀번호 필드 1개 (또는 Magic Link 방식이면 비밀번호 제거)
  - "가입하기" / "로그인하기" 버튼
  - 소셜 로그인 버튼: Phase 2 (현재는 이메일만)
- [ ] **개인정보 최소 수집 보장 (REQ-FUNC-029, CON-4)**
  - 이름, 전화번호, 주소, 생년월일, 성별 등 **일체 미표시**
  - 폼 필드: `email` + `password`(선택) 총 1~2개로 한정
- [ ] **폼 유효성 검증** — Zod + React Hook Form
  - 이메일 형식 검증 (`z.string().email()`)
  - 비밀번호 최소 8자 (비밀번호 방식 시)
  - 실시간 에러 메시지 인라인 표시
- [ ] **로딩/에러/성공 상태**
  - 로딩: 버튼 내 스피너
  - 에러: 인라인 에러 메시지 (예: "이미 등록된 이메일입니다")
  - 성공: 토스트 알림 + 비교 페이지로 리디렉션
- [ ] **디자인** — 미니멀 센터 정렬 카드 레이아웃
  - shadcn/ui Card + Input + Button
  - 로고 + 서비스 설명 1줄
- [ ] **접근성** — `<form>` 시맨틱, `autocomplete="email"`, Tab 순서

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 이메일만으로 가입 (REQ-FUNC-029)**
- **Given**: 미인증 사용자가 가입 페이지에 접근한 상태
- **When**: 이메일을 입력하고 "가입하기"를 탭한다
- **Then**: 이메일만 수집되며, 추가 개인정보 입력 필드가 존재하지 않는다.

**Scenario 2: 이메일 형식 검증**
- **Given**: 이메일 입력 필드에 `"invalid-email"` 입력
- **When**: "가입하기" 버튼을 탭한다
- **Then**: "유효한 이메일을 입력해주세요" 인라인 에러가 표시된다.

**Scenario 3: 로그인 성공 후 리디렉션**
- **Given**: 등록된 이메일로 로그인한 상태
- **When**: 인증이 성공한다
- **Then**: 메인 비교 페이지로 리디렉션된다.

## :gear: Technical & Non-Functional Constraints
- **최소 수집 (CON-4)**: 이 페이지에서 이메일 외 개인정보를 수집하면 규정 위반.
- **Supabase Auth / NextAuth**: COM-C-002에서 결정된 인증 방식에 따라 폼 구조 변경 가능.

## :checkered_flag: Definition of Done (DoD)
- [ ] 이메일 입력 필드만 존재하는가 (추가 개인정보 0건)?
- [ ] 이메일 형식 검증이 동작하는가?
- [ ] 로딩/에러/성공 상태가 처리되었는가?
- [ ] 모바일 반응형이 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-002 (공통 레이아웃)
- **Blocks**: #COM-C-001 (가입 로직 연동), #TEST-COM-001 (최소 수집 테스트)
