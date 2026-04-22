---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F3-C-001: 정적 OG 메타태그 URL 구성 로직 구현 (고정 서비스 로고 + title/description)"
labels: 'feature, backend, epic:E-F3, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [F3-C-001] 정적 OG 메타태그 URL 구성 로직
- 목적: 카카오톡 공유 시 사용되는 Open Graph 메타태그(title, description, image)가 포함된 URL을 구성하여, 카카오톡 공유 카드의 시각적 프리뷰를 제공한다. 고정된 서비스 로고를 사용하며, 동적 OG 이미지 생성은 배제한다.
- Epic / Phase: E-F3 (Viral Engine) / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-017
- SRS 시퀀스 다이어그램: [`/05_SRS_v1.md#3.4.3 핵심 흐름: 카카오톡 공유`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.4 상세 시퀀스: 카카오톡 공유 → 수신자 전환`](../05_SRS_v1.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.3 E-F3 Viral Engine`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩)
- 후행 태스크: F3-C-002 (카카오 Link API 호출), UI-040 (카카오톡 공유 버튼)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **OG 메타태그 구성 함수 작성** — `src/lib/share/build-og-url.ts`에 순수 함수 정의
  - 입력: `ingredient: string`, `resultCount: number`, `baseUrl: string`
  - 출력: `OgMetadata { title, description, imageUrl, url }`
- [ ] **OG title 템플릿** — `"[성분명] 1일 단가 비교 결과 | Super-Calc"` 형식 고정
- [ ] **OG description 템플릿** — `"[성분명] 포함 [N]개 제품의 1일 단가 비교. 최저가를 확인하세요."` 형식
- [ ] **OG image 설정** — 고정 서비스 로고 URL 사용 (정적 에셋, `/public/og-image.png`)
  - 권장 사이즈: 1200x630px (카카오톡 공유 카드 표준)
  - 대체 이미지 fallback 로직 포함
- [ ] **Next.js Metadata API 연동** — `src/app/compare/[...slug]/layout.tsx` 또는 `page.tsx`에서 `generateMetadata()` 활용
  - `openGraph.title`, `openGraph.description`, `openGraph.images` 설정
  - `twitter:card` 메타태그도 병행 설정
- [ ] **URL 구성 유틸리티** — 공유 대상 URL에 UTM 파라미터 자동 부착
  - `utm_source=kakao`, `utm_medium=share`, `utm_campaign=compare`
  - 기존 URL 파라미터와 충돌 방지
- [ ] **단위 테스트** — OG 메타데이터 구성 함수의 입출력 검증

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정적 OG 메타태그가 올바르게 구성된다**
- **Given**: `ingredient="비타민D"`, `resultCount=15` 입력이 주어진 상태
- **When**: OG 메타태그 구성 함수를 호출한다
- **Then**: `title`에 "비타민D", `description`에 "15개 제품", `imageUrl`에 서비스 로고 URL이 포함된다.

**Scenario 2: OG image가 유효한 URL을 반환한다**
- **Given**: 서비스 로고 이미지가 `/public/og-image.png`에 존재하는 상태
- **When**: OG imageUrl을 구성한다
- **Then**: 절대 URL(`https://domain.com/og-image.png`)이 반환되며, 이미지 접근 시 HTTP 200이다.

**Scenario 3: UTM 파라미터가 URL에 부착된다**
- **Given**: 공유 대상 URL이 `https://domain.com/compare?ingredient=vitaminD`인 상태
- **When**: 공유 URL을 구성한다
- **Then**: `utm_source=kakao&utm_medium=share&utm_campaign=compare`가 쿼리 파라미터로 포함된다.

**Scenario 4: 순수 함수 보장**
- **Given**: 동일 입력으로 10회 반복 호출한다
- **When**: OG 메타태그 구성 함수를 실행한다
- **Then**: 부수 효과 없이 동일한 결과가 10회 모두 반환된다.

## :gear: Technical & Non-Functional Constraints
- **정적 OG (REQ-FUNC-017)**: 동적 OG 이미지 생성(서버사이드 렌더링 이미지)은 MVP 범위에서 배제. 고정 서비스 로고만 사용.
- **카카오톡 호환**: 카카오톡 내장 브라우저의 OG 파싱 규격 준수. `og:title` 최대 100자, `og:description` 최대 200자.
- **Next.js Metadata API**: App Router의 `generateMetadata()` 패턴을 사용하여 SSR 시점에 OG 태그를 삽입.
- **순수 함수**: I/O 의존성, DB 의존성 없이 입력→출력만 수행.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] OG 메타태그 구성 함수가 순수 함수로 분리되었는가?
- [ ] 서비스 로고 이미지(`/public/og-image.png`)가 1200x630px 규격으로 존재하는가?
- [ ] UTM 파라미터 부착 유틸리티가 동작하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] 단위 테스트가 작성되고 통과하는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩)
- **Blocks**:
  - #F3-C-002 (카카오 Link API 호출 — OG 메타데이터 입력으로 사용)
  - #UI-040 (카카오톡 공유 버튼)
  - #TEST-F3-001 (OG 메타태그 유효성 테스트)
