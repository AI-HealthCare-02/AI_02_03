import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";
import api from "../../lib/api";

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  is_onboarded: boolean;
  created_at: string;
}

export function MyInfo() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<UserInfo>("/api/v1/users/me")
      .then((res) => setUser(res.data))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-8">
      <Button variant="ghost" onClick={() => navigate("/mypage/account")} className="gap-2">
        <ArrowLeft className="size-4" />
        뒤로 가기
      </Button>

      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">내 정보 조회</h2>
        <p className="text-gray-600">회원님의 계정 정보를 확인하세요</p>
      </div>

      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-400">불러오는 중...</p>
          ) : user ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">닉네임</p>
                <p className="text-lg text-gray-900">{user.nickname}</p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600">이메일</p>
                <p className="text-lg text-gray-900">{user.email}</p>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600">가입일</p>
                <p className="text-lg text-gray-900">{formatDate(user.created_at)}</p>
              </div>
            </>
          ) : (
            <p className="text-gray-400">정보를 불러올 수 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
