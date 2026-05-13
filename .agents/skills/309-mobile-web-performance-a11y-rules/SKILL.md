---
name: 309-mobile-web-performance-a11y-rules
description: 모바일 웹 성능 SLA (LCP / p95) 달성 절차 / 이미지·prefetch 최적화 / 접근성 (WCAG AA)
---

# 309. Mobile Web Performance + A11y Rules

## 1. 성능 SLA (REQ-NF-001~005)

| 항목 | 기준 | 측정 |
|---|---|---|
| 단가 비교 API | p95 ≤ 3,500ms | Vercel Analytics, 응답 envelope `meta.elapsedMs` |
| 뱃지 렌더링 | p95 ≤ 1,000ms | Client `performance.measure` → Mixpanel |
| 카카오 공유 카드 생성 | p95 ≤ 1,500ms | OG 생성 핸들러 로그 |
| 출처 아코디언 펼침 | p95 ≤ 500ms | Client 측정 |
| 페이지 LCP | ≤ 2,500ms | Vercel Speed Insights |
| TBT | ≤ 200ms | Lighthouse CI |
| CLS | ≤ 0.1 | Vercel Speed Insights |

## 2. 이미지 최적화

```tsx
import Image from 'next/image';

<Image
  src={labelArchive.image_url}
  alt="제품 라벨"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, 800px"
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL={tinyBase64}
/>
```

- 라벨 이미지: Supabase Storage `label-archive` 버킷 → `next/image` 자동 최적화 + AVIF/WebP
- 외부 도메인 허용 (`next.config.ts`): `images.remotePatterns` 에 Supabase 도메인 등록
- 이미지 로드 ≤ 1초 (REQ-FUNC-023)

## 3. Prefetch / Lazy Loading

- `Link` 컴포넌트 prefetch 기본 활성
- 비교 결과의 상위 3개 제품 상세 페이지는 hover/scroll 시 prefetch
- 아코디언 / 모달 컴포넌트는 `next/dynamic` 으로 코드 스플리팅

```tsx
const SourceAccordion = dynamic(() => import('@/components/SourceAccordion'), {
  loading: () => <Skeleton className="h-24" />,
  ssr: false,                      // 클라이언트만 필요
});
```

## 4. 캐시 전략 (Skill 305 와 연계)

- 뱃지: Vercel KV TTL 24h + `unstable_cache` 태그 무효화
- 식약처 응답: KV TTL 30d (월 1회 갱신)
- 정적 페이지: `revalidate = 3600` (1시간 ISR)
- 동적 페이지 (비교 결과): `force-dynamic` + 응답 envelope 캐시 메타 표시

## 5. 네트워크 최소화

- Route Handler 응답은 필요한 필드만 (`select` 사용)
- N+1 쿼리 금지 → Prisma `include` / `select` 명시
- Server Component 에서 병렬 페칭: `Promise.all`

## 6. 접근성 (WCAG AA, ARIA)

### 시맨틱 HTML
- `<main>`, `<nav>`, `<button>`, `<article>` 정확히 사용
- 클릭 가능 영역은 `<div onClick>` 대신 `<button>` 또는 `<a>` 

### 키보드 네비
- 모든 인터랙티브 요소 Tab 접근 가능
- `:focus-visible` 스타일 (`focus-visible:ring-2`)
- 모달 / 드로어: Esc 닫기, 포커스 트랩
- 카카오 공유 버튼: Enter / Space 활성화

### 스크린리더
- 뱃지: `<span aria-label="식약처 인정 뱃지: 비타민 D 기능성 인정">`
- 가격: `<span aria-label="1일 단가 350원">350<span aria-hidden>원/일</span></span>`
- 미등재 원료: `<span role="status" aria-label="식약처 미등재 원료, 기능성 인정 정보 없음">`

### 명도 대비
- 본문 텍스트: 4.5:1 이상 (`text-slate-900` on `bg-white`)
- 큰 텍스트 (18pt+): 3:1 이상
- 회색 라벨 (미등재): 디자인은 회색이지만 명도 대비 만족하는 `text-slate-500` 이상

## 7. 모바일 인터랙션

- 터치 타겟: 최소 44×44px (iOS HIG) / 48×48dp (Material)
- 텍스트 입력: `inputMode` 적절히 (`numeric`, `email`)
- 가로 스크롤 방지 (`overflow-x-hidden` 루트)
- 풀투리프레시 등 OS 제스처 충돌 방지

## 8. 카카오 인앱 브라우저 호환

- Service Worker 의존 금지
- `localStorage` 보존 보장 불가 → 세션 데이터는 쿠키 또는 서버 세션
- `window.open(_blank)` 일부 차단 → `<a target="_blank" rel="noopener">` 사용
- 폴백 UI 로 동작 검증 (Skill 306)

## 9. Lighthouse CI 게이트

```bash
pnpm lighthouse:ci         # CI 단계에서 실행
```

설정 (`.lighthouserc.json`):

```jsonc
{
  "ci": {
    "collect": { "url": ["http://localhost:3000", "http://localhost:3000/compare?ingredient=vitaminD"] },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    }
  }
}
```

## 10. 금지 사항

- ❌ `<img>` 직접 사용 (`next/image` 필수, 외부 도메인은 remotePatterns 등록)
- ❌ 클라이언트 측 무한 스크롤 무제한 로드 (페이지네이션 또는 가상화)
- ❌ Heavy chart 라이브러리 (Recharts/D3 등) MVP 단계 도입
- ❌ 동기 폰트 로드 (Next.js `next/font` 사용)

## See also
- [.agents/skills/300-nextjs-app-router-rules/SKILL.md](../300-nextjs-app-router-rules/SKILL.md)
- [.agents/skills/303-tailwind-shadcn-ui-rules/SKILL.md](../303-tailwind-shadcn-ui-rules/SKILL.md)
- [.agents/skills/305-vercel-deploy-cron-kv-rules/SKILL.md](../305-vercel-deploy-cron-kv-rules/SKILL.md)
