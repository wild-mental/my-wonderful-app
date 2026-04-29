<!-- @AI_GUIDE: 이 문서는 프로젝트의 개요와 히스토리를 나타내는 메인 README입니다. 코드 분석 및 시스템 맥락을 위한 압축 컨텍스트는 docs/AI_CONTEXT.md를 참조하세요. -->

# Super-Calc

> **"광고 없는 팩트, 엑셀 없는 최저가."**

**건기식 성분·가격 비교 초자동화 플랫폼** — 식약처 공전 기반 의학 팩트체크 + 1일 단가 자동 환산.

건기식 시장의 정보 비대칭과 뒷광고 노이즈를 100% 제거하기 위해 만들어졌습니다. 협찬 0원, 광고 0건, 식약처 공전 100% 매핑 — **'독립적 신뢰'** 자체가 우리의 유일한 가치 제안입니다.

---

## 빠른 시작 (Quick Start)

```bash
npm install
npm run dev     # 개발 서버 실행 (기본 포트: 5173)
npm run build   # 프로덕션 빌드
```

---

## 기술 스택 (Stack)

| 항목 | 사용 기술 |
|------|----------|
| Framework | React 19 + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router (Nested Routing) |
| Icons | Lucide React |
| Toast | Sonner |
| Font | Inter (Google Fonts) |

---

## 프로젝트 구조 요약

```
src/app/
├── components/     # 페이지 및 UI 컴포넌트
│   ├── LandingPage.tsx    # 🆕 전면 랜딩페이지 (고객 Hook)
│   ├── shared/     # 전역 공용 컴포넌트 (IngredientBadge)
│   └── admin/      # 어드민 전용 컴포넌트 (StatCard)
├── constants/      # 전역 상수 (BADGE_CONFIG, ERROR_TYPE_MAP)
├── data/           # Mock 데이터 (API 연동 교체 포인트)
├── hooks/          # 커스텀 훅 (useModal, useDebounce)
└── types/          # 전역 TypeScript 타입
```

> 전체 컴포넌트 트리 및 의존성 흐름은 **[docs/COMPONENT_STRUCTURE.md](./docs/COMPONENT_STRUCTURE.md)** 참조

---

## 주요 라우트

| 경로 | 화면 | 레이아웃 |
|------|------|----------|
| `/` | 🆕 **랜딩페이지** (고객 유입 전면) | 독립 |
| `/app` | 홈 (검색) | Layout |
| `/app/compare/:searchTerm` | 비교 결과 | Layout |
| `/app/product/:productId` | 제품 상세 | Layout |
| `/app/share/:shareId` | 공유 랜딩 | Layout |
| `/signup` | 회원가입 | 없음 |
| `/admin/login` | 어드민 로그인 | 없음 |
| `/admin/dashboard` | 어드민 대시보드 | AdminLayout |
| `/admin/registration-requests` | 등록 요청 관리 | AdminLayout |
| `/admin/error-reports` | 오류 신고 관리 | AdminLayout |

### 랜딩페이지 → 전환 구조

```
[사용자 유입]
   ↓
랜딩페이지 (/) — Anti-BS Manifesto Edition
   ├── 검색바 → /app/compare/{term} (즉시 데모 진입)
   ├── 데모 둘러보기 → /app
   └── 🚀 사전예약 / 📝 대기리스트 / 🔔 알림 (이메일 캡처)
```

랜딩페이지는 **C 유형 (결과 지향형) + A 유형 (불안 해소형) 하이브리드** 전략을 적용합니다.
자세한 전략 평가는 **[docs/LANDING_PAGE_CHECKLIST.md](./docs/LANDING_PAGE_CHECKLIST.md)** 참조.

---

## 랜딩페이지 구성 (v2 Manifesto Edition)

| # | 섹션 | 목적 | 핵심 장치 |
|---|------|------|-----------|
| 0 | Sticky Header | 항시 CTA 노출 | "사전 예약" 버튼 + BETA 배지 |
| 1 | Hero — 매니페스토 | 5초 안에 정체성 전달 | "광고 없는 팩트, 엑셀 없는 최저가" + 라이브 카운터 + 검색 딥링크 |
| 2 | Lemon Market Reality | 시장 진단 / 필요성 자각 | 4대 충격 통계 (8.2배·72.3%·47.2%·60분+) |
| 3 | Anti-BS Pledge | 신뢰 정체성 선언 | WE WILL NOT (5) ↔ WE WILL (5) |
| 4 | Three Engines | 기술 차별화 | Super-Calc / Anti-BS Dashboard / Data Trust |
| 5 | Persona Toggle | 1인칭 주체화 | C1 ↔ C2/A2 인터랙티브 전환 (quote/pains/gains) |
| 6 | JTBD Fire/Hire | 의사결정 교체 메타포 | 🔥 FIRE (4) vs ⚡ HIRE (4) |
| 7 | Anti-BS Dashboard 미리보기 | 결과 시뮬레이션 | 브라우저 크롬 + verdict + purity bar |
| 8 | Before & After ROI | 효율성 정량화 | 5행 매트릭스 (60분→5초, 720× faster) |
| 9 | Live Waitlist Strip | 사회적 증거 | 실시간 대기 카운터 |
| 10 | Triple CTA | 페르소나별 이메일 캡처 | 사전예약 (C1) / 대기리스트 (C2) / 알림 (A2) |
| 11 | Footer Pledge | 정체성 재확인 | 5개 Pledge Chip (광고 0건 등) |
| 12 | Mobile Sticky Bar | 모바일 항시 CTA | 화면 하단 고정 사전예약 |

