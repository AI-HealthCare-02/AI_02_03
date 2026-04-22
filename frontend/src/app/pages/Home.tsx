import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Calendar } from "../components/ui/calendar";
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
  TrendingUp,
  Target,
  Award,
  ChevronRight,
  Clock,
  Hospital,
  Pill,
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

const TYPE_ICON: Record<string, React.ElementType> = {
  운동: Dumbbell,
  식단: Utensils,
  식습관: Utensils,
  수면: Moon,
  금주: Wine,
  금연: Cigarette,
};

export function Home() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [checkedAppointments, setCheckedAppointments] = useState<{ [key: number]: boolean }>({});
  const [healthScore, setHealthScore] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [activeChallenges, setActiveChallenges] = useState<UserChallenge[]>([]);
  const [earnedBadgeCount, setEarnedBadgeCount] = useState(0);
  const [completeTarget, setCompleteTarget] = useState<UserChallenge | null>(null);
  const [aiMessage, setAiMessage] = useState<{ message: string; challenge_reason: string | null } | null>(null);
  const [maintenanceQueue, setMaintenanceQueue] = useState<UserChallenge[]>([]);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);

  const enqueueMaintenance = (challenges: UserChallenge[]) => {
    const today = new Date().toDateString();
    const shownKey = `maintenance_shown_${today}`;
    if (localStorage.getItem(shownKey)) return;
    const pending = challenges.filter((c) => c.is_maintenance);
    if (pending.length > 0) {
      setMaintenanceQueue(pending);
    }
  };

  const handleMaintenanceCheckin = async (challenge: UserChallenge, stillMaintaining: boolean) => {
    setMaintenanceSubmitting(true);
    try {
      await api.post(`/api/v1/user-challenges/${challenge.type}/checkin`, { still_maintaining: stillMaintaining });
    } catch {
      // ignore
    } finally {
      setMaintenanceSubmitting(false);
      setMaintenanceQueue((prev) => {
        const next = prev.slice(1);
        if (next.length === 0) {
          localStorage.setItem(`maintenance_shown_${new Date().toDateString()}`, "1");
          api.get<UserChallenge[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } })
            .then((r) => setActiveChallenges(r.data))
            .catch(() => {});
        }
        return next;
      });
    }
  };

  useEffect(() => {
    api.get<Appointment[]>("/api/v1/appointments/me").then((r) => {
      setAllAppointments(r.data);
    }).catch(() => {});

    const today = format(new Date(), "yyyy-MM-dd");
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

    api.get<{
      latest_score: number;
      streak_days: number;
    }>("/api/v1/dashboard").then((r) => {
      setHealthScore(Math.round(r.data.latest_score));
      setStreakDays(r.data.streak_days);
    }).catch(() => {});

    api.get<UserChallenge[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } }).then((r) => {
      setActiveChallenges(r.data);
      enqueueMaintenance(r.data);
    }).catch(() => {});

    api.get<{ earned_count: number }>("/api/v1/badges/me/count").then((r) => {
      setEarnedBadgeCount(r.data.earned_count);
    }).catch(() => {});

    api.get<{ message: string; challenge_reason: string | null }>("/api/v1/dashboard/message")
      .then((r) => setAiMessage(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const refreshChallenges = () => {
      if (document.visibilityState === "visible") {
        api.get<UserChallenge[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } })
          .then((r) => { setActiveChallenges(r.data); enqueueMaintenance(r.data); })
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", refreshChallenges);
    return () => document.removeEventListener("visibilitychange", refreshChallenges);
  }, []);

  const handleCompleteChallenge = async () => {
    if (!completeTarget) return;
    try {
      await api.post(`/api/v1/user-challenges/${completeTarget.user_challenge_id}/logs`, { is_completed: true });
      const r = await api.get<UserChallenge[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } });
      setActiveChallenges(r.data);
    } catch {
      // 이미 오늘 기록함
    } finally {
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

  const calculateDday = (targetDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nextAppointment = allAppointments
    .filter((apt) => {
      const d = new Date(apt.visit_date);
      d.setHours(0, 0, 0, 0);
      return d >= new Date(new Date().setHours(0, 0, 0, 0));
    })
    .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())[0] ?? null;

  const completedToday = activeChallenges.filter(c => c.today_completed).length;
  const totalHabits = activeChallenges.length;
  const progressPercent = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          안녕하세요, {user?.nickname ?? ""}님! 👋
        </h2>
        <p className="text-gray-600">오늘도 건강한 하루를 만들어가요</p>
      </div>

      {/* Desktop: Two Column Layout | Mobile: Stack */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Card 1: Liver Character Status + Today's Progress */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl -z-10" />
          <CardContent className="p-6">
            {/* Liver Character with Speech Bubble */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <LiverCharacter healthScore={healthScore} />
                {/* AI Speech Bubble */}
                {aiMessage && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-max max-w-sm">
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-200 p-3 relative">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-emerald-200 rotate-45"></div>
                      <p className="text-center text-sm font-medium text-gray-800">
                        {aiMessage.message}
                      </p>
                      {aiMessage.challenge_reason && (
                        <p className="text-center text-xs text-gray-500 mt-1">
                          {aiMessage.challenge_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Health Score */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">건강 점수</p>
                <p className="text-3xl font-bold text-emerald-600">{healthScore}점</p>
              </div>
            </div>

            {/* Today's Progress Section */}
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                    <Target className="size-5 text-emerald-600" />
                    오늘의 목표
                  </h3>
                  <p className="text-sm text-gray-600">
                    {completedToday}/{totalHabits} 완료
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-900">
                  {Math.round(progressPercent)}%
                </Badge>
              </div>

              <Progress value={progressPercent} className="h-3" />

              {totalHabits === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">진행중인 챌린지가 없습니다.</p>
              ) : (
                <div className="grid gap-3">
                  {activeChallenges.map((challenge) => {
                    const Icon = TYPE_ICON[challenge.type] ?? Activity;
                    return (
                      <button
                        key={challenge.user_challenge_id}
                        onClick={() => !challenge.today_completed && setCompleteTarget(challenge)}
                        disabled={challenge.today_completed}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                          challenge.today_completed
                            ? "bg-white border-emerald-200 cursor-default"
                            : "bg-gray-50 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer"
                        }`}
                      >
                        <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          challenge.today_completed ? "bg-emerald-100" : "bg-gray-200"
                        }`}>
                          <Icon className={`size-5 ${
                            challenge.today_completed ? "text-emerald-600" : "text-gray-500"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={challenge.today_completed ? "text-gray-900" : "text-gray-600"}>
                            {challenge.challenge_name}
                          </p>
                          <p className="text-xs text-gray-500">{challenge.today_completed ? "오늘 완료!" : challenge.type}</p>
                        </div>
                        <CheckCircle2 className={`size-5 flex-shrink-0 ${challenge.today_completed ? "text-emerald-600" : "text-gray-300"}`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* New Challenge Button - Small Size */}
              <Link to="/challenges">
                <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 mt-4">
                  새로운 챌린지 시작하기
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Today's Schedule */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5 text-blue-600" />
                  {selectedDate && selectedDate.toDateString() === new Date().toDateString()
                    ? "오늘의 일정"
                    : selectedDate
                      ? `${format(selectedDate, "M월 d일 (E)", { locale: ko })} 일정`
                      : "오늘의 일정"}
                </CardTitle>
                <CardDescription>
                  {format(new Date(), "MM월 dd일 EEEE", { locale: ko })}
                </CardDescription>
              </div>
              {nextAppointment && (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg shadow-md text-center">
                  <p className="text-xs font-medium opacity-90">다가오는 일정</p>
                  <p className="text-xl font-bold">
                    {calculateDday(nextAppointment.visit_date) === 0
                      ? "D-DAY"
                      : calculateDday(nextAppointment.visit_date) > 0
                        ? `D-${calculateDday(nextAppointment.visit_date)}`
                        : `D+${Math.abs(calculateDday(nextAppointment.visit_date))}`}
                  </p>
                  <p className="text-xs mt-0.5 truncate max-w-[90px]">{nextAppointment.hospital_name}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calendar */}
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ko}
                className="rounded-md w-full"
                modifiers={{
                  hasAppointment: allAppointments.map((a) => {
                    const d = new Date(a.visit_date);
                    d.setHours(0, 0, 0, 0);
                    return d;
                  }),
                }}
                modifiersClassNames={{ hasAppointment: "has-appointment-home" }}
              />
              <style>{`
                .has-appointment-home { position: relative; }
                .has-appointment-home::after {
                  content: '';
                  position: absolute;
                  bottom: 2px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 4px;
                  height: 4px;
                  background-color: #3b82f6;
                  border-radius: 50%;
                }
              `}</style>
            </div>

            {/* Appointments for selected date */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {selectedDate ? format(selectedDate, "MM월 dd일", { locale: ko }) : "오늘"} 병원 일정
              </p>
              {(() => {
                const filtered = allAppointments.filter(
                  (a) => new Date(a.visit_date).toDateString() === (selectedDate ?? new Date()).toDateString()
                );
                const isToday = (selectedDate ?? new Date()).toDateString() === new Date().toDateString();
                return filtered.length > 0 ? (
                  <div className="space-y-2">
                    {filtered.map((apt) => (
                      <div
                        key={apt.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          checkedAppointments[apt.id]
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-blue-100"
                        }`}
                      >
                        <Hospital className={`size-4 mt-0.5 flex-shrink-0 ${checkedAppointments[apt.id] ? "text-emerald-600" : "text-blue-600"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{apt.hospital_name}</p>
                          <p className="text-xs text-gray-600">{format(new Date(apt.visit_date), "HH:mm")}</p>
                        </div>
                        {isToday && (
                          <Checkbox
                            checked={checkedAppointments[apt.id] || false}
                            onCheckedChange={() =>
                              setCheckedAppointments((prev) => ({ ...prev, [apt.id]: !prev[apt.id] }))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">예정된 일정이 없습니다.</p>
                );
              })()}
            </div>

            {/* Today's Medications */}
            <div className="pt-3 border-t border-blue-100">
              <p className="text-sm font-medium text-gray-700 mb-2">오늘의 복약</p>
              {medications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">복약 정보가 없습니다</p>
              ) : (
                medications.map((med) =>
                  med.times.map((time, idx) => (
                    <div
                      key={`${med.id}-${idx}`}
                      className={`flex items-center justify-between p-2 rounded border mb-2 transition-all ${
                        med.completedToday[idx] ? "bg-emerald-50 border-emerald-200" : "bg-white border-blue-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Pill className={`size-4 ${med.completedToday[idx] ? "text-emerald-600" : "text-purple-600"}`} />
                        <div>
                          <p className="text-sm font-medium">{med.name}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={med.completedToday[idx]}
                        onCheckedChange={() => handleToggleTaken(med.id, idx)}
                      />
                    </div>
                  ))
                )
              )}
            </div>

            {/* Button to schedule page */}
            <Link to="/schedule" className="block">
              <Button variant="outline" className="w-full border-2 border-blue-300 hover:bg-blue-50">
                일정 관리 페이지로 이동
                <ChevronRight className="size-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{streakDays}일</p>
                <p className="text-sm text-gray-600">연속 참여</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="size-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeChallenges.length}개</p>
                <p className="text-sm text-gray-600">활성 챌린지</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Award className="size-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{earnedBadgeCount}개</p>
                <p className="text-sm text-gray-600">획득 뱃지</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 유지 모드 체크인 다이얼로그 */}
      <Dialog open={maintenanceQueue.length > 0} onOpenChange={() => {}}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {maintenanceQueue[0]?.type} 유지 중이신가요? 💪
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{maintenanceQueue[0]?.challenge_name}</span> 챌린지를 완료하셨습니다.
              오늘도 계속 유지하고 있다면 확인해주세요.
            </DialogDescription>
          </DialogHeader>
          {maintenanceQueue.length > 1 && (
            <p className="text-xs text-gray-400 text-center">{maintenanceQueue.length - 1}개 더 확인이 필요합니다</p>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={maintenanceSubmitting}
              onClick={() => maintenanceQueue[0] && handleMaintenanceCheckin(maintenanceQueue[0], false)}
            >
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

      {/* Quick Tips */}
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 오늘의 건강 팁
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            지방간 예방을 위해 하루 30분 이상의 유산소 운동을 권장합니다.
            빠르게 걷기, 자전거 타기, 수영 등이 효과적이며, 꾸준한 운동은
            간 건강 개선에 큰 도움이 됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
