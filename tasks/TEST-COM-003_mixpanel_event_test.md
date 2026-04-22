---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Test] TEST-COM-003: Mixpanel 이벤트 기록 검증 (`affiliate_link_click`, `kakao_share_send` 속성 포함)"
labels: 'test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-COM-003] Mixpanel 이벤트 기록 유닛 테스트
- 목적: 제휴 링크 클릭 시 `affiliate_link_click`, 카카오톡 공유 시 `kakao_share_send` 이벤트가 Mixpanel에 올바른 속성(제품 ID, 채널, 가격 등)과 함께 기록되는지 유닛 테스트로 검증한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: L

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-033 (`affiliate_link_click`), REQ-FUNC-034 (`kakao_share_send`)
- 선행 태스크: **COM-C-004** (제휴 클릭 추적), **COM-C-005** (카카오 공유 추적)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Mixpanel Mock 설정** — `vi.mock('mixpanel-browser')` 또는 트래킹 함수 직접 mock
- [ ] **affiliate_link_click 이벤트 테스트** — `tests/unit/analytics/affiliate-click.test.ts`
  - 이벤트 이름: `affiliate_link_click`
  - 필수 속성: `product_id`, `channel: "coupang"`, `price_krw`, `daily_cost_krw`
  - 제휴 링크 클릭 핸들러 호출 후 Mixpanel `track()` 호출 검증
- [ ] **kakao_share_send 이벤트 테스트** — `tests/unit/analytics/kakao-share.test.ts`
  - 이벤트 이름: `kakao_share_send`
  - 필수 속성: `ingredient`, `result_count`, `share_method: "kakao"`
  - 카카오 공유 성공 후 Mixpanel `track()` 호출 검증
- [ ] **share_fallback 이벤트 테스트** — 카카오 장애 시 폴백 이벤트
  - 이벤트 이름: `share_fallback`
  - 속성: `fallback_method: "clipboard"`, `error_code`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 제휴 링크 클릭 이벤트 (REQ-FUNC-033)**
- **Given**: 사용자가 제휴 구매 링크를 클릭한 상태
- **When**: 클릭 이벤트 핸들러가 실행된다
- **Then**: Mixpanel에 `affiliate_link_click` 이벤트가 `product_id`, `channel`, `price_krw` 속성과 함께 기록된다.

**Scenario 2: 카카오 공유 이벤트 (REQ-FUNC-034)**
- **Given**: 사용자가 카카오톡 공유를 완료한 상태
- **When**: 공유 성공 콜백이 실행된다
- **Then**: Mixpanel에 `kakao_share_send` 이벤트가 기록된다.

**Scenario 3: 속성 누락 검증**
- **Given**: 제휴 링크 클릭 이벤트 트래킹 함수
- **When**: `product_id` 없이 호출을 시도한다
- **Then**: 필수 속성 누락 에러가 발생하거나 기본값이 채워진다.

## :gear: Technical & Non-Functional Constraints
- **Mock 기반**: 실제 Mixpanel API 호출 없이 `track()` 함수 호출 여부와 인자를 검증.
- **클라이언트 사이드**: Mixpanel은 브라우저에서 동작. `jsdom` 환경에서 테스트.

## :checkered_flag: Definition of Done (DoD)
- [ ] `affiliate_link_click` 이벤트 테스트가 통과하는가?
- [ ] `kakao_share_send` 이벤트 테스트가 통과하는가?
- [ ] 필수 속성 검증 테스트가 통과하는가?
- [ ] `pnpm test` 에러 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-C-004, #COM-C-005
- **Blocks**: 분석 대시보드 QA 검증
