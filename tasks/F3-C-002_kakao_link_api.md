---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F3-C-002: 카카오 Link API 호출 로직 구현 (`Kakao.Link.sendDefault`)"
labels: 'feature, frontend, epic:E-F3, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F3-C-002] 카카오 Link API 호출 로직
- 목적: 사용자가 비교 결과 화면에서 "카톡 공유" 버튼을 탭했을 때, 카카오 JS SDK의 `Kakao.Link.sendDefault`를 호출하여 카카오톡 대화에 공유 카드를 전송하는 클라이언트 사이드 로직을 구현한다.
- Epic / Phase: E-F3 (Viral Engine) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3`](../05_SRS_v1.md) — REQ-FUNC-018 (카카오 Link API 전송)
- SRS 외부 API: [`/05_SRS_v1.md#6.1.1`](../05_SRS_v1.md) — EXT-API-03 (카카오 Link API, JS SDK)
- SRS 시퀀스: [`/05_SRS_v1.md#6.3.4 상세 시퀀스: 카카오톡 공유 → 수신자 전환`](../05_SRS_v1.md)
- SRS 비상 대응: [`/05_SRS_v1.md#1.2.5 CP-2`](../05_SRS_v1.md) — 카카오 Link API 정책 변경 시 우회
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.3 E-F3`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F3-C-001** (OG 메타태그 URL 구성)
- 후행 태스크: F3-C-003 (카카오 장애 폴백), TEST-F3-002, UI-040

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **카카오 JS SDK 초기화** — `src/lib/share/kakao-sdk.ts`
  - `Kakao.init(KAKAO_APP_KEY)` 호출 (클라이언트 사이드)
  - SDK 로드 상태 관리 (`isInitialized` 플래그)
  - Next.js Script 컴포넌트로 SDK 비동기 로드 (`strategy="lazyOnload"`)
- [ ] **환경변수 설정** — `NEXT_PUBLIC_KAKAO_APP_KEY` 환경변수 정의
  - `.env.example`에 플레이스홀더 추가
- [ ] **공유 카드 전송 함수 작성** — `src/lib/share/send-kakao-share.ts`
  - 입력: `OgMetadata` (F3-C-001에서 구성), `landingUrl: string`
  - `Kakao.Link.sendDefault()` 호출
    - `objectType: 'feed'`
    - `content: { title, description, imageUrl, link: { mobileWebUrl, webUrl } }`
    - `buttons: [{ title: '비교 결과 보기', link: { mobileWebUrl, webUrl } }]`
  - 전송 성공/실패 결과 반환 (`Promise<ShareResult>`)
- [ ] **ShareResult 타입 정의** — `src/types/share.ts`
  - `success: boolean`
  - `method: 'kakao' | 'clipboard' | 'web-share'`
  - `error?: { code: string; message: string }`
- [ ] **타임아웃 처리** — SDK 호출 시 3초 타임아웃 설정
  - 타임아웃 발생 시 `ShareResult.success = false` 반환 → F3-C-003 폴백 트리거
- [ ] **Mixpanel 이벤트 연계 준비** — 전송 성공 시 `kakao_share_send` 이벤트 데이터 구조 준비 (COM-C-005에서 실 발송)
- [ ] **단위 테스트** — SDK mock 기반 호출 검증, 타임아웃 처리 검증

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 카카오 API 정상 전송**
- **Given**: 카카오 SDK가 초기화되고, 유효한 OG 메타데이터가 주어진 상태
- **When**: `sendKakaoShare(ogMetadata, landingUrl)`을 호출한다
- **Then**: `Kakao.Link.sendDefault()`가 실행되고 `ShareResult.success = true, method = 'kakao'`가 반환된다.

**Scenario 2: 카카오 SDK 미초기화 시 에러**
- **Given**: 카카오 SDK가 초기화되지 않은 상태
- **When**: `sendKakaoShare()`를 호출한다
- **Then**: `ShareResult.success = false`, `error.code = 'SDK_NOT_INITIALIZED'`가 반환된다.

**Scenario 3: 카카오 API 타임아웃**
- **Given**: 카카오 API 응답이 3초를 초과하는 상태
- **When**: `sendKakaoShare()`를 호출한다
- **Then**: 3초 후 타임아웃이 발생하고 `ShareResult.success = false`, `error.code = 'TIMEOUT'`이 반환되어 F3-C-003 폴백을 트리거할 수 있다.

**Scenario 4: 공유 실패율 1% 미만 (REQ-FUNC-017)**
- **Given**: 정상 네트워크 환경에서 100회 공유를 시도하는 상황
- **When**: `sendKakaoShare()`를 반복 호출한다
- **Then**: 실패율이 1% 미만이다.

## :gear: Technical & Non-Functional Constraints
- **클라이언트 사이드 전용**: 카카오 JS SDK는 브라우저에서만 실행. `'use client'` 컴포넌트에서 호출.
- **SDK 로드 최적화**: `strategy="lazyOnload"`로 초기 번들에 포함하지 않음. LCP 영향 최소화.
- **카카오 정책 모니터링 (CP-2)**: 카카오 Link API 정책 변경 시 즉시 폴백(F3-C-003)으로 전환할 수 있도록 전송 로직을 분리.
- **보안**: `NEXT_PUBLIC_KAKAO_APP_KEY`는 클라이언트 노출 키이므로 도메인 제한 설정 필수 (카카오 개발자 콘솔).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 카카오 SDK 초기화 및 `sendDefault()` 호출이 동작하는가?
- [ ] 타임아웃 처리(3초)가 구현되었는가?
- [ ] `ShareResult` 타입이 성공/실패 분기를 명확히 표현하는가?
- [ ] `.env.example`에 `NEXT_PUBLIC_KAKAO_APP_KEY` 플레이스홀더가 추가되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #F3-C-001 (OG 메타태그 URL 구성)
- **Blocks**:
  - #F3-C-003 (카카오 장애 시 폴백 — `ShareResult.success = false` 분기)
  - #UI-040 (카카오톡 공유 버튼 — 클릭 핸들러에서 호출)
  - #COM-C-005 (카카오 공유 Mixpanel 추적 — 성공 이벤트 연계)
