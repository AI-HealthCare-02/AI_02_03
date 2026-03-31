import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import { Switch } from "../components/ui/switch";
import {
  Calendar as CalendarIcon,
  Clock,
  Hospital,
  Pill,
  Bell,
  Plus,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Appointment {
  id: number;
  date: Date;
  time: string;
  hospital: string;
  memo: string;
}

interface Medication {
  id: number;
  name: string;
  times: string[];
  completed: boolean[];
}

interface Reminder {
  id: number;
  type: "appointment" | "medication";
  title: string;
  datetime: string;
  enabled: boolean;
}

export function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      date: new Date(2026, 2, 28),
      time: "14:00",
      hospital: "서울대학교병원",
      memo: "정기 검진",
    },
  ]);

  const [medications, setMedications] = useState<Medication[]>([
    {
      id: 1,
      name: "우루사",
      times: ["08:00", "20:00"],
      completed: [true, false],
    },
    {
      id: 2,
      name: "밀크씨슬",
      times: ["12:00"],
      completed: [false],
    },
  ]);

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: 1,
      type: "appointment",
      title: "서울대학교병원 정기 검진",
      datetime: "2026-03-28 14:00",
      enabled: true,
    },
    {
      id: 2,
      type: "medication",
      title: "우루사 복용 시간",
      datetime: "오늘 20:00",
      enabled: true,
    },
    {
      id: 3,
      type: "medication",
      title: "밀크씨슬 복용 시간",
      datetime: "오늘 12:00",
      enabled: false,
    },
  ]);

  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    hospital: "",
    memo: "",
  });

  const [newMedication, setNewMedication] = useState({
    name: "",
    time: "",
  });

  const toggleMedicationComplete = (medId: number, timeIndex: number) => {
    setMedications(
      medications.map((med) =>
        med.id === medId
          ? {
              ...med,
              completed: med.completed.map((c, i) => (i === timeIndex ? !c : c)),
            }
          : med
      )
    );
  };

  const toggleReminderEnabled = (reminderId: number) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === reminderId
          ? { ...reminder, enabled: !reminder.enabled }
          : reminder
      )
    );
  };

  const todayAppointments = appointments.filter(
    (apt) =>
      apt.date.toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="size-8 text-emerald-600" />
          일정 관리
        </h2>
        <p className="text-gray-600">
          병원 방문 일정과 복약 일정을 관리하고 알림을 받아보세요
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Calendar + Today's Schedule */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calendar */}
          <Card className="border-2 border-emerald-100">
            <CardHeader>
              <CardTitle className="text-lg">캘린더</CardTitle>
              <CardDescription>날짜를 선택하여 일정을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ko}
                className="rounded-md border"
              />
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-900">
                  {selectedDate ? format(selectedDate, "yyyy년 MM월 dd일", { locale: ko }) : "날짜를 선택하세요"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="size-5 text-blue-600" />
                오늘의 일정
              </CardTitle>
              <CardDescription>
                {format(new Date(), "MM월 dd일 EEEE", { locale: ko })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex items-start gap-2">
                      <Hospital className="size-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apt.hospital}</p>
                        <p className="text-sm text-gray-600">{apt.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CalendarIcon className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">오늘 예정된 일정이 없습니다</p>
                </div>
              )}

              {/* Today's Medications */}
              <div className="pt-3 border-t border-blue-100">
                <p className="text-sm font-medium text-gray-700 mb-2">오늘의 복약</p>
                {medications.map((med) =>
                  med.times.map((time, idx) => (
                    <div
                      key={`${med.id}-${idx}`}
                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Pill className="size-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">{med.name}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={med.completed[idx]}
                        onCheckedChange={() => toggleMedicationComplete(med.id, idx)}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Appointment & Medication Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Appointment */}
          <Card className="border-2 border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hospital className="size-5 text-emerald-600" />
                병원 방문 일정 추가
              </CardTitle>
              <CardDescription>다음 병원 방문 일정을 등록하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-date">방문 날짜</Label>
                  <Input
                    id="apt-date"
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, date: e.target.value })
                    }
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-time">방문 시간</Label>
                  <Input
                    id="apt-time"
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, time: e.target.value })
                    }
                    className="border-2"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hospital-name">병원명</Label>
                  <Input
                    id="hospital-name"
                    placeholder="예) 서울대학교병원"
                    value={newAppointment.hospital}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, hospital: e.target.value })
                    }
                    className="border-2"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="apt-memo">메모</Label>
                  <Textarea
                    id="apt-memo"
                    placeholder="방문 목적이나 준비사항을 입력하세요"
                    value={newAppointment.memo}
                    onChange={(e) =>
                      setNewAppointment({ ...newAppointment, memo: e.target.value })
                    }
                    className="border-2 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <Button className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Plus className="size-4 mr-2" />
                일정 추가
              </Button>
            </CardContent>
          </Card>

          {/* Medication Management */}
          <Card className="border-2 border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="size-5 text-purple-600" />
                복약 관리
              </CardTitle>
              <CardDescription>복용 중인 약과 복용 시간을 관리하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Medication */}
              <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                <p className="font-medium text-gray-900 mb-3">새 약 추가</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="med-name">약 이름</Label>
                    <Input
                      id="med-name"
                      placeholder="예) 우루사"
                      value={newMedication.name}
                      onChange={(e) =>
                        setNewMedication({ ...newMedication, name: e.target.value })
                      }
                      className="border-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="med-time">복용 시간</Label>
                    <div className="flex gap-2">
                      <Input
                        id="med-time"
                        type="time"
                        value={newMedication.time}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, time: e.target.value })
                        }
                        className="border-2"
                      />
                      <Button size="icon" className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div className="space-y-3">
                <p className="font-medium text-gray-900">현재 복용 중인 약</p>
                {medications.map((med) => (
                  <Card key={med.id} className="border border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Pill className="size-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{med.name}</p>
                            <p className="text-sm text-gray-600">
                              하루 {med.times.length}회 복용
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={med.completed.every((c) => c) ? "default" : "secondary"}
                          className={
                            med.completed.every((c) => c)
                              ? "bg-emerald-100 text-emerald-900"
                              : ""
                          }
                        >
                          {med.completed.filter((c) => c).length}/{med.times.length} 완료
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {med.times.map((time, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              med.completed[idx]
                                ? "bg-emerald-50 border-emerald-300"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="size-4 text-gray-600" />
                                <span className="text-sm font-medium">{time}</span>
                              </div>
                              <Checkbox
                                checked={med.completed[idx]}
                                onCheckedChange={() => toggleMedicationComplete(med.id, idx)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Health Reminders */}
          <Card className="border-2 border-amber-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-amber-600" />
                건강 관리 알림
              </CardTitle>
              <CardDescription>다가오는 일정과 알림을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reminder.enabled
                        ? "bg-white border-amber-200"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`size-10 rounded-lg flex items-center justify-center ${
                          reminder.type === "appointment"
                            ? "bg-blue-100"
                            : "bg-purple-100"
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
                              {reminder.datetime}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={reminder.enabled}
                              onCheckedChange={() => toggleReminderEnabled(reminder.id)}
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

              {/* Upcoming Summary */}
              <div className="mt-4 p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">다가오는 일정 요약</p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-600" />
                        3일 후 병원 방문 예정
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-600" />
                        오늘 복약 2회 남음
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
