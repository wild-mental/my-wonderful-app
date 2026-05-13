---
name: 300-nextjs-app-router-rules
description: Next.js 14+ App Router 구조 / Server·Client Component 구분 / 캐시·재검증 / 라우팅 규약
---

# 300. Next.js App Router Rules

## 1. 디렉토리 구조

```
app/
├── (public)/                        # 공개 라우트 그룹 (인증 불요)
│   ├── page.tsx                     # 메인 검색 화면
│   ├── product/[id]/page.tsx        # 제품 상세
│   ├── compare/page.tsx             # 비교 결과
│   └── share/[token]/page.tsx       # 카카오 공유 랜딩 (앱 설치 불요)
├── (auth)/                          # 인증 필요 라우트 그룹
│   ├── history/page.tsx             # 비교 이력 (REQ-FUNC-035)
│   └── reports/page.tsx             # 내 제보 현황
├── (admin)/                         # 관리자 백오피스
│   └── product-requests/page.tsx    # 미등록 제품 요청 (REQ-FUNC-032)
├── api/
│   └── v1/
│       ├── compare/route.ts         # GET /api/v1/compare (REQ-FUNC-001~006)
│       ├── badges/route.ts          # GET /api/v1/badges (REQ-FUNC-011)
│       └── search/route.ts          # GET /api/v1/search (REQ-FUNC-030)
├── actions/                         # Server Actions (POST 계열)
│   ├── error-report.ts              # 오류 제보 (REQ-FUNC-024)
│   ├── product-request.ts           # 제품 등록 요청 (REQ-FUNC-008)
│   └── analytics.ts                 # 서버 측 이벤트 트래킹
├── cron/
│   └── sync-prices/route.ts         # Vercel Cron (일 1회 가격 동기화)
├── layout.tsx                       # 루트 레이아웃 (Mixpanel, Vercel Analytics 주입)
├── error.tsx                        # 전역 에러 바운더리
├── not-found.tsx                    # 404
└── loading.tsx                      # 로딩 스켈레톤
```

## 2. Server vs Client Components

- **기본은 Server Component.** Client Component 는 다음 경우만 사용:
  - `useState` / `useEffect` / Browser API 필요
  - `onClick` 등 이벤트 핸들러 필요
  - 카카오 JS SDK 호출 (`window.Kakao`)
- Client Component 는 파일 최상단에 `"use client"` 명시.
- **데이터 페칭은 Server Component 에서.** Client 에서는 `fetch` 직접 호출 금지 — Server Action 또는 Route Handler 경유.

## 3. 캐시 / 재검증

```typescript
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// 뱃지 캐시 24h (REQ-FUNC-011 캐시 TTL)
export const getBadges = unstable_cache(
  async (productId: string) => { /* ... */ },
  ['badges'],
  { revalidate: 60 * 60 * 24, tags: [`badges:${productId}`] }
);

// 데이터 수정 시 태그 무효화
revalidateTag(`badges:${productId}`);
```

- 정적 페이지: `export const revalidate = 3600` (ISR)
- 동적 페이지: `export const dynamic = 'force-dynamic'`
- 가격 데이터는 Vercel Cron 으로 일 1회 갱신 → `PRICE_SNAPSHOT` 테이블 직접 조회

## 4. 라우팅 규약

- 동적 세그먼트: `[id]` (단일), `[...slug]` (catch-all)
- 라우트 그룹: `(public)`, `(auth)`, `(admin)` — URL 에 노출되지 않음
- Parallel Routes (`@modal/`) — 제품 상세 모달 등에 활용
- `Link` 컴포넌트 사용 (`<a>` 직접 금지) — prefetch 자동

## 5. SEO & 메타데이터

- 각 페이지 `export const metadata` 또는 `generateMetadata` 정의
- Open Graph 메타태그는 카카오 공유 카드 (REQ-FUNC-017) 의 핵심
- `app/(public)/share/[token]/page.tsx` 는 `generateMetadata` 로 OG 동적 생성

## 6. 금지 사항

- ❌ `pages/` 디렉토리 사용 (Legacy Pages Router 금지)
- ❌ `getServerSideProps` / `getStaticProps` (App Router 에 존재 안 함)
- ❌ Client Component 에서 시크릿 환경변수 참조
- ❌ `useEffect` 안에서 데이터 페칭 (Server Component 에서 직접 페칭)

## See also
- [.agents/skills/304-route-handler-server-action-rules/SKILL.md](../304-route-handler-server-action-rules/SKILL.md)
- [.agents/skills/305-vercel-deploy-cron-kv-rules/SKILL.md](../305-vercel-deploy-cron-kv-rules/SKILL.md)
