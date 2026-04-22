---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-001: shadcn/ui + Tailwind 디자인 시스템 기초 설정 (테마, 색상, 타이포그래피, 반응형 breakpoint)"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-001] 디자인 시스템 기초 설정 (shadcn/ui + Tailwind)
- 목적: 모든 후속 UI 태스크(UI-002~062)가 일관된 시각 언어를 따를 수 있도록 디자인 토큰(색상, 타이포그래피, 간격, breakpoint)을 Tailwind config 및 CSS variable로 정의하고, shadcn/ui 컴포넌트를 프로젝트에 초기 등록한다. 모바일 퍼스트 반응형(CLT-01)과 접근성(WCAG AA 명도 대비)을 기준으로 한다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 클라이언트 환경: [`/05_SRS_v1.md#3.2 Client / Operating Environment`](../05_SRS_v1.md) — CLT-01 (모바일 웹 퍼스트, iOS Safari 16+/Chrome 120+)
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-7 (Next.js 15 App Router), CON-10 (Tailwind + shadcn/ui)
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md)
- 선행 태스크: **DATA-001** (Next.js + Tailwind + shadcn/ui 스캐폴딩)
- 후행 태스크: UI-002~062 모두 본 태스크 의존
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.1 공통 UI 인프라`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **색상 토큰 정의** — `tailwind.config.ts` + `src/app/globals.css`
  - Primary: 신뢰감 기반의 짙은 청색 계열 (예: `--primary: #1E40AF`), 변형 50~900 9단계
  - Semantic: `--success` (초록, 뱃지 APPROVED), `--warning` (노랑, CAUTION), `--destructive` (빨강, NOT_APPROVED), `--muted` (회색, 미등재)
  - Neutral: 그레이 50~900 9단계
  - WCAG AA 명도 대비 ≥ 4.5:1 검증
- [ ] **타이포그래피 정의** — Pretendard 또는 시스템 한글 폰트 우선
  - `font-family`: `Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`
  - `text-xs` ~ `text-3xl` 7단계, line-height/letter-spacing 한글 최적화
  - 한글 가독성을 위해 본문 line-height 1.6 기본
- [ ] **반응형 Breakpoint** — 모바일 퍼스트
  - `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px` (Tailwind 기본 유지)
  - 모바일 컨테이너 max-width: `max-w-md` (448px) 기본
- [ ] **간격(Spacing) 토큰** — 4px 기준 8단계 (`space-1` ~ `space-16`)
- [ ] **둥근 모서리(Radius)** — `rounded-sm/md/lg/xl/full` 5단계
- [ ] **그림자(Shadow)** — `shadow-sm/md/lg` 3단계, 카드/모달용
- [ ] **다크모드 변수 분리** — `data-theme="dark"` 또는 `prefers-color-scheme: dark`
  - MVP: 라이트 모드 우선, 다크 모드 변수만 정의 (실 적용은 Phase 2)
- [ ] **shadcn/ui 컴포넌트 초기 등록** — `pnpm dlx shadcn-ui@latest add`
  - Button, Input, Card, Dialog, Badge, Toast, Skeleton, Sheet, DropdownMenu (자주 쓰일 것 위주)
- [ ] **컴포넌트 변형(Variants) 매핑** — `cva` (class-variance-authority) 활용
  - Badge: `default | success | warning | destructive | muted` (UI-021 의존)
  - Button: `default | secondary | destructive | ghost | link`
- [ ] **Storybook 또는 컴포넌트 카탈로그 페이지** — `/dev/components` 라우트 (개발 환경 전용)
  - 모든 토큰·컴포넌트 시각 확인용
  - `NODE_ENV !== 'production'`에서만 노출
- [ ] **접근성(a11y) 기본 설정**
  - `prefers-reduced-motion` 대응
  - focus ring 가시성 보장 (`outline-2 outline-offset-2`)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 디자인 토큰 적용**
- **Given**: Tailwind config에 정의된 토큰들
- **When**: 임의 컴포넌트에서 `bg-primary text-primary-foreground` 클래스를 사용함
- **Then**: 정의된 색상이 정확히 렌더링되며, CSS variable로 노출되어 런타임 테마 전환이 가능하다.

**Scenario 2: WCAG AA 대비 검증**
- **Given**: Primary, Success, Warning, Destructive 색상의 foreground/background 조합
- **When**: 명도 대비를 측정함 (예: `axe-core` 자동 검증)
- **Then**: 본문 텍스트 ≥ 4.5:1, 큰 텍스트 ≥ 3:1을 충족한다.

