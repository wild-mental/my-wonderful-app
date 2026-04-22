---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] UI-051: 마케팅 콘텐츠 0건 표시 보장 — 제품 상세 페이지 광고/리뷰/별점/체험단 노출 차단 검증"
labels: 'feature, frontend, epic:E-UI, priority:critical, phase:5, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [UI-051] 마케팅 콘텐츠 0건 보장 검증
- 목적: 제품 상세 페이지(UI-020)에서 제휴 광고 배너, 유저 리뷰, 별점, 체험단 블로그 링크가 0건 표시되는 것을 코드 리뷰와 자동화 테스트로 보장한다. Anti-BS Dashboard의 핵심 가치인 마케팅 노이즈 원천 차단을 기술적으로 보증한다.
- Epic / Phase: E-UI / Phase 5 (프론트엔드)
- 복잡도: L

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-010 (마케팅 콘텐츠 0건)
- 선행 태스크: **UI-020** (제품 상세 페이지)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **마케팅 콘텐츠 정의** — 차단 대상 4가지 유형
  1. 제휴 광고 배너 (배너 이미지, 스폰서 태그)
  2. 유저 리뷰 (별점, 텍스트 리뷰, 리뷰 수)
  3. 별점 (5점 만점 표시, 평균 점수)
  4. 체험단 블로그 링크 (외부 블로그 URL, 후기 섹션)
- [ ] **코드 검증** — 제품 상세 페이지 컴포넌트 트리에 해당 요소가 존재하지 않음을 확인
  - `review`, `rating`, `star`, `sponsor`, `ad-banner`, `blog`, `experience` 관련 컴포넌트/HTML 요소 0건
- [ ] **자동화 테스트** — `tests/unit/ui/zero-marketing.test.tsx`
  - 렌더 스냅샷에서 금지 키워드 검색
  - DOM에 `[data-testid="review"]`, `[data-testid="rating"]` 등 존재 여부 확인 → 0건
- [ ] **ESLint 커스텀 룰 (선택)** — 제품 상세 페이지 파일에서 `Review`, `Rating`, `StarScore` 컴포넌트 import 차단

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 마케팅 콘텐츠 0건 (REQ-FUNC-010)**
- **Given**: 사용자가 제품 상세 페이지에 진입한 상태
- **When**: 페이지가 로드된다
- **Then**: 광고 배너 0건, 유저 리뷰 0건, 별점 0건, 체험단 링크 0건이다.

**Scenario 2: DOM 내 금지 요소 미존재**
- **Given**: 제품 상세 페이지 렌더 결과
- **When**: `review`, `rating`, `sponsor`, `ad-banner` 관련 테스트 ID를 검색한다
- **Then**: 모든 검색 결과가 0건이다.

## :gear: Technical & Non-Functional Constraints
- **Anti-BS 핵심 가치**: 이 태스크는 브랜드 신뢰도의 技術的 보증. 실패 시 서비스 핵심 가치 훼손.

## :checkered_flag: Definition of Done (DoD)
- [ ] 자동화 테스트가 마케팅 콘텐츠 0건을 보증하는가?
- [ ] 컴포넌트 트리에 리뷰/별점/광고/체험단 요소가 존재하지 않는가?
- [ ] `pnpm test` 에러 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #UI-020 (제품 상세 페이지)
- **Blocks**: QA 릴리스 검증, #TEST-F2-001 (마케팅 0건 보장 테스트)
