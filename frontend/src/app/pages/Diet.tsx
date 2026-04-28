import { useState } from "react";
import type React from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Upload, Loader2, Sparkles } from "lucide-react";
import { foodService } from "../../services/food";

type DietAnalysisState = "idle" | "loading" | "result" | "error";

interface DietResult {
  food_name: string;
  calories: number;
  fat: number;
  sugar: number;
  liver_impact: string;
  recommendation: string;
  rating: string;
  image_url: string;
}

export function Diet() {
  const [dietState, setDietState] = useState<DietAnalysisState>("idle");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dietResult, setDietResult] = useState<DietResult | null>(null);

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
      setDietResult(result);
      setDietState("result");
    } catch {
      setDietState("error");
    }
  };

  const handleReset = () => {
    setDietState("idle");
    setUploadedImage(null);
    setUploadedFile(null);
    setDietResult(null);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">식단</h2>
        <p className="text-gray-600">식단 사진을 업로드하면 지방간에 미치는 영향을 분석해드려요</p>
      </div>

      {dietState === "idle" && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="size-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">식단 사진을 업로드하세요</h3>
                <p className="text-sm text-gray-600">사진 첨부 또는 드래그</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="diet-upload" />
              <label htmlFor="diet-upload">
                <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <span>사진 선택</span>
                </Button>
              </label>
              {uploadedImage && (
                <div className="mt-4">
                  <img src={uploadedImage} alt="Uploaded" className="w-full max-w-sm mx-auto rounded-lg" />
                  <Button onClick={handleAnalyze} className="mt-4 w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    분석하기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {dietState === "loading" && (
        <Card className="border-2 border-emerald-200">
          <CardContent className="p-8 text-center space-y-4">
            <Loader2 className="size-16 text-emerald-600 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-gray-900">식단을 분석중입니다...</h3>
            <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
          </CardContent>
        </Card>
      )}

      {dietState === "result" && dietResult && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
          <CardContent className="p-6 space-y-4">
            {uploadedImage && <img src={uploadedImage} alt="Analyzed" className="w-full rounded-lg" />}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="size-5 text-emerald-600" />
                  분석 결과
                </h3>
                <Badge className={
                  dietResult.rating === "훌륭함" ? "bg-emerald-100 text-emerald-700" :
                  dietResult.rating === "좋음" ? "bg-blue-100 text-blue-700" :
                  dietResult.rating === "보통" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }>{dietResult.rating}</Badge>
              </div>
              <div className="p-4 bg-white rounded-lg border border-emerald-200">
                <p className="text-sm text-gray-600 mb-1">음식</p>
                <p className="font-bold text-gray-900">{dietResult.food_name}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">칼로리</p>
                  <p className="font-bold text-gray-900">{dietResult.calories} kcal</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">지방</p>
                  <p className="font-bold text-gray-900">{dietResult.fat}g</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">당</p>
                  <p className="font-bold text-gray-900">{dietResult.sugar}g</p>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm font-bold text-emerald-900 mb-1">✨ 지방간 영향</p>
                <p className="text-sm text-gray-700">{dietResult.liver_impact}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-1">💡 건강 조언</p>
                <p className="text-sm text-gray-700">{dietResult.recommendation}</p>
              </div>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              다시 분석하기
            </Button>
          </CardContent>
        </Card>
      )}

      {dietState === "error" && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-red-600 font-medium">분석 중 오류가 발생했습니다</p>
            <p className="text-sm text-gray-600">이미지를 다시 업로드하거나 잠시 후 시도해주세요</p>
            <Button onClick={handleReset} variant="outline">다시 시도하기</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
