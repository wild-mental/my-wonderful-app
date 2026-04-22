---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-003: 토스트 알림 컴포넌트 (성공/실패/안내 3유형)"
labels: 'feature, ui, epic:E-UI, priority:high, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-003] 토스트 알림 컴포넌트 (Success/Error/Info)
- 목적: REQ-FUNC-021 카카오 폴백 알림(1초 이내 표시) 및 REQ-FUNC-024 오류 제보 접수 확인 알림(3초 이내) 등 사용자에게 즉각 피드백을 제공하는 비차단(non-blocking) 알림 컴포넌트를 구현한다. shadcn/ui Toast(Radix)를 기반으로 성공/실패/안내 3유형의 일관된 시각 언어와 자동 dismiss 동작을 제공한다.
- Epic / Phase: E-UI / Phase 5 (UI/UX 프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-021 (카카오 폴백 1초 이내 토스트)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-024 (제보 접수 알림 3초 이내)
- 선행 태스크: **UI-001** (디자인 시스템 토큰)
- 후행 태스크: UI-031 (제보 접수 알림), UI-041 (카카오 폴백 토스트), 모든 사용자 액션 피드백 의존
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.1 공통 UI 인프라`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Toast Provider 등록** — `src/app/layout.tsx`에 `<Toaster />` 추가
  - shadcn/ui `sonner` 또는 `toast` 컴포넌트 채택 결정 (sonner가 모바일 UX에 더 적합)
- [ ] **Toast 트리거 훅 또는 함수** — `src/lib/ui/toast.ts`
  - `toast.success(message, options?)`, `toast.error(message, options?)`, `toast.info(message, options?)`
  - options: `{ duration?: number; action?: { label: string; onClick: () => void }; description?: string }`
- [ ] **3유형 시각 언어**
  - Success: 초록 아이콘 + 본문, 자동 dismiss 3초
  - Error: 빨강 아이콘 + 본문, 자동 dismiss 5초 (사용자가 읽을 시간 확보)
  - Info: 회색/파랑 아이콘 + 본문, 자동 dismiss 4초
- [ ] **위치 및 스택 동작**
  - 모바일: 화면 하단 (`bottom`), safe-area 고려
  - 데스크탑: 화면 우측 하단 (`bottom-right`)
  - 동시 표시 최대 3개, 초과 시 가장 오래된 토스트 자동 dismiss
- [ ] **액션 버튼 지원** — `action` 옵션
  - 예: "다시 시도" 버튼 (`toast.error("저장 실패", { action: { label: "다시 시도", onClick: retry } })`)
- [ ] **접근성**
  - `role="status"` (success/info), `role="alert"` (error)
  - `aria-live="polite"` (success/info), `aria-live="assertive"` (error)
  - 키보드 dismiss: ESC 또는 X 버튼
- [ ] **prefers-reduced-motion 대응**
  - 슬라이드 애니메이션을 페이드로 대체
- [ ] **Mock 데모 페이지** — `/dev/components/toast` (개발 환경 전용)
  - 3유형 + action 옵션 + 다중 토스트 시각 검증

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 성공 토스트 표시 및 자동 dismiss**
- **Given**: `toast.success("저장 완료")` 호출
- **When**: UI를 관찰함
- **Then**: 초록 아이콘과 함께 토스트가 즉시(< 100ms) 표시되고, 3초 후 자동으로 사라진다.

**Scenario 2: 에러 토스트 + 액션 버튼**
- **Given**: `toast.error("저장 실패", { action: { label: "다시 시도", onClick: retry } })` 호출
- **When**: 토스트가 표시됨
- **Then**: 빨강 아이콘 + 본문 + [다시 시도] 버튼이 표시되며, 버튼 클릭 시 `retry()` 콜백이 호출된다.

**Scenario 3: REQ-FUNC-021 카카오 폴백 1초 이내**
- **Given**: 카카오 공유가 장애로 실패한 시점
- **When**: F3-C-003 폴백이 `toast.info("URL이 복사되었습니다")` 호출
- **Then**: 토스트가 < 1초 이내 화면에 표시된다.

**Scenario 4: REQ-FUNC-024 제보 접수 3초 이내**
- **Given**: F4-C-001 제보 접수 성공 응답
- **When**: `toast.success("제보가 접수되었습니다", { description: "예상 처리 시간 48h" })` 호출
- **Then**: 토스트가 < 3초 이내 표시된다.

**Scenario 5: 다중 토스트 스택**
- **Given**: 1초 간격으로 4개 토스트 호출
- **When**: 화면을 관찰함
- **Then**: 최대 3개가 동시 표시되고 가장 오래된 토스트가 자동 dismiss된다.

**Scenario 6: 접근성 — 스크린 리더**
- **Given**: 스크린 리더가 활성화된 상태
- **When**: error 토스트가 표시됨
- **Then**: `aria-live="assertive"`로 즉시 음성 읽기되고, success는 `polite`로 대기열에 추가된다.

**Scenario 7: prefers-reduced-motion**
- **Given**: 시스템 설정 `prefers-reduced-motion: reduce`
- **When**: 토스트가 표시됨
- **Then**: 슬라이드 애니메이션 대신 페이드 효과만 적용된다.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-021 표시 시간 < 1초**: 폴백 토스트는 호출 즉시 표시 (UI 렌더 임계 < 100ms 확보).
- **REQ-FUNC-024 표시 시간 < 3초**: 제보 접수 토스트는 Server Action 응답 직후 호출.
- **non-blocking**: 토스트는 사용자 입력을 차단하지 않음. 모달과 명확히 구분.
- **safe-area**: 모바일 하단 노치/홈 인디케이터 영역 회피 (`pb-[env(safe-area-inset-bottom)]`).
- **접근성**: WAI-ARIA Live Region 정확히 적용. error는 assertive, 그 외 polite.
- **번들 크기**: shadcn/ui sonner는 ~5KB로 경량. 별도 토스트 라이브러리 도입 금지.
- **dismiss 시간 차등**: error는 5초로 가장 길게 (사용자가 읽을 시간), info 4초, success 3초.
- **호버 시 일시정지**: 데스크탑에서 토스트 위 마우스 호버 시 자동 dismiss 일시정지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~7)를 충족하는가?
- [ ] `<Toaster />`가 root layout에 등록되었는가?
- [ ] `toast.success/error/info` API가 제공되며 action 옵션이 동작하는가?
- [ ] 모바일/데스크탑 위치, safe-area 고려가 적용되었는가?
- [ ] WAI-ARIA Live Region이 유형별로 정확히 적용되었는가?
- [ ] prefers-reduced-motion 대응이 동작하는가?
- [ ] 다중 토스트 스택(최대 3개) 동작이 검증되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] `/dev/components/toast` 카탈로그 페이지가 동작하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-001 (디자인 시스템 — semantic 색상)
- **Blocks**:
  - #UI-031 (제보 접수 확인 알림)
  - #UI-041 (카카오 폴백 토스트)
  - 모든 사용자 액션 피드백 (저장, 삭제, 에러 표시 등)

## :bookmark_tabs: Notes
- shadcn/ui sonner는 자체 Provider만 등록하면 어디서든 `toast()` 함수 호출 가능. React Context 의존이 적어 Server/Client Component 양쪽에서 안전하게 사용 가능 (단, 호출은 Client Component에서).
- error 토스트의 5초는 너무 길다고 느낄 수 있으나 WCAG 2.2.1 권장. 사용자 호버로 일시정지 가능하므로 절충.
- description 옵션은 본문 아래 보조 정보용. 너무 길면 토스트 크기가 커지므로 < 80자 가이드.
- action 콜백 내에서 다시 토스트를 호출할 경우 무한 루프 주의. 호출 측 책임.
