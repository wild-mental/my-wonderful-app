---
name: 101-build-and-env-setup
description: Next.js + Vercel + Supabase + Prisma 스택의 빌드 절차, 로컬·배포 환경변수 점검 및 문서화 가이드
---

# 101. Build & Environment Setup (Next.js / Vercel / Supabase / Prisma)

## 1. 사전 도구 확인

| 도구 | 최소 버전 | 확인 명령 |
|---|---|---|
| Node.js | 20.x LTS | `node -v` |
| pnpm | 9.x | `pnpm -v` (npm/yarn 대신 pnpm 권장) |
| Vercel CLI | 최신 | `vercel --version` |
| Supabase CLI | 최신 | `supabase --version` |
| Git | 2.40+ | `git --version` |

## 2. 디렉토리 구조 확인

```bash
tree -L 4 -a -I 'node_modules|.git|__pycache__|.DS_Store|.next|.vercel|coverage'
```

## 3. 의존성 설치 & 빌드 점검

```bash
pnpm install                      # 의존성 설치
pnpm prisma generate              # Prisma Client 생성
pnpm prisma migrate dev           # 로컬 마이그레이션 (SQLite)
pnpm dev                          # 로컬 서버 (http://localhost:3000)
pnpm build                        # 프로덕션 빌드 (Next.js)
pnpm lint                         # ESLint + 식약처 금지 표현 lint
pnpm typecheck                    # tsc --noEmit
pnpm test                         # Vitest 단위 테스트
pnpm test:e2e                     # Playwright E2E
```

## 4. 개발 환경변수 (`.env.local`)

`.env.local` 은 절대 커밋 금지. `.env.example` 만 커밋한다. 필요한 키 목록:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Prisma)
DATABASE_URL=                          # 로컬 SQLite or Supabase Pooler
DIRECT_URL=                            # 마이그레이션용 직접 연결

# External APIs
COUPANG_ACCESS_KEY=
COUPANG_SECRET_KEY=
MFDS_API_KEY=
NEXT_PUBLIC_KAKAO_JS_KEY=

# Email
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_MIXPANEL_TOKEN=
NEXT_PUBLIC_AMPLITUDE_API_KEY=

# Vercel KV (캐시)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# LLM (Phase 2 사전 셋업)
GEMINI_API_KEY=

# Observability
SLACK_WEBHOOK_URL=                     # Log Drain 알림
```

체크리스트:
- [ ] `.gitignore` 에 `.env*` 패턴 포함 확인
- [ ] `.env.example` 의 키 목록과 `.env.local` 일치 확인
- [ ] `NEXT_PUBLIC_*` 접두는 클라이언트 노출 키만 사용 (시크릿 키 절대 금지)

## 5. 배포 환경변수 (Vercel)

- 모든 환경변수는 **Vercel Dashboard → Project Settings → Environment Variables** 에 등록한다.
- `vercel env pull .env.local` 명령으로 로컬 동기화.
- 시크릿(서비스 롤 키, API 시크릿 등)은 Production / Preview / Development 별로 분리.
- DB 마이그레이션용 `DIRECT_URL` 은 빌드 시점에만 필요 → Build 환경에만 등록.

## 6. Supabase 초기 셋업

```bash
supabase init                          # 프로젝트 초기화
supabase link --project-ref <REF>      # 원격 프로젝트 연결
supabase db pull                       # 원격 스키마 → 로컬 동기화
supabase functions deploy              # Edge Function 배포 (필요 시)
```

체크리스트:
- [ ] Auth Email Templates 한국어로 커스터마이즈
- [ ] 모든 테이블 RLS 활성화 + 정책 설정 (`enable row level security`)
- [ ] Storage 버킷 `label-archive` 생성, 공개 읽기 + 인증 쓰기 정책

## 7. Vercel 초기 셋업

```bash
vercel link                            # 로컬 ↔ Vercel 프로젝트 연결
vercel env pull                        # 환경변수 동기화
vercel --prod                          # 수동 프로덕션 배포 (보통 Git Push 로 충분)
```

- `vercel.json` 에 Cron 정의: 일 1회 가격 동기화, 주 1회 카카오 정책 감지
- Log Drain → Slack Webhook 연결 (REQ-NF-021)
- Vercel Analytics + Speed Insights 활성화 (REQ-NF-022)

## 8. 산출물 (보고 형식)

작업 완료 후 다음을 보고한다:
- 누락된 환경변수 목록
- `.env.example` 갱신 필요 사항
- README.md "Getting Started" 섹션 동기화 여부
- 빌드 / 테스트 / 타입체크 통과 여부
