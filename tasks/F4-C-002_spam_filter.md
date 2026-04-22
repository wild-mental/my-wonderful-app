---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-C-002: 스팸/중복 제보 필터링 로직 구현 (동일 제품 24h 내 5건+, 빈 문자열 차단)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-C-002] 스팸/중복 제보 필터링 로직
- 목적: 오류 제보 시스템의 악용을 방지하기 위해, 동일 제품에 대한 24시간 내 5건 이상 반복 제보 및 빈 문자열 제보를 자동 차단한다. 스팸 차단 정확도 ≥ 95%, 유효 제보 오차단률(false positive) ≤ 2%를 보장한다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-027 (스팸/중복 차단)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 스팸/중복 감지 분기
- API DTO: [`/TASKS/API-004_error_report_dto.md`](./API-004_error_report_dto.md) — `SpamBlockResponse`
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F4-C-001** (오류 제보 접수 Server Action)
- 후행 태스크: TEST-F4-004 (스팸 차단 테스트)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **스팸 필터 함수 작성** — `src/lib/trust/spam-filter.ts`
  - 입력: `userId: string`, `productId: string`, `reportInput: ErrorReportInput`
  - 출력: `SpamCheckResult { isBlocked: boolean; reason?: 'DUPLICATE_LIMIT' | 'EMPTY_CONTENT'; message?: string }`
- [ ] **중복 제보 감지 (24h/5건 룰)** — DB 조회
  - `SELECT COUNT(*) FROM ERROR_REPORT WHERE reporter_id = ? AND product_id = ? AND reported_at > NOW() - INTERVAL '24 hours'`
  - 5건 이상이면 `DUPLICATE_LIMIT` 차단
- [ ] **빈 문자열 검증** — 입력값 정제
  - `correct_value.trim().length === 0` → `EMPTY_CONTENT` 차단
  - `field_name.trim().length === 0` → `EMPTY_CONTENT` 차단
  - `reported_value.trim().length === 0` → `EMPTY_CONTENT` 차단
- [ ] **F4-C-001 연동** — 제보 접수 Server Action에 스팸 필터 호출 삽입
  - `submitReport()` 내에서 Zod 검증 후, DB 저장 전에 `checkSpam()` 호출
  - 차단 시 `SpamBlockResponse` 반환 (HTTP 429)
- [ ] **유효 제보 보호 로직** — false positive 최소화
  - 차단된 제보도 카운트에서 제외하지 않음 (악의적 반복 시도 방지)
  - 서로 다른 `field_name`에 대한 제보는 중복 카운트하지 않음 (동일 제품이라도 다른 필드면 허용)
- [ ] **단위 테스트** — 정상 제보 통과, 5건 초과 차단, 빈 문자열 차단, 다른 필드명 허용

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 동일 제품 24h 내 5건 이상 차단 (REQ-FUNC-027)**
- **Given**: 사용자가 동일 제품에 24시간 내 5건의 제보를 이미 제출한 상태
- **When**: 6번째 제보를 시도한다
- **Then**: `"중복 또는 불완전한 제보입니다"` 메시지와 함께 제출이 차단된다.

**Scenario 2: 빈 문자열 차단 (REQ-FUNC-027)**
- **Given**: `correct_value`가 공백만 포함된 상태
- **When**: 제보를 제출한다
- **Then**: `"중복 또는 불완전한 제보입니다"` 메시지와 함께 제출이 차단된다.

**Scenario 3: 유효 제보 미영향 (REQ-FUNC-027)**
- **Given**: 동일 제품에 4건의 유효한 제보가 있는 상태
- **When**: 새로운 유효한 5번째 제보를 제출한다
- **Then**: 정상적으로 접수되며, 기존 4건의 제보도 영향받지 않는다.

**Scenario 4: 서로 다른 필드명 허용**
- **Given**: 동일 제품에 `amount_per_serving` 필드로 5건 제보 후
- **When**: **다른 필드명** `brand_name`으로 제보를 시도한다
- **Then**: 서로 다른 필드이므로 차단되지 않고 정상 접수된다.

**Scenario 5: 스팸 차단 정확도 ≥ 95% (REQ-FUNC-027)**
- **Given**: 100건의 테스트 제보(스팸 50건 + 유효 50건) 세트
- **When**: 스팸 필터를 적용한다
- **Then**: 스팸 50건 중 47건 이상 차단(≥ 95%), 유효 50건 중 오차단 1건 이하(≤ 2%).

## :gear: Technical & Non-Functional Constraints
- **차단 정확도**: 스팸 차단 정확도 ≥ 95%, false positive ≤ 2%.
- **성능**: 스팸 체크 쿼리는 100ms 이내 완료 목표. `reporter_id + product_id + reported_at` 복합 인덱스 활용.
- **닫힌 문맥 (P4)**: 본 태스크는 차단 판정만 수행. 실제 DB 저장 차단은 F4-C-001의 분기 로직에서 처리.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 24h/5건 중복 제보 차단이 동작하는가?
- [ ] 빈 문자열/공백 차단이 동작하는가?
- [ ] 유효 제보 오차단률 ≤ 2%가 테스트로 검증되었는가?
- [ ] F4-C-001 Server Action과 연동되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #F4-C-001 (오류 제보 접수 Server Action)
- **Blocks**:
  - #TEST-F4-004 (스팸 차단 + 빈 문자열 400 에러 테스트)
