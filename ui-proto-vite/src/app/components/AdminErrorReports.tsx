import { Link } from "react-router";
import { Check, ExternalLink, Mail } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { ErrorReport } from "../types";
import { MOCK_REPORTS } from "../data/mock";
import { ERROR_TYPE_MAP } from "../constants";



export function AdminErrorReports() {
  const [reports, setReports] = useState<ErrorReport[]>(MOCK_REPORTS);

  const handleResolve = useCallback((id: number) => {
    setReports((prev) =>
      prev.map((report) => (report.id === id ? { ...report, status: "resolved" as const } : report))
    );
    toast.success("오류 신고가 처리되었습니다.");
  }, []);

  const pendingReports = reports.filter((r) => r.status === "pending");
  const resolvedReports = reports.filter((r) => r.status === "resolved");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">오류 신고 관리</h1>
        <p className="text-slate-400">
          미처리 신고: {pendingReports.length}건
        </p>
      </div>

        {/* Pending Reports */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">미처리 신고</h2>
          <div className="space-y-4">
            {pendingReports.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
                미처리 신고가 없습니다.
              </div>
            ) : (
              pendingReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {report.productName}
                        </h3>
                        <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded">
                          {ERROR_TYPE_MAP[report.errorType]}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 mb-3">
                        신고 시간: {report.reportDate}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {report.email ? (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{report.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">이메일 미제공</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/product/${report.productId}`}
                        target="_blank"
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        제품 보기
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleResolve(report.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        처리 완료
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resolved Reports */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">처리 완료</h2>
          <div className="space-y-4">
            {resolvedReports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {report.productName}
                      </h3>
                      <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded">
                        {ERROR_TYPE_MAP[report.errorType]}
                      </span>
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded">
                        처리됨
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      신고 시간: {report.reportDate}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </>
  );
}
