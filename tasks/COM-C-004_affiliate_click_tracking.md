---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-C-004: 제휴 링크 클릭 이벤트 Mixpanel 추적 (`affiliate_link_click`) 구현"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-C-004] 제휴 링크 클릭 Mixpanel 추적 [Command]
- 목적: SRS REQ-FUNC-033을 충족하는 제휴 링크 클릭 이벤트 추적 로직을 구현한다. 사용자가 비교 결과 페이지(UI-011)·제품 상세 페이지(UI-020)에서 쿠팡 제휴 [구매하기] 버튼을 클릭할 때 `affiliate_link_click` 이벤트를 Mixpanel로 발송하여 제휴 매출 트래킹, 페르소나별 전환율, 인기 제품 분석의 기초 데이터를 수집한다. 사용자 경험에 지연을 주지 않도록 비동기·논블로킹으로 동작해야 한다.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-033 (제휴 링크 클릭 추적)
- SRS 비기능 요구사항: [`/05_SRS_v1.md#4.2 비기능 요구사항`](../05_SRS_v1.md) — REQ-NF-022 (Mixpanel 대시보드)
- SRS 모니터링: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Mixpanel/Amplitude 분석
- SRS 비즈니스 메트릭: [`/05_SRS_v1.md#1.2 Goals & Success Metrics`](../05_SRS_v1.md) — CTR, K-Factor 추적
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩)
- 후행 태스크: COM-C-005 (카카오 공유 추적), UI-011 (비교 결과 페이지), UI-020 (제품 상세), TEST-COM-003, NFR-MON-003 (Mixpanel 대시보드 항목)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Mixpanel 클라이언트 초기화** — `src/lib/analytics/mixpanel.ts`
  - 서버 사이드: `mixpanel-node` 패키지 설치, `MIXPANEL_PROJECT_TOKEN` 환경변수 (본 태스크의 **주 트래킹 경로**)
  - 클라이언트 사이드: `mixpanel-browser` 패키지 — **본 태스크에서는 미도입**. 향후 페이지뷰 등 보조 이벤트용으로만 별도 태스크에서 검토
- [ ] **트래킹 경로 역할 분담 (확정)**
  - **1순위 (주 경로)**: Server Action 또는 Route Handler에서 `mixpanel-node`로 서버 발송 — Ad Blocker 우회·PII 가드 용이
  - **2순위 (보조)**: 페이지 언로드 시점만 `navigator.sendBeacon(/api/v1/analytics/affiliate-click, payload)` 사용. 핵심 이벤트(클릭)는 **서버 경로로만** 처리
  - **금지**: 클라이언트 Mixpanel JS 직접 발송 (본 태스크 범위 외)
- [ ] **이벤트 추적 함수** — `src/lib/analytics/track.ts`
  - `trackAffiliateLinkClick(payload: AffiliateLinkClickPayload): Promise<void>`
  - 비동기 호출, fire-and-forget 패턴 (응답 대기 없음)
  - 실패 시 silent error (사용자 경험 영향 0)
- [ ] **이벤트 페이로드 정의** — `src/types/analytics/affiliate.ts`
  - `event: 'affiliate_link_click'`
  - 필수 속성: `product_id`, `channel_id` (쿠팡 등), `daily_cost_krw`, `final_price_krw`, `clicked_at` (ISO 8601)
  - 선택 속성: `user_id` (로그인 시, 해시 처리), `session_id`, `persona_type`, `referrer_page` (search/compare/product)
  - distinct_id: 로그인 시 `sha256(user_id + SALT)`, 비로그인 시 `session_id`
