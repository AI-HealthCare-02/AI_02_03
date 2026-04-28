import { Outlet, Link, useLocation, useNavigate, Navigate } from "react-router";
import { Activity, Home, LogOut, Settings, Utensils, Calendar, ClipboardList, Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

const NAV_ITEMS = [
  { to: "/", label: "홈", icon: Home, exact: true },
  { to: "/challenges", label: "챌린지", icon: Activity },
  { to: "/diet", label: "식단", icon: Utensils },
  { to: "/schedule", label: "일정관리", icon: Calendar },
  { to: "/health-record", label: "건강기록", icon: ClipboardList },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { isLoggedIn, user, logout } = useAuthStore();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const userName = user?.nickname ?? "";

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="size-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="size-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-gray-900">간(肝)편한 하루</h1>
                <p className="text-xs text-gray-600">하루하루 기록하는 나의 간 건강 리포트</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    isActive(to, exact)
                      ? "bg-emerald-100 text-emerald-900"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </div>
                </Link>
              ))}

              {/* 햄버거 메뉴 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1">
                    <Menu className="size-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem asChild>
                    <Link to="/mypage/profile" className="flex items-center gap-2 cursor-pointer">
                      <div className="size-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-gray-500">프로필 수정</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="size-4" />
                      <span>설정</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowLogoutDialog(true);
                    }}
                  >
                    <LogOut className="size-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                isActive(to, exact) ? "bg-emerald-100 text-emerald-900" : "text-gray-600"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile navigation */}
      <div className="md:hidden h-20"></div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃 하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              로그아웃하면 현재 세션이 종료됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-gray-200 text-gray-900 hover:bg-gray-300"
            >
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
