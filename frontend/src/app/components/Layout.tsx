import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Activity, TrendingUp, Home, LogIn, UserPlus, User, LogOut, Settings } from "lucide-react";
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
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { isLoggedIn, user, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !user) {
      fetchMe().catch(() => {
        // token expired or invalid — clean up silently
        localStorage.removeItem("access_token");
      });
    }
  }, []);

  const userName = user?.nickname ?? "사용자";

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
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
            <nav className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive("/") && !isActive("/challenges") && !isActive("/progress") && !isActive("/mypage")
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Home className="size-4" />
                  <span>홈</span>
                </div>
              </Link>
              <Link
                to="/challenges"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive("/challenges")
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="size-4" />
                  <span>챌린지</span>
                </div>
              </Link>
              <Link
                to="/progress"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive("/progress")
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  <span>내 진행도</span>
                </div>
              </Link>
              <Link
                to="/mypage"
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive("/mypage")
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span>마이 페이지</span>
                </div>
              </Link>

              <div className="ml-4 flex items-center gap-2 pl-4 border-l border-gray-200">
                {isLoggedIn ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full p-0 h-8 w-8">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            {userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-gray-500">간(肝)편한 하루 사용자</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/mypage" className="flex items-center gap-2 cursor-pointer">
                          <User className="size-4" />
                          <span>마이페이지</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Settings className="size-4" />
                        <span>설정</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2" onClick={() => setShowLogoutDialog(true)}>
                        <LogOut className="size-4" />
                        <span>로그아웃</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <LogIn className="size-4" />
                        로그인
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button size="sm" className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                        <UserPlus className="size-4" />
                        회원가입
                      </Button>
                    </Link>
                  </>
                )}
              </div>
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
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
              isActive("/") && !isActive("/challenges") && !isActive("/progress") && !isActive("/mypage")
                ? "bg-emerald-100 text-emerald-900"
                : "text-gray-600"
            }`}
          >
            <Home className="size-5" />
            <span className="text-xs">홈</span>
          </Link>
          <Link
            to="/challenges"
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
              isActive("/challenges")
                ? "bg-emerald-100 text-emerald-900"
                : "text-gray-600"
            }`}
          >
            <Activity className="size-5" />
            <span className="text-xs">챌린지</span>
          </Link>
          <Link
            to="/progress"
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
              isActive("/progress")
                ? "bg-emerald-100 text-emerald-900"
                : "text-gray-600"
            }`}
          >
            <TrendingUp className="size-5" />
            <span className="text-xs">내 진행도</span>
          </Link>
          <Link
            to="/mypage"
            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
              isActive("/mypage")
                ? "bg-emerald-100 text-emerald-900"
                : "text-gray-600"
            }`}
          >
            <User className="size-5" />
            <span className="text-xs">마이페이지</span>
          </Link>
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