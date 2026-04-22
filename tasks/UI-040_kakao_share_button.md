---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-040: 카카오톡 공유 버튼 + Kakao Link SDK 트리거"
labels: 'feature, frontend, epic:E-UI, priority:high, phase:5, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-040] 카카오톡 공유 버튼
- 목적: REQ-FUNC-016("비교 결과에서 카카오톡 공유로 즉시 도달 가능")·REQ-FUNC-018(카카오톡 공유 카드)·REQ-FUNC-020(공유 후 3초 이내 랜딩)을 충족하는 카카오톡 공유 버튼 UI를 구현한다. 비교 결과 페이지(UI-011) 및 제품 상세 페이지(UI-020)에 배치되며, F3-C-002의 Kakao Link API 래퍼를 호출한다. 공유 실패 시 UI-041(URL 복사 폴백)으로 전환된다. 로그인 불필요·앱 설치 불필요를 보장한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-016/018/020 (공유·카드·3초 랜딩)
- SRS 비기능: [`/05_SRS_v1.md#4.2 REQ-NF-017/018`](../05_SRS_v1.md) — 공유 성공률 98%, 재노출율 30%+
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1.1 EXT-SYS-03 Kakao Link API`](../05_SRS_v1.md)
- 관련 구현 태스크: [`/TASKS/F3-C-001_og_metatag_url.md`](./F3-C-001_og_metatag_url.md), [`/TASKS/F3-C-002_kakao_link_api.md`](./F3-C-002_kakao_link_api.md), [`/TASKS/F3-C-003_kakao_fallback.md`](./F3-C-003_kakao_fallback.md), [`/TASKS/COM-C-005_kakao_share_tracking.md`](./COM-C-005_kakao_share_tracking.md)
- 선행 태스크: **UI-001**(디자인 시스템), **UI-003**(토스트), **UI-011**/UI-020(배치 컨텍스트), **F3-C-001/002/003**(백엔드 & SDK), **COM-C-005**(트래킹)
- 후행 태스크: UI-041(URL 복사 폴백), UI-042(공유 랜딩 페이지), TEST-F3-002
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#7.2 도메인별 페이지·컴포넌트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **KakaoShareButton 컴포넌트** — `src/features/share/kakao-share-button.tsx` (Client Component)
  - Props: `{ shareContext: ShareContext; variant?: "primary" | "icon"; onShared?: () => void }`
  - `ShareContext` 유니온: `{ type: "compare"; ingredientId: string; results: CompareResult[] }` | `{ type: "product"; productId: string }` | `{ type: "badge"; productId: string }`
- [ ] **Kakao SDK 초기화**
  - `app/layout.tsx` 또는 `ShareProvider`에서 `Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY)` 1회 실행
  - 중복 init 방지: `if (!Kakao.isInitialized()) Kakao.init(...)`
- [ ] **공유 페이로드 생성**
  - F3-C-001이 생성한 공유 URL(`/share/{shareKey}`) 및 OG 메타태그 사전 업로드 상태 확인
  - Kakao Link `sendDefault({ objectType: "feed", content: { title, description, imageUrl, link: { mobileWebUrl, webUrl } } })`
  - 서버 사이드에서 `shareKey` 발급 → 클라이언트가 URL 수신 후 SDK 호출
- [ ] **버튼 2가지 variant**
  - `primary`: 노란색(Kakao brand #FEE500) 버튼 + 카카오톡 아이콘 + "카카오톡으로 공유"
  - `icon`: 아이콘 단독(모바일 sticky 액션 바용)
- [ ] **공유 트리거 시나리오**
  - 비교 결과: 비교 테이블 상단 CTA + 공유 시 URL에 `shareKey` 포함
  - 제품 상세: 하단 액션 바에 배치
- [ ] **폴백 트리거 (REQ-FUNC-021)**
  - SDK 미로드, 권한 거부, 타임아웃(1초) 시 UI-041 URL 복사 UI로 전환
  - 타임아웃 판정: `Promise.race([kakaoShare, timeout(1000ms)])`
  - In-app 브라우저(Kakao 제외)에서 SDK 블록된 경우도 동일 폴백
- [ ] **공유 결과 트래킹 (COM-C-005)**
  - SDK success callback → Mixpanel `kakao_share_send`(context_type, share_key, outcome="success")
  - SDK failure → `kakao_share_send`(outcome="failed", reason)
  - 폴백 진입 → `kakao_share_fallback_open`
- [ ] **Loading & Disabled 상태**
  - shareKey 발급 중: 버튼 disabled + spinner
  - SDK 미로드 시: disabled + tooltip "공유 준비 중"
- [ ] **에러 UX**
  - 실패 시 토스트 error "공유에 실패했습니다" + "링크를 복사해 공유하시겠어요?" 보조 버튼 (UI-041 진입)
- [ ] **접근성**
  - `aria-label="카카오톡으로 공유하기"`
  - 키보드 포커스 리턴, tab-index 기본값 유지
  - prefers-reduced-motion에서 애니메이션 제거
- [ ] **i18n**
  - 버튼 라벨·에러 문구 모두 i18n 키 사용

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: REQ-FUNC-016 — 로그인 없이 공유 진입**
- **Given**: 비로그인 사용자가 비교 결과 페이지에서 카카오톡 공유 버튼을 탭
- **When**: Kakao SDK `sendDefault` 실행
- **Then**: 카카오톡 공유 대상 선택 UI가 3초 이내 표시되고, 가입/로그인 요구가 없다.

**Scenario 2: REQ-FUNC-018 공유 카드 콘텐츠**
- **Given**: 비교 결과 컨텍스트
- **When**: 공유 카드 렌더
- **Then**: 제목(성분명 + "일일 단가 비교"), 설명(최저가 X원/일), OG 이미지, 링크 URL이 모두 포함된다.

**Scenario 3: REQ-FUNC-020 3초 이내 랜딩**
- **Given**: 수신자가 카카오톡에서 공유 링크를 탭
- **When**: `/share/{shareKey}` 경로 요청
- **Then**: 랜딩 페이지(UI-042)가 3초 이내에 표시된다(p95 기준).

**Scenario 4: REQ-FUNC-021 폴백 전환**
- **Given**: Kakao SDK가 1초 내 응답하지 않음(타임아웃)
- **When**: 공유 시도
- **Then**: 1초 후 UI-041 URL 복사 UI로 전환되며, 토스트 "카카오 공유가 어렵습니다. 링크를 복사했어요"가 표시된다.

**Scenario 5: SDK 미지원 브라우저**
- **Given**: 데스크탑 Firefox 비-카카오 환경
- **When**: 공유 버튼 탭
- **Then**: SDK 호환성 체크 후 바로 URL 복사 폴백(UI-041) 실행.

**Scenario 6: 공유 성공 트래킹**
- **Given**: 공유 성공 callback 수신
- **When**: Mixpanel 이벤트 발송
- **Then**: `kakao_share_send`(context_type="compare", share_key, outcome="success")가 1회 기록된다.

**Scenario 7: REQ-NF-017 98% 성공률**
- **Given**: 10,000회 공유 시도 샘플(샘플 로그)
- **When**: success/total 비율 집계
- **Then**: (폴백 포함) 공유 성공률이 ≥ 98%이다.

**Scenario 8: 접근성**
- **Given**: 스크린리더 활성화
- **When**: 버튼 포커스
- **Then**: "카카오톡으로 공유하기 버튼"이 읽힌다.

**Scenario 9: 모바일 sticky 액션 바 아이콘 variant**
- **Given**: 뷰포트 < 640px
- **When**: 제품 상세 페이지 진입
- **Then**: 화면 하단 sticky 바에 `icon` variant가 표시되고 스크롤해도 유지된다.

## :gear: Technical & Non-Functional Constraints
- **REQ-FUNC-016/020**: 로그인·앱 설치 불필요 + 3초 이내 랜딩. shareKey 발급 API 응답 시간 p95 ≤ 500ms 필요(F3-C-001 책임).
- **REQ-NF-017 98% 성공률**: Kakao SDK 성공 + 폴백 복사 성공 합산. 폴백 트리거 조건을 충분히 넓게 설정(SDK 미로드/블록/권한 거부/타임아웃).
- **Kakao Link API 제약**: content 타이틀 ≤ 200자, description ≤ 200자, 이미지 HTTPS·5MB 이하 → F3-C-001이 사전 보장.
- **타임아웃 1초 설정**: UX 인내 임계 기반. 초과 시 자동 폴백.
- **환경 변수**: `NEXT_PUBLIC_KAKAO_JS_KEY`(Client 노출 가능). 앱 키 분리 및 admin 키 사용 금지.
- **In-App Browser 대응**: Kakao 인앱 브라우저는 SDK 기본 동작. 네이버·페이스북 인앱에서는 SDK 제한 → 폴백 자동 전환.
- **CLS ≤ 0.1**: 버튼 사이즈 고정, SDK 로딩 동안 disabled 상태 유지(레이아웃 변화 방지).
- **트래킹 PII 금지**: Mixpanel 이벤트에 user_id/email 미포함. share_key는 UUID로 식별자 자체 비식별화.
- **보안/CSP**: Kakao SDK 도메인(`*.kakao.com`, `developers.kakao.com`) CSP script-src 허용 필요.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] Kakao SDK 초기화가 멱등적이며 1회만 수행되는가?
- [ ] shareKey 발급 → SDK 호출 흐름이 정상 동작하는가?
- [ ] 1초 타임아웃 + UI-041 폴백 전환이 구현되었는가?
- [ ] SDK 미지원/인앱 브라우저에서도 폴백으로 공유 가능?
- [ ] Mixpanel `kakao_share_send`, `kakao_share_fallback_open` 이벤트 발송?
- [ ] primary / icon variant 두 가지 모두 구현?
- [ ] 접근성(aria-label, 포커스, reduced-motion) 적용?
- [ ] CSP 설정에 Kakao 도메인이 허용되었는가?
- [ ] `pnpm typecheck`, `pnpm lint` 통과?
- [ ] TEST-F3-002가 GREEN인가?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-001, #UI-003, #UI-011(배치 컨텍스트 — 비교 결과 페이지), #F3-C-001(OG), #F3-C-002(SDK), #F3-C-003(폴백), #COM-C-005(트래킹)
- **Blocks**:
  - #UI-041 (URL 복사 폴백 UI — 공유 실패 경로)
  - #UI-042 (공유 카드 랜딩 — 수신자 경로)
  - #TEST-F3-002 (카카오 폴백 통합 테스트)

## :bookmark_tabs: Notes
- 카카오톡 공유는 본 서비스의 핵심 Viral Loop이다. 98% 성공률은 단순 SDK 성공이 아니라 "사용자가 결국 공유에 성공했는가"의 UX 성공률이므로, 폴백 경로가 반드시 무장애여야 한다.
- Kakao의 정책 변경 리스크: Kakao Link API는 종종 스펙/제한 변경이 발생한다. SDK 버전 pin + Sentry 모니터링으로 회복력 확보.
- 공유 대상이 "비교 결과"인 경우, 결과 해시가 길어질 수 있어 shareKey 기반 DB 룩업이 필수(URL에 쿼리를 넣지 않음). 이는 REQ-NF-015 최소 수집과 충돌하지 않도록 shareKey에는 개인정보 미포함.
- 향후 Phase 2에서 카카오 외 채널(트위터, 인스타그램 DM)을 추가할 때, 본 컴포넌트를 `<ShareButton provider="kakao|...">` 다형 컴포넌트로 리팩터링 예정.
