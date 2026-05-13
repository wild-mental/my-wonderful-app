---
name: 304-route-handler-server-action-rules
description: Route Handler / Server Action 작성 규약 / Zod 검증 / Result 응답 envelope / SLA 명시
---

# 304. Route Handler & Server Action Rules

## 1. 분기 기준

| 케이스 | 선택 |
|---|---|
| GET (조회) + 외부 클라이언트 호환 필요 (JS SDK, 카카오 웹뷰 직접 호출 등) | **Route Handler** (`app/api/v1/.../route.ts`) |
| POST/PATCH/DELETE (변경) + 같은 Next.js 앱 내부에서만 호출 | **Server Action** (`app/actions/...ts`) |
| Vercel Cron 트리거 | **Route Handler** (`app/cron/.../route.ts` + `vercel.json`) |

## 2. 표준 응답 Envelope

모든 Route Handler 와 Server Action 은 동일 envelope 사용.

```typescript
// lib/api/envelope.ts
export type ApiResponse<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string; details?: unknown } };

export const ok = <T>(data: T, meta?: Record<string, unknown>) =>
  Response.json({ success: true, data, meta });

export const fail = (code: string, message: string, status = 400, details?: unknown) =>
  Response.json({ success: false, error: { code, message, details } }, { status });
```

## 3. Route Handler 패턴

```typescript
// app/api/v1/compare/route.ts
import { z } from 'zod';
import { ok, fail } from '@/lib/api/envelope';
import { compareIngredient } from '@/lib/super-calc';

export const dynamic = 'force-dynamic';     // 매 요청 신선한 가격

const ParamsSchema = z.object({
  ingredient: z.string().min(1).max(50),
  dosage: z.string().optional(),
});

export async function GET(req: Request) {
  const start = performance.now();

  const url = new URL(req.url);
  const parsed = ParamsSchema.safeParse({
    ingredient: url.searchParams.get('ingredient'),
    dosage: url.searchParams.get('dosage'),
  });
  if (!parsed.success) return fail('VALIDATION_ERROR', 'Invalid query params', 400, parsed.error.flatten());

  const result = await compareIngredient(parsed.data);
  if (!result.ok) return fail(result.error.code, result.error.message, 502);

  const elapsedMs = performance.now() - start;
  return ok(result.value.snapshots, {
    elapsedMs,
    source: result.value.source,             // "live" | "cache_fallback"
    capturedAt: result.value.capturedAt,
  });
}
```

### 적용 SLA
- `GET /api/v1/compare` — **p95 ≤ 3,500ms** (REQ-NF-001), 실패율 < 1% (REQ-FUNC-006)
- `GET /api/v1/badges` — **p95 ≤ 1,000ms** (REQ-NF-002)
- `GET /api/v1/search` — **p95 ≤ 1,000ms**

## 4. Server Action 패턴

```typescript
// app/actions/error-report.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { detectSpam } from '@/lib/reports/spam-filter';

const ReportSchema = z.object({
  productId: z.string(),
  fieldName: z.string().min(1).max(50),
  reportedValue: z.string().min(1).max(500),
  correctValue: z.string().min(1).max(500),
  evidenceUrl: z.string().url().optional(),
});

export async function submitErrorReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } };

  const parsed = ReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false as const, error: { code: 'VALIDATION', message: '입력값을 확인하세요', details: parsed.error.flatten() } };

  const spam = await detectSpam(user.id, parsed.data.productId);
  if (spam.blocked) return { success: false as const, error: { code: 'SPAM_BLOCKED', message: spam.reason } };

  const report = await prisma.errorReport.create({
    data: {
      reporter_id: user.id,
      product_id: parsed.data.productId,
      field_name: parsed.data.fieldName,
      reported_value: parsed.data.reportedValue,
      correct_value: parsed.data.correctValue,
      evidence_url: parsed.data.evidenceUrl,
    },
  });

  revalidatePath(`/product/${parsed.data.productId}`);
  return { success: true as const, data: { reportId: report.report_id, slaHours: 48 } };
}
```

### 적용 SLA
- 오류 제보 접수 응답 ≤ 3초 (REQ-FUNC-024)
- 스팸 필터: 동일 제품 24h 5건 이상 차단, 정확도 ≥ 95% (REQ-FUNC-027)

## 5. 에러 코드 표준

| 코드 | HTTP | 의미 |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod 검증 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 부족 (RLS 위반) |
| `NOT_FOUND` | 404 | 리소스 미존재 |
| `SPAM_BLOCKED` | 429 | 스팸 필터 차단 |
| `RATE_LIMITED` | 429 | 외부 API Rate Limit |
| `UPSTREAM_ERROR` | 502 | 외부 API 장애 (캐시 폴백 적용) |
| `INTERNAL_ERROR` | 500 | 예기치 못한 서버 오류 |

## 6. 로깅 / 트래킹

- 모든 Route Handler / Server Action 진입 시점에 `elapsedMs` 측정
- p95 > 3s 또는 5xx 발생 시 `console.error` (Vercel Log Drain → Slack) (REQ-NF-021)
- 비즈니스 이벤트는 Mixpanel 로 별도 트래킹 (Skill 308)

## 7. 금지 사항

- ❌ Route Handler 에서 `next/headers` 의 `redirect()` 사용 (Server Action 에서만)
- ❌ Server Action 에서 시크릿 키를 클라이언트에 반환
- ❌ Zod 없이 `as` 캐스팅으로 입력 처리
- ❌ DB 직접 접근 후 결과를 그대로 반환 (DTO 매핑 필수)

## See also
- [.agents/skills/301-typescript-strict-rules/SKILL.md](../301-typescript-strict-rules/SKILL.md)
- [.agents/skills/306-coupang-mfds-kakao-integration-rules/SKILL.md](../306-coupang-mfds-kakao-integration-rules/SKILL.md)
