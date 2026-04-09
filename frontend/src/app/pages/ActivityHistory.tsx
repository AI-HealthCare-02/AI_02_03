import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  History,
  Download,
  Search,
  Scale,
  Dumbbell,
  Wine,
  Calendar,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Cigarette,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../lib/api";

type PeriodFilter = "week" | "month";
type InfoFilter = "all" | "weight" | "exercise" | "alcohol" | "smoking";
type ViewMode = "list" | "calendar";

interface DailyHealthLog {
  id: number;
  log_date: string;
  weight: number | null;
  exercise_done: boolean;
  exercise_duration: number | null;
  alcohol_consumed: boolean;
  alcohol_amount: number | null;
  smoking_done: boolean;
  smoking_amount: number | null;
  created_at: string;
  updated_at: string;
}

interface DisplayRecord {
  id: number;
  date: string;       // "2026.04.07"
  dayOfWeek: string;
  weight: number | null;
  weightChange?: number;
  exercise: { done: boolean; duration?: number };
  alcohol: { consumed: boolean; amount?: number };
  smoking: { smoked: boolean; amount?: number };
}

const DAY_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function toDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function toDayOfWeek(dateStr: string) {
  return DAY_OF_WEEK[new Date(dateStr).getDay()];
}

function logsToRecords(logs: DailyHealthLog[]): DisplayRecord[] {
  return logs.map((log, i) => {
    const prevLog = logs[i + 1];
    const weightChange =
      log.weight !== null && prevLog?.weight !== null && prevLog?.weight !== undefined
        ? Math.round((log.weight - prevLog.weight) * 10) / 10
        : undefined;

    return {
      id: log.id,
      date: toDisplayDate(log.log_date),
      dayOfWeek: toDayOfWeek(log.log_date),
      weight: log.weight,
      weightChange,
      exercise: { done: log.exercise_done, duration: log.exercise_duration ?? undefined },
      alcohol: { consumed: log.alcohol_consumed, amount: log.alcohol_amount ?? undefined },
      smoking: { smoked: log.smoking_done, amount: log.smoking_amount ?? undefined },
    };
  });
}

