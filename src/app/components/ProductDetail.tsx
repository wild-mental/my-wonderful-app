import { useParams } from "react-router";
import { ArrowLeft, ExternalLink, Check, AlertTriangle, X, HelpCircle, ChevronDown, Share2, Flag } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { ShareModal } from "./ShareModal";
import { ErrorReportModal } from "./ErrorReportModal";
import { SourceInfoModal } from "./SourceInfoModal";
import { useModal } from "../hooks/useModal";
import { MOCK_PRODUCT } from "../data/mock";
import { IngredientBadge } from "./shared/IngredientBadge";



export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const sourceModal = useModal();
  const shareModal = useModal();
  const errorReportModal = useModal();

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareUrl = `${window.location.origin}/share/${productId}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-14 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">목록으로 돌아가기</span>
        </button>
      </div>

      {/* Product Header */}
      <div className="bg-white px-4 py-6">
        <div className="w-full aspect-square max-w-xs mx-auto bg-slate-100 rounded-xl overflow-hidden mb-4">
          <img
            src={MOCK_PRODUCT.image}
            alt={MOCK_PRODUCT.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-sm text-slate-500 mb-1">{MOCK_PRODUCT.brand}</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{MOCK_PRODUCT.name}</h1>
        <div className="text-sm text-slate-600">1회 용량: {MOCK_PRODUCT.servingSize}</div>
      </div>

      {/* Price Section */}
      <div className="bg-white px-4 py-5 border-t border-slate-200">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">1일 단가</div>
            <div className="text-4xl font-bold text-blue-600">
              ₩{MOCK_PRODUCT.dailyCost.toLocaleString()}
              <span className="text-lg text-slate-500 ml-1">/ 1일</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">실지불가</div>
            <div className="text-xl font-semibold text-slate-700">
              ₩{MOCK_PRODUCT.finalPrice.toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">{MOCK_PRODUCT.packageInfo}</div>
          </div>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
          최저가 구매
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>

      {/* Badge Verification Section */}
      <div className="mt-4 bg-white px-4 py-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">식약처 기능성 원료 인정 현황</h2>
        <div className="space-y-4">
          {MOCK_PRODUCT.ingredients.map((ingredient, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{ingredient.name}</h3>
                  <div className="text-sm text-slate-600 mb-2">{ingredient.amount}</div>
                </div>
                <IngredientBadge status={ingredient.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Accordion */}
      <div className="mt-4 bg-white px-4 py-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">근거 및 출처</h2>
        <Accordion.Root type="single" collapsible className="space-y-3">
          {MOCK_PRODUCT.ingredients.map((ingredient, index) => (
            <Accordion.Item
              key={index}
              value={`item-${index}`}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors group">
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 mb-1">{ingredient.name}</div>
                    <IngredientBadge status={ingredient.status} />
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 py-4 bg-slate-50 border-t border-slate-200">
                <div className="text-sm text-slate-700 leading-relaxed">{ingredient.evidence}</div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-6 space-y-3">
        <button
          onClick={sourceModal.open}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-300"
        >
          출처 확인
          <ExternalLink className="w-4 h-4" />
        </button>

        <div className="flex gap-3">
          <button
            onClick={shareModal.open}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            공유하기
          </button>
          <button
            onClick={errorReportModal.open}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Flag className="w-4 h-4" />
            오류 신고
          </button>
        </div>
      </div>

      {/* Source Info Modal */}
      <SourceInfoModal 
        isOpen={sourceModal.isOpen} 
        onClose={sourceModal.close} 
      />

      {/* Ingredient Table */}
      <div className="mt-4 bg-white px-4 py-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">전체 성분표</h2>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  성분명
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
                  함량
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PRODUCT.ingredients.map((ingredient, index) => (
                <tr key={index} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 text-sm text-slate-900">{ingredient.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 text-right font-medium">
                    {ingredient.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={shareModal.close}
        productName={MOCK_PRODUCT.name}
        productUrl={shareUrl}
      />

      {/* Error Report Modal */}
      <ErrorReportModal
        isOpen={errorReportModal.isOpen}
        onClose={errorReportModal.close}
        productName={MOCK_PRODUCT.name}
        productId={productId}
      />
    </div>
  );
}
