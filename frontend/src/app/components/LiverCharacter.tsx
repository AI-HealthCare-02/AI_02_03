import { useEffect, useState } from "react";

// TODO: 실제 간 캐릭터 이미지로 교체하세요
// src/assets/liver/ 폴더에 아래 파일명으로 이미지를 넣으면 자동 적용됩니다:
// liver-excellent.png, liver-good.png, liver-warning.png, liver-danger.png

type HealthStatus = "excellent" | "good" | "warning" | "danger";

interface LiverCharacterProps {
  healthScore: number; // 0-100
  className?: string;
}

// 이미지가 없을 때 보여줄 SVG 플레이스홀더
function LiverPlaceholder({ status }: { status: HealthStatus }) {
  const configs = {
    excellent: { emoji: "🟢", color: "#10b981", face: "😊", label: "최상" },
    good:      { emoji: "🟡", color: "#f59e0b", face: "🙂", label: "양호" },
    warning:   { emoji: "🟠", color: "#f97316", face: "😥", label: "주의" },
    danger:    { emoji: "🔴", color: "#ef4444", face: "😢", label: "위험" },
  };
  const cfg = configs[status];

  return (
    <div className="flex flex-col items-center justify-center w-48 h-48 mx-auto">
      <div
        className="w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-lg"
        style={{ backgroundColor: cfg.color + "22", border: `3px solid ${cfg.color}` }}
      >
        {cfg.face}
      </div>
      <span className="mt-2 text-sm font-medium" style={{ color: cfg.color }}>간 상태: {cfg.label}</span>
    </div>
  );
}

export function LiverCharacter({ healthScore, className = "" }: LiverCharacterProps) {
  const [status, setStatus] = useState<HealthStatus>("excellent");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);

    if (healthScore >= 80) {
      setStatus("excellent");
    } else if (healthScore >= 60) {
      setStatus("good");
    } else if (healthScore >= 40) {
      setStatus("warning");
    } else {
      setStatus("danger");
    }

    return () => clearTimeout(timer);
  }, [healthScore]);

  const getStatusInfo = () => {
    switch (status) {
      case "excellent":
        return {
          message: "훌륭해요! 간이 아주 건강해요! 🎉",
          subMessage: "이대로만 계속 유지하세요!",
          bgGradient: "from-pink-50 to-rose-50",
        };
      case "good":
        return {
          message: "좋아요! 잘 하고 계세요! 💪",
          subMessage: "조금만 더 노력하면 완벽해요!",
          bgGradient: "from-orange-50 to-amber-50",
        };
      case "warning":
        return {
          message: "주의가 필요해요 😥",
          subMessage: "건강 습관을 더 신경 써주세요!",
          bgGradient: "from-yellow-50 to-lime-50",
        };
      case "danger":
        return {
          message: "위험해요! 관심이 필요합니다 😢",
          subMessage: "오늘부터 다시 시작해봐요!",
          bgGradient: "from-gray-100 to-slate-100",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`text-center space-y-6 ${className}`}>
      <div
        className={`
          relative inline-block
          transition-all duration-500 ease-out
          ${isAnimating ? "scale-95 opacity-70" : "scale-100 opacity-100"}
        `}
      >
        {/* Liver Character Container */}
        <div className="relative w-72 h-64 mx-auto">
          {/* Background glow effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${statusInfo.bgGradient} rounded-full blur-3xl opacity-60 scale-125`}
          />

          {/* Character: 실제 이미지 or 플레이스홀더 */}
          <LiverPlaceholder status={status} />

          {/* Floating animation shadow */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-900/10 rounded-full blur-lg"
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="space-y-2">
        <p className="font-bold text-xl text-gray-900">{statusInfo.message}</p>
        <p className="text-sm text-gray-600">{statusInfo.subMessage}</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="px-5 py-2.5 bg-gray-100 rounded-full">
            <span className="text-sm font-medium text-gray-700">
              건강 점수: <span className="text-emerald-600 font-bold">{healthScore}점</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}