import { useState } from "react";
import api from "../../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import {
  Bell,
  Clock,
  Hospital,
  Pill,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Appointment, Reminder } from "./types";

interface Props {
  reminders: Reminder[];
  onRefresh: () => void;
  nextAppointment: Appointment | null;
  calculateDday: (date: Date) => number;
}

export function ReminderSection({
  reminders,
  onRefresh,
  nextAppointment,
  calculateDday,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDday = (date: Date) => {
    const dday = calculateDday(date);

    if (dday === 0) return "D-DAY";
    if (dday > 0) return `D-${dday}`;
    return `D+${Math.abs(dday)}`;
  };

  const toggleEnabled = async (reminderId: number, current: boolean) => {
    try {
      await api.patch(`/api/v1/reminders/${reminderId}`, { enabled: !current });
    } finally {
      onRefresh();
    }
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-gray-600" />
            <CardTitle>알림 설정</CardTitle>
          </div>

          <Button variant="ghost" size="icon">
            {isOpen ? (
              <ChevronUp className="size-5 text-gray-600" />
            ) : (
              <ChevronDown className="size-5 text-gray-600" />
            )}
          </Button>
        </div>

        <CardDescription>건강 관리 알림을 설정하고 관리하세요</CardDescription>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-3 border-t">
          {reminders.length > 0 ? (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border transition-all ${
                  reminder.enabled
                    ? "bg-white border-gray-200"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`size-10 rounded-lg flex items-center justify-center ${
                      reminder.type === "appointment" ? "bg-blue-100" : "bg-purple-100"
                    }`}
                  >
                    {reminder.type === "appointment" ? (
                      <Hospital className="size-5 text-blue-600" />
                    ) : (
                      <Pill className="size-5 text-purple-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{reminder.title}</p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <Clock className="size-3" />
                          {reminder.remind_at}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.enabled}
                          onCheckedChange={() => toggleEnabled(reminder.id, reminder.enabled)}
                        />
                        <span className="text-xs text-gray-500">
                          {reminder.enabled ? "켜짐" : "꺼짐"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">설정된 알림이 없습니다</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-emerald-600 mt-0.5" />

              <div className="flex-1">
                <p className="font-medium text-gray-900">다가오는 일정 요약</p>

                {nextAppointment ? (
                  <div className="mt-3 rounded-lg bg-white border border-emerald-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-emerald-700">
                          {formatDday(new Date(nextAppointment.visit_date))}
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {nextAppointment.hospital_name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {format(new Date(nextAppointment.visit_date), "yyyy.MM.dd (E) HH:mm", {
                            locale: ko,
                          })}
                        </p>
                      </div>

                      <Check className="size-4 text-emerald-600 mt-1" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">예정된 일정이 없습니다</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}