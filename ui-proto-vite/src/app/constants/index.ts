import { AlertTriangle, Check, HelpCircle, X, LucideIcon } from "lucide-react";
import { BadgeStatus } from "../types";

export const ERROR_TYPE_MAP: Record<string, string> = {
  price: "가격 정보 오류",
  ingredient: "성분 정보 오류",
  badge: "식약처 인정 현황 오류",
  product_info: "제품명/브랜드 오류",
  other: "기타",
};

export interface BadgeConfigType {
  bg: string;
  border: string;
  text: string;
  icon: LucideIcon;
  label: string;
}

export const BADGE_CONFIG: Record<BadgeStatus, BadgeConfigType> = {
  APPROVED: {
    bg: "bg-green-100",
    border: "border-green-300",
    text: "text-green-800",
    icon: Check,
    label: "인정",
  },
  CAUTION: {
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    text: "text-yellow-800",
    icon: AlertTriangle,
    label: "주의",
  },
  NOT_APPROVED: {
    bg: "bg-red-100",
    border: "border-red-300",
    text: "text-red-800",
    icon: X,
    label: "미인정",
  },
  UNREGISTERED: {
    bg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-700",
    icon: HelpCircle,
    label: "식약처 미등재 원료",
  },
};
