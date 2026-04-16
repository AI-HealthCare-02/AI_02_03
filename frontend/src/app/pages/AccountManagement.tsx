import { Link, useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { ChevronRight, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export function AccountManagement() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Email masking function
  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@");
    if (username.length <= 3) {
      return `${username.charAt(0)}***@${domain}`;
    }
    return `${username.substring(0, 3)}***@${domain}`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("로그아웃 실패", err);
      navigate("/login");
    }
  };

  const menuItems = [
    {
      title: "내 정보 조회",
      link: "/mypage/account/info",
    },
    {
      title: "닉네임 설정",
      link: "/mypage/account/nickname",
    },
    {
      title: "비밀번호 변경",
      link: "/mypage/account/password",
    },
    {
      title: "회원 탈퇴",
      link: "/mypage/account/delete",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900">계정 관리</h2>
        <p className="text-gray-600">계정 정보를 관리하고 설정을 변경하세요</p>
      </div>

      {/* User Info Card */}
      <Card className="border-2 border-emerald-100">
        <CardContent className="p-6">
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">
              안녕하세요, {user?.nickname ?? "-"}님!
            </h3>
            <p className="text-gray-600">{user ? maskEmail(user.email) : "-"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Menu List */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <Link key={item.link} to={item.link}>
            <Card className="border-2 border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <ChevronRight className="size-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {/* Logout Button */}
        <Card
          className="border-2 border-gray-100 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
          onClick={handleLogout}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogOut className="size-5 text-gray-600 group-hover:text-red-600 transition-colors" />
                <p className="font-medium text-gray-900 group-hover:text-red-600 transition-colors">
                  로그아웃
                </p>
              </div>
              <ChevronRight className="size-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
