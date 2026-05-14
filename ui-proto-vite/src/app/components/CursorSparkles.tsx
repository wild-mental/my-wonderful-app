import { useEffect, useRef } from "react";

/**
 * 밝은 노란색 → 짙은 노란색 그라디언트 팔레트.
 * 각 파티클은 이 중 하나를 무작위로 채택해 톤이 다양하게 분포합니다.
 */
const SPARKLE_COLORS = [
  "#FFFDE7",
  "#FFF9C4",
  "#FFF59D",
  "#FFEE58",
  "#FFEB3B",
  "#FDD835",
  "#FBC02D",
  "#F9A825",
  "#F57F17",
] as const;

type Sparkle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  size: number;
  color: string;
  rot: number;
  rotSpeed: number;
};

const MAX_SPARKLES = 200;

/**
 * 커서 위치를 따라 노란색 톤의 스파클을 분출하는 전역 오버레이.
 * - 커서 속도(px/ms)를 EMA로 평활화 후 분당 스폰 수에 비례시켜
 *   "천천히 움직이면 적게, 빠르게 움직이면 많이" 효과를 구현합니다.
 * - 터치 전용 디바이스나 prefers-reduced-motion 사용자에게는 비활성화됩니다.
 */
export default function CursorSparkles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    if (reducedMotion || noHover) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const sparkles: Sparkle[] = [];
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    let smoothedSpeed = 0;
    let initialized = false;

    const spawn = (x: number, y: number, count: number, speed: number) => {
      for (let i = 0; i < count; i++) {
        if (sparkles.length >= MAX_SPARKLES) break;
        const angle = Math.random() * Math.PI * 2;
        const burst = 0.04 + Math.random() * 0.12 + Math.min(0.18, speed * 0.05);
        sparkles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * burst,
          vy: Math.sin(angle) * burst - 0.04,
          life: 0,
          ttl: 700 + Math.random() * 900,
          size: 1.6 + Math.random() * 3.2,
          color:
            SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
          rot: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.012,
        });
      }
    };

    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;

      if (!initialized) {
        lastX = x;
        lastY = y;
        lastT = now;
        initialized = true;
        return;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const dt = Math.max(1, now - lastT);
      const dist = Math.hypot(dx, dy);
      const instSpeed = dist / dt;

      smoothedSpeed = smoothedSpeed * 0.7 + instSpeed * 0.3;

      // 속도(px/ms) → 이번 이벤트에서 스폰할 파티클 수.
      // 0.05 미만(미세이동)은 거의 안 나오고, 빠르게 움직일수록 최대 4개까지 분출.
      const baseRate = Math.min(4, smoothedSpeed * 1.6);
      const minSparks =
        smoothedSpeed < 0.05 ? 0 : Math.random() < 0.5 ? 0 : 1;
      const count = Math.max(
        minSparks,
        Math.round(baseRate * (0.7 + Math.random() * 0.6))
      );

      if (count > 0) spawn(x, y, count, smoothedSpeed);

      lastX = x;
      lastY = y;
      lastT = now;
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const drawSparkle = (s: Sparkle, alpha: number) => {
      const r = s.size;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "lighter";

      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4);
      halo.addColorStop(0, s.color);
      halo.addColorStop(0.45, `${s.color}AA`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, r * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-r * 2.6, 0);
      ctx.lineTo(r * 2.6, 0);
      ctx.moveTo(0, -r * 2.6);
      ctx.lineTo(0, r * 2.6);
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.8, r * 0.45), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    let rafId = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(48, now - prev);
      prev = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.life += dt;
        if (s.life >= s.ttl) {
          sparkles.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy -= 0.00006 * dt;
        s.vx *= 0.992;
        s.rot += s.rotSpeed * dt;

        const t = s.life / s.ttl;
        const alpha = (1 - t) * (1 - t);
        drawSparkle(s, alpha);
      }

      smoothedSpeed *= 0.94;

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
}
