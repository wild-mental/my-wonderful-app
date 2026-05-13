# CLAUDE.md — Claude Code Project Context

본 파일은 Claude Code 가 매 세션 시작 시 자동 로드하는 글로벌 시스템 프롬프트입니다. 프로젝트 전반 규칙은 [AGENTS.md](AGENTS.md) 에 단일 정의되어 있으며, 본 파일은 **Claude 전용 라우팅·정책**만 담아 컨텍스트 오염을 최소화합니다.

> AGENTS.md 의 §1 Project Overview / §2 Tech Stack / §3 Hard Constraints / §4 Code Standards 는 본 파일에 중복 작성하지 않습니다. Claude 는 두 파일을 함께 읽습니다.

---

## 1. Claude Code 한정 운영 원칙

- **컨텍스트 다이어트:** `CLAUDE.md` 는 매 대화 토큰을 소모하므로 짧게 유지합니다. 절차·도메인 지식은 모두 [`.agents/skills/`](.agents/skills/) 의 `SKILL.md` 로 빼서 Claude 가 필요 시 자동으로 꺼내 읽습니다 (Skills 폴더는 `.claude/skills` 로 심볼릭 연결됨).
- **서브에이전트 우선:** 다수 파일을 다루는 대규모 작업은 메인 챗 토큰을 아끼기 위해 반드시 [.claude/agents/](.claude/agents/) 의 적합한 서브에이전트에 위임합니다.
- **권한 게이트:** 파일·쉘 권한은 `.claude/settings.local.json` 의 `permissions.allow` 에 명시된 작업만 허용됩니다.

---

## 2. Subagent Routing (Claude 전용)

다음 트리거에 해당하면 메인 챗 응답 없이 **즉시 서브에이전트에 위임**합니다.

| 트리거 | 서브에이전트 | 주요 파일 패턴 |
|---|---|---|
| Next.js 페이지 / 레이아웃 / Route Handler / Server Action / shadcn 컴포넌트 구현·리팩터링 | `nextjs-fullstack` | `app/**/*.tsx`, `app/**/route.ts`, `app/actions/**/*.ts`, `components/**/*.tsx` |
| Prisma 스키마 / 마이그레이션 / Supabase Auth · Storage · RLS / Seed | `prisma-supabase` | `prisma/schema.prisma`, `prisma/migrations/**`, `lib/supabase/**` |
| 쿠팡 파트너스 / 식약처 / 카카오 Link / Resend / Mixpanel 외부 API 어댑터 | `external-api-integration` | `lib/adapters/**/*.ts`, `lib/integrations/**/*.ts` |
| 커밋 직전 README / AGENTS.md / CLAUDE.md / `docs/` 자동 동기화 | `document-updater` | 커밋 단계 |

수동 호출 형식: `> use the <agent-name> subagent to <task>`

---

## 3. Skills (`.agents/skills/` 가 SSOT)

`.claude/skills` 는 `.agents/skills` 심볼릭이며, 모든 도구가 동일한 스킬을 공유합니다. Claude 는 작업 맥락에 따라 자동으로 적절한 스킬을 꺼내 읽습니다.

대표 슬래시 호출:
- `/100-error-fixing-process [에러 메시지 또는 파일:라인]` — 7단계 구조화 진단
- `/101-build-and-env-setup [dev|prod]` — Next.js / Vercel / Supabase 환경 점검
- `/102-gitflow-agent` — Git Flow 자동화

전체 인덱스는 [AGENTS.md §5](AGENTS.md) 의 Skill 표 참조.

---

## 4. Safety Rails

- `main` 브랜치 직접 커밋 / force push 금지
- `--no-verify` · `--no-gpg-sign` 은 사용자 명시 요청 시에만
- 데이터베이스 파괴 명령 (`prisma migrate reset`, `DROP TABLE`, `TRUNCATE` 등) 은 사용자 확인 필수
- `.env*` 파일 커밋 절대 금지 (`.gitignore` 점검)
- 식약처 공전에 등재되지 않은 표현으로 뱃지 텍스트 생성 금지 (Skill `307` 강제)
- 쿠팡 / 네이버 등 비공식 크롤링 코드 작성 금지 (CON-1 위반)

---

## 5. 참고 문서

- [AGENTS.md](AGENTS.md) — 프로젝트 전체 규칙 (Cross-tool SSOT)
- [docs/00_PRD_v1_0.md](docs/00_PRD_v1_0.md) — Product Requirements
- [docs/05_SRS_v1.md](docs/05_SRS_v1.md) — Software Requirements Specification
- [README-claude-harness.md](README-claude-harness.md) — Claude Code Harness 가이드