- [ ] **익명 session_id 정책 (CON-4 준수)**
  - 생성 시점: 비로그인 사용자의 첫 트래킹 이벤트 발생 시
  - 저장소: HttpOnly `Secure` `SameSite=Lax` 쿠키 `sid=`
  - 수명: **30일 슬라이딩 만료** (활동 시 갱신)
  - 값: UUID v4 (예측 불가, 서버에서 발급)
  - **CON-4 준수 가드**: session_id는 **식별정보 아님**(이메일/이름/IP 미포함). NFR-SEC-002 검증 대상에 포함
  - 로그아웃 시: 기존 sid 파기 + 신규 발급
  - 옵트아웃: 사용자가 "분석 비활성" 토글 시 쿠키 미설정 + 이벤트 미발송
- [ ] **클릭 트래킹 Server Action** — `src/app/(public)/_actions/track-affiliate-click.ts`
  - 클라이언트가 `<a>` 클릭 시 호출
  - Server Action 호출과 외부 URL 이동을 **병렬 처리** (onClick에서 action 호출 + `<a target="_blank">` 자연 이동)
  - 이동 후에도 추적이 필요한 예외 케이스(동일 탭 이동)는 `navigator.sendBeacon`으로 보조
- [ ] **PII 마스킹** — `user_id`만 전송 (이메일·이름 등 식별정보 미포함)
  - REQ-NF-015 준수
- [ ] **이벤트 큐잉 및 배치 발송** — Mixpanel SDK의 자동 배치 활용
  - 대량 이벤트 발생 시 100ms 디바운싱으로 묶어 전송
- [ ] **Failure Tolerance** — Mixpanel 장애 시
  - 에러 로그만 남기고 사용자 클릭 동작은 정상 진행
  - Slack `#platform-risk` 알림은 NFR-MON-002 영역에서 처리
- [ ] **타입 안전성** — Mixpanel 이벤트 페이로드 키 오타 방지를 위한 `as const` 또는 enum
- [ ] **Unit 테스트** — `trackAffiliateLinkClick` 호출 시 페이로드 형식 검증, Mixpanel mock 활용

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 클릭 추적 (REQ-FUNC-033)**
- **Given**: 로그인 사용자(`user_id: u_001`, `persona_type: BUSY_PROFESSIONAL`)가 쿠팡 제휴 링크 클릭
- **When**: `trackAffiliateLinkClick({ product_id: 'p_001', channel_id: 'coupang', daily_cost_krw: 350.0, final_price_krw: 21000, clicked_at: '...' })` 호출
- **Then**: Mixpanel에 `affiliate_link_click` 이벤트가 distinct_id `u_001`로 기록되며, 모든 필수 속성이 페이로드에 포함된다.

**Scenario 2: 비로그인 사용자 추적**
- **Given**: 비로그인 사용자가 제휴 링크 클릭, `session_id: anon_xxx`
- **When**: 트래킹 함수 호출
- **Then**: distinct_id가 `anon_xxx`로 기록되며 `user_id`와 `persona_type` 속성은 누락 없이 `null` 또는 미포함.

**Scenario 3: 사용자 클릭 지연 0ms (UX 보장)**
- **Given**: 사용자가 제휴 링크를 클릭한 시점
- **When**: 트래킹 호출이 진행 중인 상황에서 외부 URL로 리다이렉트
- **Then**: 클릭부터 외부 URL 이동까지의 체감 지연 < 100ms (트래킹은 백그라운드에서 fire-and-forget).

**Scenario 4: Mixpanel 장애 시 silent fallback**
- **Given**: Mixpanel API가 5xx 응답 또는 timeout
- **When**: 트래킹 함수 호출
- **Then**: 에러가 throw되지 않고 silent 로그만 기록되며, 사용자 동작은 정상 진행.

**Scenario 5: PII 미포함 보장 (REQ-NF-015)**
- **Given**: 모든 트래킹 호출
- **When**: Mixpanel에 전송된 페이로드를 검사함
- **Then**: 이메일·이름·전화번호 등 PII 필드가 0건이다.

