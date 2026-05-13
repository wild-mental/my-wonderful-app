---
description: PRD §8-3 / SRS §6.4.2 의 H1~H5 가설별 Mixpanel 이벤트·UTM·코호트·설문 셋업 절차
---

# H1~H5 Experiment Instrumentation Workflow

> PRD §8-3 와 SRS §6.4.2 에 정의된 5개 가설을 측정 가능한 인프라로 구축한다. 본 워크플로우는 Public Launch 이전에 모든 항목이 가동 상태여야 출시 게이트를 통과한다.

## H1: C1 은 Super-Calc 이 수동 계산보다 빠르고 정확하다고 느낀다

### 측정 KPI
- 과제 완료 시간 (수동 엑셀 vs 본 플랫폼)
- 최종가 오차율 (%)
- 만족도 (5점 척도)

### 인프라 셋업
- [ ] Mixpanel 이벤트 `calc_result_view` 가 `elapsed_ms` 프로퍼티 포함 (Skill 308)
- [ ] 사후 설문 폼 (Tally / Google Forms) URL 발급
- [ ] Closed Beta 1 (n=30) 모집 — C1 페르소나 (iHerb 파워유저, 건기식 커뮤니티)
- [ ] 과제 시나리오 작성: "비타민D 1000IU, 3채널 비교 후 최저가 선택"
- [ ] 컨트롤 그룹 (수동 엑셀) 측정 도구: 사전 안내된 스프레드시트 + 시간 측정 스톱워치

### 성공 기준
- 시간 90% 단축 (60분 → 6분 이하)
- 최종가 오차율 ≤ 3%
- 만족도 ≥ 4.0/5

### 분석
- `calc_result_view.elapsed_ms` p50 / p95 추적 (Mixpanel)
- 사후 설문 결과 1주일 내 분석 리포트

---

## H2: C2/A2 는 Anti-BS Dashboard 로 더 높은 신뢰감을 느낀다

### 측정 KPI
- 결정 소요 시간 (분)
- 결정 확신도 (5점)
- "광고 걱정 없음" 동의율 (%)

### 인프라 셋업
- [ ] Within-subject 사전/사후 설문 (n=70, power ≥ 0.80, α=0.05, d=0.5) — 통계학자 또는 R/G\*Power 로 사전 검증
- [ ] Closed Beta 2 (n=20) + Public Launch 추가 모집으로 n=70 도달
- [ ] 사전 설문: "기존 정보 탐색 신뢰도" 5점 Likert (Baseline 확정)
- [ ] 사후 설문: 동일 항목 + 결정 시간 자기 보고 + "광고 걱정 없음" 동의 여부
- [ ] Mixpanel 펀널: `search` → `badge_view` → (`affiliate_link_click` 또는 `kakao_share_send`)
- [ ] Amplitude Cohort: 사전/사후 동일 사용자 매칭

### 통계 검증
- Paired Wilcoxon signed-rank test (정규성 가정 회피)
- 확신도 차이 평균 ≥ +1.0점 (사전 대비 사후)

### 성공 기준
- 결정 시간 p50 ≤ 30분
- 확신도 평균 ≥ 4.0/5 + 사전 대비 +1.0점 이상 상승
- 동의율 ≥ 70%

---

## H3: 카카오톡 공유 수신자의 일정 비율이 구매 링크를 클릭한다

### 측정 KPI
- 수신자 랜딩률 (%)
- 구매 링크 클릭률 (%)
- K-Factor

### 인프라 셋업
- [ ] UTM 표준 적용: `?utm_source=kakao&utm_medium=share_card&utm_content={token}` (Skill 308)
- [ ] 공유 카드 토큰 발급 시점 → `kakao_share_send` 이벤트 (with `share_url`, `product_id`)
- [ ] 수신자 랜딩 → `shared_landing_view` 이벤트 (UTM 자동 캡처)
- [ ] 구매 클릭 → `affiliate_link_click` with `source=shared`
- [ ] A/B 테스트 분기: (A) OG 이미지 포함 vs (B) 텍스트 전용 → `mixpanel.alias` 로 변형 그룹 식별
- [ ] 목표 표본: n=200 공유 건

### 성공 기준
- 랜딩률 ≥ 50% (`shared_landing_view` / `kakao_share_send`)
- 구매 클릭률 ≥ 8% (`affiliate_link_click.source=shared` / `shared_landing_view`)
- K-Factor ≥ 1.1

---

## H4: 오류 제보 48h SLA 가 E2 의 신뢰도를 유의미하게 높인다

### 측정 KPI
- 48h 내 수정 완료율 (%)
- 제보자 만족도 (5점)
- D30 리텐션

### 인프라 셋업
- [ ] Mixpanel 이벤트 `error_report_submit`, `error_report_resolved` (with `elapsed_hours`)
- [ ] Cron `sla-monitor` (30분 마다) 가 48h 임박 제보 Slack 알림 (REQ-FUNC-025)
- [ ] 제보자 30명 대상 사후 만족도 조사 (Resend 이메일로 폼 링크 발송)
- [ ] Amplitude Retention 코호트: 제보 제출자의 D30 재방문율

### 성공 기준
- 수정 완료율 ≥ 90%
- 만족도 ≥ 4.0/5
- D30 리텐션 ≥ 25%

---

## H5: 구매 여정 이탈률이 플랫폼에서 유의미하게 낮다

### 측정 KPI
- 단계별 이탈률 (%)
- 전체 펀널 완주율 (%)

### 인프라 셋업
- [ ] Mixpanel Funnel: `search` → `calc_result_view` → `badge_view` → `affiliate_link_click`
- [ ] Public Launch 후 4주, n ≥ 500 세션 누적까지 대기
- [ ] 각 단계 이탈 사용자에게 후속 인터뷰 (n=10)

### 성공 기준
- 전체 펀널 완주율 ≥ 15% (기존 추정 이탈률 55~75% 기반 보수적 목표)

---

## 가동 게이트 (Public Launch 직전)

- [ ] Mixpanel 모든 11개 이벤트 (Skill 308 표) 수집 검증
- [ ] Amplitude 코호트·리텐션 분석 대시보드 구성
- [ ] H1 / H4 사후 설문 폼 발급 + Resend 발송 템플릿 준비
- [ ] H2 통계 power 분석 결과 PM 승인
- [ ] H3 UTM 파라미터 카카오 공유 카드 URL 에 자동 부착
- [ ] 분석 책임자 1명 지정 (주 1회 리뷰)

## 참조

- [docs/00_PRD_v1_0.md](../../docs/00_PRD_v1_0.md) §8.3 실험 가설/측정/성공 기준
- [docs/05_SRS_v1.md](../../docs/05_SRS_v1.md) §6.4.2 실험 가설 및 성공 기준
- [.agents/skills/308-mixpanel-analytics-rules/SKILL.md](../skills/308-mixpanel-analytics-rules/SKILL.md)
- [.agents/workflows/release-readiness-checklist.md](release-readiness-checklist.md)
