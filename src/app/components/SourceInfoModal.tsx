import { X } from "lucide-react";

interface SourceInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SourceInfoModal({ isOpen, onClose }: SourceInfoModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">데이터 출처</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">식약처 공식 자료</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• 건강기능식품 기능성 원료 인정 현황 (2026년 4월 기준)</li>
              <li>• 식품의약품안전처 고시 제2023-86호</li>
              <li>• 개별인정형 원료 데이터베이스</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">가격 정보</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• 쿠팡 오픈 API (2026-04-23 09:30 기준)</li>
              <li>• 네이버 쇼핑 가격비교 (수집 중)</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              본 정보는 참고용이며, 구매 전 반드시 제품 라벨 및 식약처 공식 사이트를
              확인하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
