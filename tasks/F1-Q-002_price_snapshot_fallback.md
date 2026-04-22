---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-Q-002: 쿠팡 API 장애 시 캐시 PRICE_SNAPSHOT 조회 폴백 로직 구현"
labels: 'feature, backend, epic:E-F1, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-Q-002] PRICE_SNAPSHOT 캐시 폴백 Query 로직
- 목적: 쿠팡 파트너스 API가 Timeout, 5xx, Rate Limit 등의 운영 장애를 일으킬 때 최근 수집된 `PRICE_SNAPSHOT` 데이터를 조회하여 비교 기능을 지속 제공한다. SRS의 EXT-SYS-01 폴백 전략을 Query 레이어로 명시 구현한다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 폴백 전략: [`/05_SRS_v1.md#311-외부-시스템-비가용-시-내부-폴백-전략`](../05_SRS_v1.md) — EXT-SYS-01
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001, REQ-FUNC-006
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md) — `Calc->>DB: 캐시된 PRICE_SNAPSHOT 조회`
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.3 PRICE_SNAPSHOT`](../05_SRS_v1.md)
- 관련 선행 명세: [`/TASKS/DATA-004_price_snapshot_schema.md`](./DATA-004_price_snapshot_schema.md), [`/TASKS/F1-Q-001_coupang_price_query.md`](./F1-Q-001_coupang_price_query.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/lib/compare/queries/get-cached-price-snapshots.ts`에 폴백 Query 함수 정의
  - 입력: `ingredient`, `dosage?`, `failureCause`
  - 출력: `snapshots`, `cached_at`, `is_stale`
- [ ] 폴백 트리거 조건 명문화
  - 허용: Timeout, 5xx, 429, 외부 서비스 비가용
  - 비허용: 요청 유효성 오류, 내부 계산 오류, 권한 오류
- [ ] 최근 스냅샷 조회 쿼리 구현
  - 성분/제품 매핑 후 관련 `PRICE_SNAPSHOT` 최신 행 조회
  - 제품별 최신 `captured_at` 기준 1건 선택
- [ ] 신선도 기준 구현
  - 기본 임계값: 24시간(1,440분)
  - `cached_at`은 응답 메타에 반드시 포함
- [ ] 스테일 데이터 정책 정의
  - 24시간 초과 시 폴백 반환 금지 또는 경고 상태 반환 중 하나로 고정
  - MVP는 "반환 금지 + 외부 API 실패 에러 재전파"를 기본 정책으로 채택
- [ ] Query 결과 DTO 매핑
  - F1-RH-001에서 즉시 응답으로 조립 가능한 구조 반환
  - `is_cached=true` 분기 정보 제공
- [ ] 인덱스 활용 검증
  - `product_id + captured_at DESC` 경로를 사용하도록 Prisma/SQL 쿼리 검토
- [ ] 단위/통합 테스트 작성
  - 최신 스냅샷 선택
  - 24시간 경계값
  - 캐시 미존재
  - 장애 유형별 폴백 허용 여부

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 쿠팡 장애 시 최신 캐시 반환
- Given: 쿠팡 API 호출이 Timeout으로 실패했고, 관련 제품의 `PRICE_SNAPSHOT`이 24시간 이내 데이터로 존재한다.
- When: 폴백 Query를 호출한다.
- Then: 제품별 최신 스냅샷이 반환되고, 응답 메타에 `cached_at` 기준 시각이 포함된다.

Scenario 2: 24시간 초과 스냅샷 차단
- Given: 조회 가능한 스냅샷이 모두 현재 기준 25시간 이전 데이터다.
- When: 폴백 Query를 호출한다.
- Then: 캐시 데이터는 반환되지 않고, 상위 계층이 외부 API 장애 에러를 유지하도록 실패 결과를 반환한다.

Scenario 3: 캐시 미존재 처리
- Given: 쿠팡 API 실패 이후 매칭되는 `PRICE_SNAPSHOT` 데이터가 전혀 없다.
- When: 폴백 Query를 호출한다.
- Then: 빈 결과와 함께 `cache_miss` 사유가 반환되거나 명시적 도메인 에러가 발생한다.

Scenario 4: 잘못된 실패 원인 차단
- Given: 상위 계층이 Validation Error를 `failureCause`로 전달한다.
- When: 폴백 Query를 호출한다.
- Then: 폴백 쿼리는 실행되지 않고, 개발자 오류로 간주되는 예외를 반환한다.

Scenario 5: 기준 시각 UI 연계
- Given: 24시간 이내 캐시 스냅샷이 정상 반환되었다.
- When: Route Handler가 결과를 응답 메타로 조립한다.
- Then: 프론트엔드는 `"쿠팡 가격은 [YYYY-MM-DD HH:MM] 기준입니다"` 인라인 문구를 렌더링할 수 있는 `cached_at` 값을 받는다.

## :gear: Technical & Non-Functional Constraints
- 폴백은 외부 운영 장애에 대해서만 허용한다. 잘못된 요청이나 내부 버그를 캐시로 숨기지 않는다.
- Query는 읽기 전용이다. 폴백 수행 중 `PRICE_SNAPSHOT` 쓰기, 수정, 재정규화 금지.
- 신선도 임계값은 기본 24시간으로 고정하고, 하드코딩이 아니라 설정 상수로 분리한다.
- 폴백 조회는 F1 전체 SLA를 해치지 않도록 p95 200ms 내외를 목표로 한다.
- `cached_at`은 ISO 8601 그대로 유지하고, 한국 시간대 포맷팅은 UI 계층에서 수행한다.
- 개인정보와 무관한 데이터만 조회한다. `USER` 관련 조인 금지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 폴백이 허용되는 장애 유형과 허용되지 않는 장애 유형이 코드로 명시되는가?
- [ ] 제품별 최신 스냅샷 1건만 선택하는 조회가 구현되는가?
- [ ] 24시간 경계값 테스트가 작성되고 통과하는가?
- [ ] `cached_at`, `is_cached`, `cache_miss` 등 상위 계층 연계 메타데이터가 제공되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F1-Q-001, #DATA-004
- Blocks: #F1-RH-001, #TEST-F1-004
