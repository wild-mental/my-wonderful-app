import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Check, Mail, Lock, User, Shield } from "lucide-react";
import { toast } from "sonner";

export function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeMarketing: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepOne = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("회원가입이 완료되었습니다!", {
      description: "Super-Calc에 오신 것을 환영합니다.",
    });

    setIsSubmitting(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">SC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Super-Calc</h1>
          <p className="text-slate-600 mt-1">진짜 가격, 진짜 정보</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {step > 1 ? <Check className="w-5 h-5" /> : "1"}
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`} />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            2
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 ? (
            <form onSubmit={handleStepOne}>
              <h2 className="text-xl font-bold text-slate-900 mb-6">계정 정보 입력</h2>

              <div className="space-y-4 mb-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="홍길동"
                      required
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="example@email.com"
                      required
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="8자 이상"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="비밀번호 재입력"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors"
              >
                다음 단계
              </button>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit}>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-900">제로 마케팅 인증</h2>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 leading-relaxed">
                  Super-Calc는 <span className="font-semibold">광고 없는 순수 데이터 서비스</span>를
                  지향합니다. 마케팅 수신 동의를 거부하셔도 모든 서비스를 100% 이용하실 수 있습니다.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="border border-slate-200 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeMarketing}
                      onChange={(e) => handleInputChange("agreeMarketing", e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 mb-1">
                        마케팅 정보 수신 동의 (선택)
                      </div>
                      <div className="text-sm text-slate-600">
                        신규 기능, 업데이트 소식을 이메일로 받아보실 수 있습니다.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-900">
                      <div className="font-semibold mb-1">마케팅 동의 없이도 모든 기능 이용 가능</div>
                      <ul className="space-y-1 text-green-800">
                        <li>• 영양제 가격 비교</li>
                        <li>• 식약처 인정 현황 확인</li>
                        <li>• 제품 등록 요청</li>
                        <li>• 오류 신고 및 공유</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-4 rounded-lg transition-colors"
                >
                  이전
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors"
                >
                  {isSubmitting ? "가입 중..." : "회원가입 완료"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
