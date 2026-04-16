import { useState } from "react";
import api from "../../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Bell, Clock, Hospital, Pill, Check, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import type { Appointment, Reminder } from "./types";

interface Props {
  reminders: Reminder[];
  onRefresh: () => void;
  nextAppointment: Appointment | null;
  calculateDday: (date: Date) => number;
}

export function ReminderSection({ reminders, onRefresh, nextAppointment, calculateDday }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleEnabled = async (reminderId: number, current: boolean) => {
    await api.patch(`/api/v1/reminders/${reminderId}`, { enabled: !current }).catch(() => onRefresh());
    onRefresh();
  };

  return (
    <Card className="border-2 border-amber-100">
      <CardHeader
        className="cursor-pointer hover:bg-amber-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-amber-600" />
            <CardTitle>알림 설정</CardTitle>
          </div>
          <Button variant="ghost" size="icon">
            {isOpen ? <ChevronUp className="size-5 text-gray-600" /> : <ChevronDown className="size-5 text-gray-600" />}
          </Button>
        </div>
        <CardDescription>건강 관리 알림을 설정하고 관리하세요</CardDescription>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-3 border-t">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                reminder.enabled ? "bg-white border-amber-200" : "bg-gray-50 border-gray-200 opacity-60"
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
                  <div className="flex items-start justify-between">
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
                      <span className="text-xs text-gray-500">{reminder.enabled ? "켜짐" : "꺼짐"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">다가오는 일정 요약</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {nextAppointment ? (
                    <li className="flex items-center gap-2">
                      <Check className="size-3 text-emerald-600" />
                      {calculateDday(new Date(nextAppointment.visit_date)) === 0
                        ? `오늘 ${nextAppointment.hospital_name} 방문`
                        : calculateDday(new Date(nextAppointment.visit_date)) > 0
                          ? `${calculateDday(new Date(nextAppointment.visit_date))}일 후 ${nextAppointment.hospital_name} 예정`
                          : `${nextAppointment.hospital_name} 일정이 지났습니다`}
                    </li>
                  ) : (
                    <li className="text-gray-500">예정된 일정이 없습니다</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
