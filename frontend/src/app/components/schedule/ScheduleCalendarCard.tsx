import { Calendar } from "../ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Calendar as CalendarIcon, Clock, Hospital, Pill } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Appointment, Medication } from "./types";

interface MedicationSchedule {
  medId: number;
  medName: string;
  time: string;
  timeIndex: number;
  completed: boolean;
}

interface Props {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  appointments: Appointment[];
  medications: Medication[];
  todayAppointmentChecked: { [key: number]: boolean };
  onToggleAppointmentChecked: (id: number) => void;
  onToggleMedicationComplete: (
    medId: number,
    timeIndex: number,
    date: Date
  ) => void;
  nextAppointment: Appointment | null;
  calculateDday: (date: Date) => number;
}

function getTimeGroup(time: string) {
  const hour = parseInt(time.split(":")[0]);

  if (hour < 10) return "아침";
  if (hour < 14) return "점심";
  if (hour < 20) return "저녁";
  return "취침 전";
}

function getMedicationSchedules(
  medications: Medication[],
  date: Date
): MedicationSchedule[] {
  const dateString = date.toDateString();

  const schedules: MedicationSchedule[] = [];

  medications.forEach((med) => {
    const completed =
      med.completedByDate[dateString] ||
      new Array(med.times.length).fill(false);

    med.times.forEach((time, idx) => {
      schedules.push({
        medId: med.id,
        medName: med.name,
        time,
        timeIndex: idx,
        completed: completed[idx],
      });
    });
  });

  return schedules.sort((a, b) => {
    const [ah, am] = a.time.split(":").map(Number);
    const [bh, bm] = b.time.split(":").map(Number);

    return ah !== bh ? ah - bh : am - bm;
  });
}

export function ScheduleCalendarCard({
  selectedDate,
  onSelectDate,
  appointments,
  medications,
  todayAppointmentChecked,
  onToggleAppointmentChecked,
  onToggleMedicationComplete,
  nextAppointment,
  calculateDday,
}: Props) {
  const formatDday = (date: Date) => {
    const dday = calculateDday(date);

    if (dday === 0) return "D-DAY";
    if (dday > 0) return `D-${dday}`;

    return `D+${Math.abs(dday)}`;
  };

  const appointmentDates = appointments.map((apt) => {
    const date = new Date(apt.visit_date);

    date.setHours(0, 0, 0, 0);

    return date;
  });

  const selectedDateAppointments = appointments.filter(
    (apt) =>
      new Date(apt.visit_date).toDateString() ===
      (selectedDate || new Date()).toDateString()
  );

  const medicationSchedules = selectedDate
    ? getMedicationSchedules(medications, selectedDate)
    : [];

  const isToday =
    selectedDate?.toDateString() === new Date().toDateString();

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 캘린더 */}

      <Card className="border-2 border-gray-200">
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
            onSelect={onSelectDate}
            locale={ko}
            className="rounded-md border w-full"
            modifiers={{ hasAppointment: appointmentDates }}
            modifiersClassNames={{
              hasAppointment: "has-appointment",
            }}
          />

          <style>
            {`
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
            `}
          </style>
        </CardContent>
      </Card>

      {/* 오늘 할 일 */}

      <Card className="border-2 border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-blue-600" />

              {isToday
                ? "오늘 할 일"
                : selectedDate
                ? `${format(selectedDate, "M월 d일 (E)", {
                    locale: ko,
                  })} 일정`
                : "오늘 할 일"}
            </CardTitle>

            {nextAppointment && (
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                <p className="text-xs">다가오는 일정</p>
                <p className="text-xl font-bold">
                  {formatDday(
                    new Date(nextAppointment.visit_date)
                  )}
                </p>
                <p className="text-xs truncate max-w-[120px]">
                  {nextAppointment.hospital_name}
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 병원 일정 */}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Hospital className="size-4 text-blue-600" />

              <p className="font-semibold text-gray-900">
                병원 일정
              </p>
            </div>

            {selectedDateAppointments.length > 0 ? (
              <div className="space-y-2">
                {selectedDateAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                      todayAppointmentChecked[apt.id]
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Hospital className="size-5 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {apt.hospital_name}
                      </p>

                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="size-3" />
                        {format(
                          new Date(apt.visit_date),
                          "HH:mm"
                        )}
                      </p>
                    </div>

                    {isToday && (
                      <Checkbox
                        checked={
                          todayAppointmentChecked[apt.id] ||
                          false
                        }
                        onCheckedChange={() =>
                          onToggleAppointmentChecked(
                            apt.id
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-gray-200">
                <CalendarIcon className="size-6 mx-auto mb-1 opacity-30" />

                <p className="text-xs">
                  {isToday
                    ? "오늘 병원 일정이 없습니다"
                    : "이 날짜에는 병원 일정이 없습니다"}
                </p>
              </div>
            )}
          </div>

          {/* 복약 일정 */}

          {medicationSchedules.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="size-4 text-purple-600" />

                <p className="font-semibold text-gray-900">
                  복약 일정
                </p>
              </div>

              <div className="space-y-2">
                {medicationSchedules.map((schedule, idx) => (
                  <div
                    key={`${schedule.medId}-${schedule.timeIndex}-${idx}`}
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      schedule.completed
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Pill className="size-5 text-purple-600" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {schedule.medName}
                      </p>

                      <p className="text-sm text-gray-600">
                        {getTimeGroup(schedule.time)} ·{" "}
                        {schedule.time}
                      </p>
                    </div>

                    {isToday && selectedDate && (
                      <Checkbox
                        checked={schedule.completed}
                        onCheckedChange={() =>
                          onToggleMedicationComplete(
                            schedule.medId,
                            schedule.timeIndex,
                            selectedDate
                          )
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}