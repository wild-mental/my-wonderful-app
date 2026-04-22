---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-C-005: 카카오 공유 이벤트 Mixpanel 추적 (`kakao_share_send`) 구현"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-C-005] 카카오 공유 Mixpanel 추적 [Command]
- 목적: SRS REQ-FUNC-034를 충족하는 카카오톡 공유 이벤트 추적 로직을 구현한다. F3 Viral Engine의 핵심 KPI인 K-Factor(바이럴 계수) 측정의 기초 데이터를 확보하기 위해, 사용자가 비교 결과·제품 상세에서 [공유하기] 버튼을 눌러 카카오 Link API 호출이 트리거되거나 폴백(URL 복사)이 발생하는 모든 시점에 `kakao_share_send` 이벤트를 Mixpanel로 발송한다. COM-C-004와 동일한 fire-and-forget 패턴 + PII 미포함 원칙을 따른다.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-034 (카카오 공유 이벤트 추적)
- SRS F3 Viral Engine: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-016~021
- SRS 비기능: [`/05_SRS_v1.md#4.2 비기능 요구사항`](../05_SRS_v1.md) — REQ-NF-022 (Mixpanel 대시보드)
- SRS 비즈니스 메트릭: [`/05_SRS_v1.md#1.2 Goals & Success Metrics`](../05_SRS_v1.md) — K-Factor
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩), **COM-C-004** (Mixpanel 클라이언트 인프라 재사용)
- 후행 태스크: F3-C-002 (카카오 Link API 호출), F3-C-003 (장애 폴백), UI-040 (공유 버튼), UI-041 (폴백 UI), TEST-COM-003, NFR-MON-003
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **이벤트 추적 함수** — `src/lib/analytics/track.ts` (COM-C-004의 모듈 재사용)
  - `trackKakaoShareSend(payload: KakaoShareSendPayload): Promise<void>`
  - fire-and-forget, silent error
- [ ] **이벤트 페이로드 정의** — `src/types/analytics/kakao-share.ts`
  - `event: 'kakao_share_send'`
  - 필수 속성:
    - `share_method`: `'kakao_link' | 'url_copy_fallback' | 'web_share_api'` (REQ-FUNC-021 폴백 분기 + UI-041 옵션 지원)
    - `target_kind`: `'product' | 'comparison' | 'badge_card'` (공유 대상 엔티티 타입)
    - `target_id`: `product_id | comparison_id | share_key` (대상 ID — 타입에 따라 달라짐)
    - `share_origin`: `'compare_result' | 'product_detail' | 'badge_modal' | 'share_landing'` (REQ-FUNC-019 재공유 포함)
    - `outcome`: `'success' | 'fallback_triggered' | 'cancelled' | 'error'` (발송 결과 — K-Factor·장애율 동시 측정)
    - `shared_at` (ISO 8601)
  - 선택 속성:
    - `reason`: outcome이 `cancelled`/`error`일 때 단순 사유 코드(`sdk_timeout` | `sdk_missing` | `user_abort` | `network_error` | `clipboard_denied`) — **자유 텍스트 금지**
    - `user_id_hash` (로그인 시, sha256+salt), `session_id`, `persona_type`
    - `share_key`: 공유 카드 랜딩 식별용 **해시된 공유 키**(실 URL 미포함 — PII/패스워드 누출 방지)
  - distinct_id: 로그인 시 `user_id_hash`, 비로그인 시 `session_id`
  - **금지 필드**: `share_card_url` 원본 URL, `utm_*` 파라미터 전체값, 공유 본문 텍스트, 수신자 정보
- [ ] **Server Action 또는 클라이언트 추적 인터페이스** — `src/app/(public)/_actions/track-kakao-share.ts`
  - F3-C-002의 카카오 Link API 호출 직후 트리거
  - F3-C-003의 폴백 발생 시에도 동일 함수 호출 (`share_method: 'url_copy_fallback'`)
- [ ] **양 분기 동시 추적** — 정상 카카오 공유 + URL 복사 폴백 모두 추적
  - 폴백 추적 누락 시 K-Factor 왜곡 (실제 공유보다 수치 저평가)
