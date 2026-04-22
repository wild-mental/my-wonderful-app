---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-010: 메인 페이지 — 검색창 + 자동완성 드롭다운 UI"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-010] 메인 페이지 — 검색창 + 자동완성 드롭다운
- 목적: REQ-FUNC-030(영양소/성분 검색) 및 UC-01의 진입점이 되는 메인 페이지 상단 검색 UI를 구현한다. 사용자가 영양소명(예: "비타민D 1000IU")을 입력하면 디바운스된 자동완성 후보가 드롭다운으로 표시되고, 선택 또는 엔터 제출 시 Super-Calc 비교 결과 페이지(UI-011)로 라우팅된다. 미등록 성분인 경우 UI-013의 CTA 블록이 즉시 노출된다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-030 (영양소 검색 + 자동완성)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1`](../05_SRS_v1.md) — REQ-FUNC-008 (미등록 성분 CTA, 300ms 이내 표시)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 UC-01`](../05_SRS_v1.md) — 영양소/성분명으로 제품 검색
- SRS 내부 API: [`/05_SRS_v1.md#6.1.2 INT-API-03`](../05_SRS_v1.md) — `GET /api/v1/search`
- 관련 구현 태스크: [`/TASKS/COM-RH-001_search_route_handler.md`](./COM-RH-001_search_route_handler.md), [`/TASKS/COM-Q-001_ingredient_search_autocomplete.md`](./COM-Q-001_ingredient_search_autocomplete.md), [`/TASKS/MOCK-003_search_mock_endpoint.md`](./MOCK-003_search_mock_endpoint.md)
- 선행 태스크: **UI-002**(레이아웃 셸), **UI-004**(로딩 스켈레톤), **MOCK-003**(검색 Mock), **API-003**(검색 DTO)
- 후행 태스크: UI-011(비교 결과), UI-013(미등록 CTA)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **메인 페이지 라우트** — `src/app/page.tsx` (Server Component)
  - Hero 영역: 서비스 한 줄 캐치프레이즈 + 검색창
  - 하단 보조 영역: 인기 영양소 태그(빠른 검색 샷컷, 예: 비타민D, 오메가3, 마그네슘)
- [ ] **검색 폼 Client Component** — `src/features/search/search-box.tsx`
  - shadcn/ui `Command` 또는 `Popover + Input` 기반 콤보박스
  - `<input type="search">` — inputmode, enterkeyhint="search"
  - 아이콘: 좌측 돋보기, 우측 clear(x)
- [ ] **자동완성 상태 훅** — `src/features/search/use-search-suggestions.ts`
  - 입력 디바운스 150ms (서버 호출 남용 방지)
  - SWR/TanStack Query로 `/api/v1/search?q=...&limit=8` 호출
  - 최소 입력 길이 1자, 공백 자동 trim
  - stale-while-revalidate + 직전 결과 유지(점멸 방지)
- [ ] **자동완성 드롭다운** — `src/features/search/suggestion-list.tsx`
  - 최대 8개 후보, 각 항목: [표준명] + [일상어] + [제품 수]
  - 하이라이트(입력어 bold)
  - 키보드 네비게이션: ArrowUp/Down, Enter 선택, Esc 닫기
  - 포커스 트랩 불필요(비모달), 그러나 `role="listbox"` + `aria-activedescendant`
- [ ] **미등록 성분 분기** — UI-013과 연계
  - 검색 결과 `isRegistered === false`일 때 드롭다운 최하단에 "[미등록] 제품 등록 요청하기" 블록 표시
  - 엔터 제출 시 → `/compare?q={term}&unregistered=1`로 이동, UI-013이 CTA 렌더
- [ ] **엔터 제출 동작**
  - 후보 선택 시: `router.push(\`/compare?q=\${suggestion.id}\`)`
  - 직접 입력 제출 시: `router.push(\`/compare?q=\${encoded}\`)`
  - 검색어 최근 기록 로컬 저장(localStorage, 최근 5개)
- [ ] **로딩/에러 상태**
  - 로딩: `<SearchResultSkeleton>` (UI-004) 드롭다운 내부 표시
  - 에러(네트워크 5xx 등): "일시적으로 자동완성이 불가합니다" 인라인 메시지 + 직접 검색 제출은 계속 허용
- [ ] **인기 성분 태그** — `src/features/search/popular-chips.tsx`
  - 5~8개 고정 태그 (관리자가 수정 가능하게 상수 관리)
  - 탭 시 검색창 값 채우고 즉시 제출
- [ ] **모바일 키보드 대응**
  - 검색창 포커스 시 화면 상단 유지 (`scrollIntoView({ block: "center" })`)
  - 하단 inset(safe-area) 확보
- [ ] **분석 이벤트**
  - Mixpanel: `search_open`, `search_submit`(query, source=chip/input/suggestion), `suggestion_click`
- [ ] **접근성**
  - 검색창 `aria-label="영양소 또는 성분명 검색"`
  - 드롭다운 `role="listbox"`, 항목 `role="option"`
  - 스크린리더 안내: "후보 N개가 표시됨"

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 자동완성 표시**
- **Given**: 사용자가 메인 페이지에서 검색창에 "비타민"을 입력
- **When**: 150ms 디바운스 후 API가 후보를 반환
- **Then**: 드롭다운에 최대 8개 후보가 표시되고, 입력어 "비타민"이 하이라이트된다.

