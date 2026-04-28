import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { authService } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";

export function DeleteAccount() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!confirmed) {
      setError("탈퇴 동의에 체크해주세요.");
      return;
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.deleteUser();
      await logout();
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "회원 탈퇴에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/mypage/settings")}
        className="gap-2"
      >
        <ArrowLeft className="size-4" />
        뒤로 가기
      </Button>

      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">회원 탈퇴</h2>
        <p className="text-gray-600">탈퇴 전 아래 내용을 확인해주세요</p>
      </div>

      {/* Warning Card */}
      <Card className="border-2 border-red-200 bg-red-50/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-red-900">탈퇴 시 유의사항</p>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>모든 챌린지 진행 내역이 삭제됩니다</li>
                <li>획득한 뱃지와 포인트가 모두 사라집니다</li>
                <li>건강 데이터 및 활동 기록이 영구 삭제됩니다</li>
                <li>동일한 이메일로 재가입이 불가능합니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle>탈퇴 확인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 확인</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="border-2"
                required
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <label
                htmlFor="confirm"
                className="text-sm text-gray-700 cursor-pointer leading-relaxed"
              >
                위 내용을 모두 확인했으며, 회원 탈퇴에 동의합니다.
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/mypage/settings")}
                className="flex-1 border-2"
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "탈퇴 처리 중..." : "탈퇴하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
