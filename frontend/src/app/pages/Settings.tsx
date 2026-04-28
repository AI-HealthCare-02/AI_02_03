import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  User,
  Lock,
  Bell,
  Info,
  FileText,
  Trash2,
  UserX,
  ChevronRight,
} from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-5 pb-8">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-bold text-gray-900">설정</h2>
        <p className="text-gray-600">앱 설정 및 계정 관리</p>
      </div>

      <div className="space-y-5 max-w-3xl">
        {/* 계정/프로필 */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-emerald-600" />
              계정/프로필
            </CardTitle>
            <CardDescription>계정 정보 및 프로필 관리</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/mypage/profile">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                <div className="flex items-center gap-3">
                  <User className="size-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">프로필 정보</p>
                    <p className="text-sm text-gray-500">닉네임, 이메일 등</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-gray-400" />
              </div>
            </Link>

            <Link to="/mypage/account/password">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                <div className="flex items-center gap-3">
                  <Lock className="size-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">비밀번호 수정</p>
                    <p className="text-sm text-gray-500">비밀번호 변경</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* 알림 */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-blue-600" />
              알림
            </CardTitle>
            <CardDescription>알림 설정 관리</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/mypage/notifications">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                <div className="flex items-center gap-3">
                  <Bell className="size-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">알림 설정</p>
                    <p className="text-sm text-gray-500">푸시 알림 및 알림 환경설정</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* 서비스 정보 */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-5 text-purple-600" />
              서비스 정보
            </CardTitle>
            <CardDescription>앱 정보 및 공지사항</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">공지사항</p>
                  <p className="text-sm text-gray-500">서비스 공지 및 업데이트</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-gray-400" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Info className="size-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">버전 정보</p>
                  <p className="text-sm text-gray-500">v1.0.0</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-gray-600" />
              데이터 관리
            </CardTitle>
            <CardDescription>캐시 및 계정 데이터 관리</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
              <div className="flex items-center gap-3">
                <Trash2 className="size-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">캐시 삭제</p>
                  <p className="text-sm text-gray-500">임시 데이터 삭제</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                삭제
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
              <div className="flex items-center gap-3">
                <Trash2 className="size-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">개인 정보 삭제</p>
                  <p className="text-sm text-gray-500">모든 개인 데이터 삭제</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                삭제
              </Button>
            </div>

            <Link to="/mypage/account/delete">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200">
                <div className="flex items-center gap-3">
                  <UserX className="size-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">회원 탈퇴</p>
                    <p className="text-sm text-gray-500">계정 영구 삭제</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-gray-400" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
