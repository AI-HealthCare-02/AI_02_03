import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Bell, Activity, Smartphone, Clock, Moon, Calendar } from "lucide-react";
import api from "../../lib/api";

interface NotificationSetting {
  challenge_notification: boolean;
  appointment_reminder: boolean;
  notification_time: string | null;
  night_mode_enabled: boolean;
  streak_reminder: boolean;
  meal_reminder: boolean;
  challenge_fail_warning: boolean;
}

export function NotificationSettings() {
  const [challengeNotification, setChallengeNotification] = useState(true);
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [notificationTime, setNotificationTime] = useState("09:00");
  const [nightMode, setNightMode] = useState(false);
  const [streakReminder, setStreakReminder] = useState(true);
  const [mealReminder, setMealReminder] = useState(false);
  const [challengeFailWarning, setChallengeFailWarning] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<NotificationSetting>("/api/v1/notifications/settings").then((res) => {
      const s = res.data;
      setChallengeNotification(s.challenge_notification);
      setAppointmentReminder(s.appointment_reminder);
      setNotificationTime(s.notification_time ?? "09:00");
      setNightMode(s.night_mode_enabled);
      setStreakReminder(s.streak_reminder);
      setMealReminder(s.meal_reminder);
      setChallengeFailWarning(s.challenge_fail_warning);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/v1/notifications/settings", {
        challenge_notification: challengeNotification,
        appointment_reminder: appointmentReminder,
        notification_time: notificationTime,
        night_mode_enabled: nightMode,
        streak_reminder: streakReminder,
        meal_reminder: mealReminder,
        challenge_fail_warning: challengeFailWarning,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="size-8 text-emerald-600" />
          알림 설정
        </h2>
        <p className="text-gray-600">앱 설치 후 활성화되는 알림을 미리 설정하세요</p>
      </div>

      {/* 앱 전용 안내 배너 */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">앱 설치 후 이용 가능</p>
              <p className="text-sm text-blue-700 mt-0.5">
                푸시 알림은 모바일 앱으로 이용할 때 활성화됩니다. 지금 설정해두면 앱 출시 후 자동으로 적용됩니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 알림 시간 */}
      <Card className="border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="size-5 text-gray-600" />
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
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-lg text-lg font-medium"
            />
          </div>
          <div className="flex items-center justify-between py-3 border-t">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-indigo-600" />
              <div>
                <Label htmlFor="night-mode" className="text-sm font-medium text-gray-900 cursor-pointer">
                  야간 알림 허용
                </Label>
                <p className="text-xs text-gray-500">22:00 ~ 07:00 시간대 알림 허용</p>
              </div>
            </div>
            <Switch
              id="night-mode"
              checked={nightMode}
              onCheckedChange={setNightMode}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 챌린지 알림 */}
      <Card className="border-2 border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5 text-emerald-600" />
            챌린지 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <Label htmlFor="challenge-notification" className="text-sm font-medium text-gray-900 cursor-pointer">
                챌린지 수행 알림
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">오늘 챌린지를 아직 기록하지 않았을 때 알림</p>
            </div>
            <Switch
              id="challenge-notification"
              checked={challengeNotification}
              onCheckedChange={setChallengeNotification}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <Label htmlFor="streak-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
                스트릭 유지 알림
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">연속 참여가 끊길 것 같을 때 알림</p>
            </div>
            <Switch
              id="streak-reminder"
              checked={streakReminder}
              onCheckedChange={setStreakReminder}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label htmlFor="challenge-fail-warning" className="text-sm font-medium text-gray-900 cursor-pointer">
                챌린지 실패 직전 알림
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">기간 내 완료가 어려울 것 같을 때 경고</p>
            </div>
            <Switch
              id="challenge-fail-warning"
              checked={challengeFailWarning}
              onCheckedChange={setChallengeFailWarning}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* 일정 & 기록 알림 */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="size-5 text-blue-600" />
            일정 & 기록 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <Label htmlFor="appointment-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
                병원 예약 알림
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">예약된 병원 방문 D-day 알림</p>
            </div>
            <Switch
              id="appointment-reminder"
              checked={appointmentReminder}
              onCheckedChange={setAppointmentReminder}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label htmlFor="meal-reminder" className="text-sm font-medium text-gray-900 cursor-pointer">
                식단 기록 알림
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">식단 분석을 아직 하지 않았을 때 알림</p>
            </div>
            <Switch
              id="meal-reminder"
              checked={mealReminder}
              onCheckedChange={setMealReminder}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 pt-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-base font-bold"
        >
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  );
}
