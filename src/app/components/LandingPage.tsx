/**
 * @file LandingPage.tsx
 * @description Super-Calc 서비스 전면 랜딩페이지 (고객 Hook 단계)
 *
 * [전략 유형] C 유형 (결과 지향형) — 복잡한 영양제 가격 비교·성분 검증 과정을 단순화
 * [핵심 목표] 편의성(Simplification) & 결과물(Outcome)
 *
 * [섹션 구성]
 * 1. Hero Section — 헤드라인 + 서브헤드 + CTA
 * 2. Social Proof — 수치 증명 (사용자 수, 비교 건수, 검증 원료 수)
 * 3. Value Proposition — 혜택 중심 3가지 카드
 * 4. Input-Output Diagram — "검색하면 결과가 나온다" 단순 구조
 * 5. Result Gallery — 실제 서비스 화면 미리보기
 * 6. ROI / Before-After — 도입 전후 비교
 * 7. Final CTA — 하단 전환 유도
 * 8. Footer
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  ShieldCheck,
  TrendingDown,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  BadgeCheck,
  ChevronDown,
  Star,
  Users,
  BarChart3,
  FlaskConical,
  ExternalLink,
} from "lucide-react";

/* ─────────────────────────── 상수 ─────────────────────────── */

const STATS = [
  { label: "누적 비교 건수", value: "128,400+", icon: BarChart3 },
  { label: "검증 완료 원료", value: "1,240", icon: FlaskConical },
  { label: "월간 활성 사용자", value: "34,000+", icon: Users },
  { label: "사용자 만족도", value: "4.8 / 5", icon: Star },
];

const VALUE_CARDS = [
  {
    icon: TrendingDown,
    title: "1일 단가 기준 최저가",
    desc: "총 가격이 아닌, 하루에 실제로 드는 비용 기준으로 비교합니다. 60일분 vs 30일분도 공정하게.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: ShieldCheck,
    title: "식약처 인정 원료 검증",
    desc: "각 성분이 식약처 고시형·개별인정형 원료인지 자동 확인. 근거 문서까지 원클릭 열람.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: Zap,
    title: "광고 없는 순수 데이터",
    desc: "제휴·광고 수익 0원. 오직 데이터 투명성만을 기준으로 설계된 비교 엔진입니다.",
    color: "from-violet-500 to-purple-400",
  },
];

const WORKFLOW_STEPS = [
  { step: "1", label: "성분명 검색", sub: "예: NMN, 비타민D, 오메가3" },
  { step: "⚡", label: "Super-Calc 엔진", sub: "1일 단가 계산 + 식약처 DB 매칭" },
  { step: "✓", label: "결과 확인", sub: "최저가 순위 + 인정 현황 뱃지" },
];

const BEFORE_AFTER = [
  { label: "가격 비교 시간", before: "평균 47분", after: "3초", icon: Clock },
  { label: "성분 검증 정확도", before: "개인 판단", after: "식약처 DB 기반", icon: ShieldCheck },
  { label: "비교 기준", before: "총 가격 (불공정)", after: "1일 단가 (공정)", icon: BadgeCheck },
];

const ROTATING_KEYWORDS = ["비타민D", "오메가3", "프로바이오틱스", "NMN", "마그네슘", "콜라겐"];

/* ─────────────────────────── 컴포넌트 ─────────────────────────── */

