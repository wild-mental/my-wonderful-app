import { Outlet, Link, useLocation } from "react-router";
import { ShieldCheck, LogOut, ArrowLeft } from "lucide-react";

export function AdminLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/admin/dashboard";

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!isDashboard && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-slate-300 hover:text-white mr-2"
                title="대시보드로 돌아가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Super-Calc 관리자</h1>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">로그아웃</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
