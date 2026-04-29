import { X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  productId?: string;
}

export function ErrorReportModal({
  isOpen,
  onClose,
  productName = "",
  productId = "",
}: ErrorReportModalProps) {
  const [errorType, setErrorType] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("오류 신고가 접수되었습니다.", {
      description: "빠른 시일 내에 확인 후 수정하겠습니다.",
    });

    setIsSubmitting(false);
    onClose();
    setErrorType("");
    setDescription("");
    setEmail("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-slate-900">오류 신고</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">제품:</span> {productName}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Error Type */}
              <div>
                <label htmlFor="errorType" className="block text-sm font-medium text-slate-900 mb-2">
                  오류 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  id="errorType"
                  value={errorType}
                  onChange={(e) => setErrorType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">선택해주세요</option>
                  <option value="price">가격 정보 오류</option>
                  <option value="ingredient">성분 정보 오류</option>
                  <option value="badge">식약처 인정 현황 오류</option>
                  <option value="product_info">제품명/브랜드 오류</option>
                  <option value="other">기타</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-900 mb-2">
                  상세 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="어떤 부분이 잘못되었는지 구체적으로 알려주세요"
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                  이메일 <span className="text-slate-500">(선택)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="수정 완료 시 알림을 받으실 수 있습니다"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !errorType || !description.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors"
            >
              {isSubmitting ? "제출 중..." : "신고 제출"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
