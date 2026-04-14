import { useEffect, useState } from "react";
import type React from "react";
import { Link } from "react-router";
import api from "../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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
  BookOpen,
  Plus,
  Smile,
  Dumbbell,
  Apple,
  Bed,
  Coffee,
  Bike,
  Upload,
  Loader2,
  Sparkles,
  X,
  PartyPopper,
} from "lucide-react";

type Difficulty = "초급" | "중급" | "고급";

type Challenge = {
  id: number;
  challengeId: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: string;
  participants: number;
  difficulty: Difficulty;
  category: string;
  progress?: number;
  daysLeft?: number;
  requiredLogs?: number;
  todayCompleted?: boolean;
};

interface UserChallengeAPI {
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
}

interface ChallengeAPI {
  id: number;
  type: string;
  name: string;
  description: string;
  duration_days: number;
  required_logs: number;
  is_recommended: boolean;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  운동: Activity,
  식습관: Utensils,
  식단: Utensils,
  수면: Moon,
  수분: Droplet,
  금주: Trophy,
  체중관리: Weight,
  체중감량: Weight,
};
const typeIcon = (type: string) => TYPE_ICON[type] ?? Heart;

function getDifficulty(durationDays: number): Difficulty {
  if (durationDays <= 7) return "초급";
  if (durationDays <= 21) return "중급";
  return "고급";
}

const toChallenge = (c: ChallengeAPI): Challenge => ({
  id: c.id,
  challengeId: c.id,
  title: c.name,
  description: c.description,
  icon: typeIcon(c.type),
  duration: `${c.duration_days}일`,
  participants: 0,
  difficulty: getDifficulty(c.duration_days),
  category: c.type,
  requiredLogs: c.required_logs,
});

const ucToChallenge = (uc: UserChallengeAPI): Challenge => ({
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
});

type DietAnalysisState = "idle" | "loading" | "result";
type CompleteState = "idle" | "loading" | "done";

interface CompleteResult {
  score_before: number;
  new_score: number;
  new_grade: string;
}