**Scenario 2: 키보드 네비게이션**
- **Given**: 드롭다운에 5개 후보가 열려 있는 상태
- **When**: ArrowDown 2회 후 Enter
- **Then**: 2번째 후보가 선택되어 `/compare?q={id}`로 라우팅된다.

**Scenario 3: REQ-FUNC-008 미등록 성분 안내**
- **Given**: 사용자가 "NMN"(미등록 성분)을 검색
- **When**: 서버 응답이 300ms 이내 도달
- **Then**: 드롭다운 최하단에 "[미등록] 제품 등록 요청하기" 블록이 노출되고, 엔터 제출 시 UI-013 CTA로 이동한다.

**Scenario 4: 로딩 스켈레톤 표시**
- **Given**: 네트워크 지연으로 API 응답이 400ms 이상 소요
- **When**: 검색창에 입력 중
- **Then**: 드롭다운 영역에 `<SearchResultSkeleton>`이 즉시 표시되고, 응답 도착 시 교체된다.

**Scenario 5: 디바운스 적용으로 과호출 방지**
- **Given**: 사용자가 100ms 간격으로 5글자를 입력
- **When**: 타이핑 중 네트워크 로그를 관찰
- **Then**: 최종 타이핑 후 1회의 API 호출만 발생(중간 호출 cancel 또는 debounce).

**Scenario 6: 직접 입력 제출**
- **Given**: 자동완성 결과가 없거나 사용자가 후보를 선택하지 않은 상태에서 "오메가3" 입력 후 Enter
- **When**: 폼이 제출됨
- **Then**: `/compare?q=${encodeURIComponent("오메가3")}`로 라우팅된다.

**Scenario 7: Esc로 드롭다운 닫기**
- **Given**: 드롭다운이 열린 상태
- **When**: Esc 키를 누름
- **Then**: 드롭다운이 닫히고 검색창은 포커스 유지된다.

**Scenario 8: API 에러 처리**
- **Given**: `/api/v1/search`가 5xx를 반환
- **When**: 검색어를 입력
- **Then**: "일시적으로 자동완성이 불가합니다" 메시지가 인라인 표시되고 직접 제출은 계속 가능하다.

**Scenario 9: 인기 성분 chip 클릭**
- **Given**: Hero 하단 "비타민D" chip 존재
- **When**: 사용자가 chip을 탭
- **Then**: 검색창에 "비타민D"가 채워지고 자동 제출되어 `/compare?q=...&source=chip`로 이동.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-008 300ms 임계**: 미등록 성분 CTA 표시는 사용자 체감 300ms 이내. 서버 응답 자체는 ≤ 200ms를 목표(COM-Q-002 연계).
- **자동완성 최대 8개**: 모바일 한 화면 가독성 유지(WCAG 텍스트 크기 기준).
- **디바운스 150ms**: 과도한 서버 호출 방지와 응답 체감 속도의 trade-off. 조정 시 Mixpanel `search_open`→`suggestion_click` 전환율로 검증.
- **stale-while-revalidate**: 연속 입력 시 이전 결과를 유지해 리스트가 깜빡이지 않도록 한다.
- **모바일 우선**: 검색창 높이 ≥ 44px(터치 타겟), 하단 safe-area padding 적용.
- **접근성**: `role="combobox"`/`listbox`/`option` 조합을 WAI-ARIA 1.2 패턴에 맞춰 적용.
- **URL 기반 상태 공유**: 검색어는 URL 쿼리 파라미터(`q`)에 반영해 공유 가능한 URL 보장.
- **XSS 방어**: 하이라이트는 innerHTML 대신 React 요소 조합으로 구현.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] 검색 폼이 모바일·데스크탑 양쪽에서 접근 가능한가?
- [ ] 150ms 디바운스 + stale-while-revalidate가 동작하는가?
- [ ] 키보드 네비게이션(Up/Down/Enter/Esc) 완전 지원?
- [ ] 미등록 성분 분기가 UI-013과 정상 연계되는가?
- [ ] `<SearchResultSkeleton>`이 로딩 중 표시되는가?
- [ ] WAI-ARIA combobox 패턴(1.2) 적용?
- [ ] Mixpanel 이벤트 3종(`search_open`, `search_submit`, `suggestion_click`)이 발송되는가?
- [ ] `pnpm typecheck`, `pnpm lint` 모두 통과?
- [ ] `/compare?q=...` 라우팅이 UI-011과 연결되는가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-002(레이아웃), #UI-004(스켈레톤), #MOCK-003(Mock), #API-003(DTO), #COM-Q-001(검색 쿼리)
- **Blocks**:
  - #UI-011 (비교 결과 페이지 진입 경로)
  - #UI-013 (미등록 성분 CTA 렌더 위치 일부)

## :bookmark_tabs: Notes
- 상용 서비스에서 자동완성 ≤ 200ms는 체감 속도의 임계점이다. 백엔드(COM-Q-001)가 ≤ 150ms, 네트워크 ≤ 50ms를 목표로 한다.
- "인기 성분 chip"은 초기 KPI(검색→비교 전환율) 증폭에 유효. 관리자 수정 UI는 Phase 2에서 고려.
- URL `?q=` 전달 시 Base64 인코딩이 아닌 URL-encoded raw 문자열을 유지한다(공유 가독성).
- 검색창 컴포넌트는 헤더의 검색 아이콘(UI-002)에서 재사용 가능하도록 props로 variant 구분(`hero` | `header`).
