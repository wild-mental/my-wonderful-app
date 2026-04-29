import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProductRegistrationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledIngredient?: string;
}

export function ProductRegistrationSheet({
  isOpen,
  onClose,
  prefilledIngredient = "",
}: ProductRegistrationSheetProps) {
  const [ingredientName, setIngredientName] = useState(prefilledIngredient);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("제품 등록 요청이 접수되었습니다.", {
      description: "검토 후 빠른 시일 내에 등록하겠습니다.",
    });

    setIsSubmitting(false);
    onClose();
    setIngredientName("");
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

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white rounded-t-2xl shadow-2xl max-w-md mx-auto">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">제품 등록 요청</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            <p className="text-sm text-slate-600 mb-6">
              찾으시는 성분이 아직 등록되지 않았어요. 요청하시면 검토 후 빠르게 추가하겠습니다.
            </p>

            <div className="space-y-4 mb-6">
              {/* Ingredient Name */}
              <div>
                <label htmlFor="ingredient" className="block text-sm font-medium text-slate-900 mb-2">
                  성분명 <span className="text-red-500">*</span>
                </label>
                <input
                  id="ingredient"
                  type="text"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  placeholder="예: 코엔자임 Q10"
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  placeholder="등록 완료 시 알림을 받으실 수 있습니다"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !ingredientName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors"
            >
              {isSubmitting ? "제출 중..." : "제출하기"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
