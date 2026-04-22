---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-042: 공유 카드 랜딩 페이지 (/share/[shareKey] — 앱 설치 불요, 3초 내 도달)"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-042] 공유 카드 랜딩 페이지
- 목적: REQ-FUNC-019/020을 충족하는 공유 수신자 랜딩 페이지를 구현한다. 카카오톡·URL 복사 경로로 유입된 사용자가 `/share/[shareKey]` 경로로 진입 시, 앱 설치·회원가입·로그인 없이 비교/제품 정보를 즉시 조회하고, "최저가 구매하기" CTA를 통해 쿠팡 제휴 링크로 전환될 수 있어야 한다. p95 ≤ 2초 렌더, 98% 랜딩 성공률(REQ-NF-017)을 달성하며, LCP ≤ 2,500ms(REQ-NF-002)와 OG 메타태그(REQ-FUNC-017)를 Server Component로 제공한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-017/019/020 (OG 메타태그, 랜딩 불요, 3초 도달)
- SRS 비기능: [`/05_SRS_v1.md#4.2`](../05_SRS_v1.md) — REQ-NF-002 (LCP 2.5s), REQ-NF-017 (공유 성공률 98%)
- SRS 제약: [`/05_SRS_v1.md#5.1 CON-2`](../05_SRS_v1.md) (마케팅/기능성 표현 금지)
- 관련 구현 태스크: [`/TASKS/F3-C-001_og_metatag_url.md`](./F3-C-001_og_metatag_url.md), [`/TASKS/F3-Q-001_share_landing_query.md`](./F3-Q-001_share_landing_query.md), [`/TASKS/UI-011_compare_result_page.md`](./UI-011_compare_result_page.md), [`/TASKS/UI-020_product_detail_page.md`](./UI-020_product_detail_page.md), [`/TASKS/COM-C-004_affiliate_click_tracking.md`](./COM-C-004_affiliate_click_tracking.md)
- 선행 태스크: **F3-C-001**(shareKey/OG), **F3-Q-001**(랜딩 쿼리), **UI-011**(비교 결과 재사용), **UI-020**(상세 재사용)
- 후행 태스크: TEST-F3-003(랜딩 성능), TEST-F3-001(OG 검증)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **페이지 라우트** — `src/app/share/[shareKey]/page.tsx` (Server Component)
  - URL: `https://{domain}/share/[shareKey]`
  - 동적 라우팅 파라미터 `shareKey`(UUID)
  - `generateMetadata()`로 OG/Twitter 메타태그 서버 생성(REQ-FUNC-017)
- [ ] **공유 카드 데이터 조회**
  - F3-Q-001 `getShareCard(shareKey)` 호출
  - 반환 타입 유니온: `ComparisonShareCard | ProductShareCard | BadgeShareCard`
  - 만료/삭제된 shareKey → 404 `notFound()`
- [ ] **공유 카드 유형별 렌더**
  1. **비교 결과 공유(`type: "compare"`)**
     - UI-011의 `<CompareResultTable>` 재사용(읽기 전용 모드)
     - 상단 배너: "{성분명} 일일 단가 비교 — {N}개 제품"
     - [최저가 구매하기] 1차 CTA(최저가 제품 쿠팡 제휴 링크, `nofollow sponsored noopener`)
  2. **제품 상세 공유(`type: "product"`)**
     - UI-020의 주요 섹션(뱃지, 성분 표, 출처 링크) 재사용
     - [이 제품 최저가 구매하기] CTA
  3. **뱃지 공유(`type: "badge"`)**
     - 뱃지 3종(UI-021) + 제품명 + 제조사
     - [자세히 보기] CTA → 제품 상세로 이동
- [ ] **CTA 버튼 그룹**
  - 1차(primary): [최저가 구매하기] — 쿠팡 제휴 링크(COM-C-004 트래킹)
  - 2차(secondary): [전체 비교 다시 보기] — 원본 비교 페이지로 이동(성분 기반)
  - 3차(link): [공유 서비스 홈] — 메인으로 이동
- [ ] **OG/Twitter 메타태그 (REQ-FUNC-017)**
  - `og:title`, `og:description`, `og:image`, `og:url` 4요소 필수
  - Twitter Card: `summary_large_image`
  - 이미지: 공유 카드 유형별 동적 OG 이미지(Next.js `ImageResponse` OG API)
  - 길이 제한: title ≤ 60자, description ≤ 160자(F3-C-001 검증)
