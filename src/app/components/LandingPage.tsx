/**
 * @file LandingPage.tsx
 * @description Super-Calc 전면 랜딩페이지 (Anti-BS Manifesto Edition)
 *
 * [전략 유형] C 유형 (결과 지향형) + A 유형 일부(불안 해소형)
 * [핵심 카피] "광고 없는 팩트, 엑셀 없는 최저가"
 * [핵심 목표] 프리런치 — Email 기반 대기리스트/사전예약/알림 전환
 *
 * [섹션 구성]
 *  0. Sticky Header (사전예약 primary, 데모 secondary)
 *  1. Hero — 매니페스토 헤드라인 + 라이브 대기 카운터 + 검색 데모
 *  2. Lemon Market Reality Check — 충격 통계 4개
 *  3. Anti-BS Pledge — "약속하지 않는 것" vs "약속하는 것"
 *  4. Three Engines — Super-Calc / Anti-BS Dashboard / Data Trust
 *  5. Persona Block — C1 한정훈 ↔ C2 박소연 / A2 정수빈 토글
 *  6. JTBD — Fire / Hire 비교
 *  7. Anti-BS Dashboard 인터랙티브 미리보기
 *  8. Before & After ROI
 *  9. Live Waitlist Strip
 * 10. Triple CTA — 사전예약 / 대기리스트 / 알림 (이메일 캡처)
 * 11. Footer Anti-BS Pledge
 * 12. Mobile Sticky CTA Bar
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  Gauge,
  Megaphone,
  Quote,
  ScanLine,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  TrendingDown,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

/* ────────────────────────────── 상수/카피 ────────────────────────────── */

/** 충격 통계 — Lemon Market 진단 */
const LEMON_FACTS = [
  {
    headline: "8.2배",
    subhead: "동일 성분 가격 차이",
    desc: "한국소비자원 2022 — 같은 성분, 같은 일일 권장량인데 8.2배가 갈립니다.",
    icon: TrendingDown,
    accent: "text-rose-400",
    bar: "from-rose-500/80 to-rose-700/80",
  },
  {
    headline: "72.3%",
    subhead: "온라인 콘텐츠가 광고",
    desc: "공정거래위 2023 — 검색 결과 10건 중 7건은 협찬·광고 후기입니다.",
    icon: Megaphone,
    accent: "text-amber-400",
    bar: "from-amber-500/80 to-orange-600/80",
  },
  {
    headline: "47.2%",
    subhead: "성분 비교 어렵다고 응답",
    desc: "식약처 2021 — 절반에 가까운 소비자가 성분 비교를 포기합니다.",
    icon: AlertTriangle,
    accent: "text-violet-400",
    bar: "from-violet-500/80 to-fuchsia-600/80",
  },
  {
    headline: "60분+",
    subhead: "탐색에 드는 평균 시간",
    desc: "소비자 인터뷰 N=58 — 1시간을 써도 결국 광고 클릭으로 끝납니다.",
    icon: Clock,
    accent: "text-sky-400",
    bar: "from-sky-500/80 to-cyan-600/80",
  },
] as const;

/** Anti-BS Pledge — Will Not / Will Do */
const ANTI_BS_WILL_NOT = [
  "제휴 마케팅 (Affiliate)",
  "검색 광고 (SEO 슬롯)",
  "대시보드 내 노출 광고",
  "유료 노출·우선 정렬",
  "협찬 콘텐츠·인플루언서 수수료",
] as const;

const ANTI_BS_WILL_DO = [
  "식약처 공전 100% 매핑",
  "1일 단가 자동 환산 (5초)",
  "데이터 출처 2클릭 추적",
  "오류 제보 48시간 SLA",
  "원자료 변경 이력 공개",
] as const;

