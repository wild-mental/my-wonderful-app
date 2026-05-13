---
description: 건기식 성분·가격 비교 초자동화 플랫폼 비전·페르소나·KPI 요약
globs: ["**/*"]
alwaysApply: true
---

# PROJECT OVERVIEW: 건기식 성분·가격 비교 초자동화 플랫폼 (Super-Calc MVP)

## Vision
수동 엑셀 계산과 뒷광고 필터링에 지친 건강기능식품 소비자에게, **실시간 1일 단가 계산 + 의학 팩트체크 + 1탭 공유**를 제공하는 신뢰 기반 비교 플랫폼.

## SSOT
- Business: [docs/00_PRD_v1_0.md](../../docs/00_PRD_v1_0.md) (v1.0)
- Technical: [docs/05_SRS_v1.md](../../docs/05_SRS_v1.md) (SRS-001 v1.4)

## Core Features (MoSCoW: Must)
- **F1. Super-Calc Engine** — 쿠팡 파트너스 1일 단가 정규화·정렬 (REQ-FUNC-001~009)
- **F2. Anti-BS Dashboard** — 식약처 공전 1:1 매칭 뱃지 + 일상어 번역, 광고 0건 (REQ-FUNC-010~015)
- **F3. Viral Engine** — 카카오톡 1-Tap 공유, 앱 설치 불요 웹뷰 (REQ-FUNC-016~021)
- **F4. Data Trust System** — 라벨 아카이브 + 오류 제보 48h SLA + 리워드 (REQ-FUNC-022~028)

## Target Personas
- **C1 한정훈** (36, 개발자) — 가성비 최적화 직구족
- **C2 박소연** (43, 인사팀 과장) — 건강 계기 진입자
- **A2 정수빈** (27, 뷰티 마케터) — 트렌드 추종 탐색자
- **E2 김도현** (29, 데이터 분석가) — 신뢰 실패자

## North Star KPI
- **TTC:** 탐색 → 결제/공유 완료 **p50 ≤ 5분 / p95 ≤ 30분**

## Project Philosophy
- 광고 노이즈 **0건** — Anti-BS 포지셔닝 절대 타협 금지
- 데이터 무결성 — 2클릭 이내 원본 출처 도달
- 식약처 준수 — 공전 원문만 래핑, 질병 예방·치료 표현 0건
- 모바일 웹 퍼스트 — 카카오 내장 브라우저 호환

## See also
- [002-tech-stack.md](002-tech-stack.md)
- [003-development-guidelines.md](003-development-guidelines.md)
