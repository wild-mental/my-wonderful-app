---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F3-C-003: 카카오 API 장애 시 폴백 처리 로직 (URL 복사 + 토스트 알림, 1초 이내 전환)"
labels: 'feature, frontend, epic:E-F3, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F3-C-003] 카카오 API 장애 시 폴백 처리 로직
- 목적: 카카오 Link API가 타임아웃, 오류, 정책 변경 등으로 실패했을 때, 1초 이내에 "URL 복사" 폴백 UI로 자동 전환하여 사용자의 공유 행위가 중단되지 않도록 보장한다. CP-2 우회 전략의 즉시 대응(D+0) 단계를 구현한다.
- Epic / Phase: E-F3 (Viral Engine) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3`](../05_SRS_v1.md) — REQ-FUNC-021 (폴백 UI, 토스트 알림)
- SRS 비상 대응: [`/05_SRS_v1.md#1.2.5 CP-2`](../05_SRS_v1.md) — 즉시(D+0) 우회 전략
- SRS 시퀀스: [`/05_SRS_v1.md#6.3.4`](../05_SRS_v1.md) — 카카오 API 장애 분기
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.3 E-F3`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F3-C-002** (카카오 Link API 호출)
- 후행 태스크: UI-041 (URL 복사 폴백 UI + 토스트), TEST-F3-002

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **폴백 판단 로직** — `src/lib/share/share-fallback.ts`
  - `ShareResult.success === false` 수신 시 즉시 폴백 모드 진입
  - 장애 유형 분류: `TIMEOUT`, `SDK_ERROR`, `API_ERROR`, `POLICY_BLOCKED`
- [ ] **클립보드 복사 기능** — `navigator.clipboard.writeText(url)` 기반
  - 비동기 Clipboard API (HTTPS 필수, Vercel 기본 SSL 충족)
  - 구형 브라우저 대비 `document.execCommand('copy')` 폴백
  - 복사 대상 URL: 비교 결과 페이지 URL + UTM 파라미터
- [ ] **폴백 전환 시간 보장** — 카카오 API 실패 감지 후 1초 이내 폴백 UI 표시
  - `ShareResult` 반환 즉시 UI 상태 변경 (React state)
  - 네트워크 타임아웃(3초)과 별개로, UI 전환은 결과 수신 후 즉시
- [ ] **토스트 알림 연계** — 복사 완료 시 토스트 메시지
  - 성공: `"링크가 복사되었습니다"` (UI-003 토스트 컴포넌트 활용)
  - 실패: `"카카오톡 공유가 일시적으로 불가합니다. URL을 복사하여 공유해 주세요."`
- [ ] **Web Share API 대안 경로** — `navigator.share()` 지원 브라우저에서 추가 대안 제공
  - 지원 확인: `typeof navigator.share === 'function'`
  - 미지원 시 클립보드 복사만 활성화
- [ ] **공유 실패율 모니터링 데이터 구성** — 폴백 발동 시 `share_fallback` 이벤트 데이터 준비 (COM-C-004/005에서 Mixpanel 전송)
- [ ] **단위 테스트** — 폴백 전환 시간 1초 이내 검증, 클립보드 복사 성공/실패

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 카카오 API 장애 시 1초 이내 폴백 전환 (REQ-FUNC-021)**
- **Given**: 카카오 Link API가 타임아웃/오류를 반환하는 상태
- **When**: 사용자가 "카톡 공유" 버튼을 탭한다
- **Then**: 1초 이내에 "URL 복사" 폴백 UI가 표시된다.

**Scenario 2: URL 복사 성공 시 토스트 표시**
- **Given**: 폴백 UI가 표시된 상태
- **When**: 사용자가 "URL 복사" 버튼을 탭한다
- **Then**: 클립보드에 URL이 복사되고, "링크가 복사되었습니다" 토스트 알림이 표시된다.

**Scenario 3: 폴백 경로 공유 성공률 95% 이상 (REQ-FUNC-021)**
- **Given**: 카카오 API 장애 상황에서 폴백 경로를 사용하는 상태
- **When**: 100회의 폴백 공유를 시도한다
- **Then**: 클립보드 복사 또는 Web Share API를 통한 공유 성공률이 95% 이상이다.

**Scenario 4: 공유 실패율 5% 초과 시 폴백 기본 활성화**
- **Given**: 공유 기능 실패율이 5%를 초과하는 상태 (CP-2 모니터링)
- **When**: 시스템이 실패율 임계치를 감지한다
- **Then**: 폴백 UI가 기본 활성화(카카오 공유 버튼 대신 URL 복사 버튼을 기본 표시) 설정이 가능하다.

## :gear: Technical & Non-Functional Constraints
- **전환 시간 (REQ-FUNC-021)**: 카카오 API 실패 감지 후 폴백 UI 표시까지 **1초 이내** 엄격 준수.
- **클라이언트 사이드**: 클립보드 API, Web Share API 모두 브라우저 전용. `'use client'` 컴포넌트에서만 동작.
- **HTTPS 필수**: `navigator.clipboard.writeText()`는 Secure Context(HTTPS)에서만 동작. Vercel SSL 기본 적용으로 충족.
- **CP-2 준수**: 카카오 정책 변경 시 코드 수정 없이 폴백을 기본 모드로 전환할 수 있는 Feature Flag 구조 권장.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 폴백 전환 시간이 1초 이내인 것이 검증되었는가?
- [ ] 클립보드 복사 + 토스트 알림이 동작하는가?
- [ ] Web Share API fallback이 구현되었는가?
- [ ] 장애 유형 분류가 `ShareResult.error.code`로 표현되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #F3-C-002 (카카오 Link API 호출 — `ShareResult` 반환)
- **Blocks**:
  - #UI-041 (URL 복사 폴백 UI + 토스트)
  - #TEST-F3-002 (카카오 장애 폴백 1초 이내 검증)
