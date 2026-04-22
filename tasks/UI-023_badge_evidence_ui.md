---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-023: 뱃지 탭 시 근거 출처(공전 URL/논문 DOI) 표시 UI"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-023] 뱃지 근거 출처 표시 UI
- 목적: 사용자가 팩트체크 뱃지를 탭했을 때, 해당 뱃지의 근거 출처(식약처 공전 URL 또는 논문 DOI)를 인라인으로 표시하여, 1탭으로 원문에 도달할 수 있도록 한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-015 (뱃지 근거 출처, 1탭 도달)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.4`](../05_SRS_v1.md) — BADGE.evidence_source, BADGE.evidence_url
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **UI-021** (뱃지 컴포넌트)
- 후행 태스크: TEST-F2-002 (뱃지-공전 매칭 테스트)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **BadgeEvidence 컴포넌트 작성** — `src/components/badge/badge-evidence.tsx` (Client Component)
  - Props:
    - `evidenceType: 'MFDS' | 'PAPER' | 'MANUFACTURER'`
    - `evidenceUrl: string` (외부 링크)
    - `evidenceLabel: string` (표시 텍스트, 예: "식약처 건강기능식품공전")
    - `isExpanded: boolean`
- [ ] **토글 인터랙션** — 뱃지 컴포넌트(UI-021)의 `onTap` 이벤트와 연동
  - 탭 시 뱃지 아래에 출처 정보 슬라이드 다운 (200ms transition)
  - 재탭 시 접힘
- [ ] **출처 유형별 표시**
  - **MFDS (식약처)**: 🏛️ 아이콘 + "식약처 건강기능식품공전" 텍스트 + 외부 링크 아이콘
  - **PAPER (논문)**: 📄 아이콘 + "DOI: 10.xxxx/journal.123" 텍스트 + 외부 링크 아이콘
  - **MANUFACTURER (제조사)**: 🏭 아이콘 + "제조사 라벨 원본" 텍스트
- [ ] **외부 링크 처리** — `target="_blank"`, `rel="noopener noreferrer"`
  - 동일 페이지 이탈 방지
  - 링크 색상: shadcn/ui `text-primary` (파란색 계열 밑줄)
- [ ] **접근성** — `aria-expanded`, `aria-controls`, 키보드 Enter/Space 토글
- [ ] **단위 테스트** — 각 출처 유형 렌더링, 토글 동작, 외부 링크 속성

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 뱃지 탭 시 출처 표시 (REQ-FUNC-015)**
- **Given**: APPROVED 뱃지가 표시된 상태
- **When**: 사용자가 뱃지를 탭한다
- **Then**: 해당 뱃지의 근거 출처(식약처 공전 URL 또는 논문 DOI)가 뱃지 아래에 표시된다.

**Scenario 2: 1탭 출처 도달**
- **Given**: 출처 정보가 표시된 상태
- **When**: 사용자가 출처 링크를 탭한다
- **Then**: 새 탭에서 식약처 공전 URL 또는 논문 DOI 페이지가 열린다.

**Scenario 3: 토글 접힘/펼침**
- **Given**: 출처 정보가 펼쳐진 상태
- **When**: 사용자가 뱃지를 다시 탭한다
- **Then**: 출처 정보가 슬라이드 업으로 접힌다.

**Scenario 4: 미등재 원료 — 출처 미표시**
- **Given**: `grade="UNREGISTERED"` 뱃지
- **When**: 뱃지를 탭한다
- **Then**: 근거 출처 대신 미등재 사유 툴팁(UI-021)만 표시된다.

## :gear: Technical & Non-Functional Constraints
- **Client Component**: 탭 인터랙션, 토글 상태 관리를 위해 `'use client'` 필수.
- **트랜지션**: 200ms ease-out 슬라이드 다운. Tailwind `transition-all duration-200`.
- **외부 링크 보안**: `rel="noopener noreferrer"` 필수 (보안 + SEO best practice).
- **렌더링 위치**: UI-021 뱃지 컴포넌트 바로 아래에 조건부 렌더링.

## :checkered_flag: Definition of Done (DoD)
- [ ] 뱃지 탭 시 출처 정보가 표시되는가?
- [ ] 3가지 출처 유형(MFDS, PAPER, MANUFACTURER)이 각각 올바르게 렌더링되는가?
- [ ] 토글 접힘/펼침이 애니메이션과 함께 동작하는가?
- [ ] 외부 링크가 새 탭에서 열리는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-021 (뱃지 컴포넌트 — `onTap` 이벤트 연동)
- **Blocks**: #TEST-F2-002 (뱃지-공전 매칭 테스트 — 출처 UI 필요)