export function ActivityHistory() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
  const [infoFilter, setInfoFilter] = useState<InfoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [downloading, setDownloading] = useState(false);

  const fetchLogs = async (year: number, month: number) => {
    const res = await api.get<DailyHealthLog[]>(
      `/api/v1/health-logs/me?year=${year}&month=${month}`
    );
    setRecords(logsToRecords(res.data));
  };

  useEffect(() => {
    fetchLogs(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
  }, [currentMonth]);

  // 주간 필터: 최근 7일치만
  const filteredByPeriod =
    periodFilter === "week" ? records.slice(0, 7) : records;

  // 차트 데이터 (날짜 오름차순)
  const chartBase = [...filteredByPeriod].reverse();
  const weightData = chartBase.map((r) => ({ date: r.date.slice(5), weight: r.weight ?? 0 }));
  const exerciseData = chartBase.map((r) => ({ date: r.date.slice(5), duration: r.exercise.duration ?? 0 }));
  const alcoholData = chartBase.map((r) => ({ date: r.date.slice(5), amount: r.alcohol.amount ?? 0 }));
  const smokingData = chartBase.map((r) => ({ date: r.date.slice(5), amount: r.smoking.amount ?? 0 }));

  const currentWeight = filteredByPeriod[0]?.weight;
  const totalExercise = filteredByPeriod.reduce((s, r) => s + (r.exercise.duration ?? 0), 0);
  const totalAlcohol = filteredByPeriod.reduce((s, r) => s + (r.alcohol.amount ?? 0), 0);
  const totalSmoking = filteredByPeriod.reduce((s, r) => s + (r.smoking.amount ?? 0), 0);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/api/v1/activity/report?format=csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "health_report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const getWeightChangeIcon = (change?: number) => {
    if (change === undefined || change === 0) return <Minus className="size-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="size-4 text-red-500" />;
    return <TrendingDown className="size-4 text-emerald-500" />;
  };

  const getWeightChangeColor = (change?: number) => {
    if (!change) return "text-gray-600";
    if (change > 0) return "text-red-600";
    return "text-emerald-600";
  };

  const goToPreviousMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const goToNextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const now = new Date();
  const canGoNext = () =>
    currentMonth.getFullYear() < now.getFullYear() ||
    (currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() < now.getMonth());

  const filteredRecords = filteredByPeriod.filter((record) => {
    if (infoFilter === "exercise" && !record.exercise.done) return false;
    if (infoFilter === "alcohol" && !record.alcohol.consumed) return false;
    if (infoFilter === "smoking" && !record.smoking.smoked) return false;
    if (searchQuery && !record.date.includes(searchQuery)) return false;
    return true;
  });

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}.${String(month + 1).padStart(2, "0")}.${String(day).padStart(2, "0")}`;
      const record = records.find((r) => r.date === dateStr);
      days.push({ day, dateStr, record });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedRecord = selectedDate ? records.find((r) => r.date === selectedDate) : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <History className="size-8 text-emerald-600" />
          활동 히스토리
        </h2>
        <p className="text-gray-600">나의 건강 활동 기록을 확인하세요</p>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="size-5 text-emerald-600" />
            통계 그래프
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Button
                variant={periodFilter === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodFilter("week")}
                className={periodFilter === "week" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                주간
              </Button>
              <Button
                variant={periodFilter === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodFilter("month")}
                className={periodFilter === "month" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                월간
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="border-2">
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center">
              {currentMonth.getMonth() + 1}월
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth} disabled={!canGoNext()} className="border-2">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {/* Weight Chart */}
          <Card className="border-2 border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="size-4 text-emerald-600" />
                체중 변화
              </CardTitle>
              <CardDescription>체중 추이</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}kg`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(v: number) => [`${v}kg`, "체중"]}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{currentWeight != null ? `${currentWeight}kg` : "-"}</p>
                <p className="text-xs text-gray-600">현재 체중</p>
              </div>
            </CardContent>
          </Card>

          {/* Exercise Chart */}
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Dumbbell className="size-4 text-blue-600" />
                운동 시간
              </CardTitle>
              <CardDescription>운동 시간</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={exerciseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}분`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(v: number) => [`${v}분`, "운동"]}
                  />
                  <Bar dataKey="duration" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{totalExercise}분</p>
                <p className="text-xs text-gray-600">총 운동 시간</p>
              </div>
            </CardContent>
          </Card>

          {/* Alcohol Chart */}
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wine className="size-4 text-purple-600" />
                음주 횟수
              </CardTitle>
              <CardDescription>음주량</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={alcoholData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}잔`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(v: number) => [`${v}잔`, "음주"]}
                  />
                  <Bar dataKey="amount" fill="#a855f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{totalAlcohol}잔</p>
                <p className="text-xs text-gray-600">총 음주량</p>
              </div>
            </CardContent>
          </Card>

          {/* Smoking Chart */}
          <Card className="border-2 border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cigarette className="size-4 text-orange-600" />
                흡연량
              </CardTitle>
              <CardDescription>흡연량</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={smokingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}개`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                    formatter={(v: number) => [`${v}개`, "흡연"]}
                  />
                  <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{totalSmoking}개</p>
                <p className="text-xs text-gray-600">총 흡연량</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-2 border-emerald-100">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" : ""}
                >
                  <List className="size-4 mr-1" />
                  목록
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={viewMode === "calendar" ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" : ""}
                >
                  <CalendarDays className="size-4 mr-1" />
                  달력
                </Button>
              </div>
              <Button variant="outline" onClick={handleDownload} disabled={downloading} className="gap-2 border-2">
                <Download className="size-4" />
                {downloading ? "다운로드 중..." : "다운로드"}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">필터</p>
              <div className="flex flex-wrap gap-2">
                {(["all", "weight", "exercise", "alcohol", "smoking"] as InfoFilter[]).map((f) => {
                  const labels: Record<InfoFilter, string> = { all: "전체", weight: "체중", exercise: "운동", alcohol: "음주", smoking: "흡연" };
                  const icons: Record<InfoFilter, React.ReactNode> = {
                    all: null,
                    weight: <Scale className="size-4 mr-1" />,
                    exercise: <Dumbbell className="size-4 mr-1" />,
                    alcohol: <Wine className="size-4 mr-1" />,
                    smoking: <Cigarette className="size-4 mr-1" />,
                  };
                  return (
                    <Button
                      key={f}
                      variant={infoFilter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setInfoFilter(f)}
                      className={infoFilter === f ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" : ""}
                    >
                      {icons[f]}
                      {labels[f]}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                type="text"
                placeholder="날짜 검색 (예: 2026.04)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="size-5 text-emerald-600" />
            기록 리스트
          </h3>

          {filteredRecords.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">기록이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="border-2 border-gray-200 hover:border-emerald-200 transition-colors">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      {record.date}
                      <span className="text-sm font-normal text-gray-500">({record.dayOfWeek})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Scale className="size-3" /><span>체중</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900">
                            {record.weight != null ? `${record.weight}kg` : "-"}
                          </p>
                          {record.weightChange !== undefined && (
                            <div className="flex items-center gap-1">
                              {getWeightChangeIcon(record.weightChange)}
                              <span className={`text-xs font-medium ${getWeightChangeColor(record.weightChange)}`}>
                                {record.weightChange > 0 ? "+" : ""}{record.weightChange}kg
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Dumbbell className="size-3" /><span>운동</span>
                        </div>
                        {record.exercise.done ? (
                          <div>
                            <p className="text-lg font-bold text-blue-600">{record.exercise.duration}분</p>
                            <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700">완료</Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">운동 안 함</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Wine className="size-3" /><span>음주</span>
                        </div>
                        {record.alcohol.consumed ? (
                          <div>
                            <p className="text-lg font-bold text-purple-600">{record.alcohol.amount}잔</p>
                            <Badge variant="outline" className="text-xs mt-1 border-purple-200 text-purple-700">음주함</Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">음주 안 함</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Cigarette className="size-3" /><span>흡연</span>
                        </div>
                        {record.smoking.smoked ? (
                          <div>
                            <p className="text-lg font-bold text-red-600">{record.smoking.amount}개</p>
                            <Badge variant="outline" className="text-xs mt-1 border-red-200 text-red-700">흡연함</Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">흡연 안 함</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="size-5 text-emerald-600" />
            달력 보기
          </h3>

          <Card className="border-2 border-emerald-100">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
                  const isSelected = selectedDate === day.dateStr;
                  const hasExercise = day.record?.exercise.done;
                  const hasAlcohol = day.record?.alcohol.consumed;
                  const hasWeight = day.record?.weight != null;
                  const hasSmoking = day.record?.smoking.smoked;
                  const hasData = hasExercise || hasAlcohol || hasWeight || hasSmoking;

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`aspect-square border-2 rounded-lg p-2 transition-all ${
                        isSelected ? "border-emerald-500 bg-emerald-50"
                        : hasData ? "border-gray-300 hover:border-emerald-300 bg-white"
                        : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <span className={`text-sm font-medium ${isSelected ? "text-emerald-700" : hasData ? "text-gray-900" : "text-gray-400"}`}>
                          {day.day}
                        </span>
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {hasWeight && <div className="size-4 rounded-full bg-emerald-100 flex items-center justify-center"><Scale className="size-2.5 text-emerald-600" /></div>}
                          {hasExercise && <div className="size-4 rounded-full bg-blue-100 flex items-center justify-center"><Dumbbell className="size-2.5 text-blue-600" /></div>}
                          {hasAlcohol && <div className="size-4 rounded-full bg-purple-100 flex items-center justify-center"><Wine className="size-2.5 text-purple-600" /></div>}
                          {hasSmoking && <div className="size-4 rounded-full bg-orange-100 flex items-center justify-center"><Cigarette className="size-2.5 text-orange-600" /></div>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedRecord && (
            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedRecord.date}
                  <span className="text-sm font-normal text-gray-500">({selectedRecord.dayOfWeek})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Scale className="size-3" /><span>체중</span></div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">
                        {selectedRecord.weight != null ? `${selectedRecord.weight}kg` : "-"}
                      </p>
                      {selectedRecord.weightChange !== undefined && (
                        <div className="flex items-center gap-1">
                          {getWeightChangeIcon(selectedRecord.weightChange)}
                          <span className={`text-xs font-medium ${getWeightChangeColor(selectedRecord.weightChange)}`}>
                            {selectedRecord.weightChange > 0 ? "+" : ""}{selectedRecord.weightChange}kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Dumbbell className="size-3" /><span>운동</span></div>
                    {selectedRecord.exercise.done ? (
                      <div>
                        <p className="text-lg font-bold text-blue-600">{selectedRecord.exercise.duration}분</p>
                        <Badge variant="outline" className="text-xs mt-1 border-blue-200 text-blue-700">완료</Badge>
                      </div>
                    ) : <p className="text-sm text-gray-400">운동 안 함</p>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Wine className="size-3" /><span>음주</span></div>
                    {selectedRecord.alcohol.consumed ? (
                      <div>
                        <p className="text-lg font-bold text-purple-600">{selectedRecord.alcohol.amount}잔</p>
                        <Badge variant="outline" className="text-xs mt-1 border-purple-200 text-purple-700">음주함</Badge>
                      </div>
                    ) : <p className="text-sm text-gray-400">음주 안 함</p>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500"><Cigarette className="size-3" /><span>흡연</span></div>
                    {selectedRecord.smoking.smoked ? (
                      <div>
                        <p className="text-lg font-bold text-red-600">{selectedRecord.smoking.amount}개</p>
                        <Badge variant="outline" className="text-xs mt-1 border-red-200 text-red-700">흡연함</Badge>
                      </div>
                    ) : <p className="text-sm text-gray-400">흡연 안 함</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
