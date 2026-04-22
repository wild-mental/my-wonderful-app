---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-SEC-002: 사용자 데이터 최소 수집 원칙 기술적 적용 검증 (수집 필드 2개 한정: email, 비교 이력)"
labels: 'feature, security, epic:E-NFR, priority:medium, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-SEC-002] 최소 수집 원칙 기술 검증
- 목적: MVP에서 사용자 데이터 수집 범위가 `email`, `comparison_history`로 한정되는지 코드·스키마·로그 관점에서 검증한다. REQ-NF-015와 CON-4를 운영 가능한 통제 항목으로 구체화한다.

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 보안/개인정보: [`/05_SRS_v1.md#4.2.3 Security (보안/개인정보)`](../05_SRS_v1.md) — REQ-NF-015
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3 Constraints`](../05_SRS_v1.md) — CON-4
- 관련 구현 태스크: [`/TASKS/COM-C-001_email_user_signup.md`](./COM-C-001_email_user_signup.md)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#63-보안`](./06_TASK_LIST_v1.md)

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] USER/비교 이력 관련 Prisma 스키마 검토 체크리스트 작성
- [ ] 가입 요청 DTO/Zod `.strict()` 검증 항목 정의
- [ ] 금지 PII 필드 목록 정의
  - `name`, `phone`, `birthdate`, `address`, `gender`, `resident_id`
- [ ] 로그/모니터링 페이로드의 PII 노출 점검 항목 정의
- [ ] 정적 검사 또는 테스트 자동화 설계
  - 허용 필드 외 키 존재 시 테스트 실패
- [ ] 운영 검증 문서 작성
  - 신규 필드 추가 시 보안 리뷰 필수

## :test_tube: Acceptance Criteria (BDD/GWT)
Scenario 1: 가입 요청 최소 필드 검증
- Given: 가입 요청 스키마가 정의되어 있다.
- When: 허용 필드 외 추가 개인정보 키가 포함된 payload를 검증한다.
- Then: 검증은 실패한다.

Scenario 2: USER 스키마 최소 수집 검증
- Given: USER 관련 Prisma 모델이 정의되어 있다.
- When: 컬럼 목록을 점검한다.
- Then: 이메일과 비교 이력 연계를 위한 최소 필드 외 추가 PII 컬럼이 없다.

Scenario 3: 로그 마스킹 검증
- Given: 가입/인증 관련 서버 로그가 발생한다.
- When: 로그 payload를 점검한다.
- Then: 이메일은 마스킹되고 추가 개인정보는 기록되지 않는다.

Scenario 4: 비교 이력 외 데이터 차단
- Given: 비교 이력 저장 로직이 있다.
- When: 비교 대상 외 개인 프로필 데이터를 저장하려는 변경이 생긴다.
- Then: 검증 또는 리뷰 체크리스트에서 차단된다.

Scenario 5: 회귀 방지
- Given: 누군가 USER 모델에 전화번호 컬럼을 추가하려 한다.
- When: 검증 테스트를 실행한다.
- Then: 테스트가 실패하거나 보안 체크리스트에서 차단된다.

## :gear: Technical & Non-Functional Constraints
- 최소 수집 원칙은 문서가 아니라 코드/테스트/리뷰 규칙으로 강제되어야 한다.
- 비교 이력은 서비스 핵심 기능 범위 내 데이터만 허용한다.
- 로그/알림/대시보드로 개인정보가 우회 유출되지 않도록 함께 검증한다.
- 이 태스크는 정책 검증 태스크다. 인증 기능 자체 구현은 COM-C-001/002에 위임한다.

## :checkered_flag: Definition of Done (DoD)
- [ ] 모든 Acceptance Criteria를 충족하는가?
- [ ] 허용/금지 필드 목록이 문서화되는가?
- [ ] 스키마/DTO/로그 점검 항목이 정의되는가?
- [ ] 최소 수집 원칙 회귀를 잡는 자동 검증이 포함되는가?
- [ ] `pnpm typecheck` 및 관련 테스트가 통과하는가?

## :construction: Dependencies & Blockers
- Depends on: #COM-C-001
- Blocks: #TEST-COM-001
