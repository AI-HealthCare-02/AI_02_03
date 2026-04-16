import type React from "react";
import {
  Activity,
  Utensils,
  Droplet,
  Moon,
  Weight,
  Heart,
  Trophy,
} from "lucide-react";

export type Difficulty = "초급" | "중급" | "고급";

export type Challenge = {
  id: number;
  challengeId: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  participants: number;
  difficulty: Difficulty;
  category: string;
  isRecommended?: boolean;
  isCustom?: boolean;
  progress?: number;
  daysLeft?: number;
  requiredLogs?: number;
  todayCompleted?: boolean;
};

export interface UserChallengeAPI {
  user_challenge_id: number;
  challenge_id: number;
  challenge_name: string;
  type: string;
  description: string;
  duration_days: number;
  required_logs: number;
  status: string;
  progress: number;
  days_left: number;
  today_completed: boolean;
  completed_at?: string;
}

export interface ChallengeAPI {
  id: number;
  type: string;
  name: string;
  description: string;
  duration_days: number;
  required_logs: number;
  is_recommended: boolean;
  participant_count: number;
  is_custom: boolean;
}

export const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  운동: Activity,
  식습관: Utensils,
  식단: Utensils,
  수면: Moon,
  수분: Droplet,
  금주: Trophy,
  체중관리: Weight,
  체중감량: Weight,
};

export const typeIcon = (type: string): React.ComponentType<{ className?: string }> =>
  TYPE_ICON[type] ?? Heart;

export function getDifficulty(durationDays: number): Difficulty {
  if (durationDays <= 7) return "초급";
  if (durationDays <= 21) return "중급";
  return "고급";
}

export const toChallenge = (c: ChallengeAPI): Challenge => ({
  id: c.id,
  challengeId: c.id,
  title: c.name,
  description: c.description,
  icon: typeIcon(c.type),
  duration: `${c.duration_days}일`,
  participants: c.participant_count,
  difficulty: getDifficulty(c.duration_days),
  category: c.type,
  isRecommended: c.is_recommended,
  isCustom: c.is_custom,
  requiredLogs: c.required_logs,
});

export const ucToChallenge = (uc: UserChallengeAPI): Challenge & { completedAt?: string } => ({
  id: uc.user_challenge_id,
  challengeId: uc.challenge_id,
  title: uc.challenge_name,
  description: uc.description,
  icon: typeIcon(uc.type),
  duration: `${uc.duration_days}일`,
  participants: 0,
  difficulty: getDifficulty(uc.duration_days),
  category: uc.type,
  progress: uc.progress,
  daysLeft: uc.days_left,
  requiredLogs: uc.required_logs,
  todayCompleted: uc.today_completed,
  completedAt: uc.completed_at,
});
