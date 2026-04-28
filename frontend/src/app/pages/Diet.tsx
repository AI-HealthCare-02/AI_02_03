import { useEffect, useState } from "react";
import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Apple,
  Ban,
  CheckCircle,
  Utensils,
  Upload,
  Loader2,
  Sparkles,
  Camera,
  Clock,
  Calendar,
} from "lucide-react";
import { foodService } from "../../services/food";

interface FoodRecord {
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

type DietAnalysisState = "idle" | "loading" | "result" | "error";

const RATING_STYLE: Record<string, string> = {
  훌륭함: "bg-emerald-100 text-emerald-700",
  좋음: "bg-blue-100 text-blue-700",
  보통: "bg-yellow-100 text-yellow-700",
  주의: "bg-red-100 text-red-700",
};

export function Diet() {
  const [dietState, setDietState] = useState<DietAnalysisState>("idle");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadRecords = () => {
    foodService.getMy().then(setRecords).catch(() => {});
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await foodService.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const getMealType = (analyzedAt: string): { label: string; color: string } => {
    const hour = new Date(analyzedAt).getHours();
    if (hour >= 5 && hour < 11) return { label: "아침", color: "bg-orange-100 text-orange-700" };
    if (hour >= 11 && hour < 15) return { label: "점심", color: "bg-blue-100 text-blue-700" };
    if (hour >= 15 && hour < 21) return { label: "저녁", color: "bg-purple-100 text-purple-700" };
    return { label: "야식", color: "bg-gray-100 text-gray-700" };
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setDietState("loading");
    try {
      const result = await foodService.analyze(uploadedFile);
      setAnalysisResult(result);
      setDietState("result");
      loadRecords();
    } catch {
      setDietState("error");
    }
  };

  const handleReset = () => {
    setDietState("idle");
    setUploadedImage(null);
    setUploadedFile(null);
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-6 lg:space-y-8 pb-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">식단 관리</h2>
        <p className="text-gray-600">건강한 간을 위한 올바른 식습관을 실천하세요</p>
      </div>

      {/* 사진 업로드 */}
      {dietState === "idle" && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="size-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  식단 사진을 업로드하세요
                </h3>
                <p className="text-sm text-gray-600">
                  사진을 업로드하면 AI가 영양 정보를 분석해드립니다
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="diet-upload"
              />
              <label htmlFor="diet-upload">
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <span className="flex items-center gap-2">
                    <Camera className="size-4" />
                    사진 선택
                  </span>
                </Button>
              </label>
              {uploadedImage && (
                <div className="mt-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full max-w-sm mx-auto rounded-lg"
                  />
                  <Button
                    onClick={handleAnalyze}
                    className="mt-4 w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    분석하기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 중 */}
      {dietState === "loading" && (
        <Card className="border-2 border-emerald-200">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="size-16 text-emerald-600 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">식단을 분석중입니다...</h3>
            <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
          </CardContent>
        </Card>
      )}

      {/* 분석 결과 */}
      {dietState === "result" && analysisResult && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-6 space-y-4">
            {uploadedImage && (
              <img src={uploadedImage} alt="Analyzed" className="w-full rounded-lg" />
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="size-5 text-emerald-600" />
                  분석 결과
                </h3>
                <Badge className={RATING_STYLE[analysisResult.rating] ?? "bg-gray-100 text-gray-700"}>
                  {analysisResult.rating}
                </Badge>
              </div>
              <div className="p-4 bg-white rounded-lg border border-emerald-200">
                <p className="text-sm text-gray-600 mb-1">음식</p>
                <p className="font-bold text-gray-900">{analysisResult.food_name}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">칼로리</p>
                  <p className="font-bold text-gray-900">{analysisResult.calories} kcal</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">지방</p>
                  <p className="font-bold text-gray-900">{analysisResult.fat}g</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">당</p>
                  <p className="font-bold text-gray-900">{analysisResult.sugar}g</p>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm font-bold text-emerald-900 mb-1">✨ 지방간 영향</p>
                <p className="text-sm text-gray-700">{analysisResult.liver_impact}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-1">💡 건강 조언</p>
                <p className="text-sm text-gray-700">{analysisResult.recommendation}</p>
              </div>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              다시 분석하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 분석 오류 */}
      {dietState === "error" && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-red-600 font-medium">분석 중 오류가 발생했습니다</p>
            <p className="text-sm text-gray-600">
              이미지를 다시 업로드하거나 잠시 후 시도해주세요
            </p>
            <Button onClick={handleReset} variant="outline">
              다시 시도하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 식단 기록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5 text-emerald-600" />
            식단 기록
          </CardTitle>
          <CardDescription>나의 최근 식단 분석 기록을 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-center text-gray-500 py-8">식단 기록이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const dt = new Date(record.analyzed_at);
                const dateStr = dt.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
                const timeStr = dt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
                const mealType = getMealType(record.analyzed_at);
                return (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex gap-3">
                      {record.image_url && (
                        <img
                          src={record.image_url}
                          alt={record.food_name}
                          className="size-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={mealType.color}>{mealType.label}</Badge>
                          <span className="text-sm text-gray-500">{dateStr} {timeStr}</span>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{record.food_name}</h4>
                        <div className="flex gap-3 text-sm text-gray-600 mb-1">
                          <span>{record.calories} kcal</span>
                          <span>지방 {record.fat}g</span>
                          <span>당 {record.sugar}g</span>
                        </div>
                        <p className="text-sm text-emerald-700">{record.liver_impact}</p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={deletingId === record.id}
                            onClick={() => handleDelete(record.id)}
                          >
                            {deletingId === record.id ? "삭제 중..." : "🗑 삭제"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 식습관 가이드 */}
      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="tips" className="border rounded-lg px-4 bg-white">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Utensils className="size-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="font-bold">건강한 식습관 가이드</div>
                <div className="text-sm text-gray-600">간 건강을 위한 식사 원칙</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-2 text-sm text-gray-700">
              {[
                "하루 3끼 규칙적으로 식사하기",
                "과식하지 않고 적당량 섭취하기",
                "천천히 씹어 먹기",
                "물 충분히 마시기 (하루 1.5-2L)",
                "밤늦은 시간 식사 피하기",
                "균형 잡힌 영양소 섭취",
              ].map((tip) => (
                <p key={tip} className="flex items-start gap-2">
                  <CheckCircle className="size-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="good-foods" className="border rounded-lg px-4 bg-white">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Apple className="size-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-bold">권장 식품</div>
                <div className="text-sm text-gray-600">간 건강에 좋은 음식</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-3">
              {[
                { title: "채소류", items: ["브로콜리", "시금치", "양배추", "토마토", "당근", "양파", "마늘"] },
                { title: "과일류", items: ["베리류", "사과", "바나나", "오렌지", "자몽"] },
                { title: "단백질", items: ["닭가슴살", "생선", "두부", "콩", "달걀"] },
                { title: "통곡물", items: ["현미", "귀리", "퀴노아", "통밀빵"] },
                { title: "건강한 지방", items: ["아보카도", "견과류", "올리브오일", "등푸른 생선"] },
              ].map(({ title, items }) => (
                <div key={title}>
                  <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Badge key={item} variant="outline" className="border-green-300">{item}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="bad-foods" className="border rounded-lg px-4 bg-white">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Ban className="size-5 text-red-600" />
              </div>
              <div className="text-left">
                <div className="font-bold">제한 식품</div>
                <div className="text-sm text-gray-600">간 건강에 해로운 음식</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-3">
              {[
                { title: "당류", items: ["설탕", "사탕", "탄산음료", "과자", "케이크", "아이스크림"] },
                { title: "정제 탄수화물", items: ["흰 빵", "흰 쌀", "라면", "빵류"] },
                { title: "포화지방", items: ["튀김", "가공육", "버터", "마가린", "패스트푸드"] },
                { title: "알코올", items: ["소주", "맥주", "와인", "모든 주류"] },
                { title: "고염분 식품", items: ["짠 음식", "가공식품", "인스턴트 식품"] },
              ].map(({ title, items }) => (
                <div key={title}>
                  <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Badge key={item} variant="outline" className="border-red-300">{item}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="meal-plan" className="border rounded-lg px-4 bg-white">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="size-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-bold">하루 식단 예시</div>
                <div className="text-sm text-gray-600">건강한 간을 위한 균형 잡힌 식단</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <div className="space-y-4">
              {[
                {
                  time: "아침 (7-8시)",
                  items: ["통밀빵 2조각 + 아보카도", "삶은 달걀 1개", "방울토마토", "무가당 요거트", "물 또는 녹차"],
                },
                {
                  time: "점심 (12-1시)",
                  items: ["현미밥 1공기", "구운 생선 (연어 또는 고등어)", "채소 샐러드 (올리브오일 드레싱)", "된장국", "김치"],
                },
                {
                  time: "저녁 (6-7시)",
                  items: ["닭가슴살 볶음", "다양한 채소 (브로콜리, 당근, 양파)", "두부 조림", "잡곡밥 반공기", "과일 (사과 또는 오렌지)"],
                },
                {
                  time: "간식 (필요시)",
                  items: ["견과류 한 줌", "과일", "당근 스틱", "무가당 요거트"],
                },
              ].map(({ time, items }) => (
                <div key={time} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{time}</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-emerald-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
