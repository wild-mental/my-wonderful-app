---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-002: 공통 레이아웃 컴포넌트 (헤더, 푸터, 네비게이션, 반응형 모바일 퍼스트 셸)"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-002] 공통 레이아웃 컴포넌트 (헤더/푸터/네비게이션/모바일 셸)
- 목적: 모든 페이지가 공유하는 글로벌 셸(헤더, 푸터, 네비게이션 컨테이너)을 Next.js App Router의 root layout으로 구현한다. 모바일 퍼스트(CLT-01) 기준의 반응형 레이아웃과 RBAC(COM-C-002) 기반 조건부 메뉴(로그인/관리자)를 제공하며, F1~F4 모든 도메인 페이지의 공통 셀을 책임진다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 클라이언트 환경: [`/05_SRS_v1.md#3.2 Client / Operating Environment`](../05_SRS_v1.md) — CLT-01 (모바일 웹 퍼스트)
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-7 (Next.js 15 App Router)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — 모든 UC가 공통 셸 위에서 동작
- 선행 태스크: **UI-001** (디자인 시스템)
- 후행 태스크: UI-010~062 모두 본 태스크의 layout 위에서 동작
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.1 공통 UI 인프라`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Root Layout 구현** — `src/app/layout.tsx`
  - HTML `lang="ko"`, viewport meta, theme-color
  - `<body>` 내부에 `<Header />`, `<main>`, `<Footer />` 구조
  - Pretendard 폰트 클래스 적용
- [ ] **Header 컴포넌트** — `src/components/layout/header.tsx`
  - 좌측: 로고 + 서비스명 (홈 링크)
  - 우측: 검색 아이콘 (모바일에서 메인이 아닌 경우만 표시), 햄버거 메뉴, 로그인/내 메뉴 (RBAC 분기)
  - 스크롤 시 sticky + 그림자 변화
- [ ] **Footer 컴포넌트** — `src/components/layout/footer.tsx`
  - 서비스 정보, 사업자 정보, 약관/개인정보처리방침 링크
  - "본 서비스는 의료적 진단/치료 목적이 아닙니다" 면책 문구 (CON-2 관련)
- [ ] **Mobile Drawer Navigation** — `src/components/layout/mobile-nav.tsx`
  - shadcn/ui `Sheet` 컴포넌트 활용
  - 햄버거 클릭 시 좌/우에서 슬라이드
  - 메뉴: 홈, 검색, 인기 비교, 마이 페이지, 관리자(role=admin만)
- [ ] **RBAC 분기 로직** — `src/components/layout/auth-menu.tsx`
  - Server Component에서 `getCurrentUser()` 호출 (COM-C-002 의존)
  - 비로그인: [로그인] 버튼
  - 일반 사용자: 닉네임 또는 마스킹 이메일 + 드롭다운(마이 페이지, 로그아웃)
  - 관리자: 위 + [관리자 콘솔] 메뉴
- [ ] **Container 컴포넌트** — `src/components/layout/container.tsx`
  - max-width 제한(`max-w-md` 모바일 컨텐츠 폭)
  - 반응형 padding (`px-4 sm:px-6`)
- [ ] **Skip to Content 링크** — 접근성
  - 키보드 사용자가 헤더/네비를 건너뛸 수 있는 hidden 링크 (focus 시 노출)
- [ ] **Loading UI** — `src/app/loading.tsx`
  - Next.js Streaming SSR과 연계, UI-004의 Skeleton 활용
- [ ] **Error Boundary** — `src/app/error.tsx`, `src/app/not-found.tsx`
  - 에러 발생 시 사용자 친화적 메시지 + 홈 복귀 CTA
- [ ] **viewport meta** — 모바일 줌 차단 금지 (접근성)
  - `<meta name="viewport" content="width=device-width, initial-scale=1">`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 헤더 sticky 동작**
- **Given**: 페이지 길이가 viewport보다 큰 상태
- **When**: 사용자가 스크롤다운함
- **Then**: 헤더가 상단에 고정되며, 스크롤 거리에 따라 배경 그림자가 동적으로 변한다.

**Scenario 2: 모바일 햄버거 메뉴 동작**
- **Given**: 모바일 viewport (375px)
- **When**: 햄버거 아이콘을 탭함
- **Then**: Sheet가 슬라이드 인되며, 메뉴 항목이 표시되고, 외부 영역 탭 시 닫힌다.

**Scenario 3: RBAC — 비로그인 사용자**
- **Given**: 세션 쿠키 없음
- **When**: 헤더의 인증 메뉴 영역을 확인함
- **Then**: [로그인] 버튼만 표시되고, [관리자 콘솔] 메뉴는 보이지 않는다.

**Scenario 4: RBAC — 관리자 사용자**
- **Given**: `role: 'admin'` 세션
- **When**: 모바일 햄버거 메뉴를 열어 확인함
- **Then**: 일반 메뉴 + [관리자 콘솔] 항목이 표시된다.

**Scenario 5: 면책 문구 노출**
- **Given**: 임의 페이지를 렌더링함
- **When**: Footer를 확인함
- **Then**: "본 서비스는 의료적 진단/치료 목적이 아닙니다" 문구가 명확히 표시된다.

**Scenario 6: Skip to Content 접근성**
- **Given**: 키보드 Tab 키 누름
- **When**: 첫 번째 포커스 위치
- **Then**: "본문으로 건너뛰기" 링크가 화면에 노출되며 Enter 시 `<main>`으로 포커스 이동한다.

**Scenario 7: Error/Not Found 경로**
- **Given**: 존재하지 않는 라우트(`/invalid-path`) 또는 서버 에러 발생
- **When**: 사용자가 접근함
- **Then**: 친화적 에러 메시지 + [홈으로] CTA 버튼이 표시된다.

## :gear: Technical & Non-Functional Constraints
- **CON-7 App Router**: `src/app/layout.tsx` 활용. `getCurrentUser()`는 Server Component에서 호출.
- **CLT-01 모바일 퍼스트**: 375px 기준 레이아웃 우선 설계.
- **접근성**: Skip to Content 링크, viewport 줌 허용, focus ring 가시화, ARIA 속성(`aria-label`, `role`).
- **면책 문구 (CON-2)**: 건강기능식품법 관련 면책 문구는 모든 페이지의 footer에 영구 노출.
- **PII 마스킹**: 헤더 인증 메뉴에서 사용자 식별 표시 시 이메일은 `a***@example.com` 형태.
- **RBAC**: `getCurrentUser()` 결과의 `role` 필드로 메뉴 분기. role 미지정 시 일반 사용자 처리.
- **번들 크기**: layout 컴포넌트는 가능한 Server Component로 유지. 인터랙션이 필요한 부분만 `'use client'`.
- **Streaming SSR**: `loading.tsx` + Suspense 활용으로 사용자 체감 속도 향상.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] Root Layout, Header, Footer, Mobile Drawer가 구현되었는가?
- [ ] RBAC 분기 메뉴가 비로그인/사용자/관리자 3종을 정확히 구분하는가?
- [ ] Skip to Content 링크가 키보드 접근성을 충족하는가?
- [ ] viewport meta가 모바일 줌을 차단하지 않는가?
- [ ] Footer에 의료 면책 문구가 영구 노출되는가?
- [ ] `error.tsx`와 `not-found.tsx`가 친화적 메시지를 표시하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] iOS Safari 16+, Chrome 120+에서 햄버거/Sheet 인터랙션 검증되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-001 (디자인 시스템 토큰), #COM-C-002 (인증/세션 관리 — `getCurrentUser`, `role` 의존)
- **Blocks**: UI-010, UI-011, UI-020, UI-030, UI-050, UI-060~062 등 모든 페이지 UI

## :bookmark_tabs: Notes
- COM-C-002의 `getCurrentUser()`가 미완성 상태에서는 임시 mock(`{ role: 'user' }`)을 사용하되, 인터페이스는 동일하게 유지하여 추후 통합 시 변경 최소화.
- 햄버거 메뉴는 모바일 전용으로 표시(`md:hidden`), 데스크탑에서는 가로 네비게이션 바로 분기.
- Footer 면책 문구는 SRS CON-2(질병 치료/예방 표현 차단)의 보완 장치이며, 실제 법적 자문 후 문구 확정 권장 (본 태스크는 임시 문구로 시작).
- Loading/Error UI는 본 태스크에서 골격만 구현하고, 페이지별 세부 Loading/Error는 각 페이지 디렉토리 단위에서 추가.
