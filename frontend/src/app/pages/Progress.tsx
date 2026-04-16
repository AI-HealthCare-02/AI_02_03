import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { LiverCharacter } from "../components/LiverCharacter";
import { Progress as ProgressBar } from "../components/ui/progress";
import {
  Flame,
  Target,
  Activity,
  Award,
  Scale,
  BedDouble,
  Wine,
  Cigarette,
  Loader2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Dumbbell,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { foodService } from "../../services/food";

type FoodRecord = {
  id: number;
  food_name: string;
  fat: number;
  sugar: number;
  calories: number;
  impact_message: string;
  created_at: string;
};


export function Progress() {
  const [activeTab, setActiveTab] = useState("health");
  const [mealHistory, setMealHistory] = useState<FoodRecord[]>([]);
  const [mealsLoading, setMealsLoading] = useState(false);

  // Mock data
  const streakDays = 14;
  const weeklyRate = 78;
  const activeChallenges = 3;
  const earnedBadges = 8;
  const healthScore = 78;

  // Health score history
  const [healthScoreHistory] = useState([
    { day: "1일", score: 45 },
    { day: "5일", score: 52 },
    { day: "10일", score: 62 },
    { day: "15일", score: 68 },
    { day: "20일", score: 72 },
    { day: "25일", score: 76 },
    { day: "오늘", score: 78 },
  ]);

  // BMI data
  const [bmiData] = useState([
    { day: "월", value: 24.2 },
    { day: "화", value: 24.1 },
    { day: "수", value: 24.0 },
    { day: "목", value: 23.9 },
    { day: "금", value: 23.8 },
    { day: "토", value: 23.7 },
    { day: "일", value: 23.6 },
  ]);

  // Sleep data
  const [sleepData] = useState([
    { day: "월", hours: 7.2 },
    { day: "화", hours: 6.5 },
    { day: "수", hours: 7.8 },
    { day: "목", hours: 7.5 },
    { day: "금", hours: 6.8 },
    { day: "토", hours: 8.2 },
    { day: "일", hours: 7.9 },
  ]);

  // Alcohol data
  const [alcoholData] = useState([
    { day: "월", amount: 0 },
    { day: "화", amount: 0 },
    { day: "수", amount: 1 },
    { day: "목", amount: 0 },
    { day: "금", amount: 2 },
    { day: "토", amount: 3 },
    { day: "일", amount: 0 },
  ]);

  // Smoking data
  const [smokingData] = useState([
    { day: "월", amount: 0 },
    { day: "화", amount: 0 },
    { day: "수", amount: 0 },
    { day: "목", amount: 0 },
    { day: "금", amount: 0 },
    { day: "토", amount: 0 },
    { day: "일", amount: 0 },
  ]);


  // Completed challenges
  const [completedChallenges] = useState([
    {
      id: 1,
      title: "물 마시기 챌린지",
      description: "14일간 하루 2L 이상 물 마시기",
      completedDate: "2024-03-25",
      emoji: "💧",
    },
    {
      id: 2,
      title: "아침 운동 챌린지",
      description: "7일 연속 아침 운동 완료",
      completedDate: "2024-03-18",
      emoji: "🌅",
    },
    {
      id: 3,
      title: "채소 먹기 챌린지",
      description: "21일간 매 끼니 채소 섭취",
      completedDate: "2024-03-10",
      emoji: "🥗",
    },
  ]);

  // Weekly achievement data
  const [weeklyData] = useState([
    { day: "월", completed: 3, total: 4 },
    { day: "화", completed: 4, total: 4 },
    { day: "수", completed: 2, total: 4 },
    { day: "목", completed: 4, total: 4 },
    { day: "금", completed: 3, total: 4 },
    { day: "토", completed: 4, total: 4 },
    { day: "일", completed: 2, total: 4 },
  ]);

  // Weekly calendar data
  const [calendarData] = useState([
    { day: "월", hasBMI: true, hasExercise: true, hasAlcohol: false, hasSmoking: false, id: "mon-cal" },
    { day: "화", hasBMI: true, hasExercise: false, hasAlcohol: false, hasSmoking: false, id: "tue-cal" },
    { day: "수", hasBMI: false, hasExercise: true, hasAlcohol: true, hasSmoking: false, id: "wed-cal" },
    { day: "목", hasBMI: true, hasExercise: true, hasAlcohol: false, hasSmoking: false, id: "thu-cal" },
    { day: "금", hasBMI: true, hasExercise: false, hasAlcohol: true, hasSmoking: false, id: "fri-cal" },
    { day: "토", hasBMI: true, hasExercise: true, hasAlcohol: true, hasSmoking: false, id: "sat-cal" },
    { day: "일", hasBMI: false, hasExercise: false, hasAlcohol: false, hasSmoking: false, id: "sun-cal" },
  ]);

  // Badges data
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

  const fetchMealHistory = async () => {
    setMealsLoading(true);
    try {
      const data = await foodService.getMy();
      setMealHistory(data);
    } catch (err) {
      console.error("식단 이력 불러오기 실패", err);
    } finally {
      setMealsLoading(false);
    }
  };

  useEffect(() => {
    fetchMealHistory();
  }, []);



  return (
    <div className="pb-8 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Page Title */}
        <div className="pt-4">
          <h2 className="text-3xl font-bold text-gray-900">내 진행도</h2>
          <p className="text-gray-600">나의 건강 여정을 한눈에 확인하세요</p>
        </div>

        {/* 2-Column Layout: Character + Summary Cards */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Character Card */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white overflow-hidden relative">
            <CardContent className="py-4">
              <div className="scale-[0.9] origin-top">
                <LiverCharacter healthScore={healthScore} />
              </div>
            </CardContent>
          </Card>

          {/* Right: 2x2 Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Streak */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Flame className="size-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{streakDays}일</p>
                <p className="text-sm text-gray-600">연속 달성</p>
              </CardContent>
            </Card>

            {/* Weekly Rate */}
            <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="size-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{weeklyRate}%</p>
                <p className="text-sm text-gray-600">이번 주 달성률</p>
              </CardContent>
            </Card>

            {/* Active Challenges */}
            <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="size-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeChallenges}개</p>
                <p className="text-sm text-gray-600">활성 챌린지</p>
              </CardContent>
            </Card>

            {/* Earned Badges */}
            <Card className="border-2 border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="size-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{earnedBadges}개</p>
                <p className="text-sm text-gray-600">획득 뱃지</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-gray-100">
          <TabsTrigger value="health" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            건강지표
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            챌린지
          </TabsTrigger>
          <TabsTrigger value="diet" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            식단 기록
          </TabsTrigger>
          <TabsTrigger value="badges" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            뱃지
          </TabsTrigger>
        </TabsList>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          {/* Overall Health Score */}
          <Card className="border-2 border-emerald-100">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="size-5 text-emerald-600" />
                  전체 건강 점수
                </h3>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthScoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Score Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">현재</p>
                  <p className="text-xl font-bold text-emerald-600">78점</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">최고</p>
                  <p className="text-xl font-bold text-blue-600">80점</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">평균</p>
                  <p className="text-xl font-bold text-purple-600">66점</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Metrics Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* BMI */}
            <Card className="border-2 border-emerald-100">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Scale className="size-4 text-emerald-600" />
                  BMI
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={bmiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[23, 25]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">23.6</p>
                  <p className="text-xs text-gray-600">현재 BMI</p>
                </div>
              </CardContent>
            </Card>

            {/* Sleep */}
            <Card className="border-2 border-teal-100">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BedDouble className="size-4 text-teal-600" />
                  수면
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={sleepData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">7.4시간</p>
                  <p className="text-xs text-gray-600">평균 수면</p>
                </div>
              </CardContent>
            </Card>

            {/* Alcohol */}
            <Card className="border-2 border-purple-100">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wine className="size-4 text-purple-600" />
                  음주
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={alcoholData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">6잔</p>
                  <p className="text-xs text-gray-600">이번 주 총량</p>
                </div>
              </CardContent>
            </Card>

            {/* Smoking */}
            <Card className="border-2 border-orange-100">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Cigarette className="size-4 text-orange-600" />
                  흡연
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={smokingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">0개</p>
                  <p className="text-xs text-gray-600">이번 주 총량</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          {/* Completed Challenges */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">완료된 챌린지</h4>
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{challenge.emoji}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                      <p className="text-sm text-gray-600 mb-1">{challenge.description}</p>
                      <p className="text-xs text-gray-500">완료일: {challenge.completedDate}</p>
                    </div>
                    <CheckCircle2 className="size-6 text-emerald-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Weekly Achievement Graph */}
          <Card className="border-2 border-emerald-100">
            <CardContent className="pt-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="size-5 text-emerald-600" />
                주간 목표 달성률
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="완료한 목표" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="total" fill="#e5e7eb" name="전체 목표" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity Calendar */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">주간 활동 캘린더</h4>
            <div className="grid grid-cols-7 gap-2">
              {calendarData.map((day) => (
                <Card key={day.id} className="text-center border-2 border-gray-200">
                  <CardContent className="p-3">
                    <p className="text-sm text-gray-600 mb-2 font-medium">{day.day}</p>
                    <div className="space-y-1.5 min-h-[60px] flex flex-col items-center justify-center">
                      {day.hasBMI && (
                        <div className="size-6 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Scale className="size-3.5 text-emerald-600" />
                        </div>
                      )}
                      {day.hasExercise && (
                        <div className="size-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <Dumbbell className="size-3.5 text-blue-600" />
                        </div>
                      )}
                      {day.hasAlcohol && (
                        <div className="size-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <Wine className="size-3.5 text-purple-600" />
                        </div>
                      )}
                      {day.hasSmoking && (
                        <div className="size-6 bg-orange-100 rounded-full flex items-center justify-center">
                          <Cigarette className="size-3.5 text-orange-600" />
                        </div>
                      )}
                      {!day.hasBMI && !day.hasExercise && !day.hasAlcohol && !day.hasSmoking && (
                        <div className="text-xs text-gray-400 py-2">-</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600 mt-4">
              <div className="flex items-center gap-2">
                <div className="size-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Scale className="size-2.5 text-emerald-600" />
                </div>
                <span>체중 기록</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Dumbbell className="size-2.5 text-blue-600" />
                </div>
                <span>운동</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <Wine className="size-2.5 text-purple-600" />
                </div>
                <span>음주</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Cigarette className="size-2.5 text-orange-600" />
                </div>
                <span>흡연</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Diet Tab */}
        <TabsContent value="diet" className="space-y-4">
          {/* 식단 이력 */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">식단 기록</h4>
            {mealsLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="size-6 text-emerald-600 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : mealHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-gray-500">아직 분석한 식단이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              mealHistory.map((meal) => (
                <Card key={meal.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(meal.created_at).toLocaleString("ko-KR")}
                      </p>
                      <p className="font-bold text-gray-900 mb-1">{meal.food_name}</p>
                      <div className="flex gap-3 text-sm text-gray-600 mb-2">
                        <span>{meal.calories} kcal</span>
                        <span>지방 {meal.fat}g</span>
                        <span>당 {meal.sugar}g</span>
                      </div>
                      <p className="text-xs text-gray-500">{meal.impact_message}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <Card
                key={badge.id}
                className={`border-2 text-center transition-all ${
                  badge.earned
                    ? "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm"
                    : "bg-gray-50 border-gray-200 opacity-50"
                }`}
              >
                <CardContent className="p-4">
                  <div className={`text-4xl mb-2 ${badge.earned ? "" : "grayscale"}`}>
                    {badge.emoji}
                  </div>
                  <p className="font-bold text-gray-900 mb-1">{badge.name}</p>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                  {badge.earned && (
                    <Badge variant="secondary" className="mt-2 bg-amber-100 text-amber-900">
                      <CheckCircle2 className="size-3 mr-1" />
                      달성
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}