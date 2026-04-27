import { useState, useEffect } from "react";
import { Link } from "react-router";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { LiverCharacter } from "../components/LiverCharacter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Activity,
  Dumbbell,
  Utensils,
  Moon,
  Wine,
  Cigarette,
  CheckCircle2,
  Clock,
  Hospital,
  Pill,
  Sparkles,
  Camera,
  X,
  Bell,
  Weight,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Appointment {
  id: number;
  hospital_name: string;
  visit_date: string;
  memo: string | null;
}

interface Medication {
  id: number;
  name: string;
  dosage: string;
  times: string[];
  completedToday: boolean[];
}

interface UserChallenge {
  user_challenge_id: number;
  challenge_name: string;
  type: string;
  status: string;
  today_completed: boolean;
  is_maintenance: boolean;
}

interface ImprovementFactor {
  category: string;
  challenge_type: string;
  score_delta: number;
}

interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  fat: number;
  sugar: number;
  liver_impact: string;
  recommendation: string;
  rating: string;
  image_url: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  운동: Dumbbell,
  식단: Utensils,
  식습관: Utensils,
  수면: Moon,
  금주: Wine,
  금연: Cigarette,
  체중감량: Weight,
};

function getTimePeriod(time: string) {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour >= 5 && hour <= 10) return "아침";
  if (hour >= 11 && hour <= 15) return "점심";
  if (hour >= 16 && hour <= 20) return "저녁";
  return "취침 전";
}

