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

function gradeToRisk(grade: string): "LOW" | "MID" | "HIGH" {
  if (grade === "정상") return "LOW";
  if (grade === "중증") return "HIGH";
  return "MID";
}

function getRiskStyle(level: "LOW" | "MID" | "HIGH") {
  switch (level) {
    case "LOW":
      return { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-300", label: "정상" };
    case "MID":
      return { bg: "bg-yellow-100", text: "text-yellow-900", border: "border-yellow-300", label: "주의" };
    case "HIGH":
      return { bg: "bg-red-100", text: "text-red-900", border: "border-red-300", label: "위험" };
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<UserInfo>("/api/v1/users/me"),
      api.get<PredictionItem[]>("/api/v1/predictions/me"),
    ])
      .then(([userRes, predRes]) => {
        setUser(userRes.data);
        setPredictions(predRes.data);
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
                <Link to="/mypage/account" className="w-full">
                  <Button variant="outline" className="w-full border-2">
                    계정 관리
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

                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 font-medium mb-1">최근 점수</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(latestPred.score)}점
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(latestPred.created_at)} 기준
                    </p>
                  </div>
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
