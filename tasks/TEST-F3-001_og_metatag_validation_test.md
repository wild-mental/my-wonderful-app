---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F3-001: [Unit Test] 정적 OG 메타태그 구성 유효성 테스트 (title, description, image 필수 포함)"
labels: 'feature, test, epic:E-TEST, priority:medium, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F3-001] OG 메타태그 구성 유효성 단위 테스트
- 목적: F3-C-001의 정적 OG(Open Graph) 메타태그 URL 구성 로직이 카카오톡 공유 카드 요구 사양(REQ-FUNC-017)을 충족하는지 검증한다. `og:title`, `og:description`, `og:image`, `og:url` 4개 필수 속성의 존재·포맷·길이 제약을 단위 수준에서 검증하며, 공유 실패율 1% 미만 요건의 기술적 전제 조건을 테스트로 박제한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-017
- SRS Traceability: [`/05_SRS_v1.md#5 Traceability Matrix`](../05_SRS_v1.md) — TC-FUNC-017
- SRS 외부 API: [`/05_SRS_v1.md#6.1.1 EXT-API-03`](../05_SRS_v1.md) — 카카오 Link API
- 관련 구현 태스크: [`/TASKS/F3-C-001_og_metatag_url.md`](./F3-C-001_og_metatag_url.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#53-f3-viral-engine-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f3/og-metatag.test.ts`
- [ ] F3-C-001의 `buildOgMetadata()` 또는 동등 팩토리 함수 import
- [ ] 필수 속성 4종(`og:title`, `og:description`, `og:image`, `og:url`) 존재 검증
- [ ] `og:title` 길이 ≤ 60자, `og:description` 길이 ≤ 200자 경계 테스트
- [ ] `og:image`가 HTTPS URL 포맷인지 검증 (`.startsWith("https://")` + 절대 URL)
- [ ] `og:url`이 공유 대상 랜딩 페이지와 일치하는지 검증
- [ ] 고정 서비스 로고 URL이 `og:image`에 포함되는지 검증 (REQ-FUNC-017 "고정 서비스 로고" 요건)
- [ ] 동적 title/description에 HTML escape가 적용되어 XSS 벡터가 제거되는지 검증
- [ ] 한글 입력 정상 처리 (UTF-8 인코딩, 이모지·특수문자 포함)

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 필수 OG 속성 4종 존재
- Given: 정상적인 제품 비교 결과 페이로드가 주어진다.
- When: `buildOgMetadata()`를 호출한다.
- Then: `og:title`, `og:description`, `og:image`, `og:url`이 모두 존재하고 빈 문자열이 아니다.

Scenario 2: title 길이 상한 경계
- Given: 제품명·비교 결과가 60자 넘는 원본 입력이다.
- When: 메타데이터가 구성된다.
- Then: `og:title`은 60자 이하로 절사되며, 말줄임(…) 처리된다.

Scenario 3: image URL HTTPS 강제
- Given: 서비스 로고 자산이 CDN에 업로드된 상태다.
- When: 메타데이터가 생성된다.
- Then: `og:image` 값이 `https://`로 시작하고 절대 경로다. 상대 경로/HTTP는 허용되지 않는다.

Scenario 4: 고정 로고 사용 (동적 이미지 금지)
- Given: 동일 제품의 비교 결과가 서로 다른 사용자 컨텍스트로 2회 생성된다.
- When: 두 결과의 `og:image`를 비교한다.
- Then: 두 값이 동일한 서비스 로고 URL이다(REQ-FUNC-017: 정적·고정).

Scenario 5: XSS 방어
- Given: `<script>alert(1)</script>`이 제품명에 포함된 입력이 주어진다.
- When: 메타데이터가 생성된다.
- Then: `og:title`/`og:description`의 HTML 특수문자가 escape되어 `<`, `>`가 리터럴로 남지 않는다.

Scenario 6: 한글·이모지 처리
- Given: 제품명에 한글과 이모지(예: "비타민D ☀️")가 포함된다.
- When: 메타데이터가 생성된다.
- Then: UTF-8로 정상 직렬화되며 인코딩 깨짐이 없다.

## :gear: Technical & Non-Functional Constraints
- 테스트는 실제 카카오 API 호출 없이 메타데이터 구성 함수만 검증한다.
- HTTPS 강제·XSS escape 규칙은 리터럴 값 비교가 아닌 정규식·스키마 단위로 검증하여 향후 문구 변경에 강건하게 한다.
- 결정적 입력-출력 함수여야 하며, 랜덤·시간 의존성이 있어서는 안 된다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] OG 4종 필수 속성 검증이 포함되는가?
- [ ] HTTPS 강제, 길이 제한, XSS escape 규칙이 테스트로 보호되는가?
- [ ] 고정 서비스 로고 사용이 테스트로 박제되는가?
- [ ] `pnpm test TEST-F3-001` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F3-C-001
- Blocks: None (F3 출시 전 반드시 GREEN 필요)
