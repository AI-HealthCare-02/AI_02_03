import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LiverCharacter } from "../components/LiverCharacter";
import {
  TrendingUp,
  Calendar,
  Award,
  Activity,
  Flame,
  Target,
  BarChart3,
  Scale,
  BedDouble,
  Wine
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function Progress() {
  const [weeklyData] = useState([
    { day: "월", completed: 3, total: 4 },
    { day: "화", completed: 4, total: 4 },
    { day: "수", completed: 2, total: 4 },
    { day: "목", completed: 4, total: 4 },
    { day: "금", completed: 3, total: 4 },
    { day: "토", completed: 4, total: 4 },
    { day: "일", completed: 2, total: 4 },
  ]);

  const [monthlyProgress] = useState([
    { week: "1주차", rate: 65 },
    { week: "2주차", rate: 72 },
    { week: "3주차", rate: 85 },
    { week: "4주차", rate: 78 },
  ]);

  // Weekly health metrics data
  const [weeklyBMI] = useState([
    { day: "월", value: 24.2 },
    { day: "화", value: 24.1 },
    { day: "수", value: 24.0 },
    { day: "목", value: 23.9 },
    { day: "금", value: 23.8 },
    { day: "토", value: 23.7 },
    { day: "일", value: 23.6 },
  ]);

  const [weeklySleep] = useState([
    { day: "월", hours: 7.2 },
    { day: "화", hours: 6.5 },
    { day: "수", hours: 7.8 },
    { day: "목", hours: 7.5 },
    { day: "금", hours: 6.8 },
    { day: "토", hours: 8.2 },
    { day: "일", hours: 7.9 },
  ]);

  const [weeklyAlcohol] = useState([
    { day: "월", amount: 0 },
    { day: "화", amount: 0 },
    { day: "수", amount: 1 },
    { day: "목", amount: 0 },
    { day: "금", amount: 2 },
    { day: "토", amount: 3 },
    { day: "일", amount: 0 },
  ]);

  // Overall health score history (last 30 days)
  const [healthScoreHistory] = useState([
    { day: "1일", score: 45 },
    { day: "3일", score: 48 },
    { day: "5일", score: 52 },
    { day: "7일", score: 55 },
    { day: "9일", score: 58 },
    { day: "11일", score: 62 },
    { day: "13일", score: 65 },
    { day: "15일", score: 68 },
    { day: "17일", score: 70 },
    { day: "19일", score: 72 },
    { day: "21일", score: 75 },
    { day: "23일", score: 73 },
    { day: "25일", score: 76 },
    { day: "27일", score: 78 },
    { day: "29일", score: 80 },
    { day: "오늘", score: 78 },
  ]);

  const [badges] = useState([
    { id: 1, name: "첫 걸음", description: "첫 챌린지 시작", emoji: "🎯", earned: true },
    { id: 2, name: "1주 연속", description: "7일 연속 달성", emoji: "🔥", earned: true },
    { id: 3, name: "2주 연속", description: "14일 연속 달성", emoji: "⭐", earned: true },
    { id: 4, name: "완벽한 주", description: "일주일 100% 달성", emoji: "💎", earned: true },
    { id: 5, name: "얼리버드", description: "아침 운동 10회", emoji: "🌅", earned: true },
    { id: 6, name: "식습관 마스터", description: "식습관 챌린지 완료", emoji: "🥗", earned: true },
    { id: 7, name: "워터 챔피언", description: "물 마시기 30일", emoji: "💧", earned: true },
    { id: 8, name: "체중 관리자", description: "목표 체중 달성", emoji: "🎊", earned: true },
    { id: 9, name: "1개월 달성", description: "30일 연속 달성", emoji: "🏆", earned: false },
    { id: 10, name: "완벽한 달", description: "한 달 100% 달성", emoji: "👑", earned: false },
    { id: 11, name: "운동 마니아", description: "운동 챌린지 5개 완료", emoji: "💪", earned: false },
    { id: 12, name: "레전드", description: "100일 연속 달성", emoji: "🌟", earned: false },
  ]);

  // Calculate overall health score
  const streakDays = 14;
  const weeklyRate = 78;
  const activeChallenges = 3;
  const totalChallenges = 5;
  const earnedBadges = badges.filter(b => b.earned).length;
  const totalBadges = badges.length;

  const healthScore = Math.round(
    (weeklyRate * 0.4) + // Weekly achievement: 40%
    (Math.min(streakDays / 30, 1) * 100 * 0.3) + // Streak: 30%
    ((activeChallenges / totalChallenges) * 100 * 0.2) + // Active challenges: 20%
    ((earnedBadges / totalBadges) * 100 * 0.1) // Badges: 10%
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">내 진행도</h2>
        <p className="text-gray-600">나의 건강 여정을 한눈에 확인하세요</p>
      </div>

      {/* Liver Character Status */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl -z-10" />
        <CardContent className="pt-8 pb-6">
          <LiverCharacter healthScore={healthScore} />
        </CardContent>
      </Card>

      {/* Overall Health Score Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-600" />
            전체 건강 점수 추이
          </CardTitle>
          <CardDescription>최근 30일간의 건강 점수 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={healthScoreHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10b981"
                strokeWidth={3}
                name="건강 점수"
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">현재 점수</p>
              <p className="text-2xl font-bold text-emerald-600">{healthScore}점</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">최고 점수</p>
              <p className="text-2xl font-bold text-blue-600">80점</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">평균 점수</p>
              <p className="text-2xl font-bold text-purple-600">66점</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Flame className="size-5 text-blue-600" />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-900">
                최고기록
              </Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900">14일</p>
            <p className="text-sm text-gray-600">연속 달성</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="size-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="size-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">78%</p>
            <p className="text-sm text-gray-600">이번 주 달성률</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="size-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">3/5</p>
            <p className="text-sm text-gray-600">활성 챌린지</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="size-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Award className="size-5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">8개</p>
            <p className="text-sm text-gray-600">획득 뱃지</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Health Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* BMI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 text-blue-600" />
              BMI 추이
            </CardTitle>
            <CardDescription>주간 체질량지수</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyBMI}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[23, 25]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-3 text-center">
              <p className="text-2xl font-bold text-gray-900">23.6</p>
              <p className="text-xs text-gray-600">현재 BMI (정상 범위)</p>
            </div>
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BedDouble className="size-4 text-purple-600" />
              수면 시간
            </CardTitle>
            <CardDescription>주간 평균 수면</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklySleep}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="hours"
                  fill="#a855f7"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-center">
              <p className="text-2xl font-bold text-gray-900">7.4시간</p>
              <p className="text-xs text-gray-600">주간 평균</p>
            </div>
          </CardContent>
        </Card>

        {/* Alcohol */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wine className="size-4 text-amber-600" />
              음주량
            </CardTitle>
            <CardDescription>주간 음주 기록 (잔)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyAlcohol}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="amount"
                  fill="#f59e0b"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 text-center">
              <p className="text-2xl font-bold text-gray-900">6잔</p>
              <p className="text-xs text-gray-600">이번 주 총량</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">
            <Calendar className="size-4 mr-2" />
            주간
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <BarChart3 className="size-4 mr-2" />
            월간
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="size-4 mr-2" />
            뱃지
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>주간 목표 달성률</CardTitle>
              <CardDescription>최근 7일간의 활동 기록</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="완료한 목표" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="total" fill="#e5e7eb" name="전체 목표" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-7 gap-2">
            {weeklyData.map((day) => {
              const rate = (day.completed / day.total) * 100;
              return (
                <Card key={day.day} className="text-center">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">{day.day}</p>
                    <div className={`size-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      rate === 100 ? "bg-emerald-100" : rate >= 75 ? "bg-blue-100" : "bg-gray-100"
                    }`}>
                      <p className={`font-bold ${
                        rate === 100 ? "text-emerald-600" : rate >= 75 ? "text-blue-600" : "text-gray-600"
                      }`}>
                        {day.completed}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{Math.round(rate)}%</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>월간 달성률 추이</CardTitle>
              <CardDescription>주차별 목표 달성률</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="달성률 (%)"
                    dot={{ fill: '#10b981', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-emerald-600" />
                이번 달 통계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-gray-600 mb-1">평균 달성률</p>
                  <p className="text-2xl font-bold text-emerald-600">75%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">완료한 챌린지</p>
                  <p className="text-2xl font-bold text-blue-600">2개</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">총 활동 일수</p>
                  <p className="text-2xl font-bold text-purple-600">23일</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>획득한 뱃지 ({badges.filter(b => b.earned).length}/{badges.length})</CardTitle>
              <CardDescription>달성한 성과를 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg border text-center transition-all ${
                      badge.earned
                        ? "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm"
                        : "bg-gray-50 border-gray-200 opacity-50"
                    }`}
                  >
                    <div className={`text-4xl mb-2 ${badge.earned ? "" : "grayscale"}`}>
                      {badge.emoji}
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{badge.name}</p>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                    {badge.earned && (
                      <Badge variant="secondary" className="mt-2 bg-amber-100 text-amber-900">
                        달성
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}