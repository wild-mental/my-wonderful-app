---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] COM-RH-001: `GET /api/v1/search` 엔드포인트 통합 조립 (검색→자동완성→미등록 안내)"
labels: 'feature, backend, epic:E-COMMON, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [COM-RH-001] Search Route Handler 통합 조립 [Route Handler]
- 목적: API-003에서 정의한 `GET /api/v1/search` 엔드포인트를 Next.js App Router Route Handler로 구현하고, COM-Q-001(자동완성/제품 검색)과 COM-Q-002(미등록 안내+CTA)를 조합하여 단일 응답으로 조립한다. 요청 파라미터(`q`, `type`, `limit`)를 Zod로 검증하고, 결과 분기(자동완성 vs 제품 검색 vs 미등록 안내)를 처리하며, 에러는 API-008 공통 에러 스키마로 매핑한다. 응답 시간 < 300ms (REQ-FUNC-008/030 합산 임계).
- Epic / Phase: E-COMMON / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 내부 API 명세: [`/05_SRS_v1.md#6.1.2 내부 API`](../05_SRS_v1.md) — INT-API-03 (`GET /api/v1/search`)
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능`](../05_SRS_v1.md) — REQ-FUNC-030 (자동완성), REQ-FUNC-008 (미등록 안내)
- SRS 사용 사례: [`/05_SRS_v1.md#3.5 Use Cases`](../05_SRS_v1.md) — UC-01 (검색)
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — Next.js Route Handler
- 선행 태스크: **COM-Q-001** (자동완성/검색 쿼리), **COM-Q-002** (미등록 안내+CTA), **API-003** (Search DTO), **API-008** (공통 에러 스키마)
- 후행 태스크: UI-010 (검색창), UI-013 (CTA 버튼), TEST-COM-002, MOCK-003 (실 API와 동일 인터페이스 검증)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.5 E-COMMON: 공통 기능`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Route Handler 파일 생성** — `src/app/api/v1/search/route.ts`
  - `export async function GET(request: Request)`
  - Next.js App Router의 표준 Route Handler 시그니처
- [ ] **요청 파라미터 추출 및 Zod 검증** — API-003의 `SearchRequestSchema`
  - URL 파라미터: `q` (필수, 1~100자), `type` (`autocomplete | product`, 기본 `autocomplete`), `limit` (1~50, 기본 10)
  - `safeParse()` 실패 시 HTTP 400 + `error_code: "SEARCH_QUERY_REQUIRED"` 또는 `SEARCH_INVALID_PARAM`
- [ ] **방어적 입력 처리** — 1자 미만/빈 문자열
  - 1자 미만: HTTP 200 + `suggestions: []` (사일런트 무시, MOCK-003 일관)
  - 빈 문자열: HTTP 400 + `SEARCH_QUERY_REQUIRED`
- [ ] **분기 로직 — type=autocomplete**
  - `COM-Q-001.autocompleteIngredients(keyword, limit)` 호출
  - 결과가 빈 배열이면 `COM-Q-002.buildUnregisteredResponse(keyword)` 호출하여 `is_unregistered: true`로 응답
  - 결과가 1건+이면 `is_unregistered: false`로 정상 응답
- [ ] **분기 로직 — type=product**
  - `COM-Q-001.searchProducts(keyword, { limit })` 호출
  - 결과가 빈 배열이면 동일하게 미등록 안내 분기 호출
- [ ] **응답 헤더 설정**
  - 기본: `Cache-Control: public, max-age=60, s-maxage=60` (자동완성 1분 캐싱, COM-Q-001과 정합)
  - **빈 결과 차별화**: `is_unregistered: true` 응답은 `Cache-Control: public, max-age=300, s-maxage=300` (5분) — DB 부하 완화. 단, CTA 로그 수집을 위해 1분 단위 stale-while-revalidate 허용: `stale-while-revalidate=60`
  - **에러 응답**: `Cache-Control: no-store` (5xx/4xx는 캐싱 금지)
  - `X-Response-Time: ${ms}ms`, `X-Request-Id: ${reqId}`
  - `Vary: Accept-Language` (i18n 분기 대응)
- [ ] **에러 핸들링 — try/catch 최상위 래퍼**
  - 예상 에러: Zod 검증 실패 (400), 미등록 안내 분기 (200)
  - 예상 외 에러: HTTP 500 + `error_code: "SEARCH_SERVER_ERROR"` + 에러 메시지 마스킹 (스택 트레이스 노출 금지)
- [ ] **요청 로깅 및 응답 시간 측정**
  - `console.time` 또는 OpenTelemetry span
  - p95 > 300ms 시 NFR-MON-002 알림 트리거 (모니터링 영역)
- [ ] **Rate Limit — 다층 가드 (호출 위치 명시)**
  - **레이어 1 (CDN/Edge, NFR-SEC-004 담당)**: Vercel Edge Middleware 또는 Cloudflare — IP 기준 분당 120 / 시간당 1,000. 공격 트래픽 1차 차단. **본 태스크 범위 외**, 연계 태스크 NFR-SEC-004에서 구현.
  - **레이어 2 (애플리케이션, 본 태스크 범위)**:
    - Route Handler 진입 직후 호출하는 `checkSearchRateLimit({ ip, distinctId })`
    - 정책: `IP당 분당 60`, `distinct_id당 분당 100` 중 먼저 초과한 쪽 차단
    - 저장소: Redis(존재 시) 또는 in-memory LRU
    - 초과 시: HTTP 429 + `error_code: "SEARCH_RATE_LIMIT_EXCEEDED"` + `Retry-After` 헤더
  - **레이어 3 (스팸 방어)**: 동일 쿼리 반복(같은 `q` 10초 내 5회+) 시 1분 쿨다운
  - 구조화 로그 `event="search.rate_limited"` + `layer=app`
- [ ] **응답 DTO 정합성 검증** — API-003의 `SearchResponseSchema.safeParse()`로 출력 검증 (개발 환경 어서션)
- [ ] **i18n 헤더 처리 (Phase 1 한국어 고정)**
  - `Accept-Language` 헤더 파싱: `ko-KR`이면 한국어, 그 외는 HTTP 406 + `error_code: "SEARCH_LOCALE_NOT_SUPPORTED"`
  - 응답 헤더 `Content-Language: ko-KR` 고정
  - 주석 명시: "Phase 2에서 en-US 추가 시 본 핸들러는 locale을 COM-Q-001/COM-Q-002로 pass-through하도록 수정 필요"
- [ ] **MOCK-003 회귀 계약 검증**
  - `MOCK_MODE=true` 환경변수로 본 핸들러 내부에서 MOCK-003 어댑터로 강제 라우팅
  - `tests/contract/search-mock-live-parity.test.ts` — 동일 요청에 대해 MOCK / LIVE 응답의 스키마·필드 집합이 완전 일치하는지 검증(값은 무관, 형태만 비교)
  - 추가 필드 누락/오타 발견 시 CI 실패
- [ ] **Integration 테스트 작성** — 실 Prisma 테스트 DB + MOCK-003 양쪽 시나리오, TEST-COM-002와 연계

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 자동완성 정상 응답**
- **Given**: INGREDIENT 시드에 "비타민D, C, B, E"가 있고 `?q=비타&type=autocomplete`
- **When**: `GET /api/v1/search?q=비타&type=autocomplete`을 호출함
- **Then**: HTTP 200, `suggestions` 배열 4건, `is_unregistered: false`, 응답 시간 < 200ms.

**Scenario 2: 미등록 성분 분기 (REQ-FUNC-008)**
- **Given**: 시드에 없는 키워드 `?q=xyz_unknown&type=autocomplete`
- **When**: API를 호출함
- **Then**: HTTP 200, `suggestions: []`, `is_unregistered: true`, `cta` 객체가 포함되며 응답 시간 < 300ms.

**Scenario 3: 제품 검색 분기**
- **Given**: PRODUCT 시드에 비타민D 5건, `?q=비타민D&type=product&limit=20`
- **When**: API를 호출함
- **Then**: HTTP 200, `products` 배열 5건, 각 항목에 product_id/name/brand_name/thumbnail_url/ingredient_summary.

**Scenario 4: 빈 쿼리 거부**
- **Given**: `?q=&type=autocomplete`
- **When**: API를 호출함
- **Then**: HTTP 400, `error_code: "SEARCH_QUERY_REQUIRED"`.

**Scenario 5: 1자 미만 사일런트 무시**
- **Given**: `?q=ㄱ&type=autocomplete`
- **When**: API를 호출함
- **Then**: HTTP 200, `suggestions: []`, 에러 없음.

**Scenario 6: 잘못된 type 파라미터**
- **Given**: `?q=비타민D&type=invalid`
- **When**: API를 호출함
- **Then**: HTTP 400, `error_code: "SEARCH_INVALID_PARAM"`, Zod 에러 메시지 포함.

**Scenario 7: 서버 에러 마스킹**
- **Given**: COM-Q-001이 DB 연결 실패로 throw하는 상황
- **When**: API를 호출함
- **Then**: HTTP 500, `error_code: "SEARCH_SERVER_ERROR"`, 응답 body에 스택 트레이스/내부 에러 메시지 미포함.

**Scenario 8: 응답 DTO 정합성**
- **Given**: 모든 시나리오의 응답
- **When**: API-003 `SearchResponseSchema.parse()`로 검증함
- **Then**: 모든 응답이 Zod 검증을 통과한다.

**Scenario 9: Rate Limit 초과 (애플리케이션 레이어)**
- **Given**: 동일 IP에서 분당 61번째 요청
- **When**: API 호출
- **Then**: HTTP 429, `error_code: "SEARCH_RATE_LIMIT_EXCEEDED"`, `Retry-After` 헤더 포함, 구조화 로그 `search.rate_limited` 기록.

**Scenario 10: i18n — 미지원 로케일**
- **Given**: 요청 헤더 `Accept-Language: ja-JP`
- **When**: API 호출
- **Then**: HTTP 406, `error_code: "SEARCH_LOCALE_NOT_SUPPORTED"`. Phase 2에서 로케일 확장 시 본 시나리오 회귀 예상.

**Scenario 11: MOCK-003 계약 동등성**
- **Given**: `MOCK_MODE=true/false` 두 환경에서 동일 요청 `?q=비타&type=autocomplete`
- **When**: 양쪽 응답의 스키마를 `SearchResponseSchema` + 필드 집합(reflect)으로 비교
- **Then**: 응답 키 집합·타입·nullability가 완전 일치. 차이 발생 시 계약 테스트 실패.

**Scenario 12: 빈 결과 캐싱**
- **Given**: 미등록 키워드에 대한 응답
- **When**: 응답 헤더 확인
- **Then**: `Cache-Control: public, max-age=300, stale-while-revalidate=60`. DB 부하 완화 및 미등록 분석 이벤트는 계속 기록.

## :gear: Technical & Non-Functional Constraints
- **응답 시간 < 300ms**: REQ-FUNC-008(미등록 안내 300ms) + REQ-FUNC-030(자동완성 200ms)의 합산 임계. COM-Q-001 캐싱·인덱싱으로 달성.
- **DTO 정합성 (P1)**: API-003 SearchResponseSchema와 100% 정합. Mock(MOCK-003)과도 인터페이스 호환.
- **에러 메시지 마스킹**: 500 에러 시 내부 스택/DB 에러 메시지 노출 금지. 일관된 사용자 메시지 반환.
- **캐싱**: `Cache-Control: max-age=60` + COM-Q-001 내부 1분 TTL. 동일 키워드 재호출 시 빠른 응답.
- **Rate Limit (3-layer)**: CDN/Edge(분당 120, NFR-SEC-004) + 애플리케이션(IP 60/distinct_id 100, 본 태스크) + 스팸 쿨다운(동일 쿼리 10s/5회 → 1분). 계층별 책임 분리 명시.
- **CORS**: 동일 도메인 호출만 허용 (Next.js 기본). 외부 도메인 호출 시 미들웨어에서 차단.
- **Read-only**: GET 메서드. 검색 이벤트 로깅이 필요하면 별도 [Command]로 분리.
- **i18n (Phase 1 고정, Phase 2 확장 준비)**: `Accept-Language: ko-KR` 외 전부 406 거부. `Vary: Accept-Language` 캐시 분리. Phase 2에서 locale을 COM-Q-001/002로 pass-through하고 Zod 응답 스키마에 `locale` 필드 추가 예정.
- **계약 호환성 (MOCK-003)**: MOCK_MODE 토글이 코드 경로 하나에 집중되어, 본 핸들러가 MOCK/LIVE 어댑터를 DI 받도록 구성. 계약 회귀 실패 시 CI block.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~12)를 충족하는가?
- [ ] `src/app/api/v1/search/route.ts`가 작성되고 GET 핸들러를 export하는가?
- [ ] Zod 요청/응답 검증이 모두 적용되었는가?
- [ ] type=autocomplete / type=product / 미등록 안내 3개 분기가 정확히 동작하는가?
- [ ] 1자 미만/빈 쿼리/잘못된 type 등 방어적 처리가 동작하는가?
- [ ] 500 에러 응답에 스택 트레이스가 노출되지 않는가?
- [ ] 응답 헤더(Cache-Control 차등, X-Response-Time, X-Request-Id, Vary, Content-Language)가 설정되는가?
- [ ] 3-layer Rate Limit 중 애플리케이션 레이어가 본 핸들러에서 동작하는가? CDN 레이어는 NFR-SEC-004로 위임 기재?
- [ ] `Accept-Language: ko-KR` 이외 로케일을 406으로 명시적으로 거부하는가?
- [ ] MOCK-003 ↔ LIVE 계약 동등성 테스트가 통과하는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?
- [ ] Integration 테스트(scenario 1~12)가 작성되고 통과하는가?
- [ ] 부하 테스트로 p95 < 300ms 확인했는가?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-Q-001 (자동완성/검색 쿼리), #COM-Q-002 (미등록 안내+CTA), #API-003 (Search DTO), #API-008 (공통 에러 스키마)
- **Related (Rate Limit/보안 layering)**: #NFR-SEC-004 (CDN/Edge Rate Limit — 본 태스크의 1차 방어선)
- **Blocks**:
  - #UI-010 (검색창 + 자동완성 드롭다운 — 실 API 연동)
  - #UI-013 (미등록 성분 안내 + CTA 버튼)
  - #TEST-COM-002 (검색 자동완성 E2E 검증)
  - #MOCK-003 (실 API 인터페이스 회귀 검증 기준 — 본 태스크와 계약 동등성 유지)

## :bookmark_tabs: Notes
- 본 태스크는 Step 2 E-COMMON 도메인의 통합 진입점이다. F1-RH-001(Compare), F2-RH-001(Badge)와 동일한 Route Handler 패턴을 따라 일관성 확보.
- 자동완성과 제품 검색을 단일 엔드포인트에서 `type` 파라미터로 분기하는 설계는 클라이언트 fetch 코드 단순화에 유리. 향후 검색 정렬·필터 추가 시에도 동일 엔드포인트 확장.
- 미등록 안내 분기(`is_unregistered: true`)는 200 OK로 반환하여 클라이언트의 try/catch 분기 부담을 줄임. 명시적 플래그로 UI-013 분기 처리.
- MOCK-003과 본 태스크는 동일 인터페이스를 구현하므로, `MOCK_MODE` 토글로 즉시 전환 가능. 회귀 테스트 시 양쪽이 동일 응답을 내는지 비교 검증 권장.
