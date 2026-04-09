import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import {
  Bell,
  Clock,
  Activity,
  Heart,
  FileText,
  AlertTriangle,
  Moon,
} from "lucide-react";

export function NotificationSettings() {
  const [allNotifications, setAllNotifications] = useState(true);
  const [notificationTime, setNotificationTime] = useState("09:00");
  const [nightMode, setNightMode] = useState(false);
  
  // 생활습관 알림
  const [dailyAction, setDailyAction] = useState(true);
  const [challengeReminder, setChallengeReminder] = useState(true);
  const [streakReminder, setStreakReminder] = useState(true);
  
  // 건강 알림
  const [riskChange, setRiskChange] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [goalAchievement, setGoalAchievement] = useState(true);
  
  // 기록 알림
  const [mealReminder, setMealReminder] = useState(false);
  const [waterReminder, setWaterReminder] = useState(false);
  
  // 핵심 알림
  const [alcoholWarning, setAlcoholWarning] = useState(true);
  const [immediateRiskAlert, setImmediateRiskAlert] = useState(true);
  const [challengeFailWarning, setChallengeFailWarning] = useState(true);

  const handleSave = () => {
    alert("알림 설정이 저장되었습니다.");
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="size-8 text-emerald-600" />
          알림 설정
        </h2>
        <p className="text-gray-600">알림 수신 방식을 설정하세요</p>
      </div>

      {/* 1. 전체 알림 */}
      <Card className="border-2 border-emerald-100">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Bell className="size-5 text-emerald-600" />
              </div>
              <div>
                <Label htmlFor="all-notifications" className="text-base font-bold text-gray-900 cursor-pointer">
                  전체 알림 받기
                </Label>
                <p className="text-sm text-gray-500">모든 알림을 활성화합니다</p>
              </div>
            </div>
            <Switch
              id="all-notifications"
              checked={allNotifications}
              onCheckedChange={setAllNotifications}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. 알림 시간 */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-blue-600" />
            알림 시간
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notification-time" className="text-sm font-medium text-gray-700 mb-2 block">
              알림 수신 시간
            </Label>
            <input
              id="notification-time"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              disabled={!allNotifications}
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg text-lg font-medium disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
          
          <div className="flex items-center justify-between py-3 border-t">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-indigo-600" />
              <Label htmlFor="night-mode" className="text-sm font-medium text-gray-900 cursor-pointer">
                야간 알림 허용 (22:00 ~ 07:00)
              </Label>
            </div>
            <Switch
              id="night-mode"
              checked={nightMode}
              onCheckedChange={setNightMode}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. 생활습관 알림 */}
      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5 text-emerald-600" />
            생활습관 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <Label htmlFor="daily-action" className="text-sm font-medium text-gray-900 cursor-pointer">
              오늘의 행동 알림
            </Label>
            <Switch
              id="daily-action"
              checked={dailyAction}
              onCheckedChange={setDailyAction}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <Label htmlFor="challenge-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
              챌린지 수행 알림
            </Label>
            <Switch
              id="challenge-reminder"
              checked={challengeReminder}
              onCheckedChange={setChallengeReminder}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <Label htmlFor="streak-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
              스트릭 유지 알림
            </Label>
            <Switch
              id="streak-reminder"
              checked={streakReminder}
              onCheckedChange={setStreakReminder}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. 건강 알림 */}
      <Card className="border-2 border-purple-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="size-5 text-purple-600" />
            건강 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <Label htmlFor="risk-change" className="text-sm font-medium text-gray-900 cursor-pointer">
              위험도 변화 알림
            </Label>
            <Switch
              id="risk-change"
              checked={riskChange}
              onCheckedChange={setRiskChange}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <Label htmlFor="weekly-report" className="text-sm font-medium text-gray-900 cursor-pointer">
              주간 리포트 알림
            </Label>
            <Switch
              id="weekly-report"
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <Label htmlFor="goal-achievement" className="text-sm font-medium text-gray-900 cursor-pointer">
              목표 달성 알림
            </Label>
            <Switch
              id="goal-achievement"
              checked={goalAchievement}
              onCheckedChange={setGoalAchievement}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. 기록 알림 */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-blue-600" />
            기록 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <Label htmlFor="meal-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
              식단 기록 알림
            </Label>
            <Switch
              id="meal-reminder"
              checked={mealReminder}
              onCheckedChange={setMealReminder}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <Label htmlFor="water-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
              물 섭취 알림
            </Label>
            <Switch
              id="water-reminder"
              checked={waterReminder}
              onCheckedChange={setWaterReminder}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. 핵심 알림 (강조 영역) */}
      <Card className="border-2 border-red-200 bg-red-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-600" />
            <div>
              <CardTitle className="text-lg text-red-900">핵심 알림</CardTitle>
              <p className="text-sm text-red-700 mt-1">중요한 건강 알림입니다</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              <Label htmlFor="alcohol-warning" className="text-sm font-bold text-red-900 cursor-pointer">
                음주 경고 알림
              </Label>
            </div>
            <Switch
              id="alcohol-warning"
              checked={alcoholWarning}
              onCheckedChange={setAlcoholWarning}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              <Label htmlFor="immediate-risk" className="text-sm font-bold text-red-900 cursor-pointer">
                위험도 상승 시 즉시 알림
              </Label>
            </div>
            <Switch
              id="immediate-risk"
              checked={immediateRiskAlert}
              onCheckedChange={setImmediateRiskAlert}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              <Label htmlFor="challenge-fail" className="text-sm font-bold text-red-900 cursor-pointer">
                챌린지 실패 직전 알림
              </Label>
            </div>
            <Switch
              id="challenge-fail"
              checked={challengeFailWarning}
              onCheckedChange={setChallengeFailWarning}
              disabled={!allNotifications}
              className="data-[state=checked]:bg-red-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-4 pt-4">
        <Button
          onClick={handleSave}
          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base font-bold"
        >
          설정 저장
        </Button>
      </div>
    </div>
  );
}
