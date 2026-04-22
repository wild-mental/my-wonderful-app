---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-021: 뱃지 컴포넌트 (APPROVED=초록, CAUTION=노랑, NOT_APPROVED=빨강, 미등재=회색)"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-021] 뱃지 컴포넌트
- 목적: 식약처 건강기능식품공전 기반의 기능성 인정 등급 뱃지를 시각적으로 표현하는 재사용 가능한 UI 컴포넌트를 구현한다. 4가지 상태(APPROVED, CAUTION, NOT_APPROVED, 미등재)를 컬러 코딩과 아이콘으로 즉시 식별할 수 있도록 디자인한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-011 (3등급 뱃지), REQ-FUNC-014 (미등재 회색 라벨)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.4`](../05_SRS_v1.md) — BADGE 엔터티 (`grade` Enum)
- API DTO: [`/TASKS/API-002_badge_dto.md`](./API-002_badge_dto.md) — `BadgeGrade` Enum, `BadgeItem` 타입
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **UI-001** (디자인 시스템)
- 후행 태스크: UI-023 (뱃지 탭 시 근거 출처 표시)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Badge 컴포넌트 작성** — `src/components/badge/badge-indicator.tsx` (Client Component)
  - Props:
    - `grade: 'APPROVED' | 'CAUTION' | 'NOT_APPROVED' | 'UNREGISTERED'`
    - `ingredientName: string`
    - `description?: string` (공전 원문 또는 미등재 사유)
    - `onTap?: () => void` (출처 표시 트리거, UI-023 연동)
- [ ] **컬러 코딩 디자인**
  ```
  APPROVED      → 초록 (#16A34A / green-600) + ✅ 체크 아이콘 + "인정"
  CAUTION       → 노랑 (#CA8A04 / yellow-600) + ⚠️ 경고 아이콘 + "주의"
  NOT_APPROVED  → 빨강 (#DC2626 / red-600) + ❌ 금지 아이콘 + "미인정"
  UNREGISTERED  → 회색 (#6B7280 / gray-500) + ❓ 물음표 아이콘 + "미등재"
  ```
- [ ] **뱃지 내부 구조**
  - 아이콘 (좌측)
  - 등급 라벨 (예: "인정", "주의")
  - 성분명 (예: "비타민 D3")
  - 공전 원문 1줄 요약 (최대 50자, 말줄임)
- [ ] **미등재 원료 특수 처리 (REQ-FUNC-014)**
  - 회색 라벨: "식약처 미등재 원료 — 기능성 인정 정보 없음"
  - 뱃지 대신 라벨 표시
  - 미부여 사유 **툴팁** — 마우스 호버/터치 시 사유 표시
    - `"해당 원료는 식약처 건강기능식품공전에 등재되지 않아 기능성 인정 뱃지를 부여할 수 없습니다."`
- [ ] **금지 표현 0건 보장 (REQ-FUNC-012)**
  - 뱃지 description에 질병 예방·치료 표현 렌더링 금지
  - 공전 고시 문구만 래핑
  - 프론트엔드 추가 필터: `description`에 금지 키워드 포함 시 렌더링 차단
- [ ] **애니메이션** — 뱃지 등장 시 fade-in + scale 미세 트랜지션 (200ms)
- [ ] **접근성** — `role="status"`, `aria-label="성분명 등급 뱃지"`, 색각 이상 대비 아이콘 병용
- [ ] **Storybook 스토리** — 4가지 상태 각각의 스토리 작성 (선택)
- [ ] **단위 테스트** — 각 등급별 렌더링 검증, 툴팁 동작, 금지 표현 차단

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: APPROVED 뱃지 렌더링**
- **Given**: `grade="APPROVED"`, `ingredientName="비타민 D3"` Props
- **When**: 뱃지 컴포넌트가 렌더링된다
- **Then**: 초록색 배경 + ✅ 아이콘 + "인정 · 비타민 D3"이 표시된다.

**Scenario 2: 미등재 원료 회색 라벨 + 툴팁 (REQ-FUNC-014)**
- **Given**: `grade="UNREGISTERED"`, `ingredientName="NMN"` Props
- **When**: 뱃지 영역이 렌더링된다
- **Then**: 회색 라벨 "식약처 미등재 원료 — 기능성 인정 정보 없음"이 표시되고, 터치 시 미부여 사유 툴팁이 나타난다.

**Scenario 3: 뱃지-공전 원문 1:1 매칭 (REQ-FUNC-011)**
- **Given**: 뱃지에 description이 제공된 상태
- **When**: 뱃지가 렌더링된다
- **Then**: description이 식약처 공전 원문과 1:1 매칭되며, 임의 편집된 텍스트가 아니다.

**Scenario 4: 금지 표현 0건 (REQ-FUNC-012)**
- **Given**: 모든 뱃지가 렌더링된 상태
- **When**: 금지 표현 목록(질병 예방·치료)과 대조한다
- **Then**: 금지 표현 검출 건수가 0건이다.

**Scenario 5: 뱃지 로드 시간 ≤ 1초 (REQ-FUNC-011)**
- **Given**: 뱃지 데이터가 패칭되는 상태
- **When**: 뱃지 영역이 렌더링된다
- **Then**: 뱃지 로드 시간이 p95 ≤ 1,000ms이다.

## :gear: Technical & Non-Functional Constraints
- **컬러 일관성**: shadcn/ui 테마 컬러와 일관되게 4색 팔레트 적용. 다크 모드 대응 필요.
- **색각 이상 대비**: 컬러만으로 구분하지 않고 아이콘 + 텍스트 라벨 병용 (WCAG 2.1 AA).
- **Client Component**: 툴팁, 호버, 탭 이벤트 처리를 위해 `'use client'` 디렉티브 필요.
- **재사용성**: 제품 상세 페이지(UI-020), 비교 결과 페이지(UI-011) 양쪽에서 사용 가능.

## :checkered_flag: Definition of Done (DoD)
- [ ] 4가지 상태(APPROVED, CAUTION, NOT_APPROVED, UNREGISTERED)가 올바르게 렌더링되는가?
- [ ] 미등재 원료 회색 라벨 + 툴팁이 동작하는가?
- [ ] 금지 표현 필터링이 적용되었는가?
- [ ] fade-in 애니메이션이 동작하는가?
- [ ] 접근성(aria-label, 색각 대비)이 적용되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-001 (디자인 시스템 — 컬러 팔레트, 테마)
- **Blocks**:
  - #UI-023 (뱃지 탭 → 근거 출처 표시)
  - #TEST-F2-002 (뱃지-공전 1:1 매칭 테스트)
