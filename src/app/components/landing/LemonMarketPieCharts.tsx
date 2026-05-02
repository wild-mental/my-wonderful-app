import { useState } from "react";

type Slice = {
  key: string;
  label: string;
  value: number;
  start: string;
  end: string;
  desc: string;
};

type PieData = {
  id: string;
  title: string;
  source: string;
  defaultLabel: string;
  defaultValue: string;
  defaultDesc: string;
  slices: [Slice, Slice];
};

const PIES: readonly PieData[] = [
  {
    id: "pie-content",
    title: "온라인 콘텐츠 구성",
    source: "공정거래위 2023",
    defaultLabel: "광고·협찬",
    defaultValue: "72.3%",
    defaultDesc: "검색 결과 10건 중 7건은 협찬·광고 후기",
    slices: [
      {
        key: "ad",
        label: "광고·협찬 후기",
        value: 72.3,
        start: "#FBBF24",
        end: "#EA580C",
        desc: "검색 결과 10건 중 7건이 광고·협찬 콘텐츠입니다.",
      },
      {
        key: "pure",
        label: "순수 정보·리뷰",
        value: 27.7,
        start: "#34D399",
        end: "#0F766E",
        desc: "협찬 표기 없는 자발적 리뷰는 3건뿐.",
      },
    ],
  },
  {
    id: "pie-give-up",
    title: "성분 비교 의향",
    source: "식약처 2021",
    defaultLabel: "비교 포기",
    defaultValue: "47.2%",
    defaultDesc: "절반 가까운 소비자가 성분 비교를 포기",
    slices: [
      {
        key: "give-up",
        label: "비교 포기",
        value: 47.2,
        start: "#A78BFA",
        end: "#C026D3",
        desc: "비교가 어려워 그냥 광고를 클릭합니다.",
      },
      {
        key: "try",
        label: "비교 시도",
        value: 52.8,
        start: "#22D3EE",
        end: "#2563EB",
        desc: "엑셀·메모로 직접 환산하는 소비자.",
      },
    ],
  },
] as const;

const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) => {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
};

const PieChart = ({ data }: { data: PieData }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const cx = 120;
  const cy = 120;
  const r = 96;

  let cursor = 0;
  const computed = data.slices.map((s) => {
    const startDeg = cursor;
    const endDeg = cursor + (s.value / 100) * 360;
    cursor = endDeg;
    const midDeg = (startDeg + endDeg) / 2;
    return { ...s, startDeg, endDeg, midDeg };
  });

  const active = hovered ? computed.find((s) => s.key === hovered) : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[240px] h-[240px]">
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`${data.title} 비중 차트`}
        >
          <defs>
            {computed.map((s) => (
              <linearGradient
                key={`${data.id}-${s.key}`}
                id={`${data.id}-${s.key}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={s.start} />
                <stop offset="100%" stopColor={s.end} />
              </linearGradient>
            ))}
            <filter
              id={`${data.id}-glow`}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={cx} cy={cy} r={r + 4} fill="rgba(255,255,255,0.03)" />

          {computed.map((s) => {
            const isHover = hovered === s.key;
            const isDimmed = hovered !== null && !isHover;
            const offset = isHover ? 10 : 0;
            const rad = ((s.midDeg - 90) * Math.PI) / 180;
            const tx = Math.cos(rad) * offset;
            const ty = Math.sin(rad) * offset;
            return (
              <path
                key={s.key}
                d={describeArc(cx, cy, r, s.startDeg, s.endDeg)}
                fill={`url(#${data.id}-${s.key})`}
                stroke="#020617"
                strokeWidth={2}
                strokeLinejoin="round"
                onMouseEnter={() => setHovered(s.key)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(s.key)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                style={{
                  transform: `translate(${tx}px, ${ty}px)`,
                  transition:
                    "transform 280ms cubic-bezier(.2,.85,.2,1), opacity 220ms",
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isHover ? `url(#${data.id}-glow)` : undefined,
                  cursor: "pointer",
                  outline: "none",
                }}
              />
            );
          })}

          <circle
            cx={cx}
            cy={cy}
            r={42}
            fill="#020617"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={1}
            style={{ pointerEvents: "none" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
          <div className="text-[9px] tracking-[0.22em] font-bold text-slate-400 mb-0.5 uppercase">
            {active ? active.label : data.defaultLabel}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
            {active ? `${active.value}%` : data.defaultValue}
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm font-bold text-slate-200">{data.title}</div>
        <div className="text-[11px] text-slate-500 tracking-wide">
          {data.source}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {computed.map((s) => {
          const isActive = hovered === s.key;
          const isDimmed = hovered !== null && !isActive;
          return (
            <button
              type="button"
              key={s.key}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(s.key)}
              onBlur={() => setHovered(null)}
              className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-white/10 border-white/25 text-white shadow-lg shadow-white/5"
                  : isDimmed
                    ? "bg-transparent border-white/5 text-slate-500"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <span
                aria-hidden
                className="inline-block w-2.5 h-2.5 rounded-full ring-1 ring-white/15"
                style={{
                  background: `linear-gradient(135deg, ${s.start}, ${s.end})`,
                }}
              />
              <span>{s.label}</span>
              <span className="tabular-nums text-slate-400 group-hover:text-slate-200">
                {s.value}%
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 text-center max-w-[260px] min-h-[2.5rem] leading-relaxed transition-opacity duration-200">
        {active ? active.desc : data.defaultDesc}
      </p>
    </div>
  );
};

export default function LemonMarketPieCharts() {
  return (
    <div className="mt-10 sm:mt-14">
      <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
        <div className="h-px w-10 bg-gradient-to-r from-transparent to-white/20" />
        <span className="text-[11px] tracking-[0.22em] font-bold text-slate-400 uppercase">
          Visualized
        </span>
        <div className="h-px w-10 bg-gradient-to-l from-transparent to-white/20" />
      </div>

      <div className="grid md:grid-cols-2 gap-10 sm:gap-12 max-w-3xl mx-auto">
        {PIES.map((p) => (
          <PieChart key={p.id} data={p} />
        ))}
      </div>
    </div>
  );
}
