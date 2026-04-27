import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Target } from "lucide-react";
import { format } from "date-fns";

import { ScheduleCalendarCard } from "../components/schedule/ScheduleCalendarCard";
import { AppointmentSection } from "../components/schedule/AppointmentSection";
import { MedicationSection } from "../components/schedule/MedicationSection";
import { ReminderSection } from "../components/schedule/ReminderSection";

import type {
  Appointment,
  Medication,
  Reminder,
} from "../components/schedule/types";

export function Schedule() {
  const [selectedDate, setSelectedDate] =
    useState<Date | undefined>(new Date());

  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);

  const [medications, setMedications] = useState<
    Medication[]
  >([]);

  const [reminders, setReminders] = useState<Reminder[]>(
    []
  );

  const [
    todayAppointmentChecked,
    setTodayAppointmentChecked,
  ] = useState<{ [key: number]: boolean }>({});

  /** 병원 일정 불러오기 */
  const fetchAppointments = async () => {
    try {
      const res = await api.get<Appointment[]>(
        "/api/v1/appointments/me"
      );

      setAppointments(res.data);
    } catch {
      // ignore
    }
  };

  /** 복약 불러오기 */
  const fetchMedications = async () => {
    try {
      const today = new Date();

      const [medsRes, completionsRes] =
        await Promise.all([
          api.get<
            {
              id: number;
              name: string;
              dosage: string;
              times: string[];
            }[]
          >("/api/v1/medications/me"),

          api.get<{
            date: string;
            completions: { [timeIndex: string]: boolean };
          }>(
            `/api/v1/medications/me/completions?date=${format(
              today,
              "yyyy-MM-dd"
            )}`
          ),
        ]);

      const completions =
        completionsRes.data.completions;

      const todayKey = today.toDateString();

      setMedications(
        medsRes.data.map((med) => ({
          id: med.id,
          name: med.name,
          times: med.times,

          completedByDate: {
            [todayKey]: med.times.map(
              (_, idx) => completions[idx] ?? false
            ),
          },
        }))
      );
    } catch {
      // ignore
    }
  };

  /** 알림 불러오기 */
  const fetchReminders = async () => {
    try {
      const res = await api.get<Reminder[]>(
        "/api/v1/reminders/me"
      );

      setReminders(res.data);
    } catch {
      // ignore
    }
  };

  /** 최초 로딩 */

  useEffect(() => {
    fetchAppointments();
    fetchMedications();
    fetchReminders();
  }, []);

  /** 복약 체크 토글 */

  const toggleMedicationComplete = async (
    medId: number,
    timeIndex: number,
    date: Date
  ) => {
    const dateString = date.toDateString();

    const med = medications.find(
      (m) => m.id === medId
    );

    if (!med) return;

    const current =
      (
        med.completedByDate[dateString] ??
        new Array(med.times.length).fill(false)
      )[timeIndex];

    const updatedValue = !current;

    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== medId) return m;

        const arr =
          m.completedByDate[dateString] ??
          new Array(m.times.length).fill(false);

        const updatedArr = arr.map(
          (c, i) =>
            i === timeIndex ? updatedValue : c
        );

        return {
          ...m,
          completedByDate: {
            ...m.completedByDate,
            [dateString]: updatedArr,
          },
        };
      })
    );

    try {
      await api.patch(
        `/api/v1/medications/${medId}/completions`,
        {
          date: format(date, "yyyy-MM-dd"),
          time_index: timeIndex,
          completed: updatedValue,
        }
      );
    } catch {
      // ignore
    }
  };

  /** D-DAY 계산 */

  const calculateDday = (targetDate: Date) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);

    target.setHours(0, 0, 0, 0);

    return Math.ceil(
      (target.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  /** 다음 병원 일정 계산 */

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
        .sort(
          (a, b) =>
            new Date(a.visit_date).getTime() -
            new Date(b.visit_date).getTime()
        )[0] ?? null
    );
  };

  const nextAppointment =
    getNextAppointment();

  return (
    <div className="space-y-6 pb-8">
      {/* 페이지 제목 */}

      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Target className="size-8 text-emerald-600" />
          일정관리
        </h2>

        <p className="text-gray-600">
          오늘의 할 일을 확인하고 건강 관리 일정을 체크하세요
        </p>
      </div>

      {/* 캘린더 + 오늘 할 일 */}

      <ScheduleCalendarCard
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        appointments={appointments}
        medications={medications}
        todayAppointmentChecked={
          todayAppointmentChecked
        }
        onToggleAppointmentChecked={(id) =>
          setTodayAppointmentChecked(
            (prev) => ({
              ...prev,
              [id]: !prev[id],
            })
          )
        }
        onToggleMedicationComplete={
          toggleMedicationComplete
        }
        nextAppointment={nextAppointment}
        calculateDday={calculateDday}
      />

      {/* 병원 일정 */}

      <AppointmentSection
        appointments={appointments}
        onRefresh={fetchAppointments}
        calculateDday={calculateDday}
      />

      {/* 복약 관리 */}

      <MedicationSection
        medications={medications}
        onRefresh={fetchMedications}
      />

      {/* 알림 설정 */}

      <ReminderSection
        reminders={reminders}
        onRefresh={fetchReminders}
        nextAppointment={nextAppointment}
        calculateDday={calculateDday}
      />
    </div>
  );
}