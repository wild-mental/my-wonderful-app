---
name: 306-coupang-mfds-kakao-integration-rules
description: 외부 API(쿠팡 파트너스 / 식약처 / 카카오 Link / Resend / Mixpanel) 어댑터 전략 패턴과 폴백 절차
---

# 306. External API Integration Rules

## 1. 어댑터 전략 패턴 (REQ-NF-024)

신규 채널 추가 시 기존 코드 변경 없이 `lib/adapters/` 에 어댑터만 추가한다.

```typescript
// lib/adapters/channel-adapter.ts
export interface ChannelAdapter {
  readonly channelId: string;
  fetchPrices(query: PriceQuery): Promise<Result<PriceSnapshot[], AdapterError>>;
  isHealthy(): Promise<boolean>;
}

export type AdapterError = {
  code: 'RATE_LIMITED' | 'TIMEOUT' | 'UPSTREAM_5XX' | 'INVALID_RESPONSE' | 'POLICY_BLOCKED';
  message: string;
  retryAfterMs?: number;
};
```

```
lib/adapters/
├── channel-adapter.ts                  # 인터페이스
├── coupang-adapter.ts                  # 쿠팡 파트너스
├── mfds-adapter.ts                     # 식약처 공공 API
├── kakao-link-adapter.ts               # 카카오 Link JS SDK
├── resend-adapter.ts                   # 이메일
└── mixpanel-adapter.ts                 # 분석
```

## 2. 쿠팡 파트너스 (EXT-SYS-01)

### 정책
- ❌ 무단 크롤링 금지 (CON-1, R1: Critical)
- ✅ 공식 Affiliate API 만 사용
- Rate Limit: 일 10,000건 (추정), 수수료 3%
- 타임아웃: 5초, 재시도 1회 (exponential backoff)

### 폴백 (SRS §3.1.1)

```typescript
export async function fetchCoupangPrices(query: PriceQuery): Promise<Result<EnrichedSnapshot, AdapterError>> {
  const live = await tryLive(query);
  if (live.ok) return ok({ source: 'live', snapshots: live.value, capturedAt: new Date() });

  // 폴백: 최근 PRICE_SNAPSHOT 캐시 반환 (최대 24h 이내)
  const cached = await prisma.priceSnapshot.findMany({
    where: { product: { /* match query */ } },
    orderBy: { captured_at: 'desc' },
  });
  if (cached.length === 0) return err(live.error);
  return ok({ source: 'cache_fallback', snapshots: cached, capturedAt: cached[0].captured_at });
}
```

응답 envelope 의 `meta.source` 가 `cache_fallback` 이면 UI 에서 "쿠팡 가격은 [YYYY-MM-DD HH:MM] 기준입니다" 인라인 표시 (REQ-FUNC-001 폴백).

## 3. 식약처 공공 API (EXT-SYS-02)

- 갱신 주기: 월 1회 → KV 캐시 TTL 30일
- 폴백: 사전 적재된 로컬 `INGREDIENT.mfds_status` / `mfds_claim` 사용 (별도 안내 불필요)
- 응답 필드: 기능성 인정 내용, 일일 섭취량, 주의사항
- 인증: API Key (`MFDS_API_KEY`)

### 사전 벌크 적재 (MVP 출시 전)
- 상위 300~500개 제품의 모든 성분에 대해 식약처 공전 데이터를 일괄 조회 후 DB 저장
- 매월 1일 Cron 으로 전량 동기화 갱신

## 4. 카카오 Link JS SDK (EXT-SYS-03)

### 정상 흐름

```typescript
// components/share/KakaoShareButton.tsx
'use client';
import { useKakao } from '@/lib/integrations/kakao';

export function KakaoShareButton({ shareUrl, title, description }: Props) {
  const { sendDefault, ready } = useKakao();
  const handleClick = async () => {
    try {
      await sendDefault({ title, description, link: { mobileWebUrl: shareUrl, webUrl: shareUrl } });
      trackEvent('kakao_share_send', { shareUrl });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('링크가 복사되었습니다');
      trackEvent('share_fallback', { shareUrl, reason: 'kakao_api_error' });
    }
  };
  return <Button onClick={handleClick} disabled={!ready}>카톡 공유</Button>;
}
```

### 폴백 (CP-2 우회 전략, SRS §1.2.5)

| 시점 | 전략 |
|---|---|
| 즉시 (D+0) | URL 복사 + 토스트 알림 (`navigator.clipboard.writeText`) |
| D+1~3 | 네이버 밴드 / SMS / Web Share API 추가 노출 |
| D+7~14 | 서버사이드 PNG 생성 + 다운로드 후 이미지 전송 |
| D+30 | 카카오 비즈니스 채널 전환 검토 |

폴백 전환 시간 ≤ 1초, 폴백 공유 성공률 ≥ 95% (REQ-FUNC-021).

## 5. Resend (이메일, REQ-FUNC-026)

```typescript
// lib/adapters/resend-adapter.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendReportResolvedEmail(to: string, reportId: string) {
  return resend.emails.send({
    from: 'noreply@super-calc.app',
    to,
    subject: '귀하의 제보로 데이터가 수정되었습니다',
    react: <ReportResolvedEmail reportId={reportId} />,
  });
}
```

- 발송 SLA: 오류 수정 완료 후 1시간 이내 (REQ-FUNC-026)
- 템플릿: `emails/` 디렉토리에 React Email 형식

## 6. Mixpanel / Amplitude (분석, Skill 308 와 연계)

- 토큰: `NEXT_PUBLIC_MIXPANEL_TOKEN` (클라이언트 노출 가능)
- 이벤트 명세는 [.agents/skills/308-mixpanel-analytics-rules/SKILL.md](../308-mixpanel-analytics-rules/SKILL.md) 참조

## 7. Rate Limit / Retry 표준

```typescript
import pRetry from 'p-retry';

const fetchWithRetry = (fn: () => Promise<T>) =>
  pRetry(fn, {
    retries: 1,                     // 외부 API 는 보수적으로 1회만 재시도
    minTimeout: 500,
    factor: 2,
    onFailedAttempt: (e) => notifySlack({ level: 'warn', message: `Retry: ${e.message}` }),
  });
```

타임아웃은 `AbortController` 로 명시 (기본 5초, 단가 비교는 8초 한계).

## 8. 비상 대응 (CP-1, CP-2)

- **CP-1 쿠팡 메타데이터 미제공 시:** 식약처 공공 API → 라벨 OCR → 수동 입력 우선순위 적용. `INGREDIENT.data_source` 필드에 출처 기록.
- **CP-2 카카오 정책 변경 시:** Cron `kakao-policy-monitor` 가 문서 변경 감지 시 즉시 Slack 알림 + 공유 실패율 > 5% 시 폴백 UI 자동 전환.

## 9. 금지 사항

- ❌ 쿠팡/네이버/아마존 무단 크롤링 (CON-1)
- ❌ 시크릿 키를 `NEXT_PUBLIC_*` 접두로 노출
- ❌ 재시도 무한 루프 (반드시 `retries: 1~2` 한정)
- ❌ 폴백 없이 외부 API 의존 (모든 경로 캐시 폴백 필수)

## See also
- [.agents/skills/304-route-handler-server-action-rules/SKILL.md](../304-route-handler-server-action-rules/SKILL.md)
- [.agents/skills/307-mfds-compliance-prohibited-expression-rules/SKILL.md](../307-mfds-compliance-prohibited-expression-rules/SKILL.md)
- [.agents/skills/308-mixpanel-analytics-rules/SKILL.md](../308-mixpanel-analytics-rules/SKILL.md)
