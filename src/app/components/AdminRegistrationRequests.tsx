import { Check, X, Mail } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { RegistrationRequest } from "../types";
import { MOCK_REQUESTS } from "../data/mock";

export function AdminRegistrationRequests() {
  const [requests, setRequests] = useState<RegistrationRequest[]>(MOCK_REQUESTS);

  const handleApprove = useCallback((id: number) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "approved" as const } : req))
    );
    toast.success("등록 요청이 승인되었습니다.");
  }, []);

  const handleReject = useCallback((id: number) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: "rejected" as const } : req))
    );
    toast.error("등록 요청이 거부되었습니다.");
  }, []);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">제품 등록 요청 관리</h1>
        <p className="text-slate-400">
          대기 중인 요청: {pendingRequests.length}건
        </p>
      </div>


        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">대기 중인 요청</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    성분명
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    이메일
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    요청 시간
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      대기 중인 요청이 없습니다.
                    </td>
                  </tr>
                ) : (
                  pendingRequests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-700 last:border-b-0">
                      <td className="px-6 py-4 text-white font-medium">
                        {request.ingredientName}
                      </td>
                      <td className="px-6 py-4">
                        {request.email ? (
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{request.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">미제공</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {request.requestDate}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            title="승인"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            title="거부"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Processed Requests */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">처리 완료</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    성분명
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    이메일
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    요청 시간
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedRequests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-700 last:border-b-0">
                    <td className="px-6 py-4 text-white font-medium">
                      {request.ingredientName}
                    </td>
                    <td className="px-6 py-4">
                      {request.email ? (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{request.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">미제공</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {request.requestDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {request.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 text-sm font-medium rounded-full">
                          <Check className="w-3 h-3" />
                          승인됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/20 text-red-400 text-sm font-medium rounded-full">
                          <X className="w-3 h-3" />
                          거부됨
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
}
