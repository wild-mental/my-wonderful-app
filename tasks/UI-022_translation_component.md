---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-022: 전문 용어 일상어 번역 괄호 표시 컴포넌트"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-022] 전문 용어 → 일상어 번역 괄호 표시 컴포넌트
- 목적: 성분 전문 용어(예: "콜레칼시페롤") 옆에 일상어 번역(예: "몸에 잘 흡수되는 비타민 D3")을 괄호 형태로 표시하는 인라인 UI 컴포넌트를 구현한다. 정보 비대칭을 해소하여 비전문가 사용자의 이해도를 높인다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-013 (일상어 번역, 정확도 ≥ 98%)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2`](./06_TASK_LIST_v1.md)
- 백엔드 로직: [`/TASKS/F2-C-003_common_language_translation.md`](./F2-C-003_common_language_translation.md) — 번역 매핑 데이터 원천
- 선행 태스크: **UI-001** (디자인 시스템)
- 후행 태스크: TEST-F2-004 (번역 커버리지 ≥ 95% 테스트)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **TranslatedTerm 컴포넌트 작성** — `src/components/ingredient/translated-term.tsx`
  - Props:
    - `technicalName: string` (전문 용어)
    - `commonName?: string` (일상어 번역, 없으면 미표시)
    - `highlight?: boolean` (강조 여부)
- [ ] **렌더링 규칙**
  - 번역 존재 시: `콜레칼시페롤 (몸에 잘 흡수되는 비타민 D3)`
  - 번역 미존재 시: `콜레칼시페롤` (괄호 없이 전문 용어만)
  - 전문 용어: 기본 폰트 + bold
  - 일상어 번역: 보조 색상 + 괄호 + 약간 작은 폰트 사이즈
- [ ] **인터랙션** — 일상어 번역 텍스트를 추가 설명 팝오버로 확장 (선택적)
  - 터치/클릭 시 말풍선 팝오버: 번역 근거(식약처 등재명 등) 표시
  - MVP에서는 단순 텍스트 표시만으로 충분
- [ ] **성분 목록 통합** — 제품 상세 페이지(UI-020)의 성분 테이블 내 인라인 사용
  - 각 성분 행: `[뱃지] | [전문명 (일상어)] | [함량]`
- [ ] **접근성** — `<abbr title="일상어 번역">전문 용어</abbr>` 시맨틱 태그 활용
- [ ] **단위 테스트** — 번역 존재/미존재 렌더링 검증

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 전문 용어 + 일상어 번역 표시 (REQ-FUNC-013)**
- **Given**: `technicalName="콜레칼시페롤"`, `commonName="몸에 잘 흡수되는 비타민 D3"` Props
- **When**: TranslatedTerm 컴포넌트가 렌더링된다
- **Then**: `콜레칼시페롤 (몸에 잘 흡수되는 비타민 D3)` 형태로 표시된다.

**Scenario 2: 번역 미존재 시 전문 용어만 표시**
- **Given**: `technicalName="퀘르세틴"`, `commonName=undefined` Props
- **When**: TranslatedTerm 컴포넌트가 렌더링된다
- **Then**: `퀘르세틴`만 표시되며, 괄호나 빈 공간이 렌더링되지 않는다.

**Scenario 3: 번역 커버리지 ≥ 95% (REQ-FUNC-013)**
- **Given**: 식약처 등록 기능성 원료 전체 목록
- **When**: 성분 목록이 렌더링된다
- **Then**: 95% 이상의 전문 용어에 일상어 번역이 괄호로 표시된다.

**Scenario 4: 번역 정확도 ≥ 98% (REQ-FUNC-013)**
- **Given**: 번역 매핑 데이터가 적용된 상태
- **When**: 전문가가 QA 검수를 수행한다
- **Then**: 번역 정확도가 98% 이상이다.

## :gear: Technical & Non-Functional Constraints
- **인라인 컴포넌트**: 성분 테이블 행 내에서 인라인으로 사용. 별도 공간을 차지하지 않음.
- **폰트 계층**: 전문 용어는 `font-medium`, 일상어 번역은 `text-muted-foreground text-sm`.
- **Server Component 가능**: 인터랙션 없으면 Server Component로 구현 가능 (성능 최적화).

## :checkered_flag: Definition of Done (DoD)
- [ ] 번역 존재/미존재 케이스가 올바르게 렌더링되는가?
- [ ] 성분 테이블 내에서 인라인으로 정상 표시되는가?
- [ ] 접근성(abbr 태그)이 적용되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-001 (디자인 시스템)
- **Blocks**:
  - #UI-020 (제품 상세 페이지에서 성분 목록 내 사용)
  - #TEST-F2-004 (번역 커버리지/정확도 테스트)
