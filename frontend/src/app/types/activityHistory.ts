export type PeriodFilter = "week" | "month";
export type InfoFilter = "all" | "weight" | "exercise" | "alcohol";
export type ViewMode = "list" | "calendar";

export interface DailyHealthLog {
  id: number;
  log_date: string;
  weight: number | null;
  exercise_done: boolean;
  exercise_duration: number | null;
  alcohol_consumed: boolean;
  alcohol_amount: number | null;
  smoking_done: boolean;
  smoking_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface DisplayRecord {
  id: number;
  date: string;       // "2026.04.07"
  dayOfWeek: string;
  weight: number | null;
  weightChange?: number;
  exercise: { done: boolean; duration?: number };
  alcohol: { consumed: boolean; amount?: number };
  smoking: { smoked: boolean; amount?: number };
}

export const DAY_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

export function toDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

export function toDayOfWeek(dateStr: string) {
  return DAY_OF_WEEK[new Date(dateStr).getDay()];
}

export function logsToRecords(logs: DailyHealthLog[]): DisplayRecord[] {
  return logs.map((log, i) => {
    const prevLog = logs[i + 1];
    const weightChange =
      log.weight !== null && prevLog?.weight !== null && prevLog?.weight !== undefined
        ? Math.round((log.weight - prevLog.weight) * 10) / 10
        : undefined;

    return {
      id: log.id,
      date: toDisplayDate(log.log_date),
      dayOfWeek: toDayOfWeek(log.log_date),
      weight: log.weight,
      weightChange,
      exercise: { done: log.exercise_done, duration: log.exercise_duration ?? undefined },
      alcohol: { consumed: log.alcohol_consumed, amount: log.alcohol_amount ?? undefined },
      smoking: { smoked: log.smoking_done, amount: log.smoking_amount ?? undefined },
    };
  });
}
