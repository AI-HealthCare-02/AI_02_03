import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Activity, ArrowRight, Sparkles } from "lucide-react";

type FattyLiverDiagnosis = "있음" | "없음" | null;

export function OnboardingStep05() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<FattyLiverDiagnosis>(null);
  const [showMessage, setShowMessage] = useState(false);

  const handleSelect = (choice: "있음" | "없음") => {
    setSelected(choice);
    setShowMessage(true);
  };

  const handleNext = () => {
    if (!selected) return;

    sessionStorage.setItem("fatty_liver_diagnosis", selected);
    navigate("/onboarding/step1");
  };

  const getMessage = () => {
    if (selected === "있음") {
      return {
        title: "괜찮아요!!",
        description: (
          <>
            현재 생활습관을 바탕으로<br />
            간 건강 상태를 함께 관리해볼게요
          </>
        ),
      };
    }

    return {
      title: "좋아요!",
      description: (
        <>
          생활습관을 바탕으로<br />
          간 건강상태를 확인해볼게요
        </>
      ),
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Service Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="size-7 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900">간(肝)편한 하루</h1>
        </div>

        {/* Main Card */}
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-white via-pink-50/30 to-white overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-200/30 rounded-full blur-3xl" />

          <CardContent className="pt-8 pb-8 text-center space-y-6 relative">
            {/* Liver Character */}
            <div className="relative inline-block">
              <div
                className={`absolute inset-0 bg-gradient-to-br rounded-full blur-2xl transition-all duration-500 ${
                  showMessage
                    ? "from-emerald-200 to-teal-200 opacity-60 scale-110"
                    : "from-pink-200 to-rose-200 opacity-50"
                } ${!showMessage ? "animate-pulse" : ""}`}
              />
              <div
                className={`relative w-40 h-40 mx-auto flex items-center justify-center transition-all duration-500 ${
                  showMessage ? "scale-110" : "scale-100"
                }`}
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-6xl shadow-xl">
                  {showMessage ? "🥰" : "😊"}
                </div>
              </div>
            </div>

            {/* Question / Answer */}
            {!showMessage ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full">
                  <Sparkles className="size-4 text-pink-600" />
                  <span className="text-sm font-medium text-pink-700">간편이가 궁금해요</span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-gray-900 leading-relaxed">
                    혹시 병원에서 지방간 진단을<br />
                    받은 적 있으신가요?
                  </h2>
                  <p className="text-sm text-gray-600">정확하지 않아도 괜찮아요 🙂</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full">
                  <Sparkles className="size-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">간편이의 답변</span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-emerald-600">{getMessage().title}</h2>
                  <p className="text-lg text-gray-700 leading-relaxed">{getMessage().description}</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 mt-4">
                  <p className="text-gray-800 leading-relaxed">
                    제가 정확히 분석할 수 있도록<br />
                    몇 가지 정보를 알려주세요 🙂
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selection Buttons */}
        {!showMessage && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              type="button"
              onClick={() => handleSelect("있음")}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                selected === "있음"
                  ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
                  : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`text-4xl transition-transform ${selected === "있음" ? "scale-110" : ""}`}>
                  😊
                </div>
                <p className="text-xl font-bold text-gray-900">예</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelect("없음")}
              className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                selected === "없음"
                  ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
                  : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`text-4xl transition-transform ${selected === "없음" ? "scale-110" : ""}`}>
                  😌
                </div>
                <p className="text-xl font-bold text-gray-900">아니오</p>
              </div>
            </button>
          </div>
        )}

        {/* Next Button */}
        {showMessage && (
          <Button
            onClick={handleNext}
            className="w-full h-16 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-bold shadow-lg hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <span className="flex items-center gap-2">
              다음
              <ArrowRight className="size-5" />
            </span>
          </Button>
        )}

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div className="size-2 bg-emerald-500 rounded-full" />
          <div
            className={`size-2 rounded-full transition-colors ${
              showMessage ? "bg-emerald-500" : "bg-gray-300"
            }`}
          />
          <div className="size-2 bg-gray-300 rounded-full" />
          <div className="size-2 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}