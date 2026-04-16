import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Progress } from "../components/ui/progress";
import { Activity, ArrowLeft, Info, Shield, Heart, Moon as MoonIcon, CheckCircle2 } from "lucide-react";

type DiabetesValue = "있음" | "없음" | "";
type BinaryHealthValue = "있음" | "없음" | "";

interface Step1Payload {
  fatty_liver_diagnosis: "있음" | "없음";
  age: number;
  gender: "남성" | "여성";
  height: number;
  weight: number;
  waist: number | null;
  waist_unknown: boolean;
}

interface Step2Payload {
  drinking: "음주함" | "음주안함";
  drink_amount: number | null;
  drink_type: "맥주" | "소주" | "와인" | "막걸리" | "칵테일" | "기타" | null;
  drink_type_details: string[];
  weekly_drink_freq: number | null;
  exercise: "운동함" | "운동안함";
  weekly_exercise_count: number | null;
  exercise_duration: number | null;
  smoking: "흡연경험있음" | "흡연경험없음";
  current_smoking: "매일" | "가끔" | "안함";
  cigarettes_per_day: number | null;
  sleep_hours: number;
  diet_questions: number[];
}

interface FinalSurveyPayload extends Step1Payload, Step2Payload {
  diabetes: "있음" | "없음";
  hypertension: "있음" | "없음";
  sleep_disorder: "있음" | "없음";
}

export function OnboardingStep3() {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState<{
    diabetes: DiabetesValue;
    hypertension: BinaryHealthValue;
    sleepDisorder: BinaryHealthValue;
  }>({
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

  const handlePrevious = () => {
    navigate("/onboarding/step2");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError("");

    if (!validateForm()) return;

    const step1Raw = sessionStorage.getItem("onboarding_step1");
    const step2Raw = sessionStorage.getItem("onboarding_step2");

    if (!step1Raw || !step2Raw) {
      setSubmitError("이전 단계 정보가 없습니다. Step 1부터 다시 진행해주세요.");
      return;
    }

    const step1Data: Step1Payload = JSON.parse(step1Raw);
    const step2Data: Step2Payload = JSON.parse(step2Raw);

    const finalPayload: FinalSurveyPayload = {
      ...step1Data,
      ...step2Data,
      diabetes: formData.diabetes,
      hypertension: formData.hypertension,
      sleep_disorder: formData.sleepDisorder,
    };

    try {
      setIsAnalyzing(true);

      const response = await fetch("http://localhost:8000/api/v1/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      });

      if (!response.ok) {
        throw new Error("설문 제출에 실패했습니다.");
      }

      sessionStorage.removeItem("fatty_liver_diagnosis");
      sessionStorage.removeItem("onboarding_step1");
      sessionStorage.removeItem("onboarding_step2");

      navigate("/");
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
      setSubmitError("설문 제출 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const progressValue = (3 / 3) * 100;

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-teal-300 rounded-full blur-3xl opacity-40 animate-pulse" />
            <div
              className="relative w-40 h-40 mx-auto flex items-center justify-center animate-bounce"
              style={{ animationDuration: "2s" }}
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-6xl shadow-xl">
                🔍
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              건강 정보를 분석하고 있어요
            </h2>
            <p className="text-gray-600">
              입력하신 정보를 바탕으로<br />
              간 건강을 분석하고 있어요
            </p>
          </div>

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
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

        <Card className="border-2 border-emerald-100 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">건강 상태 정보를 입력해주세요</CardTitle>
            <CardDescription className="text-base mt-2">
              간 건강과 관련된 기저질환을 확인합니다
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
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
                  onValueChange={(value: "있음" | "없음") => {
                    setFormData((prev) => ({ ...prev, diabetes: value }));
                    if (errors.diabetes) {
                      setErrors((prev) => ({ ...prev, diabetes: "" }));
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  {["있음", "없음"].map((value) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`diabetes-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`diabetes-${value}`}
                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.diabetes === value
                            ? "border-red-500 bg-red-100"
                            : "border-gray-200 hover:border-red-200"
                        }`}
                      >
                        <span className="text-lg font-medium">{value}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.diabetes && <p className="text-sm text-red-600">{errors.diabetes}</p>}
              </div>

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
                  onValueChange={(value: "있음" | "없음") => {
                    setFormData((prev) => ({ ...prev, hypertension: value }));
                    if (errors.hypertension) {
                      setErrors((prev) => ({ ...prev, hypertension: "" }));
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  {["있음", "없음"].map((value) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`hypertension-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`hypertension-${value}`}
                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.hypertension === value
                            ? "border-orange-500 bg-orange-100"
                            : "border-gray-200 hover:border-orange-200"
                        }`}
                      >
                        <span className="text-lg font-medium">{value}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.hypertension && <p className="text-sm text-red-600">{errors.hypertension}</p>}
              </div>

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
                  onValueChange={(value: "있음" | "없음") => {
                    setFormData((prev) => ({ ...prev, sleepDisorder: value }));
                    if (errors.sleepDisorder) {
                      setErrors((prev) => ({ ...prev, sleepDisorder: "" }));
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  {["있음", "없음"].map((value) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`sleep-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`sleep-${value}`}
                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.sleepDisorder === value
                            ? "border-indigo-500 bg-indigo-100"
                            : "border-gray-200 hover:border-indigo-200"
                        }`}
                      >
                        <span className="text-lg font-medium">{value}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {errors.sleepDisorder && <p className="text-sm text-red-600">{errors.sleepDisorder}</p>}
              </div>

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

              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

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

        <p className="text-center text-xs text-gray-500">
          모든 정보 입력이 완료되었습니다. 분석 시작 버튼을 눌러주세요
        </p>
      </div>
    </div>
  );
}