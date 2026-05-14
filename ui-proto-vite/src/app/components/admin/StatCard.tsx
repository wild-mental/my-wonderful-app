/**
 * @file StatCard.tsx
 * @description 어드민 대시보드용 주요 지표 표시 카드 컴포넌트
 * 
 * [개요]
 * 라벨, 수치, 색상, 아이콘을 props로 받아 일관된 프리미엄 UI 스타일의 카드 형태로 정보를 표시합니다.
 * React.memo를 사용하여 부모 컴포넌트 렌더링 시 불필요한 리렌더링을 방지합니다.
 */
import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  icon: LucideIcon;
  className?: string;
}

/**
 * 통계 지표 카드 컴포넌트
 * @param label 지표의 이름 (예: "총 사용자")
 * @param value 표시할 수치
 * @param color 포인트 색상 지정 (예: "blue")
 * @param icon Lucide 아이콘 컴포넌트
 */
export const StatCard = memo(function StatCard({ label, value, color, icon: Icon, className }: StatCardProps) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl bg-slate-800 p-6 shadow-sm ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-white/20",
      className
    )}>
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium tracking-wide text-slate-400 uppercase">
            {label}
          </h3>
          <Icon className={`w-5 h-5 text-${color}-400 opacity-80 transition-opacity duration-300 group-hover:opacity-100 group-hover:scale-110`} />
        </div>
        <p className="text-3xl font-bold tracking-tight text-white">
          {value}
        </p>
      </div>
      
      {/* 마우스 오버 시 부드럽게 나타나는 배경 효과 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
});
