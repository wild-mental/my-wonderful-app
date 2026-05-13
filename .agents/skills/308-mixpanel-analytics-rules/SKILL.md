---
name: 308-mixpanel-analytics-rules
description: Mixpanel·Amplitude 이벤트 네이밍 / UTM 표준 / 보조 KPI 산출 정의 / H1~H5 가설 트래킹
---

# 308. Mixpanel + Amplitude Analytics Rules

## 1. 표준 이벤트 명세

이벤트명은 `snake_case`, 영문, 동사 형식.

| 이벤트 | 발생 시점 | 필수 프로퍼티 | 연결 REQ / KPI |
|---|---|---|---|
| `page_view` | 모든 페이지 로드 | `path`, `referrer`, `utm_*` | 활성 |
| `search` | 검색 실행 | `query`, `category` | 활성 |
| `calc_result_view` | 단가 비교 결과 표시 | `ingredient`, `result_count`, `source` (live/cache_fallback), `elapsed_ms` | 활성, 메인 펀널 |
| `badge_view` | 뱃지 영역 렌더 완료 | `product_id`, `badge_types[]`, `elapsed_ms` | 활성 |
| `affiliate_link_click` | 제휴 구매 링크 클릭 | `product_id`, `channel`, `daily_cost_krw`, `source` (direct/shared) | REQ-FUNC-033, 전환 CTR |
| `kakao_share_send` | 카카오 공유 완료 | `share_url`, `product_id` | REQ-FUNC-034, K-Factor |
| `share_fallback` | 폴백 공유 (URL 복사 등) | `share_url`, `reason`, `fallback_channel` | CP-2 모니터링 |
| `shared_landing_view` | 카카오 수신자 랜딩 | `share_token`, `utm_source=kakao` | 바이럴 |
| `error_report_submit` | 오류 제보 제출 | `product_id`, `field_name` | 신뢰 |
| `error_report_resolved` | 제보 수정 완료 | `report_id`, `elapsed_hours` | REQ-NF-012 |
| `product_request_submit` | 미등록 제품 등록 요청 | `ingredient_query` | REQ-FUNC-008 |

## 2. UTM 파라미터 표준

| 파라미터 | 값 | 사용처 |
|---|---|---|
| `utm_source` | `kakao` / `seo` / `direct` / `band` / `sms` | 유입 채널 |
| `utm_medium` | `share_card` / `organic` / `referral` | 매체 유형 |
| `utm_campaign` | 캠페인명 (예: `beta1`, `launch_seed`) | 캠페인 추적 |
| `utm_content` | 공유 카드 ID 또는 광고 변형 | A/B 테스트 |

카카오 공유 카드는 다음 URL 형태로 생성:

```
https://super-calc.app/share/{token}?utm_source=kakao&utm_medium=share_card&utm_content={token}
```

## 3. 클라이언트 SDK 셋업

```typescript
// lib/analytics/mixpanel.ts
import mixpanel from 'mixpanel-browser';

let initialized = false;
export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
    debug: process.env.NODE_ENV !== 'production',
    track_pageview: false,            // page_view 는 수동
    persistence: 'localStorage',
  });
  initialized = true;
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!initialized) initAnalytics();
  mixpanel.track(name, { ...props, $timestamp: Date.now() });
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!initialized) initAnalytics();
  mixpanel.identify(userId);
  if (traits) mixpanel.people.set(traits);
}
```

## 4. KPI 산출 정의 (PRD 보조 KPI)

| KPI | 산출식 | 측정 주기 |
|---|---|---|
| **북극성 (TTC)** | `affiliate_link_click.timestamp - first_page_view.timestamp` (per session) | 주간 (p50, p95) |
| **CTR (전환)** | `count(affiliate_link_click) / count(calc_result_view) × 100` | 주간 |
| **K-Factor (바이럴)** | `count(shared_landing_view) / count(kakao_share_send)` | 주간 |
| **D30 리텐션** | `count(session_start ∩ first_session_day + 30) / count(first_session_users)` | 월간 |
| **DB 오류율** | `count(error_report_resolved) / count(products) × 100` | 월간 |
| **펀널 완주율** | `count(affiliate_link_click) / count(search) × 100` | 주간 |

## 5. H1~H5 가설 트래킹

| 가설 | 핵심 이벤트 | 측정 KPI |
|---|---|---|
| **H1** Super-Calc 빠른가? | `calc_result_view.elapsed_ms` | p50/p95, 만족도 사후 설문 |
| **H2** Anti-BS 신뢰 상승? | `badge_view` + 사전/사후 설문 (n=70) | 결정 시간, 확신도 |
| **H3** 카카오 공유 전환? | `kakao_share_send` → `shared_landing_view` → `affiliate_link_click` | K-Factor ≥ 1.1 |
| **H4** 48h SLA 신뢰? | `error_report_resolved.elapsed_hours` | 완료율 ≥ 90% |
| **H5** 펀널 이탈? | `search` → `calc_result_view` → `badge_view` → `affiliate_link_click` | 완주율 ≥ 15% |

## 6. PII 보호 (REQ-NF-015)

- ❌ 이메일, 이름, 전화번호 등 PII 를 이벤트 프로퍼티에 포함 금지
- ✅ `distinct_id` 는 Supabase `user.id` (UUID) 또는 익명 세션 토큰
- B2B 데이터 제공 시 k-anonymity ≥ 5 (REQ-NF-016) — 5명 미만 그룹은 집계 결과 비공개

## 7. 데이터 거버넌스

- 이벤트 명세 변경 시 본 SKILL.md 부터 갱신 → 코드 반영
- 신규 이벤트는 PR 리뷰에서 데이터 팀과 합의 후 머지
- Mixpanel 프로젝트 별로 Dev / Prod 분리

## 8. 금지 사항

- ❌ 시크릿 토큰을 `NEXT_PUBLIC_*` 외 노출
- ❌ `mixpanel.track` 을 Server Action 에서 직접 호출 (Server 측은 `mixpanel` node SDK 별도)
- ❌ 이벤트 명세 없이 ad-hoc `trackEvent` 추가

## See also
- [.agents/skills/306-coupang-mfds-kakao-integration-rules/SKILL.md](../306-coupang-mfds-kakao-integration-rules/SKILL.md)
- [docs/00_PRD_v1_0.md](../../docs/00_PRD_v1_0.md) §1.3 KPI, §8.3 실험 가설
