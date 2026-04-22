---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-030: [오류 신고] 구조화된 폼 모달 (대상 필드명, 기존 값, 올바른 값, 근거 자료)"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-030] 오류 신고 구조화 폼 모달
- 목적: REQ-FUNC-028의 "대상 필드명, 기존 값, 올바른 값, 근거 자료(선택)" 4필드 구조화 폼을 제공하는 모달을 구현한다. 사용자가 제품 상세 페이지에서 "오류 신고" 버튼을 탭하면 본 모달이 열리고, 제출 시 F4-C-001 Server Action을 호출하여 ERROR_REPORT로 저장된다. API-004 Zod 스키마로 이중 방어하며, 성공 시 UI-031(접수 확인 알림)로 연계된다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-024 (접수 알림), REQ-FUNC-028 (구조화 폼 4필드)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 UC-10`](../05_SRS_v1.md) — 데이터 오류 제보 제출
- SRS 내부 API: [`/05_SRS_v1.md#6.1.2 INT-API-04`](../05_SRS_v1.md) — 오류 제보 Server Action
- 관련 구현 태스크: [`/TASKS/API-004_error_report_dto.md`](./API-004_error_report_dto.md), [`/TASKS/F4-C-001_error_report_submission.md`](./F4-C-001_error_report_submission.md), [`/TASKS/F4-C-002_spam_filter.md`](./F4-C-002_spam_filter.md), [`/TASKS/MOCK-004_error_report_mock_action.md`](./MOCK-004_error_report_mock_action.md)
- 선행 태스크: **UI-002**(레이아웃), **UI-003**(토스트), **UI-020**(제품 상세 — 진입점), **API-004**(DTO), **MOCK-004**(Mock Action)
- 후행 태스크: UI-031(접수 알림), TEST-F4-006(구조화 폼 검증), TEST-F4-004(스팸 차단)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **ErrorReportDialog 컴포넌트** — `src/features/trust/error-report-dialog.tsx` (Client Component)
  - Props: `{ productId: string; ingredientId?: string; defaultFieldName?: string; open: boolean; onClose: () => void }`
  - 모바일: 하단 시트(`Sheet`) / 데스크탑: `Dialog` (responsive)
- [ ] **폼 구조 — API-004 DTO 기반 (REQ-FUNC-028)**
  - **대상 필드명**(`field_name`, 필수, 셀렉트 또는 자동 감지): 제품명 / 용량 / 1일 단가 / 성분명 / 뱃지 / 기타
  - **기존 값**(`old_value`, 필수, readOnly 프리필): 사용자가 선택한 필드의 현재 값 자동 로드
  - **올바른 값**(`new_value`, 필수, 자유 입력): textarea, 최대 2,000자
  - **근거 자료**(`evidence_url`, 선택, URL): 식약처 공전, 제조사 라벨 사진 URL 등
  - 보조 텍스트 필드(`comment`, 선택, 최대 500자)
- [ ] **Form 상태 관리** — React Hook Form + Zod Resolver
  - API-004의 Zod 스키마 import (SSOT)
  - 필드별 실시간 검증 + 에러 메시지 인라인
  - 제출 버튼 disabled: 필수 3필드 미입력 또는 검증 실패 시
- [ ] **Server Action 연결** — `submitErrorReport`
  - `"use server"` 액션 호출 (F4-C-001)
  - 성공: 모달 닫기 → UI-031 토스트 호출 (REQ-FUNC-024: 3초 이내)
  - 실패(400 validation): 필드별 에러 메시지 맵핑
  - 실패(429 rate limit): F4-C-002 스팸 차단 문구 "중복 또는 불완전한 제보입니다"
  - 실패(500): 토스트 error + 폼 데이터 유지
- [ ] **진입 버튼(UI-020 내부)**
  - 제품 상세 페이지 하단 "이 정보가 틀렸나요? [오류 신고]" 링크
  - 성분 행별 우측 작은 [신고] 아이콘 버튼(필드 컨텍스트 prefill)
- [ ] **로그인 상태 분기**
  - 로그인: `submitted_by = session.user.id` 자동 연결
  - 비로그인: 선택 이메일 필드 노출(CON-4 최소 수집, 응답 수신 원할 때만)
- [ ] **제출 중 UI**
  - 버튼 내부 `<Spinner size="sm">` + "제출 중..." + disabled
- [ ] **XSS & 법적 표현 가드**
  - 클라이언트 sanitize는 최소화(서버 API-004/F2-C-002가 최종 방어선)
  - `new_value`에 금지 표현(질병 예방·치료) 감지 시 경고 플래그(렌더 시점, 차단은 서버 책임)
- [ ] **접근성**
  - `<Dialog>` aria-labelledby, aria-describedby
  - 필드별 `<Label htmlFor>`, 에러 `aria-invalid` + `aria-describedby`
  - 포커스 트랩, 초기 포커스: 첫 필수 필드
  - Esc 닫기 (변경 사항 있을 시 확인 prompt)
- [ ] **분석 이벤트**
  - Mixpanel: `report_dialog_open`(product_id, field_name), `report_submit`(outcome, field_name)
  - 전환율: 오픈 → 제출 비율 측정

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-028 4필드 구조화 폼**
- **Given**: 사용자가 제품 상세 페이지에서 [오류 신고]를 탭
- **When**: 모달이 열림
- **Then**: 대상 필드명 / 기존 값(프리필) / 올바른 값 / 근거 자료(선택) 4필드가 순서대로 표시된다.

