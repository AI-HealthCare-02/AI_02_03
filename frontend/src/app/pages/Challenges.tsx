import { useState } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { 
  Activity, 
  Utensils, 
  Droplet, 
  Moon, 
  Weight,
  Heart,
  Trophy,
  CheckCircle2,
  Clock,
  Users,
  BookOpen
} from "lucide-react";

type Challenge = {
  id: number;
  title: string;
  description: string;
  icon: any;
  duration: string;
  participants: number;
  difficulty: "초급" | "중급" | "고급";
  category: string;
  progress?: number;
  daysLeft?: number;
};

export function Challenges() {
  const [activeChallenges] = useState<Challenge[]>([
    {
      id: 1,
      title: "30일 걷기 챌린지",
      description: "매일 30분 이상 걷기를 실천하세요",
      icon: Activity,
      duration: "30일",
      participants: 1250,
      difficulty: "초급",
      category: "운동",
      progress: 75,
      daysLeft: 7,
    },
    {
      id: 2,
      title: "설탕 줄이기 챌린지",
      description: "첨가당 섭취를 하루 25g 이하로 제한하기",
      icon: Utensils,
      duration: "30일",
      participants: 890,
      difficulty: "중급",
      category: "식습관",
      progress: 60,
      daysLeft: 12,
    },
    {
      id: 3,
      title: "규칙적인 수면 챌린지",
      description: "매일 같은 시간에 잠들고 7시간 이상 수면",
      icon: Moon,
      duration: "21일",
      participants: 645,
      difficulty: "중급",
      category: "수면",
      progress: 45,
      daysLeft: 16,
    },
  ]);

  const [availableChallenges] = useState<Challenge[]>([
    {
      id: 4,
      title: "물 마시기 챌린지",
      description: "하루 2L 이상의 물 마시기",
      icon: Droplet,
      duration: "14일",
      participants: 2100,
      difficulty: "초급",
      category: "수분",
    },
    {
      id: 5,
      title: "체중 관리 챌린지",
      description: "건강한 방법으로 체중 5% 감량하기",
      icon: Weight,
      duration: "90일",
      participants: 567,
      difficulty: "고급",
      category: "체중관리",
    },
    {
      id: 6,
      title: "근력 운동 챌린지",
      description: "주 3회 이상 근력 운동 실천하기",
      icon: Heart,
      duration: "30일",
      participants: 823,
      difficulty: "중급",
      category: "운동",
    },
    {
      id: 7,
      title: "채소 먹기 챌린지",
      description: "매 끼니마다 채소 반 접시 이상 섭취",
      icon: Utensils,
      duration: "21일",
      participants: 1456,
      difficulty: "초급",
      category: "식습관",
    },
    {
      id: 8,
      title: "금주 챌린지",
      description: "30일간 음주하지 않기",
      icon: Trophy,
      duration: "30일",
      participants: 432,
      difficulty: "고급",
      category: "생활습관",
    },
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">챌린지</h2>
          <p className="text-gray-600">건강한 습관을 만들어가는 여정에 함께하세요</p>
        </div>
        <Link to="/education">
          <Button variant="outline" className="gap-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50">
            <BookOpen className="size-4" />
            <span className="hidden sm:inline">건강 정보</span>
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            <Activity className="size-4" />
            진행 중 ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Trophy className="size-4" />
            참여 가능 ({availableChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">진행 중인 챌린지가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map((challenge) => (
              <ActiveChallengeCard key={challenge.id} challenge={challenge} />
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {availableChallenges.map((challenge) => (
              <AvailableChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActiveChallengeCard({ challenge }: { challenge: Challenge }) {
  const Icon = challenge.icon;
  
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
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-900">
            D-{challenge.daysLeft}
          </Badge>
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
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{challenge.participants.toLocaleString()}명 참여</span>
          </div>
          <Badge variant="outline">{challenge.difficulty}</Badge>
        </div>

        <Button className="w-full" variant="outline">
          <CheckCircle2 className="size-4 mr-2" />
          오늘의 목표 달성하기
        </Button>
      </CardContent>
    </Card>
  );
}

function AvailableChallengeCard({ challenge }: { challenge: Challenge }) {
  const Icon = challenge.icon;
  const difficultyColors = {
    "초급": "bg-green-100 text-green-900 border-green-200",
    "중급": "bg-yellow-100 text-yellow-900 border-yellow-200",
    "고급": "bg-red-100 text-red-900 border-red-200",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3 mb-3">
          <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="size-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="mb-1">{challenge.title}</CardTitle>
            <CardDescription>{challenge.description}</CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{challenge.participants.toLocaleString()}명</span>
          </div>
        </div>

        <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
          챌린지 시작하기
        </Button>
      </CardContent>
    </Card>
  );
}