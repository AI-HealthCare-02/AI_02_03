import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Trophy,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import type { Challenge } from "../../types/challenges";

interface ActiveChallengeCardProps {
  challenge: Challenge;
  onQuit: () => void;
  onDelete: () => Promise<void>;
  onComplete: () => void;
  onDailyLog: () => Promise<void>;
}

export function ActiveChallengeCard({
  challenge,
  onQuit,
  onDelete,
  onComplete,
  onDailyLog,
}: ActiveChallengeCardProps) {
  const Icon = challenge.icon;
  const canComplete = (challenge.progress ?? 0) >= 100;
  const [logging, setLogging] = useState(false);

  const handleDailyLog = async () => {
    setLogging(true);
    await onDailyLog();
    setLogging(false);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="size-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Icon className="size-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="mb-1">{challenge.title}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-900">
              D-{challenge.daysLeft}
            </Badge>
            <button
              onClick={challenge.isCustom ? onDelete : onQuit}
              className="size-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">진행률</span>
            <span className="font-medium text-gray-900">{challenge.progress}%</span>
          </div>
          <Progress value={challenge.progress} className="h-2" />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{challenge.duration}</span>
          </div>
          <Badge variant="outline">{challenge.difficulty}</Badge>
        </div>

        {canComplete ? (
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            onClick={onComplete}
          >
            <Trophy className="size-4 mr-2" />
            챌린지 완료하기
          </Button>
        ) : challenge.todayCompleted ? (
          <Button className="w-full" variant="outline" disabled>
            <CheckCircle2 className="size-4 mr-2 text-emerald-500" />
            오늘 완료
          </Button>
        ) : (
          <Button className="w-full" variant="outline" onClick={handleDailyLog} disabled={logging}>
            <CheckCircle2 className="size-4 mr-2" />
            {logging ? "기록 중..." : "오늘의 목표 달성하기"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
