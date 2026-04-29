import { useParams, Link } from "react-router";
import { Share2, ExternalLink, ArrowRight } from "lucide-react";

const MOCK_SHARED_PRODUCT = {
  id: 1,
  image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
  brand: "헬스케어랩",
  name: "프리미엄 NMN 250mg",
  dailyCost: 850,
  finalPrice: 25500,
  packageInfo: "30일분",
  sharedBy: "건강한하루",
};

export function ShareLanding() {
  const { shareId } = useParams<{ shareId: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Share Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Share2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-600">
            {MOCK_SHARED_PRODUCT.sharedBy}님이 공유한 제품
          </span>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="aspect-square w-full bg-slate-100">
            <img
              src={MOCK_SHARED_PRODUCT.image}
              alt={MOCK_SHARED_PRODUCT.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6">
            <div className="text-sm text-slate-500 mb-2">{MOCK_SHARED_PRODUCT.brand}</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              {MOCK_SHARED_PRODUCT.name}
            </h1>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs text-blue-700 mb-1">1일 단가</div>
                  <div className="text-3xl font-bold text-blue-600">
                    ₩{MOCK_SHARED_PRODUCT.dailyCost.toLocaleString()}
                    <span className="text-base text-slate-500 ml-1">/ 1일</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">실지불가</div>
                  <div className="text-xl font-semibold text-slate-700">
                    ₩{MOCK_SHARED_PRODUCT.finalPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">{MOCK_SHARED_PRODUCT.packageInfo}</div>
                </div>
              </div>
            </div>

            <Link
              to={`/app/product/${MOCK_SHARED_PRODUCT.id}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              상세 정보 보기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white text-center shadow-lg">
          <h2 className="text-xl font-bold mb-2">Super-Calc</h2>
          <p className="text-blue-100 text-sm mb-4">
            영양제 진짜 가격 비교 + 식약처 인정 여부 확인
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            다른 제품도 비교하기
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-slate-500 mt-6">
          본 서비스는 의료적 진단/치료 목적이 아닙니다.
        </p>
      </div>
    </div>
  );
}
