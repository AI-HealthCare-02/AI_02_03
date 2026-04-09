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
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar as CalendarIcon,
  Clock,
  Hospital,
  Pill,
  Bell,
  Plus,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Trash2,
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
  completedByDate: {
    [dateString: string]: boolean[];
  };
}

interface Reminder {
  id: number;
  type: "appointment" | "medication";
  title: string;
  datetime: string;
  enabled: boolean;
}

interface DdayEvent {
  id: number;
  title: string;
  date: Date;
  color: string;
}

export function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isMedicationOpen, setIsMedicationOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);

  // D-Day Events
  const [ddayEvents] = useState<DdayEvent[]>([
    {
      id: 1,
      title: "정기 검진",
      date: new Date(2026, 2, 28), // March 28, 2026
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      id: 2,
      title: "건강검진 결과",
      date: new Date(2026, 3, 15), // April 15, 2026
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
  ]);

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
      completedByDate: {
        [new Date().toDateString()]: [true, false],
      },
    },
    {
      id: 2,
      name: "밀크씨슬",
      times: ["12:00"],
      completedByDate: {
        [new Date().toDateString()]: [false],
      },
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

  const [newMedication, setNewMedication] = useState({
    name: "",
    frequency: "1",
    timing: "상관없음",
    times: [] as string[],
  });

  const [isAddingMedication, setIsAddingMedication] = useState(false);
  const [medicationNameInput, setMedicationNameInput] = useState("");
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);

  // Mock medication database for autocomplete
  const medicationDatabase = [
    "우루사",
    "밀크씨슬",
    "실리마린",
    "타이레놀",
    "게보린",
    "판콜",
    "종근당 락토핏",
    "비타민C",
    "오메가3",
    "프로바이오틱스",
  ];

  const [newAppointment, setNewAppointment] = useState({
    hospital: "",
    memo: "",
  });

  const [appointmentDateTime, setAppointmentDateTime] = useState<{
    date: Date | undefined;
    hour: string;
    minute: string;
  }>({
    date: undefined,
    hour: "09",
    minute: "00",
  });

  const [todayAppointmentChecked, setTodayAppointmentChecked] = useState<{ [key: number]: boolean }>({});

  const toggleMedicationComplete = (medId: number, timeIndex: number, date: Date) => {
    const dateString = date.toDateString();

    setMedications(
      medications.map((med) => {
        if (med.id !== medId) return med;

        const currentCompleted = med.completedByDate[dateString] || new Array(med.times.length).fill(false);
        const updatedCompleted = currentCompleted.map((c, i) => (i === timeIndex ? !c : c));

        return {
          ...med,
          completedByDate: {
            ...med.completedByDate,
            [dateString]: updatedCompleted,
          },
        };
      })
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

  // Get appointments for selected date
  const selectedDateAppointments = appointments.filter(
    (apt) => apt.date.toDateString() === (selectedDate || new Date()).toDateString()
  );

  // Get dates that have appointments
  const appointmentDates = appointments.map((apt) => {
    const date = new Date(apt.date);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const calculateDday = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get the nearest upcoming appointment
  const getNextAppointment = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingAppointments = appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcomingAppointments[0] || null;
  };

  const nextAppointment = getNextAppointment();

  const deleteAppointment = (id: number) => {
    setAppointments(appointments.filter((apt) => apt.id !== id));
  };

  const deleteMedication = (id: number) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleSaveAppointment = () => {
    if (!appointmentDateTime.date || !newAppointment.hospital) {
      return;
    }

    const datetimeObj = new Date(appointmentDateTime.date);
    datetimeObj.setHours(parseInt(appointmentDateTime.hour));
    datetimeObj.setMinutes(parseInt(appointmentDateTime.minute));

    const timeString = format(datetimeObj, "HH:mm");

    const newApt: Appointment = {
      id: Math.max(...appointments.map((a) => a.id), 0) + 1,
      date: datetimeObj,
      time: timeString,
      hospital: newAppointment.hospital,
      memo: newAppointment.memo,
    };

    setAppointments([...appointments, newApt]);
    setNewAppointment({ hospital: "", memo: "" });
    setAppointmentDateTime({
      date: undefined,
      hour: "09",
      minute: "00",
    });
    setIsAddingAppointment(false);
  };

  // Generate recommended medication times based on frequency
  const getRecommendedTimes = (frequency: string, timing: string): string[] => {
    if (timing === "취침 전") {
      return ["22:00"];
    }

    const freq = parseInt(frequency);
    const timeMap: { [key: number]: string[] } = {
      1: ["08:00"],
      2: ["08:00", "18:00"],
      3: ["08:00", "12:00", "18:00"],
      4: ["08:00", "12:00", "18:00", "22:00"],
    };

    return timeMap[freq] || [];
  };

  // 복약 폼 열기
  const openMedicationForm = () => {
    setNewMedication({
      name: "",
      frequency: "1",
      timing: "상관없음",
      times: getRecommendedTimes("1", "상관없음"),
    });
    setMedicationNameInput("");
    setShowMedicationSuggestions(false);
    setIsAddingMedication(true);
  };

  // 복약 폼 닫기 및 초기화
  const closeMedicationForm = () => {
    setNewMedication({
      name: "",
      frequency: "1",
      timing: "상관없음",
      times: [],
    });
    setMedicationNameInput("");
    setShowMedicationSuggestions(false);
    setIsAddingMedication(false);
  };

  const handleMedicationFrequencyChange = (frequency: string) => {
    const recommendedTimes = getRecommendedTimes(frequency, newMedication.timing);
    setNewMedication((prev) => ({
      ...prev,
      frequency,
      times: recommendedTimes,
    }));
  };

  const handleMedicationTimingChange = (timing: string) => {
    const recommendedTimes = getRecommendedTimes(newMedication.frequency, timing);
    setNewMedication((prev) => ({
      ...prev,
      timing,
      times: recommendedTimes,
    }));
  };

  const handleMedicationTimeChange = (index: number, newTime: string) => {
    setNewMedication((prev) => {
      const updatedTimes = [...prev.times];
      updatedTimes[index] = newTime;
      return {
        ...prev,
        times: updatedTimes,
      };
    });
  };

  const handleSaveMedication = () => {
    const trimmedName = newMedication.name.trim();

    if (!trimmedName || newMedication.times.length === 0) {
      alert("약 이름과 복용 시간을 입력해주세요");
      return;
    }

    const newMed: Medication = {
      id: medications.length > 0 ? Math.max(...medications.map((m) => m.id)) + 1 : 1,
      name: trimmedName,
      times: [...newMedication.times],
      completedByDate: {},
    };

    setMedications((prev) => [...prev, newMed]);
    closeMedicationForm();
  };

  const handleMedicationNameSelect = (name: string) => {
    setMedicationNameInput(name);
    setNewMedication((prev) => ({
      ...prev,
      name,
    }));
    setShowMedicationSuggestions(false);
  };

  const filteredMedications = medicationDatabase.filter((med) =>
    med.toLowerCase().includes(medicationNameInput.toLowerCase())
  );

  // Get all medication schedules sorted by time for selected date
  const getMedicationSchedules = (date: Date) => {
    const dateString = date.toDateString();
    const schedules: Array<{
      medId: number;
      medName: string;
      time: string;
      timeIndex: number;
      completed: boolean;
    }> = [];

    medications.forEach((med) => {
      const completedForDate = med.completedByDate[dateString] || new Array(med.times.length).fill(false);

      med.times.forEach((time, idx) => {
        schedules.push({
          medId: med.id,
          medName: med.name,
          time: time,
          timeIndex: idx,
          completed: completedForDate[idx],
        });
      });
    });

    // Sort by time
    schedules.sort((a, b) => {
      const timeA = a.time.split(":").map(Number);
      const timeB = b.time.split(":").map(Number);
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return timeA[1] - timeB[1];
    });

    return schedules;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="size-8 text-emerald-600" />
          일정관리
        </h2>
        <p className="text-gray-600">
          오늘의 할 일을 확인하고 건강 관리 일정을 체크하세요
        </p>
      </div>

      {/* Calendar & Today's Tasks Section - Side by Side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar Area */}
        <Card className="border-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-emerald-600" />
              캘린더
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ko}
              className="rounded-md border w-full"
              modifiers={{
                hasAppointment: appointmentDates,
              }}
              modifiersClassNames={{
                hasAppointment: "has-appointment",
              }}
            />
            <style>{`
              .has-appointment {
                position: relative;
              }
              .has-appointment::after {
                content: '';
                position: absolute;
                bottom: 2px;
                left: 50%;
                transform: translateX(-50%);
                width: 4px;
                height: 4px;
                background-color: #3b82f6;
                border-radius: 50%;
              }
            `}</style>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-blue-600" />
                {selectedDate && selectedDate.toDateString() === new Date().toDateString()
                  ? "오늘 할 일"
                  : selectedDate
                    ? `${format(selectedDate, "M월 d일 (E)", { locale: ko })} 일정`
                    : "오늘 할 일"}
              </CardTitle>

              {/* D-DAY Widget - Compact */}
              {nextAppointment && (
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
                  <p className="text-xs font-medium opacity-90">다가오는 일정</p>
                  <p className="text-2xl font-bold">
                    {calculateDday(nextAppointment.date) === 0
                      ? "D-DAY"
                      : calculateDday(nextAppointment.date) > 0
                        ? `D-${calculateDday(nextAppointment.date)}`
                        : `D+${Math.abs(calculateDday(nextAppointment.date))}`}
                  </p>
                  <p className="text-xs font-medium mt-1 truncate max-w-[120px]">
                    {nextAppointment.hospital}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Today's Appointments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Hospital className="size-4 text-blue-600" />
                <p className="font-semibold text-gray-900">병원 일정</p>
              </div>

              {selectedDateAppointments.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                        todayAppointmentChecked[apt.id]
                          ? "bg-emerald-50 border-emerald-300"
                          : "bg-white border-blue-200"
                      }`}
                    >
                      <div
                        className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          todayAppointmentChecked[apt.id] ? "bg-emerald-100" : "bg-blue-100"
                        }`}
                      >
                        <Hospital
                          className={`size-5 ${
                            todayAppointmentChecked[apt.id] ? "text-emerald-600" : "text-blue-600"
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apt.hospital}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="size-3" />
                          {apt.time}
                        </p>
                      </div>

                      {selectedDate && selectedDate.toDateString() === new Date().toDateString() && (
                        <Checkbox
                          checked={todayAppointmentChecked[apt.id] || false}
                          onCheckedChange={() =>
                            setTodayAppointmentChecked((prev) => ({
                              ...prev,
                              [apt.id]: !prev[apt.id],
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-blue-100">
                  <CalendarIcon className="size-6 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">
                    {selectedDate && selectedDate.toDateString() === new Date().toDateString()
                      ? "오늘 병원 일정이 없습니다"
                      : "이 날짜에는 병원 일정이 없습니다"}
                  </p>
                </div>
              )}
            </div>

            {/* Medication Schedule - Always show (daily recurring) */}
            {medications.length > 0 && (
              <div className="pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="size-4 text-purple-600" />
                  <p className="font-semibold text-gray-900">복약 일정</p>
                </div>

                <div className="space-y-2">
                  {selectedDate && getMedicationSchedules(selectedDate).map((schedule, idx) => {
                    const isToday = selectedDate.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={`${schedule.medId}-${schedule.timeIndex}-${idx}`}
                        className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                          schedule.completed
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-white border-purple-200"
                        }`}
                      >
                        <div
                          className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            schedule.completed ? "bg-emerald-100" : "bg-purple-100"
                          }`}
                        >
                          <Pill
                            className={`size-5 ${
                              schedule.completed ? "text-emerald-600" : "text-purple-600"
                            }`}
                          />
                        </div>

                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{schedule.medName}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="size-3" />
                            {schedule.time}
                          </p>
                        </div>

                        {isToday && (
                          <Checkbox
                            checked={schedule.completed}
                            onCheckedChange={() =>
                              toggleMedicationComplete(schedule.medId, schedule.timeIndex, selectedDate)
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 일정 관리 Area (Collapsible) */}
      <Card className="border-2 border-blue-100">
        <CardHeader
          className="cursor-pointer hover:bg-blue-50/50 transition-colors"
          onClick={() => setIsScheduleOpen(!isScheduleOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hospital className="size-5 text-blue-600" />
              <CardTitle>일정 관리</CardTitle>
            </div>
            <Button variant="ghost" size="icon">
              {isScheduleOpen ? (
                <ChevronUp className="size-5 text-gray-600" />
              ) : (
                <ChevronDown className="size-5 text-gray-600" />
              )}
            </Button>
          </div>
          <CardDescription>병원 방문 일정을 추가하고 관리하세요</CardDescription>
        </CardHeader>

        {isScheduleOpen && (
          <CardContent className="space-y-4 border-t">
            {/* Add New Appointment Form */}
            {isAddingAppointment && (
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="font-medium text-gray-900 mb-3">병원 방문 일정 추가</p>

                <div className="space-y-4">
                  <div className="space-y-2">
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

                  <div className="space-y-2">
                    <Label>방문 일정</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-2"
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {appointmentDateTime.date ? (
                            format(
                              new Date(
                                appointmentDateTime.date.getFullYear(),
                                appointmentDateTime.date.getMonth(),
                                appointmentDateTime.date.getDate(),
                                parseInt(appointmentDateTime.hour),
                                parseInt(appointmentDateTime.minute)
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
                            onSelect={(date) =>
                              setAppointmentDateTime({ ...appointmentDateTime, date })
                            }
                            locale={ko}
                            initialFocus
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
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                      <SelectItem
                                        key={hour}
                                        value={hour.toString().padStart(2, "0")}
                                      >
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
                                    setAppointmentDateTime({
                                      ...appointmentDateTime,
                                      minute: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {["00", "10", "20", "30", "40", "50"].map((minute) => (
                                      <SelectItem key={minute} value={minute}>
                                        {minute}분
                                      </SelectItem>
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
                      onChange={(e) =>
                        setNewAppointment({ ...newAppointment, memo: e.target.value })
                      }
                      className="border-2 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={handleSaveAppointment}
                >
                  <Check className="size-4 mr-2" />
                  저장
                </Button>
              </div>
            )}

            {/* Add Appointment Button */}
            {!isAddingAppointment && (
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => setIsAddingAppointment(true)}
              >
                <Plus className="size-4 mr-2" />
                일정 추가
              </Button>
            )}

            {/* Upcoming Appointments List */}
            <div className="space-y-3">
              <p className="font-medium text-gray-900">예정된 일정</p>
              {appointments.map((apt) => (
                <Card key={apt.id} className="border border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Hospital className="size-5 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{apt.hospital}</p>
                        <p className="text-sm text-gray-600 mt-1">{apt.memo}</p>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <CalendarIcon className="size-3" />
                          {format(apt.date, "yyyy.MM.dd (E) HH:mm", { locale: ko })}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-blue-100 text-blue-900">
                          D-{calculateDday(apt.date)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAppointment(apt.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Medication Management Area (Collapsible) */}
      <Card className="border-2 border-purple-100">
        <CardHeader
          className="cursor-pointer hover:bg-purple-50/50 transition-colors"
          onClick={() => setIsMedicationOpen(!isMedicationOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="size-5 text-purple-600" />
              <CardTitle>복약 관리</CardTitle>
            </div>
            <Button variant="ghost" size="icon">
              {isMedicationOpen ? (
                <ChevronUp className="size-5 text-gray-600" />
              ) : (
                <ChevronDown className="size-5 text-gray-600" />
              )}
            </Button>
          </div>
          <CardDescription>복용 중인 약과 복용 시간을 관리하세요</CardDescription>
        </CardHeader>

        {isMedicationOpen && (
          <CardContent className="space-y-4 border-t">
            {/* Add New Medication Form */}
            {isAddingMedication && (
              <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900">복약 추가</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMedicationForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Medication Name with Autocomplete */}
                  <div className="space-y-2 relative">
                    <Label htmlFor="med-name">약 이름</Label>
                    <Input
                      id="med-name"
                      placeholder="약 이름을 검색하세요"
                      value={medicationNameInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMedicationNameInput(value);
                        setNewMedication((prev) => ({
                          ...prev,
                          name: value,
                        }));
                        setShowMedicationSuggestions(true);
                      }}
                      onFocus={() => setShowMedicationSuggestions(true)}
                      className="border-2"
                    />

                    {showMedicationSuggestions &&
                      medicationNameInput &&
                      filteredMedications.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border-2 border-purple-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                          {filteredMedications.map((med, idx) => (
                            <button
                              type="button"
                              key={idx}
                              className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors"
                              onClick={() => handleMedicationNameSelect(med)}
                            >
                              {med}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Frequency Selection */}
                  <div className="space-y-2">
                    <Label>복용 횟수</Label>
                    <Select
                      value={newMedication.frequency}
                      onValueChange={handleMedicationFrequencyChange}
                      disabled={newMedication.timing === "취침 전"}
                    >
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">하루 1번</SelectItem>
                        <SelectItem value="2">하루 2번</SelectItem>
                        <SelectItem value="3">하루 3번</SelectItem>
                        <SelectItem value="4">하루 4번</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timing Selection */}
                  <div className="space-y-2">
                    <Label>복용 시점</Label>
                    <Select
                      value={newMedication.timing}
                      onValueChange={handleMedicationTimingChange}
                    >
                      <SelectTrigger className="border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="식전">식전</SelectItem>
                        <SelectItem value="식후">식후</SelectItem>
                        <SelectItem value="취침 전">취침 전</SelectItem>
                        <SelectItem value="상관없음">상관없음</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Editable Medication Times */}
                  <div className="space-y-2">
                    <Label>복용 시간</Label>
                    <div className="space-y-2">
                      {newMedication.times.length > 0 ? (
                        newMedication.times.map((time, idx) => (
                          <Popover key={idx}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal border-2"
                              >
                                <Clock className="mr-2 size-4" />
                                {time || "시간 선택"}
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-auto p-3" align="start">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">시간 선택</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">시</Label>
                                    <Select
                                      value={time.split(":")[0]}
                                      onValueChange={(hour) => {
                                        const minute = time.split(":")[1] || "00";
                                        handleMedicationTimeChange(idx, `${hour}:${minute}`);
                                      }}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                          <SelectItem
                                            key={hour}
                                            value={hour.toString().padStart(2, "0")}
                                          >
                                            {hour.toString().padStart(2, "0")}시
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">분</Label>
                                    <Select
                                      value={time.split(":")[1] || "00"}
                                      onValueChange={(minute) => {
                                        const hour = time.split(":")[0];
                                        handleMedicationTimeChange(idx, `${hour}:${minute}`);
                                      }}
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {["00", "10", "20", "30", "40", "50"].map((minute) => (
                                          <SelectItem key={minute} value={minute}>
                                            {minute}분
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 p-3 bg-white border-2 border-purple-200 rounded-lg">
                          복용 횟수와 시점을 선택하면 추천 시간이 표시됩니다
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  onClick={handleSaveMedication}
                >
                  <Check className="size-4 mr-2" />
                  저장
                </Button>
              </div>
            )}

            {/* Add Medication Button */}
            {!isAddingMedication && (
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                onClick={openMedicationForm}
              >
                <Plus className="size-4 mr-2" />
                복약 추가
              </Button>
            )}

            {/* Current Medications List */}
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

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMedication(med.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        삭제
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {med.times.map((time, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg border-2 bg-gray-50 border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="size-4 text-gray-600" />
                            <span className="text-sm font-medium">{time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notification Settings Area (Collapsible) */}
      <Card className="border-2 border-amber-100">
        <CardHeader
          className="cursor-pointer hover:bg-amber-50/50 transition-colors"
          onClick={() => setIsReminderOpen(!isReminderOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-amber-600" />
              <CardTitle>알림 설정</CardTitle>
            </div>
            <Button variant="ghost" size="icon">
              {isReminderOpen ? (
                <ChevronUp className="size-5 text-gray-600" />
              ) : (
                <ChevronDown className="size-5 text-gray-600" />
              )}
            </Button>
          </div>
          <CardDescription>건강 관리 알림을 설정하고 관리하세요</CardDescription>
        </CardHeader>

        {isReminderOpen && (
          <CardContent className="space-y-3 border-t">
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
                      21일 후 정기 검진 예정
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3 text-emerald-600" />
                      오늘 복약 1회 남음
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}