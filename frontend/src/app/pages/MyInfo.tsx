import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export function MyInfo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/mypage/account")}
        className="gap-2"
      >
        <ArrowLeft className="size-4" />
        뒤로 가기
      </Button>

      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">내 정보 조회</h2>
        <p className="text-gray-600">회원님의 계정 정보를 확인하세요</p>
      </div>

      {/* Info Card */}
      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">닉네임</p>
            <p className="text-lg text-gray-900">{user?.nickname ?? "-"}</p>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium text-gray-600">이메일</p>
            <p className="text-lg text-gray-900">{user?.email ?? "-"}</p>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <p className="text-sm font-medium text-gray-600">가입일</p>
            <p className="text-lg text-gray-900">
              {user?.created_at ? formatDate(user.created_at) : "-"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
