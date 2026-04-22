---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F1-RH-001: `GET /api/v1/compare` 엔드포인트 통합 조립 (조회→정규화→정렬→저장→응답)"
labels: 'feature, backend, epic:E-F1, priority:critical, phase:2, complexity:H'
assignees: ''
---

## :dart: Summary
- 기능명: [F1-RH-001] Super-Calc Route Handler 통합 조립
- 목적: F1 Query/Command 태스크들을 조합해 `GET /api/v1/compare` 엔드포인트를 완성한다. 외부 조회, 캐시 폴백, 1일 단가 계산, 최종가 계산, 정렬, 저장, 공통 에러 응답을 하나의 서버 진입점으로 묶어 실제 사용자 요청을 처리한다.
- Epic / Phase: E-F1 / Phase 2 (로직·상태 변경)
- 복잡도: H

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1 API Endpoint List`](../05_SRS_v1.md) — INT-API-01 (`GET /api/v1/compare`)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1 F1. Super-Calc Engine`](../05_SRS_v1.md) — REQ-FUNC-001, 002, 004, 005, 006, 008, 009
- SRS 핵심 흐름: [`/05_SRS_v1.md#3.4.1 핵심 흐름: 1일 단가 비교`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.1 상세 시퀀스: 1일 단가 비교 전체 흐름`](../05_SRS_v1.md)
- 관련 선행 명세: [`/TASKS/API-001_super_calc_dto.md`](./API-001_super_calc_dto.md), [`/TASKS/API-008_common_error_schema.md`](./API-008_common_error_schema.md), [`/TASKS/F1-Q-001_coupang_price_query.md`](./F1-Q-001_coupang_price_query.md), [`/TASKS/F1-Q-002_price_snapshot_fallback.md`](./F1-Q-002_price_snapshot_fallback.md), [`/TASKS/F1-C-001_daily_cost_normalization.md`](./F1-C-001_daily_cost_normalization.md), [`/TASKS/F1-C-002_final_price_calculation.md`](./F1-C-002_final_price_calculation.md), [`/TASKS/F1-C-003_daily_cost_sorting.md`](./F1-C-003_daily_cost_sorting.md), [`/TASKS/F1-C-004_price_snapshot_persistence.md`](./F1-C-004_price_snapshot_persistence.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#41-e-f1-super-calc-engine`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] `src/app/api/v1/compare/route.ts`에 GET Route Handler 구현
- [ ] API-001 Request Schema로 쿼리 파라미터 검증
  - `ingredient` 필수
  - `dosage`, `limit`, `sort_by` 선택
- [ ] 정상 라이브 플로우 조립
  - F1-Q-001로 쿠팡 조회
  - 항목별 F1-C-001 1일 단가 계산
  - 항목별 F1-C-002 최종가 계산
  - F1-C-003 정렬
  - F1-C-004 저장
- [ ] 폴백 플로우 조립
  - F1-Q-001 실패 원인 분류
  - 폴백 가능 오류면 F1-Q-002 실행
  - `is_cached=true`, `cached_at` 메타 포함 응답
- [ ] 빈 결과/미등록 분기 구현
  - 정상 조회이지만 결과 0건이면 `COMPARE_INGREDIENT_NOT_FOUND` 기반 404 응답
- [ ] 공통 에러 응답 연동
  - Validation Error → 400
  - 외부 API 실패 + 폴백 불가 → 502
  - 내부 처리 오류 → 500
- [ ] 로깅/모니터링 필드 추가
  - `request_id`, `duration_ms`, `is_cached`, `result_count`, `failure_cause`
- [ ] 저장 실패 완화 정책 구현
  - 비교 결과 계산/정렬 성공 후 저장만 실패한 경우, 사용자 응답은 200으로 유지하고 서버 로그에 구조화 기록
