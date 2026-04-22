---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-004: 로딩 인디케이터 / 스켈레톤 UI 컴포넌트"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-004] 로딩 인디케이터 / 스켈레톤 UI 컴포넌트
- 목적: REQ-FUNC-001 AC("조회 완료까지 로딩 인디케이터가 표시된다")와 REQ-FUNC-006(전체 응답 p95 ≤ 3,500ms) 범위의 모든 비동기 조회에서 사용자에게 "응답이 오고 있다"는 즉각적 피드백을 제공하는 공통 Loading/Skeleton 컴포넌트를 구현한다. Next.js App Router의 Streaming SSR, Suspense, `loading.tsx` 관례와 맞물려 CLS(레이아웃 이동) 없이 페이지 골격을 보여주는 것이 핵심이다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001 AC (로딩 인디케이터 표시 필수)
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2.1 Performance`](../05_SRS_v1.md) — REQ-NF-001 (Super-Calc p95 ≤ 3,500ms), REQ-NF-005 (LCP ≤ 2,500ms)
- SRS 클라이언트 환경: [`/05_SRS_v1.md#3.2 CLT-01`](../05_SRS_v1.md) — 모바일 웹 퍼스트
- 선행 태스크: **UI-001** (디자인 시스템 토큰, 색상·radius)
- 후행 태스크: UI-010/UI-011/UI-020(비동기 렌더 페이지), UI-002(`loading.tsx` 연계)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.1 공통 UI 인프라`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **기본 Skeleton 프리미티브** — `src/components/ui/skeleton.tsx`
  - shadcn/ui `Skeleton` 추가 (`npx shadcn@latest add skeleton`)
  - Tailwind `animate-pulse` + 중립색 배경 (다크 모드 대응)
  - `className` 병합(`cn()`) 지원으로 크기·radius 자유 조정
- [ ] **도메인 Skeleton 컴포넌트** — `src/components/ui/skeletons/`
  - `ComparisonRowSkeleton` — 제품명 + 1일 단가 + 구매 버튼 자리 (UI-011)
  - `SearchResultSkeleton` — 자동완성 드롭다운 자리 (UI-010)
  - `ProductDetailSkeleton` — 썸네일 + 성분 목록 + 뱃지 자리 (UI-020)
  - `BadgeSkeleton` — 성분 뱃지 로딩 자리 (UI-021)
- [ ] **Spinner 컴포넌트** — `src/components/ui/spinner.tsx`
  - 인라인용 스피너 (버튼 내부, 작은 영역)
  - sizes: `sm(16px) | md(24px) | lg(32px)`
  - `aria-label="로딩 중"` 기본 제공
- [ ] **Next.js loading.tsx 연동**
  - `src/app/loading.tsx` — 전체 페이지 스켈레톤 (UI-002와 협업)
  - `src/app/compare/loading.tsx` — 비교 결과 전용 (`ComparisonRowSkeleton × 5`)
  - `src/app/product/[id]/loading.tsx` — 제품 상세 전용
- [ ] **Suspense 보조 훅** — `src/lib/ui/with-suspense.tsx`
  - 클라이언트 컴포넌트에서 fallback 지정을 간편화하는 래퍼
- [ ] **접근성 적용**
  - 스켈레톤 컨테이너에 `role="status"` + `aria-busy="true"` + 시각 문구(visually hidden): `<span className="sr-only">로딩 중입니다</span>`
  - 실제 콘텐츠 로드 시 `aria-busy="false"`로 전환
- [ ] **prefers-reduced-motion 대응**
  - `animate-pulse` 대신 정적 배경으로 대체 (Tailwind `motion-safe:animate-pulse`)
- [ ] **레이아웃 안정성(CLS)**
  - Skeleton은 실제 콘텐츠와 **동일한 영역 크기**를 예약해야 한다. (fixed height 또는 min-height)
  - 이미지 자리는 `aspect-ratio` 유지 (`aspect-square` 등)
- [ ] **카탈로그 페이지** — `/dev/components/skeleton` (개발 전용)
  - 프리미티브 + 4종 도메인 스켈레톤 시각 검증

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-001 로딩 인디케이터 표시**
- **Given**: 사용자가 검색 후 "1일 단가 비교" 버튼을 탭한 상태
- **When**: Super-Calc API 호출이 진행 중인 구간
- **Then**: `<ComparisonRowSkeleton>`이 즉시(< 100ms) 표시되고, 응답 도착 시 실제 결과로 교체된다.

**Scenario 2: CLS 0 보장**
- **Given**: 스켈레톤 → 실제 콘텐츠로 전환되는 페이지
- **When**: Lighthouse로 레이아웃 이동을 측정
- **Then**: CLS(Cumulative Layout Shift) 값이 0.1 이하로 유지된다.

**Scenario 3: 접근성 — aria-busy 토글**
- **Given**: 스켈레톤이 렌더된 상태
- **When**: 스크린 리더로 해당 영역을 탐색
- **Then**: "로딩 중입니다" 문구가 읽히고 `aria-busy="true"`가 감지된다. 로드 완료 후 `aria-busy="false"`로 전환된다.

**Scenario 4: prefers-reduced-motion 대응**
- **Given**: OS 설정 `prefers-reduced-motion: reduce`
- **When**: 스켈레톤이 표시됨
- **Then**: pulse 애니메이션이 비활성화되고 정적 회색 배경만 표시된다.

**Scenario 5: 버튼 내부 Spinner**
- **Given**: 제보 제출 버튼을 탭한 직후
- **When**: Server Action이 pending 상태
- **Then**: 버튼 내부에 `<Spinner size="sm">` + "처리 중..." 문구가 표시되고 버튼이 disabled 처리된다.

**Scenario 6: Next.js loading.tsx 자동 렌더**
- **Given**: 사용자가 `/compare` 경로로 이동
- **When**: 서버가 데이터 fetch 중
- **Then**: `src/app/compare/loading.tsx`가 자동으로 Streaming SSR 중 fallback으로 노출된다.

**Scenario 7: 다크 모드 일관성**
- **Given**: 다크 모드가 활성화된 상태
- **When**: 스켈레톤이 렌더됨
- **Then**: 배경이 다크 토큰(`bg-muted`)으로 전환되어 라이트 모드와 동일한 명도 대비가 유지된다.

## :gear: Technical & Non-Functional Constraints
- **CLS ≤ 0.1**: Skeleton은 실제 콘텐츠와 동일한 box model(width, height, padding, margin)을 예약해야 한다. 이미지 자리는 `aspect-ratio` 사용.
- **지연 임계 100ms**: 로딩 시간이 100ms 미만일 때는 flicker 방지를 위해 Skeleton을 표시하지 않는 옵션을 제공(React Suspense + `startTransition` 또는 100ms debounce).
- **접근성(WCAG 2.2)**: `role="status"` + `aria-busy` + `aria-label`/visually-hidden 문구 필수. 시각 장애 사용자에게 로딩 상태가 전달되어야 한다.
- **reduced-motion**: 애니메이션은 `motion-safe:` 접두어로 감싸 OS 설정 존중.
- **결정적 레이아웃**: 랜덤 width(예: `w-[73%]`)는 피하고 반복 가능한 디자인 토큰 사용 (시각 일관성).
- **TailwindCSS만 사용**: 별도 CSS-in-JS 라이브러리 도입 금지 (CON-10).
- **Next.js App Router 관례 준수**: 페이지/세그먼트별 `loading.tsx`와 `<Suspense fallback={<Skeleton />}>` 양쪽 모두 지원.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] 기본 Skeleton 프리미티브 + 4종 도메인 스켈레톤이 구현되었는가?
- [ ] `<Spinner>` 컴포넌트가 3 size로 제공되는가?
- [ ] `src/app/loading.tsx`, `src/app/compare/loading.tsx`, `src/app/product/[id]/loading.tsx`가 연동되었는가?
- [ ] CLS ≤ 0.1을 Lighthouse로 측정해 통과하는가?
- [ ] `role="status"`, `aria-busy`, reduced-motion이 모두 적용되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] `/dev/components/skeleton` 카탈로그 페이지가 동작하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-001 (디자인 시스템 — `bg-muted` 토큰, radius)
- **Blocks**:
  - #UI-002 (`src/app/loading.tsx` 통합)
  - #UI-010 (검색 자동완성 스켈레톤)
  - #UI-011 (비교 결과 페이지 스켈레톤)
  - #UI-020 (제품 상세 페이지 스켈레톤)
  - REQ-FUNC-001 AC 충족 전제

## :bookmark_tabs: Notes
- Skeleton의 목적은 "응답이 진행 중임을 알리는 것"과 "레이아웃 예약으로 CLS 0 보장"이다. 단순 중앙 스피너만으로는 CLS 문제를 해결할 수 없으므로 도메인별 Skeleton을 선호한다.
- 100ms 미만의 빠른 응답에서 skeleton을 깜빡 보이는 것이 오히려 UX를 해친다. React 18 Streaming + Transition과 조합해 짧은 응답에서는 Skeleton 노출을 생략할 수 있다.
- UI-002의 `src/app/loading.tsx`와 역할 분리: UI-002는 레이아웃 셸의 fallback 위치 정의, UI-004는 그 안을 채우는 스켈레톤 프리미티브·도메인 컴포넌트 제공.
