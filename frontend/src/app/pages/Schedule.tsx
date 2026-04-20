import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Target,
  Calendar as CalendarIcon,
  Clock,
  Hospital,
  Pill,
  Bell,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertCircle,
} from "lucide-react";

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

interface Appointment {
  id: number;
  hospital_name: string;
  visit_date: string;
  memo: string | null;
}

interface MedicationApiItem {
  id: number;
  name: string;
  dosage?: string;
  times: string[];
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

interface CompletionResponse {
  date: string;
  completions: { [timeIndex: string]: boolean };
}

export function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [todayAppointmentChecked, setTodayAppointmentChecked] = useState<{ [key: number]: boolean }>({});

  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isMedicationOpen, setIsMedicationOpen] = useState(true);
  const [isReminderOpen, setIsReminderOpen] = useState(true);

  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [isAddingMedication, setIsAddingMedication] = useState(false);

  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isLoadingMedications, setIsLoadingMedications] = useState(false);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isSavingMedication, setIsSavingMedication] = useState(false);

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

  const [newMedication, setNewMedication] = useState({
    name: "",
    frequency: "1",
    timing: "상관없음",
    times: ["12:00"] as string[],
  });

  const [medicationNameInput, setMedicationNameInput] = useState("");
  const [showMedicationSuggestions, setShowMedicationSuggestions] = useState(false);

  const medicationDatabase = [
    "우루사",
    "밀크씨슬",
    "실리마린",
    "타이레놀",
    "게보린",
    "판콜",
    "비타민C",
    "오메가3",
    "프로바이오틱스",
    "락토핏",
  ];

  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const res = await api.get<Appointment[]>("/api/v1/appointments/me");
      setAppointments(res.data);
    } catch (err) {
      console.error("병원 일정 조회 실패:", err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const fetchReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const res = await api.get<Reminder[]>("/api/v1/reminders/me");
      setReminders(res.data);
    } catch (err) {
      console.error("알림 조회 실패:", err);
    } finally {
      setIsLoadingReminders(false);
    }
  };

  const fetchMedicationsForDate = async (date: Date) => {
    setIsLoadingMedications(true);
    try {
      const dateParam = format(date, "yyyy-MM-dd");

      const [medsRes, completionsRes] = await Promise.all([
        api.get<MedicationApiItem[]>("/api/v1/medications/me"),
        api.get<CompletionResponse>(`/api/v1/medications/me/completions?date=${dateParam}`),
      ]);

      const completions = completionsRes.data.completions;
      const dateKey = date.toDateString();

      setMedications((prev) => {
        return medsRes.data.map((med) => {
          const existing = prev.find((item) => item.id === med.id);

          return {
            id: med.id,
            name: med.name,
            times: med.times,
            completedByDate: {
              ...(existing?.completedByDate ?? {}),
              [dateKey]: med.times.map((_, idx) => completions[idx] ?? false),
            },
          };
        });
      });
    } catch (err) {
      console.error("복약 조회 실패:", err);
    } finally {
      setIsLoadingMedications(false);
    }
  };

  useEffect(() => {
    void fetchAppointments();
    void fetchReminders();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    void fetchMedicationsForDate(selectedDate);
  }, [selectedDate]);

  const calculateDday = (targetDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDdayLabel = (targetDate: Date) => {
    const diff = calculateDday(targetDate);
    if (diff === 0) return "D-DAY";
    if (diff > 0) return `D-${diff}`;
    return `D+${Math.abs(diff)}`;
  };

  const getNextAppointment = (): Appointment | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      appointments
        .filter((apt) => {
          const d = new Date(apt.visit_date);
          d.setHours(0, 0, 0, 0);
          return d >= today;
        })
        .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())[0] || null
    );
  };

  const nextAppointment = getNextAppointment();

  const appointmentDates = useMemo(() => {
    return appointments.map((apt) => {
      const d = new Date(apt.visit_date);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [appointments]);

  const selectedDateAppointments = useMemo(() => {
    const baseDate = selectedDate || new Date();
    return appointments
      .filter((apt) => new Date(apt.visit_date).toDateString() === baseDate.toDateString())
      .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
  }, [appointments, selectedDate]);

  const toggleMedicationComplete = async (medId: number, timeIndex: number, date: Date) => {
    const dateKey = date.toDateString();
    const med = medications.find((m) => m.id === medId);
    if (!med) return;

    const current = (med.completedByDate[dateKey] || new Array(med.times.length).fill(false))[timeIndex];
    const newCompleted = !current;

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;

        const arr = m.completedByDate[dateKey] || new Array(m.times.length).fill(false);
        const updated = arr.map((c, i) => (i === timeIndex ? newCompleted : c));

        return {
          ...m,
          completedByDate: {
            ...m.completedByDate,
            [dateKey]: updated,
          },
        };
      })
    );

    try {
      await api.patch(`/api/v1/medications/${medId}/completions`, {
        date: format(date, "yyyy-MM-dd"),
        time_index: timeIndex,
        completed: newCompleted,
      });
    } catch (err) {
      console.error("복약 체크 업데이트 실패:", err);

      setMedications((prev) =>
        prev.map((m) => {
          if (m.id !== medId) return m;

          const arr = m.completedByDate[dateKey] || new Array(m.times.length).fill(false);
          const rolledBack = arr.map((c, i) => (i === timeIndex ? current : c));

          return {
            ...m,
            completedByDate: {
              ...m.completedByDate,
              [dateKey]: rolledBack,
            },
          };
        })
      );
    }
  };

  const createReminder = async (payload: {
    type: "appointment" | "medication";
    title: string;
    datetime: string;
    enabled?: boolean;
  }) => {
    try {
      await api.post("/api/v1/reminders", {
        type: payload.type,
        title: payload.title,
        datetime: payload.datetime,
        enabled: payload.enabled ?? true,
      });
      await fetchReminders();
    } catch (err) {
      console.error("알림 생성 실패:", err);
    }
  };

  const toggleReminderEnabled = async (reminderId: number) => {
    const target = reminders.find((item) => item.id === reminderId);
    if (!target) return;

    const nextEnabled = !target.enabled;

    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, enabled: nextEnabled } : reminder
      )
    );

    try {
      await api.patch(`/api/v1/reminders/${reminderId}`, {
        enabled: nextEnabled,
      });
    } catch (err) {
      console.error("알림 토글 실패:", err);

      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId ? { ...reminder, enabled: target.enabled } : reminder
        )
      );
    }
  };

  const deleteReminder = async (reminderId: number) => {
    try {
      await api.delete(`/api/v1/reminders/${reminderId}`);
      await fetchReminders();
    } catch (err) {
      console.error("알림 삭제 실패:", err);
    }
  };

  const deleteAppointment = async (id: number) => {
    try {
      await api.delete(`/api/v1/appointments/${id}`);
      await fetchAppointments();
    } catch (err) {
      console.error("병원 일정 삭제 실패:", err);
    }
  };

  const deleteMedication = async (id: number) => {
    try {
      await api.delete(`/api/v1/medications/${id}`);
      if (selectedDate) {
        await fetchMedicationsForDate(selectedDate);
      }
      await fetchReminders();
    } catch (err) {
      console.error("복약 삭제 실패:", err);
    }
  };

  const handleSaveAppointment = async () => {
    if (!appointmentDateTime.date || !newAppointment.hospital.trim()) {
      alert("병원명과 날짜를 입력해주세요.");
      return;
    }

    setIsSavingAppointment(true);

    try {
      const datetimeObj = new Date(appointmentDateTime.date);
      datetimeObj.setHours(parseInt(appointmentDateTime.hour, 10));
      datetimeObj.setMinutes(parseInt(appointmentDateTime.minute, 10));
      datetimeObj.setSeconds(0);
      datetimeObj.setMilliseconds(0);

      const visit_date = format(datetimeObj, "yyyy-MM-dd'T'HH:mm:ss");

      await api.post("/api/v1/appointments", {
        hospital_name: newAppointment.hospital,
        visit_date,
        memo: newAppointment.memo || null,
      });

      await createReminder({
        type: "appointment",
        title: `${newAppointment.hospital} 방문 일정`,
        datetime: visit_date,
        enabled: true,
      });

      setNewAppointment({ hospital: "", memo: "" });
      setAppointmentDateTime({
        date: undefined,
        hour: "09",
        minute: "00",
      });
      setIsAddingAppointment(false);

      await fetchAppointments();
    } catch (err) {
      console.error("병원 일정 저장 실패:", err);
      alert("병원 일정 저장에 실패했습니다.");
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const getRecommendedTimes = (frequency: string, timing: string): string[] => {
    if (timing === "취침 전") return ["22:00"];

    const freq = parseInt(frequency, 10);

    if (timing === "식전") {
      const timeMap: { [key: number]: string[] } = {
        1: ["07:30"],
        2: ["07:30", "17:30"],
        3: ["07:30", "11:30", "17:30"],
        4: ["07:30", "11:30", "17:30", "21:30"],
      };
      return timeMap[freq] || ["07:30"];
    }

    if (timing === "식후") {
      const timeMap: { [key: number]: string[] } = {
        1: ["08:30"],
        2: ["08:30", "18:30"],
        3: ["08:30", "12:30", "18:30"],
        4: ["08:30", "12:30", "18:30", "22:00"],
      };
      return timeMap[freq] || ["08:30"];
    }

    const defaultMap: { [key: number]: string[] } = {
      1: ["12:00"],
      2: ["08:00", "20:00"],
      3: ["08:00", "12:00", "18:00"],
      4: ["08:00", "12:00", "18:00", "22:00"],
    };

    return defaultMap[freq] || ["12:00"];
  };

  const openMedicationForm = () => {
    const initialTimes = getRecommendedTimes("1", "상관없음");

    setNewMedication({
      name: "",
      frequency: "1",
      timing: "상관없음",
      times: initialTimes,
    });
    setMedicationNameInput("");
    setShowMedicationSuggestions(false);
    setIsAddingMedication(true);
  };

  const closeMedicationForm = () => {
    setNewMedication({
      name: "",
      frequency: "1",
      timing: "상관없음",
      times: ["12:00"],
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

  const handleSaveMedication = async () => {
    const trimmedName = newMedication.name.trim();

    if (!trimmedName || newMedication.times.length === 0) {
      alert("약 이름과 복용 시간을 입력해주세요.");
      return;
    }

    setIsSavingMedication(true);

    try {
      await api.post("/api/v1/medications", {
        name: trimmedName,
        times: [...newMedication.times],
      });

      const baseDate = selectedDate ?? new Date();
      const dateStr = format(baseDate, "yyyy-MM-dd");

      for (const time of newMedication.times) {
        await createReminder({
          type: "medication",
          title: `${trimmedName} 복약 알림`,
          datetime: `${dateStr} ${time}`,
          enabled: true,
        });
      }

      closeMedicationForm();

      if (selectedDate) {
        await fetchMedicationsForDate(selectedDate);
      }

      await fetchReminders();
    } catch (err) {
      console.error("복약 저장 실패:", err);
      alert("복약 저장에 실패했습니다.");
    } finally {
      setIsSavingMedication(false);
    }
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

  const getMedicationSchedules = (date: Date) => {
    const dateKey = date.toDateString();

    const schedules: Array<{
      medId: number;
      medName: string;
      time: string;
      timeIndex: number;
      completed: boolean;
    }> = [];

    medications.forEach((med) => {
      const completedForDate =
        med.completedByDate[dateKey] || new Array(med.times.length).fill(false);

      med.times.forEach((time, idx) => {
        schedules.push({
          medId: med.id,
          medName: med.name,
          time,
          timeIndex: idx,
          completed: completedForDate[idx],
        });
      });
    });

    schedules.sort((a, b) => {
      const [ah, am] = a.time.split(":").map(Number);
      const [bh, bm] = b.time.split(":").map(Number);

      if (ah !== bh) return ah - bh;
      return am - bm;
    });

    return schedules;
  };

  const selectedDateMedicationSchedules = selectedDate
    ? getMedicationSchedules(selectedDate)
    : [];

  const remainingTodayMedications =
    selectedDate && selectedDate.toDateString() === new Date().toDateString()
      ? selectedDateMedicationSchedules.filter((item) => !item.completed).length
      : 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="size-8 text-emerald-600" />
          일정관리
        </h2>
        <p className="text-gray-600">오늘의 할 일을 확인하고 건강 관리 일정을 체크하세요</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
                bottom: 3px;
                left: 50%;
                transform: translateX(-50%);
                width: 5px;
                height: 5px;
                background-color: #2563eb;
                border-radius: 9999px;
              }
            `}</style>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-linear-to-br from-blue-50/50 to-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-blue-600" />
                {selectedDate && selectedDate.toDateString() === new Date().toDateString()
                  ? "오늘의 일정"
                  : selectedDate
                  ? `${format(selectedDate, "M월 d일 (E)", { locale: ko })} 일정`
                  : "오늘의 일정"}
              </CardTitle>

              {nextAppointment && (
                <div className="min-w-27.5 rounded-xl px-4 py-3 text-white bg-linear-to-br from-blue-500 to-blue-600 shadow-md">
                  <p className="text-xs opacity-90">D-DAY</p>
                  <p className="text-2xl font-bold">{getDdayLabel(new Date(nextAppointment.visit_date))}</p>
                  <p className="text-xs mt-1 truncate">{nextAppointment.hospital_name}</p>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Hospital className="size-4 text-blue-600" />
                <p className="font-semibold text-gray-900">병원 일정</p>
              </div>

              {selectedDateAppointments.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateAppointments.map((apt) => {
                    const isToday =
                      selectedDate?.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={apt.id}
                        className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                          todayAppointmentChecked[apt.id]
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-white border-blue-200"
                        }`}
                      >
                        <div
                          className={`size-10 rounded-lg flex items-center justify-center ${
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
                          <p className="font-medium text-gray-900">{apt.hospital_name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="size-3" />
                            {format(new Date(apt.visit_date), "HH:mm")}
                          </p>
                        </div>

                        {isToday && (
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
                    );
                  })}
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

            <div className="pt-4 border-t border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="size-4 text-purple-600" />
                <p className="font-semibold text-gray-900">복약 일정</p>
              </div>

              {isLoadingMedications ? (
                <div className="text-center py-4 text-sm text-gray-500 border rounded-lg bg-gray-50">
                  복약 정보를 불러오는 중입니다
                </div>
              ) : selectedDateMedicationSchedules.length > 0 ? (
                <div className="space-y-2">
                  {selectedDate && selectedDateMedicationSchedules.map((schedule, idx) => {
                    const isToday = selectedDate.toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={`${schedule.medId}-${schedule.timeIndex}-${idx}`}
                        className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
                          schedule.completed
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-white border-purple-200"
                        }`}
                      >
                        <div
                          className={`size-10 rounded-lg flex items-center justify-center ${
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
              ) : (
                <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-purple-100">
                  <Pill className="size-6 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">등록된 복약 일정이 없습니다</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Button variant="ghost" size="icon" type="button">
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
            {isAddingAppointment ? (
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
                          type="button"
                        >
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
                            onSelect={(date) =>
                              setAppointmentDateTime({ ...appointmentDateTime, date })
                            }
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

                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    onClick={handleSaveAppointment}
                    type="button"
                    disabled={isSavingAppointment}
                  >
                    <Check className="size-4 mr-2" />
                    {isSavingAppointment ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddingAppointment(false)}
                    type="button"
                    disabled={isSavingAppointment}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => setIsAddingAppointment(true)}
                type="button"
              >
                <Plus className="size-4 mr-2" />
                일정 추가
              </Button>
            )}

            <div className="space-y-3">
              <p className="font-medium text-gray-900">예정된 일정</p>

              {isLoadingAppointments ? (
                <div className="text-center py-6 text-sm text-gray-500 border rounded-lg bg-gray-50">
                  일정을 불러오는 중입니다
                </div>
              ) : appointments.length > 0 ? (
                appointments
                  .slice()
                  .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
                  .map((apt) => (
                    <Card key={apt.id} className="border border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
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
                            <Badge className="bg-blue-100 text-blue-900 hover:bg-blue-100">
                              {getDdayLabel(new Date(apt.visit_date))}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAppointment(apt.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                              type="button"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              삭제
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 border rounded-lg bg-gray-50">
                  등록된 병원 일정이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

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
            <Button variant="ghost" size="icon" type="button">
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
            {isAddingMedication ? (
              <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900">복약 추가</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMedicationForm}
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    disabled={isSavingMedication}
                  >
                    취소
                  </Button>
                </div>

                <div className="space-y-4">
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
                              key={idx}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors"
                              onClick={() => handleMedicationNameSelect(med)}
                            >
                              {med}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

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

                  <div className="space-y-2">
                    <Label>복용 시간</Label>
                    <div className="space-y-2">
                      {newMedication.times.map((time, idx) => (
                        <Popover key={idx}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal border-2"
                              type="button"
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
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-4 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  onClick={handleSaveMedication}
                  type="button"
                  disabled={isSavingMedication}
                >
                  <Check className="size-4 mr-2" />
                  {isSavingMedication ? "저장 중..." : "저장"}
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                onClick={openMedicationForm}
                type="button"
              >
                <Plus className="size-4 mr-2" />
                복약 추가
              </Button>
            )}

            <div className="space-y-3">
              <p className="font-medium text-gray-900">현재 복용 중인 약</p>

              {isLoadingMedications ? (
                <div className="text-center py-6 text-sm text-gray-500 border rounded-lg bg-gray-50">
                  복약 정보를 불러오는 중입니다
                </div>
              ) : medications.length > 0 ? (
                medications.map((med) => (
                  <Card key={med.id} className="border border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Pill className="size-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{med.name}</p>
                            <p className="text-sm text-gray-600">하루 {med.times.length}회 복용</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMedication(med.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                          type="button"
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
                ))
              ) : (
                <div className="text-center py-6 text-sm text-gray-500 border rounded-lg bg-gray-50">
                  등록된 복약 정보가 없습니다
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

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
            <Button variant="ghost" size="icon" type="button">
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
            {isLoadingReminders ? (
              <div className="text-center py-6 text-sm text-gray-500 border rounded-lg bg-gray-50">
                알림을 불러오는 중입니다
              </div>
            ) : reminders.length > 0 ? (
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

                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 h-7"
                          type="button"
                        >
                          <Trash2 className="size-3.5 mr-1" />
                          삭제
                        </Button>
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

            <div className="mt-4 p-4 bg-linear-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">다가오는 일정 요약</p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {nextAppointment ? (
                      <li className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-600" />
                        {getDdayLabel(new Date(nextAppointment.visit_date))} {nextAppointment.hospital_name} 예정
                      </li>
                    ) : (
                      <li className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-600" />
                        예정된 병원 일정이 없습니다
                      </li>
                    )}

                    {selectedDate && selectedDate.toDateString() === new Date().toDateString() ? (
                      <li className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-600" />
                        오늘 복약 {remainingTodayMedications}회 남음
                      </li>
                    ) : (
                      <li className="flex items-center gap-2">
                        <Check className="size-3 text-emerald-600" />
                        오늘 복약 현황은 오늘 날짜 선택 시 확인 가능
                      </li>
                    )}
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