import { memo } from "react";
import { BadgeStatus } from "../../types";
import { BADGE_CONFIG } from "../../constants";
import { cn } from "../ui/utils";

interface IngredientBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export const IngredientBadge = memo(function IngredientBadge({ status, className }: IngredientBadgeProps) {
  const config = BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border",
        config.bg,
        config.border,
        className
      )}
    >
      <Icon className={cn("w-4 h-4", config.text)} />
      <span className={cn("text-xs font-semibold", config.text)}>{config.label}</span>
    </div>
  );
});
