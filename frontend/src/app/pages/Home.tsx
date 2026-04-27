import { useState, useEffect } from "react";
import { Link } from "react-router";
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
  Activity,
  Droplet,
  Utensils,
  Moon,
  CheckCircle2,
  Clock,
  Hospital,
  Pill,
  Sparkles,
  Camera,
  X,
  Bell,
} from "lucide-react";
import {
  format,
  differenceInDays,
  parseISO,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";

export function Home() {
  const [todayHabits] = useState([
    {
      id: 1,
      name: "30분 걷기",
      icon: Activity,
      completed: false,
      category: "운동",
    },
    {
      id: 2,
      name: "물 2L 마시기",
      icon: Droplet,
      completed: false,
      category: "수분",
    },
    {
      id: 3,
      name: "채소 중심 식사",
      icon: Utensils,
      completed: false,
      category: "식습관",
    },
    {
      id: 4,
      name: "7시간 이상 수면",
      icon: Moon,
      completed: false,
      category: "수면",
    },
  ]);

  const [allAppointments] = useState([
    {
      id: 1,
      date: "2026-04-23",
      time: "14:00",
      hospital: "서울대학교병원",
      memo: "정기 검진",
    },
    {
      id: 2,
      date: "2026-04-25",
      time: "10:30",
      hospital: "연세세브란스병원",
      memo: "혈액 검사 결과 확인",
    },
    {
      id: 3,
      date: "2026-04-30",
      time: "15:00",
      hospital: "삼성서울병원",
      memo: "간 초음파 검사",
    },
  ]);

  const [allMedications, setAllMedications] = useState([
    {
      id: 1,
      name: "우루사",
      times: ["08:00", "12:00", "18:00"],
      completed: [true, false, false],
    },
    {
      id: 2,
      name: "밀크씨슬",
      times: ["08:00"],
      completed: [false],
    },
  ]);

  const today = startOfDay(new Date());

  const upcomingAppointments = allAppointments
    .map((apt) => ({
      ...apt,
      date: parseISO(apt.date),
    }))
    .filter((apt) => apt.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const nextAppointment = upcomingAppointments[0];

  const calculateDday = (targetDate: Date) => {
    const baseToday = new Date();
    baseToday.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - baseToday.getTime();
    const diffDays = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24),
    );
    return diffDays;
  };

  const getDdayLabel = (targetDate: Date) => {
    const dday = calculateDday(targetDate);

    if (dday === 0) return "D-DAY";
    if (dday > 0) return `D-${dday}`;
    return `D+${Math.abs(dday)}`;
  };

  const getTimePeriod = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 5 && hour <= 10) return "아침";
    if (hour >= 11 && hour <= 15) return "점심";
    if (hour >= 16 && hour <= 20) return "저녁";
    return "취침 전";
  };

  const getGroupedMedications = () => {
    const schedules: Array<{
      medId: number;
      medName: string;
      time: string;
      timeIndex: number;
      completed: boolean;
    }> = [];

    allMedications.forEach((med) => {
      med.times.forEach((time, idx) => {
        schedules.push({
          medId: med.id,
          medName: med.name,
          time: time,
          timeIndex: idx,
          completed: med.completed[idx],
        });
      });
    });

    const grouped = new Map<string, typeof schedules>();
    schedules.forEach((schedule) => {
      const period = getTimePeriod(schedule.time);
      if (!grouped.has(period)) {
        grouped.set(period, []);
      }
      grouped.get(period)!.push(schedule);
    });

    const periodOrder = ["아침", "점심", "저녁", "취침 전"];
    return periodOrder
      .filter((period) => grouped.has(period))
      .map((period) => {
        const meds = grouped.get(period)!;
        return {
          period,
          time: meds[0].time,
          medications: meds,
          allCompleted: meds.every((m) => m.completed),
        };
      });
  };

  const toggleMedicationComplete = (
    medId: number,
    timeIndex: number,
  ) => {
    setAllMedications((prev) =>
      prev.map((med) => {
        if (med.id === medId) {
          const newCompleted = [...med.completed];
          newCompleted[timeIndex] = !newCompleted[timeIndex];
          return { ...med, completed: newCompleted };
        }
        return med;
      })
    );
  };

  const toggleGroupComplete = (period: string) => {
    const groups = getGroupedMedications();
    const group = groups.find((g) => g.period === period);
    if (!group) return;

    const newState = !group.allCompleted;
    setAllMedications((prev) =>
      prev.map((med) => {
        const newCompleted = [...med.completed];
        med.times.forEach((time, idx) => {
          if (getTimePeriod(time) === period) {
            newCompleted[idx] = newState;
          }
        });
        return { ...med, completed: newCompleted };
      })
    );
  };

  // 복약 알림 상태
  const [medicationNotification, setMedicationNotification] = useState<{
    period: string;
    medications: Array<{ medId: number; medName: string; timeIndex: number }>;
  } | null>(null);

  // 복약 시간 체크
  useEffect(() => {
    const checkMedicationTime = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      const groups = getGroupedMedications();

      for (const group of groups) {
        // 아직 완료되지 않은 그룹만 확인
        if (!group.allCompleted && group.time === currentTime) {
          setMedicationNotification({
            period: group.period,
            medications: group.medications,
          });
          break;
        }
      }
    };

    // 1분마다 체크
    const interval = setInterval(checkMedicationTime, 60000);
    checkMedicationTime(); // 초기 실행

    return () => clearInterval(interval);
  }, [allMedications]);

  // 복용 완료 처리
  const handleCompleteMedication = () => {
    if (medicationNotification) {
      toggleGroupComplete(medicationNotification.period);
      setMedicationNotification(null);
    }
  };

  // 나중에 알림
  const handleDismissNotification = () => {
    setMedicationNotification(null);
  };

  const completedToday = todayHabits.filter(
    (h) => h.completed,
  ).length;
  const totalHabits = todayHabits.length;
  const progressPercent = (completedToday / totalHabits) * 100;

  const streakDays = 14;
  const activeChallenges = 3;
  const totalChallenges = 5;
  const earnedBadges = 8;

  const healthScore = Math.round(
    progressPercent * 0.4 +
      Math.min(streakDays / 30, 1) * 100 * 0.3 +
      (activeChallenges / totalChallenges) * 100 * 0.2 +
      Math.min(earnedBadges / 10, 1) * 100 * 0.1,
  );

  const getHealthStatus = (score: number) => {
    if (score >= 80)
      return {
        message: "아주 건강해요! 이대로 유지하세요",
        emoji: "😊",
      };
    if (score >= 60)
      return {
        message: "양호해요! 조금만 더 노력해봐요",
        emoji: "🙂",
      };
    if (score >= 40)
      return {
        message: "주의가 필요해요! 개선이 필요합니다",
        emoji: "😐",
      };
    return {
      message: "위험해요! 관심이 필요합니다",
      emoji: "😥",
    };
  };

  const healthStatus = getHealthStatus(healthScore);

  const todayAppointments = allAppointments.filter(
    (apt) => differenceInDays(parseISO(apt.date), today) === 0,
  );

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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDismissNotification}
                      className="size-6 -mt-1 -mr-1"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {medicationNotification.period}약: {medicationNotification.medications.map(m => m.medName).join(", ")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDismissNotification}
                      className="flex-1"
                    >
                      나중에
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleCompleteMedication}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
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
          간(肝)편한 사용자님 안녕하세요! 👋
        </h2>
        <p className="text-gray-600">
          오늘도 간편이와 건강한 하루를 만들어가요
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 lg:gap-8">
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
                <div className="relative w-full max-w-xs">
                  <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 relative">
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <div className="w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
                    </div>

                    <p className="text-center font-bold text-gray-900 text-lg mb-1">
                      목이 말라요 💧
                    </p>
                    <p className="text-center text-sm text-gray-600">
                      물을 조금 더 마셔볼까요?
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <LiverCharacter healthScore={healthScore} rank={27} />
                </div>

                <div className="w-full max-w-xs space-y-4">
                  <Progress
                    value={healthScore}
                    className="h-2"
                  />

                  <div className="text-center space-y-2 pt-2">
                    <p className="text-sm font-semibold text-gray-700">지금 하면 점수가 올라요</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        금주하면 <span className="font-bold text-emerald-600">+8점</span>
                      </p>
                      <p className="text-gray-600">
                        운동하면 <span className="font-bold text-emerald-600">+5점</span>
                      </p>
                      <p className="text-gray-600">
                        수면 개선하면 <span className="font-bold text-emerald-600">+3점</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-600" />
                AI 추천 챌린지
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Droplet className="size-5 text-emerald-600" />
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-bold text-gray-900 text-lg">
                    물 2L 마시기
                  </h4>
                  <p className="text-sm text-gray-700">
                    현재 수분 섭취 부족 상태입니다.
                  </p>
                  <p className="text-sm text-gray-700">
                    물 3잔 추가 섭취 시{" "}
                    <span className="font-bold text-emerald-600">
                      건강 점수 +3 상승
                    </span>{" "}
                    예상
                  </p>
                </div>
              </div>

              <Link to="/challenges" className="block">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                  챌린지 시작
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="size-5 text-gray-700" />
                오늘의 할 일
              </h3>
              <p className="text-sm text-gray-500 ml-2">
                {format(new Date(), "MM월 dd일 EEEE", {
                  locale: ko,
                })}
              </p>
            </div>

            {nextAppointment && (
              <Card className="border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none flex-shrink-0">
                <CardContent className="px-3 py-2 min-w-[140px]">
                  <div className="space-y-1 text-center">
                    <p className="text-lg font-bold leading-none">
                      {getDdayLabel(nextAppointment.date)}
                    </p>
                    <p className="text-xs font-medium text-emerald-800">
                      {nextAppointment.hospital}
                    </p>
                    <p className="text-xs text-emerald-700/80">
                      {format(
                        nextAppointment.date,
                        "yyyy.MM.dd (E)",
                        { locale: ko },
                      )}{" "}
                      {nextAppointment.time}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border border-gray-200">
            <CardHeader className="pb-1">
              <CardTitle className="text-base font-semibold text-gray-900">
                오늘의 목표
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {todayHabits.map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center gap-2.5 py-2.5 px-3 rounded-lg border transition-all ${
                    habit.completed
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      habit.completed
                        ? "bg-emerald-100"
                        : "bg-gray-200"
                    }`}
                  >
                    <habit.icon
                      className={`size-4 ${
                        habit.completed
                          ? "text-emerald-600"
                          : "text-gray-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        habit.completed
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      {habit.name}
                    </p>
                  </div>

                  {habit.completed && (
                    <CheckCircle2 className="size-5 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 식단 기록 CTA 버튼 - 모바일에서만 표시 */}
          <div className="md:hidden">
            <Button
              disabled
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 opacity-50 cursor-not-allowed"
            >
              <Camera className="size-4 mr-2" />
              식단 기록하기 (준비 중)
            </Button>
          </div>

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
                    <div
                      key={apt.id}
                      className="p-2.5 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        {apt.hospital}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {apt.time}
                      </p>
                      {apt.memo && (
                        <p className="text-sm text-gray-600 mt-0.5">
                          {apt.memo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-2.5">
                  오늘 예정된 병원 일정이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200">
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Pill className="size-4 text-purple-600" />
                  복약 일정
                </CardTitle>
                {getGroupedMedications().length > 0 && (
                  <p className="text-xs text-gray-500">복용 완료시 체크</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {getGroupedMedications().length > 0 ? (
                getGroupedMedications().map((group) => (
                  <div
                    key={group.period}
                    className={`py-2.5 px-3 rounded-lg border transition-all ${
                      group.allCompleted
                        ? "bg-gray-100 border-gray-300"
                        : "bg-gray-50 border-gray-200"
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
                        {group.allCompleted && (
                          <span className="text-xs text-emerald-600 font-medium">완료</span>
                        )}
                        <Checkbox
                          checked={group.allCompleted}
                          onCheckedChange={() => toggleGroupComplete(group.period)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-2.5">
                  오늘 복약 일정이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}