import { useParams, Link } from "react-router";
import { ArrowLeft, AlertCircle, ExternalLink } from "lucide-react";

const MOCK_PRODUCTS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
    brand: "헬스케어랩",
    name: "프리미엄 NMN 250mg",
    servingSize: "1캡슐",
    dailyCost: 850,
    finalPrice: 25500,
    packageInfo: "30일분",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1550572017-4870094d3d2e?w=400",
    brand: "뉴트리원",
    name: "NMN 순도 99% 고함량",
    servingSize: "1정",
    dailyCost: 1200,
    finalPrice: 36000,
    packageInfo: "30일분",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400",
    brand: "바이오헬스",
    name: "NMN + 레스베라트롤 복합",
    servingSize: "2캡슐",
    dailyCost: 350,
    finalPrice: 21000,
    packageInfo: "60일분",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400",
    brand: "퓨어라이프",
    name: "NMN 150mg 저용량",
    servingSize: "1캡슐",
    dailyCost: 680,
    finalPrice: 20400,
    packageInfo: "30일분",
  },
];

export function CompareResults() {
  const { searchTerm } = useParams<{ searchTerm: string }>();
  const decodedTerm = decodeURIComponent(searchTerm || "");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <Link to="/app" className="flex items-center gap-2 text-slate-700 hover:text-slate-900">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">검색으로 돌아가기</span>
        </Link>
      </div>

      {/* Summary Header */}
      <div className="bg-white px-4 py-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">
          {decodedTerm} <span className="text-slate-500">· 총 {MOCK_PRODUCTS.length}건</span>
        </h1>
      </div>

      {/* Fallback Warning Banner */}
      <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">가격 정보 안내</p>
          <p>쿠팡 가격은 [2026-04-23 09:30] 기준입니다. 실시간 가격은 확인 중입니다.</p>
        </div>
      </div>

      {/* Product List */}
      <div className="px-4 py-4 space-y-4">
        {MOCK_PRODUCTS.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-1">{product.brand}</div>
                  <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="text-xs text-slate-600">
                    1회 용량: {product.servingSize}
                  </div>
                </div>
              </div>

              {/* Price Section - Daily Cost Emphasized */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">1일 단가</div>
                    <div className="text-3xl font-bold text-blue-600">
                      ₩{product.dailyCost.toLocaleString()}
                      <span className="text-base text-slate-500 ml-1">/ 1일</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">실지불가</div>
                    <div className="text-lg font-semibold text-slate-700">
                      ₩{product.finalPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">{product.packageInfo}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/app/product/${product.id}`}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-3 rounded-lg transition-colors text-center"
                  >
                    상세정보
                  </Link>
                  <button className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                    최저가 구매
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
