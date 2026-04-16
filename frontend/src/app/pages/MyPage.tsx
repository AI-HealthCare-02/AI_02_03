import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  User,
  ChevronRight,
  FileText,
  History,
  Download,
  Bell,
  Settings,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Flame,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { dashboardService } from "../../services/dashboard";

type DashboardData = {
  latest_score: number;
  latest_grade: string;
  character_state: string;
  shap_factors: string[];
  score_history: { score: number; created_at: string }[];
  lifestyle_summary: {
    bmi: number;
    sleep_hours: number;
    drink_amount: number;
    exercise: string;
  };
};

const gradeToLevel = (grade: string): "LOW" | "MID" | "HIGH" => {
  if (grade === "중증") return "HIGH";
  if (grade === "중등도") return "MID";
  return "LOW";
};

export function MyPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    dashboardService.get()
      .then((data) => setDashboard(data))
      .catch((err) => {
        if (err.response?.status !== 404) {
          console.error("대시보드 불러오기 실패", err);
        }
      })
      .finally(() => setDashboardLoading(false));
  }, []);

  const riskLevel = dashboard ? gradeToLevel(dashboard.latest_grade) : null;

  // score_history에서 마지막 두 값으로 점수 변화 계산
  const scoreChange = (() => {
    if (!dashboard || dashboard.score_history.length < 2) return null;
    const history = dashboard.score_history;
    return history[history.length - 1].score - history[history.length - 2].score;
  })();

  const currentStreak = 15; // API 미지원 — 추후 연동 필요

  // SHAP 요인 기반 간단 추천 메시지 생성
  const aiRecommendation = dashboard?.shap_factors?.length
    ? `${dashboard.shap_factors[0]} 관리에 집중해보세요`
    : "오늘도 건강한 하루를 보내세요";

  const getRiskLevelStyle = (level: string) => {
    switch (level) {
      case "LOW":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-900",
          border: "border-emerald-300",
          label: "낮음",
        };
      case "MID":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-900",
          border: "border-yellow-300",
          label: "보통",
        };
      case "HIGH":
        return {
          bg: "bg-red-100",
          text: "text-red-900",
          border: "border-red-300",
          label: "높음",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-900",
          border: "border-gray-300",
          label: "미정",
        };
    }
  };

  const riskStyle = getRiskLevelStyle(riskLevel ?? "");

  const menuItems = [
    {
      icon: Settings,
      title: "계정 관리",
      description: "프로필, 비밀번호 변경 및 계정 설정",
      link: "/mypage/account",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      icon: FileText,
      title: "헬스 데이터 관리",
      description: "건강 정보 수정 및 업데이트",
      link: "/mypage/survey",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: History,
      title: "활동 히스토리",
      description: "나의 건강 활동 기록 및 리포트 다운로드",
      link: "/mypage/history",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      icon: Bell,
      title: "알림 설정",
      description: "알림 및 푸시 설정",
      link: "/mypage/notifications",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">마이페이지</h2>
        <p className="text-gray-600">나의 건강 정보를 관리하고 활동을 확인하세요</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="border-2 border-emerald-100">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="size-24 border-4 border-emerald-100">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {user?.nickname?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900">{user?.nickname ?? "-"}</h3>
                  <p className="text-sm text-gray-600">{user?.email ?? "-"}</p>
                </div>
                <Link to="/mypage/profile" className="w-full">
                  <Button variant="outline" className="w-full border-2">
                    프로필 수정
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader>
              <CardTitle className="text-lg">건강 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Level */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">간 건강 위험도</p>
                {dashboardLoading ? (
                  <Loader2 className="size-5 text-emerald-600 animate-spin" />
                ) : dashboard ? (
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`${riskStyle.bg} ${riskStyle.text} border-2 ${riskStyle.border} text-lg px-4 py-2`}
                    >
                      {dashboard.latest_grade}
                    </Badge>
                    {scoreChange !== null && (
                      <div className={`flex items-center gap-1 ${scoreChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {scoreChange >= 0 ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <TrendingDown className="size-4" />
                        )}
                        <span className="text-sm font-medium">
                          {scoreChange >= 0 ? "+" : ""}{scoreChange.toFixed(1)}점
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">예측 데이터 없음</p>
                )}
              </div>

              {/* AI Recommendation */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">오늘 해야 할 행동</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 ml-7">{aiRecommendation}</p>
              </div>

              {/* Current Streak */}
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="size-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">현재 연속 기록</p>
                      <p className="text-2xl font-bold text-gray-900">{currentStreak}일</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">연속 달성 중!</p>
                    <p className="text-xs text-orange-600 font-medium">계속 이어가세요 🔥</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Menu Grid */}
        <div className="lg:col-span-2">
          <div className="grid md:grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <Link key={item.link} to={item.link}>
                <Card className="border-2 border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`size-12 ${item.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <item.icon className={`size-6 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <ChevronRight className="size-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}