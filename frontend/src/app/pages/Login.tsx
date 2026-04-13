import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { Mail, Lock, ArrowRight, UserPlus } from "lucide-react";
import { authService } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import liverIcon from "../../assets/characters/liver_excellent.png";

export function Login() {
  const navigate = useNavigate();
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
    autoLogin: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.login({ email: formData.email, password: formData.password });
      await fetchMe();
      navigate("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error_detail?: string } } })?.response?.data?.error_detail;
      setError(msg || "이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "naver" | "kakao") => {
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Service Logo & Name */}
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex flex-col items-center justify-center gap-3 mb-2">
            <div className="size-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img src={liverIcon} alt="간편이" className="size-20" />
            </div>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">간(肝)편한 하루</h1>
            <p className="text-sm text-gray-600 mt-1">하루하루 기록하는 나의 간 건강 리포트</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-2 border-emerald-300 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              계정에 로그인하여 건강 관리를 시작하세요
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  아이디 (이메일)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11 border-2 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  비밀번호
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-11 border-2 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Auto Login */}
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, rememberMe: checked as boolean })
                    }
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer select-none">
                    아이디 저장
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoLogin"
                    checked={formData.autoLogin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoLogin: checked as boolean })
                    }
                  />
                  <label htmlFor="autoLogin" className="text-sm text-gray-600 cursor-pointer select-none">
                    자동 로그인
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium mt-6"
              >
                <span className="flex items-center gap-2">
                  {loading ? "로그인 중..." : "로그인"}
                  <ArrowRight className="size-4" />
                </span>
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-gray-500">간편 로그인</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 hover:bg-yellow-50 hover:border-yellow-400 transition-all"
                onClick={() => handleSocialLogin("kakao")}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="size-5 bg-[#FEE500] rounded flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-xs">K</span>
                  </div>
                  <span className="font-medium">카카오로 시작하기</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 hover:bg-green-50 hover:border-green-500 transition-all"
                onClick={() => handleSocialLogin("naver")}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="size-5 bg-[#03C75A] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">N</span>
                  </div>
                  <span className="font-medium">네이버로 시작하기</span>
                </div>
              </Button>

              {/* Find ID/Password Links */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                <button type="button" className="hover:text-emerald-600 transition-colors">
                  아이디 찾기
                </button>
                <span>|</span>
                <button type="button" className="hover:text-emerald-600 transition-colors">
                  비밀번호 찾기
                </button>
              </div>
            </div>

            {/* Signup Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                아직 계정이 없으신가요?{" "}
                <Link
                  to="/signup"
                  className="text-emerald-600 font-medium hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  회원가입하기
                  <UserPlus className="size-3.5" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
            <button type="button" className="hover:text-emerald-600 transition-colors underline">
              이용약관
            </button>
            <span>|</span>
            <button type="button" className="hover:text-emerald-600 transition-colors underline">
              개인정보 처리방침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
