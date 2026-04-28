import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../../lib/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import {
  Activity,
  BookOpen,
  Trophy,
  CheckCircle2,
  Loader2,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { ActiveChallengeCard } from "../components/challenges/ActiveChallengeCard";
import { AvailableChallengeCard } from "../components/challenges/AvailableChallengeCard";
import { CompletedChallengeCard } from "../components/challenges/CompletedChallengeCard";
import { AddCustomChallengeButton } from "../components/challenges/AddCustomChallengeButton";
import {
  type Challenge,
  type ChallengeAPI,
  type UserChallengeAPI,
  toChallenge,
  ucToChallenge,
} from "../types/challenges";
type CompleteState = "idle" | "loading" | "done";

interface CompleteResult {
  score_before: number;
  new_score: number;
  new_grade: string;
}

export function Challenges() {
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<(Challenge & { completedAt?: string })[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("전체");
  const [joining, setJoining] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  // 참여 확인 다이얼로그
  const [joinTarget, setJoinTarget] = useState<Challenge | null>(null);
  // 중단 확인 다이얼로그
  const [quitTarget, setQuitTarget] = useState<Challenge | null>(null);
  // 완료 축하 다이얼로그
  const [completeState, setCompleteState] = useState<CompleteState>("idle");
  const [completeResult, setCompleteResult] = useState<CompleteResult | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Challenge | null>(null);
  // 체중감량 챌린지 체중 입력
  const [weightInput, setWeightInput] = useState<string>("");
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [joinError, setJoinError] = useState("");

  interface SuggestedChallenge {
    id: number;
    type: string;
    name: string;
    description: string;
    duration_days: number;
    reason: string;
    score_delta: number | null;
    preview_badge: { name: string; description: string; emoji: string; condition: string | null } | null;
  }
  const [suggested, setSuggested] = useState<SuggestedChallenge[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const [nextAppt, setNextAppt] = useState<{ hospital_name: string; d_day: number } | null>(null);

  const activeJoinedIds = new Set(activeChallenges.map((c) => c.challengeId));
  const completedChallengeIds = new Set(completedChallenges.map((c) => c.challengeId));
  const suggestedIds = new Set(suggested.map((c) => c.id));

  const CATEGORIES = ["전체", "운동", "식단", "식습관", "수면", "체중감량", "금주", "금연"];

  const sortedAvailable = [...availableChallenges]
    .filter((c) => !completedChallengeIds.has(c.id))
    .filter((c) => !suggestedIds.has(c.id))
    .filter((c) => categoryFilter === "전체" || c.category === categoryFilter)
    .sort((a, b) => {
      const aJoined = activeJoinedIds.has(a.id) ? 1 : 0;
      const bJoined = activeJoinedIds.has(b.id) ? 1 : 0;
      return aJoined - bJoined;
    });

  const fetchActiveChallenges = async () => {
    const r = await api.get<UserChallengeAPI[]>("/api/v1/user-challenges/me", { params: { status: "진행중" } });
    setActiveChallenges(r.data.map(ucToChallenge));
  };

  const fetchCompletedChallenges = async () => {
    const r = await api.get<UserChallengeAPI[]>("/api/v1/user-challenges/me", { params: { status: "완료" } });
    setCompletedChallenges(r.data.map(ucToChallenge));
  };

  useEffect(() => {
    fetchActiveChallenges();
    fetchCompletedChallenges();
    api.get<ChallengeAPI[]>("/api/v1/challenges").then((r) => setAvailableChallenges(r.data.map(toChallenge)));
    api
      .get<{ next_appointment: { hospital_name: string; d_day: number } | null; suggested: SuggestedChallenge[] }>(
        "/api/v1/challenges/suggested"
      )
      .then((r) => {
        setSuggested(r.data.suggested);
        setNextAppt(r.data.next_appointment);
      })
      .catch(() => {})
      .finally(() => setSuggestedLoading(false));
  }, []);

  const handleJoinConfirm = async () => {
    if (!joinTarget) return;
    setJoining(joinTarget.id);
    setJoinError("");
    try {
      await api.post(`/api/v1/challenges/${joinTarget.id}/join`);
      await fetchActiveChallenges();
      setActiveTab("active");
    } catch {
      setJoinError("참여에 실패했습니다. 다시 시도해주세요.");
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
    if (challenge.category === "체중감량") {
      setCompleteTarget(challenge);
      setWeightInput("");
      setWeightDialogOpen(true);
      return;
    }
    await submitComplete(challenge, undefined);
  };

  const submitComplete = async (challenge: Challenge, weight: number | undefined) => {
    setCompleteTarget(challenge);
    setCompleteState("loading");
    try {
      const body = weight !== undefined ? { weight } : {};
      const r = await api.patch<CompleteResult>(`/api/v1/user-challenges/${challenge.id}/complete`, body);
      setCompleteResult(r.data);
      setCompleteState("done");
      await fetchActiveChallenges();
      await fetchCompletedChallenges();
    } catch {
      setCompleteState("idle");
      setCompleteTarget(null);
    }
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

      {joinError && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{joinError}</p>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-1 text-xs sm:text-sm">
            <Activity className="size-4" />
            진행 중
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-1 text-xs sm:text-sm">
            <Trophy className="size-4" />
            참여 가능
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1 text-xs sm:text-sm">
            <CheckCircle2 className="size-4" />
            완료
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-end">
            <AddCustomChallengeButton onCreated={fetchActiveChallenges} />
          </div>
          {activeChallenges.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">진행 중인 챌린지가 없습니다</p>
              </CardContent>
            </Card>
          )}
          {activeChallenges.map((challenge) => (
            <ActiveChallengeCard
              key={challenge.id}
              challenge={challenge}
              onQuit={() => setQuitTarget(challenge)}
              onDelete={async () => {
                await api.delete(`/api/v1/challenges/${challenge.challengeId}/custom`);
                await fetchActiveChallenges();
              }}
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
          ))}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {/* AI 추천 챌린지 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              <h3 className="font-bold text-gray-900">
                {nextAppt ? `진료 D-${nextAppt.d_day} 추천 챌린지` : "AI 추천 챌린지"}
              </h3>
              {nextAppt && (
                <Badge className="bg-amber-100 text-amber-700 text-xs">{nextAppt.hospital_name}</Badge>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {suggestedLoading ? (
                <>
                  {[0, 1].map((i) => (
                    <Card key={i} className="border-2 border-amber-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                        <div className="h-10 bg-amber-50 rounded animate-pulse" />
                        <div className="h-8 bg-gray-100 rounded animate-pulse" />
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : suggested.length === 0 ? (
                <div className="col-span-2 text-sm text-gray-400 text-center py-4">추천 챌린지가 없습니다</div>
              ) : (
                suggested.map((c) => {
                  const joined = activeJoinedIds.has(c.id);
                  return (
                    <Card key={c.id} className={`border-2 ${joined ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-gradient-to-br from-amber-50/50 to-white"}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{c.duration_days}일 · {c.type}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 flex-shrink-0">{c.duration_days}일</Badge>
                        </div>
                        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-2">
                          {c.reason}{c.score_delta ? ` · +${c.score_delta}점 가능` : ""}
                        </p>
                        {c.preview_badge && (
                          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-100">
                            <span className="text-xl">{c.preview_badge.emoji}</span>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-800">{c.preview_badge.name}</p>
                              <p className="text-xs text-gray-500">{c.preview_badge.description}</p>
                              {c.preview_badge.condition && (
                                <p className="text-xs text-gray-400 mt-0.5">{c.preview_badge.condition}</p>
                              )}
                            </div>
                            <Badge className="ml-auto bg-gray-100 text-gray-500 text-xs flex-shrink-0">완료 시 획득</Badge>
                          </div>
                        )}
                        <Button
                          size="sm"
                          className={`w-full ${joined ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"} text-white`}
                          disabled={joined || joining === c.id}
                          onClick={() => !joined && setJoinTarget(toChallenge({ ...c, is_recommended: true, participant_count: 0, is_custom: false, required_logs: c.duration_days }))}
                        >
                          {joined ? "✓ 진행 중" : "참여하기"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
            <hr className="border-gray-200" />
          </div>
          {/* 카테고리 필터 */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
                className={categoryFilter === cat ? "bg-emerald-600 hover:bg-emerald-700" : ""}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {sortedAvailable.length === 0 ? (
              <div className="col-span-2">
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">해당 카테고리의 챌린지가 없습니다</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              sortedAvailable.map((challenge) => (
                <AvailableChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  alreadyJoined={activeJoinedIds.has(challenge.id)}
                  onJoin={() => setJoinTarget(challenge)}
                  joining={joining}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">완료한 챌린지가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedChallenges.map((challenge) => (
                <CompletedChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
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

      {/* 체중 입력 다이얼로그 */}
      <Dialog open={weightDialogOpen} onOpenChange={(o) => { if (!o) { setWeightDialogOpen(false); setCompleteTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>현재 체중을 입력해주세요</DialogTitle>
            <DialogDescription>챌린지 완료 후 실제 체중을 기록하면 건강 점수에 반영됩니다.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <input
              type="number"
              step="0.1"
              min="30"
              max="300"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="예: 72.5"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-500">kg</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWeightDialogOpen(false); setCompleteTarget(null); }}>취소</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!weightInput || Number(weightInput) < 30}
              onClick={() => {
                setWeightDialogOpen(false);
                if (completeTarget) submitComplete(completeTarget, Number(weightInput));
              }}
            >
              완료하기
            </Button>
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