export function LandingPage() {
  const navigate = useNavigate();
  const [keywordIndex, setKeywordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setKeywordIndex((prev) => (prev + 1) % ROTATING_KEYWORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const goToApp = useCallback(() => {
    navigate("/app");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ━━━ Minimal Top Bar ━━━ */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Super-Calc</span>
          </div>
          <button
            onClick={goToApp}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            서비스 바로가기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ━━━ ① Hero Section ━━━ */}
      <section className="pt-28 pb-16 px-5 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-100/30 rounded-full blur-3xl pointer-events-none" />

        <div
          className={`max-w-2xl mx-auto text-center relative z-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            식약처 공식 데이터 기반
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-5 tracking-tight">
            영양제, 진짜 가격을
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              3초 만에
            </span>{" "}
            찾아드립니다
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-lg mx-auto">
            1일 단가 기준 최저가 비교부터 식약처 기능성 원료 인정 여부까지.
            <br className="hidden sm:block" />
            광고 없는 순수 데이터로, 현명한 선택을 도와드립니다.
          </p>

          {/* Fake search bar as CTA */}
          <div className="max-w-md mx-auto mb-6">
            <button
              onClick={goToApp}
              className="w-full group flex items-center gap-3 px-5 py-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 shadow-lg shadow-slate-100 hover:shadow-blue-100 transition-all duration-300"
            >
              <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span className="flex-1 text-left text-slate-400 group-hover:text-slate-500 transition-colors">
                <span className="inline-block animate-pulse">{ROTATING_KEYWORDS[keywordIndex]}</span>
                <span className="text-slate-300"> 검색해보세요</span>
              </span>
              <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200">
                검색
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            회원가입 없이 바로 이용 가능 · 완전 무료
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-10 animate-bounce">
          <ChevronDown className="w-5 h-5 text-slate-300" />
        </div>
      </section>

      {/* ━━━ ③ Social Proof — 수치 증명 ━━━ */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ ④ Value Proposition ━━━ */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              왜 Super-Calc 인가요?
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              기능이 아닌, 당신이 얻게 될 <strong className="text-slate-700">혜택</strong>을 말씀드립니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {VALUE_CARDS.map((card) => (
              <div
                key={card.title}
                className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform`}
                >
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ C유형: Input-Output Diagram ━━━ */}
      <section className="py-16 px-5 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              검색 한 번이면 끝
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              복잡한 비교 과정은 Super-Calc이 대신합니다
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0">
            {WORKFLOW_STEPS.map((ws, i) => (
              <div key={ws.label} className="flex items-center gap-4 md:flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 ${
                      i === 1
                        ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-200"
                        : "bg-white border-2 border-slate-200 text-slate-700"
                    }`}
                  >
                    {ws.step}
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{ws.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{ws.sub}</div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0 hidden md:block" />
                )}
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ChevronDown className="w-5 h-5 text-slate-300 flex-shrink-0 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ C유형: Result Gallery (서비스 미리보기) ━━━ */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
              이런 결과를 받아보세요
            </h2>
            <p className="text-slate-500 text-sm sm:text-base">
              실제 Super-Calc 비교 결과 화면입니다
            </p>
          </div>

          {/* Mock result card preview */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-100 overflow-hidden">
              {/* Mock header */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-slate-400">super-calc.app</span>
              </div>

              <div className="p-5 space-y-4">
                {/* Mock search result */}
                <div className="text-sm font-bold text-slate-900">NMN · 총 4건</div>

                {[
                  { brand: "바이오헬스", name: "NMN + 레스베라트롤 복합", cost: 350, badge: "최저가", badgeColor: "bg-blue-100 text-blue-700" },
                  { brand: "퓨어라이프", name: "NMN 150mg 저용량", cost: 680, badge: "인정", badgeColor: "bg-green-100 text-green-700" },
                  { brand: "헬스케어랩", name: "프리미엄 NMN 250mg", cost: 850, badge: "주의", badgeColor: "bg-yellow-100 text-yellow-700" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-slate-400">{item.brand}</div>
                      <div className="text-xs font-semibold text-slate-800 truncate">{item.name}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-blue-600">₩{item.cost}/일</div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA (mid-page) */}
          <div className="text-center mt-10">
            <button
              onClick={goToApp}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              지금 무료로 비교해보기
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ━━━ C유형: Before & After (ROI) ━━━ */}
      <section className="py-16 px-5 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
              Super-Calc 이전 vs 이후
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              영양제 선택에 들이던 시간과 불확실성, 이제 끝내세요
            </p>
          </div>

          <div className="space-y-4">
            {BEFORE_AFTER.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-4 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50"
              >
                <row.icon className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200 mb-1">{row.label}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-500 line-through">{row.before}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="text-blue-300 font-bold">{row.after}</span>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Final CTA ━━━ */}
      <section className="py-20 px-5 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mb-8">
            회원가입도, 비용도 필요 없습니다.
            <br />
            성분명 하나만 검색하면 됩니다.
          </p>
          <button
            onClick={goToApp}
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            무료로 영양제 비교하기
            <ExternalLink className="w-5 h-5" />
          </button>
          <p className="text-xs text-slate-400 mt-4">
            광고 없음 · 데이터 수집 없음 · 완전 무료
          </p>
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <footer className="py-8 px-5 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">SC</span>
            </div>
            <span className="font-bold text-slate-700 text-sm">Super-Calc</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            본 서비스는 의료적 진단·치료 목적이 아닙니다.
          </p>
          <p className="text-xs text-slate-400">
            © 2026 Super-Calc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
