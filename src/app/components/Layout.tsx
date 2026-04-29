import { Outlet, Link } from "react-router";
import { Search, Menu, X, Home as HomeIcon } from "lucide-react";
import { useState } from "react";

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-bold text-slate-900">Super-Calc</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/app" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-slate-600" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-14 right-0 bottom-0 w-64 bg-white shadow-xl z-50 transform transition-transform">
            <nav className="p-4 space-y-2">
              <Link
                to="/app"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <HomeIcon className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">Home</span>
              </Link>
              <Link
                to="/app"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Search className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-900">Search</span>
              </Link>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                  <span className="text-xs text-slate-600">U</span>
                </div>
                <span className="font-medium text-slate-900">My Page</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-4">
        <div className="max-w-md mx-auto px-4">
          <p className="text-xs text-slate-600 text-center">
            본 서비스는 의료적 진단/치료 목적이 아닙니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