- [ ] 통합 테스트 작성
  - 실시간 조회 성공
  - 캐시 폴백 성공
  - Validation Error
  - 미등록 성분
  - 저장 실패 완화

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 실시간 비교 성공
- Given: 유효한 `ingredient`와 `dosage`가 주어지고 쿠팡 API가 정상 응답한다.
- When: `GET /api/v1/compare`를 호출한다.
- Then: HTTP 200과 함께 `daily_cost_krw` 오름차순 결과 배열이 반환되고 `is_cached=false`이다.

Scenario 2: 쿠팡 장애 시 캐시 폴백 성공
- Given: 쿠팡 API가 Timeout 또는 5xx로 실패하고, 24시간 이내 `PRICE_SNAPSHOT` 캐시가 존재한다.
- When: `GET /api/v1/compare`를 호출한다.
- Then: HTTP 200과 함께 캐시 데이터가 반환되고, `is_cached=true`, `cached_at` 값이 포함된다.

Scenario 3: 잘못된 요청 파라미터
- Given: `ingredient`가 비어 있거나 limit 범위를 초과한 요청이 주어진다.
- When: Route Handler가 요청을 검증한다.
- Then: HTTP 400과 표준 에러 스키마 응답이 반환된다.

Scenario 4: 미등록/빈 결과 처리
- Given: 쿠팡 API 정상 응답 또는 내부 조회 결과가 0건이다.
- When: `GET /api/v1/compare`를 호출한다.
- Then: HTTP 404와 `COMPARE_INGREDIENT_NOT_FOUND` 에러 코드가 반환된다.

Scenario 5: 저장 실패 완화
- Given: 실시간 조회와 계산/정렬은 성공했지만 `PRICE_SNAPSHOT` 저장이 실패했다.
- When: Route Handler가 응답을 조립한다.
- Then: 사용자에게는 HTTP 200 비교 결과가 반환되고, 저장 실패는 서버 로그와 모니터링 이벤트로만 기록된다.

Scenario 6: 성능 목표 준수
- Given: 동시 접속 50명 조건과 평균 20건 이하 결과셋이 주어진다.
- When: `GET /api/v1/compare`를 반복 호출한다.
- Then: 엔드포인트 p95 응답 시간이 3,500ms 이내이고 실패율이 1.0% 미만이다.

## :gear: Technical & Non-Functional Constraints
- Route Handler는 조립 계층이다. 외부 조회, 계산, 정렬, 저장 로직을 파일 내부에 중복 구현하지 않고 각 F1 세부 모듈을 호출한다.
- 공통 응답 포맷은 API-001과 API-008을 따른다. ad-hoc JSON 구조 생성 금지.
- Mock 모드는 개발/테스트 환경에서만 허용되며, 운영 환경에서는 실 API 및 실 DB 경로만 사용한다.
- 저장 실패 완화 정책은 사용자 비교 기능의 가용성을 우선한다. 다만 계산/정렬 결과 자체가 불완전하면 200으로 강행하지 않는다.
- 로깅에는 `request_id`를 포함해 추적 가능해야 하며, API 키/시크릿/원본 에러 스택을 응답 body에 노출하지 않는다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] `GET /api/v1/compare`가 API-001 Request/Response 계약을 준수하는가?
- [ ] Validation Error, 외부 API 장애, 폴백 성공, 빈 결과, 저장 실패 완화 시나리오 테스트가 작성되고 통과하는가?
- [ ] 공통 에러 응답(API-008)과 정합하는가?
- [ ] `request_id`, `duration_ms`, `is_cached` 로그 메타데이터가 포함되는가?
- [ ] p95 3,500ms 목표 검증 경로가 테스트 또는 측정 스크립트로 연결되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #F1-Q-001, #F1-Q-002, #F1-C-001, #F1-C-002, #F1-C-003, #F1-C-004, #API-001, #API-008
- Blocks: #UI-011, #UI-012, #TEST-F1-004, #TEST-F1-006, #F3-Q-001
