/**
 * @file Home.tsx
 * @description 메인 홈페이지 (영양제 검색 및 최저가 비교 진입 화면)
 * 
 * [개요]
 * 사용자가 영양제 성분명을 검색하고 연관 자동완성을 확인하며, 
 * 미등록 제품에 대한 등록 요청 모달을 띄울 수 있는 서비스의 첫 화면입니다.
 * 
 * [함수 호출 구조 및 상태 흐름]
 * 1. 텍스트 입력 -> setSearchQuery 상태 업데이트 -> useDebounce에 의해 debouncedSearchQuery 지연 변경
 * 2. 입력 감지 -> setShowAutocomplete(true)를 통해 자동완성 Dropdown 노출
 * 3. 아이템 선택 혹은 Enter 입력 -> handleSearch(term) 호출 -> /compare/:term 경로로 라우팅
 * 4. 미등록 CTA 클릭 -> registrationSheet.open() 호출 -> ProductRegistrationSheet 모달 오픈
 */
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { Search, TrendingUp } from "lucide-react";
import { ProductRegistrationSheet } from "./ProductRegistrationSheet";
import { useModal } from "../hooks/useModal";
import { useDebounce } from "../hooks/useDebounce";

const POPULAR_INGREDIENTS = ["비타민D", "오메가3", "프로바이오틱스", "마그네슘", "콜라겐"];

const MOCK_AUTOCOMPLETE = [
  { id: 1, name: "NMN (니코틴아마이드 모노뉴클레오타이드)", matches: "NMN" },
  { id: 2, name: "NAD+ 부스터 (NMN 포함)", matches: "NMN" },
  { id: 3, name: "니코틴아마이드 리보사이드 + NMN", matches: "NMN" },
];

/**
 * 메인 홈 컴포넌트
 */
export function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const registrationSheet = useModal();
  const navigate = useNavigate();

  const handleSearch = useCallback((term: string) => {
    if (term.trim()) {
      navigate(`/app/compare/${encodeURIComponent(term)}`);
    }
  }, [navigate]);

  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ?
        <span key={i} className="bg-yellow-200 font-semibold">{part}</span> :
        part
    );
  }, []);

  return (
    <div className="px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          영양제, 진짜 가격을 찾아드립니다
        </h1>
        <p className="text-slate-600">
          1일 단가 기준 최저가 비교 + 식약처 인정 여부 확인
        </p>
      </div>

      {/* Search Box */}
      <div className="relative mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAutocomplete(e.target.value.length > 0);
            }}
            onFocus={() => setShowAutocomplete(searchQuery.length > 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchQuery);
                setShowAutocomplete(false);
              }
            }}
            placeholder="성분명을 입력하세요 (예: NMN, 비타민D)"
            className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-base"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showAutocomplete && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-10">
            {MOCK_AUTOCOMPLETE.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleSearch(item.name);
                  setShowAutocomplete(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700">
                    {highlightMatch(item.name, searchQuery)}
                  </span>
                </div>
              </button>
            ))}

            {/* Unregistered CTA */}
            <button
              onClick={() => {
                registrationSheet.open();
                setShowAutocomplete(false);
              }}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
            >
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{searchQuery}</span> 성분이 없나요?
              </span>
              <span className="text-sm text-blue-600 font-medium group-hover:underline">
                제품 등록 요청하기
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Search Chips */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">인기 검색어</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_INGREDIENTS.map((ingredient) => (
            <button
              key={ingredient}
              onClick={() => handleSearch(ingredient)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {ingredient}
            </button>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Super-Calc는?</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• 1일 단가 기준 영양제 최저가 비교</li>
          <li>• 식약처 기능성 원료 인정 여부 검증</li>
          <li>• 광고 없는 순수 데이터 기반 서비스</li>
        </ul>
      </div>

      {/* Product Registration Sheet */}
      <ProductRegistrationSheet
        isOpen={registrationSheet.isOpen}
        onClose={registrationSheet.close}
        prefilledIngredient={searchQuery}
      />
    </div>
  );
}
