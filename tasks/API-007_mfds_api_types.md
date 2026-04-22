---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] API-007: 식약처 건강기능식품 공공 데이터 API 응답 타입 정의"
labels: 'feature, api, epic:E-API, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [API-007] 식약처 건강기능식품 공공 데이터 API 응답 타입 정의
- 목적: 식약처 건강기능식품 공공 데이터 API(EXT-API-02)의 응답 데이터를 TypeScript 타입으로 정의하여, Anti-BS Dashboard(F2) 뱃지 판정 로직과 데이터 벌크 수집에서 사용할 타입 안전한 인터페이스를 확보한다. 공전 원문 데이터 매핑의 정확도를 타입 시스템으로 보장한다.
- Epic / Phase: E-API / Phase 1 (계약·데이터 명세)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 외부 API 명세: [`/05_SRS_v1.md#6.1.1 외부 API`](../05_SRS_v1.md) — EXT-API-02 (식약처 건강기능식품 공공데이터)
- SRS 외부 시스템: [`/05_SRS_v1.md#3.1 External Systems`](../05_SRS_v1.md) — EXT-SYS-02
- SRS 폴백 전략: [`/05_SRS_v1.md#3.1.1`](../05_SRS_v1.md) — EXT-SYS-02 폴백 (로컬 DB 사용)
- SRS 비상 대응: [`/05_SRS_v1.md#1.2.5 CP-1`](../05_SRS_v1.md) — 식약처 공전 로컬 DB 대안
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.2`](../05_SRS_v1.md) — REQ-FUNC-011 (뱃지 판정)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#3.2 API 계약·DTO 정의 태스크`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩)
- 후행 태스크: MOCK-006 (식약처 API Stub), F2-Q-002 (식약처 기능성 원료 조회 로직)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **식약처 API 원시 응답 타입 정의** — `src/types/external/mfds.ts`에 공공 API 원시 응답
  - `MfdsApiResponse<T>`: 공공 API 공통 래퍼
    - `header: { resultCode: string; resultMsg: string }` (API 결과 코드)
    - `body: { pageNo: number; totalCount: number; numOfRows: number; items: T[] }` (페이징 정보 + 데이터)
  - `MfdsHealthFoodItem`: 건강기능식품 개별 항목
    - `PRDLST_NM: string` (제품명)
    - `BSSH_NM: string` (업체명)
    - `PRMS_DT: string` (인허가일자)
    - `STDR_STND: string` (기준 및 규격)
    - `PRIMARY_FNCLTY: string` (주된 기능성)
    - `IFTKN_ATNT_MATR_CN: string` (섭취 시 주의사항)
    - `DAY_INTK_CN: string` (일일 섭취량)
    - `NTK_MTHD: string` (섭취 방법)
    - `RAWMTRL_NM: string` (원재료명)
    - `CSTDY_MTHD: string` (보관 방법)
- [ ] **기능성 인정 원료 조회 응답 타입** — `MfdsFunctionalIngredient`
  - `ingredient_name: string` (원료명)
  - `approved_function: string` (기능성 인정 내용, 공전 원문)
  - `daily_intake: string` (일일 섭취량)
  - `cautions: string` (주의사항)
  - `approval_number?: string` (인증번호)
  - `approval_date?: string` (인증일자)
- [ ] **정규화된 내부 타입 정의** — `NormalizedMfdsData`
  - 외부 API 응답을 내부 도메인 모델에 맞게 변환한 타입
  - `standardName: string` (표준 성분명)
  - `approvedFunction: string` (기능성 인정 내용)
  - `dailyIntake: string` (일일 섭취량)
  - `cautions: string[]` (주의사항, 파싱 후 배열)
  - `isRegistered: boolean` (공전 등재 여부)
  - `registrationType: 'FUNCTIONAL' | 'NUTRITIONAL' | 'OTHER'` (등록 유형)
- [ ] **API 요청 파라미터 타입 정의** — `MfdsSearchParams`
  - `ingredient_name?: string` (원료명 검색)
  - `cert_no?: string` (인증번호 검색)
  - `page_no?: number` (페이지 번호)
  - `num_of_rows?: number` (페이지당 건수)
- [ ] **에러 타입 정의** — 식약처 API 전용 에러
  - `MfdsApiError` 클래스 (extends Error)
    - `resultCode: string` (API 결과 코드)
    - `resultMsg: string` (API 결과 메시지)
    - `isServiceUnavailable: boolean` (서비스 불가 상태)
