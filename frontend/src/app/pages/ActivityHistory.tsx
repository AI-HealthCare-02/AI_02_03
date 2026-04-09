import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  History,
  Download,
  TrendingDown,
  TrendingUp,
  Minus,
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

interface PredictionSummary {
  score: number;
  grade: string;
  created_at: string;
}

interface ChallengeSummary {
  name: string;
  type: string;
  status: string;
  completed_at: string | null;
}

interface ActivityResponse {
  predictions: PredictionSummary[];
  challenges: ChallengeSummary[];
}

type TabType = "predictions" | "challenges";

const GRADE_BADGE: Record<string, string> = {
  정상: "bg-emerald-100 text-emerald-800 border-emerald-300",
  경미: "bg-yellow-100 text-yellow-800 border-yellow-300",
  중등도: "bg-orange-100 text-orange-800 border-orange-300",
  중증: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_BADGE: Record<string, string> = {
  진행중: "bg-blue-100 text-blue-800 border-blue-300",
  완료: "bg-emerald-100 text-emerald-800 border-emerald-300",
  실패: "bg-red-100 text-red-800 border-red-300",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function ActivityHistory() {
  const [tab, setTab] = useState<TabType>("predictions");
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get<ActivityResponse>("/api/v1/activity/me")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/api/v1/activity/report?format=csv", {
        responseType: "blob",
      });
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

  // 차트용 데이터: 날짜 오름차순
  const chartData = data
    ? [...data.predictions]
        .reverse()
        .map((p) => ({ date: formatChartDate(p.created_at), score: Math.round(p.score) }))
    : [];

  const latestScore = data?.predictions[0]?.score ?? null;
  const prevScore = data?.predictions[1]?.score ?? null;
  const scoreDiff = latestScore !== null && prevScore !== null ? Math.round(latestScore - prevScore) : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <History className="size-8 text-emerald-600" />
            활동 히스토리
          </h2>
          <p className="text-gray-600">나의 건강 활동 기록을 확인하세요</p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2 border-2"
        >
          <Download className="size-4" />
          {downloading ? "다운로드 중..." : "CSV 다운로드"}
        </Button>
      </div>

      {/* 점수 추이 차트 */}
      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              간 건강 점수 추이
            </CardTitle>
            {scoreDiff !== null && (
              <div className="flex items-center gap-1 text-sm font-medium">
                {scoreDiff > 0 ? (
                  <>
                    <TrendingUp className="size-4 text-emerald-600" />
                    <span className="text-emerald-600">+{scoreDiff}점</span>
                  </>
                ) : scoreDiff < 0 ? (
                  <>
                    <TrendingDown className="size-4 text-red-500" />
                    <span className="text-red-500">{scoreDiff}점</span>
                  </>
                ) : (
                  <>
                    <Minus className="size-4 text-gray-400" />
                    <span className="text-gray-400">변동 없음</span>
                  </>
                )}
                <span className="text-gray-500 ml-1">(직전 대비)</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400">불러오는 중...</div>
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">
              예측 기록이 없습니다
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}점`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  formatter={(value: number) => [`${value}점`, "간 건강 점수"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="flex gap-2">
        <Button
          variant={tab === "predictions" ? "default" : "outline"}
          onClick={() => setTab("predictions")}
          className={tab === "predictions" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          예측 이력
        </Button>
        <Button
          variant={tab === "challenges" ? "default" : "outline"}
          onClick={() => setTab("challenges")}
          className={tab === "challenges" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          챌린지 이력
        </Button>
      </div>

      {/* 예측 이력 */}
      {tab === "predictions" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 text-center py-8">불러오는 중...</p>
          ) : !data || data.predictions.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="py-12 text-center text-gray-500">
                예측 기록이 없습니다
              </CardContent>
            </Card>
          ) : (
            data.predictions.map((p, i) => (
              <Card key={i} className="border-2 border-gray-100 hover:border-emerald-200 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">{formatDate(p.created_at)}</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(p.score)}점</p>
                    </div>
                    <Badge
                      className={`border px-3 py-1 text-sm font-semibold ${
                        GRADE_BADGE[p.grade] ?? "bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {p.grade}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* 챌린지 이력 */}
      {tab === "challenges" && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-400 text-center py-8">불러오는 중...</p>
          ) : !data || data.challenges.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="py-12 text-center text-gray-500">
                챌린지 기록이 없습니다
              </CardContent>
            </Card>
          ) : (
            data.challenges.map((c, i) => (
              <Card key={i} className="border-2 border-gray-100 hover:border-emerald-200 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-sm text-gray-500">{c.type}</p>
                      {c.completed_at && (
                        <p className="text-xs text-gray-400">완료일: {formatDate(c.completed_at)}</p>
                      )}
                    </div>
                    <Badge
                      className={`border px-3 py-1 text-sm font-semibold ${
                        STATUS_BADGE[c.status] ?? "bg-gray-100 text-gray-800 border-gray-300"
                      }`}
                    >
                      {c.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
