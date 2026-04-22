---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-031: 오류 제보 접수 확인 알림 UI (예상 처리 시간 48h 표시)"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-031] 오류 제보 접수 확인 알림 UI
- 목적: REQ-FUNC-024 AC("접수 확인 알림이 3초 이내 표시되고, 예상 처리 시간(48시간)이 안내된다")를 충족하는 사용자 피드백 UI를 구현한다. UI-030 모달 제출 성공 직후 UI-003 토스트 + 인페이지 확인 블록을 조합하여, 사용자가 본인 제보가 안전하게 접수되었고 SLA 안에 처리될 것임을 즉시 인지하도록 한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-024 (3초 이내 알림 + 48h SLA 안내), REQ-FUNC-025 (48h 이내 검증 완료)
- SRS 비기능: [`/05_SRS_v1.md#4.2 REQ-NF-023`](../05_SRS_v1.md) — SLA 48h 초과 알림
- 관련 구현 태스크: [`/TASKS/UI-003_toast_notification.md`](./UI-003_toast_notification.md), [`/TASKS/UI-030_error_report_form_modal.md`](./UI-030_error_report_form_modal.md), [`/TASKS/F4-C-001_error_report_submission.md`](./F4-C-001_error_report_submission.md), [`/TASKS/F4-C-004_report_email_notification.md`](./F4-C-004_report_email_notification.md)
- 선행 태스크: **UI-003**(토스트), **UI-030**(제보 폼), **F4-C-001**(접수 Server Action)
- 후행 태스크: TEST-F4-003(접수 알림 3초 이내), TEST-F4-005(전체 생명주기)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **토스트 래퍼 함수** — `src/features/trust/toast-report-submitted.ts`
  - 공개 함수: `toastReportSubmitted({ reportId, productName }: { reportId: string; productName: string })`
  - 내부에서 UI-003의 `toast.success()` 호출
  - 문구(고정, i18n 키):
    - 메인: "제보가 접수되었습니다"
    - 설명: "예상 처리 시간: 48시간 이내 / 접수번호: #{reportId}"
    - action: `{ label: "내 제보 보기", onClick: navigateToMyReports }`(로그인 시만)
  - duration: 6,000ms(사용자가 접수번호를 복사할 시간 확보)
- [ ] **인페이지 확인 블록(옵션)**
  - UI-030 모달 닫힌 직후 제품 상세 페이지 상단에 "방금 제보가 접수되었습니다 (접수번호 #12345 · 48시간 내 검토)" alert(`variant="success"`)
  - dismissible (X 버튼), 세션 스토리지에 `dismissed_reports` 저장으로 새로고침 후 재노출 방지
- [ ] **제보 이력 조회 링크** — 로그인 사용자
  - "내 제보 보기" CTA → `/my/reports` 또는 향후 마이페이지 라우트
  - 접수번호 클릭 시 해당 제보 상세로 이동(Phase 2)
- [ ] **복사 가능한 접수번호**
  - 접수번호(`#12345`)를 탭/클릭하면 클립보드 복사 + 토스트 info "접수번호가 복사되었습니다"
  - 모바일 롱프레스 기본 복사도 허용
- [ ] **48시간 SLA 시각화**
  - 텍스트: "예상 처리 시간: 48시간 이내"
  - 선택: relative time 컴포넌트 "{처리 예정: N월 N일 오전}" 보조 표기
- [ ] **실패 시 UX**
  - Server Action 실패 시 본 UI 호출 금지. UI-030에서 에러 토스트 담당.
  - 로컬 큐 재시도는 MVP 범위 외(Phase 2 offline 지원 검토).
- [ ] **이메일 후속 안내(비로그인 + 이메일 제공)**
  - 토스트 설명 문구에 "결과는 입력하신 이메일로 안내드립니다" 추가 (F4-C-004 연계)
- [ ] **분석 이벤트**
  - Mixpanel: `report_submitted_toast_shown`(report_id, is_authenticated, has_email)
  - 접수번호 복사: `report_id_copied`
- [ ] **접근성**
  - 토스트: UI-003의 `role="status"` + `aria-live="polite"` 재사용
  - 인페이지 alert: `role="status"` + `aria-live="polite"`
  - 접수번호 버튼: `aria-label="접수번호 12345 복사"`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-024 3초 이내 표시**
- **Given**: UI-030에서 Server Action이 성공 응답을 반환
- **When**: `toastReportSubmitted()` 호출
- **Then**: 토스트가 3초 이내(실질 < 100ms)에 화면에 표시된다.

**Scenario 2: 48h 안내 문구**
- **Given**: 토스트가 표시된 상태
- **When**: 토스트 DOM을 검사
- **Then**: "예상 처리 시간: 48시간 이내" 문구가 포함된다.

