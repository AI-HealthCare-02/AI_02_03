import { useState } from "react";
import { Link } from "react-router";
import api from "../../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function ResetPassword() {
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ temp_password: string }>("/api/v1/auth/reset-password", { email });
      setTempPassword(res.data.temp_password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "비밀번호 재설정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-emerald-300 shadow-lg">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
            <CardDescription>
              가입한 이메일을 입력하면 임시 비밀번호를 발급해 드립니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {tempPassword ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
                  <p className="text-sm text-gray-600">임시 비밀번호가 발급되었습니다.</p>
                  <p className="text-xl font-bold text-emerald-700 tracking-widest">{tempPassword}</p>
                  <p className="text-xs text-gray-500">로그인 후 반드시 비밀번호를 변경해주세요.</p>
                </div>
                <Link to="/login">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
                    로그인하러 가기
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                >
                  {loading ? "처리 중..." : "임시 비밀번호 발급"}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <Link to="/login" className="hover:text-emerald-600 underline">
                    로그인으로 돌아가기
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
