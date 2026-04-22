---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-011: 1일 단가 비교 결과 페이지 — 정렬 테이블 + 실지불가 컬럼 + 제휴 구매 링크 버튼"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-011] 1일 단가 비교 결과 페이지
- 목적: REQ-FUNC-005(1일 단가 오름차순 정렬), REQ-FUNC-009(제휴 구매 링크 표시), UC-02~04의 핵심 화면을 구현한다. Super-Calc API(`GET /api/v1/compare`) 응답을 테이블·카드로 렌더링하고, 각 행에 제품명, 1일 단가, 실지불가(배송비/관세 포함), 용량·총 복용일, 뱃지 요약, 쿠팡 파트너스 딥링크 "최저가 구매" 버튼을 제공한다. 쿠팡 캐시 폴백 시 UI-012의 기준 시각 인라인 표시를 포함한다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001~006, 009
- SRS 비기능: [`/05_SRS_v1.md#4.2.1 Performance`](../05_SRS_v1.md) — REQ-NF-001 (p95 ≤ 3,500ms)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5`](../05_SRS_v1.md) — UC-02(비교 조회), UC-03(실지불가), UC-04(제휴 구매)
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 EXT-SYS-01`](../05_SRS_v1.md) — 쿠팡 API 장애 시 캐시 표시
- SRS 내부 API: [`/05_SRS_v1.md#6.1.2 INT-API-01`](../05_SRS_v1.md) — `GET /api/v1/compare`
- 관련 구현 태스크: [`/TASKS/F1-RH-001_super_calc_route_handler.md`](./F1-RH-001_super_calc_route_handler.md), [`/TASKS/API-001_super_calc_dto.md`](./API-001_super_calc_dto.md), [`/TASKS/MOCK-001_super_calc_mock_endpoint.md`](./MOCK-001_super_calc_mock_endpoint.md), [`/TASKS/COM-C-004_affiliate_click_tracking.md`](./COM-C-004_affiliate_click_tracking.md)
- 선행 태스크: **UI-002**, **UI-004**, **MOCK-001**, **API-001**
- 후행 태스크: UI-012(캐시 시각), UI-013(미등록 CTA), UI-040(카카오 공유), UI-042(공유 랜딩)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **라우트 구성** — `src/app/compare/page.tsx` (Server Component)
  - 쿼리 파라미터: `q`(영양소명 또는 성분 ID), `sort`(기본 `daily_cost_asc`), `unregistered`(UI-013 분기 플래그)
  - `fetch('/api/v1/compare?q=...', { next: { revalidate: 60 } })` 또는 Server Action 호출
  - `src/app/compare/loading.tsx`에서 `<ComparisonRowSkeleton × 5>` 렌더
- [ ] **검색 요약 헤더** — `src/features/compare/result-header.tsx`
  - "{검색어} · 총 N건 · {정렬 기준}" 표기
  - 오른쪽에 UI-040(카카오 공유 버튼) 슬롯 노출
  - 쿠팡 캐시 폴백 시 UI-012 컴포넌트를 여기에 삽입(`<CacheTimestampBadge capturedAt={...} />`)
- [ ] **정렬 테이블(모바일: 카드 리스트)** — `src/features/compare/result-list.tsx`
  - 데스크탑: `<table>` 구조 (shadcn/ui `Table`)
    - 컬럼: 순위 / 제품명+용량 / 1일 단가 / 실지불가 / 뱃지 요약 / 구매 버튼
  - 모바일: 카드 뷰 (1일 단가를 가장 크게 강조)
  - 가상 스크롤은 MVP 범위 외(상위 50건 고정), 성능 여유 확보
- [ ] **행 컴포넌트** — `src/features/compare/product-row.tsx`
  - 제품 썸네일(있으면) + 제품명 + 브랜드 + 1회 용량(mg/IU)
  - **1일 단가(`daily_cost_krw`)** — 텍스트 크기 강조, 최저가 행은 강조색
  - **실지불가(`final_price_krw`)** — 배송비·관세·할인 반영 (REQ-FUNC-004)
  - 뱃지 요약: APPROVED/CAUTION/NOT_APPROVED 개수 아이콘 (상세는 UI-020으로 이동)
  - `<BuyButton href={affiliate_deeplink} onClick={trackAffiliateClick}>`
