---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-001: Vercel 프로젝트 생성 + Git Push 자동 배포 파이프라인 구성"
labels: 'feature, infra, epic:E-NFR, priority:critical, phase:1, complexity:M'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-001] Vercel 자동 배포 파이프라인 구성
- 목적: GitHub 저장소와 Vercel을 연동하여 `main` 브랜치 Push 시 자동 Production 배포, PR 생성 시 자동 Preview 배포가 수행되는 CI/CD 파이프라인을 구성한다. 이후 모든 기능 개발의 배포 기반이 된다.
- Epic / Phase: E-NFR (비기능·인프라) / Phase 1
- 복잡도: M

## :link: References (Spec & Context)
> :bulb: AI Agent & Dev Note: 작업 시작 전 아래 문서를 반드시 먼저 Read/Evaluate 할 것.
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3`](../05_SRS_v1.md) — CON-13 (Vercel 단일 플랫폼)
- SRS 컴포넌트: [`/05_SRS_v1.md#3.6`](../05_SRS_v1.md) — Vercel 배포 구성
- SRS 비용: [`/05_SRS_v1.md#4.2.4`](../05_SRS_v1.md) — REQ-NF-019 (월 $50 이하)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.1 인프라 구성`](./06_TASK_LIST_v1.md)
- 선행 태스크: **DATA-001** (프로젝트 초기 스캐폴딩)
- 후행 태스크: NFR-002~006, NFR-PERF-001, NFR-MON-001, UI-001

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **Vercel 프로젝트 생성** — Vercel 대시보드에서 GitHub 저장소 Import
  - Framework Preset: Next.js (자동 감지)
  - Root Directory: `./` (모노레포 아님)
  - Build Command: `pnpm build`
  - Output Directory: `.next`
- [ ] **Git 브랜치 전략 연동**
  - Production Branch: `main` → 자동 Production 배포
  - Preview: PR 생성 시 자동 Preview 배포
  - `vercel.json` 최소 설정 (framework 자동 감지 허용)
- [ ] **환경변수 초기 설정** — Vercel Dashboard → Settings → Environment Variables
  - `DATABASE_URL` (NFR-002 완료 후 설정)
  - `DIRECT_URL` (NFR-002 완료 후 설정)
  - `NEXT_PUBLIC_APP_URL` (Vercel 도메인)
  - 환경별 분리: Production / Preview / Development
- [ ] **도메인 설정** — Vercel 기본 도메인(`.vercel.app`) 사용
  - 커스텀 도메인은 MVP 이후 검토
- [ ] **빌드 최적화 확인**
  - `pnpm build` 성공 확인
  - 빌드 시간 ≤ 5분 확인
  - 초기 번들 사이즈 ≤ 150KB gzip 확인
- [ ] **Preview 배포 동작 검증** — 테스트 PR 생성 → Preview URL 확인 → `/api/health` 응답 확인

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: main 브랜치 Push 시 자동 배포**
- **Given**: `main` 브랜치에 커밋이 Push된 상태
- **When**: Vercel이 웹훅을 수신한다
- **Then**: 자동으로 Production 배포가 시작되고, 배포 완료 후 Production URL에서 HTTP 200이 반환된다.

**Scenario 2: PR 생성 시 Preview 배포**
- **Given**: feature 브랜치에서 `main`으로의 PR이 생성된 상태
- **When**: Vercel이 PR 웹훅을 수신한다
- **Then**: Preview URL이 자동 생성되고, PR 코멘트에 Preview URL이 표시된다.

**Scenario 3: 헬스체크 엔드포인트 확인 (DATA-001 연계)**
- **Given**: 배포가 완료된 상태
- **When**: `{deployment-url}/api/health`에 GET 요청을 보낸다
- **Then**: `{ "ok": true }` 응답이 HTTP 200으로 반환된다.

**Scenario 4: 빌드 비용 제어 (REQ-NF-019)**
- **Given**: Vercel Free/Hobby 플랜 사용
- **When**: 월간 빌드 횟수와 대역폭을 확인한다
- **Then**: 월 $50 예산 범위 내에서 운영 가능하다.

## :gear: Technical & Non-Functional Constraints
- **Vercel 단일 플랫폼 (CON-13)**: AWS, GCP 등 타 플랫폼 사용 금지.
- **비용 (REQ-NF-019)**: Vercel Hobby 플랜 기준. Pro 플랜 필요 시 월 $20 추가.
- **빌드 시간**: 5분 이내. Turborepo 등 빌드 캐시 활용 권장.
- **보안**: 환경변수에 민감 정보 직접 설정, 코드에 노출 금지.

## :checkered_flag: Definition of Done (DoD)
- [ ] main Push → Production 자동 배포가 동작하는가?
- [ ] PR → Preview 자동 배포가 동작하는가?
- [ ] Production URL에서 `/api/health` 200 응답이 확인되었는가?
- [ ] `vercel.json` 최소 설정이 커밋되었는가?
- [ ] 환경변수 구조가 문서화되었는가?

## :construction: Dependencies & Blockers
- **Depends on**: #DATA-001 (프로젝트 초기 스캐폴딩)
- **Blocks**:
  - #NFR-002 ~ #NFR-006 (모든 인프라 태스크)
  - #NFR-PERF-001 (Lighthouse CI)
  - #NFR-MON-001 (Vercel Analytics 연동)
  - #NFR-COST-001 (비용 모니터링)
