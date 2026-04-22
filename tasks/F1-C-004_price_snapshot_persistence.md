---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-C-004: PRICE_SNAPSHOT 저장 (가격 수집 결과 DB 적재 Write)"
labels: 'feature, backend, epic:E-F1, priority:high, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-C-004] PRICE_SNAPSHOT 배치 저장 Command 로직
- 목적: 쿠팡에서 성공적으로 조회하고 계산한 가격 비교 결과를 `PRICE_SNAPSHOT` 테이블에 append-only 방식으로 저장한다. 이후 캐시 폴백과 일 1회 가격 동기화 배치가 참조할 최신 가격 이력의 기반을 만든다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md) — `Calc->>DB: PRICE_SNAPSHOT[] 저장`
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.3 PRICE_SNAPSHOT`](../05_SRS_v1.md)
- SRS 폴백 전략: [`/05_SRS_v1.md#311-외부-시스템-비가용-시-내부-폴백-전략`](../05_SRS_v1.md) — 캐시 신선도 유지
- 관련 선행 명세: [`/TASKS/DATA-004_price_snapshot_schema.md`](./DATA-004_price_snapshot_schema.md), [`/TASKS/F1-C-001_daily_cost_normalization.md`](./F1-C-001_daily_cost_normalization.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/lib/compare/commands/save-price-snapshots.ts`에 저장 Command 함수 정의
  - 입력: 계산 완료된 비교 결과 배열, `captured_at`
  - 출력: 저장 건수, 저장 실패 건수, 저장 여부
- [ ] 저장 대상 매핑 구현
  - `product_id`
  - `price_krw`
  - `shipping_fee`
  - `final_price_krw`
  - `servings_per_container`
  - `daily_cost_krw`
  - `source=COUPANG_API`
  - `captured_at`
- [ ] Append-only 정책 준수
  - 기존 레코드 update 금지
  - 새로운 수집 결과는 신규 row insert
- [ ] 배치 저장 규칙 구현
  - 요청 단위로 `createMany` 또는 transaction 사용
  - 동일 배치 내 중복 `product_id`는 사전 제거
- [ ] 캐시 폴백 결과 저장 금지 규칙 구현
  - `is_cached=true` 경로에서는 본 Command를 호출하지 않음
- [ ] 저장 실패 처리 원칙 문서화
  - 저장 실패는 구조화 로그로 남기고 상위 Route Handler가 서비스 지속 여부를 결정할 수 있도록 결과 객체 반환
- [ ] 테스트 작성
  - 정상 insert
  - 중복 제거
  - cached 결과 저장 차단
  - append-only 보장

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 라이브 조회 결과 저장
- Given: 쿠팡 실시간 조회 결과 5건이 계산 완료된 상태다.
- When: 저장 Command를 호출한다.
- Then: `PRICE_SNAPSHOT`에 5건이 신규 insert된다.

Scenario 2: 동일 배치 중복 제거
- Given: 동일 `product_id`를 가진 결과가 같은 배치에 2건 포함되어 있다.
- When: 저장 Command를 호출한다.
- Then: 중복은 제거되고 1건만 저장된다.

Scenario 3: 캐시 결과 저장 차단
- Given: 비교 결과가 `is_cached=true` 폴백 경로에서 생성되었다.
- When: 저장 Command 호출 여부를 평가한다.
- Then: `PRICE_SNAPSHOT` 신규 insert가 발생하지 않는다.

Scenario 4: Append-only 보장
- Given: 기존 `PRICE_SNAPSHOT` 레코드가 이미 존재한다.
- When: 같은 제품의 최신 가격이 다시 수집된다.
- Then: 기존 row를 수정하지 않고 신규 row가 추가된다.

Scenario 5: 저장 실패 메타데이터 반환
- Given: DB transaction이 실패했다.
- When: 저장 Command를 호출한다.
- Then: 상위 계층이 판단 가능한 실패 메타데이터와 로그용 사유가 반환된다.

## :gear: Technical & Non-Functional Constraints
- `PRICE_SNAPSHOT`은 append-only다. `update`나 `upsert`로 기존 가격 이력을 덮어쓰지 않는다.
- 저장 로직은 계산 완료된 값만 적재한다. 저장 단계에서 단가/최종가를 재계산하지 않는다.
- `captured_at`은 DB insert 시각이 아니라 실제 가격 수집 기준 시각을 우선 사용한다.
- 캐시 폴백 경로에서 저장을 수행하면 stale 데이터가 최신값처럼 오염될 수 있으므로 금지한다.
- 저장 실패 세부 정보에는 민감 정보나 SQL 전문을 노출하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 저장 Command가 append-only 원칙을 지키는가?
- [ ] 캐시 데이터 저장 차단 규칙이 구현되는가?
- [ ] 동일 배치 중복 제거 테스트가 포함되는가?
- [ ] 저장 실패 시 상위 계층이 판단 가능한 결과 객체가 반환되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F1-C-001, #DATA-004
- Blocks: #F1-RH-001, #CRON-001
