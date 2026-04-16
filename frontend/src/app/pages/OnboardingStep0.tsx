import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Activity, Shield, Sparkles } from "lucide-react";
import liverExcellent from "../../assets/characters/liver_excellent.png";

export function OnboardingStep0() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/onboarding/step0-5");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Service Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="size-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="size-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">간(肝)편한 하루</h1>
        </div>

        {/* Liver Character Card */}
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-white via-pink-50/30 to-white overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-200/30 rounded-full blur-3xl" />
          
          <CardContent className="pt-8 pb-8 text-center space-y-6 relative">
            {/* Animated Liver Character */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-rose-200 rounded-full blur-2xl opacity-50 animate-pulse" />
              <img
                src={liverExcellent}
                alt="간편이"
                className="relative w-48 h-48 mx-auto object-contain animate-bounce"
                style={{ animationDuration: "3s", animationIterationCount: "infinite" }}
              />
            </div>

            {/* Welcome Message */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full">
                <Sparkles className="size-4 text-pink-600" />
                <span className="text-sm font-medium text-pink-700">간편이가 인사해요</span>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-900">
                  안녕하세요!
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  <span className="font-bold text-emerald-600">간편한 하루</span>를 함께 만들어갈<br />
                  <span className="font-bold text-pink-600">간편이</span>입니다 🙂
                </p>
              </div>

              {/* Info Box */}
              <div className="space-y-3 pt-2">
                <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                  <p className="text-gray-800 leading-relaxed">
                    간단한 <strong className="text-emerald-700">생활습관 정보</strong>를 입력하면<br />
                    AI가 <strong className="text-emerald-700">간 건강 위험도</strong>를 분석해드려요
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <div className="size-2 bg-emerald-500 rounded-full" />
                  <span className="text-sm font-medium">약 1분이면 충분해요</span>
                  <div className="size-2 bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          className="w-full h-16 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-bold shadow-lg hover:shadow-xl transition-all"
        >
          내 간 건강 확인하기
        </Button>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield className="size-4" />
          <span>입력 정보는 안전하게 보호됩니다</span>
        </div>
      </div>
    </div>
  );
}