**Scenario 3: 접수번호 표시 & 복사**
- **Given**: 토스트가 접수번호 "#12345"를 표시
- **When**: 사용자가 접수번호를 탭
- **Then**: 클립보드에 "12345"가 복사되고 info 토스트 "접수번호가 복사되었습니다"가 노출된다.

**Scenario 4: 로그인 사용자 — "내 제보 보기" CTA**
- **Given**: 로그인된 상태에서 토스트가 표시됨
- **When**: 토스트 하단 [내 제보 보기] 버튼 탭
- **Then**: `/my/reports`로 라우팅된다.

**Scenario 5: 비로그인 + 이메일 미제공**
- **Given**: 비로그인 사용자가 이메일 없이 제출 성공
- **When**: 토스트 표시
- **Then**: "결과는 이메일로 안내드립니다" 문구가 생략되고, "내 제보 보기" CTA도 노출되지 않는다.

**Scenario 6: 비로그인 + 이메일 제공**
- **Given**: 비로그인 사용자가 이메일을 입력하고 제출 성공
- **When**: 토스트 표시
- **Then**: "결과는 입력하신 이메일로 안내드립니다" 문구가 포함된다.

**Scenario 7: 인페이지 alert 중복 방지**
- **Given**: 페이지 새로고침
- **When**: 동일 제보에 대한 alert 재노출 조건 확인
- **Then**: 세션스토리지 `dismissed_reports`에 ID가 있으면 재노출되지 않는다.

**Scenario 8: 접근성 — 스크린리더**
- **Given**: 스크린리더 활성화
- **When**: 토스트가 표시됨
- **Then**: `role="status"` + `aria-live="polite"`로 "제보가 접수되었습니다, 예상 처리 시간 48시간 이내"가 읽힌다.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-024 표시 시간 3초**: 서버 응답 직후 동기 호출로 < 100ms 내 토스트 표시. 사용자 체감 임계 3초는 여유.
- **문구 원문(CON-2 관련)**: "48시간" 용어는 REQ-FUNC-024/025와 일치해야 함. 변형 금지, i18n 키로 관리.
- **토스트 duration 6초**: 일반 success(3초)보다 길게 설정 — 접수번호 복사·가독 시간 확보. 호버 시 자동 pause(UI-003 기능).
- **인페이지 alert vs 토스트**: 토스트는 "확인 즉시 피드백", 인페이지 alert는 "세션 지속 피드백". 두 채널 병행으로 사용자가 놓쳐도 회복 가능.
- **클립보드 권한**: `navigator.clipboard.writeText` 미지원·권한 거부 시 fallback으로 `<input>` select+copy 제공.
- **CON-4 최소 수집**: 비로그인 이메일 제공 여부에 따라 안내 문구 분기.
- **접근성**: UI-003의 WAI-ARIA live region 그대로 활용.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~8)를 충족하는가?
- [ ] 토스트가 3초 이내 표시되는가?
- [ ] 48시간 SLA 문구가 고정 노출되는가?
- [ ] 접수번호가 복사 가능한가?
- [ ] 로그인/비로그인/이메일 제공 여부 3분기가 올바르게 분기되는가?
- [ ] 인페이지 alert가 세션 단위로 중복 방지되는가?
- [ ] WAI-ARIA live region이 적용되는가?
- [ ] Mixpanel `report_submitted_toast_shown`, `report_id_copied` 이벤트 발송?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F4-003이 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-003(토스트 프리미티브), #UI-030(제보 폼 진입점), #F4-C-001(접수 Action)
- **Blocks**:
  - #TEST-F4-003 (접수 알림 3초 이내)
  - #TEST-F4-005 (전체 생명주기 SLA 48h)

## :bookmark_tabs: Notes
- 본 UI는 "신뢰의 종결점"이다. 사용자가 제보 제출 직후 느끼는 불안(내 제보가 사라진 게 아닐까?)을 해소하는 역할이므로, 접수번호 · SLA · 내 제보 보기 3요소가 명확해야 한다.
- 접수번호 포맷은 `#12345` 또는 `ER-2026-04-20-12345` 등 UI 친화적 형태 선택. CUID 원본은 내부용으로만 유지.
- "48시간" 카운트다운을 실시간으로 보여주는 UX는 MVP 과잉. 후속 Phase 2에서 "N시간 후 처리 예정" 형태로 확장 검토.
- 토스트 duration 6초는 일반 성공(3초)보다 길다. 이 결정은 "접수번호 복사 필요"라는 사용성 가정에 기반 — A/B로 검증 후 조정.
