---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] MOCK-004: 오류 제보 Mock Server Action 구성 (성공/스팸 차단/빈 문자열 차단 시나리오)"
labels: 'feature, mock, epic:E-MOCK, priority:high, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [MOCK-004] 오류 제보 Mock Server Action (`POST` FormData)
- 목적: 백엔드 오류 제보 Server Action(F4-C-001) 및 스팸 필터링(F4-C-002) 구현 이전에, 프론트엔드 오류 신고 모달(UI-030)과 접수 확인 알림(UI-031)이 API-004 DTO 계약 기반으로 독립 개발될 수 있도록 결정론적 Mock Server Action을 제공한다. 정상 접수, 스팸/중복 차단, 빈 문자열 차단의 3대 시나리오를 트리거 가능해야 한다.
- Epic / Phase: E-MOCK / Phase 1 (계약·데이터 명세)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4 F4. Data Trust System`](../05_SRS_v1.md) — REQ-FUNC-024 (접수 확인 3초 이내), REQ-FUNC-027 (스팸 필터링), REQ-FUNC-028 (구조화 폼)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3 상세 시퀀스: 오류 제보 처리`](../05_SRS_v1.md)
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-04
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — UC-10 (오류 신고)
- 선행 태스크: **API-004** (오류 제보 Server Action FormData 스키마 및 응답 DTO)
- 후행 태스크: UI-030 (오류 신고 폼 모달), UI-031 (접수 확인 알림), TEST-F4-003, TEST-F4-004, TEST-F4-006
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.3 Mock 데이터·Stub 서비스 태스크`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Mock Server Action 파일 생성** — `src/app/_mocks/actions/error-report.ts`
  - `'use server'` 디렉티브 + `MOCK_MODE` 환경 분기
  - API-004의 `ErrorReportFormSchema`로 FormData 검증
- [ ] **In-memory 제보 카운터** — 스팸 필터링 시뮬레이션용
  - `Map<string, { count: number; first_at: Date }>` 구조 (key: `product_id + reporter_hash`)
  - 24시간 윈도우 내 동일 product_id에 대한 제보 5건 초과 차단 (REQ-FUNC-027)
- [ ] **Success 시나리오 핸들러** — 정상 접수
  - HTTP 201 + `report_id: "rpt_mock_xxx"` (UUID 또는 nanoid)
  - `status: "SUBMITTED"`, `expected_resolution_at: "...+48h"` (REQ-FUNC-024)
  - 응답 시간 시뮬레이션 < 1,000ms (총 3초 이내 UI 알림 표시 보장)
- [ ] **빈 문자열 차단 핸들러** — 필수 필드 미입력 (REQ-FUNC-028)
  - `field_name`, `original_value`, `correct_value` 중 하나라도 빈 문자열/null
  - HTTP 400 + `error_code: "ERROR_REPORT_REQUIRED_FIELD_MISSING"`
- [ ] **스팸/중복 차단 핸들러** — REQ-FUNC-027 (24h 5건+ 동일 product_id)
  - HTTP 429 + `error_code: "ERROR_REPORT_RATE_LIMIT_EXCEEDED"`
  - `retry_after_seconds: 86400` (또는 윈도우 잔여 시간)
- [ ] **구조화된 폼 검증** — REQ-FUNC-028 핵심
  - 필수: `product_id`, `field_name`, `original_value`, `correct_value`
  - 선택: `evidence_url`, `evidence_text`, `reporter_email`
  - 최소 길이: `correct_value` ≥ 2자
- [ ] **트리거 옵션 문서화** — `?__scenario=spam` 등 시나리오 강제 트리거 (FormData hidden field 또는 환경변수)
- [ ] **Mock 사용 가이드 문서화** — `src/mocks/README.md`에 ErrorReport Mock 사용법 추가

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상 접수 — 3초 이내 응답 (REQ-FUNC-024)**
- **Given**: Mock 모드 활성화 + 유효한 FormData (product_id, field_name, original_value, correct_value)
- **When**: 오류 제보 Server Action을 호출함
- **Then**: HTTP 201, `report_id`와 `status: "SUBMITTED"`, `expected_resolution_at` (현재 + 48h)이 반환되며, 응답 시간 < 1,000ms.

**Scenario 2: 빈 문자열 차단 (REQ-FUNC-028)**
- **Given**: `correct_value`가 빈 문자열인 FormData
- **When**: Server Action을 호출함
- **Then**: HTTP 400, `error_code: "ERROR_REPORT_REQUIRED_FIELD_MISSING"`이 반환되며, `report_id`는 발급되지 않는다.

**Scenario 3: 스팸 차단 (REQ-FUNC-027)**
- **Given**: 동일 product_id에 대해 24h 윈도우 내 5건 제보 완료
- **When**: 6번째 제보를 호출함
- **Then**: HTTP 429, `error_code: "ERROR_REPORT_RATE_LIMIT_EXCEEDED"`, `retry_after_seconds`가 반환된다.

**Scenario 4: 정확도 ≥ 95%, false positive ≤ 2% 시뮬레이션**
- **Given**: 유효 제보 100건과 스팸 제보 100건이 시드로 주어짐
- **When**: 모든 제보를 Mock에 흘려보냄
- **Then**: 차단 정확도 ≥ 95%, 유효 제보의 false positive ≤ 2%이다.

**Scenario 5: DTO 계약 준수**
- **Given**: API-004의 `ErrorReportResponseSchema` Zod 스키마가 정의됨
- **When**: Mock 응답을 `ErrorReportResponseSchema.parse()`로 검증함
- **Then**: 모든 시나리오의 응답이 Zod 검증을 통과한다.

## :gear: Technical & Non-Functional Constraints
- **DTO 계약 정합성 (P1)**: API-004의 FormData 스키마와 응답 DTO를 100% 준수.
- **응답 시간 (REQ-FUNC-024 AC)**: 정상 케이스 < 1,000ms. UI-031에서 토스트 알림이 3초 이내 표시되도록 여유 시간 확보.
- **스팸 필터 정확도 (REQ-FUNC-027)**: 정확도 ≥ 95%, false positive ≤ 2%. Mock은 단순 카운터지만 시드 데이터로 임계 검증 가능.
- **결정론성**: 동일 시드 카운터 상태에서 동일 입력은 동일 응답.
- **운영 환경 분리 (CON-9)**: `MOCK_MODE=true`에서만 활성화. 프로덕션 빌드 트리 셰이킹 제거.
- **개인정보 마스킹 (CON-4)**: `reporter_email`이 응답에 포함될 경우 마스킹(`a***@example.com`).
- **외부 호출 금지**: DB, 이메일 발송, 외부 API 일절 호출 금지 (격리성).

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `src/app/_mocks/actions/error-report.ts`가 작성되고 `'use server'` 디렉티브가 포함되었는가?
- [ ] In-memory 카운터로 24h 윈도우 5건+ 차단이 동작하는가?
- [ ] Mock Server Action이 API-004 FormData 스키마와 응답 DTO에 100% 정합하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] `src/mocks/README.md`에 ErrorReport Mock 사용법이 추가되었는가?
- [ ] Unit 테스트(success/empty/spam 시나리오)가 작성되고 통과하는가?
- [ ] 프로덕션 빌드에서 Mock 코드가 제거됨을 확인했는가?

## :construction: Dependencies & Blockers
- **Depends on**: #API-004 (오류 제보 Server Action FormData/응답 DTO), #API-008 (공통 에러 스키마)
- **Blocks**:
  - #UI-030 (오류 신고 구조화 폼 모달)
  - #UI-031 (접수 확인 알림 UI, 48h 표시)
  - #TEST-F4-003 (접수 확인 알림 3초 이내 검증)
  - #TEST-F4-004 (스팸/중복 제보 차단 검증)
  - #TEST-F4-006 (구조화 폼 필드 유효성 검증)

## :bookmark_tabs: Notes
- Server Action은 Next.js App Router의 핵심 패턴이므로, Mock도 동일한 `'use server'` 시그니처를 유지해야 UI 컴포넌트가 실제 구현 전환 시 코드 변경 없이 동작한다.
- 카운터 reset은 in-memory Map의 `first_at` 기준 24시간 경과 시 자동 만료. 테스트 시 강제 reset을 위한 `__resetCounter()` 디버그 함수 export 검토 (단, 프로덕션 빌드에서 제거).
- F4-C-001 실 구현 완료 시 Mock은 그대로 보존하되, FormData 스키마와 응답 포맷의 회귀 테스트 픽스처로 활용한다.
