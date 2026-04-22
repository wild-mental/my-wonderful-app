---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-Q-002: 미등록 성분 검색 시 안내 메시지 및 등록 요청 CTA 반환 로직"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-Q-002] 미등록 성분 안내 + 등록 CTA 반환 [Query]
- 목적: SRS REQ-FUNC-008 "미등록 성분 검색 시 안내 메시지 + 등록 요청 CTA 표시" 요구사항을 충족하는 응답 구성 로직을 구현한다. COM-Q-001 자동완성 결과가 빈 배열일 때, 사용자에게 친화적인 안내 메시지와 함께 [제품 등록 요청하기] CTA 메타데이터(액션 URL, 모달 트리거 키)를 반환한다. AC 임계: 안내 메시지 300ms 이내 표시, 등록 요청 폼 제출 성공률 ≥ 99%.
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-008 (미등록 성분 안내 + CTA, 300ms 이내, 제출 성공률 99%+)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — UC-01 (검색 → 미등록 성분 분기)
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-03
- 선행 태스크: **COM-Q-001** (성분 검색 + 자동완성)
- 후행 태스크: COM-RH-001 (Search Route Handler), UI-013 (CTA 버튼), TEST-F1-005
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **미등록 성분 응답 구성 함수** — `src/lib/queries/search/unregistered-cta.ts`
  - `buildUnregisteredResponse(keyword: string): UnregisteredIngredientResponse`
  - 반환 객체: `{ is_unregistered: true, message: string, cta: { label: string; action_url: string; modal_trigger_key?: string } }`
- [ ] **안내 메시지 i18n 처리** — `src/messages/ko/search.json`
  - 키: `search.unregistered.title` = "검색 결과가 없어요"
  - 키: `search.unregistered.message` = "‘{keyword}’ 성분/제품이 아직 등록되지 않았어요. 등록 요청을 도와주세요."
  - `{keyword}` 치환은 sanitize 후 (XSS 방지)
- [ ] **CTA 메타 정의**
  - `label`: "제품 등록 요청하기"
  - `action_url`: `/register-request?prefill=${encodeURIComponent(keyword)}`
  - `modal_trigger_key`: `"open-register-request-modal"` (UI-013에서 모달 직접 오픈 시 사용)
- [ ] **응답 결합 로직** — COM-Q-001과의 통합 인터페이스
  - COM-Q-001 결과가 빈 배열이면 본 함수 호출
  - 결과가 1건 이상이면 `is_unregistered: false`로 정상 응답
- [ ] **응답 시간 < 300ms 보장** — REQ-FUNC-008 AC
  - 본 함수는 DB 호출 없는 순수 함수로 작성 (~1ms)
  - COM-Q-001 자동완성이 < 200ms로 동작하므로 합산 < 300ms
- [ ] **keyword sanitize** — XSS 방지
  - HTML 태그·스크립트 제거 (`DOMPurify` 또는 단순 정규식)
  - 메시지에 삽입 시 텍스트 노드로만 사용 (UI 측 책임이지만 서버에서도 1차 방어)
- [ ] **Unit 테스트 작성** — 안내 메시지 생성, CTA URL 인코딩, XSS 방어, 빈 키워드 처리

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 미등록 성분 안내 응답 (REQ-FUNC-008 핵심)**
- **Given**: 키워드 "xyz_unknown"이 INGREDIENT 테이블에 없는 상태
- **When**: COM-Q-001 결과가 빈 배열이고 `buildUnregisteredResponse('xyz_unknown')`을 호출함
- **Then**: `is_unregistered: true`, `message`에 키워드가 치환된 안내 문구, `cta.label: "제품 등록 요청하기"`, `cta.action_url: /register-request?prefill=xyz_unknown`이 반환된다.

**Scenario 2: 응답 시간 임계 (REQ-FUNC-008 AC)**
- **Given**: COM-Q-001 자동완성 + COM-Q-002 응답 구성을 결합한 전체 흐름
- **When**: 미등록 키워드로 100회 호출함
- **Then**: p95 응답 시간 ≤ 300ms.

