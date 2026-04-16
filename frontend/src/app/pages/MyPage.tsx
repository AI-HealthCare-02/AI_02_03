import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import {
  ChevronRight,
  FileText,
  History,
  Bell,
  Settings,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Flame,
} from "lucide-react";
import api from "../../lib/api";

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  is_onboarded: boolean;
  created_at: string;
}

interface PredictionItem {
  score: number;
  grade: string;
  character_state: string;
  created_at: string;
}

interface ImprovementFactor {
  category: string;
  challenge_type: string;
  score_delta: number;
}

interface DashboardData {
  streak_days: number;
  improvement_factors: ImprovementFactor[];
}

function gradeToRisk(grade: string): "LOW" | "MID" | "HIGH" {
  if (grade === "정상") return "LOW";
  if (grade === "중증") return "HIGH";
  return "MID";
}

function getRiskStyle(level: "LOW" | "MID" | "HIGH") {
  switch (level) {
    case "LOW":
      return { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300" };
    case "MID":
      return { bg: "bg-yellow-100", text: "text-yellow-900", border: "border-yellow-300" };
    case "HIGH":
      return { bg: "bg-red-100", text: "text-red-900", border: "border-red-300" };
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getAiRecommendation(factors: ImprovementFactor[]): string {
  if (!factors.length) return "오늘도 건강한 하루를 보내세요!";
  const top = factors[0];
  const messages: Record<string, string> = {
    금주: "오늘은 술을 피하고 물을 충분히 마셔보세요.",
    운동: "오늘 30분 이상 유산소 운동을 해보세요.",
    금연: "담배 없는 하루를 만들어 보세요. 간 건강이 달라져요.",
    수면: "오늘은 일찍 자고 7시간 이상 수면을 취해보세요.",
    식습관: "채소 위주의 균형 잡힌 식단을 실천해보세요.",
    체중감량: "오늘 식사량을 조금 줄이고 걷기를 추가해보세요.",
  };
  return messages[top.category] ?? "오늘도 건강한 하루를 보내세요!";
}

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

export function MyPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<UserInfo>("/api/v1/users/me"),
      api.get<PredictionItem[]>("/api/v1/predictions/me"),
      api.get<DashboardData>("/api/v1/dashboard").catch(() => null),
    ])
      .then(([userRes, predRes, dashRes]) => {
        setUser(userRes.data);
        setPredictions(predRes.data);
        if (dashRes) setDashboard(dashRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const latestPred = predictions[0] ?? null;
  const prevPred = predictions[1] ?? null;
  const riskLevel = latestPred ? gradeToRisk(latestPred.grade) : null;
  const riskStyle = riskLevel ? getRiskStyle(riskLevel) : null;
  const scoreDiff =
    latestPred && prevPred ? Math.round(latestPred.score - prevPred.score) : null;

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">마이페이지</h2>
        <p className="text-gray-600">나의 건강 정보를 관리하고 활동을 확인하세요</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
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
                  <h3 className="text-xl font-bold text-gray-900">
                    {loading ? "..." : user?.nickname}
                  </h3>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  {user && (
                    <p className="text-xs text-gray-500">가입일: {formatDate(user.created_at)}</p>
                  )}
                </div>
                <Link to="/mypage/profile" className="w-full">
                  <Button variant="outline" className="w-full border-2">
                    프로필 수정
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 건강 요약 */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader>
              <CardTitle className="text-lg">건강 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-gray-400 text-sm">불러오는 중...</p>
              ) : latestPred && riskStyle ? (
                <>
                  {/* 등급 + 점수 변화 */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 font-medium">간 건강 등급</p>
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`${riskStyle.bg} ${riskStyle.text} border-2 ${riskStyle.border} text-lg px-4 py-2`}
                      >
                        {latestPred.grade}
                      </Badge>
                      {scoreDiff !== null && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {scoreDiff > 0 ? (
                            <>
                              <TrendingUp className="size-4 text-emerald-600" />
                              <span className="text-emerald-600">+{scoreDiff}점</span>
                            </>
                          ) : scoreDiff < 0 ? (
                            <>
                              <TrendingDown className="size-4 text-red-500" />
                              <span className="text-red-500">{scoreDiff}점</span>
                            </>
                          ) : (
                            <>
                              <Minus className="size-4 text-gray-400" />
                              <span className="text-gray-400">변동 없음</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 최근 점수 */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 font-medium mb-1">최근 점수</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(latestPred.score)}점
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(latestPred.created_at)} 기준
                    </p>
                  </div>

                  {/* AI 추천 */}
                  {dashboard && (
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Sparkles className="size-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-purple-900">오늘 해야 할 행동</p>
                      </div>
                      <p className="text-sm text-gray-700 ml-7">
                        {getAiRecommendation(dashboard.improvement_factors)}
                      </p>
                    </div>
                  )}

                  {/* 연속 기록 */}
                  {dashboard && dashboard.streak_days > 0 && (
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame className="size-6 text-orange-600" />
                          <div>
                            <p className="text-sm text-gray-600">현재 연속 기록</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {dashboard.streak_days}일
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">연속 달성 중!</p>
                          <p className="text-xs text-orange-600 font-medium">계속 이어가세요 🔥</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">예측 결과가 없습니다</p>
              )}
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
                            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
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
