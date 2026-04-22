---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F2-C-004: 미등재 원료 회색 라벨 생성 로직 (99% 식별 정확도, 뱃지 오발급률 0%)"
labels: 'feature, backend, epic:E-F2, priority:critical, phase:2, cqrs:command, legal:critical'
assignees: ''
---

## :dart: Summary
- 기능명: [F2-C-004] 미등재 원료 회색 라벨 생성 Command
- 목적: 식약처 건강기능식품공전에 **미등재**(`NOT_REGISTERED` 또는 `UNKNOWN`)된 성분에 대해 "식약처 미등재 원료 — 기능성 인정 정보 없음" 회색 라벨을 생성한다. F2-C-001이 `null`을 반환한 성분(미등재/UNKNOWN)을 수신하여 정식 뱃지와 구분되는 **회색 라벨 메타데이터**를 만들며, **뱃지는 절대 부여하지 않는다**(뱃지 오발급률 0%, REQ-FUNC-014). 미부여 사유 툴팁 텍스트까지 생성한다.
- Epic / Phase: E-F2 Anti-BS Dashboard / Phase 2 (CQRS 로직 계층)
- 복잡도: S

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 문서 (핵심 요구): [`/05_SRS_v1.md#4.1.2 REQ-FUNC-014`](../05_SRS_v1.md) — 식약처 미등재 원료 회색 라벨, 식별 정확도 99%, 뱃지 오발급률 0%
- SRS 문서 (시퀀스): [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — "회색 라벨 식약처 미등재 원료 생성" 단계
- SRS 문서 (데이터 모델): [`/05_SRS_v1.md#6.2.2 INGREDIENT`](../05_SRS_v1.md), [`#6.2.4 BADGE`](../05_SRS_v1.md)
- 관련 태스크: [`F2-C-001_badge_decision_logic.md`](./F2-C-001_badge_decision_logic.md), [`F2-Q-002_mfds_functional_ingredient_query.md`](./F2-Q-002_mfds_functional_ingredient_query.md)
- 태스크 리스트: [`/TASKS/06_TASK_LIST_v1.md#4.2 E-F2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **F2-Q-002** (MFDS 조회), **F2-C-001** (판정)
- 후행 태스크: F2-RH-001 (Route Handler 조립), UI-020 (회색 라벨 렌더링)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **GrayLabel 타입 정의** — `src/server/f2/types/gray-label.ts`:
  - `GrayLabel`:
    - `ingredientId: string`
    - `kind: "NOT_REGISTERED" | "UNKNOWN" | "INSUFFICIENT_DATA"` — 분기 사유 (관측/디버깅)
    - `labelText: "식약처 미등재 원료 — 기능성 인정 정보 없음"` (고정 문자열)
    - `tooltip: string` — 마우스오버 툴팁, 사유별 다름
    - `evidenceUrl?: string` — 공전 검색 링크 (사용자가 직접 확인용)
    - `shouldIssueBadge: false` — 타입 시스템으로 뱃지 발급 차단
- [ ] **생성 함수 `createGrayLabel()` 작성** — `src/server/f2/commands/create-gray-label.ts`:
  - Signature: `(input: GrayLabelInput) => GrayLabel`
  - Input:
    - `ingredient: IngredientView`
    - `mfdsResolution: MfdsResolution`
  - 분기:
    - `mfdsResolution.status === "NOT_REGISTERED"` → `kind: "NOT_REGISTERED"`, tooltip: "식약처 건강기능식품공전에 등재되지 않은 원료입니다."
    - `mfdsResolution.status === "UNKNOWN"` → `kind: "UNKNOWN"`, tooltip: "식약처 데이터를 일시적으로 확인할 수 없습니다. 잠시 후 다시 시도해 주세요."
    - `ingredient.amount_per_serving === 0 || !ingredient.unit` → `kind: "INSUFFICIENT_DATA"`, tooltip: "성분 함량 정보가 부족해 기능성 판정을 내릴 수 없습니다."
- [ ] **Batch 생성 함수** — `createGrayLabelsForMissing()`:
  - Signature: `(ingredients: IngredientView[], resolutions: Map<string, MfdsResolution>) => GrayLabel[]`
  - F2-C-001의 `decideBadgesForProduct()`가 반환한 `null` 항목을 필터링하여 호출
- [ ] **라벨 텍스트 불변성 가드** — `src/server/f2/constants/gray-label-text.ts`:
  - `GRAY_LABEL_TEXT = "식약처 미등재 원료 — 기능성 인정 정보 없음"` (상수 export, Object.freeze)
  - SRS 원문과 1:1 매칭. **문자열 변경 시 법률 검토자 승인 필수** (ESLint custom rule로 commit 차단)
- [ ] **BADGE 생성 금지 가드**:
  - 타입 레벨: `GrayLabel.shouldIssueBadge: false`는 리터럴 타입 → 상위 로직이 실수로 BADGE 생성 경로에 태우면 TypeScript 컴파일 실패
  - 런타임 레벨: F2-C-001의 `persistBadge()`는 `GrayLabel` 입력을 거부 (Union 타입 구분자로 방어)
- [ ] **공전 검색 링크 생성** — `src/server/f2/utils/mfds-search-url.ts`:
  - `buildMfdsSearchUrl(standardName: string)`: `https://www.foodsafetykorea.go.kr/portal/healthyfoodlife/foodIngredient.do?ingredient={encodeURIComponent(standardName)}` (실제 포맷은 PoC 시 확정)
  - 회색 라벨의 `evidenceUrl`에 포함되어 "직접 확인" 경로 제공
- [ ] **관측 로깅**:
  - 구조화 로그: `event="gray_label.created"`, `ingredient_id`, `kind`, `standard_name_hash`
  - `kind="UNKNOWN"` 비율이 5% 초과 시 MFDS 폴백 빈도 경보 (NFR-MON-001과 연계)
- [ ] **Unit Test 작성** — `tests/server/f2/commands/create-gray-label.test.ts` 10건 이상:
  - `NOT_REGISTERED` 분기 3건
  - `UNKNOWN` 분기 3건
  - `INSUFFICIENT_DATA` 분기 2건
  - `labelText` 불변성 검증 1건
  - 뱃지 생성 시도 시 TypeScript 컴파일 실패 검증 1건 (tsd 또는 expect-type)
- [ ] **Integration Test** — F2-C-001의 `null` 반환 → 본 Command 인계 → UI 렌더링용 데이터 생성 E2E 2건
- [ ] **식별 정확도 측정** — `tests/integration/gray-label-accuracy.test.ts`:
  - 500건 샘플 중 회색 라벨이 정확히 분류된 비율 ≥ 99% (REQ-FUNC-014)
  - 혼동 행렬: 등재 → APPROVED/CAUTION 분류 vs 미등재 → 회색 라벨 분류

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: NOT_REGISTERED 성분 — 회색 라벨 생성**
- **Given**: `IngredientView` `NMN` + `MfdsResolution.status="NOT_REGISTERED"`
- **When**: `createGrayLabel()` 호출
- **Then**: `{ kind: "NOT_REGISTERED", labelText: "식약처 미등재 원료 — 기능성 인정 정보 없음", tooltip: "...공전에 등재되지 않은 원료...", shouldIssueBadge: false }` 반환.

**Scenario 2: UNKNOWN 상태 (API 장애) — 회색 라벨 생성**
- **Given**: MFDS API 장애로 `MfdsResolution.status="UNKNOWN"`
- **When**: `createGrayLabel()` 호출
- **Then**: `{ kind: "UNKNOWN", tooltip: "식약처 데이터를 일시적으로 확인할 수 없습니다..." }` 반환. 사용자에게 "일시적"임을 명시.

**Scenario 3: 함량 정보 부족 — INSUFFICIENT_DATA 회색 라벨**
- **Given**: INGREDIENT `amount_per_serving=0`, `unit=""` (CP-1 데이터 미확보)
- **When**: `createGrayLabel()` 호출
- **Then**: `{ kind: "INSUFFICIENT_DATA", tooltip: "성분 함량 정보가 부족해..." }` 반환.

**Scenario 4: labelText 불변성 검증**
- **Given**: 개발자가 `GRAY_LABEL_TEXT` 상수를 임의 수정 시도
- **When**: `Object.freeze` + ESLint rule + 테스트 검증
- **Then**: 빌드 실패 또는 런타임 TypeError 발생.

**Scenario 5: 뱃지 생성 차단 (타입 레벨)**
- **Given**: 개발자가 `persistBadge(grayLabel)`을 실수로 호출
- **When**: TypeScript 컴파일
- **Then**: 타입 에러 발생 — `GrayLabel`은 `BadgeDecisionResult`와 Union 구분자로 분리되어 있어 허용되지 않음.

**Scenario 6: Batch 미등재 성분 처리**
- **Given**: 제품 P1의 성분 5개 중 2개가 NOT_REGISTERED
- **When**: `createGrayLabelsForMissing()` 호출
- **Then**: `GrayLabel[]` 길이 2 반환. 나머지 3개는 뱃지 판정 경로로 분기됨.

**Scenario 7: 공전 검색 URL 생성**
- **Given**: `standardName="NMN"`
- **When**: `createGrayLabel()` 호출 후 `evidenceUrl` 확인
- **Then**: `evidenceUrl`이 공전 검색 페이지 + `?ingredient=NMN`으로 올바르게 URL 인코딩되어 생성.

**Scenario 8: 식별 정확도 ≥ 99%**
- **Given**: 500건 샘플 (등재 250건 + 미등재 250건)
- **When**: 전체 분류 실행
- **Then**: 오분류 ≤ 5건 (정확도 ≥ 99%).

**Scenario 9: 뱃지 오발급률 0%**
- **Given**: 1,000건 미등재 성분 샘플
- **When**: 전체 분류 실행
- **Then**: BADGE 테이블에 INSERT된 레코드 수 = 0. (Integration Test로 DB 상태 직접 검증)

## :gear: Technical & Non-Functional Constraints
- **뱃지 오발급률 0% (REQ-FUNC-014, 법률 리스크)**: 본 Command는 **절대 `BADGE` 레코드를 생성하지 않음**. 타입 시스템 + 런타임 가드 이중 방어.
- **라벨 텍스트 불변 (REQ-FUNC-014, CON-2)**: `"식약처 미등재 원료 — 기능성 인정 정보 없음"`은 **SRS 지정 문구**. 변경 시 법률 리스크. `Object.freeze` + ESLint custom rule로 보호.
- **회색 UI (UI-020 연계)**: 본 Command는 **데이터 생성만**, 색상·아이콘 렌더링은 UI 책임. 그러나 타입 레벨에서 `kind`를 명시해 UI가 분기 가능.
- **UNKNOWN vs NOT_REGISTERED 구분**: 
  - `NOT_REGISTERED`: 사용자에게 **확정적 정보 부재** 전달 (공전에 실제로 없음)
  - `UNKNOWN`: 사용자에게 **일시적 문제** 전달 (재시도 유도)
  - 둘 다 회색 라벨 UI는 동일하나, 툴팁 문구는 다름
- **결정성**: 동일 입력 → 동일 출력. Math.random/Date.now 분기 금지.
- **성능**: 단건 ≤ 0.5ms, Batch 20개 ≤ 10ms. 순수 함수이므로 캐싱 불필요.
- **관측성**: `kind` 분포를 Vercel Logs로 집계하여 `UNKNOWN` 비율이 급등하면 MFDS API 폴백 빈도 경보. NFR-MON-001의 핵심 메트릭.
- **CQRS Command**: 본 Command는 **영속적 상태 변경 없음**(BADGE를 생성하지 않음). 그러나 F2 파이프라인 내 "데이터 변환" 책임을 가지므로 Command 분류 유지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria (Scenario 1~9)를 충족하는가?
- [ ] `createGrayLabel()` 단건 + `createGrayLabelsForMissing()` Batch 함수 모두 제공되는가?
- [ ] 3가지 `kind` 분기(NOT_REGISTERED/UNKNOWN/INSUFFICIENT_DATA)가 정확히 작동하는가?
- [ ] `GRAY_LABEL_TEXT` 상수가 `Object.freeze`되고 ESLint rule로 보호되는가?
- [ ] `GrayLabel.shouldIssueBadge: false`가 리터럴 타입으로 BADGE 생성 경로를 차단하는가?
- [ ] 공전 검색 URL이 URL-encoded로 정확히 생성되는가?
- [ ] 식별 정확도 ≥ 99%가 Integration Test로 검증되는가?
- [ ] 뱃지 오발급률 0%가 CI에서 검증되는가?
- [ ] 툴팁 문구가 `kind`별로 다르게 설정되는가?
- [ ] `kind="UNKNOWN"` 비율 모니터링 훅이 NFR-MON-001 연계 대비 마련되었는가?

## :construction: Dependencies & Blockers
- **Depends on**:
  - #F2-Q-001 (IngredientView 타입)
  - #F2-Q-002 (MfdsResolution 타입)
  - #F2-C-001 (null 반환 경로 인계)
- **Blocks**:
  - #F2-RH-001 (Badge Route Handler 응답 조립)
  - #UI-020 (제품 상세 페이지 회색 라벨 렌더링)
  - #TEST-F2-005 (회색 라벨 식별 정확도 ≥ 99% 검증)
  - #NFR-MON-001 (UNKNOWN 비율 모니터링)

## :bookmark_tabs: Notes
- 회색 라벨은 **"데이터가 없음"을 사용자에게 명확하게 알림으로써 신뢰를 쌓는** F4 Data Trust System의 철학을 F2에서 선제 구현하는 장치다. 단순히 정보를 감추지 않고, "왜 뱃지가 없는지"를 툴팁으로 설명한다.
- Phase 2 확장: `kind="UNKNOWN"` 성분에 대해 **사용자가 제보** 가능한 CTA를 제공할 수 있음(F4-C-001). 이 경우 회색 라벨 컴포넌트에 "정보 제보" 버튼 추가.
- `INSUFFICIENT_DATA` 분기는 CP-1(데이터 수집 실패) 대응 메커니즘이기도 함. 사전 벌크 수집이 부족한 제품을 회색 라벨로 표시하여 **관리자 백필 우선순위**를 자연스럽게 노출.
- 본 Command는 단순해 보이나, **뱃지 오발급률 0%** 요건 때문에 **법률 리스크 관점에서 중요**하다. PR 리뷰 시 타입 방어 + 런타임 방어 두 층이 모두 있는지 반드시 확인.
