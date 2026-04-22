---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Test] TEST-COM-001: 이메일 기반 회원가입 시 추가 개인정보 필드 미존재 검증 (최소 수집 원칙)"
labels: 'test, epic:E-TEST, priority:high, phase:3, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [TEST-COM-001] 최소 수집 원칙 회원가입 유닛 테스트
- 목적: 이메일 기반 회원가입 시 이메일과 비교 이력 외에 추가 개인정보(이름, 전화번호, 주소 등) 입력 필드가 존재하지 않음을 자동화 테스트로 보장한다.
- Epic / Phase: E-TEST / Phase 3 (테스트 자동화)
- 복잡도: L

## :link: References (Spec & Context)
- SRS: [`/05_SRS_v1.md#4.1.5`](../05_SRS_v1.md) — REQ-FUNC-029 (이메일 + 비교 이력만 수집)
- SRS 보안: [`/05_SRS_v1.md#4.2.3`](../05_SRS_v1.md) — REQ-NF-015 (수집 필드 2개 한정)
- 선행 태스크: **COM-C-001** (이메일 기반 가입 로직)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **유닛 테스트** — `tests/unit/auth/signup-minimal-fields.test.ts`
  - 가입 함수의 입력 타입에 `email` 외 개인정보 필드가 없는지 타입 레벨 검증
  - 가입 성공 시 DB에 저장되는 컬럼이 `email`, `created_at`(+ 비교 이력 참조 ID)만인지 확인
- [ ] **금지 필드 블랙리스트 검증**
  - `name`, `phone`, `address`, `birth_date`, `gender` 등의 필드가 입력 스키마·DB 모델에 존재하지 않음을 확인
- [ ] **스냅샷 테스트** — Prisma User 모델의 컬럼 목록 스냅샷 → 새 개인정보 필드 추가 시 테스트 실패

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 가입 시 추가 개인정보 미존재 (REQ-FUNC-029)**
- **Given**: 이메일 기반 회원가입 함수
- **When**: 입력 스키마의 필드 목록을 검사한다
- **Then**: `email` 외에 `name`, `phone`, `address`, `birth_date`, `gender` 같은 추가 개인정보 필드가 존재하지 않는다.

**Scenario 2: DB 저장 컬럼 최소화 (REQ-NF-015)**
- **Given**: 회원가입이 완료된 상태
- **When**: USER 테이블의 저장된 레코드를 확인한다
- **Then**: 수집된 필드가 `email`, `created_at` (+ 시스템 ID)뿐이다.

## :gear: Technical & Non-Functional Constraints
- **개인정보 최소 수집 (CON-4)**: 이 테스트는 법적 준수 검증 목적. 새 필드 추가 시 반드시 실패하여 의도치 않은 개인정보 수집을 방지.

## :checkered_flag: Definition of Done (DoD)
- [ ] 입력 스키마 필드 검증 테스트가 작성되고 통과하는가?
- [ ] DB 모델 스냅샷 테스트가 작성되었는가?
- [ ] `pnpm test` 에러 0건?

## :construction: Dependencies & Blockers
- **Depends on**: #COM-C-001 (이메일 가입 로직)
- **Blocks**: 보안 감사 리포트
