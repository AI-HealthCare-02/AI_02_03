import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { Challenge, Difficulty } from "../../types/challenges";

interface AvailableChallengeCardProps {
  challenge: Challenge;
  alreadyJoined: boolean;
  onJoin?: () => void;
  joining?: number | null;
}

export function AvailableChallengeCard({
  challenge,
  alreadyJoined,
  onJoin,
  joining,
}: AvailableChallengeCardProps) {
  const Icon = challenge.icon;
  const difficultyColors: Record<Difficulty, string> = {
    초급: "bg-green-100 text-green-900 border-green-200",
    중급: "bg-yellow-100 text-yellow-900 border-yellow-200",
    고급: "bg-red-100 text-red-900 border-red-200",
  };

  const cardBg = alreadyJoined
    ? "bg-gray-50 border-gray-200 opacity-60"
    : challenge.isRecommended
    ? "border-2 border-amber-300 bg-amber-50/30"
    : "";

  const iconBg = alreadyJoined ? "bg-gray-200" : challenge.isRecommended ? "bg-amber-100" : "bg-blue-100";
  const iconColor = alreadyJoined ? "text-gray-400" : challenge.isRecommended ? "text-amber-600" : "text-blue-600";

  return (
    <Card className={`transition-shadow ${alreadyJoined ? "hover:shadow-none" : "hover:shadow-lg"} ${cardBg}`}>
      <CardHeader>
        <div className="flex items-start gap-3 mb-3">
          <div className={`size-12 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`size-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <CardTitle className={`mb-1 ${alreadyJoined ? "text-gray-400" : ""}`}>{challenge.title}</CardTitle>
            <CardDescription>{challenge.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={difficultyColors[challenge.difficulty]}>
            {challenge.difficulty}
          </Badge>
          <Badge variant="outline">{challenge.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{challenge.duration}</span>
          </div>
        </div>

        {alreadyJoined ? (
          <Button className="w-full" variant="outline" disabled>
            <CheckCircle2 className="size-4 mr-2 text-emerald-600" />
            진행 중
          </Button>
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            onClick={onJoin}
            disabled={joining !== null}
          >
            챌린지 시작하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
