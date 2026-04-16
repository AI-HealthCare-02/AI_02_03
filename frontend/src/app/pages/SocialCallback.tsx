import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "../../store/authStore";

const TOKEN_KEY = "access_token";

export function SocialCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    const token = searchParams.get("token");
    const isNew = searchParams.get("is_new") === "true";
    const error = searchParams.get("error");

    if (error || !token) {
      navigate("/login?error=social_failed", { replace: true });
      return;
    }

    // 소셜 로그인은 기본 세션 스토리지에 저장 (탭 닫으면 로그아웃)
    sessionStorage.setItem(TOKEN_KEY, token);

    fetchMe().then(() => {
      if (isNew) {
        navigate("/onboarding/step0", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="text-center space-y-3">
        <div className="size-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-600 font-medium">로그인 처리 중...</p>
      </div>
    </div>
  );
}