**Scenario 3: 모바일 퍼스트 반응형 (CLT-01)**
- **Given**: 컨테이너 컴포넌트에 반응형 클래스 적용
- **When**: iOS Safari 16+ (375px) 및 데스크탑(1440px)에서 렌더링
- **Then**: 모바일에서 단일 컬럼 + 세로 레이아웃, 데스크탑에서 max-width 제한 + 중앙 정렬.

**Scenario 4: 한글 타이포그래피 가독성**
- **Given**: Pretendard 폰트가 로드된 상태
- **When**: 본문 텍스트(`text-base`)를 렌더링
- **Then**: line-height 1.6, letter-spacing 0(또는 -0.01em)로 한글 가독성 임계 충족.

**Scenario 5: shadcn/ui 컴포넌트 등록**
- **Given**: `Button`, `Input`, `Badge` 컴포넌트가 등록된 상태
- **When**: `import { Button } from '@/components/ui/button'`
- **Then**: 정의된 variants(`default | secondary | destructive` 등)가 모두 사용 가능하며 TypeScript 타입이 추론된다.

**Scenario 6: 컴포넌트 카탈로그 노출**
- **Given**: 개발 환경(`NODE_ENV !== 'production'`)
- **When**: `/dev/components` 라우트에 접근함
- **Then**: 모든 토큰과 컴포넌트가 카탈로그 형태로 시각화되며, 프로덕션 빌드에서는 404를 반환한다.

## :gear: Technical & Non-Functional Constraints
- **CON-7 Next.js 15 App Router**: Server Component 우선, 클라이언트 컴포넌트는 `'use client'` 명시.
- **CON-10 Tailwind + shadcn/ui**: 추가 UI 라이브러리(MUI, Ant Design 등) 도입 금지.
- **CLT-01 모바일 퍼스트**: 모든 컴포넌트는 375px 기준으로 먼저 설계 후 데스크탑 확장.
- **WCAG AA**: 색상 대비 본문 ≥ 4.5:1, 큰 텍스트 ≥ 3:1.
- **다크모드 준비**: CSS variable 패턴으로 다크모드 확장 가능하게 설계 (MVP에서는 적용 X).
- **번들 크기**: shadcn/ui는 source 복사 방식이므로 사용하지 않는 컴포넌트는 등록하지 않음 (트리 셰이킹).
- **폰트 최적화**: Pretendard는 `next/font`로 self-hosting (`font-display: swap`).
- **카탈로그 페이지 분리**: 프로덕션 빌드 미포함. middleware 또는 환경 분기로 차단.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~6)를 충족하는가?
- [ ] `tailwind.config.ts`에 색상/타이포그래피/간격/breakpoint 토큰이 정의되었는가?
- [ ] `globals.css`에 CSS variable과 다크모드 변수 분리가 적용되었는가?
- [ ] WCAG AA 대비 자동 검증(axe-core 등)이 통과하는가?
- [ ] shadcn/ui 핵심 9개 컴포넌트가 등록되고 variants가 정의되었는가?
- [ ] Pretendard가 `next/font`로 self-hosting되며 한글 가독성이 검증되었는가?
- [ ] `/dev/components` 카탈로그 페이지가 개발 환경에서 노출되고 프로덕션에서 차단되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] iOS Safari 16+, Chrome 120+, Android Chrome 120+에서 렌더링 검증되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (Next.js + Tailwind + shadcn/ui 스캐폴딩)
- **Blocks**: 모든 UI-* 태스크 (UI-002 ~ UI-062)

## :bookmark_tabs: Notes
- 본 태스크는 모든 UI 작업의 토대이다. 후속 태스크에서 임의로 색상·간격을 hard-coding하지 않도록 토큰만 사용하도록 강제 (lint 룰 검토).
- shadcn/ui는 source 복사 방식이라 컴포넌트마다 커스텀이 필요할 수 있다. 본 태스크에서는 기본 등록만 수행하고, 도메인별 커스텀(예: 뱃지)은 UI-021 등에서 진행.
- Pretendard 라이센스는 SIL Open Font License로 상업적 사용 가능. self-hosting 시 라이센스 파일을 함께 배포.
- 다크모드는 Phase 2로 분리하되, 토큰 구조는 미리 다크모드 호환되게 설계.