## :gear: Technical & Non-Functional Constraints
- **fire-and-forget 패턴**: 트래킹 호출의 성공/실패는 사용자 경험과 분리. `await` 미사용 또는 timeout 짧게.
- **PII 미포함 (REQ-NF-015, CON-4)**: distinct_id 외 모든 페이로드에서 식별정보 제외. `persona_type`은 비식별 카테고리이므로 허용.
- **서버 사이드 트래킹 단일 경로**: 본 태스크의 `affiliate_link_click`은 서버(Mixpanel Node) 발송만 허용. 클라이언트 Mixpanel JS 직접 호출은 금지(Ad Blocker·PII 누출 방지).
- **Rate Limit (애플리케이션 레이어, CDN 아님)**:
  - 위치: Server Action/Route Handler 진입 직후 (CDN의 COM-RH-001 검색 레이트리밋과 분리)
  - 키: `{distinct_id}:{product_id}`
  - 정책: **1초 내 동일 키 ≥ 2회 드롭**, **분당 동일 distinct_id ≥ 30 이벤트 드롭**
  - 저장소: 인메모리 LRU(warm instance) + Redis(존재 시) 2단계
  - 드롭 시: 구조화 로그 `event="analytics.rate_limited"` 기록, 사용자 지연 0
- **이벤트 명명 일관성**: `<noun>_<verb>` 패턴 (`affiliate_link_click`, `kakao_share_send`). 신규 이벤트 추가 시 동일 패턴.
- **환경변수 분리**:
  - `MIXPANEL_PROJECT_TOKEN` — 발송용 (서버/클라이언트 공용, 공개 토큰)
  - `MIXPANEL_API_SECRET` — Service Account 또는 관리 API용 (**서버 전용**, 커밋 금지, `.env.local`)
- **데이터 거버넌스**: 이벤트 명세를 `docs/analytics-events.md`에 문서화하여 NFR-MON-003 대시보드 구성과 정합.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] Mixpanel 클라이언트 초기화(서버/클라이언트)가 분리 구현되었는가?
- [ ] `trackAffiliateLinkClick` 함수가 fire-and-forget 패턴으로 동작하는가?
- [ ] 이벤트 페이로드에 모든 필수 속성(product_id, channel_id, daily_cost_krw, final_price_krw, clicked_at)이 포함되는가?
- [ ] PII가 페이로드에 포함되지 않음을 검증했는가?
- [ ] Mixpanel 장애 시 silent fallback이 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(scenario 1~5)가 작성되고 통과하는가?
- [ ] `docs/analytics-events.md`에 `affiliate_link_click` 이벤트 명세가 문서화되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩, 환경변수 설정), #NFR-005 (환경변수 관리 — MIXPANEL_PROJECT_TOKEN)
- **Blocks**:
  - #COM-C-005 (카카오 공유 추적 — 동일 패턴 재사용)
  - #UI-011 (비교 결과 페이지 — 클릭 이벤트 핸들러 연결)
  - #UI-020 (제품 상세 페이지)
  - #TEST-COM-003 (Mixpanel 이벤트 기록 검증)
  - #NFR-MON-003 (Mixpanel 대시보드 항목 — CTR 메트릭 의존)

## :bookmark_tabs: Notes
- `affiliate_link_click`은 비즈니스 메트릭(CTR, 제휴 매출)의 핵심 이벤트이다. 누락 시 K-Factor 분석 정확도가 저하되므로 반드시 서버 사이드 추적을 채택.
- 향후 GA4/Amplitude 등 추가 분석 도구 도입 대비, `track()` 인터페이스를 추상화하여 어댑터 패턴으로 확장 가능하게 설계 검토(MVP에서는 Mixpanel 직접 호출).
- `final_price_krw`와 `daily_cost_krw`를 함께 전송하면 페르소나별 가격 민감도 분석 가능 (NFR-MON-003 대시보드).
- 클라이언트 사이드 Mixpanel JS는 페이지뷰·UI 인터랙션 보조용으로 추후 도입 검토. 본 태스크 범위는 서버 사이드 핵심 이벤트만 포함.
