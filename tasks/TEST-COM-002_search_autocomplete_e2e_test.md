---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Test] TEST-COM-002: 검색 자동완성 후보 반환 + 성분 포함 제품 목록 반환 E2E 검증"
labels: 'test, epic:E-TEST, priority:high, phase:3, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-COM-002] 검색 자동완성 E2E 테스트
- 목적: 영양소/성분명 검색 시 자동완성 후보가 반환되고, 검색 실행 시 해당 성분이 포함된 제품 목록이 올바르게 반환되는 전체 흐름을 E2E로 검증한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: M

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-030 (검색 기능, 자동완성)
- 선행 태스크: **COM-RH-001** (Search Route Handler)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **E2E 테스트** — `tests/e2e/search/autocomplete.test.ts`
  - 검색어 입력 → 자동완성 드롭다운 표시 → 후보 선택 → 제품 목록 반환
- [ ] **자동완성 후보 검증**
  - 입력: `"비타민"` → 후보: `["비타민D", "비타민C", "비타민B12"]` 등
  - 후보 반환 시간: 300ms 이내
- [ ] **제품 목록 반환 검증**
  - `"비타민D"` 검색 실행 → 비타민D 포함 제품 목록 반환
  - 반환 제품의 INGREDIENT에 `"비타민D"` 관련 성분이 존재
- [ ] **미등록 성분 검색 처리**
  - `"NMN"` 검색 → 안내 메시지 + `[제품 등록 요청하기]` CTA 표시 (REQ-FUNC-008)

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 자동완성 후보 반환 (REQ-FUNC-030)**
- **Given**: 사용자가 검색창에 `"비타민"`을 입력한 상태
- **When**: 자동완성 API가 호출된다
- **Then**: 관련 성분 후보 목록이 300ms 이내에 표시된다.

**Scenario 2: 검색 실행 시 제품 목록 반환**
- **Given**: 자동완성에서 `"비타민D"`를 선택한 상태
- **When**: 검색이 실행된다
- **Then**: 비타민D가 포함된 제품 목록이 반환된다.

**Scenario 3: 미등록 성분 안내 (REQ-FUNC-008)**
- **Given**: DB에 미등록된 성분 `"NMN"`으로 검색
- **When**: 검색 결과가 로드된다
- **Then**: "해당 성분은 현재 데이터베이스에 미등록 상태입니다" 안내와 `[제품 등록 요청하기]` CTA가 표시된다.

## :gear: Technical & Non-Functional Constraints
- **테스트 환경**: Mock 서비스(MOCK-003) 또는 시드 데이터 기반 로컬 환경.
- **속도**: 자동완성 후보 반환 300ms 이내.

## :checkered_flag: Definition of Done (DoD)
- [ ] 자동완성 후보 반환 테스트가 통과하는가?
- [ ] 제품 목록 반환 테스트가 통과하는가?
- [ ] 미등록 성분 안내 테스트가 통과하는가?
- [ ] `pnpm test` 에러 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-RH-001 (Search Route Handler)
- **Blocks**: 검색 기능 QA 릴리스
