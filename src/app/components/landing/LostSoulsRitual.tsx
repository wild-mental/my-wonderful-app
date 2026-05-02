/**
 * @file LostSoulsRitual.tsx
 * @description 히어로 섹션 직후에 들어가는 풍자형 "공포의 영양제 비교 의식" 섹션.
 *
 * [컨셉]
 *  - 1시간 이상 메모장/엑셀로 영양제를 비교하는 사람들을 호러 장르로 풍자.
 *  - CodePen "Halloween Countdown" (bato-web-agency / KwVmOOG) 스타일을 차용:
 *    다크 배경 + 마젠타 글로우, Jolly Lodger 디스플레이 폰트, 매달린 거미,
 *    카운터 박스, 빛나는 눈의 스컬, 태그 칩, 거미줄 하단 그라디언트.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  ClipboardList,
  Coffee,
  Ghost,
  HandCoins,
  Skull,
  Sparkles,
} from "lucide-react";

interface LostSoulsRitualProps {
  /** 부모(랜딩페이지)에서 받은 CTA 스크롤 핸들러 */
  onCtaClick?: () => void;
}

const RITUAL_TAGS = [
  "엑셀 지옥",
  "메모장 무덤",
  "환율 계산기 강제노동",
  "협찬 후기 함정",
  "스크린샷 100장",
  "약국 직원 점괘",
  "쿠팡 vs 아이허브 끝장 토론",
  "새벽 3시의 후회",
] as const;

const LOST_SOULS = [
  {
    code: "박과장",
    age: 38,
    title: "엑셀에 미친 자",
    quote:
      "환율 1,328원, mg/캡슐, 1일 권장량… 셀이 끊임없이 늘어납니다.",
    deeds: ["VLOOKUP 12회", "환율 수동 입력", "새벽 3시까지 비교"],
    icon: Calculator,
    glow: "from-rose-500/40 to-pink-600/40",
    badge: "EXCEL CULTIST",
  },
  {
    code: "김대리",
    age: 29,
    title: "메모장 무덤지기",
    quote: "스프링 노트 7권째. 결국 손글씨가 가장 정확하다고 믿습니다.",
    deeds: ["손글씨 환산", "포스트잇 247장", "결국 다시 처음부터"],
    icon: ClipboardList,
    glow: "from-fuchsia-500/40 to-purple-600/40",
    badge: "NOTEBOOK KEEPER",
  },
  {
    code: "이팀장",
    age: 45,
    title: "협찬 후기의 노예",
    quote: "블로그 1~10등 다 읽어봤지만 누가 진짜인지 도무지 모르겠습니다.",
    deeds: ["블로그 32개 정독", "광고 글 식별 실패", "전부 같은 제품 추천"],
    icon: HandCoins,
    glow: "from-amber-500/40 to-orange-600/40",
    badge: "AD VICTIM",
  },
  {
    code: "최부장",
    age: 52,
    title: "약국 직원 신봉자",
    quote: '"이거 요즘 잘 나가요" 한 마디에 9만 4천 원이 결제됐습니다.',
    deeds: ["성분명 모름", "구매 후 검색", "한 달 뒤 다시 약국"],
    icon: Coffee,
    glow: "from-sky-500/40 to-cyan-600/40",
    badge: "PHARMACY BELIEVER",
  },
] as const;

/** 매달려서 살랑이는 거미 */
function HangingSpider({
  leftPercent,
  threadHeight,
  delay,
  size = 28,
}: {
  leftPercent: number;
  threadHeight: number;
  delay: number;
  size?: number;
}) {
  return (
    <div
      className="lsr-spider"
      style={{
        left: `${leftPercent}%`,
        animationDelay: `${delay}s`,
      }}
      aria-hidden
    >
      <span className="lsr-thread" style={{ height: threadHeight }} />
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="lsr-spider-body"
        style={{ marginTop: -size * 0.25 }}
      >
        {/* legs */}
        <g
          stroke="#1f2024"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M5 12 Q2 11 2 8" />
          <path d="M5 14 Q2 15 2 18" />
          <path d="M7 11 Q4 9 4 6" />
          <path d="M7 15 Q4 17 4 20" />
          <path d="M19 12 Q22 11 22 8" />
          <path d="M19 14 Q22 15 22 18" />
          <path d="M17 11 Q20 9 20 6" />
          <path d="M17 15 Q20 17 20 20" />
        </g>
        {/* body */}
        <ellipse cx="12" cy="13" rx="5" ry="4.4" fill="#0d0d10" />
        <ellipse cx="12" cy="10" rx="3.4" ry="2.6" fill="#0d0d10" />
        {/* eyes */}
        <circle cx="10.7" cy="9.4" r="0.55" fill="#f84397" />
        <circle cx="13.3" cy="9.4" r="0.55" fill="#f84397" />
      </svg>
    </div>
  );
}

