---
name: 303-tailwind-shadcn-ui-rules
description: Tailwind CSS + shadcn/ui 사용 규약 / 카카오 내장 브라우저 호환 / 접근성(WCAG AA)
---

# 303. Tailwind + shadcn/ui Rules

## 1. shadcn/ui 컴포넌트 추가

```bash
# 초기화 (1회)
pnpm dlx shadcn@latest init

# 컴포넌트 추가
pnpm dlx shadcn@latest add button card dialog drawer accordion toast badge skeleton
```

- 컴포넌트는 `components/ui/` 하위에 직접 생성됨 (라이브러리 의존 X, 코드 소유)
- 수정 자유, but 업스트림 변경 추적은 수동
- Radix UI 프리미티브 기반 — a11y 기본 제공

## 2. Tailwind CSS 컨벤션

- **클래스 정렬:** Prettier `prettier-plugin-tailwindcss` 적용 (자동 정렬)
- **`@apply` 최소화:** 컴포넌트화로 해결, 글로벌 CSS 는 `app/globals.css` 의 디자인 토큰만
- **조건부 클래스:** `clsx` + `tailwind-merge` (`cn()` 유틸) 사용

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## 3. 디자인 토큰 (`tailwind.config.ts`)

- Primary: 신뢰감 있는 블루 계열 (예: `#2563EB`)
- Badge 색상:
  - APPROVED: green (`emerald-600`)
  - CAUTION: amber (`amber-500`)
  - NOT_APPROVED: red (`rose-600`)
  - UNREGISTERED: gray (`slate-400`) — 미등재 원료 회색 라벨 (REQ-FUNC-014)
- Typography: 본문 16px 이상 (모바일 가독성), 가격 숫자 24px 이상

## 4. 모바일 웹 퍼스트 + 카카오 내장 브라우저 호환

- **뷰포트 메타:** `width=device-width, initial-scale=1, maximum-scale=5`
- **Safe Area:** `env(safe-area-inset-*)` 사용 (iOS 노치)
- **카카오 인앱 브라우저 제약:**
  - ❌ Service Worker 동작 불안정 → PWA 기능 의존 금지
  - ❌ `window.open(_blank)` 일부 차단 → `<a target="_blank">` 사용
  - ❌ `localStorage` 일부 세션 단위 → 인증·이력은 서버 세션 또는 쿠키 우선
  - ✅ 기본 HTML/CSS/JS 동작
- 테스트 디바이스: iPhone Safari + Android Chrome + 카카오톡 인앱 브라우저 3종 필수

## 5. 접근성 (WCAG AA)

- **시맨틱 HTML:** `<button>`, `<nav>`, `<main>`, `<article>` 정확히 사용
- **포커스:** `focus-visible:ring-2 focus-visible:ring-primary` 모든 인터랙티브 요소
- **명도 대비:** 본문 4.5:1, 큰 텍스트 3:1 이상
- **ARIA:** Radix UI 가 기본 처리. 커스텀 컴포넌트는 `aria-label`, `aria-describedby` 명시
- **키보드 네비:** Tab 순서 자연스럽게, Esc 로 모달·드로어 닫기
- **스크린리더:** 가격 숫자에 `aria-label="1일 단가 100원"` 처럼 단위 명시

## 6. 토스트 / 인라인 안내

- Toast: shadcn `<Toaster />` 전역 마운트 (`app/layout.tsx`)
- "URL 복사" 폴백 토스트 (REQ-FUNC-021)
- "쿠팡 가격은 [HH:MM] 기준입니다" 인라인 안내 (외부 API 폴백 시)

## 7. 금지 패턴

- ❌ Inline `style` 속성 (Tailwind 클래스로 대체)
- ❌ CSS-in-JS (Emotion, styled-components 등)
- ❌ `!important` 남발 (디자인 토큰 재정의로 해결)
- ❌ 별도 CSS 파일 생성 (`globals.css` 외)

## See also
- [.agents/skills/309-mobile-web-performance-a11y-rules/SKILL.md](../309-mobile-web-performance-a11y-rules/SKILL.md)