- [ ] **PII 마스킹** — distinct_id 외 식별정보 미포함
- [ ] **`shareKey` 해시 정책** — `src/lib/analytics/hash-share-key.ts`
  - 입력: 원본 share URL(`/share/[shareKey]`)
  - 출력: `sha256(shareKey + SALT).slice(0, 16)` 단방향 해시
  - 이유: 랜딩 페이지의 `shareKey`가 DB PK 또는 공개 토큰일 수 있으므로 Mixpanel 저장소에 원문 누출 방지. 분석 시 동일 공유 세션의 동일성만 확인하면 충분.
- [ ] **이벤트 거버넌스** — `docs/analytics-events.md`에 `kakao_share_send` 이벤트 명세 추가
  - `share_method` enum: `kakao_link` | `url_copy_fallback` | `web_share_api`
  - `target_kind` enum: `product` | `comparison` | `badge_card`
  - `share_origin` enum: `compare_result` | `product_detail` | `badge_modal` | `share_landing`
  - `outcome` enum: `success` | `fallback_triggered` | `cancelled` | `error`
  - `reason` enum(outcome이 cancelled/error일 때만): `sdk_timeout` | `sdk_missing` | `user_abort` | `network_error` | `clipboard_denied`
  - Enum 확장 규칙: 새 값 추가 시 본 문서·타입·대시보드 쿼리 3개소 동시 갱신(Changelog 필수)
- [ ] **Failure Tolerance** — Mixpanel 장애 시 silent fallback (사용자 공유 동작 자체에는 영향 0)
- [ ] **Unit 테스트** — 정상 카카오 공유 / URL 복사 폴백 양 분기 페이로드 검증, Mixpanel mock 활용

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 카카오 공유 정상 추적 (REQ-FUNC-034)**
- **Given**: F3-C-002의 `Kakao.Link.sendDefault` 호출이 성공한 직후
- **When**: `trackKakaoShareSend({ share_method: 'kakao_link', product_id: 'p_001', share_origin: 'compare_result', shared_at: '...' })`을 호출함
- **Then**: Mixpanel에 `kakao_share_send` 이벤트가 distinct_id로 기록되며, `share_method: 'kakao_link'`로 분류된다.

**Scenario 2: URL 복사 폴백 추적 (REQ-FUNC-021 분기 보장)**
- **Given**: F3-C-003의 카카오 API 장애 폴백이 발동되어 URL이 클립보드에 복사된 직후
- **When**: `trackKakaoShareSend({ share_method: 'url_copy_fallback', outcome: 'fallback_triggered', reason: 'sdk_timeout', ... })` 호출
- **Then**: Mixpanel에 `share_method='url_copy_fallback'`, `outcome='fallback_triggered'`, `reason='sdk_timeout'` 3개 필드가 동시 기록되어 K-Factor(양 경로 합산) + 장애율 분석 가능.

**Scenario 2b: 사용자 취소 추적**
- **Given**: 사용자가 카카오 공유 모달에서 [취소] 선택
- **When**: 트래킹 함수를 `outcome: 'cancelled', reason: 'user_abort'`로 호출
- **Then**: Mixpanel에 정상 기록. K-Factor 분자에서는 제외되며, 사용자 행동 퍼널 분석용 원천 데이터로 활용.

**Scenario 3: 비로그인 사용자 추적**
- **Given**: 비로그인 사용자가 공유 버튼 클릭
- **When**: 트래킹 호출
- **Then**: distinct_id에 `session_id`가 사용되고 `user_id`/`persona_type`은 누락 또는 null.

**Scenario 4: 사용자 공유 동작 지연 0ms**
- **Given**: 카카오 공유 호출 후 Mixpanel 트래킹이 진행 중
- **When**: 카카오 SDK가 카카오톡 앱/웹뷰로 전환
- **Then**: 카카오톡 전환 시점이 트래킹 응답을 기다리지 않으며 체감 지연 < 100ms.

**Scenario 5: PII 미포함 보장 (REQ-NF-015)**
- **Given**: 모든 공유 트래킹 호출
- **When**: Mixpanel에 전송된 페이로드를 검사함
- **Then**: 이메일·이름·전화번호·원본 share URL·UTM 파라미터 원값 등 PII/민감 필드가 0건. `share_key`는 해시된 상태.

