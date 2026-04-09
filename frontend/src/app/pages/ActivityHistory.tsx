import { useState } from "react";
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

type PeriodFilter = "week" | "month";
type InfoFilter = "all" | "weight" | "exercise" | "alcohol" | "smoking";
type ViewMode = "list" | "calendar";

interface ActivityRecord {
  id: number;
  date: string;
  weight: number;
  weightChange?: number;
  exercise: {
    done: boolean;
    duration?: number;
  };
  alcohol: {
    consumed: boolean;
    amount?: number;
  };
  smoking: {
    smoked: boolean;
    amount?: number;
  };
  dayOfWeek?: string;
}

export function ActivityHistory() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3)); // April 2026
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
  const [infoFilter, setInfoFilter] = useState<InfoFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Mock activity records
  const [records] = useState<ActivityRecord[]>([
    {
      id: 1,
      date: "2026.04.07",
      dayOfWeek: "월",
      weight: 71.5,
      weightChange: -0.3,
      exercise: { done: true, duration: 45 },
      alcohol: { consumed: false },
      smoking: { smoked: false },
    },
    {
      id: 2,
      date: "2026.04.06",
      dayOfWeek: "일",
      weight: 71.8,
      weightChange: -0.2,
      exercise: { done: true, duration: 30 },
      alcohol: { consumed: true, amount: 2 },
      smoking: { smoked: false },
    },
    {
      id: 3,
      date: "2026.04.05",
      dayOfWeek: "토",
      weight: 72.0,
      weightChange: 0.1,
      exercise: { done: false },
      alcohol: { consumed: false },
      smoking: { smoked: false },
    },
    {
      id: 4,
      date: "2026.04.04",
      dayOfWeek: "금",
      weight: 71.9,
      weightChange: -0.4,
      exercise: { done: true, duration: 60 },
      alcohol: { consumed: false },
      smoking: { smoked: false },
    },
    {
      id: 5,
      date: "2026.04.03",
      dayOfWeek: "목",
      weight: 72.3,
      weightChange: 0.2,
      exercise: { done: true, duration: 40 },
      alcohol: { consumed: true, amount: 3 },
      smoking: { smoked: false },
    },
    {
      id: 6,
      date: "2026.04.02",
      dayOfWeek: "수",
      weight: 72.1,
      weightChange: -0.1,
      exercise: { done: false },
      alcohol: { consumed: false },
      smoking: { smoked: false },
    },
    {
      id: 7,
      date: "2026.04.01",
      dayOfWeek: "화",
      weight: 72.2,
      weightChange: -0.3,
      exercise: { done: true, duration: 35 },
      alcohol: { consumed: false },
      smoking: { smoked: false },
    },
  ]);

  // Chart data for weight
  const [weightData] = useState([
    { date: "4/1", weight: 72.2 },
    { date: "4/2", weight: 72.1 },
    { date: "4/3", weight: 72.3 },
    { date: "4/4", weight: 71.9 },
    { date: "4/5", weight: 72.0 },
    { date: "4/6", weight: 71.8 },
    { date: "4/7", weight: 71.5 },
  ]);

  // Chart data for exercise
  const [exerciseData] = useState([
    { date: "4/1", duration: 35 },
    { date: "4/2", duration: 0 },
    { date: "4/3", duration: 40 },
    { date: "4/4", duration: 60 },
    { date: "4/5", duration: 0 },
    { date: "4/6", duration: 30 },
    { date: "4/7", duration: 45 },
  ]);

  // Chart data for alcohol
  const [alcoholData] = useState([
    { date: "4/1", amount: 0 },
    { date: "4/2", amount: 0 },
    { date: "4/3", amount: 3 },
    { date: "4/4", amount: 0 },
    { date: "4/5", amount: 0 },
    { date: "4/6", amount: 2 },
    { date: "4/7", amount: 0 },
  ]);

  // Chart data for smoking
  const [smokingData] = useState([
    { date: "4/1", amount: 0 },
    { date: "4/2", amount: 0 },
    { date: "4/3", amount: 0 },
    { date: "4/4", amount: 0 },
    { date: "4/5", amount: 0 },
    { date: "4/6", amount: 0 },
    { date: "4/7", amount: 0 },
  ]);

  const handleDownload = () => {
    const monthStr = `${currentMonth.getFullYear()}년 ${currentMonth.getMonth() + 1}월`;
    alert(`${monthStr} 활동 히스토리를 다운로드합니다.`);
  };

  const getWeightChangeIcon = (change?: number) => {
    if (!change) return <Minus className="size-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="size-4 text-red-500" />;
    return <TrendingDown className="size-4 text-emerald-500" />;
  };

  const getWeightChangeColor = (change?: number) => {
    if (!change) return "text-gray-600";
    if (change > 0) return "text-red-600";
    return "text-emerald-600";
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const canGoPrevious = () => {
    // Can't go before January 2026
    return currentMonth.getFullYear() > 2026 || (currentMonth.getFullYear() === 2026 && currentMonth.getMonth() > 0);
  };

  const canGoNext = () => {
    // Can't go beyond current month (April 2026)
    const now = new Date(2026, 3); // April 2026
    return currentMonth < now;
  };

  const getMonthString = () => {
    return `${currentMonth.getMonth() + 1}월`;
  };

  // Filter records
  const filteredRecords = records.filter((record) => {
    // Info filter
    if (infoFilter === "weight") return true; // All records have weight
    if (infoFilter === "exercise" && !record.exercise.done) return false;
    if (infoFilter === "alcohol" && !record.alcohol.consumed) return false;
    if (infoFilter === "smoking" && !record.smoking.smoked) return false;

    // Search filter
    if (searchQuery && !record.date.includes(searchQuery)) return false;

    return true;
  });

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
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

      {/* Charts Section - Moved to top */}
      <div className="space-y-4">
        {/* Month Navigation */}
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
                className={
                  periodFilter === "week"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                주간
              </Button>
              <Button
                variant={periodFilter === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriodFilter("month")}
                className={
                  periodFilter === "month"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : ""
                }
              >
                월간
              </Button>
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={!canGoPrevious()}
              className="border-2"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-lg font-bold text-gray-900 min-w-[60px] text-center">
              {getMonthString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={!canGoNext()}
              className="border-2"
            >
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
              <CardDescription>주간 체중 추이</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    domain={[71, 73]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}kg`, "체중"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">71.5kg</p>
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
              <CardDescription>주간 운동 시간</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={exerciseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}분`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}분`, "운동"]}
                  />
                  <Bar dataKey="duration" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">210분</p>
                <p className="text-xs text-gray-600">주간 총 운동 시간</p>
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
              <CardDescription>주간 음주량</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={alcoholData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}잔`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}잔`, "음주"]}
                  />
                  <Bar dataKey="amount" fill="#a855f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">5잔</p>
                <p className="text-xs text-gray-600">주간 총 음주량</p>
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
              <CardDescription>주간 흡연량</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={smokingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}개`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}개`, "흡연"]}
                  />
                  <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 text-center">
                <p className="text-2xl font-bold text-gray-900">0개</p>
                <p className="text-xs text-gray-600">주간 총 흡연량</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="border-2 border-emerald-100">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  <List className="size-4 mr-1" />
                  목록
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={
                    viewMode === "calendar"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  <CalendarDays className="size-4 mr-1" />
                  달력
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2 border-2"
              >
                <Download className="size-4" />
                다운로드
              </Button>
            </div>

            {/* Info Filter - Changed label from "정보 필터" to "필터" */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">필터</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={infoFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInfoFilter("all")}
                  className={
                    infoFilter === "all"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  전체
                </Button>
                <Button
                  variant={infoFilter === "weight" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInfoFilter("weight")}
                  className={
                    infoFilter === "weight"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  <Scale className="size-4 mr-1" />
                  체중
                </Button>
                <Button
                  variant={infoFilter === "exercise" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInfoFilter("exercise")}
                  className={
                    infoFilter === "exercise"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  <Dumbbell className="size-4 mr-1" />
                  운동
                </Button>
                <Button
                  variant={infoFilter === "alcohol" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInfoFilter("alcohol")}
                  className={
                    infoFilter === "alcohol"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  <Wine className="size-4 mr-1" />
                  음주
                </Button>
                <Button
                  variant={infoFilter === "smoking" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInfoFilter("smoking")}
                  className={
                    infoFilter === "smoking"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : ""
                  }
                >
                  <Cigarette className="size-4 mr-1" />
                  흡연
                </Button>
              </div>
            </div>

            {/* Search */}
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

      {/* Content Section - Toggle between List and Calendar */}
      {viewMode === "list" ? (
        /* List View */
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="size-5 text-emerald-600" />
            기록 리스트
          </h3>

          {filteredRecords.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <Card
                  key={record.id}
                  className="border-2 border-gray-200 hover:border-emerald-200 transition-colors"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      {record.date}
                      <span className="text-sm font-normal text-gray-500">({record.dayOfWeek})</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      {/* Weight */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Scale className="size-3" />
                          <span>체중</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900">
                            {record.weight}kg
                          </p>
                          {record.weightChange !== undefined && (
                            <div className="flex items-center gap-1">
                              {getWeightChangeIcon(record.weightChange)}
                              <span
                                className={`text-xs font-medium ${getWeightChangeColor(
                                  record.weightChange
                                )}`}
                              >
                                {record.weightChange > 0 ? "+" : ""}
                                {record.weightChange}kg
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exercise */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Dumbbell className="size-3" />
                          <span>운동</span>
                        </div>
                        {record.exercise.done ? (
                          <div>
                            <p className="text-lg font-bold text-blue-600">
                              {record.exercise.duration}분
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 border-blue-200 text-blue-700"
                            >
                              완료
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">운동 안 함</p>
                        )}
                      </div>

                      {/* Alcohol */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Wine className="size-3" />
                          <span>음주</span>
                        </div>
                        {record.alcohol.consumed ? (
                          <div>
                            <p className="text-lg font-bold text-purple-600">
                              {record.alcohol.amount}잔
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 border-purple-200 text-purple-700"
                            >
                              음주함
                            </Badge>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">음주 안 함</p>
                        )}
                      </div>

                      {/* Smoking */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Cigarette className="size-3" />
                          <span>흡연</span>
                        </div>
                        {record.smoking.smoked ? (
                          <div>
                            <p className="text-lg font-bold text-red-600">
                              {record.smoking.amount}개
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 border-red-200 text-red-700"
                            >
                              흡연함
                            </Badge>
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
      ) : (
        /* Calendar View */
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="size-5 text-emerald-600" />
            달력 보기
          </h3>

          <Card className="border-2 border-emerald-100">
            <CardContent className="p-4">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-600 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isSelected = selectedDate === day.dateStr;
                  const hasExercise = day.record?.exercise.done;
                  const hasAlcohol = day.record?.alcohol.consumed;
                  const hasWeight = !!day.record?.weight;
                  const hasSmoking = day.record?.smoking.smoked;
                  const hasData = hasExercise || hasAlcohol || hasWeight || hasSmoking;

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`aspect-square border-2 rounded-lg p-2 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : hasData
                          ? "border-gray-300 hover:border-emerald-300 bg-white"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? "text-emerald-700"
                              : hasData
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {day.day}
                        </span>
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {hasWeight && (
                            <div className="size-4 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Scale className="size-2.5 text-emerald-600" />
                            </div>
                          )}
                          {hasExercise && (
                            <div className="size-4 rounded-full bg-blue-100 flex items-center justify-center">
                              <Dumbbell className="size-2.5 text-blue-600" />
                            </div>
                          )}
                          {hasAlcohol && (
                            <div className="size-4 rounded-full bg-purple-100 flex items-center justify-center">
                              <Wine className="size-2.5 text-purple-600" />
                            </div>
                          )}
                          {hasSmoking && (
                            <div className="size-4 rounded-full bg-orange-100 flex items-center justify-center">
                              <Cigarette className="size-2.5 text-orange-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Detail */}
          {selectedRecord && (
            <Card className="border-2 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedRecord.date}
                  <span className="text-sm font-normal text-gray-500">
                    ({selectedRecord.dayOfWeek})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {/* Weight */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Scale className="size-3" />
                      <span>체중</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">
                        {selectedRecord.weight}kg
                      </p>
                      {selectedRecord.weightChange !== undefined && (
                        <div className="flex items-center gap-1">
                          {getWeightChangeIcon(selectedRecord.weightChange)}
                          <span
                            className={`text-xs font-medium ${getWeightChangeColor(
                              selectedRecord.weightChange
                            )}`}
                          >
                            {selectedRecord.weightChange > 0 ? "+" : ""}
                            {selectedRecord.weightChange}kg
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exercise */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Dumbbell className="size-3" />
                      <span>운동</span>
                    </div>
                    {selectedRecord.exercise.done ? (
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {selectedRecord.exercise.duration}분
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 border-blue-200 text-blue-700"
                        >
                          완료
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">운동 안 함</p>
                    )}
                  </div>

                  {/* Alcohol */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Wine className="size-3" />
                      <span>음주</span>
                    </div>
                    {selectedRecord.alcohol.consumed ? (
                      <div>
                        <p className="text-lg font-bold text-purple-600">
                          {selectedRecord.alcohol.amount}잔
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 border-purple-200 text-purple-700"
                        >
                          음주함
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">음주 안 함</p>
                    )}
                  </div>

                  {/* Smoking */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Cigarette className="size-3" />
                      <span>흡연</span>
                    </div>
                    {selectedRecord.smoking.smoked ? (
                      <div>
                        <p className="text-lg font-bold text-red-600">
                          {selectedRecord.smoking.amount}개
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs mt-1 border-red-200 text-red-700"
                        >
                          흡연함
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">흡연 안 함</p>
                    )}
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