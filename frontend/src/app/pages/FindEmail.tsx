import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function FindEmail() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 border-emerald-300 shadow-lg">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl">아이디 찾기</CardTitle>
            <CardDescription>
              가입 시 입력한 정보를 통해 아이디를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" type="text" placeholder="이름을 입력하세요" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">휴대폰 번호</Label>
              <Input id="phone" type="text" placeholder="휴대폰 번호를 입력하세요" />
            </div>

            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              현재 아이디 찾기 기능은 개발 중입니다.
            </div>

            <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700">
              아이디 찾기
            </Button>

            <div className="text-center text-sm text-gray-500">
              <Link to="/login" className="hover:text-emerald-600 underline">
                로그인으로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}