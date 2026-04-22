---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-002: Badge API (`GET /api/v1/badges`) Request/Response DTO 및 에러 코드 TypeScript 타입 정의"
labels: 'feature, api, epic:E-API, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [API-002] Badge API DTO 및 에러 코드 TypeScript 타입 정의
- 목적: 팩트체크 뱃지 조회 API의 요청/응답 데이터 계약을 TypeScript 타입과 Zod 스키마로 정의하여, Anti-BS Dashboard(F2) 백엔드 로직과 프론트엔드 UI 간의 SSOT를 확보한다. 뱃지 유형(APPROVED/CAUTION/NOT_APPROVED)과 일상어 번역, 미등재 원료 표시를 정확히 표현하는 타입 시스템을 구축한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-02 (`GET /api/v1/badges`)
- SRS 시퀀스 다이어그램: [`/05_SRS_v1.md#3.4.2 핵심 흐름: 팩트체크 뱃지 조회`](../05_SRS_v1.md)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.2 상세 시퀀스: 팩트체크 뱃지 + 출처 확인`](../05_SRS_v1.md)
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.4 BADGE`](../05_SRS_v1.md), [`/05_SRS_v1.md#6.2.2 INGREDIENT`](../05_SRS_v1.md)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2 F2. Anti-BS Dashboard`](../05_SRS_v1.md) — REQ-FUNC-010~015
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-005** (BADGE 테이블 Prisma 스키마)
- 후행 태스크: MOCK-002 (Badge Mock 엔드포인트), F2-C-001 (뱃지 판정 로직), F2-RH-001 (Route Handler 통합)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Request DTO 타입 정의** — `src/types/api/badges.ts`에 `BadgeRequest` 인터페이스 정의
  - `product_id: string` (대상 제품 ID, 필수)
- [ ] **BadgeType Enum 정의** — 뱃지 유형 열거형
  - `APPROVED` — 식약처 기능성 인정 원료, 적정 함량
  - `CAUTION` — 식약처 기능성 인정 원료, 초과/부족 함량
  - `NOT_APPROVED` — 기능성 미인정
- [ ] **EvidenceSource Enum 정의** — 근거 출처 유형
  - `MFDS` — 식약처 건강기능식품공전
  - `PAPER` — 학술 논문
  - `MANUFACTURER` — 제조사 공식 자료
- [ ] **BadgeItem 타입 정의** — 개별 뱃지 항목
  - `badge_id: string`
  - `ingredient_id: string`
  - `standard_name: string` (성분 표준명)
  - `common_name: string | null` (일상어 번역명, REQ-FUNC-013)
  - `badge_type: BadgeType` (뱃지 유형 Enum)
  - `badge_label: string` (뱃지 표시 라벨, 공전 원문 래핑)
  - `evidence_source: EvidenceSource` (근거 출처 유형)
  - `evidence_url: string` (근거 URL, REQ-FUNC-015)
  - `tooltip?: string` (미등재 원료 사유 툴팁, REQ-FUNC-014)
- [ ] **UnregisteredIngredientItem 타입 정의** — 식약처 미등재 원료 표현
  - `ingredient_id: string`
  - `standard_name: string`
  - `common_name: string | null`
  - `label: "식약처 미등재 원료 — 기능성 인정 정보 없음"` (고정 문자열 리터럴)
  - `reason: string` (미부여 사유)
- [ ] **Response DTO 타입 정의** — `BadgeResponse` 인터페이스 정의
  - `product_id: string` (대상 제품 ID)
  - `badges: BadgeItem[]` (뱃지가 부여된 성분 목록)
  - `unregistered: UnregisteredIngredientItem[]` (미등재 원료 목록, REQ-FUNC-014)
  - `from_cache: boolean` (캐시 데이터 여부)
  - `cache_expires_at?: string` (캐시 만료 시각, TTL 24h 기반)
- [ ] **Zod 런타임 검증 스키마 작성** — `src/schemas/badges.schema.ts`
  - Request: `product_id` 비어있지 않은 문자열 검증
  - Response: `badge_type` Enum 값 검증, `evidence_url` URL 형식 검증
- [ ] **에러 코드 Enum 정의** — Badge API 전용 에러 코드
  - `BADGE_PRODUCT_NOT_FOUND` (404): 존재하지 않는 product_id
  - `BADGE_MFDS_API_ERROR` (502): 식약처 공공 API 호출 실패
  - `BADGE_NO_INGREDIENTS` (404): 해당 제품에 등록된 성분이 없음
- [ ] **타입 Export 정리** — `src/types/api/index.ts` barrel export에 Badge 관련 타입 등록
- [ ] **JSDoc 주석 작성** — 모든 DTO 필드에 한국어 설명, SRS 요구사항 매핑, 예시 값 기술

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 유효한 product_id로 뱃지 조회 요청**
- **Given**: `{ product_id: "PROD-001" }` 요청이 주어진 상태
- **When**: `BadgeRequestSchema.parse()`로 유효성 검증을 수행한다
- **Then**: 에러 없이 파싱이 성공한다.

**Scenario 2: 빈 product_id 요청 거부**
- **Given**: `{ product_id: "" }` 요청이 주어진 상태
- **When**: `BadgeRequestSchema.parse()`로 유효성 검증을 수행한다
- **Then**: `ZodError`가 발생하며, `product_id` 필수 필드 에러가 포함된다.

**Scenario 3: 뱃지 응답이 3가지 유형을 정확히 표현**
- **Given**: APPROVED, CAUTION, NOT_APPROVED 각 1건과 미등재 원료 1건이 포함된 제품
- **When**: `BadgeResponse` 객체를 구성한다
- **Then**: TypeScript 컴파일 에러 없이 `badges` 배열에 3건, `unregistered` 배열에 1건이 포함되며, 각 `badge_type`이 Enum 값과 매칭된다.

**Scenario 4: 일상어 번역이 포함된 응답**
- **Given**: `standard_name: "Cholecalciferol"`, `common_name: "몸에 잘 흡수되는 비타민 D3"` 뱃지 항목
- **When**: `BadgeItem` 객체를 구성한다
- **Then**: `common_name` 필드에 일상어 번역이 포함되어 프론트엔드에서 괄호 표시에 사용 가능하다. (REQ-FUNC-013)

**Scenario 5: 미등재 원료에 뱃지 미부여 + 사유 표현**
- **Given**: 식약처 공전 미등재 성분이 포함된 제품
- **When**: `UnregisteredIngredientItem` 객체를 구성한다
- **Then**: `label`이 "식약처 미등재 원료 — 기능성 인정 정보 없음"으로 고정되고, `reason`에 미부여 사유가 포함된다. (REQ-FUNC-014)

## :gear: Technical & Non-Functional Constraints
- **마케팅 콘텐츠 0건 보장 (REQ-FUNC-010)**: Badge API 응답에는 광고, 리뷰, 별점, 체험단 관련 데이터 필드가 일절 포함되어서는 안 된다.
- **금지 표현 (CON-2, REQ-FUNC-012)**: `badge_label` 필드에 질병 예방·치료 표현이 포함될 수 없음을 DTO 레벨에서 JSDoc으로 명시. 실제 검증은 F2-C-002에서 수행.
- **캐시 TTL (§3.4.2)**: 응답의 `from_cache` / `cache_expires_at` 필드는 Next.js Cache TTL 24시간과 연계됨을 문서화.
- **응답 성능 (REQ-NF-002)**: Badge API p95 ≤ 1,000ms. DTO 구조가 직렬화 성능에 영향을 주지 않도록 중첩 최소화.
- **뱃지-공전 1:1 매칭 (REQ-FUNC-011)**: `evidence_url`은 반드시 식약처 공전 원문 또는 논문 DOI를 참조해야 함을 타입 주석으로 명시.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~5)를 충족하는가?
- [ ] `BadgeType`, `EvidenceSource` Enum이 정의되었는가?
- [ ] `BadgeItem`, `UnregisteredIngredientItem`, `BadgeResponse` 타입이 정의되었는가?
- [ ] Zod 스키마가 작성되고 `z.infer<>` 패턴으로 타입 추론이 가능한가?
- [ ] 에러 코드 3건 이상이 정의되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] 모든 필드에 JSDoc 주석이 포함되었는가?
- [ ] barrel export에 등록되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-005 (BADGE 테이블 Prisma 스키마)
- **Blocks**:
  - #MOCK-002 (Badge API Mock 엔드포인트)
  - #F2-C-001 (뱃지 판정 로직 — DTO 출력 타입 참조)
  - #F2-RH-001 (Badge Route Handler 통합 — DTO 기반 응답 구성)
  - #UI-021 (뱃지 컴포넌트 — BadgeType Enum 기반 색상 분기)

## :bookmark_tabs: Notes
- `BadgeType` Enum은 UI-021(뱃지 컴포넌트)에서 색상 분기(APPROVED=초록, CAUTION=노랑, NOT_APPROVED=빨강, 미등재=회색)에 직접 사용되므로, 프론트엔드와 백엔드에서 공유 가능한 위치(`src/types/`)에 정의한다.
- 뱃지 응답에 마케팅 관련 필드가 추가되지 않도록, PR 리뷰 시 REQ-FUNC-010 준수를 명시적으로 확인한다.