- [ ] **로그인/가입 차단 UI 부재 (REQ-FUNC-019)**
  - 페이지 어디에도 로그인/가입 강제 요소 없음
  - 상단 navbar도 "로그인" 버튼은 제공하되 "필수" 어디에도 노출 금지
- [ ] **Kakao In-App Browser 호환성**
  - `user-agent`에 "KAKAOTALK" 포함 감지 시 특수 처리 불필요(일반 HTML 충분)
  - Kakao 내부 브라우저가 CSS Grid 구버전 이슈 없도록 Flexbox/CSS 기본 기능만 사용 검증
- [ ] **LCP 최적화 (REQ-NF-002 ≤ 2,500ms)**
  - Server Component로 초기 HTML 완전 렌더
  - 핵심 컨텐츠(상단 CTA + 비교 테이블) above-the-fold 우선 순위
  - 이미지 `<Image priority>` LCP 후보 지정
  - 불필요한 JS 번들 제거(읽기 전용 → 최소 hydration)
- [ ] **분석 이벤트**
  - Mixpanel: `share_landing_view`(share_key, card_type, utm_source="kakao|url_copy")
  - [최저가 구매하기] 클릭 → `affiliate_link_click`(from="share_landing", share_key, product_id) — COM-C-004 연계
- [ ] **404 & 만료 UX**
  - `notFound()` 호출 시 친화 메시지: "이 공유 링크는 만료되었거나 존재하지 않습니다"
  - 메인 페이지 CTA 제공
- [ ] **접근성**
  - Skip Link 제공(메인 컨텐츠로)
  - 모든 CTA 버튼 aria-label 명시
  - 공유 카드 Heading 계층(h1 → h2 → h3) 일관
- [ ] **보안/개인정보**
  - shareKey는 UUID(개인 식별 불가) — F3-C-001 책임
  - 조회 로그는 shareKey 단위 익명 집계만
- [ ] **CON-2 준수**: 랜딩 UI 어디에도 "추천/베스트/효과" 등 마케팅 표현 금지. 기능 설명만.

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-019 — 로그인/가입 없이 조회**
- **Given**: 비로그인 사용자가 `/share/{validKey}` 진입
- **When**: 페이지 렌더
- **Then**: 로그인/가입 강제 UI 없이 공유 카드가 완전 렌더된다.

**Scenario 2: REQ-FUNC-020 — 3초 이내 랜딩**
- **Given**: 카카오톡에서 공유 링크 탭
- **When**: 네트워크 조건(4G 모바일) 기준 초기 렌더
- **Then**: p95 ≤ 2,000ms(REQ-NF-002 보다 엄격한 내부 목표), 체감 3초 이내 주요 콘텐츠 가시화.

**Scenario 3: REQ-FUNC-017 — OG 메타태그 4요소**
- **Given**: shareKey = valid
- **When**: `GET /share/{shareKey}` HTML 응답 head 파싱
- **Then**: `og:title`, `og:description`, `og:image`, `og:url`이 모두 존재한다.

**Scenario 4: 만료/잘못된 shareKey**
- **Given**: shareKey = invalid 또는 만료
- **When**: 페이지 진입
- **Then**: 404 페이지 "이 공유 링크는 만료되었거나 존재하지 않습니다" + [메인으로] CTA가 표시된다.

**Scenario 5: 비교 카드 CTA 동작**
- **Given**: `type="compare"` 카드
- **When**: [최저가 구매하기] 탭
- **Then**: 쿠팡 제휴 링크로 새 탭 이동 + Mixpanel `affiliate_link_click`(from="share_landing") 발송.

**Scenario 6: 제휴 링크 속성 검증 (CON-2 관련)**
- **Given**: 비교 카드 [최저가 구매하기] 앵커 태그
- **When**: DOM 검사
- **Then**: `rel="nofollow sponsored noopener"` 속성이 모두 포함되고, `target="_blank"`이다.

**Scenario 7: Kakao In-App Browser 호환**
- **Given**: `User-Agent`에 "KAKAOTALK" 포함
- **When**: 페이지 렌더
- **Then**: 레이아웃 깨짐 없이 모든 CTA가 탭 가능하다.

**Scenario 8: REQ-NF-017 — 98% 랜딩 성공률**
- **Given**: 최근 30일 `share_landing_view` 대비 공유 발송 수(`kakao_share_send` success)
- **When**: 비율 집계
- **Then**: 랜딩 도달 성공률이 ≥ 98%이다.

