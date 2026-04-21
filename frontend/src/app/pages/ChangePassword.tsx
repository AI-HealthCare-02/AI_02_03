import { useState } from "react";
import { useNavigate } from "react-router";
import api from "../../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft } from "lucide-react";

export function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (formData.newPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      alert("비밀번호가 변경되었습니다.");
      navigate("/mypage/account");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "비밀번호 변경에 실패했습니다.");
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
        <h2 className="text-3xl font-bold text-gray-900">비밀번호 변경</h2>
        <p className="text-gray-600">새로운 비밀번호를 입력하세요</p>
      </div>

      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="현재 비밀번호를 입력하세요"
                className="border-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="새 비밀번호를 입력하세요"
                className="border-2"
                required
              />
              <p className="text-sm text-gray-500">8자 이상, 영문/숫자/특수문자 조합을 권장합니다</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="border-2"
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/mypage/account")}
                className="flex-1 border-2"
              >
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