- [ ] **정렬 컨트롤** — `src/features/compare/sort-control.tsx`
  - 드롭다운: [1일 단가 낮은 순(기본)] / [실지불가 낮은 순] / [용량당 가격]
  - URL 쿼리 동기화(`?sort=...`)
- [ ] **제휴 링크 클릭 트래킹** — COM-C-004 연계
  - `onClick` 핸들러에서 Mixpanel `affiliate_link_click` 발송 후 window.open
  - `rel="nofollow sponsored noopener"` + `target="_blank"` 필수
- [ ] **빈 결과 / 미등록 분기**
  - `results.length === 0`: UI-013의 미등록 안내 블록 렌더
  - `unregistered=1` 쿼리: 결과 테이블 대신 UI-013 단독 렌더
- [ ] **에러 경계** — `src/app/compare/error.tsx`
  - 5xx: "일시적 장애입니다. 잠시 후 다시 시도해 주세요" + [다시 시도] 버튼
  - 네트워크: 오프라인 안내 + 재시도
- [ ] **카카오 공유 버튼 슬롯** — UI-040 위치만 확보 (구현은 UI-040)
- [ ] **분석 이벤트**
  - Mixpanel: `compare_view`(query, result_count, first_daily_cost), `affiliate_link_click`(product_id, rank)
- [ ] **접근성**
  - 테이블에 `<caption>` + `scope="col"` 헤더
  - 모바일 카드에도 "제 N위 제품" 식 스크린리더 레이블

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-005 오름차순 정렬**
- **Given**: `/compare?q=vitamin-d-1000iu` 요청으로 API가 5건 제품을 반환
- **When**: 페이지가 렌더됨
- **Then**: 1일 단가 기준 오름차순으로 정렬된 5행이 표시되고, 1위 행이 최저가 강조색을 가진다.

**Scenario 2: REQ-FUNC-004 실지불가 컬럼 표시**
- **Given**: API 응답이 `final_price_krw` 필드를 포함
- **When**: 테이블이 렌더됨
- **Then**: 각 행에 실지불가(배송비/관세 포함) 값이 "₩12,340" 형식으로 표시되며, 1일 단가와 시각적으로 구분된다.

**Scenario 3: REQ-FUNC-009 제휴 딥링크**
- **Given**: 각 행이 `affiliate_deeplink`를 가진 상태
- **When**: 사용자가 "최저가 구매" 버튼 탭
- **Then**: `rel="nofollow sponsored noopener"` + `target="_blank"`로 새 탭이 열리고 Mixpanel `affiliate_link_click`이 발송된다.

**Scenario 4: 정렬 기준 전환**
- **Given**: 기본 정렬(1일 단가)로 렌더된 상태
- **When**: 사용자가 드롭다운에서 "실지불가 낮은 순" 선택
- **Then**: URL이 `?sort=final_price_asc`로 변경되고 리스트가 즉시 재정렬된다.

**Scenario 5: 로딩 중 스켈레톤**
- **Given**: 사용자가 검색 후 `/compare`로 이동
- **When**: 데이터가 페치 중
- **Then**: `<ComparisonRowSkeleton × 5>`가 즉시 표시되고 응답 도착 시 실제 결과로 교체된다.

**Scenario 6: 쿠팡 캐시 폴백 시 기준 시각**
- **Given**: API 응답 `source === "cache"`
- **When**: 결과가 렌더됨
- **Then**: 상단에 UI-012의 `<CacheTimestampBadge>`가 "쿠팡 가격은 YYYY-MM-DD HH:MM 기준입니다" 문구로 노출된다.

**Scenario 7: 미등록 성분 검색**
- **Given**: API 응답 `results.length === 0` + `is_registered === false`
- **When**: 페이지가 렌더됨
- **Then**: 테이블 대신 UI-013의 [제품 등록 요청하기] CTA 블록이 표시된다.

**Scenario 8: 5xx 에러 경계**
- **Given**: API가 500 반환
- **When**: 페이지가 렌더됨
- **Then**: `src/app/compare/error.tsx`가 친화적 메시지와 [다시 시도] 버튼을 노출하고, 페이지 크래시가 사용자에게 보이지 않는다.

