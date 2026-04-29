<!-- @AI_GUIDE: 이 문서는 프로젝트의 개요와 히스토리를 나타내는 메인 README입니다. 코드 분석 및 시스템 맥락을 위한 압축 컨텍스트는 docs/AI_CONTEXT.md를 참조하세요. -->

# Super-Calc

**영양제 1일 단가 기준 최저가 비교 + 식약처 기능성 원료 인정 여부 검증 플랫폼**

모바일 퍼스트(Mobile-first), 제로 마케팅(Zero-marketing), 데이터 투명성을 핵심 원칙으로 하는 UI 프로토타입입니다.

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

### 랜딩페이지 → 서비스 전환 구조

```
[사용자 유입] → 랜딩페이지 (/) → CTA 클릭 → 서비스 앱 (/app)
```

랜딩페이지는 **C 유형 (결과 지향형)** 전략을 적용하여 고객의 사용 의향을 극대화합니다.
자세한 전략 평가는 **[docs/LANDING_PAGE_CHECKLIST.md](./docs/LANDING_PAGE_CHECKLIST.md)** 참조.

---

## 랜딩페이지 구성 (Landing Page Sections)

| 순서 | 섹션 | 목적 |
|------|------|------|
| 1 | Hero Section | 헤드라인 + 검색바 CTA + 키워드 순환 |
| 2 | Social Proof | 수치 증명 (128,400+ 비교, 4.8/5 만족도) |
| 3 | Value Proposition | 3가지 핵심 혜택 카드 |
| 4 | Input-Output Diagram | 3단계 워크플로우 시각화 |
| 5 | Result Gallery | 실제 비교 결과 미리보기 |
| 6 | Before & After | ROI 시간/비용 절감 비교 |
| 7 | Final CTA | 최종 전환 유도 |

---

## 리팩토링 요약 (Before → After)

### ✅ 구조 개선
- **AdminLayout 분리**: 3개 어드민 페이지의 공통 헤더/레이아웃 중복 제거 → Nested Route 적용
- **SourceInfoModal 분리**: `ProductDetail.tsx` 내 인라인 300줄 모달 → 독립 컴포넌트 분리
- **LandingPage 추가**: 서비스 전면에 고객 Hook용 랜딩페이지 배치, 기존 서비스를 `/app` 하위로 이동

### ✅ 데이터 레이어 분리
- `types/index.ts` — 전역 TypeScript 타입 통합
- `data/mock.ts` — 모든 Mock 데이터 중앙 집중 (API 교체 시 이 파일만 수정)
- `constants/index.ts` — `BADGE_CONFIG`, `ERROR_TYPE_MAP` 등 설정 분리

### ✅ 성능 최적화
- `React.memo` → `IngredientBadge`, `StatCard` 적용
- `useCallback` → 모든 이벤트 핸들러에 일괄 적용
- `useDebounce(200ms)` → 검색 입력 디바운싱

### ✅ 시각적 계층 (Visual Hierarchy)
- Tailwind Best Practices 적용: `ring-1`, `group-hover`, `hover:-translate-y-1`
- 어드민 `StatCard` 프리미엄 다크 테마 마이크로 애니메이션 적용
- 랜딩페이지: 그래디언트, glassmorphism 헤더, 마이크로 애니메이션

### ✅ 코드 문서화
- 모든 주요 파일 상단에 `@file`, `[개요]`, `[함수 호출 구조]` JSDoc 추가

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
| 🔴 High | `data/mock.ts` → 실제 API(Supabase/Firebase) 교체 |
| 🔴 High | 랜딩페이지 A/B 테스트 (헤드라인·CTA 문구 최적화) |
| 🟡 Mid | WAI-ARIA 접근성 보강 및 키보드 네비게이션 테스트 |
| 🟡 Mid | 긴 목록 Virtualization (검색 결과, 어드민 목록) |
| 🟡 Mid | 랜딩페이지 실제 사용자 후기·파트너 로고 월 추가 |
| 🟢 Low | ESLint Import 순서 규칙 자동화 |
| 🟢 Low | Storybook 도입 (공용 컴포넌트 독립 시각화) |