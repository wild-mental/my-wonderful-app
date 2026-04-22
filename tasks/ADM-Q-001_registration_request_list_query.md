---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] ADM-Q-001: 미등록 제품 등록 요청 목록 조회 (관리자 전용)"
labels: 'feature, backend, epic:E-ADMIN, priority:medium, phase:2, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [ADM-Q-001] 등록 요청 목록 조회 Query
- 목적: 사용자가 제출한 미등록 제품/성분 등록 요청을 관리자가 백오피스에서 조회할 수 있도록 목록 Query를 제공한다. REQ-FUNC-032의 첫 번째 관리자 기능으로, 후속 상태 변경 워크플로의 읽기 진입점이다.
- Epic / Phase: E-ADMIN / Phase 2 (로직·상태 변경)
- 복잡도: L

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 공통 기능 요구사항: [`/05_SRS_v1.md#4.1.5 공통 기능 요구사항`](../05_SRS_v1.md) — REQ-FUNC-032
- SRS 컴포넌트 다이어그램: [`/05_SRS_v1.md#3.6 Component Diagram`](../05_SRS_v1.md) — 관리자/Server Actions 맥락
- 관련 선행 명세: [`/TASKS/API-005_product_registration_dto.md`](./API-005_product_registration_dto.md)
- 관련 선행 구현 태스크: COM-C-003 (등록 요청 접수)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#47-e-admin-관리자-백오피스`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] 관리자 전용 등록 요청 목록 Query 함수 정의
- [ ] API-005의 `RegistrationListItem` DTO 기반 조회 모델 정합
- [ ] 기본 정렬 규칙 구현
  - 최신 요청 우선 (`created_at DESC`)
- [ ] 상태 필터 구현
  - `PENDING`, `APPROVED`, `REJECTED`, `ON_HOLD`
- [ ] 기본 검색 필드 구현
  - `ingredient_name`, `product_name`, `brand_name`
- [ ] 이메일 마스킹 규칙 적용
- [ ] 페이징/limit 기본값 구현
- [ ] 관리자 권한 가드 연동
- [ ] 단위 테스트 작성
  - 최신순 정렬
  - 상태 필터
  - 이메일 마스킹

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 최신 요청 우선 조회
- Given: 등록 요청 3건이 서로 다른 생성 시각으로 저장되어 있다.
- When: 관리자 목록 Query를 호출한다.
- Then: 가장 최근 요청이 첫 번째로 반환된다.

Scenario 2: 상태별 필터링
- Given: `PENDING`, `APPROVED`, `REJECTED` 상태의 요청들이 존재한다.
- When: `status=PENDING` 필터로 조회한다.
- Then: `PENDING` 상태 요청만 반환된다.

Scenario 3: 이메일 마스킹
- Given: 요청자 이메일이 저장된 요청 목록이 존재한다.
- When: 관리자 목록을 조회한다.
- Then: 응답에는 마스킹된 이메일만 포함되고 원문 이메일은 직접 노출되지 않는다.

Scenario 4: 권한 없는 사용자 차단
- Given: 관리자가 아닌 사용자가 목록 Query를 호출한다.
- When: 권한 검사를 수행한다.
- Then: `403 Forbidden` 또는 동등한 권한 오류가 반환된다.

Scenario 5: 검색 필터 동작
- Given: 여러 성분명/제품명의 등록 요청이 존재한다.
- When: `ingredient_name=NMN` 조건으로 조회한다.
- Then: 해당 키워드와 일치하는 요청만 반환된다.

## :gear: Technical & Non-Functional Constraints
- 이 태스크는 읽기 전용 Query다. 상태 변경, 승인/반려 처리 금지.
- 요청 저장소 구현 세부는 COM-C-003에 위임하고, 이 태스크는 조회 인터페이스에 집중한다.
- 관리자 응답은 UI 대시보드가 바로 사용할 수 있도록 페이징 가능한 플랫 구조를 유지한다.
- 민감 정보는 최소화한다. 요청자 이메일은 마스킹된 값만 전달한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 상태 필터, 검색, 최신순 정렬이 구현되는가?
- [ ] 관리자 권한 가드가 포함되는가?
- [ ] 이메일 마스킹이 적용되는가?
- [ ] `pnpm typecheck` 에러 0건, `pnpm lint` 경고 0건인가?

## :construction: Dependencies & Blockers
- Depends on: #COM-C-003
- Blocks: #ADM-C-001, #UI-061
