import { useState } from "react";
import api from "../../lib/api";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Progress } from "../components/ui/progress";
import { Activity, ArrowLeft, Info, Shield, Heart, Moon as MoonIcon, CheckCircle2 } from "lucide-react";
import liverExcellent from "../../assets/characters/liver_excellent.png";

export function OnboardingStep3() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState({
    diabetes: "",
    hypertension: "",
    sleepDisorder: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.diabetes) {
      newErrors.diabetes = "당뇨 여부를 선택해주세요";
    }
    if (!formData.hypertension) {
      newErrors.hypertension = "고혈압 여부를 선택해주세요";
    }
    if (!formData.sleepDisorder) {
      newErrors.sleepDisorder = "수면장애 여부를 선택해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsAnalyzing(true);
      try {
        const step1 = JSON.parse(sessionStorage.getItem("onboarding_step1") || "{}");
        const step2 = JSON.parse(sessionStorage.getItem("onboarding_step2") || "{}");
        const payload = {
          ...step1,
          ...step2,
          diabetes: formData.diabetes === "yes" ? "있음" : "없음",
          hypertension: formData.hypertension === "yes" ? "있음" : "없음",
          sleep_disorder: formData.sleepDisorder === "yes" ? "있음" : "없음",
        };
        await api.post("/api/v1/surveys", payload);
        await api.post("/api/v1/predictions", {});
        sessionStorage.removeItem("onboarding_step1");
        sessionStorage.removeItem("onboarding_step2");
        navigate("/");
      } catch {
        setIsAnalyzing(false);
      }
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/step2");
  };

  const progressValue = (3 / 3) * 100;

  // Loading Screen
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Animated Liver Character */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-teal-300 rounded-full blur-3xl opacity-40 animate-pulse" />
            <img
              src={liverExcellent}
              alt="간 캐릭터"
              className="relative w-40 h-40 mx-auto object-contain animate-bounce"
              style={{ animationDuration: "2s" }}
            />
          </div>

          {/* Loading Text */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              건강 정보를 분석하고 있어요
            </h2>
            <p className="text-gray-600">
              입력하신 정보를 바탕으로<br />
              간 건강을 분석하고 있어요
            </p>
          </div>

          {/* Loading Bar */}
          <div className="space-y-3">
            <Progress value={100} className="h-2 animate-pulse" />
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="flex gap-1">
                <div className="size-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="size-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="size-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>분석 중...</span>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid gap-3 text-left">
            <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-emerald-100">
              <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">기본 정보 분석 완료</p>
                <p className="text-xs text-gray-600 mt-0.5">나이, 체중, BMI 등</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-emerald-100">
              <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">생활습관 분석 완료</p>
                <p className="text-xs text-gray-600 mt-0.5">음주, 운동, 식습관 등</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-blue-100 animate-pulse">
              <div className="size-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">건강 상태 분석 중</p>
                <p className="text-xs text-gray-600 mt-0.5">당뇨, 고혈압, 수면 등</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="size-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">간(肝)편한 하루</h1>
            <p className="text-sm text-gray-600 mt-1">건강 관리의 첫 걸음을 시작해요</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="border-2 border-emerald-100">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">진행 상황</p>
                  <p className="text-2xl font-bold text-emerald-600">Step 3 / 3</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">건강 상태 정보</p>
                  <p className="text-xs text-gray-500">마지막 단계</p>
                </div>
              </div>
              <Progress value={progressValue} className="h-2" />
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="size-4" />
                <span className="font-medium">거의 다 왔어요!</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form Card */}
        <Card className="border-2 border-emerald-100 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">건강 상태 정보를 입력해주세요</CardTitle>
            <CardDescription className="text-base mt-2">
              간 건강과 관련된 기저질환을 확인합니다
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Diabetes */}
              <div className="space-y-4 p-5 bg-red-50/50 rounded-lg border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="size-5 text-red-600" />
                  <Label className="text-base font-medium text-gray-900">
                    당뇨 여부 <span className="text-red-500">*</span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  당뇨병을 진단받으셨거나 현재 치료 중이신가요?
                </p>
                
                <RadioGroup
                  value={formData.diabetes}
                  onValueChange={(value) => {
                    setFormData({ ...formData, diabetes: value });
                    if (errors.diabetes) {
                      setErrors({ ...errors, diabetes: "" });
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="yes" id="diabetes-yes" className="peer sr-only" />
                    <Label
                      htmlFor="diabetes-yes"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.diabetes === "yes"
                          ? "border-red-500 bg-red-100"
                          : "border-gray-200 hover:border-red-200"
                      }`}
                    >
                      <span className="text-lg font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="diabetes-no" className="peer sr-only" />
                    <Label
                      htmlFor="diabetes-no"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.diabetes === "no"
                          ? "border-red-500 bg-red-100"
                          : "border-gray-200 hover:border-red-200"
                      }`}
                    >
                      <span className="text-lg font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.diabetes && (
                  <p className="text-sm text-red-600">{errors.diabetes}</p>
                )}
              </div>

              {/* Hypertension */}
              <div className="space-y-4 p-5 bg-orange-50/50 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="size-5 text-orange-600" />
                  <Label className="text-base font-medium text-gray-900">
                    고혈압 여부 <span className="text-red-500">*</span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  고혈압을 진단받으셨거나 현재 치료 중이신가요?
                </p>
                
                <RadioGroup
                  value={formData.hypertension}
                  onValueChange={(value) => {
                    setFormData({ ...formData, hypertension: value });
                    if (errors.hypertension) {
                      setErrors({ ...errors, hypertension: "" });
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="yes" id="hypertension-yes" className="peer sr-only" />
                    <Label
                      htmlFor="hypertension-yes"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.hypertension === "yes"
                          ? "border-orange-500 bg-orange-100"
                          : "border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <span className="text-lg font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="hypertension-no" className="peer sr-only" />
                    <Label
                      htmlFor="hypertension-no"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.hypertension === "no"
                          ? "border-orange-500 bg-orange-100"
                          : "border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <span className="text-lg font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.hypertension && (
                  <p className="text-sm text-red-600">{errors.hypertension}</p>
                )}
              </div>

              {/* Sleep Disorder */}
              <div className="space-y-4 p-5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <MoonIcon className="size-5 text-indigo-600" />
                  <Label className="text-base font-medium text-gray-900">
                    수면장애 여부 <span className="text-red-500">*</span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  불면증 등 수면장애를 진단받으셨거나 현재 치료 중이신가요?
                </p>
                
                <RadioGroup
                  value={formData.sleepDisorder}
                  onValueChange={(value) => {
                    setFormData({ ...formData, sleepDisorder: value });
                    if (errors.sleepDisorder) {
                      setErrors({ ...errors, sleepDisorder: "" });
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="yes" id="sleep-yes" className="peer sr-only" />
                    <Label
                      htmlFor="sleep-yes"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.sleepDisorder === "yes"
                          ? "border-indigo-500 bg-indigo-100"
                          : "border-gray-200 hover:border-indigo-200"
                      }`}
                    >
                      <span className="text-lg font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="sleep-no" className="peer sr-only" />
                    <Label
                      htmlFor="sleep-no"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.sleepDisorder === "no"
                          ? "border-indigo-500 bg-indigo-100"
                          : "border-gray-200 hover:border-indigo-200"
                      }`}
                    >
                      <span className="text-lg font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.sleepDisorder && (
                  <p className="text-sm text-red-600">{errors.sleepDisorder}</p>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="size-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">개인정보 보호 안내</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      입력하신 모든 정보는 <strong className="text-emerald-700">간 건강 분석 목적</strong>으로만 사용되며, 
                      암호화되어 안전하게 보관됩니다. 제3자에게 제공되지 않으며, 
                      언제든지 수정 및 삭제가 가능합니다.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600 pt-2">
                      <Info className="size-3" />
                      <span>의료 진단이 아닌 건강 관리 가이드 제공용입니다</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="h-14 text-base border-2"
                >
                  <ArrowLeft className="size-5 mr-2" />
                  이전 단계
                </Button>
                <Button
                  type="submit"
                  className="h-14 text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-medium"
                >
                  <CheckCircle2 className="size-5 mr-2" />
                  분석 시작하기
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          모든 정보 입력이 완료되었습니다. 분석 시작 버튼을 눌러주세요
        </p>
      </div>
    </div>
  );
}