/** 3대 엔진 */
const ENGINES = [
  {
    icon: Gauge,
    badge: "ENGINE #1",
    title: "Super-Calc Engine",
    sub: "1일 단가, 5초 안에",
    desc:
      "환율·배송비·복용량·포장 단위까지 자동 정규화. 60분짜리 엑셀 비교가 5초로 끝납니다.",
    bullets: [
      "iHerb · 쿠팡 · 네이버 3채널 동시 비교",
      "1정당 mg → 1일 권장량 자동 환산",
      "최종 결제가 (쿠폰 · 배송비 포함)",
    ],
    grad: "from-blue-500 via-blue-600 to-indigo-700",
    glow: "shadow-blue-500/30",
  },
  {
    icon: ShieldCheck,
    badge: "ENGINE #2",
    title: "Anti-BS Dashboard",
    sub: "광고 0건 · 협찬 0원",
    desc:
      "마케팅 노이즈 100% 제거. 식약처 공전 기반 의학 뱃지(✅ 인정 / ⚠️ 주의 / 🚫 미인정)만 노출.",
    bullets: [
      "식약처 고시·개별인정형 자동 매칭",
      "전문 용어 → 일상어 번역",
      "수익 모델: 광고 0%, 사용자 결제 100%",
    ],
    grad: "from-emerald-500 via-teal-600 to-cyan-700",
    glow: "shadow-emerald-500/30",
  },
  {
    icon: Database,
    badge: "ENGINE #3",
    title: "Data Trust System",
    sub: "데이터 무결성 SLA 48h",
    desc:
      "비표준 성분 표기를 통일하는 데이터 정규화 기술이 우리의 유일한 해자(Moat)입니다.",
    bullets: [
      "원본 출처 2클릭 추적 가능",
      "변경 이력 (Diff) 공개",
      "오류 제보 → 48시간 내 수정",
    ],
    grad: "from-violet-500 via-purple-600 to-fuchsia-700",
    glow: "shadow-violet-500/30",
  },
] as const;

/** 페르소나 */
const PERSONAS = {
  c1: {
    id: "c1",
    code: "C1",
    name: "한정훈 (36, 개발자)",
    label: "가성비 최적화자",
    quote: "엑셀에 달러치고 나눗셈하다 보면 현타옵니다.",
    pains: [
      "환율·배송비 반영 수동 계산",
      "채널별 단가 미반영",
      "재고/가격 변동 추적 불가",
    ],
    gains: [
      "60분 → 5초 (720배 단축)",
      "iHerb 환율·배송비 실시간 반영",
      "최저가 알림 + 재방문 루틴",
    ],
    cta: "엑셀 비교를 영원히 해고하세요",
    accent: "from-blue-500 to-indigo-600",
    soft: "bg-blue-50",
    ring: "ring-blue-200",
  },
  c2: {
    id: "c2",
    code: "C2 / A2",
    name: "박소연 (43) · 정수빈 (29)",
    label: "신뢰 탐색자",
    quote: "광고인지 아닌지만 감별해 주는 판독기가 필요해요.",
    pains: [
      "성분명 해석 불가 47.2%",
      "광고 vs 독립 정보 구분 불가",
      "결정 기준 부재 → 구매 포기",
    ],
    gains: [
      "전문 용어 → 일상어 번역",
      "광고 아님 100% 보증",
      "30분 안에 확신 + 카톡 공유",
    ],
    cta: "광고 아닌 결론, 30분 안에",
    accent: "from-emerald-500 to-teal-600",
    soft: "bg-emerald-50",
    ring: "ring-emerald-200",
  },
} as const;

/** Fire / Hire (JTBD) */
const FIRE_HIRE = {
  fire: [
    { label: "엑셀 수동 단가 계산", icon: XCircle },
    { label: "광고성 블로그 후기", icon: Megaphone },
    { label: "성분명 구글링 30분", icon: Search },
    { label: "약국 직원 추천 의존", icon: Quote },
  ],
  hire: [
    { label: "Super-Calc 5초 환산", icon: Zap },
    { label: "Anti-BS 의학 뱃지", icon: ShieldCheck },
    { label: "일상어 번역 결론", icon: BadgeCheck },
    { label: "출처 2클릭 추적", icon: Database },
  ],
} as const;

/** 결과 미리보기 — 인터랙티브 데모 */
const DEMO_RESULTS = [
  {
    rank: 1,
    brand: "Now Foods",
    name: "비타민D3 5000IU 240캡슐",
    channel: "iHerb",
    perDay: 178,
    badge: "최저가",
    badgeTone: "bg-emerald-500",
    verdict: "approved",
    reason: "식약처 고시형 — 비타민D",
    purity: 99,
  },
  {
    rank: 2,
    brand: "GNC",
    name: "비타민D 2000IU 180캡슐",
    channel: "쿠팡",
    perDay: 240,
    badge: "인정",
    badgeTone: "bg-blue-500",
    verdict: "approved",
    reason: "식약처 고시형 — 비타민D",
    purity: 96,
  },
  {
    rank: 3,
    brand: "헬스X (예시)",
    name: "프리미엄 비타민D 컴플렉스",
    channel: "네이버",
    perDay: 980,
    badge: "주의",
    badgeTone: "bg-amber-500",
    verdict: "warning",
    reason: "협찬 후기 다수 · 함량 라벨 불일치",
    purity: 71,
  },
] as const;

