---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-041: URL 복사 폴백 UI + 토스트 (Kakao SDK 실패 시 1초 내 전환)"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:S'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-041] URL 복사 폴백 UI + 토스트
- 목적: REQ-FUNC-021("카카오톡 SDK 실패·미지원·권한 거부 시 1초 이내 URL 복사 UI로 전환")를 충족하는 폴백 UX를 구현한다. UI-040의 실패/타임아웃 시그널을 받아 클립보드에 공유 URL을 즉시 복사하고, 토스트 + 보조 패널로 사용자가 수동으로 공유를 이어갈 수 있도록 한다. Kakao 성공 경로와 합쳐 총 공유 성공률 ≥ 98%(REQ-NF-017)를 달성한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: S

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-021 (SDK 실패 시 1초 내 URL 복사)
- SRS 비기능: [`/05_SRS_v1.md#4.2 REQ-NF-017`](../05_SRS_v1.md) — 공유 성공률 ≥ 98%
- 관련 구현 태스크: [`/TASKS/F3-C-003_kakao_fallback.md`](./F3-C-003_kakao_fallback.md), [`/TASKS/UI-040_kakao_share_button.md`](./UI-040_kakao_share_button.md), [`/TASKS/UI-003_toast_notification.md`](./UI-003_toast_notification.md)
- 선행 태스크: **UI-003**(토스트), **UI-040**(카카오 공유 버튼 — 실패 시그널 소스), **F3-C-003**(폴백 결정 로직)
- 후행 태스크: TEST-F3-002(폴백 통합 테스트)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **ShareFallbackSheet 컴포넌트** — `src/features/share/share-fallback-sheet.tsx` (Client Component)
  - Props: `{ shareUrl: string; open: boolean; reason: "sdk_unavailable" | "timeout" | "permission_denied" | "unsupported_browser"; onClose: () => void }`
  - 모바일: 하단 `Sheet` / 데스크탑: 작은 `Dialog`
  - 구성 요소:
    - 메시지 영역(실패 이유별 맞춤 문구)
    - URL 표시 + [복사] 버튼
    - 카카오톡/문자/메일 앱 네이티브 공유 링크(모바일 `Web Share API` 지원 시)
- [ ] **자동 복사 동작**
  - 컴포넌트 open 시 `navigator.clipboard.writeText(shareUrl)` 자동 실행
  - 성공: 토스트 info "공유 링크가 복사되었습니다. 원하는 곳에 붙여넣어 주세요"
  - 실패(권한 거부): 텍스트 필드를 자동 `select()` 상태로 표시 + "Ctrl+C / 길게 눌러 복사" 힌트
- [ ] **Web Share API fallback-of-fallback**
  - `navigator.share`가 지원되는 기기(iOS Safari, Android Chrome)에서는 [다른 앱으로 공유] 버튼 표시 → 네이티브 시트 호출
  - 미지원 기기에서는 숨김
- [ ] **UI-040 연계 트리거**
  - UI-040에서 `onFallback(reason: Reason)` 호출 → 본 컴포넌트 `open=true`
  - 공유 URL은 이미 F3-C-001의 shareKey로 발급된 `/share/{shareKey}`를 그대로 재사용
- [ ] **이유별 메시지 (i18n 키)**
  - `sdk_unavailable`: "카카오톡 공유를 시작할 수 없어 링크를 복사해 드렸어요."
  - `timeout`: "카카오톡이 늦게 응답해 링크를 복사해 드렸어요."
  - `permission_denied`: "공유 권한이 거부되어 링크를 복사해 드렸어요."
  - `unsupported_browser`: "이 브라우저에서는 직접 공유가 어려워 링크를 복사해 드렸어요."
- [ ] **토스트 통지**
  - 자동 복사 성공 시: `toast.info({ title: "링크가 복사되었습니다", description: "카카오톡 대화창에 붙여넣어 공유해 주세요" })`
  - duration 5초
- [ ] **재시도 CTA**
  - 패널 하단 [카카오톡으로 다시 시도] 링크 — UI-040의 공유 함수 재호출
  - 실패 이유가 `unsupported_browser`인 경우에는 비활성화
- [ ] **분석 이벤트 (COM-C-005)**
  - Mixpanel: `kakao_share_fallback_open`(reason), `share_url_copy`(reason, outcome)
  - 재시도 탭: `kakao_share_retry`
- [ ] **접근성**
  - `<Dialog>`/`<Sheet>` + `role="dialog"` + `aria-labelledby`
  - 토스트: UI-003 공통 live region 사용
  - 복사 버튼 `aria-label="공유 링크 복사"`

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-021 — 1초 이내 폴백 전환**
- **Given**: UI-040에서 Kakao SDK가 1초 내 응답 없이 타임아웃
- **When**: `onFallback("timeout")` 호출
- **Then**: UI-041 패널이 1초 이내(실질 < 200ms)에 표시되고 링크 복사가 자동 수행된다.

**Scenario 2: 자동 복사 성공 토스트**
- **Given**: 폴백 진입, 클립보드 권한 허용 환경
- **When**: 패널 오픈 시 `navigator.clipboard.writeText` 성공
- **Then**: "링크가 복사되었습니다" info 토스트가 5초간 노출된다.

