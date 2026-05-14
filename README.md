# 건기식 성분·가격 비교 초자동화 플랫폼 (Super-Calc MVP)

> Next.js App Router · TypeScript strict · Prisma · Tailwind CSS + shadcn/ui · Vercel
>
> Business SSOT: [`docs/00_PRD_v1_0.md`](docs/00_PRD_v1_0.md) · Technical SSOT: [`docs/05_SRS_v1.md`](docs/05_SRS_v1.md)

이 저장소는 SRS-001 v1.4 의 **CON-7 ~ CON-13** 제약을 따르는 단일 풀스택 모놀리스입니다. 별도 백엔드 서버, 별도 SPA, 자체 Redis / DB 호스팅 등 [AGENTS.md](AGENTS.md#금지-스택-out-of-scope) 의 금지 스택은 도입하지 않습니다.

---

## 1. Tech Stack (확정)

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) + TypeScript `strict` |
| 서버 로직 | Route Handlers (`src/app/api/v1/*`) + Server Actions (`src/actions/*`) |
| ORM / DB | Prisma + Supabase PostgreSQL (dev: SQLite 가능) |
| UI | Tailwind CSS v3 + shadcn/ui (style: `new-york`, base: `neutral`) |
| 캐시 / Cron | Vercel KV · `unstable_cache` · Vercel Cron |
| 외부 채널 | 쿠팡 파트너스 / 식약처 OpenAPI / 카카오 Link / Resend / Mixpanel |
| 테스트 | Vitest + React Testing Library + (계획) Playwright |
| 배포 | Vercel 단일 플랫폼, Git Push 자동 배포 |

---

## 2. Prerequisites

- **Node.js ≥ 20 LTS** (`.nvmrc` 참조)
- **pnpm 9.x** — 다른 버전은 잠금 무결성을 깨뜨릴 수 있음
  ```bash
  corepack enable
  corepack prepare pnpm@9.15.4 --activate
  ```

---

## 3. Local Run

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

- 앱: <http://localhost:3000>
- 헬스체크: <http://localhost:3000/api/health> → `{ "ok": true, "ts": "..." }`

---

## 4. Quality Gates

```bash
pnpm lint        # next/core-web-vitals + prettier
pnpm typecheck   # tsc --noEmit (strict, noUncheckedIndexedAccess)
pnpm test        # Vitest smoke + 단위 테스트
pnpm build       # Next.js 프로덕션 빌드
```

PR 머지 전 4 단계를 모두 통과해야 합니다 (DATA-001 Acceptance Scenario 4).

---

## 5. Prisma / Database

```bash
pnpm db:generate         # prisma generate
pnpm db:migrate:dev      # prisma migrate dev (개발 환경 마이그레이션)
pnpm db:studio           # Prisma Studio
```

- `prisma/schema.prisma` 는 DATA-001 단계에서 **빈 스켈레톤(generator + datasource)** 만 포함합니다. 실제 모델 정의는 DATA-002 이후 순차 추가됩니다.
- 프로덕션 DB 는 Supabase PostgreSQL 이며, `DATABASE_URL` (pgbouncer 풀링) 과 `DIRECT_URL` (마이그레이션) 을 분리합니다.

---

## 6. Directory Structure (SRS §3.6 정합)

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── health/         # 헬스체크 Route Handler
│   │   └── v1/             # 도메인 API (이후 태스크에서 채움)
│   ├── globals.css         # Tailwind 진입점 + CSS 변수
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # 임시 랜딩
├── actions/                # Server Actions
├── components/
│   └── ui/                 # shadcn/ui primitives (현재 Button 만)
└── lib/
    ├── adapters/           # ChannelAdapter (REQ-NF-024 전략 패턴)
    ├── db.ts               # Prisma Client Singleton
    ├── env.ts              # Zod 기반 환경변수 검증
    └── utils.ts            # cn() 등 공용 유틸
prisma/
└── schema.prisma           # 빈 스켈레톤
tests/
└── smoke.test.ts           # Vitest 부트스트랩
ui-proto-vite/              # (legacy) Figma → Vite 랜딩 프로토타입
```

---

## 7. Environment Variables

`.env.example` 의 키 이름만 참고하고 실제 값은 **절대 커밋하지 않습니다** (CON-5). 운영 환경에서는 Vercel Dashboard 의 Environment Variables 와 Supabase Vault 만 사용하세요.

---

## 8. 참고 문서 & 에이전트 라우팅

- [AGENTS.md](AGENTS.md) — 크로스 툴 SSOT
- [CLAUDE.md](CLAUDE.md) — Claude Code 전용 라우팅
- [docs/05_SRS_v1.md §3.6](docs/05_SRS_v1.md) — 컴포넌트 다이어그램
- [tasks/06_TASK_LIST_v1.md](tasks/06_TASK_LIST_v1.md) — 태스크 SSOT
- 서브에이전트 / 스킬 인덱스는 [AGENTS.md §5](AGENTS.md) 참조
