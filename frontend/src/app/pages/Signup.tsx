import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Mail, Lock, User, ArrowRight, LogIn } from "lucide-react";
import liverIcon from "../../assets/characters/liver_excellent.png";

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic here
    console.log("Signup data:", formData);
    // After signup, redirect to onboarding
    navigate("/onboarding/step0");
  };

  const handleSocialSignup = (provider: "naver" | "kakao") => {
    console.log(`Signup with ${provider}`);
    // Handle social signup logic here
    // After social signup, redirect to onboarding
    navigate("/onboarding/step0");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Service Logo & Name */}
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex flex-col items-center justify-center gap-3 mb-2">
            <img src={liverIcon} alt="간편이" className="size-20" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">간(肝)편한 하루</h1>
            <p className="text-sm text-gray-600 mt-1">하루하루 기록하는 나의 간 건강 리포트</p>
          </div>
        </div>

        {/* Signup Card */}
        <Card className="border-2 border-emerald-300 shadow-lg">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl">신규 회원가입</CardTitle>
            <CardDescription>
              계정을 만들어 건강 관리를 시작하세요
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Social Signup Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 hover:bg-green-50 hover:border-green-500 transition-all"
                onClick={() => handleSocialSignup("naver")}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="size-5 bg-[#03C75A] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">N</span>
                  </div>
                  <span className="font-medium">네이버로 시작하기</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-2 hover:bg-yellow-50 hover:border-yellow-400 transition-all"
                onClick={() => handleSocialSignup("kakao")}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="size-5 bg-[#FEE500] rounded flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-xs">K</span>
                  </div>
                  <span className="font-medium">카카오톡으로 시작하기</span>
                </div>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-gray-500">또는</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  이름
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 h-11 border-2 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  이메일
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
                    placeholder="8자 이상 입력해주세요"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-11 border-2 focus:border-emerald-500"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  비밀번호 확인
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력해주세요"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 h-11 border-2 focus:border-emerald-500"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium mt-6"
              >
                <span className="flex items-center gap-2">
                  회원가입하기
                  <ArrowRight className="size-4" />
                </span>
              </Button>
            </form>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link
                  to="/login"
                  className="text-emerald-600 font-medium hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  로그인하기
                  <LogIn className="size-3.5" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
            <button
              type="button"
              className="hover:text-emerald-600 transition-colors underline"
            >
              이용약관
            </button>
            <span>|</span>
            <button
              type="button"
              className="hover:text-emerald-600 transition-colors underline"
            >
              개인정보 처리방침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}