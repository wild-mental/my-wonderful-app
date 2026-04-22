---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] F4-Q-001: 데이터 출처 조회 로직 (식약처 DB 링크, 라벨 이미지 URL, 논문 DOI)"
labels: 'feature, backend, epic:E-F4, priority:high, phase:2, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [F4-Q-001] 데이터 출처 조회 로직
- 목적: 제품 성분 데이터의 원천 출처(식약처 DB 링크, 제조사 라벨 이미지, 논문 DOI)를 조회하여, 사용자가 2클릭 이내에 데이터 근거에 도달할 수 있도록 아코디언 컴포넌트에 제공할 데이터를 반환한다.
- Epic / Phase: E-F4 (Data Trust System) / Phase 2 (로직·상태 변경)
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 기능 요구사항: [`/05_SRS_v1.md#4.1.4`](../05_SRS_v1.md) — REQ-FUNC-022 (출처 확인 2클릭), REQ-FUNC-015 (뱃지 근거 출처)
- SRS 상세 시퀀스: [`/05_SRS_v1.md#6.3.2`](../05_SRS_v1.md) — "출처 확인" 버튼 → 아코디언
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.4 BADGE`](../05_SRS_v1.md) — `evidence_source`, `evidence_url`
- SRS 데이터 모델: [`/05_SRS_v1.md#6.2.5 LABEL_ARCHIVE`](../05_SRS_v1.md)
- SRS 성능: [`/05_SRS_v1.md#4.2.1`](../05_SRS_v1.md) — REQ-NF-004 (아코디언 p95 ≤ 500ms)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#4.4 E-F4`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-005** (BADGE 스키마), **DATA-006** (LABEL_ARCHIVE 스키마)
- 후행 태스크: UI-024 (출처 확인 아코디언), TEST-F4-001

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **출처 조회 함수** — `src/lib/trust/get-data-sources.ts`
  - 입력: `productId: string`
  - 출력: `DataSourceResult` 타입
- [ ] **DataSourceResult 타입 정의** — `src/types/trust.ts`
  - `product_id: string`
  - `badge_sources: BadgeSource[]` — 뱃지별 근거 출처
    - `ingredient_name: string`
    - `evidence_type: 'MFDS' | 'PAPER' | 'MANUFACTURER'`
    - `evidence_url: string`
    - `evidence_label: string` (표시 텍스트)
  - `label_images: LabelImage[]` — 라벨 아카이브 이미지
    - `label_id: string`
    - `image_url: string`
    - `uploaded_at: string`
  - `mfds_db_url?: string` — 식약처 DB 직접 링크
- [ ] **Prisma 쿼리 구현** — BADGE + LABEL_ARCHIVE 테이블 조인 조회
  - BADGE: `product_id` → INGREDIENT → BADGE (evidence_source, evidence_url)
  - LABEL_ARCHIVE: `product_id` → image_url, uploaded_at
  - `include` 패턴으로 N+1 쿼리 방지
- [ ] **캐시 전략** — Next.js `unstable_cache` 또는 `revalidate` 활용
  - 출처 데이터는 변경 빈도가 낮으므로 TTL 24h 캐시 적용 가능
- [ ] **응답 시간 최적화** — p95 ≤ 500ms 목표 (REQ-NF-004)
  - 쿼리 최적화, 인덱스 확인
  - 필요 시 preload/lazy-load 전략 적용
- [ ] **단위 테스트** — 조회 결과 구조 검증, 미존재 product_id 처리

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 출처 데이터가 정상 조회된다**
- **Given**: BADGE 및 LABEL_ARCHIVE 데이터가 존재하는 제품
- **When**: `getDataSources(productId)`를 호출한다
- **Then**: `badge_sources`에 식약처/논문 출처 URL이 포함되고, `label_images`에 라벨 이미지 URL이 포함된다.

**Scenario 2: 출처 조회 응답 시간 p95 ≤ 500ms (REQ-NF-004)**
- **Given**: 시드 데이터가 적재된 DB 환경
- **When**: `getDataSources()`를 100회 호출한다
- **Then**: p95 응답 시간이 500ms 이내이다.

**Scenario 3: 2클릭 이내 출처 도달 (REQ-FUNC-022)**
- **Given**: 출처 데이터가 반환된 상태
- **When**: `badge_sources[0].evidence_url`에 접근한다
- **Then**: 유효한 URL이며, 사용자가 1차 클릭(아코디언 펼침) + 2차 클릭(링크 탭)으로 원문에 도달 가능하다.

**Scenario 4: 라벨 이미지 미등록 제품 처리**
- **Given**: LABEL_ARCHIVE에 이미지가 등록되지 않은 제품
- **When**: `getDataSources(productId)`를 호출한다
- **Then**: `label_images`가 빈 배열로 반환되되, 에러는 발생하지 않는다.

## :gear: Technical & Non-Functional Constraints
- **응답 시간 (REQ-NF-004)**: 아코디언 펼침 시간 p95 ≤ 500ms. 이는 프론트엔드 렌더링 시간을 포함한 값이므로, 백엔드 쿼리 시간은 200ms 이내 목표.
- **CQRS Query 격리**: 본 태스크는 순수 Read 작업. 데이터 변경(Write)은 수행하지 않음.
- **N+1 방지**: Prisma `include`/`select`를 활용하여 단일 쿼리로 BADGE + LABEL_ARCHIVE를 함께 조회.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] `DataSourceResult` 타입이 정의되었는가?
- [ ] Prisma 쿼리가 N+1 없이 동작하는가?
- [ ] 응답 시간 p95 ≤ 500ms가 간이 검증되었는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-005 (BADGE 스키마), #DATA-006 (LABEL_ARCHIVE 스키마)
- **Blocks**:
  - #UI-024 (출처 확인 아코디언 컴포넌트)
  - #TEST-F4-001 (출처 아코디언 p95 ≤ 500ms 검증)