export function Home() {
  const { user } = useAuthStore();

  const [healthScore, setHealthScore] = useState(0);
  const [scorePercentile, setScorePercentile] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [improvementFactors, setImprovementFactors] = useState<ImprovementFactor[]>([]);
  const [aiMessage, setAiMessage] = useState<{ message: string; challenge_reason: string | null } | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [earnedBadgeCount, setEarnedBadgeCount] = useState(0);

  const [completeTarget, setCompleteTarget] = useState<UserChallenge | null>(null);
  const [maintenanceQueue, setMaintenanceQueue] = useState<UserChallenge[]>([]);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);

  const [foodAnalyzing, setFoodAnalyzing] = useState(false);
  const [foodResult, setFoodResult] = useState<FoodAnalysisResult | null>(null);

  const [medicationNotification, setMedicationNotification] = useState<{
    period: string;
    medications: Array<{ medId: number; medName: string; timeIndex: number }>;
  } | null>(null);

  const enqueueMaintenance = (challenges: UserChallenge[]) => {
    const today = new Date().toDateString();
    const shownKey = `maintenance_shown_${today}`;
    if (localStorage.getItem(shownKey)) return;
    const pending = challenges.filter((c) => c.is_maintenance);
    if (pending.length > 0) setMaintenanceQueue(pending);
  };

  const fetchChallenges = () =>
    api.get<UserChallenge[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } })
      .then((r) => { setActiveChallenges(r.data); enqueueMaintenance(r.data); })
      .catch(() => {});

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");

    api.get<{ latest_score: number; streak_days: number; improvement_factors: ImprovementFactor[]; score_percentile: number }>("/api/v1/dashboard")
      .then((r) => {
        setHealthScore(Math.round(r.data.latest_score));
        setScorePercentile(r.data.score_percentile ?? null);
        setStreakDays(r.data.streak_days);
        setImprovementFactors(r.data.improvement_factors || []);
      }).catch(() => {});

    api.get<{ message: string; challenge_reason: string | null }>("/api/v1/dashboard/message")
      .then((r) => setAiMessage(r.data)).catch(() => {});

    fetchChallenges();

    api.get<Appointment[]>("/api/v1/appointments/me")
      .then((r) => setAllAppointments(r.data)).catch(() => {});

    Promise.all([
      api.get<{ id: number; name: string; dosage: string; times: string[] }[]>("/api/v1/medications/me"),
      api.get<{ date: string; completions: { [idx: string]: boolean } }>(`/api/v1/medications/me/completions?date=${today}`),
    ]).then(([medsRes, compRes]) => {
      const completions = compRes.data.completions;
      setMedications(medsRes.data.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        times: m.times,
        completedToday: m.times.map((_, idx) => completions[idx] ?? false),
      })));
    }).catch(() => {});

    api.get<{ earned_count: number }>("/api/v1/badges/me/count")
      .then((r) => setEarnedBadgeCount(r.data.earned_count)).catch(() => {});
  }, []);

  useEffect(() => {
    const refreshChallenges = () => {
      if (document.visibilityState === "visible") fetchChallenges();
    };
    document.addEventListener("visibilitychange", refreshChallenges);
    return () => document.removeEventListener("visibilitychange", refreshChallenges);
  }, []);

  // 복약 시간 알림 체크
  useEffect(() => {
    const checkMedicationTime = () => {
      if (medications.length === 0) return;
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const schedules: Array<{ medId: number; medName: string; time: string; timeIndex: number; completed: boolean }> = [];
      medications.forEach((med) => {
        med.times.forEach((time, idx) => {
          schedules.push({ medId: med.id, medName: med.name, time, timeIndex: idx, completed: med.completedToday[idx] });
        });
      });
      const grouped = new Map<string, typeof schedules>();
      schedules.forEach((s) => {
        const period = getTimePeriod(s.time);
        if (!grouped.has(period)) grouped.set(period, []);
        grouped.get(period)!.push(s);
      });
      for (const [period, group] of grouped) {
        const allDone = group.every((m) => m.completed);
        if (!allDone && group[0].time === currentTime) {
          setMedicationNotification({ period, medications: group });
          break;
        }
      }
    };
    const interval = setInterval(checkMedicationTime, 60000);
    checkMedicationTime();
    return () => clearInterval(interval);
  }, [medications]);

  const handleMaintenanceCheckin = async (challenge: UserChallenge, stillMaintaining: boolean) => {
    setMaintenanceSubmitting(true);
    try {
      await api.post(`/api/v1/user-challenges/${challenge.type}/checkin`, { still_maintaining: stillMaintaining });
    } catch { /* ignore */ } finally {
      setMaintenanceSubmitting(false);
      setMaintenanceQueue((prev) => {
        const next = prev.slice(1);
        if (next.length === 0) {
          localStorage.setItem(`maintenance_shown_${new Date().toDateString()}`, "1");
          fetchChallenges();
        }
        return next;
      });
    }
  };

  const handleCompleteChallenge = async () => {
    if (!completeTarget) return;
    try {
      await api.post(`/api/v1/user-challenges/${completeTarget.user_challenge_id}/logs`, { is_completed: true });
      await fetchChallenges();
    } catch { /* 이미 오늘 기록함 */ } finally {
      setCompleteTarget(null);
    }
  };

  const handleToggleTaken = async (medId: number, timeIndex: number) => {
    const med = medications.find((m) => m.id === medId);
    if (!med) return;
    const newCompleted = !med.completedToday[timeIndex];
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;
        const updated = m.completedToday.map((c, i) => (i === timeIndex ? newCompleted : c));
        return { ...m, completedToday: updated };
      })
    );
    await api.patch(`/api/v1/medications/${medId}/completions`, {
      date: format(new Date(), "yyyy-MM-dd"),
      time_index: timeIndex,
      completed: newCompleted,
    }).catch(() => {});
  };

  const handleGroupToggle = async (period: string) => {
    const schedules: Array<{ medId: number; timeIndex: number; completed: boolean }> = [];
    medications.forEach((med) => {
      med.times.forEach((time, idx) => {
        if (getTimePeriod(time) === period) {
          schedules.push({ medId: med.id, timeIndex: idx, completed: med.completedToday[idx] });
        }
      });
    });
    const allDone = schedules.every((s) => s.completed);
    const newState = !allDone;
    setMedications((prev) =>
      prev.map((med) => {
        const updated = [...med.completedToday];
        med.times.forEach((time, idx) => {
          if (getTimePeriod(time) === period) updated[idx] = newState;
        });
        return { ...med, completedToday: updated };
      })
    );
    const today = format(new Date(), "yyyy-MM-dd");
    await Promise.all(
      schedules.map((s) =>
        api.patch(`/api/v1/medications/${s.medId}/completions`, {
          date: today,
          time_index: s.timeIndex,
          completed: newState,
        }).catch(() => {})
      )
    );
  };

  const handleDietImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoodResult(null);
    setFoodAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/api/v1/food/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFoodResult(res.data);
    } finally {
      setFoodAnalyzing(false);
      e.target.value = "";
    }
  };

  const calculateDday = (visitDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(visitDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nextAppointment = allAppointments
    .filter((apt) => calculateDday(apt.visit_date) >= 0)
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())[0] ?? null;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = allAppointments.filter((apt) => apt.visit_date.startsWith(todayStr));

  const getGroupedMedications = () => {
    const schedules: Array<{ medId: number; medName: string; time: string; timeIndex: number; completed: boolean }> = [];
    medications.forEach((med) => {
      med.times.forEach((time, idx) => {
        schedules.push({ medId: med.id, medName: med.name, time, timeIndex: idx, completed: med.completedToday[idx] });
      });
    });
    const grouped = new Map<string, typeof schedules>();
    schedules.forEach((s) => {
      const period = getTimePeriod(s.time);
      if (!grouped.has(period)) grouped.set(period, []);
      grouped.get(period)!.push(s);
    });
    const periodOrder = ["아침", "점심", "저녁", "취침 전"];
    return periodOrder
      .filter((p) => grouped.has(p))
      .map((period) => {
        const meds = grouped.get(period)!;
        return { period, time: meds[0].time, medications: meds, allCompleted: meds.every((m) => m.completed) };
      });
  };

  const completedToday = activeChallenges.filter((c) => c.today_completed).length;
  const totalChallenges = activeChallenges.length;
  const progressPercent = totalChallenges > 0 ? (completedToday / totalChallenges) * 100 : 0;

  return (
    <div className="space-y-5 lg:space-y-8 pb-8">
      {/* 복약 알림 */}
      {medicationNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Card className="border-2 border-purple-500 bg-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="size-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">복약 시간입니다</p>
                    <Button variant="ghost" size="icon" onClick={() => setMedicationNotification(null)} className="size-6 -mt-1 -mr-1">
                      <X className="size-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {medicationNotification.period}약: {medicationNotification.medications.map((m) => m.medName).join(", ")}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setMedicationNotification(null)} className="flex-1">나중에</Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={async () => {
                        await Promise.all(
                          medicationNotification.medications.map((m) => handleToggleTaken(m.medId, m.timeIndex))
                        );
                        setMedicationNotification(null);
                      }}
                    >
                      복용 완료
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center space-y-1.5">
        <h2 className="text-3xl font-bold text-gray-900">
          안녕하세요, {user?.nickname ?? ""}님! 👋
        </h2>
        <p className="text-gray-600">오늘도 간편이와 건강한 하루를 만들어가요</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 lg:gap-8">
        {/* 왼쪽: 간 건강 */}
        <div className="space-y-5">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="size-5 text-gray-700" />
            오늘의 간 건강
          </h3>

          <Card className="border border-gray-200 bg-gradient-to-br from-white via-emerald-50/30 to-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/10 rounded-full blur-3xl -z-10" />
            <CardContent className="py-8 px-6">
              <div className="flex flex-col items-center justify-center gap-5">
                {/* AI 말풍선 */}
                {aiMessage && (
                  <div className="relative w-full max-w-xs">
                    <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 relative">
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <div className="w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
                      </div>
                      <p className="text-center font-bold text-gray-900 text-sm">{aiMessage.message}</p>
                      {aiMessage.challenge_reason && (
                        <p className="text-center text-xs text-gray-500 mt-1">{aiMessage.challenge_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex-shrink-0">
                  <LiverCharacter healthScore={healthScore} />
                </div>

                <div className="w-full max-w-xs space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">건강 점수</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {healthScore}점
                      {scorePercentile !== null && (
                        <span className="text-base font-medium text-gray-500 ml-2">(상위 {scorePercentile}%)</span>
                      )}
                    </p>
                  </div>
                  <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)" }}>
                    <div
                      className="absolute top-0 right-0 h-full bg-gray-100 rounded-r-full transition-all duration-700"
                      style={{ width: `${100 - healthScore}%` }}
                    />
                  </div>

                  {improvementFactors.length > 0 && (
                    <div className="text-center space-y-2 pt-2">
                      <p className="text-sm font-semibold text-gray-700">지금 하면 점수가 올라요</p>
                      <div className="space-y-1 text-sm">
                        {improvementFactors.slice(0, 3).map((f) => (
                          <p key={f.category} className="text-gray-600">
                            {f.category}하면{" "}
                            <span className="font-bold text-emerald-600">+{f.score_delta}점</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border border-gray-200">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{streakDays}일</p>
                <p className="text-xs text-gray-500 mt-0.5">연속 참여</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{activeChallenges.length}개</p>
                <p className="text-xs text-gray-500 mt-0.5">진행 챌린지</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{earnedBadgeCount}개</p>
                <p className="text-xs text-gray-500 mt-0.5">획득 뱃지</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-600" />
                AI 추천 챌린지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">건강 데이터 분석을 바탕으로 맞춤 챌린지를 추천해드려요.</p>
              <Link to="/challenges">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                  챌린지 확인하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽: 오늘의 할 일 */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="size-5 text-gray-700" />
                오늘의 할 일
              </h3>
              <p className="text-sm text-gray-500 ml-2">
                {format(new Date(), "MM월 dd일 EEEE", { locale: ko })}
              </p>
            </div>

            {nextAppointment && (
              <Card className="border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none flex-shrink-0">
                <CardContent className="px-3 py-2 min-w-[140px]">
                  <div className="space-y-1 text-center">
                    <p className="text-lg font-bold leading-none">
                      {(() => {
                        const d = calculateDday(nextAppointment.visit_date);
                        return d === 0 ? "D-DAY" : d > 0 ? `D-${d}` : `D+${Math.abs(d)}`;
                      })()}
                    </p>
                    <p className="text-xs font-medium text-emerald-800">{nextAppointment.hospital_name}</p>
                    <p className="text-xs text-emerald-700/80">
                      {format(new Date(nextAppointment.visit_date), "yyyy.MM.dd (E) HH:mm", { locale: ko })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 오늘의 목표: 진행중 챌린지 */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">오늘의 목표</CardTitle>
                {totalChallenges > 0 && (
                  <span className="text-xs text-gray-500">{completedToday}/{totalChallenges} 완료</span>
                )}
              </div>
              {totalChallenges > 0 && <Progress value={progressPercent} className="h-1.5 mt-2" />}
            </CardHeader>
            <CardContent className="space-y-1.5">
              {totalChallenges === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">진행 중인 챌린지가 없습니다.</p>
              ) : (
                activeChallenges.map((challenge) => {
                  const Icon = TYPE_ICON[challenge.type] ?? Activity;
                  return (
                    <button
                      key={challenge.user_challenge_id}
                      onClick={() => !challenge.today_completed && setCompleteTarget(challenge)}
                      disabled={challenge.today_completed}
                      className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg border transition-all text-left ${
                        challenge.today_completed
                          ? "bg-emerald-50 border-emerald-200 cursor-default"
                          : "bg-gray-50 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                      }`}
                    >
                      <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${challenge.today_completed ? "bg-emerald-100" : "bg-gray-200"}`}>
                        <Icon className={`size-4 ${challenge.today_completed ? "text-emerald-600" : "text-gray-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${challenge.today_completed ? "text-gray-900" : "text-gray-700"}`}>
                          {challenge.challenge_name}
                        </p>
                      </div>
                      <CheckCircle2 className={`size-5 flex-shrink-0 ${challenge.today_completed ? "text-emerald-600" : "text-gray-300"}`} />
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* 식단 기록 */}
          <div className="md:hidden space-y-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              capture="environment"
              onChange={handleDietImageCapture}
              className="hidden"
              id="diet-camera-input"
            />
            <label htmlFor="diet-camera-input">
              <Button
                asChild
                disabled={foodAnalyzing}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <span className="flex items-center justify-center gap-2">
                  <Camera className="size-4" />
                  {foodAnalyzing ? "분석 중..." : "식단 기록하기"}
                </span>
              </Button>
            </label>
            {foodResult && (
              <Card className="border border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{foodResult.food_name}</p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {foodResult.rating}
                    </span>
                  </div>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span>칼로리 {foodResult.calories}kcal</span>
                    <span>지방 {foodResult.fat}g</span>
                    <span>당류 {foodResult.sugar}g</span>
                  </div>
                  <p className="text-sm text-gray-700">{foodResult.liver_impact}</p>
                  <p className="text-sm text-emerald-700 font-medium">{foodResult.recommendation}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 병원 일정 */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Hospital className="size-4 text-blue-600" />
                병원 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  {todayAppointments.map((apt) => (
                    <div key={apt.id} className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-semibold text-gray-900 text-sm">{apt.hospital_name}</p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {format(new Date(apt.visit_date), "HH:mm")}
                      </p>
                      {apt.memo && <p className="text-sm text-gray-600 mt-0.5">{apt.memo}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2.5">오늘 예정된 병원 일정이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* 복약 일정 */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Pill className="size-4 text-purple-600" />
                  복약 일정
                </CardTitle>
                {getGroupedMedications().length > 0 && (
                  <p className="text-xs text-gray-500">복용 완료 시 체크</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {getGroupedMedications().length > 0 ? (
                getGroupedMedications().map((group) => (
                  <div
                    key={group.period}
                    className={`py-2.5 px-3 rounded-lg border transition-all ${
                      group.allCompleted ? "bg-gray-100 border-gray-300" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${group.allCompleted ? "line-through" : ""}`}>
                          <span className={`font-semibold ${group.allCompleted ? "text-gray-500" : "text-gray-900"}`}>
                            {group.period}약 ({group.time})
                          </span>
                          <span className="text-gray-600 mx-2">|</span>
                          <span className={group.allCompleted ? "text-gray-500" : "text-gray-700"}>
                            {group.medications.map((med, idx) => (
                              <span key={`${med.medId}-${med.timeIndex}`}>
                                {idx > 0 && " · "}
                                {med.medName}
                              </span>
                            ))}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {group.allCompleted && <span className="text-xs text-emerald-600 font-medium">완료</span>}
                        <Checkbox
                          checked={group.allCompleted}
                          onCheckedChange={() => handleGroupToggle(group.period)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-2.5">오늘 복약 일정이 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 유지 모드 체크인 다이얼로그 */}
      <Dialog open={maintenanceQueue.length > 0} onOpenChange={() => {}}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{maintenanceQueue[0]?.type} 유지 중이신가요? 💪</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{maintenanceQueue[0]?.challenge_name}</span> 챌린지를 완료하셨습니다.
              오늘도 계속 유지하고 있다면 확인해주세요.
            </DialogDescription>
          </DialogHeader>
          {maintenanceQueue.length > 1 && (
            <p className="text-xs text-gray-400 text-center">{maintenanceQueue.length - 1}개 더 확인이 필요합니다</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={maintenanceSubmitting} onClick={() => maintenanceQueue[0] && handleMaintenanceCheckin(maintenanceQueue[0], false)}>
              그만할게요
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              disabled={maintenanceSubmitting}
              onClick={() => maintenanceQueue[0] && handleMaintenanceCheckin(maintenanceQueue[0], true)}
            >
              <CheckCircle2 className="size-4 mr-2" />
              네, 유지 중이에요!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 챌린지 완료 확인 다이얼로그 */}
      <Dialog open={!!completeTarget} onOpenChange={(o) => !o && setCompleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>오늘의 목표를 완료하셨나요?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{completeTarget?.challenge_name}</span> 챌린지의 오늘 목표를 달성했다면 완료로 기록합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>아직 아니에요</Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleCompleteChallenge}
            >
              <CheckCircle2 className="size-4 mr-2" />
              완료했어요!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