**Scenario 6: K-Factor 집계 정확성 (REQ-NF-022)**
- **Given**: 1시간 동안 `success` 80건, `fallback_triggered` 15건, `cancelled` 10건, `error` 2건 수신
- **When**: K-Factor 대시보드 쿼리: `count(outcome IN ('success','fallback_triggered')) / total_users_viewed_share_cta`
- **Then**: 분자 = 95(카카오 + 폴백 합산). cancelled/error 제외. 대시보드 수치가 정의와 일치.

## :gear: Technical & Non-Functional Constraints
- **K-Factor 정확성**: `share_method` × `outcome` 조합으로 양 경로 + 성공/실패를 동시 추적. K-Factor 분자는 `outcome IN ('success', 'fallback_triggered')`로 정의하여 대시보드 SQL을 단일화.
- **fire-and-forget**: COM-C-004와 동일 패턴. 사용자 공유 UX 지연 0.
- **PII 미포함 (REQ-NF-015)**: 공유 URL 원본·UTM·수신자 정보 페이로드 제외. `share_key`는 sha256 해시로만 저장.
- **이벤트 명명 일관성**: `<noun>_<verb>` (`kakao_share_send`). COM-C-004의 `affiliate_link_click`과 동일 컨벤션.
- **Mixpanel 인프라 재사용**: COM-C-004에서 초기화한 서버 전송 모듈(`mixpanel-node`) 재사용. 별도 SDK·키 도입 금지.
- **Enum 거버넌스**: `share_method`, `target_kind`, `share_origin`, `outcome`, `reason` 5개 enum 모두 TypeScript `as const` + Mixpanel 대시보드 쿼리와 동기화. 신규 값 추가 시 Changelog 필수.
- **장애 격리**: Mixpanel 장애 시 silent fallback. F3 카카오 공유 자체는 트래킹과 분리되어 정상 동작 보장.
- **Rate Limit**: COM-C-004와 동일한 애플리케이션 레이어 가드(`1초 내 동일 distinct_id + target_id ≥ 2회 드롭`) 적용.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `trackKakaoShareSend` 함수가 fire-and-forget 패턴으로 구현되었는가?
- [ ] `share_method`로 카카오 공유와 폴백을 분기 추적하는가?
- [ ] 페이로드에 PII가 포함되지 않음을 검증했는가?
- [ ] Mixpanel 장애 시 silent fallback이 동작하는가?
- [ ] COM-C-004의 Mixpanel 클라이언트 인프라가 재사용되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(scenario 1~5)가 작성되고 통과하는가?
- [ ] `docs/analytics-events.md`에 `kakao_share_send` 이벤트 명세가 추가되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩), #COM-C-004 (Mixpanel 클라이언트 인프라)
- **Blocks**:
  - #F3-C-002 (카카오 Link API 호출 — 성공 직후 트래킹 트리거)
  - #F3-C-003 (카카오 장애 폴백 — 폴백 발동 시 트래킹 트리거)
  - #UI-040 (공유 버튼 컴포넌트)
  - #UI-041 (폴백 URL 복사 UI)
  - #TEST-COM-003 (Mixpanel 이벤트 기록 검증)
  - #NFR-MON-003 (K-Factor 대시보드 의존)

## :bookmark_tabs: Notes
- 카카오 공유 폴백(`url_copy_fallback`) 추적 누락은 K-Factor의 실제 가치를 과소평가하게 만드는 흔한 실수다. 본 태스크는 양 경로를 동등하게 다루도록 설계됨.
- `share_origin` 값 `share_landing`은 REQ-FUNC-019 "공유 카드에서 다시 공유" 경로를 명시적으로 지원하기 위해 MVP부터 포함. 재공유 흐름은 바이럴 체인 심도(depth) 분석의 원천.
- 카카오 공유 후 실제 클릭(공유 카드 → 랜딩) 추적은 별도 이벤트(`share_landing_view`, UI-042)로 분리. 본 태스크 범위는 발신 측만 포함.
- `outcome='cancelled'`는 모달 취소 등 사용자 의도적 취소를, `outcome='error'`는 기술적 실패를 명확히 구분. 분석 시 제품 개선 포인트(UX vs 엔지니어링) 식별에 활용.
- `share_key` 해시화는 "공유 카드 URL이 언젠가 민감 정보(이벤트 코드, 개인 랜딩 등)를 포함할 수 있다"는 원칙에서 출발. Mixpanel은 장기 보관·외부 벤더이므로 원문 유출 위험 최소화.
