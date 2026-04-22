---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-005: 제품 등록 요청 Server Action (`POST`) FormData 스키마 및 응답 DTO TypeScript 타입 정의"
labels: 'feature, api, epic:E-API, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [API-005] 제품 등록 요청 Server Action DTO 타입 정의
- 목적: 미등록 성분/제품에 대한 사용자 등록 요청 Server Action의 입력(FormData) 스키마와 응답 DTO를 TypeScript 타입으로 정의하여, 프론트엔드 CTA(UI-013)와 백엔드 접수 로직(COM-C-003) 및 관리자 백오피스(ADM-Q-001) 간의 데이터 계약을 확보한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-05 (Server Action, POST)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.1`](../05_SRS_v1.md) — REQ-FUNC-008 (미등록 성분 등록 요청)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-032 (등록 요청 백오피스 관리)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.1 PRODUCT`](../05_SRS_v1.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-002** (PRODUCT 테이블 Prisma 스키마)
- 후행 태스크: COM-C-003 (등록 요청 접수 로직), ADM-Q-001 (관리자 등록 요청 목록 조회)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **RegistrationStatus Enum 정의** — `src/types/api/registration.ts`에 등록 요청 처리 상태
  - `PENDING` — 대기 중
  - `APPROVED` — 승인 (제품 DB 등록)
  - `REJECTED` — 반려
  - `ON_HOLD` — 보류 (추가 정보 필요)
- [ ] **등록 요청 입력 DTO 정의** — `ProductRegistrationInput` 인터페이스
  - `ingredient_name: string` (요청 성분명, 필수)
  - `product_name?: string` (제품명, 선택)
  - `brand_name?: string` (브랜드명, 선택)
  - `product_url?: string` (제품 URL, 선택)
  - `requester_note?: string` (기타 요청 메모, 선택, 최대 500자)
- [ ] **등록 요청 응답 DTO 정의** — `ProductRegistrationResponse` 인터페이스
  - `request_id: string` (등록 요청 고유 ID)
  - `status: RegistrationStatus` (처리 상태, 초기값: PENDING)
  - `message: string` (접수 확인 메시지)
  - `created_at: string` (접수 시각, ISO 8601)
- [ ] **관리자용 등록 요청 목록 DTO 정의** — `RegistrationListItem` (ADM-Q-001 연계)
  - `request_id: string`
  - `ingredient_name: string`
  - `product_name?: string`
  - `brand_name?: string`
  - `product_url?: string`
  - `status: RegistrationStatus`
  - `requester_email: string` (마스킹 처리)
  - `created_at: string`
  - `reviewed_at?: string`
- [ ] **Zod 런타임 검증 스키마 작성** — `src/schemas/registration.schema.ts`
  - Input: `ingredient_name` 최소 1자, 최대 100자 / `requester_note` 최대 500자 / `product_url` URL 형식(선택)
- [ ] **에러 코드 Enum 정의** — Registration API 전용 에러 코드
  - `REGISTRATION_INGREDIENT_REQUIRED` (400): 성분명 미입력
  - `REGISTRATION_DUPLICATE` (409): 동일 성분명 등록 요청 이미 존재
  - `REGISTRATION_UNAUTHENTICATED` (401): 미인증 사용자
- [ ] **타입 Export 정리** — barrel export에 등록
- [ ] **JSDoc 주석 작성** — 모든 필드에 한국어 설명 기술

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 등록 요청 입력**
- **Given**: `{ ingredient_name: "NMN" }` 최소 필수 필드만 포함된 요청
- **When**: `ProductRegistrationInputSchema.parse()`로 검증한다
- **Then**: 에러 없이 파싱 성공한다.

**Scenario 2: 빈 성분명 거부**
- **Given**: `{ ingredient_name: "" }` 빈 문자열 입력
- **When**: `ProductRegistrationInputSchema.parse()`로 검증한다
- **Then**: `ZodError`가 발생하며, `ingredient_name` 필수 필드 에러가 포함된다.

**Scenario 3: 접수 응답 구조 검증**
- **Given**: 유효한 등록 요청이 성공적으로 접수된 상태
- **When**: `ProductRegistrationResponse` 객체를 구성한다
- **Then**: `status`가 `PENDING`, `message`에 접수 확인 안내가 포함된다.

**Scenario 4: 관리자용 목록에서 상태 변경 표현**
- **Given**: 관리자가 등록 요청을 승인한 상태
- **When**: `RegistrationListItem`의 `status`를 `APPROVED`로 구성한다
- **Then**: TypeScript 컴파일 에러 없이 Enum 타입이 만족된다.

## :gear: Technical & Non-Functional Constraints
- **Server Action (CON-8)**: Route Handler가 아닌 Server Action으로 구현 전제. FormData 기반 입력.
- **등록 요청 제출 성공률 (REQ-FUNC-008)**: 99% 이상. DTO 구조가 제출 실패를 유발하지 않도록 경량 설계.
- **개인정보 (CON-4)**: 관리자 조회 시 요청자 이메일 마스킹 필수.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~4)를 충족하는가?
- [ ] `RegistrationStatus` Enum, 입력/응답/목록 DTO가 정의되었는가?
- [ ] Zod 스키마 작성 및 테스트 통과?
- [ ] 에러 코드 정의 완료?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-002 (PRODUCT 테이블 Prisma 스키마)
- **Blocks**:
  - #COM-C-003 (미등록 제품 등록 요청 접수 Server Action)
  - #ADM-Q-001 (관리자 등록 요청 목록 조회)
  - #ADM-C-001 (등록 요청 상태 관리)
  - #UI-013 (미등록 성분 안내 + CTA 버튼)

## :bookmark_tabs: Notes
- 등록 요청은 별도 테이블(예: `PRODUCT_REGISTRATION_REQUEST`)이 필요할 수 있으나, 현재 SRS 데이터 모델에 명시되지 않음. DATA-002 PRODUCT 스키마에 요청 상태를 확장하거나, 별도 테이블 생성 여부는 아키텍처 검토 후 결정.
- MVP 단계에서 등록 요청은 수동 처리(관리자 직접 DB 입력)가 전제. 자동화는 Phase 2에서 도입.
