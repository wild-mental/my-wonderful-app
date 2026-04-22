---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-C-003: 전문 용어 → 일상어 번역 매핑 로직 (95% 커버리지, 98% 정확도)"
labels: 'feature, backend, epic:E-F2, priority:high, phase:2, cqrs:command'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-C-003] 전문 용어 일상어 번역 매핑 Command
- 목적: 성분명·기능성 원문에 포함된 전문 용어(예: "콜레칼시페롤")를 사용자가 이해하기 쉬운 일상어(예: "몸에 잘 흡수되는 비타민 D3")로 번역해 괄호 형태로 병기한다. 식약처 등록 기능성 원료 기준 **95% 이상 커버리지**, **번역 정확도 98% 이상**을 보장한다(REQ-FUNC-013). 번역 결과는 F2-C-002 금지 표현 검증을 반드시 통과해야 한다.
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-013`](../05_SRS_v1.md) — 95% 커버리지, 98% 정확도, 괄호 병기
- SRS 문서 (제약): [`/05_SRS_v1.md#1.2.3 CON-2`](../05_SRS_v1.md) — 번역 결과도 금지 표현 필터링 대상
- SRS 문서 (시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — Badge API 내 translateToCommonLanguage 단계
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.2 INGREDIENT.common_name`](../05_SRS_v1.md)
- 관련 태스크: [`F2-C-002_prohibited_expression_validator.md`](./F2-C-002_prohibited_expression_validator.md), [`DATA-003_ingredient_schema.md`](./DATA-003_ingredient_schema.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-003** (INGREDIENT.common_name), **F2-C-002** (검증)
- 후행 태스크: F2-RH-001 (Route Handler 조립), UI-020 (상세 페이지 렌더링), TEST-F2-004 (번역 정확도)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **번역 사전 구축** — `src/data/translations/ingredient-translations.json`:
  - 스키마: `{ "standardName": string, "commonName": string, "aliases": string[], "category": IngredientCategory, "source": "CURATED" | "MFDS_APPROVED", "reviewedAt": ISO-8601, "reviewedBy": string }`
  - 초기 항목: **식약처 등록 기능성 원료 Top 200건** 수작업 번역 (MVP 시드)
  - 예시:
    - `"Cholecalciferol"` → `"몸에 잘 흡수되는 비타민 D3"`
    - `"Alpha-Tocopherol"` → `"자연 유래 비타민 E"`
    - `"Lactobacillus rhamnosus"` → `"장 건강을 돕는 유산균"`
  - JSON은 Git 관리 + 사전 변경 PR은 **도메인 전문가(영양사/약사) 검토자 승인 필수**
- [ ] **번역 함수 `translateToCommonLanguage()` 작성** — `src/server/f2/commands/translate-to-common-language.ts`:
  - Signature: `(standardName: string, options?: { claim?: string }) => TranslationResult`
  - Output 타입 `TranslationResult`:
    - `commonName?: string` — 번역 결과
    - `source: "DICTIONARY" | "FALLBACK_STANDARD_NAME" | "NOT_COVERED"`
    - `hit: boolean`
    - `prohibitedCheckPassed: boolean`
- [ ] **매칭 파이프라인 구현**:
  1. **정규화**: 입력 `standardName`을 Title Case·공백 정규화
  2. **사전 Lookup (O(1))**: `Map<string, TranslationEntry>` 구조체에서 정확 매칭
  3. **Alias Lookup**: `aliases` 배열에서 대체 이름 매칭 (예: "Vitamin D3" ↔ "Cholecalciferol")
  4. **Fallback**: 사전 미등재 시 `standardName` 원문 반환 + `source="FALLBACK_STANDARD_NAME"` + 경고 로그
- [ ] **F2-C-002 검증 통합**:
  - 모든 번역 결과 `commonName`에 대해 `validateProhibitedExpressions()` 호출
  - 금지 표현 검출 시 해당 번역은 **사전에서 제외** + `prohibitedCheckPassed=false` 반환 + 관리자 알림 (`event="translation_prohibited_detected"`)
  - **PR 레벨**: 사전 JSON 변경 시 CI에서 전체 항목 검증하는 pre-commit 훅 필수
- [ ] **Batch 번역 함수** — `translateIngredientsBatch()`:
  - Signature: `(standardNames: string[]) => Map<string, TranslationResult>`
  - 단일 사전 스캔으로 N개 매칭 처리 (O(N))
  - F2-RH-001에서 제품 전체 성분 번역 시 사용
- [ ] **커버리지 측정 도구** — `scripts/measure-translation-coverage.ts`:
  - `INGREDIENT` 전체 중 번역된 항목 비율 리포트
  - `REGISTERED` 원료 기준 커버리지 ≥ 95% 기준 달성 여부 출력
  - CI nightly 실행 → 커버리지 하락 시 경고
- [ ] **정확도 측정 체계**:
  - **수작업 검증 샘플 세트**: 200건의 (전문용어, 기대 번역) 쌍을 `tests/fixtures/translation-golden.json`에 구축
  - `tests/f2/translation-accuracy.test.ts`에서 정확도 ≥ 98% 검증
  - 정확도 기준: 의미 보존(semantic equivalence) + 괄호 병기 형식 일치
- [ ] **사전 버전 관리**: `ingredient-translations.json` 상단에 `version`, `last_updated_at`, `contributors[]` 메타데이터
- [ ] **관리자 편집 훅** (Phase 2 연계): 
  - `src/server/f2/commands/update-translation.ts`:
  - 관리자 UI에서 번역 편집 시 호출되는 별도 Command (본 태스크는 **시그니처만** 정의, 구현은 COM-C-003)
  - 편집 반영은 **DB 기반 사전 오버라이드 테이블**을 통해 실시간 반영 (JSON은 빌드타임 기본값)
- [ ] **캐싱 정책**: 사전은 서버 부트 시 1회 로드 후 메모리 상주. JSON + DB 오버라이드 병합 캐시는 1분 TTL로 갱신.
- [ ] **Unit Test 작성** — `tests/server/f2/commands/translate-to-common-language.test.ts` 15건 이상:
  - 사전 Hit 정확 매칭 5건
  - Alias 매칭 3건
  - Fallback (미등재) 3건
  - 정규화 경계 2건
  - 금지 표현 검출 → 번역 제외 2건
- [ ] **Integration Test** — 제품 전체 배치 번역 + 커버리지 검증 2건

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 정확 매칭 번역**
- **Given**: 사전에 `"Cholecalciferol"` → `"몸에 잘 흡수되는 비타민 D3"` 등재
- **When**: `translateToCommonLanguage("Cholecalciferol")` 호출
- **Then**: `{ commonName: "몸에 잘 흡수되는 비타민 D3", source: "DICTIONARY", hit: true, prohibitedCheckPassed: true }` 반환.

**Scenario 2: Alias 매칭**
- **Given**: 사전 `{ standardName: "Cholecalciferol", aliases: ["Vitamin D3"] }` 등재
- **When**: `translateToCommonLanguage("Vitamin D3")` 호출
- **Then**: `{ commonName: "몸에 잘 흡수되는 비타민 D3", source: "DICTIONARY", hit: true }` 반환.

**Scenario 3: Fallback — 사전 미등재**
- **Given**: `"Unknown Herb Extract"`이 사전에 없음
- **When**: 함수 호출
- **Then**: `{ commonName: "Unknown Herb Extract", source: "FALLBACK_STANDARD_NAME", hit: false }` 반환. Vercel Logs에 `event="translation_miss"` 경고.

**Scenario 4: 정규화 매칭 — 공백·대소문자**
- **Given**: 입력 `"  cholecalciferol  "`(앞뒤 공백, 소문자)
- **When**: 함수 호출
- **Then**: 정규화 후 `"Cholecalciferol"`로 매칭 성공, 사전 Hit.

**Scenario 5: 금지 표현 검출 — 번역 제외**
- **Given**: 사전 PR에서 오염된 번역 `"암을 예방하는 비타민"`이 제안됨
- **When**: pre-commit 훅이 F2-C-002를 실행
- **Then**: CI 실패, PR 머지 차단. 본 Command 런타임에도 동일 번역이 제외되고 원본 `standardName` 반환.

**Scenario 6: 커버리지 ≥ 95%**
- **Given**: `INGREDIENT` 중 REGISTERED 원료 500건
- **When**: `measure-translation-coverage.ts` 실행
- **Then**: `coverage >= 0.95` 출력, 미커버 원료 리스트는 별도 파일로 export.

**Scenario 7: 정확도 ≥ 98%**
- **Given**: 200건 골든 세트
- **When**: `translation-accuracy.test.ts` 실행
- **Then**: 정답율 ≥ 98% (오차 ≤ 4건).

**Scenario 8: Batch 번역 성능**
- **Given**: 성분 20개 배치
- **When**: `translateIngredientsBatch()` 호출
- **Then**: 응답 시간 ≤ 50ms, 사전 scan 1회만 발생.

**Scenario 9: 관리자 오버라이드 반영 (Phase 2)**
- **Given**: 관리자가 UI에서 `"Magnesium"` 번역을 "마그네슘(근육 이완 미네랄)"으로 수정
- **When**: 저장 후 최대 1분 경과
- **Then**: 프론트엔드 다음 요청에서 수정된 번역 적용.

## :gear: Technical & Non-Functional Constraints
- **커버리지 (REQ-FUNC-013)**: 식약처 등록 기능성 원료 기준 **95% 이상**. 상위 200건 번역으로 MVP 커버리지 달성 가능.
- **정확도 (REQ-FUNC-013)**: 골든 세트 기반 **98% 이상**. 번역 품질 기준:
  - 의미 보존 (전문 용어의 본질적 기능 표현)
  - 과장·의학적 주장 배제 (F2-C-002 검증)
  - 일상어 가독성 (중학생 이해 수준)
- **금지 표현 검증 통합 (CON-2)**: 번역 결과도 F2-C-002 검증 통과 필수. **번역이 오히려 금지 표현 우회 경로가 되지 않도록** 이중 방어.
- **괄호 병기 형식**: UI 레이어에서 `{standardName} ({commonName})` 형태로 렌더링(예: "콜레칼시페롤 (몸에 잘 흡수되는 비타민 D3)"). 본 Command는 `commonName`만 반환하고, 괄호 조립은 UI 책임.
- **CQRS Command 분류**: 본 Command는 **읽기 위주**(사전 Lookup)이지만, 매칭 Miss 시 로깅 이벤트를 남기므로 Command로 분류. 단, 사전 자체의 영속적 수정은 별도 Command(COM-C-003)에서 처리.
- **사전 버전 관리**: JSON 변경 PR은 **도메인 전문가(영양사/약사) + 백엔드 리드 이중 승인**. 라벨 `translation:reviewed` 필수.
- **DB 오버라이드 병합**: Phase 2 관리자 편집이 활성화되면 JSON + DB 병합 전략 (DB가 우선). 병합 캐시 TTL 1분.
- **성능 예산**: 
  - 단건 번역: ≤ 0.5ms
  - Batch 20개: ≤ 50ms
  - F2-RH-001 p95 1,000ms 예산 중 번역은 1% 이하 차지
- **Privacy**: 성분명은 PII 아님. 로깅 자유.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] `ingredient-translations.json`에 식약처 등록 원료 Top 200건이 번역되어 있는가?
- [ ] 커버리지 ≥ 95%가 CI에서 측정되는가?
- [ ] 정확도 ≥ 98%가 골든 세트로 검증되는가?
- [ ] Alias 매칭이 작동하는가?
- [ ] Fallback 시 경고 로그 + `FALLBACK_STANDARD_NAME` 반환이 보장되는가?
- [ ] F2-C-002 금지 표현 검증이 pre-commit 훅 + 런타임 양쪽에서 통과 필수화되었는가?
- [ ] Batch 번역 함수 + 성능 벤치마크가 통과하는가?
- [ ] 사전 JSON 변경 PR에 도메인 전문가 승인 정책이 Branch Protection에 설정되었는가?
- [ ] `pnpm typecheck`, `pnpm test` 모두 통과?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #DATA-003 (INGREDIENT.common_name 필드)
  - #F2-C-002 (금지 표현 검증 — 번역 결과 검증에 필수)
- **Blocks**:
  - #F2-RH-001 (Badge Route Handler — 번역 결과 응답에 포함)
  - #UI-020 (제품 상세 페이지 — 성분 렌더링)
  - #TEST-F2-004 (번역 커버리지·정확도 테스트)
  - #COM-C-003 (관리자 번역 편집 워크플로)

## :bookmark_tabs: Notes
- 번역 사전은 **제품의 신뢰성을 결정하는 핵심 자산**. 초기 200건은 도메인 전문가 위탁을 권장. 예산은 REQ-NF-020(월 8만원)에 포함하지 않고 **초기 구축비(외주) 별도**로 책정.
- Phase 2에 **커뮤니티 제보** 기반 번역 개선 루프 도입 검토: 사용자가 번역 품질을 제보 → 관리자 검수 → 반영. 이때도 F2-C-002 검증은 필수.
- 본 Command는 LLM 기반 자동 번역으로 확장 가능하나, **MVP는 수작업 사전 기반**으로 제한. LLM 도입 시 Hallucination 리스크 + CON-2 위반 가능성이 있어, 도입 전 충분한 검증 파이프라인 설계 필요.
- 괄호 병기 형식 `(common)`은 UI-020에서 별도 스펙으로 관리. 한글 번역 병기 정책(항상 괄호 안, CJK 공백 처리 등)은 UI 팀 협의.