**Scenario 3: 권한 거부 → 수동 복사 유도**
- **Given**: 클립보드 권한이 거부된 환경
- **When**: 폴백 진입
- **Then**: `<input readOnly>`가 텍스트 selected 상태로 렌더되고 "Ctrl+C / 길게 눌러 복사" 안내가 표시된다.

**Scenario 4: Web Share API 가용 기기**
- **Given**: Android Chrome `navigator.share` 지원
- **When**: 패널 오픈
- **Then**: [다른 앱으로 공유] 버튼이 노출되고, 탭 시 네이티브 공유 시트가 호출된다.

**Scenario 5: 이유별 메시지 분기**
- **Given**: 각 4가지 reason
- **When**: 패널 오픈
- **Then**: 이유별 고정 문구가 i18n 키 기반으로 표시된다(다른 이유와 혼용 금지).

**Scenario 6: 재시도 CTA 동작**
- **Given**: reason="timeout" 폴백에서 [카카오톡으로 다시 시도] 탭
- **When**: UI-040의 공유 함수가 재호출
- **Then**: Kakao SDK 호출 플로우가 다시 시작된다.

**Scenario 7: REQ-NF-017 총 성공률 98% 달성**
- **Given**: 폴백을 포함한 전체 공유 시도 샘플
- **When**: 총 성공(=SDK 성공 + 폴백 복사 성공) / 총 시도
- **Then**: ≥ 98%이다.

**Scenario 8: 분석 이벤트 발송**
- **Given**: 폴백 오픈 + 자동 복사 성공
- **When**: Mixpanel에 이벤트가 쌓임
- **Then**: `kakao_share_fallback_open`(reason), `share_url_copy`(outcome="success") 각 1회 발송된다.

**Scenario 9: 접근성 — 포커스 트랩**
- **Given**: 패널 오픈
- **When**: Tab 반복
- **Then**: 포커스가 [복사] / [재시도] / [닫기] 내부에서만 순환하고, Esc로 닫힌다.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-021 1초 전환**: 패널 렌더 + 클립보드 호출은 모두 동기/이벤트 루프 내 처리 — 실질 < 200ms. UI-040 타임아웃 + 본 컴포넌트 렌더 합계가 1초 이내여야 함.
- **REQ-NF-017 98% 성공률**: 자동 복사가 핵심 경로. 클립보드 API 미지원 브라우저에서도 수동 select+copy로 성공 유도.
- **Clipboard API 제약**: `navigator.clipboard.writeText`는 HTTPS + user gesture 필요. 폴백은 UI-040 버튼 탭의 gesture 컨텍스트에서 트리거되므로 충족.
- **Web Share API는 보조 경로**: 있으면 사용, 없으면 무시. 존재 확인은 `typeof navigator.share === "function"`.
- **보안**: `shareUrl`은 F3-C-001이 발급한 상대 경로 기반 절대 URL. XSS 방지를 위해 `<input>` 값에만 주입하고 innerHTML 사용 금지.
- **공유 URL 불변성**: UI-040/UI-041이 같은 shareKey를 참조해야 분석·트래킹이 일치. 두 경로에서 재발급 금지.
- **접근성(WAI-ARIA Dialog)**: 포커스 트랩, Esc 닫기, aria-labelledby.
- **토스트 지속 시간 5초**: 일반 info(3초)보다 길게 설정 — 사용자가 카카오톡으로 전환 후 붙여넣기까지 알림 유지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] 1초 이내 폴백 전환 + 자동 복사가 동작하는가?
- [ ] 권한 거부 환경에서 수동 select+copy가 동작하는가?
- [ ] Web Share API 지원 기기에서 [다른 앱으로 공유]가 표시되는가?
- [ ] 이유별 메시지 4종이 i18n 키로 분리되었는가?
- [ ] 재시도 CTA가 UI-040 공유를 재호출하는가?
- [ ] Mixpanel `kakao_share_fallback_open`, `share_url_copy`, `kakao_share_retry` 이벤트 발송?
- [ ] 접근성(포커스 트랩, Esc, aria-*) 적용?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F3-002가 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-003(토스트), #UI-040(실패 시그널 소스), #F3-C-003(폴백 정책)
- **Blocks**:
  - #TEST-F3-002 (카카오 폴백 통합 테스트)

## :bookmark_tabs: Notes
- "카카오가 실패했는데 링크가 자동으로 복사되어 있었다" — 이 경험이 98% 성공률의 핵심이다. 사용자가 "복사하세요" 버튼을 눌러야 한다면 실패다.
- Web Share API는 점점 범용화되고 있으나 iOS Safari에서는 사용자 gesture 컨텍스트가 까다로워 별도 [다른 앱으로 공유] 버튼으로 UX 일관성 확보.
- 재시도 CTA는 일회성 장애(네트워크 블립, SDK 로드 지연)에서 유용. 3회 이상 재시도 실패 시에는 [문의하기] CTA 노출을 Phase 2에 검토.
- `shareUrl` 자체에는 개인정보가 없도록 shareKey는 UUID로 생성(F3-C-001 책임). 본 컴포넌트는 URL 불신 가정 하에도 안전.
