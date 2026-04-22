---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F3-Q-001: 공유 카드 랜딩 페이지 데이터 조회 로직 (앱 설치/가입 불요, 비교 결과 재현)"
labels: 'feature, backend, epic:E-F3, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F3-Q-001] 공유 카드 랜딩 페이지 데이터 조회 로직
- 목적: 카카오톡에서 공유 카드를 탭한 수신자가 앱 설치 및 회원가입 없이 비교 결과 웹뷰를 즉시 확인할 수 있도록, 랜딩 페이지에 필요한 비교 결과 데이터를 조회하는 Query 로직을 구현한다.
- Epic / Phase: E-F3 (Viral Engine) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3`](../05_SRS_v1.md) — REQ-FUNC-019 (랜딩 페이지), REQ-FUNC-020 (최저가 구매 버튼)
- SRS 시퀀스: [`/05_SRS_v1.md#6.3.4`](../05_SRS_v1.md) — 수신자 랜딩 흐름
- SRS 클라이언트: [`/05_SRS_v1.md#3.2`](../05_SRS_v1.md) — CLT-02 (카카오톡 내장 브라우저 웹뷰)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.3 E-F3`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F1-RH-001** (Super-Calc Route Handler — 비교 결과 원천)
- 후행 태스크: UI-042 (공유 카드 랜딩 페이지 UI), TEST-F3-003

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **랜딩 페이지 라우트 정의** — `src/app/shared/[shareId]/page.tsx` (Server Component)
  - URL 패턴: `/shared/{shareId}` (공유 ID 기반 비교 결과 재현)
  - 인증 불요 — 미인증 사용자도 접근 가능
- [ ] **공유 데이터 조회 함수** — `src/lib/share/get-shared-comparison.ts`
  - 입력: `shareId: string` 또는 `ingredient: string, dosage?: string` (URL 파라미터)
  - 출력: `SharedComparisonData` 타입 (비교 결과 + 메타 정보)
  - DB에서 PRICE_SNAPSHOT 최신 데이터 조회 (실시간 API 재호출 대신 캐시 데이터 사용으로 p95 ≤ 2초 보장)
- [ ] **SharedComparisonData 타입 정의** — `src/types/share.ts`
  - `ingredient: string`
  - `results: PriceComparisonItem[]` (API-001 DTO 재사용)
  - `shared_at: string` (공유 시점)
  - `is_stale: boolean` (데이터 신선도 플래그, 24h 초과 시 true)
  - `lowest_price_affiliate_url: string` (최저가 제품 제휴 링크, REQ-FUNC-020)
- [ ] **카카오 내장 브라우저 호환** — 웹뷰 렌더링 최적화
  - 앱 설치 유도 배너 없음 (REQ-FUNC-019)
  - 회원가입 벽(Wall) 없음
  - 카카오톡 인앱 브라우저 UA 감지 및 대응
- [ ] **"최저가 구매하기" 버튼 데이터 준비** — 최저가 제품의 쿠팡 파트너스 딥링크 URL 반환
- [ ] **SEO/OG 메타태그** — 공유 랜딩 페이지에도 OG 태그 적용 (2차 공유 대비)
- [ ] **단위 테스트** — 조회 함수 입출력, 미존재 shareId 처리, stale 데이터 플래그

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 수신자가 앱 설치 없이 비교 결과를 확인한다 (REQ-FUNC-019)**
- **Given**: 카카오톡에서 공유 카드를 탭한 수신자(미인증, 앱 미설치)
- **When**: 랜딩 페이지가 로드된다
- **Then**: 앱 설치/회원가입 요구 없이 비교 결과 웹뷰가 표시되며, 페이지 로드 시간이 p95 ≤ 2초이다.

**Scenario 2: 최저가 구매 버튼이 제휴 딥링크로 이동한다 (REQ-FUNC-020)**
- **Given**: 랜딩 페이지에 비교 결과가 표시된 상태
- **When**: 수신자가 "최저가 구매하기" 버튼을 탭한다
- **Then**: 해당 제품의 쿠팡 파트너스 제휴 딥링크를 통해 결제 페이지로 이동한다.

**Scenario 3: 랜딩 성공률 98% 이상 (REQ-FUNC-019)**
- **Given**: 100회의 공유 카드 탭이 발생하는 상황
- **When**: 수신자가 카카오 내장 브라우저에서 링크를 열린다
- **Then**: 랜딩 성공률이 98% 이상이다.

**Scenario 4: 존재하지 않는 공유 ID 처리**
- **Given**: 만료되거나 존재하지 않는 `shareId`가 URL에 포함된 상태
- **When**: 랜딩 페이지에 접근한다
- **Then**: 404 페이지 또는 "비교 결과를 찾을 수 없습니다" 안내를 표시하고, 메인 검색으로의 CTA를 제공한다.

## :gear: Technical & Non-Functional Constraints
- **페이지 로드 시간 (REQ-FUNC-019)**: p95 ≤ 2초. 실시간 API 재호출 대신 DB 캐시 데이터를 우선 사용.
- **인증 불요**: 랜딩 페이지는 공개 접근. 인증 미들웨어에서 제외.
- **카카오 인앱 브라우저 호환 (CLT-02)**: iOS/Android 카카오톡 내장 브라우저에서 정상 렌더링 보장. `viewport` 메타태그, 모바일 터치 이벤트 호환.
- **Server Component**: Next.js Server Component로 렌더링하여 초기 로드 성능 최적화.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 미인증 수신자가 앱 설치/가입 없이 결과를 확인할 수 있는가?
- [ ] 페이지 로드 시간 p95 ≤ 2초가 검증되었는가?
- [ ] "최저가 구매하기" 딥링크가 동작하는가?
- [ ] 카카오 내장 브라우저에서 정상 렌더링되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #F1-RH-001 (Super-Calc Route Handler — 비교 결과 데이터 원천)
- **Blocks**:
  - #UI-042 (공유 카드 랜딩 페이지 UI)
  - #TEST-F3-003 (랜딩 페이지 로드 테스트)
