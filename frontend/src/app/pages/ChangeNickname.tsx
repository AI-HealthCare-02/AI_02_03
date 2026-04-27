import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft } from "lucide-react";
import { authService } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";

export function ChangeNickname() {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nickname.length < 2 || nickname.length > 10) {
      setError("닉네임은 2자 이상 10자 이하로 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.updateUser({ nickname });
      await fetchMe();
      navigate("/mypage/account");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "닉네임 변경에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" onClick={() => navigate("/mypage/account")} className="gap-2">
        <ArrowLeft className="size-4" />
        뒤로 가기
      </Button>

      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">닉네임 설정</h2>
        <p className="text-gray-600">새로운 닉네임을 입력하세요</p>
      </div>

      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <CardTitle>닉네임 변경</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nickname">새 닉네임</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError(""); }}
                placeholder="닉네임을 입력하세요"
                className="border-2"
                required
              />
              <p className="text-sm text-gray-500">2자 이상 10자 이하로 입력해주세요</p>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/mypage/account")} className="flex-1 border-2">
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {isLoading ? "변경 중..." : "변경하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
