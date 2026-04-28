import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, User, Mail, Save, Check } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/auth";

export function Profile() {
  const navigate = useNavigate();
  const { user, fetchMe } = useAuthStore();

  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSaving(true);
    try {
      await authService.updateUser({ nickname: nickname.trim() });
      await fetchMe();
      alert("프로필이 저장되었습니다!");
      navigate("/mypage/settings");
    } catch {
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendVerificationCode = () => {
    // TODO: API 연동 필요
    console.log("인증 코드 전송:", newEmail);
    setIsCodeSent(true);
    alert("인증 코드가 전송되었습니다!");
  };

  const handleVerifyCode = () => {
    // TODO: API 연동 필요
    if (verificationCode === "123456") {
      alert("이메일이 변경되었습니다!");
      setIsChangingEmail(false);
      setNewEmail("");
      setVerificationCode("");
      setIsCodeSent(false);
    } else {
      alert("인증 코드가 일치하지 않습니다.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/mypage/settings")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로필 수정</h1>
          <p className="text-sm text-gray-600">개인정보를 변경할 수 있습니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="email"
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                    className="bg-gray-50"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChangingEmail(!isChangingEmail)}
                >
                  이메일 변경
                </Button>
              </div>
            </div>

            {/* Email Change Section */}
            {isChangingEmail && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newEmail">새 이메일</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="새 이메일을 입력하세요"
                      disabled={isCodeSent}
                    />
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={!newEmail || isCodeSent}
                    >
                      인증 코드 전송
                    </Button>
                  </div>
                </div>

                {isCodeSent && (
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">인증 코드</Label>
                    <div className="flex gap-2">
                      <Input
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="인증 코드를 입력하세요"
                        maxLength={6}
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={!verificationCode}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Check className="size-4 mr-1" />
                        확인
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      입력하신 이메일로 인증 코드가 전송되었습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/mypage/settings")}
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
