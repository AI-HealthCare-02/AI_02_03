import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Clock,
  Hospital,
  Pill,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Appointment {
  id: number;
  hospital_name: string;
  visit_date: string;
  memo: string | null;
}

interface Medication {
  id: number;
  name: string;
  dosage: string;
  schedule: string;
  taken_today: boolean;
}

export function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newAppointment, setNewAppointment] = useState({ date: "", time: "", hospital: "", memo: "" });
  const [newMedication, setNewMedication] = useState({ name: "", time: "" });

  const fetchAppointments = () =>
    api.get<Appointment[]>("/api/v1/appointments/me").then((r) => setAppointments(r.data)).catch(() => {});

  const fetchMedications = () =>
    api.get<Medication[]>("/api/v1/medications/me").then((r) => setMedications(r.data)).catch(() => {});

  useEffect(() => {
    fetchAppointments();
    fetchMedications();
  }, []);

  const handleAddAppointment = async () => {
    if (!newAppointment.hospital || !newAppointment.date || !newAppointment.time) return;
    const visit_date = `${newAppointment.date}T${newAppointment.time}:00`;
    await api.post("/api/v1/appointments", {
      hospital_name: newAppointment.hospital,
      visit_date,
      memo: newAppointment.memo || null,
    });
    setNewAppointment({ date: "", time: "", hospital: "", memo: "" });
    fetchAppointments();
  };

  const handleDeleteAppointment = async (id: number) => {
    await api.delete(`/api/v1/appointments/${id}`);
    fetchAppointments();
  };

  const handleAddMedication = async () => {
    if (!newMedication.name || !newMedication.time) return;
    await api.post("/api/v1/medications", {
      name: newMedication.name,
      dosage: "1정",
      schedule: newMedication.time,
    });
    setNewMedication({ name: "", time: "" });
    fetchMedications();
  };

  const handleToggleTaken = async (id: number, current: boolean) => {
    await api.patch(`/api/v1/medications/${id}/taken`, { taken_today: !current });
    fetchMedications();
  };

  const handleDeleteMedication = async (id: number) => {
    await api.delete(`/api/v1/medications/${id}`);
    fetchMedications();
  };

  const todayAppointments = appointments.filter(
    (apt) => new Date(apt.visit_date).toDateString() === new Date().toDateString()
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
                modifiers={{
                  hasAppointment: appointments.map((a) => new Date(a.visit_date)),
                }}
                modifiersClassNames={{
                  hasAppointment: "bg-blue-200 text-blue-900 font-bold rounded-full",
                }}
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
                  <div key={apt.id} className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Hospital className="size-4 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apt.hospital_name}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(apt.visit_date), "HH:mm")}
                        </p>
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
                {medications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">복약 정보가 없습니다</p>
                ) : (
                  medications.map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-100 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Pill className="size-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">{med.name}</p>
                          <p className="text-xs text-gray-500">{med.schedule}</p>
                        </div>
                      </div>
                      <Checkbox
                        checked={med.taken_today}
                        onCheckedChange={() => handleToggleTaken(med.id, med.taken_today)}
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
              <Button onClick={handleAddAppointment} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
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
                      <Button size="icon" onClick={handleAddMedication} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Medications */}
              <div className="space-y-3">
                <p className="font-medium text-gray-900">현재 복용 중인 약</p>
                {medications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">등록된 약이 없습니다</p>
                ) : (
                  medications.map((med) => (
                    <Card key={med.id} className="border border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Pill className="size-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{med.name}</p>
                              <p className="text-sm text-gray-600">{med.dosage} · {med.schedule}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={med.taken_today ? "default" : "secondary"}
                              className={med.taken_today ? "bg-emerald-100 text-emerald-900" : ""}
                            >
                              {med.taken_today ? "복용 완료" : "미복용"}
                            </Badge>
                            <Checkbox
                              checked={med.taken_today}
                              onCheckedChange={() => handleToggleTaken(med.id, med.taken_today)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteMedication(med.id)}
                              className="size-8 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* All Appointments */}
          <Card className="border-2 border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hospital className="size-5 text-emerald-600" />
                전체 병원 일정
              </CardTitle>
              <CardDescription>등록된 모든 병원 방문 일정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Hospital className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">등록된 병원 일정이 없습니다</p>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-emerald-100">
                    <div className="flex items-start gap-2">
                      <Hospital className="size-4 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{apt.hospital_name}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(apt.visit_date), "yyyy년 MM월 dd일 HH:mm", { locale: ko })}
                        </p>
                        {apt.memo && <p className="text-xs text-gray-500 mt-1">{apt.memo}</p>}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteAppointment(apt.id)}
                      className="size-8 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
