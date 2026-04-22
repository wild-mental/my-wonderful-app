---
name: Feature Task
about: SRS 기반의 구체적인 개발 태스크 명세
title: "[Feature] NFR-006: Vercel AI SDK 배포 기반 준비 + Google Gemini API 키 설정 (MVP LLM 미구현, 확장 대비)"
labels: 'feature, infra, epic:E-NFR, priority:low, phase:1, complexity:L'
assignees: ''
---

## :dart: Summary
- 기능명: [NFR-006] Vercel AI SDK 배포 기반 준비 (확장 대비)
- 목적: Phase 2에서 LLM 기반 기능(AI 요약, 스마트 추천 등) 확장을 대비하여, `@vercel/ai` 패키지를 devDependencies에 설치하고 Gemini API 키 플레이스홀더를 환경변수에 등록한다. MVP에서는 LLM 호출 구현 금지.
- Epic / Phase: E-NFR / Phase 1
- 복잡도: L

## :link: References (Spec & Context)
- SRS 제약사항: [`/05_SRS_v1.md#1.2.3`](../05_SRS_v1.md) — CON-11 (Gemini API 예약), CON-12 (월 제한)
- 태스크 리스트 원천: [`/TASKS/06_TASK_LIST_v1.md#6.1`](./06_TASK_LIST_v1.md)
- 선행 태스크: **NFR-001**, **NFR-005** (환경변수 체계)
- 후행 태스크: Phase 2 AI 기능 태스크

## :white_check_mark: Task Breakdown (실행 계획)
- [ ] **패키지 설치** — `pnpm add -D @vercel/ai @ai-sdk/google` (devDependencies)
  - 런타임 번들에 포함하지 않기 위해 `-D` 플래그 사용
- [ ] **환경변수 등록** — `GOOGLE_AI_API_KEY` 플레이스홀더를 `.env.example`에 추가
  - 주석: `# Phase 2 — LLM 기능 확장 시 활성화`
- [ ] **구현 금지 확인** — 실제 LLM 호출 코드가 존재하지 않는지 확인
  - `import { generateText } from 'ai'` 등 런타임 호출 코드 금지
  - 린트 규칙으로 `ai` 패키지 런타임 import 차단 권장
- [ ] **README 업데이트** — Phase 2 AI 기능 로드맵 간략 기술

## :test_tube: Acceptance Criteria (BDD/GWT)

**Scenario 1: 패키지 설치 확인**
- **Given**: `@vercel/ai`가 devDependencies에 추가된 상태
- **When**: `pnpm build`를 실행한다
- **Then**: AI 패키지가 프로덕션 번들에 포함되지 않으며, 빌드 에러 0건이다.

**Scenario 2: 런타임 LLM 호출 미존재 (CON-11)**
- **Given**: 코드베이스 전체를 검색한다
- **When**: `generateText`, `streamText` 등 AI SDK 런타임 함수를 검색한다
- **Then**: 0건이며, 실제 LLM 호출 코드가 존재하지 않는다.

## :gear: Technical & Non-Functional Constraints
- **AI 런타임 금지 (CON-11, CON-12)**: MVP에서 실제 LLM 호출 금지. devDependencies 수준 설치까지만 허용.
- **비용 (CON-12)**: Gemini API 무료 티어 월 제한 준수 (Phase 2에서 활용 시).

## :checkered_flag: Definition of Done (DoD)
- [ ] `@vercel/ai`, `@ai-sdk/google`이 devDependencies에 설치되었는가?
- [ ] `GOOGLE_AI_API_KEY`가 `.env.example`에 플레이스홀더로 추가되었는가?
- [ ] 런타임 LLM 호출 코드가 0건인 것이 확인되었는가?
- [ ] `pnpm build` 번들에 AI 패키지가 포함되지 않는가?

## :construction: Dependencies & Blockers
- **Depends on**: #NFR-001, #NFR-005
- **Blocks**: Phase 2 AI 태스크 (MVP에서는 후행 없음)
