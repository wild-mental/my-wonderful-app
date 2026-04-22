---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-013: 미등록 성분 안내 메시지 + [제품 등록 요청하기] CTA 버튼 UI"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-013] 미등록 성분 안내 + 제품 등록 요청 CTA
- 목적: REQ-FUNC-008 AC를 충족하는 미등록 성분 사용자 여정 종착점을 구현한다. 사용자가 DB에 등록되지 않은 성분(예: NMN)을 검색했을 때 막다른 길을 만들지 않고, "해당 성분은 현재 데이터베이스에 미등록 상태입니다. [제품 등록 요청하기]" 안내와 함께 요청 접수 폼을 제공한다. 안내 표시는 300ms 이내, 요청 제출 성공률 99% 이상을 목표로 한다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-008 (미등록 성분 안내 + CTA, 300ms, 제출 성공률 99%)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통`](../05_SRS_v1.md) — REQ-FUNC-032 (관리자 백오피스 등록 요청 관리)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 UC-12`](../05_SRS_v1.md) — 미등록 성분 등록 요청
- SRS 내부 API: [`/05_SRS_v1.md#6.1.2 INT-API-05`](../05_SRS_v1.md) — 제품 등록 요청 Server Action
- 관련 구현 태스크: [`/TASKS/COM-C-003_product_registration_request.md`](./COM-C-003_product_registration_request.md), [`/TASKS/COM-Q-002_unregistered_ingredient_cta.md`](./COM-Q-002_unregistered_ingredient_cta.md), [`/TASKS/API-005_product_registration_dto.md`](./API-005_product_registration_dto.md)
- 선행 태스크: **UI-010**(메인 검색), **UI-011**(비교 결과), **UI-003**(토스트), **API-005**
- 후행 태스크: UI-061(관리자 등록 요청 대시보드), TEST-F1-005(미등록 CTA 테스트)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **안내 + CTA 컨테이너 컴포넌트** — `src/features/compare/unregistered-ingredient-cta.tsx`
  - props: `{ query: string; source: "search" | "compare" }`
  - 제목(H2): "찾으시는 성분이 아직 등록되지 않았어요"
  - 설명: "해당 성분은 현재 데이터베이스에 미등록 상태입니다. 요청을 남겨 주시면 검토 후 빠르게 추가할게요."
  - 기본 CTA: [제품 등록 요청하기] 버튼(Primary)
  - 보조 CTA: [다른 성분 검색] 링크 → 메인(`/`)
- [ ] **등록 요청 모달/다이얼로그** — `src/features/compare/registration-request-dialog.tsx`
  - shadcn/ui `Dialog` 또는 모바일 `Sheet`(하단 시트)
  - 폼 필드(API-005 DTO 기반):
    - 성분명(`ingredient_name`) — 검색어로 pre-fill, 필수
    - 제품명/브랜드(선택 — 특정 제품을 원할 때)
    - URL(선택 — 참고 링크)
    - 이메일(선택, 로그인 사용자는 숨김, 비로그인 시 수동 입력) — 개인정보 최소 수집(CON-4)
  - `useFormState` 또는 React Hook Form + Zod(API-005 스키마) 검증
- [ ] **Server Action 연결** — COM-C-003
  - `"use server"` 액션으로 `submitProductRegistrationRequest()` 호출
  - 응답: 성공 시 요청 ID 반환 → 토스트(UI-003) "제품 등록 요청이 접수되었습니다. 검토까지 평균 2~3일이 소요됩니다."
  - 실패 시: 토스트 error + 폼 유지 (재시도 가능)
- [ ] **진입점 배치**
  - UI-010 자동완성 드롭다운 최하단에 축약 블록(1줄) — "NMN 성분이 없나요? [등록 요청하기]"
  - UI-011 결과 페이지: `unregistered=1` 쿼리 또는 `results.length === 0 && !isRegistered`일 때 전체 컨테이너로 렌더
