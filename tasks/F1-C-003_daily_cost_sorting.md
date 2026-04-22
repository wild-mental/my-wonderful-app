---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-C-003: 1일 단가 기준 오름차순 정렬 로직 구현"
labels: 'feature, backend, epic:E-F1, priority:medium, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-C-003] 1일 단가 오름차순 정렬 Command 로직
- 목적: 계산 완료된 비교 결과를 `daily_cost_krw` 기준으로 안정적으로 정렬해 최저가 제품이 상단에 노출되도록 한다. Super-Calc 결과 화면과 API 응답의 정렬 계약을 단일 함수로 고정한다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-005
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md) — `단가 기준 오름차순 정렬`
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- 관련 선행 명세: [`/TASKS/API-001_super_calc_dto.md`](./API-001_super_calc_dto.md), [`/TASKS/F1-C-001_daily_cost_normalization.md`](./F1-C-001_daily_cost_normalization.md), [`/TASKS/F1-C-002_final_price_calculation.md`](./F1-C-002_final_price_calculation.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/lib/compare/commands/sort-by-daily-cost.ts`에 정렬 함수 정의
  - 입력: 비교 결과 배열
  - 출력: 정렬된 새 배열
- [ ] 기본 정렬 기준 구현
  - 1순위: `daily_cost_krw ASC`
- [ ] Tie-breaker 규칙 구현
  - 2순위: `final_price_krw ASC`
  - 3순위: `price_krw ASC`
  - 4순위: `product_name ASC`
- [ ] 입력 불변성 보장
  - 원본 배열 mutate 금지
  - 복사본 정렬 또는 순수 comparator 사용
- [ ] 정렬 대상 필드 유효성 검증
  - `daily_cost_krw` 누락 또는 NaN 항목 차단
- [ ] 단위 테스트 작성
  - 기본 오름차순
  - 동일 단가 tie-breaker
  - 원본 배열 보존

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 기본 오름차순 정렬
- Given: `daily_cost_krw` 값이 각각 700.0, 500.0, 600.0인 3개 결과가 있다.
- When: 정렬 함수를 호출한다.
- Then: 결과 순서는 500.0, 600.0, 700.0이다.

Scenario 2: 동점자 tie-breaker 적용
- Given: `daily_cost_krw`가 동일한 두 상품과 서로 다른 `final_price_krw` 값이 있다.
- When: 정렬 함수를 호출한다.
- Then: `final_price_krw`가 더 낮은 상품이 앞선다.

Scenario 3: 원본 배열 불변성
- Given: 정렬 전 원본 배열 객체가 있다.
- When: 정렬 함수를 호출한다.
- Then: 반환값은 새 배열이고, 원본 배열의 순서는 변경되지 않는다.

Scenario 4: 잘못된 정렬 대상 차단
- Given: 일부 항목에 `daily_cost_krw`가 없거나 NaN이다.
- When: 정렬 함수를 호출한다.
- Then: 명시적 에러가 발생하거나 사전 검증 단계에서 차단된다.

Scenario 5: 결정론적 결과
- Given: 동일한 입력 배열이 10회 반복 전달된다.
- When: 정렬 함수를 10회 실행한다.
- Then: 10회 모두 동일한 순서의 결과를 반환한다.

## :gear: Technical & Non-Functional Constraints
- 정렬 기준의 SSOT는 `daily_cost_krw`이다. 다른 필드 기준 정렬 옵션을 추가하지 않는다.
- Comparator는 안정적이고 결정론적이어야 하며, 동일 입력에 동일 순서를 반환해야 한다.
- 정렬 비용은 일반적인 MVP 데이터셋(상위 20~50건) 기준으로 무시 가능한 수준이어야 하나, 불필요한 재계산은 피한다.
- 본 태스크는 API 응답 조립이나 DB Write를 수행하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] tie-breaker 규칙이 코드와 테스트에 명시되는가?
- [ ] 정렬 함수가 원본 배열을 mutate하지 않는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F1-C-001
- Blocks: #F1-RH-001, #TEST-F1-003
