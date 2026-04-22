---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-PERF-001: LCP ≤ 2,500ms 검증 Lighthouse CI 스크립트 작성"
labels: 'feature, infra, epic:E-NFR, priority:high, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-PERF-001] Lighthouse CI 성능 검증 스크립트
- 목적: 전체 페이지의 LCP(Largest Contentful Paint)가 2,500ms 이내인지 자동으로 검증하는 Lighthouse CI 스크립트를 작성하여, 성능 회귀를 조기에 감지한다.
- Epic / Phase: E-NFR / Phase 1
- 복잡도: M

## :link: References (Spec & Context)
- SRS 성능 요구사항: [`/05_SRS_v1.md#4.2.1`](../05_SRS_v1.md) — REQ-NF-005 (LCP ≤ 2,500ms)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.2`](./06_TASK_LIST_v1.md)
- 선행 태스크: **NFR-001** (Vercel 배포), **UI-001** (디자인 시스템)
- 후행 태스크: CI/CD 파이프라인 통합

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Lighthouse CI 패키지 설치** — `pnpm add -D @lhci/cli`
- [ ] **lighthouserc.js 설정 파일 작성**
  - 대상 URL: `http://localhost:3000`, `http://localhost:3000/compare` (주요 페이지)
  - Assertions:
    - `categories:performance >= 0.8` (80점 이상)
    - `largest-contentful-paint <= 2500` (2,500ms 이내)
    - `cumulative-layout-shift <= 0.1` (CLS ≤ 0.1)
    - `first-contentful-paint <= 1800` (FCP ≤ 1,800ms)
  - `numberOfRuns: 3` (3회 측정 후 중앙값)
- [ ] **npm script 추가** — `package.json`에 `"lighthouse": "lhci autorun"` 등록
- [ ] **GitHub Actions 연동 가이드** — PR 빌드 시 Lighthouse CI 자동 실행 설정 문서화
  - 현재는 수동 실행, CI 통합은 후속 태스크
- [ ] **성능 예산(Performance Budget) 파일** — `budget.json` 작성
  - JS 번들: ≤ 150KB gzip
  - 총 자원: ≤ 500KB
- [ ] **결과 리포트 출력** — HTML 리포트 생성 경로 설정

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: LCP ≤ 2,500ms 검증**
- **Given**: 앱이 로컬에서 빌드·기동된 상태
- **When**: `pnpm lighthouse`를 실행한다
- **Then**: LCP가 2,500ms 이내로 측정되고 assertion이 통과한다.

**Scenario 2: 성능 예산 초과 시 경고**
- **Given**: JS 번들 사이즈가 150KB gzip을 초과하는 상황
- **When**: Lighthouse CI를 실행한다
- **Then**: Performance Budget 위반 경고가 출력된다.

**Scenario 3: 모바일 기준 측정**
- **Given**: Lighthouse 모바일 에뮬레이션이 활성화된 상태 (4G 네트워크, Moto G4)
- **When**: 메인 페이지를 측정한다
- **Then**: 모바일 LCP가 2,500ms 이내이다.

## :gear: Technical & Non-Functional Constraints
- **측정 환경**: Lighthouse 모바일 에뮬레이션 기본(4G throttling). 실제 디바이스와 차이 있을 수 있음.
- **CI 통합**: 현재 MVP에서는 수동 실행. Phase 2에서 GitHub Actions 자동 실행 도입.
- **번들 사이즈 (CON-10)**: 초기 JS 번들 ≤ 150KB gzip (DATA-001에서 정의).

## :checkered_flag: Definition of Done (DoD)
- [ ] `lighthouserc.js` 설정 파일이 작성되었는가?
- [ ] `pnpm lighthouse` 스크립트가 동작하는가?
- [ ] LCP ≤ 2,500ms assertion이 통과하는가?
- [ ] Performance Budget(`budget.json`)이 작성되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #NFR-001 (Vercel 배포), #UI-001 (디자인 시스템)
- **Blocks**: CI/CD 성능 게이트 통합 (후속)