/** 빛나는 눈을 가진 미니멀 스컬 일러스트 */
function GlowingSkull() {
  const skullRef = useRef<HTMLDivElement | null>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!skullRef.current) return;
      const rect = skullRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / 25;
      const dy = (e.clientY - cy) / 25;
      const max = 6;
      setEyeOffset({
        x: Math.max(-max, Math.min(max, dx)),
        y: Math.max(-max, Math.min(max, dy)),
      });
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return (
    <div
      ref={skullRef}
      className="relative mx-auto w-[260px] h-[260px] sm:w-[320px] sm:h-[320px]"
      aria-hidden
    >
      {/* magenta glow behind skull */}
      <div className="absolute inset-0 rounded-full bg-[#f84397]/40 blur-[80px] lsr-pulse-glow" />
      {/* skull svg */}
      <svg
        viewBox="0 0 200 220"
        className="relative w-full h-full drop-shadow-[0_8px_30px_rgba(248,67,151,0.35)]"
      >
        <defs>
          <linearGradient id="skullGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f2ee" />
            <stop offset="100%" stopColor="#cdc7bf" />
          </linearGradient>
          <radialGradient id="eyeGrad">
            <stop offset="0%" stopColor="#fff0f6" />
            <stop offset="60%" stopColor="#f84397" />
            <stop offset="100%" stopColor="#7c1d4b" />
          </radialGradient>
        </defs>
        {/* skull shape */}
        <path
          d="M100 14 C 50 14, 22 50, 22 92 C 22 122, 36 142, 50 154 L 50 178 C 50 190, 60 198, 72 198 L 84 198 L 84 184 L 96 184 L 96 198 L 104 198 L 104 184 L 116 184 L 116 198 L 128 198 C 140 198, 150 190, 150 178 L 150 154 C 164 142, 178 122, 178 92 C 178 50, 150 14, 100 14 Z"
          fill="url(#skullGrad)"
          stroke="#1a1a1d"
          strokeWidth="2"
        />
        {/* eye sockets */}
        <ellipse cx="72" cy="100" rx="20" ry="22" fill="#0f0f12" />
        <ellipse cx="128" cy="100" rx="20" ry="22" fill="#0f0f12" />
        {/* nose */}
        <path
          d="M100 124 L 92 152 L 100 158 L 108 152 Z"
          fill="#0f0f12"
        />
        {/* teeth */}
        <g fill="#1a1a1d">
          <rect x="58" y="178" width="84" height="2" />
          <rect x="64" y="170" width="2" height="14" />
          <rect x="76" y="170" width="2" height="14" />
          <rect x="88" y="170" width="2" height="14" />
          <rect x="100" y="170" width="2" height="14" />
          <rect x="112" y="170" width="2" height="14" />
          <rect x="124" y="170" width="2" height="14" />
          <rect x="134" y="170" width="2" height="14" />
        </g>
        {/* glowing eyes — follows cursor */}
        <g
          style={{
            transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          <circle cx="72" cy="100" r="6" fill="url(#eyeGrad)" />
          <circle cx="128" cy="100" r="6" fill="url(#eyeGrad)" />
          <circle
            cx="72"
            cy="100"
            r="10"
            fill="#f84397"
            opacity="0.35"
          />
          <circle
            cx="128"
            cy="100"
            r="10"
            fill="#f84397"
            opacity="0.35"
          />
        </g>
      </svg>
    </div>
  );
}

/** "잃어버린 시간" 카운터 — 마운트 시점부터 흘러간 시간을 계속 증가 */
function LostTimeCounter() {
  const startedAt = useMemo(() => Date.now(), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // 풍자 효과: "지금까지 비교 작업으로 사라진 시간" — 약 1시간 35분 베이스 + 매초 +1초
  const baseSeconds = 1 * 3600 + 35 * 60;
  const total = baseSeconds + tick;
  const days = 0; // 하루는 안 갔다는 풍자(갈수도 있긴 합니다)
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  void startedAt;

  const items = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Minutes" },
    { value: seconds, label: "Seconds" },
  ];

  return (
    <div className="lsr-countdown grid grid-cols-4 gap-3 sm:gap-5 max-w-[560px] mx-auto">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col items-center gap-2">
          <div className="lsr-counter-box">
            <span className="lsr-display tabular-nums">
              {String(it.value).padStart(2, "0")}
            </span>
          </div>
          <div className="text-[11px] sm:text-sm tracking-[0.18em] uppercase text-[#b0b0b0]">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LostSoulsRitual({ onCtaClick }: LostSoulsRitualProps) {
  return (
    <section
      id="ritual"
      className="lsr-section relative overflow-hidden bg-[#1a1a1d] text-[#cfcfcf] py-20 sm:py-28 px-5"
    >
      {/* magenta blob top-right */}
      <div className="lsr-glow-blob pointer-events-none absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#f84397] opacity-50 blur-[180px]" />
      {/* purple blob bottom-left */}
      <div className="pointer-events-none absolute -bottom-40 -left-32 w-[28rem] h-[28rem] rounded-full bg-[#7c1d4b] opacity-50 blur-[200px]" />
      {/* spider-web pattern overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.85) 0%, transparent 60%), repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 26px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 26px), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.6) 18%, transparent 19%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.6) 32%, transparent 33%), radial-gradient(circle at 50% 100%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.6) 50%, transparent 51%)",
          maskImage:
            "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* 매달린 거미들 */}
      <div className="absolute inset-x-0 top-0 h-0 pointer-events-none" aria-hidden>
        <HangingSpider leftPercent={8} threadHeight={120} delay={0} />
        <HangingSpider leftPercent={24} threadHeight={70} delay={0.3} size={22} />
        <HangingSpider leftPercent={46} threadHeight={50} delay={0.6} size={32} />
        <HangingSpider leftPercent={70} threadHeight={100} delay={0.9} size={24} />
        <HangingSpider leftPercent={88} threadHeight={150} delay={1.2} />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* 상단 배지 */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f84397]/15 border border-[#f84397]/40 text-[#ff7fb8] text-[11px] sm:text-xs font-bold tracking-[0.22em]">
            <Skull className="w-3.5 h-3.5" />
            BASED ON A TRUE STORY · 2026 KOREA
          </span>
        </div>

        {/* 메인 헤딩 - Jolly Lodger */}
        <h2 className="lsr-display text-center text-white leading-[0.95] mb-5 text-[2.6rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-wide">
          당신은 아직도{" "}
          <span className="block sm:inline text-[#f84397] drop-shadow-[0_0_30px_rgba(248,67,151,0.5)]">
            영양제 비교 의식을
          </span>{" "}
          치르고 계신가요?
        </h2>

        <p className="text-center max-w-2xl mx-auto text-[#b0b0b0] text-base sm:text-lg leading-relaxed mb-12">
          한국의 평범한 사무실, 평범한 거실에서 매일 밤 벌어지는 진짜 호러.
          <br className="hidden sm:block" />
          모니터 두 개, 메모장 한 권, 식어버린 커피 — 그리고{" "}
          <span className="text-[#ff7fb8] font-bold">사라져버린 1시간 35분</span>.
        </p>

        {/* 잃어버린 시간 카운터 */}
        <div className="mb-4">
          <p className="text-center text-[11px] tracking-[0.25em] uppercase text-[#878787] mb-4">
            ⏳ 당신이 비교 작업으로 잃은 시간 (실시간)
          </p>
          <LostTimeCounter />
          <p className="mt-5 text-center text-xs text-[#7a7a7a]">
            ↑ 이 페이지를 떠나지 않으면 계속 늘어납니다. (네, 진짜로요.)
          </p>
        </div>

        {/* 스컬 + 4 lost souls */}
        <div className="mt-16 grid lg:grid-cols-[1fr,1.4fr] gap-10 lg:gap-14 items-center">
          {/* Skull illustration */}
          <div className="relative flex flex-col items-center">
            <GlowingSkull />
            <p className="lsr-display text-3xl sm:text-4xl text-white mt-2 tracking-wide text-center">
              엑셀의 신
            </p>
            <p className="text-xs text-[#878787] tracking-wider uppercase">
              매일 밤 새로운 제물을 받습니다
            </p>
          </div>

          {/* 4 lost souls */}
          <div className="grid sm:grid-cols-2 gap-4">
            {LOST_SOULS.map((s) => (
              <article
                key={s.code}
                className="lsr-card relative rounded-3xl p-5 sm:p-6 bg-[#26272b]/80 backdrop-blur border border-white/10 hover:border-[#f84397]/40 transition-all hover:-translate-y-1"
              >
                <div
                  className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${s.glow} opacity-60 blur-2xl pointer-events-none`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f84397]/15 text-[#ff7fb8] border border-[#f84397]/30">
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-black tracking-[0.2em] text-[#878787]">
                      {s.badge}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="lsr-display text-3xl text-white">
                      {s.code}
                    </span>
                    <span className="text-xs text-[#878787]">({s.age})</span>
                  </div>
                  <div className="text-[#ff7fb8] text-sm font-extrabold mb-3">
                    {s.title}
                  </div>

                  <blockquote className="relative pl-3 border-l-2 border-[#f84397]/40 mb-4">
                    <p className="text-[13px] sm:text-sm text-[#cfcfcf] leading-relaxed italic">
                      "{s.quote}"
                    </p>
                  </blockquote>

                  <ul className="space-y-1.5">
                    {s.deeds.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-2 text-[12px] text-[#9a9a9a]"
                      >
                        <Ghost className="w-3.5 h-3.5 text-[#f84397]/60 flex-shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* 태그 묘비 */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] tracking-[0.2em] uppercase text-[#878787] mb-5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff7fb8]" />
            여기 잠든 의식들
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
            {RITUAL_TAGS.map((t) => (
              <span key={t} className="lsr-tag">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <p className="lsr-display text-3xl sm:text-4xl md:text-5xl text-white mb-1 leading-tight">
            이 의식, 이제{" "}
            <span className="text-[#f84397]">5초면 끝납니다.</span>
          </p>
          <p className="text-sm text-[#9a9a9a] mb-7">
            엑셀과 메모장에 바쳤던 영혼, 이제 돌려받으세요.
          </p>

          <button
            type="button"
            onClick={onCtaClick}
            className="lsr-cta-btn group inline-flex items-center gap-2 px-7 sm:px-9 py-4 sm:py-4.5 rounded-full bg-[#f84397] hover:bg-white hover:text-[#f84397] text-white font-extrabold text-sm sm:text-base shadow-[0_0_40px_rgba(248,67,151,0.35)] transition-all"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            의식에서 탈출하기 — 사전 예약
          </button>
          <p className="mt-4 text-[11px] text-[#7a7a7a] tracking-wider">
            * 본 섹션의 인물은 모두 가상이지만, 어디선가 본 것 같다면 그건 우연이 아닙니다.
          </p>
        </div>
      </div>

      {/* 섹션 전용 스타일 */}
      <style>{`
        .lsr-section {
          font-family: "Nunito", system-ui, -apple-system, sans-serif;
        }
        .lsr-display {
          font-family: "Jolly Lodger", "Nunito", system-ui, sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
        }

        /* magenta glow blob — slow drift */
        .lsr-glow-blob {
          animation: lsr-drift 12s ease-in-out infinite;
        }
        @keyframes lsr-drift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50%      { transform: translate(-30px, 40px) scale(1.15); opacity: 0.65; }
        }

        /* skull glow pulse */
        .lsr-pulse-glow {
          animation: lsr-pulse 4s ease-in-out infinite;
        }
        @keyframes lsr-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%      { opacity: 0.7;  transform: scale(1.08); }
        }

        /* hanging spider */
        .lsr-spider {
          position: absolute;
          top: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: lsr-spider-jump 1.8s ease-in-out infinite alternate;
          will-change: transform;
        }
        .lsr-thread {
          display: block;
          width: 1.5px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.05));
        }
        .lsr-spider-body { display: block; }
        @keyframes lsr-spider-jump {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-14px); }
        }

        /* counter box — clip-path "torn paper / tombstone" */
        .lsr-counter-box {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(180deg, #2a2a2f 0%, #18181b 100%);
          border: 1px solid rgba(248, 67, 151, 0.35);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 0 30px rgba(248, 67, 151, 0.18),
            0 12px 30px rgba(0, 0, 0, 0.45);
          overflow: hidden;
        }
        .lsr-counter-box::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 30% 20%, rgba(248,67,151,0.22), transparent 60%),
            radial-gradient(circle at 70% 80%, rgba(124,29,75,0.35), transparent 65%);
          pointer-events: none;
        }
        .lsr-counter-box::after {
          content: "";
          position: absolute;
          inset: 6px;
          border-radius: 10px;
          border: 1px dashed rgba(255, 255, 255, 0.07);
          pointer-events: none;
        }
        .lsr-counter-box .lsr-display {
          position: relative;
          font-size: clamp(2.6rem, 9vw, 5rem);
          line-height: 1;
          color: #ffffff;
          text-shadow:
            0 0 14px rgba(248, 67, 151, 0.65),
            0 0 30px rgba(248, 67, 151, 0.35);
        }

        /* tag chip */
        .lsr-tag {
          padding: 0.65rem 1rem;
          border: 1px solid rgba(176,176,176,0.28);
          border-radius: 0.6rem;
          font-weight: 700;
          font-size: 0.85rem;
          color: #a8a8a8;
          background-color: rgba(255,255,255,0.03);
          backdrop-filter: blur(4px);
          transition: color 0.3s ease, border-color 0.3s ease, background-color 0.3s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .lsr-tag:hover {
          color: #fff0f6;
          border-color: rgba(248,67,151,0.55);
          background-color: rgba(248,67,151,0.08);
        }

        /* CTA button glow on hover */
        .lsr-cta-btn:hover {
          box-shadow: 0 0 60px rgba(248, 67, 151, 0.55);
          transform: translateY(-2px);
        }

        /* card — subtle tilt on hover */
        .lsr-card { transition: transform 0.3s ease, border-color 0.3s ease; }
        @media (prefers-reduced-motion: reduce) {
          .lsr-glow-blob, .lsr-pulse-glow, .lsr-spider {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
