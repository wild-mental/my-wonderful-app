---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-012: 1일 단가 비교 결과 — 쿠팡 캐시 데이터 사용 시 기준 시각 인라인 표시 UI"
labels: 'feature, ui, epic:E-UI, priority:medium, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-012] 쿠팡 캐시 데이터 사용 시 기준 시각 인라인 표시 컴포넌트
- 목적: 쿠팡 파트너스 API(EXT-SYS-01) 장애 시 폴백으로 PRICE_SNAPSHOT 캐시가 반환될 때, 사용자가 "가격이 실시간이 아닐 수 있음"을 즉시 인지하도록 기준 시각을 인라인 배너·배지 형태로 표시한다(§3.1.1 EXT-SYS-01 폴백). 문구는 SRS 예시 "쿠팡 가격은 [YYYY-MM-DD HH:MM] 기준입니다. 실시간 가격은 확인 중입니다."를 사용한다. 신뢰성(E2 페르소나의 핵심 니즈)을 지탱하는 투명성 장치다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 External System Fallback`](../05_SRS_v1.md) — EXT-SYS-01 쿠팡 캐시 폴백 + 인라인 표시 문구
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1.1 External System Dependency`](../05_SRS_v1.md) — EXT-SYS-01 쿠팡 파트너스 API
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1`](../05_SRS_v1.md) — REQ-FUNC-001 AC
- 관련 구현 태스크: [`/TASKS/F1-Q-002_price_snapshot_fallback.md`](./F1-Q-002_price_snapshot_fallback.md), [`/TASKS/F1-RH-001_super_calc_route_handler.md`](./F1-RH-001_super_calc_route_handler.md), [`/TASKS/DATA-004_price_snapshot_schema.md`](./DATA-004_price_snapshot_schema.md)
- 선행 태스크: **UI-011** (비교 결과 페이지)
- 후행 태스크: UI-042(공유 랜딩에도 동일 표시 필요)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **컴포넌트 구현** — `src/features/compare/cache-timestamp-badge.tsx`
  - props: `{ capturedAt: string; source: "cache" | "live"; className?: string }`
  - `source === "live"`: 렌더 스킵(null 반환)
  - `source === "cache"`: 배너/배지 렌더
- [ ] **문구 및 포맷**
  - 기본: "쿠팡 가격은 {YYYY-MM-DD HH:MM} 기준입니다. 실시간 가격은 확인 중입니다."
  - i18n 키: `compare.fallback.coupangCacheTimestamp`
  - 시간 포맷: `date-fns`의 `format(capturedAt, 'yyyy-MM-dd HH:mm', { locale: ko })` 또는 `Intl.DateTimeFormat('ko-KR')`
  - 상대 시간 보조(선택): "(N시간 전)" — 2시간 이상이면만 추가 표기
- [ ] **시각 디자인 (shadcn/ui Alert 기반)**
  - variant: `default`(info) — 파랑/회색 톤, 경고(yellow)까지는 불필요(가격 신뢰 훼손 과잉)
  - 아이콘: `Info` lucide-react
  - 모바일: 결과 헤더 바로 아래 `w-full`
  - 데스크탑: 동일 위치, `max-w-4xl mx-auto`
- [ ] **노출 위치** — UI-011 결과 헤더 아래 삽입 지점 정의
  - `<ResultHeader />` 직후, `<ResultList />` 이전
  - UI-042(공유 랜딩)에도 동일 컴포넌트 재사용 가능
- [ ] **접근성**
  - `role="status"` + `aria-live="polite"` (페이지 로드 시 스크린리더가 "캐시 데이터 사용 중" 읽음)
  - 시맨틱: `<aside aria-label="데이터 기준 시각 안내">` 구조
- [ ] **호버/탭 시 상세 툴팁(선택)**
  - 데스크탑 호버 / 모바일 탭 시 shadcn/ui `Tooltip`으로 보조 문구 노출
  - "쿠팡 파트너스 API가 일시적으로 응답하지 않아 최근 수집된 가격을 표시하고 있습니다."
- [ ] **시간 경과 경고 (선택 확장)**
  - 48시간(TTL 기본값의 2배) 이상 경과 시 variant를 `warning`으로 승격 + 문구 추가: "데이터가 오래되어 가격이 크게 달라졌을 수 있습니다"
  - 쿠팡 API가 장기 장애인 경우의 사용자 보호
- [ ] **분석 이벤트**
  - Mixpanel: `fallback_impression`(source=cache, age_hours) — 폴백 노출 빈도 모니터링
- [ ] **단위 테스트**
  - `source === "live"`에서 null 반환 검증
  - 시각 포맷 스냅샷
  - 48시간 초과 시 warning 승격

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 캐시 폴백 시 배너 노출**
- **Given**: API 응답 `source === "cache"`, `captured_at === "2026-04-18T08:30:00+09:00"`
- **When**: 비교 결과 페이지가 렌더됨
- **Then**: 결과 헤더 아래에 "쿠팡 가격은 2026-04-18 08:30 기준입니다. 실시간 가격은 확인 중입니다." 문구가 노출된다.

**Scenario 2: 라이브 데이터에서는 미노출**
- **Given**: API 응답 `source === "live"`
- **When**: 페이지가 렌더됨
- **Then**: `<CacheTimestampBadge>`가 DOM에 렌더되지 않는다(null 반환).

**Scenario 3: 시각 포맷 정확성 (KST)**
- **Given**: `capturedAt="2026-04-17T23:30:00Z"`(UTC)
- **When**: 배너가 렌더됨
- **Then**: 한국어 로케일·KST 기준 "2026-04-18 08:30"으로 표시된다.

**Scenario 4: 48시간 경과 경고**
- **Given**: `capturedAt`이 현재로부터 50시간 전
- **When**: 페이지가 렌더됨
- **Then**: variant가 `warning`으로 승격되고 "데이터가 오래되어..." 보조 문구가 추가된다.

**Scenario 5: 접근성 — 스크린리더 안내**
- **Given**: 스크린리더가 활성화된 상태
- **When**: 페이지가 로드됨
- **Then**: `role="status"` + `aria-live="polite"`로 "캐시 데이터 사용 중 / 2026-04-18 08:30 기준"이 읽힌다.

**Scenario 6: 공유 랜딩 페이지 재사용**
- **Given**: UI-042(공유 카드 랜딩)에서 동일 API를 호출, `source === "cache"`
- **When**: 랜딩 페이지가 렌더됨
- **Then**: 본 컴포넌트가 동일한 문구/디자인으로 재사용 노출된다.

**Scenario 7: Mixpanel 노출 이벤트**
- **Given**: 배너가 렌더된 상태
- **When**: 컴포넌트가 마운트
- **Then**: `fallback_impression` 이벤트가 1회 발송되고 `age_hours` 속성이 포함된다.

## :gear: Technical & Non-Functional Constraints
- **투명성·신뢰성(E2 페르소나)**: 폴백 사실을 숨기지 않고 즉시 인지 가능한 위치·문구를 사용한다. 배너는 사용자가 스크롤하지 않아도 보이는 영역에 배치.
- **문구 원문 준수(CON-2 관련)**: "쿠팡 가격은 [YYYY-MM-DD HH:MM] 기준입니다. 실시간 가격은 확인 중입니다." — SRS 예시 문구를 변형 금지. i18n 키로 관리.
- **색상 선택**: warning(노랑) 대신 기본 info(회색/파랑). 과도한 경고는 구매 전환율 저해. 단, 48시간 초과 시 warning으로 자동 승격.
- **시간 포맷 일관성**: 서비스 전반의 날짜 포맷(`date-fns` + `ko` locale)과 통일.
- **null 반환 원칙**: live 응답에서 아무 렌더도 남기지 않아야 함(레이아웃 이동 방지).
- **i18n·확장성**: 영어 지원 추후 도입 대비 문구는 i18n 키로 관리.
- **타임존**: Server가 ISO 8601로 전달하고 클라이언트가 KST로 변환.
- **번들 크기**: `date-fns`는 tree-shaking으로 필요한 함수만 import.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] `source === "cache"`에서만 렌더, `"live"`에서는 null 반환?
- [ ] 문구가 SRS 원문과 일치하는가 (i18n 키 등록)?
- [ ] 시각이 KST 기준으로 정확히 표시되는가?
- [ ] 48시간 경과 시 warning 승격이 동작하는가?
- [ ] UI-011, UI-042 양쪽에서 재사용되는가?
- [ ] `role="status"` + `aria-live="polite"` 접근성 적용?
- [ ] Mixpanel `fallback_impression` 이벤트가 발송되는가?
- [ ] 단위 테스트가 GREEN인가(시각 포맷, null 반환, warning 승격)?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-011 (비교 결과 페이지의 삽입 지점)
- **Blocks**:
  - #UI-042 (공유 랜딩 페이지의 동일 노출)
  - REQ-FUNC-001 AC의 "캐시 시 기준 시각 인라인 표시" 충족

## :bookmark_tabs: Notes
- 본 컴포넌트는 기능적으로는 단순하지만 사용자 신뢰를 유지하는 "투명성 장치"이므로 문구·색상·위치가 디자인·법무 양쪽의 합의 산출물이다. 임의 수정 금지.
- 장기 장애(예: 1주일 이상) 시나리오는 별도 운영 정책(가격 비교 기능 잠시 중단 공지)과 연결되어야 한다. 본 UI는 그 신호를 48시간 경계로 먼저 알리는 역할까지 담당.
- API 응답에서 `source`, `captured_at` 두 필드가 안정적으로 제공되어야 한다(API-001 계약). 두 필드 누락 시 본 컴포넌트는 안전하게 null 반환하고 Sentry 경고를 남긴다.