const ROTATING_KEYWORDS = [
  "비타민D",
  "오메가3",
  "프로바이오틱스",
  "NMN",
  "마그네슘",
  "콜라겐",
  "루테인",
  "코엔자임Q10",
] as const;

/** 트리플 CTA */
const TRIPLE_CTA = [
  {
    id: "early",
    icon: Sparkles,
    badge: "🚀 Early Access",
    title: "사전 예약",
    desc: "가장 먼저 광고 없는 팩트체크를 경험하세요. 한정 인원 사전 예약.",
    perk: "런칭 후 3개월 프리미엄 무료",
    accent: "from-blue-600 via-indigo-600 to-violet-700",
    ring: "ring-blue-300",
    persona: "C1 가성비 최적화자",
  },
  {
    id: "waitlist",
    icon: FileText,
    badge: "📝 Waitlist",
    title: "대기 리스트 등록",
    desc: "베타 테스트 준비 중입니다. 이메일만 남기면 우선 참여 기회를 받습니다.",
    perk: "베타 무료 + 피드백 리워드",
    accent: "from-emerald-600 via-teal-600 to-cyan-700",
    ring: "ring-emerald-300",
    persona: "C2 신뢰 탐색자",
  },
  {
    id: "notify",
    icon: Bell,
    badge: "🔔 Launch Notify",
    title: "알림 설정",
    desc: "정식 론칭과 신규 팩트체크 리포트 발행을 가장 먼저 받아보세요.",
    perk: "트렌드 성분 리포트 우선 수신",
    accent: "from-amber-500 via-orange-600 to-rose-600",
    ring: "ring-amber-300",
    persona: "A2 트렌드 탐색자",
  },
] as const;

/* ────────────────────────────── 헬퍼 ────────────────────────────── */

const STORAGE_KEY = "supercalc_waitlist";

function readWaitlistCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { emails?: string[] };
    return Array.isArray(parsed.emails) ? parsed.emails.length : 0;
  } catch {
    return 0;
  }
}

