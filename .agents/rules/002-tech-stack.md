---
description: SRS §1.2.3 CON-7~13 에 따른 확정 기술 스택 (변경 금지)
globs: ["**/*"]
alwaysApply: true
---

# Technical Stack (Confirmed)

> SRS-001 v1.4 §1.2.3 CON-7~13 에 의해 확정. 변경 시 SRS 부터 개정한다.

## Full-Stack
- **Next.js (App Router) 14+** + **TypeScript strict** — 단일 풀스택 모놀리스 (CON-7)
- 서버 로직: **Route Handlers + Server Actions** — 별도 백엔드 서버 금지 (CON-8)

## Database / Auth / Storage
- **Prisma ORM** + **Supabase PostgreSQL** (배포) / **SQLite** (로컬) (CON-9)
- Supabase Auth (`@supabase/ssr`)
- Supabase Storage — 라벨 이미지 (LABEL_ARCHIVE)
- RLS 모든 테이블 필수

## UI / Styling
- **Tailwind CSS v3** + **shadcn/ui** (CON-10)
- 모바일 웹 퍼스트, 카카오 내장 브라우저 호환

## Infrastructure
- **배포:** Vercel 단일 플랫폼, Git Push 자동 배포 (CON-13)
- **캐시:** Vercel KV / Next.js `unstable_cache` / `revalidate`
- **Cron:** Vercel Cron (일 1회 가격 동기화)
- **이메일:** Resend API (REQ-FUNC-026)
- **분석:** Mixpanel + Amplitude + Vercel Analytics
- **로깅:** Vercel Logs / Log Drain → Slack

## External APIs (SRS §3.1)
- 쿠팡 파트너스 API / 식약처 공공 API / 카카오 Link JS SDK

## LLM (Phase 2 사전 셋업만)
- **Vercel AI SDK** + **Google Gemini API** — 인프라만 준비 (CON-11, CON-12)

## 금지 스택
- ❌ 별도 백엔드 (Spring, FastAPI 등) / 별도 SPA (Vite/CRA 단독) / Kafka / 네이티브 앱 / 자체 DB / 자체 Redis

## See also
- [001-project-overview.md](001-project-overview.md)
- [003-development-guidelines.md](003-development-guidelines.md)
