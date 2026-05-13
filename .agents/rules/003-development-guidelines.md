---
description: 개발 표준 - 코드 스타일, 보안, 성능 SLA, Git 워크플로우
globs: ["**/*"]
alwaysApply: true
---

# Development Guidelines

## Code Style
- 코드/식별자/주석은 영어, 사용자 응답·문서는 한국어 우선
- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`, 런타임 입력은 **Zod** 로 검증
- 네이밍: 파일 kebab-case, 컴포넌트 PascalCase, 함수·변수 camelCase, DB 컬럼 snake_case, 환경변수 UPPER_SNAKE
- 에러 핸들링: `Result<T,E>` 또는 throw + 상위 `try/catch`, `any` 반환 금지

## Comments
- WHY 중심, WHAT 은 코드로
- 진부한 주석 즉시 삭제
- TODO 는 이슈 번호 포함: `// TODO(#123): ...`

## Security / Privacy
- TLS 1.2+ 전 구간 (REQ-NF-014)
- 최소 수집 (이메일 + 비교 이력만, CON-4)
- k-anonymity ≥ 5 (CON-6)
- `.env*` 커밋 금지
- Supabase RLS 모든 테이블 활성화

## Performance SLA (REQ-NF-001~005)
- 단가 비교 API p95 ≤ 3,500ms
- 뱃지 렌더링 p95 ≤ 1,000ms
- 카카오 공유 카드 p95 ≤ 1,500ms
- 출처 아코디언 p95 ≤ 500ms
- 페이지 LCP ≤ 2,500ms
- API 5xx ≤ 0.5%

## Architecture
- 전략 패턴: 외부 채널은 `lib/adapters/` `ChannelAdapter` 구현 (REQ-NF-024)
- 폴백: 외부 API 비가용 시 `PRICE_SNAPSHOT` 캐시 반환 (SRS §3.1.1)
- 사전 적재: 상위 300~500개 제품 MVP 출시 전 로컬 DB 적재
- 캐시 TTL: 뱃지 24h, 가격 일 1회 배치

## Git Workflow
- Conventional Commits, atomic commit
- 브랜치: `<type>/<issue>-<short-desc>`
- 금지: `main` 직접 커밋, force push, `--no-verify` (명시 요청 시 제외)
- 첫 푸시 직후 draft PR 생성

## Testing
- 단위: Vitest / E2E: Playwright / 통합: MSW / 성능: Lighthouse CI

## See also
- [001-project-overview.md](001-project-overview.md)
- [002-tech-stack.md](002-tech-stack.md)
