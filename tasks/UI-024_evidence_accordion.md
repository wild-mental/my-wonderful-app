---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-024: [출처 확인] 아코디언 컴포넌트 (식약처 DB 링크, 라벨 이미지, 논문 DOI)"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-024] 출처 확인 아코디언 컴포넌트
- 목적: 제품 상세 페이지에서 `[출처 확인]` 버튼을 탭했을 때, 해당 제품 데이터의 원천 출처(식약처 DB 링크, 제조사 라벨 이미지, 논문 DOI)를 아코디언 메뉴로 펼쳐 표시한다. 2클릭 이내(1. 아코디언 펼침 + 2. 링크 탭)로 원문에 도달 가능하도록 설계한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-022 (2클릭 이내 출처 도달), REQ-FUNC-023 (라벨 이미지 열람)
- SRS 성능: [`/05_SRS_v1.md#4.2.1`](../05_SRS_v1.md) — REQ-NF-004 (아코디언 p95 ≤ 500ms)
- SRS Use Case: [`/05_SRS_v1.md#3.5`](../05_SRS_v1.md) — UC-09 (데이터 출처 확인)
- 백엔드 로직: [`/TASKS/F4-Q-001_data_source_query.md`](./F4-Q-001_data_source_query.md) — `DataSourceResult` 타입
- 라벨 이미지: [`/TASKS/F4-Q-002_label_archive_query.md`](./F4-Q-002_label_archive_query.md) — `LabelImage[]` 타입
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **UI-020** (제품 상세 페이지)
- 후행 태스크: UI-025 (라벨 이미지 뷰어), TEST-F4-001 (아코디언 p95 ≤ 500ms)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **EvidenceAccordion 컴포넌트 작성** — `src/components/trust/evidence-accordion.tsx` (Client Component)
  - Props:
    - `productId: string`
    - `dataSources: DataSourceResult` (F4-Q-001 데이터)
    - `labelImages: LabelImage[]` (F4-Q-002 데이터)
- [ ] **shadcn/ui Accordion 활용** — `@radix-ui/react-accordion` 기반 shadcn 컴포넌트 사용
  - `AccordionItem` 3개 구성:
    1. **식약처 DB 출처** — 성분별 식약처 공전 링크 목록
    2. **제조사 라벨 원본** — 라벨 이미지 갤러리 (UI-025)
    3. **논문/연구 출처** — DOI 링크 목록
  - 기본 상태: 모두 접힘 (사용자 명시적 탭으로만 펼침)
- [ ] **식약처 DB 출처 섹션**
  - 아이콘: 🏛️
  - 각 성분별 `evidence_url` 링크 표시
  - 링크 형태: `[성분명] — 식약처 공전 원문 ↗`
  - `target="_blank"`, 외부 링크 아이콘
- [ ] **제조사 라벨 원본 섹션**
  - 아이콘: 📋
  - 라벨 이미지 썸네일 그리드 (2열)
  - 썸네일 클릭 → 풀사이즈 이미지 모달 (UI-025)
  - 이미지 로드 시간 ≤ 1초 (REQ-FUNC-023)
  - 이미지 미등록 시: "라벨 이미지가 아직 등록되지 않았습니다."
- [ ] **논문/연구 출처 섹션**
  - 아이콘: 📄
  - DOI 링크: `doi.org/{DOI}` 형태 + 외부 링크 아이콘
  - 논문 미존재 시: "관련 논문 출처가 등록되지 않았습니다."
- [ ] **아코디언 펼침 시간 최적화** — p95 ≤ 500ms (REQ-NF-004)
  - 데이터는 UI-020에서 이미 패칭된 상태 → 추가 API 호출 없이 Props로 전달
  - 라벨 이미지: lazy-load (`loading="lazy"`)
  - CSS transition: 200ms
- [ ] **`[출처 확인]` 버튼** — UI-020 내에 배치
  - 위치: 성분 목록 하단 또는 각 성분 행 우측
  - 스타일: `variant="outline"`, 아이콘 + "출처 확인" 텍스트
  - 클릭 시 아코디언 영역으로 스크롤 + 자동 펼침
- [ ] **접근성** — `aria-expanded`, `aria-controls`, 키보드 내비게이션 (Arrow Up/Down)
- [ ] **단위 테스트** — 3개 섹션 독립 렌더링, 빈 데이터 처리, 펼침/접힘 동작

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 2클릭 이내 출처 도달 (REQ-FUNC-022)**
- **Given**: 사용자가 제품 상세 페이지에서 `[출처 확인]` 버튼을 인지한 상태
- **When**: 1) `[출처 확인]` 버튼을 탭하고, 2) 식약처 DB 링크를 탭한다
- **Then**: 2클릭으로 식약처 공전 원문 페이지에 도달한다.

**Scenario 2: 아코디언 펼침 시간 ≤ 500ms (REQ-NF-004)**
- **Given**: `[출처 확인]` 버튼이 있는 제품 상세 페이지
- **When**: 사용자가 `[출처 확인]` 버튼을 탭한다
- **Then**: 아코디언이 500ms 이내에 펼쳐지며 출처 정보가 렌더링된다.

**Scenario 3: 라벨 이미지 로드 ≤ 1초 (REQ-FUNC-023)**
- **Given**: 라벨 이미지가 등록된 제품
- **When**: "제조사 라벨 원본" 아코디언 섹션을 펼친다
- **Then**: 라벨 이미지 썸네일이 1초 이내에 로딩됩니다.

**Scenario 4: 이미지 미등록 시 안내 메시지**
- **Given**: LABEL_ARCHIVE에 이미지가 없는 제품
- **When**: "제조사 라벨 원본" 섹션을 펼친다
- **Then**: "라벨 이미지가 아직 등록되지 않았습니다." 안내가 표시된다.

**Scenario 5: 논문 미존재 시 안내 메시지**
- **Given**: 논문 DOI가 등록되지 않은 제품
- **When**: "논문/연구 출처" 섹션을 펼친다
- **Then**: "관련 논문 출처가 등록되지 않았습니다." 안내가 표시된다.

## :gear: Technical & Non-Functional Constraints
- **펼침 시간 (REQ-NF-004)**: p95 ≤ 500ms. 데이터는 서버 사이드 프리패칭 후 Props 전달로 추가 API 호출 방지.
- **이미지 최적화**: Next.js `<Image>` 컴포넌트 사용. lazy-load + 자동 포맷(WebP/AVIF).
- **shadcn/ui Accordion**: `@radix-ui/react-accordion` 기반. 접근성 내장. 커스터마이징은 Tailwind로 처리.
- **클라이언트 사이드**: 아코디언 토글 상태 관리 필요 → `'use client'`.

## :checkered_flag: Definition of Done (DoD)
- [ ] 3개 섹션(식약처, 라벨, 논문)이 독립적으로 펼침/접힘하는가?
- [ ] 2클릭 이내 원문 도달(식약처/논문)이 가능한가?
- [ ] 아코디언 펼침 시간 ≤ 500ms가 검증되었는가?
- [ ] 라벨 이미지 로드 ≤ 1초가 검증되었는가?
- [ ] 빈 데이터 시 안내 메시지가 표시되는가?
- [ ] 접근성(키보드 내비게이션, aria 속성)이 적용되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-020 (제품 상세 페이지 — 배치 및 데이터 전달)
- **Blocks**:
  - #UI-025 (라벨 이미지 뷰어 — 아코디언 내부 사용)
  - #TEST-F4-001 (아코디언 p95 ≤ 500ms 검증)
  - #TEST-F4-002 (라벨 이미지 로드 ≤ 1초 검증)
