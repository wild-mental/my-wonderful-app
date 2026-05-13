---
description: Closed Beta 1·2 → Public Launch 출시 점검 체크리스트 (SRS §6.4.1)
---

# Release Readiness Checklist

> SRS §6.4.1 의 단계별 롤아웃 (Alpha → Closed Beta 1/2 → Public Launch) 직전에 본 워크플로우를 실행한다. 각 항목은 측정 가능한 게이트이며, 미통과 시 출시 지연.

## 0. 사전 준비

```bash
# 현재 환경 점검
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate status
pnpm typecheck
pnpm lint
pnpm lint:mfds
pnpm test
pnpm test:e2e
pnpm lighthouse:ci
```

## 1. 기능 게이트 (Must)

- [ ] **F1 Super-Calc** — 비타민D 1000IU 검색 시 1일 단가 비교 결과 5초 이내 표시 (REQ-NF-001)
- [ ] **F1 미등록 성분** — "NMN" 검색 시 미등록 안내 + 등록 요청 CTA 300ms 이내 (REQ-FUNC-008)
- [ ] **F1 폴백** — 쿠팡 API 비활성 환경에서 캐시 데이터 + 인라인 안내 정상 동작 (SRS §3.1.1)
- [ ] **F2 뱃지** — 등록된 50개 제품에 식약처 공전 1:1 매칭 뱃지 노출 (REQ-FUNC-011)
- [ ] **F2 광고 0건** — 제품 상세 페이지에 광고 배너/리뷰/별점/체험단 링크 노출 0건 (REQ-FUNC-010)
- [ ] **F2 일상어 번역** — 등록 기능성 원료 ≥ 95% 번역 노출 (REQ-FUNC-013)
- [ ] **F2 미등재 회색 라벨** — 식약처 미등재 성분 회색 라벨 정상 노출 (REQ-FUNC-014)
- [ ] **F3 카카오 공유** — Android Chrome + iOS Safari + 카카오 인앱 브라우저 3종에서 공유 → 수신 → 랜딩 정상 동작 (REQ-FUNC-016~020)
- [ ] **F3 카카오 폴백** — JS SDK 비활성 환경에서 URL 복사 폴백 1초 이내 (REQ-FUNC-021, CP-2)
- [ ] **F4 오류 제보** — 제보 → 접수 → 검증 → 수정 → 알림 → 리워드 전 흐름 통과 (REQ-FUNC-022~028)
- [ ] **F4 SLA 모니터** — 48h 임박 제보 Slack 알림 정상 (REQ-FUNC-025, REQ-NF-012)
- [ ] **F4 스팸 차단** — 동일 제품 24h 5건 이상 제보 차단 정확도 95%↑ (REQ-FUNC-027)

## 2. 비기능 게이트 (Must)

### 성능 (REQ-NF-001~006)
- [ ] 단가 비교 API p95 ≤ 3,500ms (k6 / Vercel Analytics 측정)
- [ ] 뱃지 렌더링 p95 ≤ 1,000ms
- [ ] 카카오 공유 카드 생성 p95 ≤ 1,500ms
- [ ] 출처 아코디언 p95 ≤ 500ms
- [ ] 모바일 페이지 LCP ≤ 2,500ms (Vercel Speed Insights)
- [ ] Lighthouse Mobile Performance ≥ 85, Accessibility ≥ 95

### 보안 (REQ-NF-014~018)
- [ ] SSL Labs 등급 A 이상 (수동 점검)
- [ ] `.env*` Git 미추적 확인 (`git ls-files .env*` 결과 비어 있음)
- [ ] Supabase 모든 테이블 RLS 활성화 (`select * from pg_tables where ...`)
- [ ] `NEXT_PUBLIC_*` 키에 시크릿 미포함 (수동 grep)
- [ ] `security-auditor` (Gemini) 보고서 Critical/High 0건

### 컴플라이언스
- [ ] `pnpm lint:mfds` 0 violations
- [ ] `compliance-checker` (Gemini) 보고서 Critical 0건
- [ ] 뱃지 텍스트 수동 spot-check 10건 — 식약처 공전 원문과 일치

### 비용 (REQ-NF-019, 020)
- [ ] Vercel + Supabase 월 예상 비용 ≤ $50
- [ ] `#infra-cost` Slack 알림 임계값 8만 원 설정 확인

### 모니터링 (REQ-NF-021~023)
- [ ] Vercel Log Drain → Slack 동작 검증 (테스트 에러 발생)
- [ ] Mixpanel 이벤트 6종 이상 (`page_view`, `search`, `calc_result_view`, `affiliate_link_click`, `kakao_share_send`, `error_report_submit`) 정상 수집
- [ ] PagerDuty Tier-1 알림 채널 활성

## 3. 데이터 게이트

- [ ] 상위 300~500개 제품 사전 적재 완료 (`SELECT count(*) FROM products` 확인)
- [ ] `INGREDIENT.mfds_status` 분류 정확도 ≥ 99% (수동 샘플 50건 검수)
- [ ] `PRICE_SNAPSHOT` 최근 24h 이내 데이터 모든 제품에 존재
- [ ] `LABEL_ARCHIVE` 등록 (커버리지 ≥ 80%)

## 4. 단계별 조건

### Alpha (n=10, 팀 내부)
- 위 1번 모든 항목 통과
- E2E 테스트 통과
- 알려진 P0 / P1 버그 0건

### Closed Beta 1 (n=30, C1 타겟)
- Alpha 통과 + H1 사전 측정 도구 준비 (Mixpanel 코호트, 사후 설문 폼)
- TTC p50/p95 측정 가능

### Closed Beta 2 (n=20, C2 타겟)
- Beta 1 결과 분석 + H2 사전/사후 설문 준비 (n ≥ 70 power 분석 완료)
- 결정 시간·확신도 측정 가능

### Public Launch
- 위 1·2·3 모든 항목 통과
- H1~H5 모든 측정 인프라 가동 (Skill 308 `h1-h5-experiment-instrumentation` 워크플로우 완료)
- SEO 키워드 50개 이상 콘텐츠 시딩

## 5. 보고

각 단계 완료 시 다음 산출물 제출:
- 본 체크리스트 결과 (Markdown)
- Lighthouse / 성능 측정 리포트
- 보안 / 컴플라이언스 감사 리포트 (`security-auditor`, `compliance-checker`)
- 알려진 이슈 목록 (GitHub `release/<version>` 마일스톤)

## 참조

- [docs/05_SRS_v1.md](../../docs/05_SRS_v1.md) §6.4 Validation Plan
- [docs/00_PRD_v1_0.md](../../docs/00_PRD_v1_0.md) §8 실험/롤아웃/측정
- [.agents/workflows/h1-h5-experiment-instrumentation.md](h1-h5-experiment-instrumentation.md)