**Scenario 2: 필수 필드 검증**
- **Given**: 올바른 값이 빈 상태로 [제출] 탭
- **When**: Zod validation이 동작
- **Then**: "올바른 값을 입력해 주세요" 인라인 에러가 표시되고 Server Action은 호출되지 않는다.

**Scenario 3: 정상 제출 플로우**
- **Given**: 필수 3필드가 모두 입력된 상태
- **When**: [제출] 탭
- **Then**: Server Action이 성공 응답을 반환하고 모달이 닫히며 UI-031 접수 알림이 3초 이내 표시된다.

**Scenario 4: 스팸 차단 (429) — 24h 5건+**
- **Given**: 동일 제품에 24h 내 5건 제출한 사용자
- **When**: 6번째 제출 시도
- **Then**: 토스트 warning "중복 또는 불완전한 제보입니다"가 표시되고 모달은 유지된다.

**Scenario 5: 근거 URL 포맷 검증**
- **Given**: `evidence_url`에 `ftp://example.com`을 입력
- **When**: [제출] 탭
- **Then**: "HTTPS URL을 입력해 주세요" 인라인 에러가 표시된다.

**Scenario 6: 모바일 하단 시트**
- **Given**: 뷰포트 < 640px
- **When**: 모달이 열림
- **Then**: 하단에서 올라오는 `Sheet` 형태로 렌더되고, 하단 키보드가 열려도 제출 버튼이 sticky로 보인다.

**Scenario 7: 금지 표현 경고**
- **Given**: `new_value`에 "암 치료 효과 있음"을 입력
- **When**: 포커스 아웃
- **Then**: 인라인 경고 "기능성 표시 규정 위반 가능성이 있습니다"가 표시되고, 사용자가 수정하지 않을 경우 서버(F2-C-002)에서 최종 차단된다.

**Scenario 8: 로그인/비로그인 분기**
- **Given**: 비로그인 상태
- **When**: 모달이 열림
- **Then**: "연락받을 이메일(선택)" 필드가 표시되고, 로그인 상태에서는 숨겨진다.

**Scenario 9: 포커스 트랩 & Esc**
- **Given**: 모달이 열린 상태
- **When**: Tab 반복 + Esc
- **Then**: 포커스가 모달 내부에서만 순환하고, Esc 시 변경사항 있으면 확인 prompt → 닫기.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-028 4필드 고정**: 필드명·기존값·올바른값은 필수, 근거자료는 선택. 필드 추가/변경은 API-004와 동시 개정 필요.
- **REQ-FUNC-024 3초 이내 접수 알림**: Server Action 응답 즉시 UI-031 토스트 호출.
- **REQ-FUNC-027 스팸 차단(24h 5건+)**: F4-C-002 결과를 UI 친화적으로 변환(429 → 친화 문구).
- **CON-4 최소 수집**: 이메일은 비로그인 + 회신 희망 시에만 수집.
- **SSOT Zod 스키마**: API-004 스키마 import, UI에서 중복 정의 금지.
- **반응형**: 모바일 Sheet / 데스크탑 Dialog 자동 전환(`useMediaQuery`).
- **접근성(WAI-ARIA Dialog)**: 포커스 트랩, aria-labelledby, Esc 확인.
- **금지 표현 사전 경고**: 클라이언트는 힌트만 제공, 최종 차단은 서버 F2-C-002.
- **i18n**: 모든 문구 키 관리.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] API-004 Zod 스키마로 클라이언트 검증이 동작하는가?
- [ ] Server Action(F4-C-001) 호출 및 성공/실패 분기가 구현되었는가?
- [ ] UI-031과 연계된 접수 확인 알림이 3초 이내 표시되는가?
- [ ] 스팸 차단(429), 검증 실패(400), 서버 오류(500) 3종 모두 UX 처리?
- [ ] 모바일 Sheet / 데스크탑 Dialog 반응형이 동작하는가?
- [ ] 로그인/비로그인 이메일 분기가 적용되었는가?
- [ ] 금지 표현 클라이언트 힌트가 노출되는가?
- [ ] WAI-ARIA Dialog 패턴(포커스 트랩 + Esc + aria-*) 적용?
- [ ] Mixpanel `report_dialog_open`, `report_submit` 이벤트 발송?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F4-006(구조화 폼 검증)이 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-002, #UI-003(토스트), #UI-020(진입점), #API-004, #F4-C-001, #MOCK-004
- **Blocks**:
  - #UI-031 (접수 확인 알림 연계)
  - #TEST-F4-006 (구조화 폼 검증)
  - #TEST-F4-004 (스팸 차단 검증 — UI 측 경로)

## :bookmark_tabs: Notes
- "기존 값" 프리필은 실제 제품 상세 데이터에서 가져와야 오차가 없다. 사용자가 직접 입력하면 오타·잘못된 참조가 생기므로 dropdown 또는 readOnly 프리필이 원칙.
- 근거 자료(`evidence_url`)는 관리자 검증 시간을 크게 단축시킨다. 제출 유도 문구: "공식 출처 링크를 제공하시면 처리 속도가 빨라져요".
- 금지 표현 클라이언트 경고는 "표현 가이드" 역할이며, 신고 자체를 차단하지 않는다. 최종 판단은 서버 F2-C-002.
- 모달 닫기 전 변경 사항 확인 prompt는 사용자의 실수 방지 UX. 작성 중 실수로 배경 탭·뒤로가기 시 데이터 손실 방지.
