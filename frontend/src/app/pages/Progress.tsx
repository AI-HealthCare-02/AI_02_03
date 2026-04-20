import { useEffect, useState } from "react";
import api from "../../lib/api";
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
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

import type React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Challenge {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  participants: number;
  difficulty: "초급" | "중급" | "고급";
  category: string;
  progress?: number;
  daysLeft?: number;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  운동: Activity,
  식습관: Scale,
  식단: Scale,
  수면: BedDouble,
  수분: Activity,
  금주: Award,
  체중관리: Scale,
};
const typeIcon = (type: string): React.ComponentType<{ className?: string }> => TYPE_ICON[type] ?? Activity;

export function Progress() {
  const [activeTab, setActiveTab] = useState("health");
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyRate, setWeeklyRate] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState(0);

  const [healthScore, setHealthScore] = useState(0);
  const [lifestyleSummary, setLifestyleSummary] = useState<{ bmi: number; weight: number; sleep_hours: number; drink_amount: number; exercise: string; current_smoking: string } | null>(null);
  const [activeChallengesCount, setActiveChallengesCount] = useState(0);
  const [healthScoreHistory, setHealthScoreHistory] = useState<{ day: string; score: number }[]>([]);
  const [weightData, setWeightData] = useState<{ day: string; value: number }[]>([]);
  const [alcoholData, setAlcoholData] = useState<{ day: string; amount: number }[]>([]);
  const [improvementFactors, setImprovementFactors] = useState<{ category: string; challenge_type: string; score_delta: number }[]>([]);
  const [activeChallengesList, setActiveChallengesList] = useState<Challenge[]>([]);
  const [availableChallengesList, setAvailableChallengesList] = useState<Challenge[]>([]);
  const [joiningChallenge, setJoiningChallenge] = useState<number | null>(null);

  const sleepHours = lifestyleSummary?.sleep_hours ?? 0;
  const sleepData = [{ day: "설문 기준", hours: sleepHours }];
  const surveyWeight = lifestyleSummary?.weight ?? 0;
  const displayWeightData =
    weightData.length > 0
      ? weightData
      : surveyWeight > 0
      ? [{ day: "설문 기준", value: surveyWeight }]
      : [];

  const surveyDrink = lifestyleSummary?.drink_amount ?? 0;
  const displayAlcoholData =
    alcoholData.length > 0
      ? alcoholData
      : surveyDrink > 0
      ? [{ day: "설문 기준", amount: surveyDrink }]
      : [];


  useEffect(() => {
    // 대시보드 (건강 점수 + 개선 요인 + 생활습관 요약)
    api
      .get<{
        latest_score: number;
        score_history: { score: number; created_at: string }[];
        lifestyle_summary: { bmi: number; sleep_hours: number; drink_amount: number; exercise: string };
        streak_days: number;
        weekly_rate: number;
      }>("/api/v1/dashboard")
      .then((r) => {
        setHealthScore(Math.round(r.data.latest_score));
        setLifestyleSummary(r.data.lifestyle_summary);
        setStreakDays(r.data.streak_days);
        setWeeklyRate(r.data.weekly_rate);
        setImprovementFactors(r.data.improvement_factors ?? []);
        setHealthScoreHistory(
          r.data.score_history
            .slice(0, 7)
            .reverse()
            .map((p, i) => ({ day: `${i + 1}회`, score: Math.round(p.score) }))
        );
      })
      .catch(() => {});

    // 건강 로그 (체중, 음주, 흡연)
    const now = new Date();
    api
      .get<
        {
          log_date: string;
          weight: number | null;
          alcohol_amount: number | null;
          smoking_amount: number | null;
        }[]
      >("/api/v1/health-logs/me", { params: { year: now.getFullYear(), month: now.getMonth() + 1 } })
      .then((r) => {
        const recent = r.data.slice(0, 7).reverse();
        setWeightData(recent.map((l) => ({ day: DAYS[new Date(l.log_date).getDay()], value: l.weight ?? 0 })));
        setAlcoholData(recent.map((l) => ({ day: DAYS[new Date(l.log_date).getDay()], amount: l.alcohol_amount ?? 0 })));
        setSmokingData(
          recent.map((l) => ({ day: DAYS[new Date(l.log_date).getDay()], amount: l.smoking_amount ?? 0 }))
        );
      })
      .catch(() => {});

    // 진행 중 챌린지
    api
      .get<
        {
          user_challenge_id: number;
          challenge_name: string;
          type: string;
          description: string;
          duration_days: number;
          progress: number;
          days_left: number;
        }[]
      >("/api/v1/user-challenges/me", { params: { status: "진행중" } })
      .then((r) => {
        setActiveChallengesCount(r.data.length);
        setActiveChallengesList(
          r.data.map((uc) => ({
            id: uc.user_challenge_id,
            title: uc.challenge_name,
            description: uc.description,
            icon: typeIcon(uc.type),
            duration: `${uc.duration_days}일`,
            participants: 0,
            difficulty: "초급" as const,
            category: uc.type,
            progress: uc.progress,
            daysLeft: uc.days_left,
          }))
        );
      })
      .catch(() => {});

    // 참여 가능 챌린지
    api
      .get<{ id: number; type: string; name: string; description: string; duration_days: number }[]>(
        "/api/v1/challenges"
      )
      .then((r) =>
        setAvailableChallengesList(
          r.data.map((c) => ({
            id: c.id,
            title: c.name,
            description: c.description,
            icon: typeIcon(c.type),
            duration: `${c.duration_days}일`,
            participants: 0,
            difficulty: "초급" as const,
            category: c.type,
          }))
        )
      )
      .catch(() => {});

    api.get<{ earned_count: number }>("/api/v1/badges/me/count").then((r) => {
      setEarnedBadges(r.data.earned_count);
    }).catch(() => {});

    api.get<{ key: string; name: string; description: string; emoji: string; earned: boolean }[]>("/api/v1/badges/me").then((r) => {
      setBadges(r.data);
    }).catch(() => {});

    api.get<{ id: number; food_name: string; calories: number; liver_impact: string; recommendation: string; analyzed_at: string }[]>("/api/v1/food/me")
      .then((r) => setRecentMeals(r.data))
      .catch(() => {});
  }, []);

  const handleJoinChallenge = async (challengeId: number) => {
    setJoiningChallenge(challengeId);
    try {
      await api.post(`/api/v1/challenges/${challengeId}/join`);
      const r = await api.get<{ user_challenge_id: number; challenge_name: string; type: string; description: string; duration_days: number; progress: number; days_left: number }[]>(
        "/api/v1/user-challenges/me",
        { params: { status: "진행중" } }
      );
      setActiveChallengesCount(r.data.length);
      setActiveChallengesList(
        r.data.map((uc) => ({
          id: uc.user_challenge_id,
          title: uc.challenge_name,
          description: uc.description,
          icon: typeIcon(uc.type),
          duration: `${uc.duration_days}일`,
          participants: 0,
          difficulty: "초급" as const,
          category: uc.type,
          progress: uc.progress,
          daysLeft: uc.days_left,
        }))
      );
    } catch {
      // 이미 참여 중
    } finally {
      setJoiningChallenge(null);
    }
  };

  const [badges, setBadges] = useState<{ key: string; name: string; description: string; emoji: string; earned: boolean }[]>([]);

  const [recentMeals, setRecentMeals] = useState<{
    id: number;
    food_name: string;
    calories: number;
    fat: number;
    sugar: number;
    liver_impact: string;
    recommendation: string;
    rating: string;
    image_url: string | null;
    analyzed_at: string;
  }[]>([]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "초급":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "중급":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "고급":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

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
                <p className="text-2xl font-bold text-gray-900">{activeChallengesCount}개</p>
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
                  <p className="text-xl font-bold text-emerald-600">{healthScore}점</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">최고</p>
                  <p className="text-xl font-bold text-blue-600">
                    {healthScoreHistory.length > 0 ? Math.max(...healthScoreHistory.map((h) => h.score)) : "-"}점
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">평균</p>
                  <p className="text-xl font-bold text-purple-600">
                    {healthScoreHistory.length > 0
                      ? Math.round(healthScoreHistory.reduce((s, h) => s + h.score, 0) / healthScoreHistory.length)
                      : "-"}점
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Metrics Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* 체중 */}
            <Card className="border-2 border-emerald-100">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Scale className="size-4 text-emerald-600" />
                  체중(kg)
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={displayWeightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">
                    {weightData.length > 0
                      ? `${weightData[weightData.length - 1].value}kg`
                      : lifestyleSummary?.weight
                      ? `${lifestyleSummary.weight}kg`
                      : "-"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {weightData.length > 0 ? "최근 기록" : "설문 기준"}
                  </p>
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
                  <p className="text-xl font-bold text-gray-900">{sleepHours}시간</p>
                  <p className="text-xs text-gray-600">평균 수면 (설문 기준)</p>
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
                  <BarChart data={displayAlcoholData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">
                    {alcoholData.length > 0
                      ? `${alcoholData.reduce((s, d) => s + d.amount, 0)}잔`
                      : surveyDrink > 0
                      ? `${surveyDrink}잔`
                      : "-"}
                  </p>
                  <p className="text-xs text-gray-600">{alcoholData.length > 0 ? "이번 주 총량" : "설문 기준 1회량"}</p>
                </div>
              </CardContent>
            </Card>

            {/* 개선 요인 */}
            <Card className="border-2 border-orange-100">
              <CardContent className="pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4 text-orange-600" />
                  점수 개선 요인
                </h4>
                {improvementFactors.length > 0 ? (
                  <div className="space-y-3">
                    {improvementFactors.map((f, i) => (
                      <div key={f.category} className="flex items-center justify-between p-2 rounded-lg bg-orange-50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-orange-400">#{i + 1}</span>
                          <span className="text-sm font-medium text-gray-800">{f.category}</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">+{f.score_delta}점</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center mt-8">데이터를 불러오는 중...</p>
                )}
                <p className="text-xs text-gray-400 mt-4 text-center">개선 시 예상 점수 상승폭</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="active">진행중</TabsTrigger>
              <TabsTrigger value="available">참여 가능</TabsTrigger>
            </TabsList>

            {/* Active Challenges */}
            <TabsContent value="active" className="space-y-3">
              {activeChallengesList.map((challenge) => (
                <Card key={challenge.id} className="border-2 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="size-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <challenge.icon className="size-6 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="size-3 mr-1" />
                            {challenge.daysLeft}일 남음
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Users className="size-3 mr-1" />
                            {challenge.participants}명
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">진행도</span>
                        <span className="font-bold text-emerald-600">{challenge.progress}%</span>
                      </div>
                      <ProgressBar value={challenge.progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Available Challenges */}
            <TabsContent value="available" className="space-y-3">
              {availableChallengesList.map((challenge) => (
                <Card key={challenge.id} className="border-2 border-gray-200 hover:border-emerald-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="size-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <challenge.icon className="size-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="size-3 mr-1" />
                            {challenge.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Users className="size-3 mr-1" />
                            {challenge.participants}명
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      onClick={() => handleJoinChallenge(challenge.id)}
                      disabled={joiningChallenge === challenge.id}
                    >
                      {joiningChallenge === challenge.id ? "참여 중..." : "참여하기"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Diet Tab */}
        <TabsContent value="diet" className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900">식단 기록</h4>
            {recentMeals.length === 0 ? (
              <Card className="border border-gray-200">
                <CardContent className="p-12 text-center text-gray-500">
                  <p className="text-sm">아직 분석된 식단이 없습니다</p>
                  <p className="text-xs mt-1 text-gray-400">챌린지 탭의 식단 분석에서 사진을 업로드해보세요</p>
                </CardContent>
              </Card>
            ) : (
              recentMeals.map((meal) => (
                <Card key={meal.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {meal.image_url && (
                        <img
                          src={meal.image_url}
                          alt={meal.food_name}
                          className="size-24 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-bold text-gray-900">{meal.food_name}</p>
                          <Badge className={
                            meal.rating === "훌륭함" ? "bg-emerald-100 text-emerald-700 ml-2 flex-shrink-0" :
                            meal.rating === "좋음" ? "bg-blue-100 text-blue-700 ml-2 flex-shrink-0" :
                            meal.rating === "보통" ? "bg-yellow-100 text-yellow-700 ml-2 flex-shrink-0" :
                            "bg-red-100 text-red-700 ml-2 flex-shrink-0"
                          }>{meal.rating}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {new Date(meal.analyzed_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <div className="flex gap-2 flex-wrap mb-2">
                          <Badge className="bg-orange-100 text-orange-700">{meal.calories} kcal</Badge>
                          <Badge className="bg-blue-100 text-blue-700">지방 {meal.fat}g</Badge>
                          <Badge className="bg-purple-100 text-purple-700">당 {meal.sugar}g</Badge>
                        </div>
                        <p className="text-xs text-gray-600 bg-emerald-50 rounded-lg p-2">{meal.liver_impact}</p>
                      </div>
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
                key={badge.key}
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