**Scenario 9: 모바일 카드 뷰 전환**
- **Given**: 뷰포트 < 640px
- **When**: 페이지가 렌더됨
- **Then**: 테이블이 아닌 카드 리스트로 렌더되고 1일 단가가 가장 큰 타이포로 강조된다.

**Scenario 10: REQ-NF-001 p95 ≤ 3,500ms**
- **Given**: 50건 부하 테스트 시나리오
- **When**: 서버 응답 포함 전체 렌더 시간 측정
- **Then**: p95가 3,500ms 이하다(TEST-F1-006 통합).

## :gear: Technical & Non-Functional Constraints
- **REQ-NF-001 p95 ≤ 3,500ms**: Server Component 우선, 최소 JS 번들. 하이드레이션 대상은 정렬 컨트롤·구매 버튼 onClick 정도로 한정.
- **REQ-FUNC-010 광고/리뷰/별점 0건**: 본 페이지에 광고 배너·사용자 리뷰·별점·체험단 UI 요소를 렌더링해서는 안 된다(CON-2). UI-051 검증 대상.
- **금액 포맷**: `Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })` 일관 사용.
- **제휴 링크 법적 표기**: `rel="nofollow sponsored noopener"` 필수(REQ-FUNC-009, 네이티브 광고 대응).
- **빈 상태 처리**: 0건 결과 = UI-013 진입점. 사용자가 막다른 길에 빠지지 않도록.
- **접근성**: 테이블 caption, 스크린리더용 순위 안내(`<span className="sr-only">1위</span>`), 포커스 링 명시.
- **SEO**: Server Component + metadata API로 `<title>` "{검색어} 1일 단가 비교 - 서비스명" 생성.
- **URL 기반 상태**: `q`, `sort`는 URL에, 정렬 변경 시 `router.replace`로 히스토리 오염 방지.
- **캐시 계층**: `fetch(..., { next: { revalidate: 60 } })`로 Vercel ISR 60초 revalidate.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] Server Component 기반으로 초기 렌더가 수행되는가?
- [ ] 데스크탑 테이블 / 모바일 카드 반응형이 동작하는가?
- [ ] 정렬 드롭다운이 URL 쿼리와 동기화되는가?
- [ ] 제휴 링크에 `nofollow sponsored noopener` 속성이 적용되는가?
- [ ] UI-012/UI-013 슬롯 통합이 완료되었는가?
- [ ] 로딩 스켈레톤, 에러 경계, 빈 상태 3종 모두 동작하는가?
- [ ] Mixpanel `compare_view`, `affiliate_link_click` 이벤트가 발송되는가?
- [ ] 광고/리뷰/별점 요소가 0건인가(UI-051 검증 통과)?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-002(레이아웃), #UI-004(스켈레톤), #MOCK-001(Mock), #API-001(DTO), #F1-RH-001(API 조립)
- **Blocks**:
  - #UI-012 (캐시 기준 시각 인라인 표시)
  - #UI-013 (미등록 성분 CTA 렌더 진입점)
  - #UI-040 (카카오 공유 버튼)
  - #UI-042 (공유 카드 랜딩 페이지)
  - #TEST-F1-006 (Super-Calc E2E 테스트)

## :bookmark_tabs: Notes
- 본 페이지는 서비스 핵심 퍼널의 "비교 결과"이며 CTR·구매 전환율에 직결된다. UI 최적화는 MVP 이후에도 지속적으로 실험(A/B)한다.
- MVP에서는 상위 50건 고정 — 정렬·필터 복잡도 증가는 Phase 2 이후(무한 스크롤·고급 필터) 도입 검토.
- `affiliate_deeplink`는 쿠팡 파트너스 규약에 따라 링크 조작·리라이트 금지. Backend(F1-Q-001)에서 받은 URL을 그대로 사용한다.
- "광고·리뷰·별점 0건"은 법적·브랜드 포지셔닝 제약이다(CON-2). 본 페이지의 DOM 스냅샷 테스트로 REQ-FUNC-010을 보장한다(UI-051, TEST-F2-001).
