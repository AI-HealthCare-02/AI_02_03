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
  Cigarette,
  Upload,
  Loader2,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DietAnalysisState = "idle" | "loading" | "result";

interface Challenge {
  id: number;
  title: string;
  description: string;
  icon: any;
  duration: string;
  participants: number;
  difficulty: "초급" | "중급" | "고급";
  category: string;
  progress?: number;
  daysLeft?: number;
}

export function Progress() {
  const [activeTab, setActiveTab] = useState("health");
  const [dietState, setDietState] = useState<DietAnalysisState>("idle");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const streakDays = 14;
  const weeklyRate = 78;
  const earnedBadges = 8;

  const [healthScore, setHealthScore] = useState(0);
  const [activeChallengesCount, setActiveChallengesCount] = useState(0);
  const [healthScoreHistory, setHealthScoreHistory] = useState<{ day: string; score: number }[]>([]);
  const [weightData, setWeightData] = useState<{ day: string; value: number }[]>([]);
  const [alcoholData, setAlcoholData] = useState<{ day: string; amount: number }[]>([]);
  const [smokingData, setSmokingData] = useState<{ day: string; amount: number }[]>([]);
  const [activeChallengesList, setActiveChallengesList] = useState<Challenge[]>([]);
  const [availableChallengesList, setAvailableChallengesList] = useState<Challenge[]>([]);
  const [joiningChallenge, setJoiningChallenge] = useState<number | null>(null);

  const sleepData = [
    { day: "월", hours: 7.2 },
    { day: "화", hours: 6.5 },
    { day: "수", hours: 7.8 },
    { day: "목", hours: 7.5 },
    { day: "금", hours: 6.8 },
    { day: "토", hours: 8.2 },
    { day: "일", hours: 7.9 },
  ];

  const TYPE_ICON: Record<string, any> = {
    운동: Activity,
    식습관: Scale,
    식단: Scale,
    수면: BedDouble,
    수분: Activity,
    금주: Award,
    체중관리: Scale,
  };
  const typeIcon = (type: string) => TYPE_ICON[type] ?? Activity;

  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  useEffect(() => {
    // 건강 점수 히스토리
    api
      .get<{ score: number; grade: string; created_at: string }[]>("/api/v1/predictions/me")
      .then((r) => {
        if (r.data.length > 0) {
          setHealthScore(Math.round(r.data[0].score));
          setHealthScoreHistory(
            r.data
              .slice(0, 7)
              .reverse()
              .map((p, i) => ({ day: `${i + 1}회`, score: Math.round(p.score) }))
          );
        }
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

  // Recent meals
  const [recentMeals] = useState([
    { id: 1, date: "2024-04-09 점심", food: "닭가슴살 샐러드", calories: 350, rating: "좋음", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
    { id: 2, date: "2024-04-09 아침", food: "그릭 요거트", calories: 180, rating: "훌륭함", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop" },
    { id: 3, date: "2024-04-08 저녁", food: "현미밥과 구이", calories: 520, rating: "보통", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop" },
    { id: 4, date: "2024-04-08 점심", food: "채소 볶음밥", calories: 420, rating: "좋음", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop" },
    { id: 5, date: "2024-04-08 아침", food: "오트밀", calories: 250, rating: "훌륭함", image: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=300&fit=crop" },
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    setDietState("loading");
    setTimeout(() => {
      setDietState("result");
    }, 2000);
  };

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
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-xl font-bold text-gray-900">
                    {weightData.length > 0 ? `${weightData[weightData.length - 1].value}kg` : "-"}
                  </p>
                  <p className="text-xs text-gray-600">최근 기록</p>
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
                  <p className="text-xl font-bold text-gray-900">
                    {alcoholData.reduce((s, d) => s + d.amount, 0)}잔
                  </p>
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
                  <p className="text-xl font-bold text-gray-900">
                    {smokingData.reduce((s, d) => s + d.amount, 0)}개
                  </p>
                  <p className="text-xs text-gray-600">이번 주 총량</p>
                </div>
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
            {recentMeals.map((meal) => (
              <Card key={meal.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img src={meal.image} alt={meal.food} className="size-24 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{meal.date}</p>
                      <p className="font-bold text-gray-900 mb-1">{meal.food}</p>
                      <p className="text-sm text-gray-600 mb-2">{meal.calories} kcal</p>
                      <Badge className="bg-emerald-100 text-emerald-700">{meal.rating}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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