export function Challenges() {
  const [dietState, setDietState] = useState<DietAnalysisState>("idle");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [joining, setJoining] = useState<number | null>(null);

  // 참여 확인 다이얼로그
  const [joinTarget, setJoinTarget] = useState<Challenge | null>(null);
  // 중단 확인 다이얼로그
  const [quitTarget, setQuitTarget] = useState<Challenge | null>(null);
  // 완료 축하 다이얼로그
  const [completeState, setCompleteState] = useState<CompleteState>("idle");
  const [completeResult, setCompleteResult] = useState<CompleteResult | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Challenge | null>(null);

  const activeJoinedIds = new Set(activeChallenges.map((c) => c.challengeId));

  const fetchActiveChallenges = async () => {
    const r = await api.get<UserChallengeAPI[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } });
    setActiveChallenges(r.data.map(ucToChallenge));
  };

  useEffect(() => {
    fetchActiveChallenges();
    api.get<ChallengeAPI[]>("/api/v1/challenges").then((r) => setAvailableChallenges(r.data.map(toChallenge)));
  }, []);

  const handleJoinConfirm = async () => {
    if (!joinTarget) return;
    setJoining(joinTarget.id);
    try {
      await api.post(`/api/v1/challenges/${joinTarget.id}/join`);
      await fetchActiveChallenges();
    } catch {
      // 이미 참여 중이거나 오류
    } finally {
      setJoining(null);
      setJoinTarget(null);
    }
  };

  const handleQuitConfirm = async () => {
    if (!quitTarget) return;
    try {
      await api.patch(`/api/v1/user-challenges/${quitTarget.id}/quit`);
      await fetchActiveChallenges();
    } catch {
      // 오류
    } finally {
      setQuitTarget(null);
    }
  };

  const handleCompleteChallenge = async (challenge: Challenge) => {
    setCompleteTarget(challenge);
    setCompleteState("loading");
    try {
      const r = await api.patch<CompleteResult>(`/api/v1/user-challenges/${challenge.id}/complete`);
      setCompleteResult(r.data);
      setCompleteState("done");
      await fetchActiveChallenges();
    } catch {
      setCompleteState("idle");
      setCompleteTarget(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    setDietState("loading");
    setTimeout(() => setDietState("result"), 2000);
  };

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Activity className="size-4" />
            진행 중
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Trophy className="size-4" />
            참여 가능
          </TabsTrigger>
          <TabsTrigger value="diet" className="gap-2">
            <Utensils className="size-4" />
            오늘의 식단
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
              <ActiveChallengeCard
                key={challenge.id}
                challenge={challenge}
                onQuit={() => setQuitTarget(challenge)}
                onComplete={() => handleCompleteChallenge(challenge)}
                onDailyLog={async () => {
                  try {
                    await api.post(`/api/v1/user-challenges/${challenge.id}/logs`, { is_completed: true });
                    await fetchActiveChallenges();
                  } catch {
                    // 오늘 이미 기록됨
                  }
                }}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {availableChallenges.map((challenge) => (
              <AvailableChallengeCard
                key={challenge.id}
                challenge={challenge}
                alreadyJoined={activeJoinedIds.has(challenge.id)}
                onJoin={() => setJoinTarget(challenge)}
                joining={joining}
              />
            ))}
            <AddCustomChallengeCard />
          </div>
        </TabsContent>

        <TabsContent value="diet" className="space-y-4">
          {dietState === "idle" && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="size-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="size-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">식단 사진을 업로드하세요</h3>
                    <p className="text-sm text-gray-600">사진 첨부 또는 드래그</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="diet-upload" />
                  <label htmlFor="diet-upload">
                    <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      <span>사진 선택</span>
                    </Button>
                  </label>
                  {uploadedImage && (
                    <div className="mt-4">
                      <img src={uploadedImage} alt="Uploaded" className="w-full max-w-sm mx-auto rounded-lg" />
                      <Button onClick={handleAnalyze} className="mt-4 w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                        분석하기
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {dietState === "loading" && (
            <Card className="border-2 border-emerald-200">
              <CardContent className="p-8 text-center space-y-4">
                <Loader2 className="size-16 text-emerald-600 animate-spin mx-auto" />
                <h3 className="text-lg font-bold text-gray-900">식단을 분석중입니다...</h3>
                <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
              </CardContent>
            </Card>
          )}
          {dietState === "result" && (
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="p-6 space-y-4">
                {uploadedImage && <img src={uploadedImage} alt="Analyzed" className="w-full rounded-lg" />}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="size-5 text-emerald-600" />
                    분석 결과
                  </h3>
                  <div className="p-4 bg-white rounded-lg border border-emerald-200">
                    <p className="text-sm text-gray-600 mb-1">음식</p>
                    <p className="font-bold text-gray-900">닭가슴살 샐러드, 현미밥</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">칼로리</p>
                      <p className="font-bold text-gray-900">420 kcal</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">지방</p>
                      <p className="font-bold text-gray-900">12g</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">당</p>
                      <p className="font-bold text-gray-900">8g</p>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-bold text-emerald-900 mb-1">✨ 한줄 평가</p>
                    <p className="text-sm text-gray-700">훌륭한 선택입니다! 단백질과 식이섬유가 풍부한 건강한 식단이에요.</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-bold text-blue-900 mb-2">💡 행동 추천</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 식후 20분 가벼운 산책을 추천해요</li>
                      <li>• 물을 충분히 마셔주세요 (2컵 이상)</li>
                    </ul>
                  </div>
                </div>
                <Button onClick={() => { setDietState("idle"); setUploadedImage(null); }} variant="outline" className="w-full">
                  다시 분석하기
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 참여 확인 다이얼로그 */}
      <Dialog open={!!joinTarget} onOpenChange={(o) => !o && setJoinTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>챌린지를 시작하시겠습니까?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{joinTarget?.title}</span> 챌린지에 참여합니다.
              {joinTarget && ` (${joinTarget.duration} / ${joinTarget.difficulty})`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinTarget(null)}>취소</Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleJoinConfirm}
              disabled={joining !== null}
            >
              {joining !== null ? "참여 중..." : "시작하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 중단 확인 다이얼로그 */}
      <Dialog open={!!quitTarget} onOpenChange={(o) => !o && setQuitTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>챌린지를 중단하시겠습니까?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{quitTarget?.title}</span> 챌린지를 중단합니다.
              지금까지 진행한 모든 기록이 삭제되며, 처음부터 다시 시작해야 합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuitTarget(null)}>계속 진행하기</Button>
            <Button variant="destructive" onClick={handleQuitConfirm}>중단하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 챌린지 완료 축하 다이얼로그 */}
      <Dialog
        open={completeState !== "idle"}
        onOpenChange={(o) => {
          if (!o) {
            setCompleteState("idle");
            setCompleteResult(null);
            setCompleteTarget(null);
          }
        }}
      >
        <DialogContent className="text-center">
          {completeState === "loading" && (
            <div className="py-8 space-y-4">
              <Loader2 className="size-16 text-emerald-600 animate-spin mx-auto" />
              <h3 className="text-xl font-bold text-gray-900">점수 측정 중...</h3>
              <p className="text-sm text-gray-600">챌린지 완료를 처리하고 있습니다</p>
            </div>
          )}
          {completeState === "done" && completeResult && (
            <div className="py-4 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="size-20 bg-gradient-to-br from-amber-100 to-yellow-200 rounded-full flex items-center justify-center">
                  <PartyPopper className="size-10 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">챌린지 완료!</h3>
                <p className="text-gray-600">
                  <span className="font-medium">{completeTarget?.title}</span> 챌린지를 완료했습니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-1">이전 점수</p>
                  <p className="text-2xl font-bold text-gray-700">{Math.round(completeResult.score_before)}점</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-1">새 점수</p>
                  <p className="text-2xl font-bold text-emerald-700">{Math.round(completeResult.new_score)}점</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-900 text-sm px-4 py-1">
                등급: {completeResult.new_grade}
              </Badge>
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                onClick={() => {
                  setCompleteState("idle");
                  setCompleteResult(null);
                  setCompleteTarget(null);
                }}
              >
                확인
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActiveChallengeCard({
  challenge,
  onQuit,
  onComplete,
  onDailyLog,
}: {
  challenge: Challenge;
  onQuit: () => void;
  onComplete: () => void;
  onDailyLog: () => Promise<void>;
}) {
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
              onClick={onQuit}
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
          <div className="flex items-center gap-1">
            <Users className="size-4" />
            <span>{challenge.participants.toLocaleString()}명 참여</span>
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

function AvailableChallengeCard({
  challenge,
  alreadyJoined,
  onJoin,
  joining,
}: {
  challenge: Challenge;
  alreadyJoined: boolean;
  onJoin?: () => void;
  joining?: number | null;
}) {
  const Icon = challenge.icon;
  const difficultyColors: Record<Difficulty, string> = {
    초급: "bg-green-100 text-green-900 border-green-200",
    중급: "bg-yellow-100 text-yellow-900 border-yellow-200",
    고급: "bg-red-100 text-red-900 border-red-200",
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

function AddCustomChallengeCard() {
  const [open, setOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("Activity");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    difficulty: "초급" as Difficulty,
  });

  const availableIcons = [
    { name: "Activity", icon: Activity, label: "운동" },
    { name: "Dumbbell", icon: Dumbbell, label: "근력" },
    { name: "Bike", icon: Bike, label: "자전거" },
    { name: "Utensils", icon: Utensils, label: "식사" },
    { name: "Apple", icon: Apple, label: "과일" },
    { name: "Coffee", icon: Coffee, label: "음료" },
    { name: "Droplet", icon: Droplet, label: "수분" },
    { name: "Moon", icon: Moon, label: "수면" },
    { name: "Bed", icon: Bed, label: "휴식" },
    { name: "Heart", icon: Heart, label: "건강" },
    { name: "Smile", icon: Smile, label: "기분" },
    { name: "Trophy", icon: Trophy, label: "목표" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    setFormData({ title: "", description: "", category: "", duration: "", difficulty: "초급" });
    setSelectedIcon("Activity");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setOpen(true)}>
        <CardHeader>
          <div className="flex items-start gap-3 mb-3">
            <div className="size-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Plus className="size-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="mb-1">나만의 챌린지 추가</CardTitle>
              <CardDescription>새로운 챌린지를 만들어보세요</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant="outline">사용자 정의</Badge>
            <p className="text-sm text-gray-500 text-center">클릭하여 나만의 챌린지를 만들어보세요</p>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
            <Plus className="size-4 mr-2" />
            챌린지 만들기
          </Button>
        </CardContent>
      </Card>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>나만의 챌린지 만들기</DialogTitle>
          <DialogDescription>맞춤형 챌린지를 생성하여 건강 목표를 달성하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>아이콘 설정 *</Label>
            <div className="grid grid-cols-6 gap-2">
              {availableIcons.map((iconOption) => {
                const IconComponent = iconOption.icon;
                return (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconOption.name)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      selectedIcon === iconOption.name ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <IconComponent className={`size-6 ${selectedIcon === iconOption.name ? "text-emerald-600" : "text-gray-600"}`} />
                    <span className="text-xs text-gray-600">{iconOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">챌린지 제목 *</Label>
            <Input id="title" placeholder="예) 아침 스트레칭 챌린지" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">챌린지 방법 *</Label>
            <Textarea id="description" placeholder="예) 매일 아침 10분씩 스트레칭하기" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">분류 *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger><SelectValue placeholder="카테고리를 선택하세요" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="운동">운동</SelectItem>
                <SelectItem value="식습관">식습관</SelectItem>
                <SelectItem value="수면">수면</SelectItem>
                <SelectItem value="수분">수분</SelectItem>
                <SelectItem value="체중관리">체중관리</SelectItem>
                <SelectItem value="생활습관">생활습관</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">일수 *</Label>
            <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
              <SelectTrigger><SelectValue placeholder="기간을 선택하세요" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7일">7일</SelectItem>
                <SelectItem value="14일">14일</SelectItem>
                <SelectItem value="21일">21일</SelectItem>
                <SelectItem value="30일">30일</SelectItem>
                <SelectItem value="60일">60일</SelectItem>
                <SelectItem value="90일">90일</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>난이도 *</Label>
            <RadioGroup value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value as Difficulty })}>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="초급" id="easy" />
                  <Label htmlFor="easy" className="cursor-pointer">초급</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="중급" id="medium" />
                  <Label htmlFor="medium" className="cursor-pointer">중급</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="고급" id="hard" />
                  <Label htmlFor="hard" className="cursor-pointer">고급</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">챌린지 만들기</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