function persistEmail(email: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw
      ? (JSON.parse(raw) as { emails?: string[] })
      : { emails: [] as string[] };
    const set = new Set(parsed.emails ?? []);
    set.add(email.toLowerCase().trim());
    const next = Array.from(set);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ emails: next }));
    return next.length;
  } catch {
    return 0;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ────────────────────────────── 컴포넌트 ────────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate();

  const [keywordIndex, setKeywordIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [activePersona, setActivePersona] = useState<"c1" | "c2">("c1");

  /* 라이브 카운터: 기본 베이스 + localStorage 합산 + 랜덤 증가(연출) */
  const baseCount = useMemo(() => 2837, []); // 사회적 증거용 베이스
  const [liveCount, setLiveCount] = useState<number>(baseCount);

  useEffect(() => {
    setIsVisible(true);
    setLiveCount(baseCount + readWaitlistCount());

    const kw = setInterval(() => {
      setKeywordIndex((p) => (p + 1) % ROTATING_KEYWORDS.length);
    }, 2200);

    const live = setInterval(() => {
      setLiveCount((c) => c + (Math.random() > 0.45 ? 1 : 0));
    }, 4500);

    return () => {
      clearInterval(kw);
      clearInterval(live);
    };
  }, [baseCount]);

  /* 검색바 → /app/compare/:term 으로 딥링크 */
  const handleSearchSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      const v = searchValue.trim();
      if (!v) {
        // 빈 입력이면 현재 회전 키워드로 진입
        navigate(
          `/app/compare/${encodeURIComponent(ROTATING_KEYWORDS[keywordIndex])}`,
        );
        return;
      }
      navigate(`/app/compare/${encodeURIComponent(v)}`);
    },
    [navigate, searchValue, keywordIndex],
  );

  const goToApp = useCallback(() => {
    navigate("/app");
  }, [navigate]);

  /* 이메일 캡처 (3 카드 공유) */
  const ctaSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollToCta = useCallback(() => {
    ctaSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-blue-200 selection:text-blue-900">
      {/* ━━━━━━━━━━━━━━━━━━━━ Header ━━━━━━━━━━━━━━━━━━━━ */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-white/75 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center shadow-md shadow-blue-300/40">
              <span className="text-white font-black text-[11px] tracking-tight">SC</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
            </div>
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">
              Super-Calc
            </span>
            <span className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 rounded-md bg-slate-900 text-[10px] font-bold text-white tracking-wider">
              BETA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToApp}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              데모 둘러보기
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={scrollToCta}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-2 rounded-xl shadow-lg shadow-blue-300/30 hover:shadow-blue-400/40 transition-all"
            >
              사전 예약
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━ ① Hero ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-32 pb-24 px-5 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />
        <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-blue-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-[28rem] h-[28rem] bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div
          className={`relative z-10 max-w-5xl mx-auto text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Manifesto Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs sm:text-sm font-semibold text-white mb-7">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-slate-200">건기식 시장은</span>
            <span className="font-bold text-rose-300">레몬 마켓(Lemon Market)</span>
            <span className="text-slate-200">입니다.</span>
          </div>

          {/* H1 — 매니페스토 */}
          <h1 className="font-black tracking-tight leading-[1.05] text-4xl sm:text-6xl md:text-7xl lg:text-8xl mb-7">
            <span className="block text-white">광고 없는</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400">
              팩트.
            </span>
            <span className="block mt-1 text-white">엑셀 없는</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-300 to-rose-400">
              최저가.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10">
            건기식 시장의 정보 비대칭과 뒷광고 노이즈를{" "}
            <strong className="text-white">100% 제거</strong>합니다.
            <br className="hidden sm:block" />
            식약처 공전 기반 의학 팩트체크 + 1일 단가 자동 환산.{" "}
            <span className="text-cyan-300 font-semibold">5초면 끝.</span>
          </p>

          {/* 인터랙티브 검색 데모 */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto mb-5 group"
          >
            <div className="relative flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 shadow-2xl shadow-blue-900/40 ring-1 ring-white/30">
              <div className="pl-3 pr-1 text-slate-400">
                <ScanLine className="w-5 h-5" />
              </div>
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`예: ${ROTATING_KEYWORDS[keywordIndex]} — 한 단어만 입력해도 됩니다`}
                className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-sm sm:text-base py-2.5"
                aria-label="성분 또는 제품명 검색"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-700/40 transition-all"
              >
                <span className="hidden sm:inline">팩트체크</span>
                <span className="sm:hidden">검색</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              ↳ 검색 즉시 데모 결과 페이지로 이동합니다 · 회원가입 불필요
            </p>
          </form>

          {/* 라이브 대기 카운터 */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 backdrop-blur border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            <span className="text-xs sm:text-sm text-slate-300">
              현재{" "}
              <strong className="text-white tabular-nums">
                {liveCount.toLocaleString()}
              </strong>
              명이 사전 예약 중 ·{" "}
              <button
                onClick={scrollToCta}
                className="font-semibold text-cyan-300 hover:text-cyan-200 underline-offset-4 hover:underline"
              >
                대기 리스트 합류 →
              </button>
            </span>
          </div>

          {/* Trust Strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] sm:text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              협찬 0원
            </span>
            <span className="inline-flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              광고 0건
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
              식약처 공전 100% 매핑
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              오류 제보 48h SLA
            </span>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="relative z-10 flex justify-center mt-14">
          <div className="flex flex-col items-center gap-1 text-slate-500">
            <span className="text-[10px] tracking-[0.2em] font-semibold">
              왜 만들었는지 ↓
            </span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ② Lemon Market ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wider mb-5">
              <Siren className="w-3.5 h-3.5" />
              REALITY CHECK · 2023 KOREA
            </div>
            <h2 className="font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1] mb-4">
              연 6조 원 시장,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-300 via-amber-300 to-yellow-300">
                정보는 0원어치
              </span>
              입니다.
            </h2>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
              검증되지 않은 노이즈가 시장을 왜곡합니다. 우리가 마주한 4가지 사실.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {LEMON_FACTS.map((f) => (
              <div
                key={f.subhead}
                className="group relative p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`absolute inset-x-6 -top-px h-px bg-gradient-to-r ${f.bar}`} />
                <f.icon className={`w-7 h-7 ${f.accent} mb-4`} />
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-1.5">
                  {f.headline}
                </div>
                <div className="text-sm font-bold text-slate-200 mb-2.5">
                  {f.subhead}
                </div>
                <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-16 max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-amber-400/20">
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed">
              <span className="text-rose-300 font-bold">결론:</span>{" "}
              소비자는 1시간을 써도 결국 광고를 클릭합니다. 가격 차이를 모르고,
              성분을 비교할 수 없으며, 결정 기준이 없기 때문입니다.{" "}
              <span className="text-white font-semibold">
                이것이 우리가 존재하는 이유입니다.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ③ Anti-BS Pledge ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em] mb-5">
              ANTI-BS PLEDGE
            </div>
            <h2 className="font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] text-slate-900 mb-5">
              우리는 <span className="text-rose-500">하지 않습니다.</span>
              <br />
              그래서 <span className="text-emerald-600">신뢰할 수 있습니다.</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
              기능이 아니라 <strong className="text-slate-800">'독립적 신뢰'</strong>{" "}
              자체가 우리의 핵심 가치 제안입니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-7">
            {/* Will Not */}
            <div className="relative p-7 sm:p-9 rounded-3xl bg-gradient-to-br from-rose-50 to-rose-100/40 border-2 border-rose-200 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-rose-200/40 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wider mb-5">
                  <XCircle className="w-3.5 h-3.5" />
                  WE WILL NOT
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-rose-900 mb-5 leading-tight">
                  광고로 돈을 벌지 않습니다.
                </h3>
                <ul className="space-y-2.5">
                  {ANTI_BS_WILL_NOT.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2.5 text-sm sm:text-[15px] text-rose-900/80"
                    >
                      <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span className="line-through decoration-rose-400/60 decoration-2">
                        {t}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Will Do */}
            <div className="relative p-7 sm:p-9 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-100/40 border-2 border-emerald-200 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black tracking-wider mb-5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  WE WILL
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-900 mb-5 leading-tight">
                  사용자 결제로만 운영됩니다.
                </h3>
                <ul className="space-y-2.5">
                  {ANTI_BS_WILL_DO.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2.5 text-sm sm:text-[15px] text-emerald-900/90 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ④ Three Engines ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-slate-50 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em] mb-5">
              THE STACK
            </div>
            <h2 className="font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] text-slate-900 mb-5">
              3개의 엔진,
              <br />
              하나의 <span className="text-blue-600">초자동화 결과.</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto">
              마케팅이 아닌 데이터 기술이 우리의 유일한 해자입니다.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 sm:gap-7">
            {ENGINES.map((e) => (
              <div
                key={e.title}
                className={`group relative overflow-hidden rounded-3xl p-7 sm:p-8 bg-white border border-slate-200 hover:border-slate-300 hover:-translate-y-1.5 hover:shadow-2xl ${e.glow} transition-all duration-300`}
              >
                <div
                  className={`absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br ${e.grad} opacity-[0.07] blur-3xl pointer-events-none`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${e.grad} text-white shadow-lg ${e.glow}`}
                    >
                      <e.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] font-black text-slate-400">
                      {e.badge}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-1">
                    {e.title}
                  </h3>
                  <p className="text-sm font-semibold text-blue-600 mb-3">
                    {e.sub}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {e.desc}
                  </p>

                  <ul className="space-y-2 pt-4 border-t border-slate-100">
                    {e.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-[13px] text-slate-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ⑤ Persona Toggle ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em] mb-5">
              FOR WHOM
            </div>
            <h2 className="font-black text-3xl sm:text-5xl tracking-tight leading-[1.05] text-slate-900 mb-5">
              이 서비스는{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
                당신을 위해
              </span>{" "}
              만들어졌습니다.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg">
              두 명 중 한 명, 당신은 누구인가요?
            </p>
          </div>

          {/* Persona Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
              {(["c1", "c2"] as const).map((p) => {
                const persona = PERSONAS[p];
                const active = activePersona === p;
                return (
                  <button
                    key={p}
                    onClick={() => setActivePersona(p)}
                    className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      active
                        ? `bg-gradient-to-r ${persona.accent} text-white shadow-md`
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="font-black mr-1.5">{persona.code}</span>
                    {persona.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persona Card */}
          {(() => {
            const p = PERSONAS[activePersona];
            return (
              <div
                key={p.id}
                className={`relative rounded-3xl ${p.soft} ring-2 ${p.ring} p-7 sm:p-10 overflow-hidden animate-[fadeIn_0.4s_ease-out]`}
              >
                <div
                  className={`absolute -top-32 -right-16 w-72 h-72 rounded-full bg-gradient-to-br ${p.accent} opacity-10 blur-3xl pointer-events-none`}
                />
                <div className="relative">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${p.accent} text-white font-black text-lg shadow-md`}
                    >
                      {p.code.split(" ")[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {p.label}
                      </div>
                      <div className="text-lg font-extrabold text-slate-900">
                        {p.name}
                      </div>
                    </div>
                  </div>

                  <blockquote className="relative pl-5 border-l-4 border-slate-300/60 mb-7">
                    <Quote className="absolute -top-1 -left-1.5 w-5 h-5 text-slate-300 bg-inherit" />
                    <p className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
                      "{p.quote}"
                    </p>
                  </blockquote>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <div className="text-xs font-black tracking-wider text-rose-500 mb-3">
                        PAINS
                      </div>
                      <ul className="space-y-2">
                        {p.pains.map((x) => (
                          <li
                            key={x}
                            className="flex items-start gap-2 text-sm text-slate-700"
                          >
                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider text-emerald-600 mb-3">
                        GAINS
                      </div>
                      <ul className="space-y-2">
                        {p.gains.map((x) => (
                          <li
                            key={x}
                            className="flex items-start gap-2 text-sm text-slate-800 font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-7 pt-6 border-t border-slate-300/40 flex flex-wrap items-center justify-between gap-4">
                    <p
                      className={`text-base sm:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r ${p.accent}`}
                    >
                      → {p.cta}
                    </p>
                    <button
                      onClick={scrollToCta}
                      className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r ${p.accent} px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all`}
                    >
                      대기 리스트 합류
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ⑥ Fire / Hire (JTBD) ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em] mb-5">
              JOBS TO BE DONE
            </div>
            <h2 className="font-black text-3xl sm:text-5xl tracking-tight leading-[1.05] text-slate-900 mb-5">
              <span className="text-rose-500">해고할 것</span>{" "}
              vs{" "}
              <span className="text-emerald-600">고용할 것</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg">
              단순 기능 비교가 아닙니다. 당신의 30분짜리 의사결정 프로세스를 교체합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-7">
            {/* FIRE */}
            <div className="rounded-3xl p-7 sm:p-8 bg-rose-50 border-2 border-rose-200 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-black tracking-[0.25em] text-rose-400">
                🔥 FIRE
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-rose-900 mb-6 leading-tight">
                기존의 30분짜리 의사결정
              </h3>
              <ul className="space-y-3.5">
                {FIRE_HIRE.fire.map((x) => (
                  <li
                    key={x.label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-rose-100"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0">
                      <x.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-rose-900/80 line-through decoration-rose-400/50">
                      {x.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* HIRE */}
            <div className="rounded-3xl p-7 sm:p-8 bg-emerald-50 border-2 border-emerald-200 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[10px] font-black tracking-[0.25em] text-emerald-500">
                ⚡ HIRE
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-900 mb-6 leading-tight">
                Super-Calc의 5초 결정
              </h3>
              <ul className="space-y-3.5">
                {FIRE_HIRE.hire.map((x) => (
                  <li
                    key={x.label}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-emerald-100 shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <x.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-emerald-900">
                      {x.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ⑦ Result Preview (Interactive) ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em] mb-5">
              ANTI-BS DASHBOARD
            </div>
            <h2 className="font-black text-3xl sm:text-5xl tracking-tight leading-[1.05] text-slate-900 mb-5">
              이런 결과를{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">
                바로
              </span>{" "}
              받게 됩니다.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg">
              실제 비교 결과 스크린입니다. (예시 데이터 기반 모의)
            </p>
          </div>

          {/* Mock Browser Frame */}
          <div className="rounded-3xl bg-slate-900 p-2.5 sm:p-3 shadow-2xl shadow-slate-900/20 border border-slate-800">
            <div className="rounded-2xl overflow-hidden bg-white">
              {/* Browser bar */}
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-3 flex-1 max-w-md mx-auto">
                  <div className="px-3 py-1 rounded-md bg-white border border-slate-200 text-[11px] text-slate-500 truncate">
                    super-calc.app/compare/비타민D
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  AD-FREE
                </span>
              </div>

              <div className="p-5 sm:p-7">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">검색어</div>
                    <h4 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      비타민D · 총 3건 비교
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold">
                      <BadgeCheck className="w-3 h-3" />
                      식약처 ✅
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-bold">
                      <Eye className="w-3 h-3" />
                      광고 0건
                    </span>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-3">
                  {DEMO_RESULTS.map((r) => (
                    <div
                      key={r.rank}
                      className={`group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all hover:shadow-md ${
                        r.rank === 1
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 ring-1 ring-blue-100"
                          : r.verdict === "warning"
                            ? "bg-amber-50/60 border-amber-200"
                            : "bg-white border-slate-200"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          r.rank === 1
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        #{r.rank}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                            {r.brand} · {r.channel}
                          </span>
                          <span
                            className={`hidden sm:inline-flex text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded text-white ${r.badgeTone}`}
                          >
                            {r.badge}
                          </span>
                        </div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 truncate mb-1">
                          {r.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                          {r.verdict === "approved" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          <span
                            className={
                              r.verdict === "approved"
                                ? "text-emerald-700 font-medium"
                                : "text-amber-700 font-medium"
                            }
                          >
                            {r.reason}
                          </span>
                        </div>
                        {/* purity bar */}
                        <div className="mt-2 h-1 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              r.purity >= 90
                                ? "bg-emerald-500"
                                : r.purity >= 80
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            }`}
                            style={{ width: `${r.purity}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div
                          className={`text-base sm:text-xl font-black ${
                            r.rank === 1 ? "text-blue-600" : "text-slate-700"
                          }`}
                        >
                          ₩{r.perDay.toLocaleString()}
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                          / 1일 단가
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    출처: 식약처 공전 + iHerb/쿠팡/네이버
                  </span>
                  <span className="font-bold text-slate-700">
                    환율 적용: 실시간
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/app/compare/비타민D")}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-2xl transition-all hover:-translate-y-0.5"
            >
              실제 데모로 직접 비교해보기
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="mt-3 text-xs text-slate-400">
              회원가입 없이 데모 결과 페이지로 즉시 이동합니다
            </p>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ⑧ Before / After ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 sm:py-28 px-5 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute -top-20 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold tracking-[0.18em] mb-5">
              720× FASTER
            </div>
            <h2 className="font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] mb-5">
              60분이 5초가 됩니다.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
              시간만 줄어드는 게 아닙니다. 결정의 자신감이 차원이 다릅니다.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                label: "성분 비교 시간",
                before: "60분 (수동 엑셀)",
                after: "5초",
                icon: Clock,
                accent: "text-cyan-300",
              },
              {
                label: "광고 노출 횟수",
                before: "평균 27건/세션",
                after: "0건",
                icon: EyeOff,
                accent: "text-emerald-300",
              },
              {
                label: "성분 검증 근거",
                before: "블로그 후기 (광고)",
                after: "식약처 공전 100% 매핑",
                icon: ShieldCheck,
                accent: "text-blue-300",
              },
              {
                label: "비교 기준",
                before: "표시가 (불공정)",
                after: "1일 단가 + 최종 결제가",
                icon: Target,
                accent: "text-violet-300",
              },
              {
                label: "데이터 무결성",
                before: "오류 신고 무응답",
                after: "48시간 SLA 수정 보장",
                icon: BadgeCheck,
                accent: "text-amber-300",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-12 items-center gap-3 sm:gap-5 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="col-span-12 sm:col-span-3 flex items-center gap-2.5">
                  <row.icon className={`w-5 h-5 ${row.accent} flex-shrink-0`} />
                  <span className="text-sm font-bold text-slate-100">
                    {row.label}
                  </span>
                </div>
                <div className="col-span-5 sm:col-span-4 text-sm text-slate-500 line-through truncate">
                  {row.before}
                </div>
                <div className="col-span-1 flex justify-center text-blue-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="col-span-6 sm:col-span-4 text-sm font-bold text-white truncate">
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ⑨ Live Waitlist Strip ━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-12 sm:py-14 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/15 backdrop-blur items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xs font-black tracking-[0.2em] text-white/70 mb-1">
                LIVE
              </div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums leading-tight">
                {liveCount.toLocaleString()}명이 대기 중
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                광고 없는 팩트체크 플랫폼을 가장 먼저 경험할 사람들
              </p>
            </div>
          </div>
          <button
            onClick={scrollToCta}
            className="inline-flex items-center gap-1.5 px-6 py-3.5 bg-white text-blue-700 font-black text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
          >
            나도 합류하기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ ⑩ Triple CTA — Email Capture ━━━━━━━━━━━━━━━━━━━━ */}
      <section
        ref={ctaSectionRef}
        id="cta"
        className="py-20 sm:py-28 px-5 bg-gradient-to-b from-white to-slate-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-[0.18em] mb-5">
              JOIN THE WAITLIST
            </div>
            <h2 className="font-black text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] text-slate-900 mb-5">
              세 가지 방법 중{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500">
                당신에게 맞는 것
              </span>
              을 고르세요.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto">
              이메일만 입력하면 끝. 회원가입도, 비밀번호도, 마케팅 동의도 없습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {TRIPLE_CTA.map((cta) => (
              <CTACard
                key={cta.id}
                config={cta}
                onSubmit={(email) => {
                  const next = persistEmail(email);
                  setLiveCount(baseCount + next);
                }}
              />
            ))}
          </div>

          <p className="text-center mt-10 text-xs sm:text-sm text-slate-500">
            등록 정보는 베타 초대 알림에만 사용되며,{" "}
            <strong className="text-slate-700">절대로 광고/마케팅에 활용되지 않습니다.</strong>
            <br />
            언제든지 1클릭 수신 거부 가능 — 우리는 광고로 돈을 벌지 않으니까요.
          </p>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ Footer Pledge ━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-slate-950 text-slate-300 px-5 pt-16 pb-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-black text-xs">SC</span>
              </div>
              <span className="font-black text-white text-xl">Super-Calc</span>
            </div>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mb-6">
              <em className="text-white not-italic font-bold">
                "광고 없는 팩트, 엑셀 없는 최저가."
              </em>
              <br />
              건기식 시장의 정보 비대칭을 끝내기 위해, 단 하나의 원칙으로 만들어졌습니다 —{" "}
              <strong className="text-white">독립적 신뢰</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] sm:text-xs">
              <PledgeChip>광고 0건</PledgeChip>
              <PledgeChip>협찬 0원</PledgeChip>
              <PledgeChip>식약처 공전 100% 매핑</PledgeChip>
              <PledgeChip>오류 제보 48h SLA</PledgeChip>
              <PledgeChip>사용자 결제 100%</PledgeChip>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>
              본 서비스는 의료적 진단·치료 목적이 아니며, 식약처 공전 정보를 가공하여 제공합니다.
            </p>
            <p>© 2026 Super-Calc · All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ━━━━━━━━━━━━━━━━━━━━ Mobile Sticky CTA ━━━━━━━━━━━━━━━━━━━━ */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <button
          onClick={scrollToCta}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white font-black text-sm rounded-2xl shadow-2xl shadow-blue-700/40 ring-1 ring-white/20"
        >
          <Sparkles className="w-4 h-4" />
          사전 예약 · 한정 인원
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* fadeIn keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────── 서브 컴포넌트 ────────────────────────────── */

interface CTACardProps {
  config: (typeof TRIPLE_CTA)[number];
  onSubmit: (email: string) => void;
}

function CTACard({ config, onSubmit }: CTACardProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const v = email.trim();
      if (!EMAIL_RE.test(v)) {
        toast.error("이메일 주소 형식을 확인해주세요");
        return;
      }
      onSubmit(v);
      setSubmitted(true);
      toast.success(`${config.title} 등록 완료!`, {
        description: "베타 초대 시 가장 먼저 알려드리겠습니다.",
      });
    },
    [email, onSubmit, config.title],
  );

  return (
    <div
      className="group relative overflow-hidden rounded-3xl p-7 sm:p-8 bg-white border border-slate-200 hover:border-slate-300 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
    >
      <div
        className={`absolute -top-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br ${config.accent} opacity-[0.07] blur-3xl pointer-events-none`}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${config.accent} text-white shadow-lg`}
          >
            <config.icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black tracking-wider text-slate-400">
            {config.persona}
          </span>
        </div>

        <div className="text-[11px] font-black tracking-[0.18em] text-slate-500 mb-1">
          {config.badge}
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 leading-tight">
          {config.title}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          {config.desc}
        </p>

        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r ${config.accent} text-white text-[11px] font-bold mb-5 shadow`}
        >
          <Sparkles className="w-3 h-3" />
          {config.perk}
        </div>

        {submitted ? (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-bold text-emerald-900">등록되었습니다.</div>
              <div className="text-xs text-emerald-700/80">
                베타 초대 시 우선 안내해드립니다.
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white outline-none text-sm placeholder:text-slate-400 transition-colors"
              aria-label={`${config.title} 이메일 입력`}
            />
            <button
              type="submit"
              className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r ${config.accent} text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all`}
            >
              {config.title}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PledgeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-slate-200">
      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      {children}
    </span>
  );
}