- [ ] **300ms 이내 표시** — REQ-FUNC-008 AC
  - Server Component로 렌더하여 초기 HTML에 안내가 포함되도록 함
  - 클라이언트 판정 분기(fetch 후 상태 업데이트)인 경우 스켈레톤 대신 **낙관적 프리렌더**로 즉시 노출
- [ ] **중복 요청 가드**
  - 동일 이메일·성분명 조합 10분 내 2회 이상 제출 시 "이미 요청이 접수되었습니다" 안내
  - 서버 측 검증은 COM-C-003이 담당, UI는 rate limit 응답(429)을 친화적 문구로 변환
- [ ] **분석 이벤트**
  - Mixpanel: `unregistered_cta_impression`(query, source), `registration_request_submit`(query, has_email, outcome)
  - 전환율 KPI 측정 기반(안내 노출→요청 제출률)
- [ ] **접근성**
  - CTA 버튼 키보드 접근성, Enter 제출
  - 모달 열림 시 포커스 트랩 + Esc 닫기
  - `role="region"` + `aria-labelledby` 적용
- [ ] **빈 상태 공감 문구**
  - 일러스트 또는 아이콘(`Package` / `Search`)로 시각적 공감
  - 톤: 사과하지 않고 "함께 만들어가요" 긍정 프레이밍

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-008 300ms 이내 안내 표시**
- **Given**: 사용자가 "NMN"(미등록) 성분을 검색
- **When**: 검색 결과 페이지(`/compare?q=NMN`)가 렌더됨
- **Then**: 300ms 이내에 "해당 성분은 현재 데이터베이스에 미등록 상태입니다" 안내와 [제품 등록 요청하기] 버튼이 표시된다.

**Scenario 2: 자동완성 드롭다운 내 축약 블록**
- **Given**: UI-010 자동완성에서 미등록 성분이 감지됨
- **When**: 드롭다운이 렌더됨
- **Then**: 드롭다운 최하단에 "NMN 성분이 없나요? [등록 요청하기]" 축약 행이 노출되고 클릭 시 UI-013 컨테이너로 이동.

**Scenario 3: 폼 제출 성공**
- **Given**: 모달에서 성분명 "NMN"과 이메일을 입력한 상태
- **When**: [제출] 버튼을 탭
- **Then**: Server Action이 성공 응답을 반환하고 토스트 "제품 등록 요청이 접수되었습니다" + 모달이 닫힌다.

**Scenario 4: 필수 필드 미입력**
- **Given**: 성분명이 빈 상태
- **When**: [제출] 버튼 탭
- **Then**: Zod 검증으로 필드 오류 메시지가 인라인 표시되고 서버 호출은 발생하지 않는다.

**Scenario 5: 제출 성공률 ≥ 99%**
- **Given**: 100회 정상 제출 시뮬레이션
- **When**: Server Action 응답을 집계
- **Then**: 99건 이상이 `success`로 접수된다.

**Scenario 6: 중복 제출 방지**
- **Given**: 동일 이메일·성분명으로 10분 내 이미 1건 제출된 상태
- **When**: 재제출 시도
- **Then**: "이미 요청이 접수되었습니다" 친화적 메시지가 표시되고 DB에 중복 기록이 쌓이지 않는다.

**Scenario 7: 로그인 사용자는 이메일 숨김**
- **Given**: 로그인 상태(`session.user.email` 존재)
- **When**: 모달이 열림
- **Then**: 이메일 입력 필드가 숨겨지고 서버에 자동으로 이메일이 연결된다(CON-4 최소 수집).

**Scenario 8: 접근성 — 모달 포커스 트랩**
- **Given**: 모달이 열린 상태
- **When**: Tab을 반복 누름
- **Then**: 포커스가 모달 내부 요소 사이에서만 순환하고 배경으로 빠져나가지 않는다. Esc 시 모달이 닫힌다.

