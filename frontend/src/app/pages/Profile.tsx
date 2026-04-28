import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, User, Mail, Save } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/auth";

export function Profile() {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSaving(true);
    try {
      await authService.updateUser({ nickname: nickname.trim() });
      await fetchMe();
      toast.success("프로필이 저장되었습니다.");
      navigate("/settings");
    } catch {
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로필 수정</h1>
          <p className="text-sm text-gray-600">닉네임을 변경할 수 있습니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-emerald-600" />
              기본 정보
            </CardTitle>
            <CardDescription>프로필 정보를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  disabled
                  className="bg-gray-50"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/settings")}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Save className="size-4 mr-2" />
            {isSaving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}
