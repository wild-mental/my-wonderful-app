---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] TEST-F3-002: [Integration Test] 카카오 API 장애 시 폴백 UI 전환 1초 이내 + 토스트 표시 검증"
labels: 'feature, test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-F3-002] 카카오 Link API 장애 폴백 통합 테스트
- 목적: F3-C-003의 폴백 처리 경로(CP-2)가 REQ-FUNC-021의 AC(1초 이내 폴백 UI 전환 + 토스트 알림, 폴백 성공률 ≥ 95%)를 충족하는지 검증한다. 카카오 Link SDK가 타임아웃·오류를 반환하는 상황을 결정적으로 재현하여 URL 복사 경로와 토스트 피드백 전개 시간을 계측한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.3 F3. Viral Engine`](../05_SRS_v1.md) — REQ-FUNC-021
- SRS 비상 대응: [`/05_SRS_v1.md#1.2.5 CP-2`](../05_SRS_v1.md) — 카카오 Link 정책 변경 우회
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1 EXT-SYS-03`](../05_SRS_v1.md) — URL 복사 폴백
- SRS Traceability: [`/05_SRS_v1.md#5`](../05_SRS_v1.md) — TC-FUNC-021
- 관련 구현 태스크: [`/TASKS/F3-C-002_kakao_link_api.md`](./F3-C-002_kakao_link_api.md), [`/TASKS/F3-C-003_kakao_fallback.md`](./F3-C-003_kakao_fallback.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#53-f3-viral-engine-테스트`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 테스트 파일 생성 — `tests/f3/kakao-fallback.integration.test.ts`
- [ ] 카카오 SDK Mock: `Kakao.Link.sendDefault`가 타임아웃·reject·undefined 반환 3종 재현
- [ ] 공유 트리거 → 폴백 감지 → URL 복사 → 토스트 표시까지 전체 경로 검증
- [ ] 전환 소요 시간 계측 — `performance.now()` 기반 1초 경계 테스트
- [ ] Clipboard API mocking(`navigator.clipboard.writeText`) 및 거부(deny) 시나리오 검증
- [ ] 토스트 컴포넌트 표시 여부 & 문구(`"링크가 복사되었습니다"`) 검증
- [ ] 5xx·네트워크 오프라인 환경 각각 1건 이상 시뮬레이션
- [ ] 폴백 경로 공유 성공률 ≥ 95% 도달 확인을 위한 100회 반복 스모크 테스트

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: SDK 타임아웃 → 폴백 전환 1초 이내
- Given: `Kakao.Link.sendDefault`가 5초 지연 후 타임아웃 되도록 mocking 되어 있다.
- When: 사용자가 공유 버튼을 탭한다.
- Then: 1초 이내 URL 복사 UI가 표시되고 토스트가 노출된다.

Scenario 2: SDK reject — 즉시 폴백
- Given: SDK가 즉시 Promise reject를 반환한다.
- When: 공유 버튼이 탭된다.
- Then: 폴백 UI 전환이 500ms 이내 완료된다.

Scenario 3: 토스트 문구 정확성
- Given: URL 복사가 성공한 직후다.
- When: 토스트가 표시된다.
- Then: 문구가 "링크가 복사되었습니다"와 일치한다.

Scenario 4: Clipboard 권한 거부 대응
- Given: `navigator.clipboard.writeText`가 DOMException("NotAllowedError")을 던진다.
- When: 폴백이 동작한다.
- Then: 사용자에게 `<input>` 기반 수동 복사 UI가 노출되고 실패가 Sentry에 breadcrumb로 기록된다.

Scenario 5: 유효 경로와 혼동 방지
- Given: SDK가 정상 동작한다.
- When: 공유 버튼이 탭된다.
- Then: 폴백 UI가 표시되지 않는다(정상 경로는 카카오 공유 UI로 종료).

Scenario 6: 성공률 ≥ 95% 리그레션
- Given: 100회 랜덤 장애/복구 시나리오를 시뮬레이션한다.
- When: 폴백 경로가 실행된다.
- Then: URL 복사 성공률이 95% 이상이다.

## :gear: Technical & Non-Functional Constraints
- 실제 카카오 네트워크 호출 없이 SDK를 mocking하여 결정적으로 재현한다.
- 시간 계측은 jsdom/Node timers(Fake Timers)로 조작하되, 실제 non-deterministic wall clock은 허용하지 않는다.
- Clipboard API 미지원 환경(Safari private mode 등)도 커버하는 fallback 경로를 테스트해야 한다.
- 테스트는 E2E가 아닌 통합 단위이며, UI 렌더러는 React Testing Library로 대체한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 1초 전환 시간 게이트가 CI에서 검증되는가?
- [ ] 토스트 문구·Clipboard 거부 분기가 테스트로 보호되는가?
- [ ] 100회 리그레션 시뮬레이션이 포함되었는가?
- [ ] `pnpm test TEST-F3-002` 또는 동등 명령으로 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #F3-C-003, #F3-C-002
- Blocks: None