### 핵심 카피

> 광고 없는 팩트, 엑셀 없는 최저가.
>
> 우리는 광고로 돈을 벌지 않습니다. 그래서 신뢰할 수 있습니다.
> — 60분짜리 의사결정을 5초로, 720배 빠르게.

### 이메일 캡처 동작

```ts
localStorage["supercalc_waitlist"] = { emails: string[] }
```

- 3개 카드(사전예약/대기리스트/알림)가 동일 저장소를 공유
- 이메일 정규식 검증 + Set 기반 dedupe
- 등록 시 `liveCount` 즉시 증가 + `toast.success` 알림
- 백엔드 미연동 상태의 프로토타입 영속 계층 (Roadmap: Supabase/Resend 연동)

---

## 변경 이력

### v2 (2026-04-29) — Manifesto Edition 🆕
- **랜딩페이지 전면 개편**: "광고 없는 팩트, 엑셀 없는 최저가" 매니페스토로 재포지셔닝
- **Lemon Market 진단 섹션** 신규 추가 (4대 충격 통계 + 출처 명시)
- **Anti-BS Pledge** 신규 추가 (WE WILL NOT vs WE WILL 대구 구조)
- **Three Engines** 섹션으로 기술 차별화 강화 (Super-Calc / Anti-BS Dashboard / Data Trust)
- **Persona Toggle** 신규 추가 — C1 ↔ C2/A2 인터랙티브 전환
- **JTBD Fire/Hire** 매트릭스로 v1 워크플로우 다이어그램 교체
- **Triple CTA Email Capture** — 사전예약 / 대기리스트 / 알림 (페르소나별 미세 조정)
- **라이브 대기 카운터** + localStorage 영속화
- **검색바 딥링크**: `/app` → `/app/compare/{searchTerm}` 으로 검색어 보존 진입
- **Result Preview 인터랙티브 강화**: verdict / purity bar / 출처 푸터 / AD-FREE 배지
- **Mobile Sticky CTA Bar** 신규 추가
- **5행 Before/After ROI** (v1 3행 → v2 5행, "720× FASTER" 헤드)

### v1 (2026-04-28)
- **AdminLayout 분리**: 3개 어드민 페이지의 공통 헤더/레이아웃 중복 제거 → Nested Route 적용
- **SourceInfoModal 분리**: `ProductDetail.tsx` 내 인라인 300줄 모달 → 독립 컴포넌트 분리
- **LandingPage 추가**: 서비스 전면에 고객 Hook용 랜딩페이지 배치, 기존 서비스를 `/app` 하위로 이동
- **데이터 레이어 분리**: `types/`, `data/mock.ts`, `constants/`
- **성능 최적화**: `React.memo`, `useCallback`, `useDebounce(200ms)`
- **코드 문서화**: 모든 주요 파일 상단에 `@file`, `[개요]`, `[함수 호출 구조]` JSDoc 추가

---

## 문서 목록 (docs/)

| 문서 | 설명 |
|------|------|
| [UX_FLOW.md](./docs/UX_FLOW.md) | 핵심 UX 시나리오 5종 및 모달 상태 흐름 다이어그램 |
| [COMPONENT_STRUCTURE.md](./docs/COMPONENT_STRUCTURE.md) | 전체 컴포넌트 트리 머메이드 차트 및 파일 구조 |
| [CODE_QUALITY_REPORT.md](./docs/CODE_QUALITY_REPORT.md) | 5개 항목 코드 품질 평가 및 Before/After 비교 보고서 |
| [AI_CONTEXT.md](./docs/AI_CONTEXT.md) | AI 작업용 압축 컨텍스트 (토큰 절약용) |
| [LANDING_PAGE_CHECKLIST.md](./docs/LANDING_PAGE_CHECKLIST.md) | 🆕 랜딩페이지 체크리스트 최종 평가 문서 |

---

## 향후 계획 (Roadmap)

| 우선순위 | 항목 |
|---------|------|
| 🔴 High | 이메일 캡처 → 실제 백엔드(Supabase Auth + Resend/Mailchimp) 연동 |
| 🔴 High | 라이브 카운터 → 서버 기반 실시간 카운트 (WebSocket / SSE) |
| 🔴 High | `data/mock.ts` → 실제 API(Supabase/Firebase) 교체 |
| 🟡 Mid | 랜딩페이지 A/B 테스트 (Triple CTA 전환율, 페르소나 토글 진입률) |
| 🟡 Mid | WAI-ARIA 접근성 보강 및 키보드 네비게이션 테스트 |
| 🟡 Mid | 긴 목록 Virtualization (검색 결과, 어드민 목록) |
| 🟡 Mid | C1/C2 실제 인터뷰 quote 슬라이더 추가 |
| 🟢 Low | Anti-BS Pledge 인쇄용 PDF/이미지 (바이럴) |
| 🟢 Low | ESLint Import 순서 규칙 자동화 |
| 🟢 Low | Storybook 도입 (공용 컴포넌트 독립 시각화) |