**Scenario 3: 등록 요청 폼 제출 성공률 ≥ 99% (REQ-FUNC-008 AC)**
- **Given**: CTA 버튼이 UI-013에서 노출되고 사용자가 클릭함
- **When**: `/register-request?prefill=...` 폼이 로드되어 제출됨
- **Then**: 폼 검증/저장 단계까지 99%+ 성공률을 기록한다 (NFR-MON-001 모니터링 기준 충족).

**Scenario 4: XSS 방어**
- **Given**: 키워드 `<script>alert(1)</script>`가 입력된 상태
- **When**: 안내 메시지를 구성함
- **Then**: 메시지의 keyword 부분이 sanitize되어 HTML 태그가 텍스트로 표현되거나 제거된다.

**Scenario 5: keyword 인코딩**
- **Given**: 한글 키워드 "비타민D"가 주어짐
- **When**: `cta.action_url`을 구성함
- **Then**: URL이 `encodeURIComponent` 처리되어 안전한 query string으로 반환된다.

## :gear: Technical & Non-Functional Constraints
- **순수 함수**: 본 태스크는 DB·외부 호출 없는 순수 함수로 구현. 응답 시간 < 1ms 목표.
- **REQ-FUNC-008 AC**: 안내 메시지 300ms 이내, 등록 요청 폼 제출 성공률 ≥ 99%. 본 태스크는 메시지 응답 책임만 가지며, 폼 제출 성공률은 COM-C-003 + UI-013의 합산 책임.
- **i18n 준비**: 메시지는 `messages/ko/search.json`에 분리. 추후 다국어 확장 시 키만 추가.
- **XSS 방어**: keyword sanitize는 서버/클라이언트 양측 1차 방어. 최종 렌더링 시 React 자동 escape에 의존.
- **CTA URL 패턴 일관성**: `prefill` 쿼리 파라미터로 키워드 전달. UI-013에서 폼 자동 채움.
- **Read-only**: [Query] 태스크이므로 어떤 INSERT/UPDATE도 수행하지 않음.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `buildUnregisteredResponse` 함수가 구현되었는가?
- [ ] 안내 메시지가 `messages/ko/search.json`에 분리 정의되었는가?
- [ ] CTA 메타(label, action_url, modal_trigger_key)가 일관성 있게 구성되었는가?
- [ ] keyword sanitize 및 URL 인코딩이 적용되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Unit 테스트(scenario 1, 4, 5)가 통과하는가?
- [ ] 통합 테스트(COM-Q-001 + COM-Q-002 합산 < 300ms)가 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-Q-001 (자동완성/검색 쿼리 — 결과 빈 배열 분기 트리거)
- **Blocks**:
  - #COM-RH-001 (Search Route Handler 통합 조립)
  - #UI-013 (미등록 성분 안내 + CTA 버튼)
  - #TEST-F1-005 (미등록 성분 CTA 반환 검증, 300ms 이내)
  - #COM-C-003 (등록 요청 Server Action — `prefill` 파라미터 수신)

## :bookmark_tabs: Notes
- REQ-FUNC-008은 성분 정보의 폐쇄성을 사용자 참여로 보완하는 핵심 데이터 신뢰 지표(F4 Data Trust System과 직접 연계). UX는 차단이 아닌 "함께 채워나가는 경험"으로 설계.
- `modal_trigger_key`는 SPA 내부 라우팅 없이 모달을 직접 오픈하는 옵션. `action_url`은 폴백/딥링크용. UI-013에서 둘 중 하나를 선택 사용.
- 등록 요청 폼은 비로그인 사용자도 제출 가능해야 함(가입 강요 시 제출 성공률 99% 미달 위험). COM-C-003에서 비인증 허용 정책 확정 필요.
- 자동완성 결과가 1건이라도 있으면 본 응답을 사용하지 않음. `is_unregistered` 분기 책임은 COM-RH-001에서 수행.
