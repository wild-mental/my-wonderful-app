---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F3-003: [Integration Test] 공유 카드 랜딩 페이지 로드 테스트 (앱 설치 불요, 가입 불요, p95 ≤ 2초)"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F3-003] 공유 카드 랜딩 페이지 통합 성능 테스트
- 목적: F3-Q-001이 제공하는 공유 랜딩 페이지가 REQ-FUNC-019의 AC를 충족하는지 검증한다: (1) 앱 설치·회원가입 요구 없음, (2) 랜딩 성공률 ≥ 98%, (3) 페이지 로드 p95 ≤ 2,000ms. 카카오 내장 브라우저 사용자 에이전트 컨텍스트에서 페이지가 인증 장벽 없이 비교 결과 웹뷰를 즉시 렌더링해야 한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-019, REQ-FUNC-020
- SRS UC: [`/05_SRS_v1.md#3.5 UC-08`](../05_SRS_v1.md) — 공유 카드 랜딩 페이지 조회 (앱 설치 불요)
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-019
- 관련 구현 태스크: [`/TASKS/F3-Q-001_share_landing_query.md`](./F3-Q-001_share_landing_query.md), [`/TASKS/F1-RH-001_super_calc_route_handler.md`](./F1-RH-001_super_calc_route_handler.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#53-f3-viral-engine-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f3/share-landing.integration.test.ts`
- [ ] 공유 카드 링크 포맷(예: `/share/[comparison_id]`)으로 GET 요청 시뮬레이션
- [ ] 카카오 내장 브라우저 UA 스트링 주입 — `KAKAOTALK/10.x.x.x (Android; ...)`
- [ ] 인증 미들웨어가 본 경로에 대해 리다이렉트·차단하지 않음을 검증
- [ ] 비교 결과 DTO(F1-RH-001 응답 호환)를 본문에 렌더링하는지 검증
- [ ] p95 응답 시간 측정 — 100회 반복, cold/warm 분리 기록
- [ ] 랜딩 성공률 계산 — 2xx/전체 비율 ≥ 0.98
- [ ] "최저가 구매하기" 버튼 존재 및 딥링크 포맷(REQ-FUNC-020) 검증
- [ ] 404 경로(존재하지 않는 comparison_id) 처리 테스트

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 인증 장벽 없는 랜딩
- Given: 비로그인 + 카카오 내장 브라우저 UA 컨텍스트다.
- When: 공유 카드 링크를 GET한다.
- Then: 200 응답이 반환되고 로그인 페이지로 리다이렉트되지 않는다.

Scenario 2: 비교 결과 웹뷰 렌더링
- Given: 유효한 `comparison_id`의 공유 링크다.
- When: 페이지가 로드된다.
- Then: 비교 결과(제품명, 1일 단가, 실지불가) 핵심 요소가 응답 HTML에 포함된다.

Scenario 3: 로드 시간 p95 ≤ 2,000ms
- Given: 100회의 병렬/순차 요청 혼합 부하다.
- When: 응답 시간을 측정한다.
- Then: p95가 2,000ms 이하다.

Scenario 4: 랜딩 성공률 ≥ 98%
- Given: 100회 요청 중 일부는 DB 일시 지연을 포함한다.
- When: 성공률을 계산한다.
- Then: 2xx 응답 비율이 98% 이상이다.

Scenario 5: "최저가 구매하기" CTA
- Given: 정상 렌딩 페이지 HTML이다.
- When: DOM을 검증한다.
- Then: 딥링크 포맷(`https://` + 제휴 도메인)의 CTA가 존재한다.

Scenario 6: 존재하지 않는 공유 ID
- Given: 만료 또는 비존재 `comparison_id`다.
- When: 링크를 GET한다.
- Then: 사용자 친화적 404 페이지가 반환되며 장애 스택이 노출되지 않는다.

## :gear: Technical & Non-Functional Constraints
- 실제 외부 공급자 호출 없이 PRICE_SNAPSHOT 시드로 측정한다.
- 인증 미들웨어가 본 경로를 public path 리스트에 포함하는지 설정 검증이 병행되어야 한다.
- cold start 노이즈가 p95 왜곡을 일으키지 않도록 warm-up 요청을 선행한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] p95 ≤ 2,000ms 게이트가 CI에 설정되는가?
- [ ] 카카오 내장 브라우저 UA 시나리오가 포함되는가?
- [ ] 랜딩 성공률 98% 이상이 리그레션 테스트로 보호되는가?
- [ ] `pnpm test TEST-F3-003` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F3-Q-001, #F1-RH-001
- Blocks: None
