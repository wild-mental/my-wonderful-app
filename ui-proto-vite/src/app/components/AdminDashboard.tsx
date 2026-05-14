import { Link } from "react-router";
import { FileText, AlertCircle, Users } from "lucide-react";
import { StatCard } from "./admin/StatCard";

export function AdminDashboard() {
  const stats = [
    { label: "대기 중인 제품 등록 요청", value: 12, color: "blue", icon: FileText },
    { label: "미처리 오류 신고", value: 8, color: "red", icon: AlertCircle },
    { label: "총 사용자", value: 1247, color: "green", icon: Users },
  ];

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              color={stat.color}
              icon={stat.icon}
            />
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/registration-requests"
          className="bg-blue-600 hover:bg-blue-700 rounded-xl p-6 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">제품 등록 요청 관리</h3>
              <p className="text-sm text-blue-100">사용자가 요청한 제품을 검토하고 승인합니다</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/error-reports"
          className="bg-red-600 hover:bg-red-700 rounded-xl p-6 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">오류 신고 관리</h3>
              <p className="text-sm text-red-100">사용자가 신고한 데이터 오류를 처리합니다</p>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