**Scenario 9: LCP ≤ 2,500ms**
- **Given**: WebPageTest 모바일 4G 환경
- **When**: 공유 카드 페이지 로드
- **Then**: LCP 요소가 2,500ms 이내에 표시된다.

**Scenario 10: CON-2 — 마케팅 표현 0건**
- **Given**: 랜딩 페이지 DOM
- **When**: 금지 표현 스캔(추천/베스트/효과/치료 등)
- **Then**: 어떤 금지 표현도 매칭되지 않는다(F2-C-002 가드와 동일 규칙).

## :gear: Technical & Non-Functional Constraints
- **Next.js App Router Server Component**: 초기 HTML 완전 렌더. Client Component는 CTA 인터랙션·트래킹에만 한정.
- **REQ-NF-002 LCP ≤ 2.5s**: `generateMetadata` + Server Component SSR + Supabase Edge 조회로 TTFB 최소화. 이미지는 `priority` + AVIF/WebP 자동 변환.
- **REQ-FUNC-017 OG 메타태그**: 4요소 + HTTPS + 서비스 고정 로고. 길이 검증은 F3-C-001에서 사전 보장.
- **REQ-FUNC-019 무가입**: RLS/세션 의존 쿼리 없음. 공유 카드 스냅샷만 조회.
- **REQ-FUNC-020 3초 랜딩**: 네트워크 + 서버 + 렌더 합계 목표. CDN 캐시 헤더 `s-maxage=300, stale-while-revalidate=600` 적용.
- **CON-2 마케팅 표현 금지**: 모든 카피는 F2-C-002 규칙 대상. Server Component 렌더 시 validator 1회 통과 후 배포.
- **shareKey 보안**: UUID v4, 예측 불가. 만료 기간 90일(F3-C-001 정책).
- **캐싱**: `revalidate = 300` Next.js 캐싱. shareKey가 만료되면 캐시도 자동 무효.
- **분석 프라이버시**: Mixpanel 이벤트에 user agent 외 식별자 미포함.
- **접근성**: Skip Link, 의미적 Heading, 키보드 포커스 순서 명확.
- **i18n**: 모든 UI 문구 i18n 키 관리, SEO OG 메타태그도 언어 분기 대응.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] Server Component로 초기 HTML 완전 렌더되는가?
- [ ] 공유 카드 3유형(compare/product/badge)이 모두 동작하는가?
- [ ] OG 메타태그 4요소 + Twitter Card가 생성되는가?
- [ ] 로그인/가입 요구 UI가 0건인가?
- [ ] 제휴 링크 `rel="nofollow sponsored noopener"` + `target="_blank"` 적용?
- [ ] 만료/무효 shareKey에서 404 UX 제공?
- [ ] LCP ≤ 2,500ms가 Lighthouse/WebPageTest로 검증됨?
- [ ] Kakao In-App Browser에서 레이아웃 정상?
- [ ] CON-2 금지 표현 스캐너가 통과?
- [ ] Mixpanel `share_landing_view`, `affiliate_link_click` 이벤트 발송?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F3-001, TEST-F3-003이 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #F3-C-001(shareKey/OG), #F3-Q-001(랜딩 쿼리), #UI-011/UI-020(재사용 블록), #COM-C-004(어필리엇 트래킹)
- **Blocks**:
  - #TEST-F3-001 (OG 메타태그 유효성)
  - #TEST-F3-003 (랜딩 p95 ≤ 2초, 성공률 98%)

## :bookmark_tabs: Notes
- 이 페이지는 "첫 인상"이다. Viral Loop의 수신자가 처음 보는 화면이므로, 로그인 요구·팝업·스크롤 방해 요소 모두 금지. LCP 2.5초는 이탈률과 직결된다.
- 공유 카드 유형(compare/product/badge)에 따라 CTA 문구와 OG 이미지가 다르므로, F3-C-001에서 유형 정보를 포함한 메타데이터를 생성해야 한다.
- 공유 카드는 "스냅샷"이다. 공유 시점의 가격·뱃지 상태를 보존하고, 현재와 다를 경우 "데이터 업데이트됨" 배너로 사용자를 원본 페이지로 안내(Phase 2 검토).
- Kakao In-App Browser는 결제 플로우에서 과거 이슈가 많았다. CTA 이동 시 `window.open(href, "_blank")` 대신 일반 `<a target="_blank">` 사용 권장.
- 공유 링크의 만료(90일)는 데이터 가격의 현재성 보장을 위한 최소 기준. 만료된 링크가 여전히 카톡에 남아있을 때 친화적 404로 회복 경로 제공이 중요.
