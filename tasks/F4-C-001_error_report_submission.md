---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-C-001: 오류 제보 접수 Server Action 구현 (구조화된 폼 → ERROR_REPORT 저장, status=SUBMITTED)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-C-001] 오류 제보 접수 Server Action
- 목적: 사용자가 데이터 불일치를 발견했을 때, 구조화된 폼(필드명, 기존 값, 올바른 값, 근거 자료)을 통해 오류 제보를 접수하고 ERROR_REPORT 테이블에 `status=SUBMITTED`로 저장하는 Server Action을 구현한다. 접수 완료 시 예상 처리 시간(48시간)을 알린다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-024 (접수 확인 알림, 48h), REQ-FUNC-028 (구조화된 폼)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.3`](../05_SRS_v1.md) — 오류 제보 전체 생명주기
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.6 ERROR_REPORT`](../05_SRS_v1.md)
- API DTO: [`/TASKS/API-004_error_report_dto.md`](./API-004_error_report_dto.md) — `ErrorReportInput`, `ErrorReportResponse`
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)
- 선행 태스크: **API-004** (오류 제보 DTO), **DATA-007** (ERROR_REPORT 스키마)
- 후행 태스크: F4-C-002 (스팸 필터링), F4-C-003 (상태 변경), ADM-Q-002 (관리자 조회), UI-030 (폼 모달)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Server Action 작성** — `src/actions/report/submit-report.ts`
  - `'use server'` 디렉티브 적용
  - 입력: `FormData` → Zod 검증(`ErrorReportInputSchema`) → 유효한 `ErrorReportInput` 객체
- [ ] **인증 확인** — 미인증 사용자 차단
  - 세션에서 `user_id` 추출 (Supabase Auth / NextAuth)
  - 미인증 시 `REPORT_UNAUTHENTICATED` 에러 반환
- [ ] **제품 존재 확인** — `product_id`가 PRODUCT 테이블에 존재하는지 검증
  - 미존재 시 `REPORT_PRODUCT_NOT_FOUND` 에러 반환
- [ ] **스팸 필터 호출 위치 예약** — F4-C-002에서 구현할 스팸/중복 필터 호출 지점 확보
  - 현재는 통과(pass-through)로 구현, F4-C-002 완료 후 연동
- [ ] **ERROR_REPORT 레코드 생성** — Prisma `create`
  - `report_id`: UUID v4 자동 생성
  - `product_id`: 입력값
  - `reporter_id`: 세션 user_id
  - `field_name`, `reported_value`, `correct_value`, `evidence_url`: 입력값
  - `status`: `SUBMITTED` (초기값)
  - `reported_at`: `new Date()` (서버 시각)
- [ ] **응답 구성** — `ErrorReportResponse` 타입
  - `report_id`, `status: SUBMITTED`, `estimated_resolution_time: "48시간"`, `created_at`
- [ ] **에러 핸들링** — API-008 공통 에러 스키마 활용
  - Zod 유효성 실패: 400 + 필드별 에러
  - 인증 실패: 401
  - 제품 미존재: 404
  - 서버 에러: 500 (민감정보 미포함)
- [ ] **단위 테스트** — 정상 접수, 미인증 차단, 유효성 실패, 존재하지 않는 product_id

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정상적인 오류 제보 접수 (REQ-FUNC-024)**
- **Given**: 인증된 사용자가 유효한 제보 내용을 입력한 상태
- **When**: 오류 제보 Server Action을 호출한다
- **Then**: ERROR_REPORT에 `status=SUBMITTED` 레코드가 생성되고, `report_id`와 예상 처리 시간(48시간)이 반환된다.

**Scenario 2: 접수 확인 알림 3초 이내 (REQ-FUNC-024)**
- **Given**: 유효한 제보가 제출된 상태
- **When**: Server Action이 실행 완료된다
- **Then**: 응답이 3초 이내에 반환되어 프론트엔드에서 접수 확인 알림을 표시할 수 있다.

**Scenario 3: 구조화된 폼 필드 검증 (REQ-FUNC-028)**
- **Given**: `field_name`, `reported_value`, `correct_value`가 모두 입력된 상태
- **When**: Zod 스키마 검증을 수행한다
- **Then**: 필수 필드 누락 시 400 에러가 반환되며, 모든 필드가 존재하면 검증 통과한다.

**Scenario 4: 미인증 사용자 차단**
- **Given**: 세션이 없는(미인증) 사용자의 요청
- **When**: Server Action을 호출한다
- **Then**: 401 `REPORT_UNAUTHENTICATED` 에러가 반환된다.

**Scenario 5: 빈 문자열 제출 차단 (REQ-FUNC-027 예비)**
- **Given**: `correct_value`가 빈 문자열 또는 공백만 포함된 상태
- **When**: Zod 스키마 검증을 수행한다
- **Then**: 400 에러가 반환되고 "올바른 값을 입력해주세요" 메시지가 포함된다.

## :gear: Technical & Non-Functional Constraints
- **Server Action (CON-8)**: Route Handler가 아닌 `'use server'` Server Action으로 구현.
- **SLA 48시간 (REQ-NF-012)**: 접수 시점(`reported_at`)이 정확히 기록되어야 SLA 모니터링(NFR-MON-004)에 사용 가능.
- **닫힌 문맥 (P4)**: 본 태스크는 제보 "접수"만 수행. 스팸 필터링(F4-C-002), 상태 변경(F4-C-003), 알림(F4-C-004), 보상(F4-C-005)은 별도 태스크.
- **개인정보 (CON-4)**: `reporter_id`만 저장. 이메일 등 추가 개인정보는 별도 조인 시에만 접근.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] Server Action이 `'use server'` 디렉티브로 작성되었는가?
- [ ] ERROR_REPORT 테이블에 레코드가 정상 생성되는가?
- [ ] 인증 확인, 제품 존재 확인, Zod 검증이 모두 동작하는가?
- [ ] 응답 시간이 3초 이내인가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #API-004 (오류 제보 DTO), #DATA-007 (ERROR_REPORT 스키마)
- **Blocks**:
  - #F4-C-002 (스팸/중복 제보 필터링)
  - #F4-C-003 (제보 상태 변경)
  - #ADM-Q-002 (관리자 제보 목록 조회)
  - #UI-030 (오류 신고 폼 모달)
  - #TEST-F4-003 (접수 알림 3초 이내)
  - #TEST-F4-006 (구조화 폼 필드 검증)
