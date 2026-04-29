import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Download,
  Scale,
  Moon,
  Wine,
  TrendingUp,
  Calendar as CalendarIcon,
  List,
  Lightbulb,
  ChartLine,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../lib/api";

interface SurveyData {
  weight: number;
  waist: number;
  sleep_hours: number;
  drink_amount: number;
  weekly_drink_freq: number;
  exercise: string;
  smoking: string;
  current_smoking: string;
  bmi: number;
  updated_at: string;
}

interface ImprovementFactor {
  category: string;
  challenge_type: string;
  score_delta: number;
}

interface PredictionItem {
  score: number;
  grade: string;
  created_at: string;
  improvement_factors?: ImprovementFactor[];
}

type HealthRecord = {
  id: number;
  date: string;
  timestamp?: string;
  weight?: number;
  waistCircumference?: number;
  bloodPressure?: string;
  sleepHours?: number;
  alcoholUnits?: number;
  smokingCount?: number;
  exerciseMinutes?: number;
};

export function HealthRecord() {
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    weight: "",
    waistCircumference: "",
    bloodPressure: "",
    sleepHours: "",
    alcoholUnits: "",
    smokingCount: "",
    exerciseMinutes: "",
  });

  useEffect(() => {
    let storedRecords: HealthRecord[] = [];
    try {
      const stored = localStorage.getItem("healthRecords");
      if (stored) storedRecords = JSON.parse(stored);
    } catch {
      storedRecords = [];
    }

    Promise.all([
      api.get<SurveyData>("/api/v1/surveys/me").catch(() => null),
      api.get<PredictionItem[]>("/api/v1/predictions/me").catch(() => null),
    ]).then(([surveyRes, predRes]) => {
      if (surveyRes) {
        const s = surveyRes.data;
        setSurvey(s);

        const today = new Date().toISOString().split("T")[0];
        const lastTimestamp = storedRecords[0]?.timestamp ?? null;
        // survey가 마지막 기록보다 최신이면 (챌린지 완료/수동 입력으로 값 변경됨) 새 행 추가
        if (!lastTimestamp || s.updated_at > lastTimestamp) {
          const newRecord: HealthRecord = {
            id: Date.now(),
            date: today,
            timestamp: s.updated_at,
            weight: s.weight,
            waistCircumference: s.waist,
            sleepHours: s.sleep_hours,
            alcoholUnits: s.drink_amount ? Math.round(s.drink_amount) : 0,
          };
          storedRecords = [newRecord, ...storedRecords];
        }
        setRecords(storedRecords);
      }
      if (predRes) {
        setPredictions(predRes.data);
      }
    });
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem("healthRecords", JSON.stringify(records));
    }
  }, [records]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    // surveys PUT으로 체중/허리/수면 업데이트
    const updatePayload: Record<string, number | string> = {};
    if (formData.weight) updatePayload.weight = parseFloat(formData.weight);
    if (formData.waistCircumference)
      updatePayload.waist = parseFloat(formData.waistCircumference);
    if (formData.sleepHours)
      updatePayload.sleep_hours = parseFloat(formData.sleepHours);

    try {
      let updatedTimestamp = new Date().toISOString();
      if (Object.keys(updatePayload).length > 0) {
        const res = await api.put<SurveyData>("/api/v1/surveys/me", updatePayload);
        setSurvey(res.data);
        updatedTimestamp = res.data.updated_at;
      }

      const today = new Date().toISOString().split("T")[0];
      const logPayload: Record<string, unknown> = { log_date: today };
      if (formData.weight) logPayload.weight = parseFloat(formData.weight);
      if (formData.waistCircumference) logPayload.waist = parseFloat(formData.waistCircumference);
      if (formData.sleepHours) logPayload.sleep_hours = parseFloat(formData.sleepHours);
      if (formData.exerciseMinutes) {
        logPayload.exercise_done = true;
        logPayload.exercise_duration = parseInt(formData.exerciseMinutes);
      }
      if (formData.alcoholUnits) {
        logPayload.alcohol_consumed = true;
        logPayload.alcohol_amount = parseFloat(formData.alcoholUnits);
      }
      if (formData.smokingCount) {
        logPayload.smoking_done = true;
        logPayload.smoking_amount = parseInt(formData.smokingCount);
      }
      await api.post("/api/v1/health-logs", logPayload).catch(() => null);

      const newRecord: HealthRecord = {
        id: Date.now(),
        date: today,
        timestamp: updatedTimestamp,
      };
      if (formData.weight) newRecord.weight = parseFloat(formData.weight);
      if (formData.waistCircumference)
        newRecord.waistCircumference = parseFloat(formData.waistCircumference);
      if (formData.bloodPressure) newRecord.bloodPressure = formData.bloodPressure;
      if (formData.sleepHours)
        newRecord.sleepHours = parseFloat(formData.sleepHours);
      if (formData.alcoholUnits)
        newRecord.alcoholUnits = parseInt(formData.alcoholUnits);
      if (formData.smokingCount)
        newRecord.smokingCount = parseInt(formData.smokingCount);
      if (formData.exerciseMinutes)
        newRecord.exerciseMinutes = parseInt(formData.exerciseMinutes);

      setRecords([newRecord, ...records]);
      setFormData({
        weight: "",
        waistCircumference: "",
        bloodPressure: "",
        sleepHours: "",
        alcoholUnits: "",
        smokingCount: "",
        exerciseMinutes: "",
      });
      setShowForm(false);
    } catch {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const buildFactorDescription = (factor: ImprovementFactor, s: SurveyData): { title: string; desc: string } => {
    const delta = factor.score_delta;
    switch (factor.category) {
      case "수면":
        return {
          title: "수면 시간 개선",
          desc: `현재 수면 ${s.sleep_hours}시간 → 7시간 이상 유지 시 건강 점수 +${delta}점 예상`,
        };
      case "체중감량":
        return {
          title: "체중 감량",
          desc: `현재 BMI ${s.bmi.toFixed(1)} → 정상 범위(BMI 22.5) 도달 시 건강 점수 +${delta}점 예상`,
        };
      case "금주":
        return {
          title: "음주량 감소",
          desc: `음주를 줄이거나 중단 시 건강 점수 +${delta}점 예상`,
        };
      case "운동":
        return {
          title: "운동량 증가",
          desc: `주 5회 이상 규칙적인 운동 시 건강 점수 +${delta}점 예상`,
        };
      case "금연":
        return {
          title: "금연",
          desc: `흡연 중단 시 건강 점수 +${delta}점 예상`,
        };
      case "식습관":
        return {
          title: "식습관 개선",
          desc: `균형 잡힌 식단 유지 시 건강 점수 +${delta}점 예상`,
        };
      default:
        return {
          title: factor.category,
          desc: `개선 시 건강 점수 +${delta}점 예상`,
        };
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/api/v1/activity/report?format=pdf", { responseType: "blob" });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "health_report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const latestPrediction = predictions[0] ?? null;
  const prevPrediction = predictions[1] ?? null;
  const healthScore = latestPrediction ? Math.round(latestPrediction.score) : null;
  const healthScoreDiff =
    latestPrediction && prevPrediction
      ? Math.round(latestPrediction.score - prevPrediction.score)
      : null;

  // predictions DESC(최신순) → 날짜별 최신 스코어 맵
  const scoreByDate = new Map<string, number>();
  for (const p of [...predictions].reverse()) {
    const key = new Date(p.created_at).toISOString().split("T")[0];
    scoreByDate.set(key, Math.round(p.score));
  }

  const handlePrev = () => {
    if (timeRange === "week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d);
    } else {
      setSelectedDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1)
      );
    }
  };

  const handleNext = () => {
    if (timeRange === "week") {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d);
    } else {
      setSelectedDate(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
      );
    }
  };

  const getWeekRangeString = () => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
  };

  const getPeriodString = () =>
    timeRange === "week"
      ? getWeekRangeString()
      : selectedDate.toLocaleDateString("ko-KR", { month: "long" });

  const getChartData = () => {
    const today = new Date();

    const buildDates = (dateStrs: string[], labels: string[], idPrefix: string) => {
      // 기간 시작 이전의 마지막 값으로 fill-forward 초기값 설정
      const periodStart = dateStrs[0];
      let lastScore: number | undefined;
      let lastWeight: number | undefined;
      let lastSleep: number | undefined;
      let lastAlcohol: number | undefined;

      for (const [dateKey, score] of scoreByDate) {
        if (dateKey < periodStart) lastScore = score;
      }
      const recsBefore = records.filter((r) => r.date < periodStart).sort((a, b) => b.date.localeCompare(a.date));
      if (recsBefore[0]) {
        lastWeight = recsBefore[0].weight;
        lastSleep = recsBefore[0].sleepHours;
        lastAlcohol = recsBefore[0].alcoholUnits;
      }

      return dateStrs.map((dateStr, i) => {
        const d = new Date(dateStr + "T00:00:00");
        const record = records.find((r) => r.date === dateStr);

        if (scoreByDate.has(dateStr)) lastScore = scoreByDate.get(dateStr);
        if (record?.weight !== undefined) lastWeight = record.weight;
        if (record?.sleepHours !== undefined) lastSleep = record.sleepHours;
        if (record?.alcoholUnits !== undefined) lastAlcohol = record.alcoholUnits;

        return {
          id: `${idPrefix}-${i}-${dateStr}`,
          date: labels[i],
          dateStr,
          isToday: d.toDateString() === today.toDateString(),
          score: lastScore,
          weight: lastWeight,
          sleep: lastSleep,
          alcohol: lastAlcohol,
        };
      });
    };

    if (timeRange === "week") {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() - selectedDate.getDay());
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      const dateStrs = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d.toISOString().split("T")[0];
      });
      const labels = dateStrs.map((_, i) => dayNames[new Date(dateStrs[i] + "T00:00:00").getDay()]);
      return buildDates(dateStrs, labels, "w");
    }

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const last = new Date(year, month + 1, 0);
    const dateStrs = Array.from({ length: last.getDate() }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().split("T")[0];
    });
    const labels = dateStrs.map((_, i) => `${i + 1}`);
    return buildDates(dateStrs, labels, "m");
  };

  const chartData = getChartData();

  const getYDomain = (dataKey: string): [number, number] => {
    const values = chartData
      .map((d) => d[dataKey as keyof typeof d])
      .filter((v) => typeof v === "number") as number[];
    if (!values.length) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.2 || 1;
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  };

  const getCalendarDates = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const dates: Date[] = [];
    for (let i = first.getDay() - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setDate(d.getDate() - (i + 1));
      dates.push(d);
    }
    for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const calendarDates = getCalendarDates();

  return (
    <div className="space-y-6 lg:space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">건강 기록</h2>
          <p className="text-gray-600">나의 건강 데이터를 기록하고 관리하세요</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="size-4 mr-2" />
          기록 추가
        </Button>
      </div>

      {/* 현재 건강 현황 (surveys 데이터) */}
      {survey && (
        <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
          <CardHeader>
            <CardTitle className="text-base">최근 건강 현황</CardTitle>
            <CardDescription>
              마지막 업데이트:{" "}
              {new Date(survey.updated_at).toLocaleDateString("ko-KR")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-600 mb-1">체중</p>
                <p className="font-bold text-gray-900">{survey.weight} kg</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-600 mb-1">허리둘레</p>
                <p className="font-bold text-gray-900">{survey.waist} cm</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-600 mb-1">BMI</p>
                <p className="font-bold text-gray-900">{survey.bmi.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                <p className="text-xs text-gray-600 mb-1">수면</p>
                <p className="font-bold text-gray-900">{survey.sleep_hours}시간</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기록 추가 폼 */}
      {showForm && (
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle>새 건강 기록</CardTitle>
            <CardDescription>
              오늘의 건강 데이터를 입력하세요 (모든 항목 선택 입력)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">체중 (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="72.5"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">허리둘레 (cm)</Label>
                  <Input
                    id="waist"
                    type="number"
                    step="0.1"
                    placeholder="85"
                    value={formData.waistCircumference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waistCircumference: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bp">혈압 (mmHg)</Label>
                  <Input
                    id="bp"
                    type="text"
                    placeholder="120/80"
                    value={formData.bloodPressure}
                    onChange={(e) =>
                      setFormData({ ...formData, bloodPressure: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleep">수면 시간 (시간)</Label>
                  <Input
                    id="sleep"
                    type="number"
                    step="0.5"
                    placeholder="7.5"
                    value={formData.sleepHours}
                    onChange={(e) =>
                      setFormData({ ...formData, sleepHours: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alcohol">음주량 (잔)</Label>
                  <Input
                    id="alcohol"
                    type="number"
                    placeholder="0"
                    value={formData.alcoholUnits}
                    onChange={(e) =>
                      setFormData({ ...formData, alcoholUnits: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smoking">흡연량 (개비)</Label>
                  <Input
                    id="smoking"
                    type="number"
                    placeholder="0"
                    value={formData.smokingCount}
                    onChange={(e) =>
                      setFormData({ ...formData, smokingCount: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exercise">운동 시간 (분)</Label>
                  <Input
                    id="exercise"
                    type="number"
                    placeholder="30"
                    value={formData.exerciseMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exerciseMinutes: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? "저장 중..." : "저장"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 기간 네비게이션 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("week")}
            className={timeRange === "week" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            주간
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
            className={timeRange === "month" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            월간
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 w-8 p-0">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-medium min-w-[120px] text-center">
            {getPeriodString()}
          </div>
          <Button variant="outline" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* 건강 점수 차트 */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLine className="size-5 text-emerald-600" />
            건강 점수
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <div className="mb-4 px-2">
            <div className="text-4xl font-bold text-emerald-600">
              {healthScore !== null ? `${healthScore}점` : "-"}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {healthScoreDiff === null
                ? "비교할 이전 점수가 없습니다"
                : `이전 대비 ${healthScoreDiff > 0 ? "+" : ""}${healthScoreDiff}점`}
            </p>
          </div>
          {predictions.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
              예측 기록이 없습니다
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" width={40} />
                <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                <Line
                  type="linear"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload.score === undefined) return null;
                    return (
                      <circle
                        key={`score-${payload.id}`}
                        cx={cx}
                        cy={cy}
                        r={payload.isToday ? 6 : 4}
                        fill={payload.isToday ? "#ef4444" : "#10b981"}
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 세부 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {[
          { key: "weight", label: "체중", icon: Scale, color: "#3b82f6", iconColor: "text-blue-600" },
          { key: "sleep", label: "수면", icon: Moon, color: "#6366f1", iconColor: "text-indigo-600" },
          { key: "alcohol", label: "음주", icon: Wine, color: "#a855f7", iconColor: "text-purple-600" },
        ].map(({ key, label, icon: Icon, color, iconColor }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className={`size-4 ${iconColor}`} />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis domain={getYDomain(key)} tick={{ fontSize: 10 }} stroke="#9ca3af" width={35} />
                  <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "12px" }} />
                  <Line
                    type="linear"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload[key] === undefined || payload[key] === null) return null;
                      return (
                        <circle
                          key={`${key}-${payload.id}`}
                          cx={cx}
                          cy={cy}
                          r={payload.isToday ? 5 : 3}
                          fill={payload.isToday ? "#ef4444" : color}
                          stroke="white"
                          strokeWidth={1}
                        />
                      );
                    }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI 점수 개선 요인 */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-600" />
            점수 개선 요인 (AI 분석)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {survey && (predictions[0]?.improvement_factors ?? []).length > 0 ? (
              (predictions[0].improvement_factors ?? []).map((factor) => {
                const { title, desc } = buildFactorDescription(factor, survey);
                return (
                  <div key={factor.category} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200">
                    <TrendingUp className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">개선 요인 데이터가 없습니다</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 목록 / 달력 뷰 토글 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <List className="size-4 mr-2" />
            목록
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className={viewMode === "calendar" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            <CalendarIcon className="size-4 mr-2" />
            달력
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
          <Download className="size-4 mr-2" />
          {downloading ? "다운로드 중..." : "레포트 다운로드"}
        </Button>
      </div>

      {/* 목록 뷰 */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>기록 내역</CardTitle>
            <CardDescription>최근 건강 기록 (최신순)</CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-gray-500 py-8">기록이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {record.weight && <Badge variant="outline">체중</Badge>}
                        {record.waistCircumference && <Badge variant="outline">허리</Badge>}
                        {record.bloodPressure && <Badge variant="outline">혈압</Badge>}
                        {record.sleepHours && <Badge variant="outline">수면</Badge>}
                        {record.alcoholUnits !== undefined && <Badge variant="outline">음주</Badge>}
                        {record.smokingCount !== undefined && <Badge variant="outline">흡연</Badge>}
                        {record.exerciseMinutes && <Badge variant="outline">운동</Badge>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                      {record.weight && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">체중</div>
                          <div className="font-medium">{record.weight} kg</div>
                        </div>
                      )}
                      {record.waistCircumference && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">허리둘레</div>
                          <div className="font-medium">{record.waistCircumference} cm</div>
                        </div>
                      )}
                      {record.bloodPressure && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">혈압</div>
                          <div className="font-medium">{record.bloodPressure}</div>
                        </div>
                      )}
                      {record.sleepHours && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">수면</div>
                          <div className="font-medium">{record.sleepHours}시간</div>
                        </div>
                      )}
                      {record.alcoholUnits !== undefined && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">음주</div>
                          <div className="font-medium">{record.alcoholUnits}잔</div>
                        </div>
                      )}
                      {record.smokingCount !== undefined && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">흡연</div>
                          <div className="font-medium">{record.smokingCount}개비</div>
                        </div>
                      )}
                      {record.exerciseMinutes && (
                        <div className="text-center p-2 bg-white rounded border border-gray-200">
                          <div className="text-xs text-gray-600">운동</div>
                          <div className="font-medium">{record.exerciseMinutes}분</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 달력 뷰 */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>달력 보기</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 w-8 p-0">
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="text-sm font-medium min-w-[120px] text-center">
                  {getPeriodString()}
                </div>
                <Button variant="outline" size="sm" onClick={handleNext} className="h-8 w-8 p-0">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {calendarDates.map((date, index) => {
                const dateStr = date.toISOString().split("T")[0];
                const record = records.find((r) => r.date === dateStr);
                const isToday = date.toDateString() === new Date().toDateString();
                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                return (
                  <div
                    key={index}
                    className={`aspect-square p-2 rounded-lg border ${
                      isToday ? "border-red-500 bg-red-50 relative" : "border-gray-200"
                    } ${record ? "bg-gray-50" : "bg-white"} ${
                      !isCurrentMonth ? "opacity-30" : ""
                    }`}
                  >
                    <div className={`text-sm ${isToday ? "font-bold text-red-600" : "text-gray-900"}`}>
                      {date.getDate()}
                    </div>
                    {isToday && (
                      <div className="absolute top-0 right-0 text-[8px] font-bold text-red-600 bg-red-100 px-1 rounded-bl">
                        D-DAY
                      </div>
                    )}
                    {record && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {record.weight && <div className="size-2 bg-blue-400 rounded-full" />}
                        {record.sleepHours && <div className="size-2 bg-indigo-400 rounded-full" />}
                        {record.alcoholUnits !== undefined && <div className="size-2 bg-purple-400 rounded-full" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1"><div className="size-3 bg-blue-400 rounded-full" /><span>체중</span></div>
              <div className="flex items-center gap-1"><div className="size-3 bg-indigo-400 rounded-full" /><span>수면</span></div>
              <div className="flex items-center gap-1"><div className="size-3 bg-purple-400 rounded-full" /><span>음주</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 측정 가이드 */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle>건강 측정 가이드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p><strong>체중:</strong> 아침 기상 후, 화장실을 다녀온 후 측정하세요</p>
          <p><strong>허리둘레:</strong> 배꼽 위치에서 숨을 내쉰 상태로 측정하세요</p>
          <p><strong>혈압:</strong> 5분 이상 안정을 취한 후 측정하세요</p>
          <p><strong>수면시간:</strong> 실제로 잠든 시간을 기록하세요</p>
          <p><strong>흡연량:</strong> 하루 동안 피운 담배 개비 수를 기록하세요</p>
          <p><strong>운동:</strong> 중강도 이상의 운동 시간을 기록하세요</p>
          <p className="text-xs text-gray-500 mt-4">
            * 정확한 건강 상태는 의료 전문가와 상담하세요
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
