export interface Appointment {
  id: number;
  hospital_name: string;
  visit_date: string;
  memo: string | null;
}

export interface Medication {
  id: number;
  name: string;
  times: string[];
  completedByDate: {
    [dateString: string]: boolean[];
  };
}

export interface Reminder {
  id: number;
  type: "appointment" | "medication";
  title: string;
  remind_at: string;
  enabled: boolean;
}
