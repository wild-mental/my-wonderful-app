---
name: 305-vercel-deploy-cron-kv-rules
description: Vercel 배포 / Cron Jobs / KV 캐시 / Log Drain / Edge Functions 운영 규약
---

# 305. Vercel Deploy + Cron + KV Rules

## 1. 배포 흐름 (CON-13)

- **자동 배포:** `main` push → Production / 그 외 브랜치 push → Preview
- **환경:** Production / Preview / Development 3종, 각각 별도 환경변수
- **빌드 명령:** `pnpm install && pnpm prisma generate && pnpm prisma migrate deploy && pnpm build`
- **Node.js 버전:** Vercel `package.json` 의 `engines.node` 로 고정 (`>=20`)

## 2. `vercel.json` (Cron + 헤더 등)

```jsonc
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/sync-prices",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/kakao-policy-monitor",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/cron/sla-monitor",
      "schedule": "*/30 * * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Cron 정의
- `sync-prices` (일 1회 03:00 KST) — 쿠팡 파트너스 가격 동기화, `PRICE_SNAPSHOT` 갱신
- `kakao-policy-monitor` (주 1회 월요일 18:00 KST) — 카카오 개발자 문서 변경 감지 (SRS §1.2.5 CP-2)
- `sla-monitor` (30분 마다) — 48h 초과 임박 제보 알림 (REQ-FUNC-025)

### Cron 핸들러 보안

```typescript
// app/api/cron/sync-prices/route.ts
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... sync logic
}
```

Vercel Cron 호출 시 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더가 붙는다. `CRON_SECRET` 환경변수 등록 필수.

## 3. Vercel KV (Redis 호환)

```typescript
// lib/cache/kv.ts
import { kv } from '@vercel/kv';

export async function getCachedBadges(productId: string) {
  return kv.get<BadgeDTO[]>(`badges:${productId}`);
}

export async function setCachedBadges(productId: string, badges: BadgeDTO[]) {
  // TTL 24h (REQ-FUNC-011)
  await kv.set(`badges:${productId}`, badges, { ex: 60 * 60 * 24 });
}
```

### 캐시 키 컨벤션
- `badges:<product_id>` — 뱃지 (TTL 24h)
- `mfds:<ingredient_name>` — 식약처 API 응답 (TTL 30d, 월 1회 갱신)
- `price:<product_id>:latest` — 최근 가격 스냅샷 (TTL 24h, Cron 으로 갱신)
- `share:<token>` — 카카오 공유 카드 메타데이터 (TTL 7d)

### 캐시 무효화
- 오류 제보 수정 완료 시 → `kv.del('badges:<id>')` + `revalidateTag(...)`
- 가격 동기화 Cron 완료 시 → 해당 제품 키만 갱신 (전체 flush 금지)

## 4. Log Drain → Slack (REQ-NF-021)

- Vercel Dashboard → Project Settings → Log Drains → JSON drain 생성
- 대상: Slack Incoming Webhook 또는 Logtail / Datadog
- 필터 조건: `level=error` OR `status>=500` OR `latency_ms>3000`
- 알림 채널: `#platform-errors` (Tier 1), `#infra-cost` (비용)

대안 (애플리케이션 레벨):

```typescript
// lib/observability/slack.ts
export async function notifySlack(payload: { level: 'error'|'warn'; message: string; context?: unknown }) {
  if (process.env.NODE_ENV !== 'production') return;
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify({ text: `[${payload.level}] ${payload.message}\n${JSON.stringify(payload.context)}` }),
  });
}
```

## 5. Edge vs Node Runtime

- **기본은 Node Runtime.** Prisma 는 Edge 미지원.
- Edge 사용 케이스: 인증 미들웨어 (`middleware.ts`), 정적 OG 이미지 생성, 카카오 웹뷰 검증 라우트
- 명시: `export const runtime = 'edge'`

## 6. 비용 모니터링 (REQ-NF-020)

- Vercel Usage 페이지를 주 1회 점검
- 월 인프라 비용 ≤ $50 목표 (REQ-NF-019)
- 8만원 초과 임박 시 `#infra-cost` Slack 알림 (PRD 5-3)

## 7. 금지 사항

- ❌ Cron 핸들러를 인증 없이 노출
- ❌ KV 에 사용자 PII 저장
- ❌ Production 환경에서 마이그레이션 자동 적용 없이 수동 배포
- ❌ `vercel --prod --force` (사용자 명시 요청 시에만)

## See also
- [.agents/skills/101-build-and-env-setup/SKILL.md](../101-build-and-env-setup/SKILL.md)
- [.agents/skills/306-coupang-mfds-kakao-integration-rules/SKILL.md](../306-coupang-mfds-kakao-integration-rules/SKILL.md)
