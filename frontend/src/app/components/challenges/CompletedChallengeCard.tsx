import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, Trophy } from "lucide-react";
import type { Challenge } from "../../types/challenges";

interface CompletedChallengeCardProps {
  challenge: Challenge & { completedAt?: string };
}

export function CompletedChallengeCard({ challenge }: CompletedChallengeCardProps) {
  const Icon = challenge.icon;
  const completedDate = challenge.completedAt
    ? new Date(challenge.completedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <Card className="border-2 border-emerald-100 bg-emerald-50/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="size-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{challenge.title}</p>
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200">
                <CheckCircle2 className="size-3 mr-1" />
                완료
              </Badge>
              <Badge variant="outline">{challenge.category}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{challenge.duration} · {challenge.difficulty}</p>
            {completedDate && (
              <p className="text-xs text-emerald-600 mt-1">완료일: {completedDate}</p>
            )}
          </div>
          <Trophy className="size-6 text-amber-400 flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
