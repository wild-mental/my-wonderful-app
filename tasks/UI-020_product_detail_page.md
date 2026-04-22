---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-020: 제품 상세 페이지 — 성분 목록 + 뱃지 + 1일 단가 + 출처 버튼 + 구매 링크 통합 화면"
labels: 'feature, frontend, epic:E-UI, priority:critical, phase:5, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-020] 제품 상세 페이지 통합 화면
- 목적: 사용자가 특정 제품을 선택했을 때, 성분 목록·팩트체크 뱃지·1일 단가·출처 확인 버튼·제휴 구매 링크를 단일 페이지에 통합 표시하는 프론트엔드 페이지 컴포넌트를 구현한다. F1(가격), F2(뱃지), F4(출처)의 백엔드 데이터를 한 화면에서 소비하는 최종 통합 UI이다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-031 (성분·뱃지·단가·출처·구매 통합 표시)
- SRS Use Case: [`/05_SRS_v1.md#3.5`](../05_SRS_v1.md) — UC-05 (뱃지 조회), UC-06 (일상어 번역)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Mobile Web App (shadcn/ui + Tailwind)
- SRS 성능: [`/05_SRS_v1.md#4.2.1`](../05_SRS_v1.md) — REQ-NF-005 (LCP ≤ 2,500ms)
- SRS 마케팅 차단: [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-010 (광고/리뷰/별점/체험단 0건)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **UI-002** (공통 레이아웃), **MOCK-001** (Super-Calc Mock), **MOCK-002** (Badge Mock)
- 후행 태스크: UI-021 (뱃지 컴포넌트), UI-022 (번역 컴포넌트), UI-023 (출처 표시), UI-024 (아코디언), UI-051 (마케팅 0건 검증)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **페이지 라우트 생성** — `src/app/product/[productId]/page.tsx` (Server Component)
  - URL 패턴: `/product/{productId}`
  - `generateMetadata()` — SEO/OG 메타태그 생성 (제품명, 성분, 단가)
- [ ] **데이터 패칭** — 서버 사이드 병렬 조회
  - 가격 데이터: Super-Calc API (`/api/v1/compare?product_id=...`)
  - 뱃지 데이터: Badge API (`/api/v1/badges?product_id=...`)
  - 출처 데이터: `getDataSources(productId)` (F4-Q-001)
  - `Promise.all()` 병렬 조회로 응답 시간 최적화
- [ ] **페이지 레이아웃 구성** — 모바일 퍼스트 단일 컬럼
  1. **헤더 영역**: 제품명, 브랜드, 대표 이미지
  2. **가격 영역**: 1일 단가 (원화, 소수점 첫째 자리), 실지불가 컬럼
  3. **성분 목록 영역**: 성분 테이블 + UI-021(뱃지) + UI-022(일상어 번역)
  4. **출처 영역**: `[출처 확인]` 버튼 → UI-024(아코디언)
  5. **구매 영역**: 쿠팡 파트너스 제휴 딥링크 구매 버튼 (CTA)
  6. **오류 제보 영역**: `[오류 신고]` 버튼 → UI-030(모달)
- [ ] **마케팅 콘텐츠 0건 보장 (REQ-FUNC-010)**
  - 광고 배너: 렌더링 코드 없음
  - 유저 리뷰/별점: 렌더링 코드 없음
  - 체험단 블로그 링크: 렌더링 코드 없음
  - 마케팅 노이즈 원천 차단
- [ ] **로딩 상태** — 스켈레톤 UI (UI-004 활용)
  - 가격 로딩: 숫자 스켈레톤
  - 뱃지 로딩: 뱃지 형태 스켈레톤
  - 성분 목록 로딩: 테이블 행 스켈레톤
- [ ] **에러 상태 처리**
  - 가격 조회 실패: "가격 정보를 불러올 수 없습니다" + 재시도 버튼
  - 뱃지 조회 실패: "뱃지 정보를 불러올 수 없습니다" + 그레이스풀 디그레이드 (뱃지 없이 성분 목록만 표시)
  - 제품 미존재: 404 페이지
- [ ] **반응형 디자인** — 모바일 퍼스트 (CON-7)
  - Mobile: 단일 컬럼 풀 width
  - Tablet: 가격 + 성분 2컬럼
  - Desktop: 좌측 성분/뱃지 + 우측 가격/구매 사이드바
- [ ] **접근성** — aria-label, 시맨틱 헤딩 구조 (`<h1>` 제품명)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 제품 상세 페이지 통합 표시 (REQ-FUNC-031)**
- **Given**: 사용자가 특정 제품을 선택한 상태
- **When**: 제품 상세 페이지가 로드된다
- **Then**: 성분 목록, 뱃지, 1일 단가, 출처 확인 버튼, 제휴 구매 링크가 단일 페이지에 통합 표시된다.

**Scenario 2: 마케팅 콘텐츠 0건 (REQ-FUNC-010)**
- **Given**: 사용자가 제품 상세 페이지에 진입한 상태
- **When**: 페이지가 로드된다
- **Then**: 광고 배너, 유저 리뷰, 별점, 체험단 링크 노출이 0건이다.

**Scenario 3: LCP ≤ 2,500ms (REQ-NF-005)**
- **Given**: 모바일 웹 기준 제품 상세 페이지
- **When**: Lighthouse 측정을 수행한다
- **Then**: LCP가 2,500ms 이내이다.

**Scenario 4: 제휴 링크 동작 (REQ-FUNC-009)**
- **Given**: 단가 비교 결과가 표시된 상태
- **When**: 사용자가 "구매하기" 버튼을 탭한다
- **Then**: 쿠팡 파트너스 제휴 딥링크를 통해 결제 페이지로 이동한다.

**Scenario 5: 로딩 스켈레톤 표시**
- **Given**: 페이지 데이터가 로딩 중인 상태
- **When**: 페이지가 렌더링된다
- **Then**: 스켈레톤 UI가 표시되며, 데이터 로딩 완료 시 실제 콘텐츠로 전환된다.

## :gear: Technical & Non-Functional Constraints
- **Server Component 우선**: 초기 레이아웃과 데이터 패칭은 Server Component. 인터랙티브 요소(클릭, 토글)만 Client Component으로 분리.
- **모바일 퍼스트 (CON-7)**: 320px 뷰포트에서 깨짐 없이 렌더링.
- **디자인 시스템 (CON-10)**: shadcn/ui + Tailwind 사용. 커스텀 CSS 최소화.
- **SEO**: `generateMetadata()`로 동적 OG 태그 생성. 제품명, 가격, 성분 요약 포함.
- **성능**: 서버 사이드 병렬 패칭으로 TTFB 최적화. 이미지 lazy-load.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 성분 목록 + 뱃지 + 단가 + 출처 + 구매가 한 페이지에 통합되었는가?
- [ ] 마케팅 콘텐츠 0건이 보장되는가?
- [ ] 모바일/태블릿/데스크톱 반응형이 동작하는가?
- [ ] 로딩/에러/404 상태가 처리되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-002 (공통 레이아웃), #MOCK-001 (Super-Calc Mock), #MOCK-002 (Badge Mock)
- **Blocks**:
  - #UI-021 (뱃지 컴포넌트 — 이 페이지에서 사용)
  - #UI-022 (전문 용어 번역 — 이 페이지에서 사용)
  - #UI-023 (뱃지 출처 표시 — 이 페이지에서 사용)
  - #UI-024 (출처 확인 아코디언 — 이 페이지에서 사용)
  - #UI-051 (마케팅 0건 검증 — 이 페이지 대상)

## :bookmark_tabs: Notes
- UI-021~024는 이 페이지의 하위 컴포넌트이지만, 각각 독립 태스크로 분리하여 병렬 개발 가능.
- 초기 개발 시 Mock 데이터(MOCK-001, MOCK-002)를 활용하여 실제 API 없이 UI 개발 가능.