**Scenario 9: 서버 에러 처리**
- **Given**: Server Action이 500 반환
- **When**: 제출이 시도됨
- **Then**: 토스트 error "일시적 오류입니다. 다시 시도해 주세요" + 모달 폼 데이터 유지.

**Scenario 10: Mixpanel 전환율 이벤트**
- **Given**: 사용자가 안내 → 모달 → 제출 완료까지 진행
- **When**: 이벤트 로그를 확인
- **Then**: `unregistered_cta_impression`, `registration_request_submit`(outcome=success) 2종이 순차 발송된다.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-008 300ms 표시**: Server Component로 렌더해 FCP에 포함. 클라이언트 분기면 낙관적 프리렌더·스켈레톤 생략.
- **REQ-FUNC-008 제출 성공률 ≥ 99%**: Server Action의 네트워크 재시도(최대 2회) + 사용자 가이드 토스트로 사용자 이탈 방지.
- **CON-4 최소 수집**: 이메일은 선택이며 로그인 시 서버가 자동 연결. 별도 이름·연락처 등 수집 금지.
- **법적·브랜드 일관성(CON-2)**: 안내 문구에 "치료" "완치" 등 기능성 약속 금지. 공감 톤 + 간결체.
- **중복/스팸 가드**: 서버(COM-C-003)가 10분 내 동일 이메일·성분 재제출 차단, UI는 429 응답을 친화적으로 변환.
- **접근성**: WAI-ARIA Dialog 패턴, 포커스 트랩, Esc 닫기, `aria-describedby` 적용.
- **i18n**: 모든 문구는 i18n 키로 관리(향후 영어 확장 대비).
- **모바일 UX**: 모달 대신 하단 시트(`Sheet`)로 키보드와 조화. 제출 버튼은 sticky.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~10)를 충족하는가?
- [ ] 안내 + CTA가 300ms 이내 노출되는가?
- [ ] 모달 폼이 API-005 DTO/Zod와 일치하는가?
- [ ] Server Action(COM-C-003) 연결 및 성공/실패 토스트가 동작하는가?
- [ ] 로그인 사용자에서 이메일 필드가 숨겨지는가?
- [ ] 중복 제출(10분 rate limit) 방지 UX가 동작하는가?
- [ ] WAI-ARIA Dialog 패턴(포커스 트랩 + Esc)이 적용되는가?
- [ ] Mixpanel `unregistered_cta_impression`, `registration_request_submit` 이벤트 발송?
- [ ] UI-010 드롭다운 축약 블록 + UI-011 전체 블록 양쪽 통합 완료?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F1-005가 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-010(검색 드롭다운 진입점), #UI-011(비교 결과 진입점), #UI-003(토스트), #API-005(DTO), #COM-C-003(Server Action)
- **Blocks**:
  - #TEST-F1-005 (미등록 성분 CTA 테스트)
  - #UI-061 (관리자 등록 요청 대시보드의 데이터 원천)

## :bookmark_tabs: Notes
- 본 CTA는 "막다른 길 제거"라는 사용자 경험 원칙의 핵심이다. 검색 실패가 서비스 이탈로 이어지지 않도록 하는 안전망 역할.
- 접수된 요청은 관리자 대시보드(UI-061)로 흘러 들어가 Product 등록 파이프라인을 시작한다. 따라서 요청 품질(성분명 정확성)이 백오피스 효율과 직결되므로, 자동완성·검색어 pre-fill로 오타를 최소화한다.
- MVP 범위에서는 "검토 후 추가" 약속만 하고 구체적 SLA는 명시하지 않는다. Phase 2에서 SLA(예: 72h 처리) 도입 검토.
- 비로그인 사용자의 이메일 수집은 "필수"가 아닌 "선택"이어야 CON-4 최소 수집과 충돌하지 않는다. 이메일 없이도 요청은 접수되며, 회신을 원할 때만 이메일을 남기도록 UI 문구로 유도.
