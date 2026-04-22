---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-C-004: 제보 수정 완료 시 이메일 알림 발송 로직 (Resend API, 수정 후 1시간 이내)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-C-004] 제보 수정 완료 시 이메일 알림 발송
- 목적: 오류 제보가 검증·수정 완료(RESOLVED) 또는 반려(REJECTED)되었을 때, 제보자에게 Resend API를 통해 이메일 알림을 발송한다. 수정 완료 후 1시간 이내 발송을 보장한다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-026 (이메일 알림 + 리워드)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 이메일 알림 트리거
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Notification Actions (Resend API)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F4-C-003** (제보 상태 변경 — RESOLVED/REJECTED 트리거)
- 후행 태스크: TEST-F4-005 (제보 전체 생명주기 테스트)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **이메일 발송 함수** — `src/lib/notifications/send-report-email.ts`
  - 입력: `reportId: string`, `status: 'RESOLVED' | 'REJECTED'`, `reason?: string`
  - Resend API 호출 (`@resend/node` 라이브러리)
- [ ] **이메일 템플릿 구성** — 두 가지 시나리오
  - **수정 완료 (RESOLVED)**: `"귀하의 제보로 수정되었습니다. [수정 내용 요약]"`
  - **반려 (REJECTED)**: `"확인 결과 현재 데이터가 정확합니다. [사유]"`
- [ ] **수신자 이메일 조회** — `reporter_id` → USER 테이블 → `email` 조회
- [ ] **Resend API 연동** — `src/lib/notifications/resend-client.ts`
  - `RESEND_API_KEY` 환경변수 사용
  - 발신자: `noreply@{domain}` 또는 Resend 기본 도메인
  - 에러 핸들링 (API 장애 시 재시도 1회)
- [ ] **발송 시간 보장** — 수정 후 1시간 이내 발송 (REQ-FUNC-026)
  - F4-C-003의 상태 전이 직후 동기적으로 호출
  - 발송 실패 시 에러 로깅 + 재시도 큐 (간이 구현)
- [ ] **환경변수** — `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`를 `.env.example`에 추가
- [ ] **단위 테스트** — 이메일 구성 검증, Resend API mock, 발송 실패 시 재시도

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 수정 완료 시 감사 이메일 발송 (REQ-FUNC-026)**
- **Given**: 제보가 `RESOLVED`로 상태 전이된 상태
- **When**: 이메일 알림 함수가 트리거된다
- **Then**: 제보자 이메일로 "귀하의 제보로 수정되었습니다" 이메일이 발송된다.

**Scenario 2: 반려 시 사유 안내 이메일 발송**
- **Given**: 제보가 `REJECTED`로 상태 전이된 상태 (사유: "현재 데이터가 정확합니다")
- **When**: 이메일 알림 함수가 트리거된다
- **Then**: 제보자 이메일로 "확인 결과 현재 데이터가 정확합니다. [사유]" 이메일이 발송된다.

**Scenario 3: 수정 후 1시간 이내 발송 (REQ-FUNC-026)**
- **Given**: 제보가 `RESOLVED`로 전이된 시점
- **When**: 이메일 발송까지의 시간을 측정한다
- **Then**: 수정 완료 후 1시간 이내에 이메일이 발송된다.

**Scenario 4: Resend API 장애 시 재시도**
- **Given**: Resend API가 일시적으로 503 에러를 반환하는 상태
- **When**: 이메일 발송을 시도한다
- **Then**: 1회 재시도가 수행되며, 최종 실패 시 에러 로그에 기록된다.

## :gear: Technical & Non-Functional Constraints
- **발송 시간 (REQ-FUNC-026)**: 수정 후 1시간 이내. 동기적 호출로 즉시 발송 시도.
- **Resend API**: 무료 플랜 일 100건 제한. MVP 규모에서 충분.
- **이메일 보안**: 이메일 본문에 민감 정보(비밀번호, 세션 토큰 등) 미포함.
- **환경변수 (NFR-005)**: `RESEND_API_KEY`는 서버 전용 환경변수. `NEXT_PUBLIC_` 접두사 금지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] Resend API 연동이 동작하는가?
- [ ] RESOLVED/REJECTED 두 템플릿이 구현되었는가?
- [ ] 발송 실패 시 재시도 + 에러 로깅이 동작하는가?
- [ ] `.env.example`에 `RESEND_API_KEY` 플레이스홀더가 추가되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #F4-C-003 (제보 상태 변경 — RESOLVED/REJECTED 트리거)
- **Blocks**:
  - #TEST-F4-005 (제보 전체 생명주기 테스트 — 이메일 알림 포함)

## :bookmark_tabs: Notes
- Resend API 대신 다른 이메일 서비스(SendGrid, AWS SES 등)를 사용할 수 있으나, SRS §3.6 컴포넌트 다이어그램에 Resend API가 명시되어 있으므로 이를 기본으로 구현한다.
- MVP 단계에서는 이메일 템플릿을 코드 내 문자열로 관리. Phase 2에서 React Email 등 템플릿 엔진 도입 검토.
