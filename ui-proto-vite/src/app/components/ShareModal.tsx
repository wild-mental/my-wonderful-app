import { X, Share2, Link2, MessageCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productUrl: string;
}

export function ShareModal({ isOpen, onClose, productName, productUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다.", {
        description: "원하는 곳에 붙여넣기 하세요.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  const handleKakaoShare = () => {
    // Mock Kakao share functionality
    toast.success("카카오톡으로 공유", {
      description: "실제 환경에서는 카카오톡 공유 기능이 작동됩니다.",
    });
    onClose();
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
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">공유하기</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm font-medium text-slate-900 line-clamp-2">{productName}</p>
            </div>

            <div className="space-y-3">
              {/* Kakao Share */}
              <button
                onClick={handleKakaoShare}
                className="w-full flex items-center gap-4 px-4 py-4 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-slate-900" />
                <span className="font-semibold text-slate-900">카카오톡으로 공유</span>
              </button>

              {/* Copy URL */}
              <button
                onClick={handleCopyUrl}
                className="w-full flex items-center gap-4 px-4 py-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors relative"
              >
                {copied ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Link2 className="w-6 h-6 text-slate-700" />
                )}
                <span className="font-semibold text-slate-900">
                  {copied ? "복사 완료!" : "링크 복사"}
                </span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">URL:</span>
                <br />
                <span className="break-all">{productUrl}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
