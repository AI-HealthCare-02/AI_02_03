import { useState } from "react";
import api from "../../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar as CalendarIcon, Clock, Hospital, Plus, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Appointment } from "./types";

interface Props {
  appointments: Appointment[];
  onRefresh: () => void;
  calculateDday: (date: Date) => number;
}

export function AppointmentSection({ appointments, onRefresh, calculateDday }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ hospital: "", memo: "" });
  const [appointmentDateTime, setAppointmentDateTime] = useState<{
    date: Date | undefined;
    hour: string;
    minute: string;
  }>({ date: undefined, hour: "09", minute: "00" });

  const handleSave = async () => {
    if (!appointmentDateTime.date || !newAppointment.hospital.trim()) return;
    const datetimeObj = new Date(appointmentDateTime.date);
    datetimeObj.setHours(parseInt(appointmentDateTime.hour, 10));
    datetimeObj.setMinutes(parseInt(appointmentDateTime.minute, 10));
    datetimeObj.setSeconds(0);
    datetimeObj.setMilliseconds(0);
    await api.post("/api/v1/appointments", {
      hospital_name: newAppointment.hospital,
      visit_date: format(datetimeObj, "yyyy-MM-dd'T'HH:mm:ss"),
      memo: newAppointment.memo || null,
    });
    setNewAppointment({ hospital: "", memo: "" });
    setAppointmentDateTime({ date: undefined, hour: "09", minute: "00" });
    setIsAdding(false);
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/v1/appointments/${id}`);
    onRefresh();
  };

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader
        className="cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hospital className="size-5 text-blue-600" />
            <CardTitle>일정 관리</CardTitle>
          </div>
          <Button variant="ghost" size="icon">
            {isOpen ? <ChevronUp className="size-5 text-gray-600" /> : <ChevronDown className="size-5 text-gray-600" />}
          </Button>
        </div>
        <CardDescription>병원 방문 일정을 추가하고 관리하세요</CardDescription>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 border-t">
          {isAdding && (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="font-medium text-gray-900 mb-3">병원 방문 일정 추가</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hospital-name">병원명</Label>
                  <Input
                    id="hospital-name"
                    placeholder="예) 서울대학교병원"
                    value={newAppointment.hospital}
                    onChange={(e) => setNewAppointment({ ...newAppointment, hospital: e.target.value })}
                    className="border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>방문 일정</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal border-2">
                        <CalendarIcon className="mr-2 size-4" />
                        {appointmentDateTime.date ? (
                          format(
                            new Date(
                              appointmentDateTime.date.getFullYear(),
                              appointmentDateTime.date.getMonth(),
                              appointmentDateTime.date.getDate(),
                              parseInt(appointmentDateTime.hour, 10),
                              parseInt(appointmentDateTime.minute, 10)
                            ),
                            "yyyy.MM.dd (E) HH:mm",
                            { locale: ko }
                          )
                        ) : (
                          <span className="text-gray-500">날짜와 시간을 선택하세요</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-3">
                        <Calendar
                          mode="single"
                          selected={appointmentDateTime.date}
                          onSelect={(date) => setAppointmentDateTime({ ...appointmentDateTime, date })}
                          locale={ko}
                        />
                        <div className="border-t pt-3 space-y-2">
                          <Label className="text-sm font-medium">시간 선택</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">시</Label>
                              <Select
                                value={appointmentDateTime.hour}
                                onValueChange={(value) =>
                                  setAppointmentDateTime({ ...appointmentDateTime, hour: value })
                                }
                              >
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                    <SelectItem key={hour} value={hour.toString().padStart(2, "0")}>
                                      {hour.toString().padStart(2, "0")}시
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">분</Label>
                              <Select
                                value={appointmentDateTime.minute}
                                onValueChange={(value) =>
                                  setAppointmentDateTime({ ...appointmentDateTime, minute: value })
                                }
                              >
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {["00", "10", "20", "30", "40", "50"].map((minute) => (
                                    <SelectItem key={minute} value={minute}>{minute}분</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apt-memo">메모</Label>
                  <Textarea
                    id="apt-memo"
                    placeholder="방문 목적이나 준비사항을 입력하세요"
                    value={newAppointment.memo}
                    onChange={(e) => setNewAppointment({ ...newAppointment, memo: e.target.value })}
                    className="border-2 resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={handleSave}
              >
                <Check className="size-4 mr-2" />
                저장
              </Button>
            </div>
          )}
          {!isAdding && (
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-4 mr-2" />
              일정 추가
            </Button>
          )}
          <div className="space-y-3">
            <p className="font-medium text-gray-900">예정된 일정</p>
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Hospital className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">등록된 병원 일정이 없습니다</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <Card key={apt.id} className="border border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Hospital className="size-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apt.hospital_name}</p>
                        {apt.memo && <p className="text-sm text-gray-600 mt-1">{apt.memo}</p>}
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {format(new Date(apt.visit_date), "yyyy.MM.dd (E) HH:mm", { locale: ko })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-blue-100 text-blue-900">
                          D-{calculateDday(new Date(apt.visit_date))}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(apt.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