- [ ] **환경변수 타입 선언**
  - `MFDS_API_KEY: string` (식약처 공공 데이터 API 인증 키)
  - `.env.example`에 플레이스홀더 추가
- [ ] **타입 Export 정리** — `src/types/external/index.ts` barrel export에 MFDS 관련 타입 등록
- [ ] **JSDoc 주석 작성** — 모든 필드에 한국어 설명, 실제 API 응답 예시, 갱신 주기(월 1회) 명시

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 식약처 API 원시 응답 타입 매칭**
- **Given**: 식약처 공공 API의 실제 응답 JSON 샘플이 주어진 상태
- **When**: `MfdsApiResponse<MfdsHealthFoodItem>` 타입으로 캐스팅한다
- **Then**: TypeScript 컴파일 에러 없이 모든 필드가 매핑된다.

**Scenario 2: 정규화 타입 변환 가능성 검증**
- **Given**: `MfdsHealthFoodItem` 원시 타입의 데이터가 주어진 상태
- **When**: `NormalizedMfdsData` 타입으로 변환 함수 시그니처를 정의한다
- **Then**: 변환 함수의 입력/출력 타입이 TypeScript 수준에서 안전하게 추론된다.

**Scenario 3: 검색 파라미터 유효성**
- **Given**: `{ ingredient_name: "비타민D", page_no: 1, num_of_rows: 10 }` 파라미터
- **When**: `MfdsSearchParams` 타입으로 할당한다
- **Then**: TypeScript 컴파일 에러 없이 타입이 만족된다.

**Scenario 4: API 에러 타입 구분**
- **Given**: 식약처 API가 서비스 불가 응답을 반환한 상황
- **When**: `MfdsApiError` 객체를 구성한다
- **Then**: `isServiceUnavailable: true`로 설정되어 폴백 로직(로컬 DB 사용)에서 분기 처리가 가능하다.

## :gear: Technical & Non-Functional Constraints
- **갱신 주기**: 식약처 공전은 **월 1회** 갱신. 따라서 식약처 API 직접 호출은 최소화하고, 사전 벌크 수집 데이터(DATA-011)를 우선 조회한다. 실시간 API 호출은 캐시 Miss 시에만 수행.
- **폴백 품질 (§3.1.1)**: 식약처 API 장애 시 로컬 DB(`INGREDIENT.mfds_status`, `mfds_claim`)를 사용하며, "실질적 품질 저하 없음" 수준을 보장.
- **공공 API 정책 준수**: Rate Limit과 이용 약관을 준수하여 호출. API 키 없이 호출 가능한 엔드포인트도 있으나, 키 기반 인증을 기본으로 설정.
- **한글 인코딩**: 식약처 API 응답은 한글 문자열을 포함. UTF-8 인코딩 정합성 확인.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~4)를 충족하는가?
- [ ] 원시 응답 타입, 정규화 타입, 검색 파라미터 타입이 정의되었는가?
- [ ] `MfdsApiError` 에러 클래스가 정의되었는가?
- [ ] `.env.example`에 식약처 API 키 플레이스홀더가 추가되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] JSDoc 주석에 실제 API 응답 예시가 포함되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩)
- **Blocks**:
  - #MOCK-006 (식약처 API Stub 서비스)
  - #F2-Q-002 (식약처 기능성 원료 조회 로직)
  - #F2-C-001 (뱃지 판정 로직 — 공전 데이터 타입 참조)
  - #DATA-011 (시드 데이터 — 공전 벌크 수집 시 타입 사용)

## :bookmark_tabs: Notes
- 식약처 공공 데이터 API의 실제 엔드포인트 URL과 필드명은 PoC 단계에서 확인 필요. 현재 SRS에 명시된 `https://openapi.mfds.go.kr/v1/hfoods`는 예시이며, 실제 API 문서와 대조 후 타입을 확정한다.
- `MfdsHealthFoodItem`의 필드명은 실제 공공 API의 필드명(대문자 스네이크 케이스)을 그대로 매핑한 것이므로, 정규화 시 `NormalizedMfdsData`의 camelCase로 변환한다.
- 원시 타입과 정규화 타입을 분리함으로써, 외부 API 응답 형식이 변경되어도 내부 로직에 미치는 영향을 최소화한다.
