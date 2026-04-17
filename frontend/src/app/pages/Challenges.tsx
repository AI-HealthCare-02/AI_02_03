import { useEffect, useState } from "react";
import type React from "react";
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
  Utensils,
  BookOpen,
  Trophy,
  CheckCircle2,
  Loader2,
  Upload,
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
import { foodService } from "../../services/food";

type DietAnalysisState = "idle" | "loading" | "result" | "error";
type CompleteState = "idle" | "loading" | "done";

interface DietResult {
  food_name: string;
  calories: number;
  fat: number;
  sugar: number;
  liver_impact: string;
  recommendation: string;
}

interface CompleteResult {
  score_before: number;
  new_score: number;
  new_grade: string;
}

export function Challenges() {
  const [dietState, setDietState] = useState<DietAnalysisState>("idle");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dietResult, setDietResult] = useState<DietResult | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<(Challenge & { completedAt?: string })[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("전체");
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
  const completedChallengeIds = new Set(completedChallenges.map((c) => c.challengeId));

  const CATEGORIES = ["전체", "운동", "식단", "식습관", "수면", "체중감량", "금주", "금연"];

  const sortedAvailable = [...availableChallenges]
    .filter((c) => !completedChallengeIds.has(c.id))
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
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setDietState("loading");
    try {
      const result = await foodService.analyze(uploadedFile);
      setDietResult(result);
      setDietState("result");
    } catch {
      setDietState("error");
    }
  };

  const handleResetDiet = () => {
    setDietState("idle");
    setUploadedImage(null);
    setUploadedFile(null);
    setDietResult(null);
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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="diet" className="gap-1 text-xs sm:text-sm">
            <Utensils className="size-4" />
            식단
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
          {dietState === "result" && dietResult && (
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
                    <p className="font-bold text-gray-900">{dietResult.food_name}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">칼로리</p>
                      <p className="font-bold text-gray-900">{dietResult.calories} kcal</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">지방</p>
                      <p className="font-bold text-gray-900">{dietResult.fat}g</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">당</p>
                      <p className="font-bold text-gray-900">{dietResult.sugar}g</p>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-bold text-emerald-900 mb-1">✨ 지방간 영향</p>
                    <p className="text-sm text-gray-700">{dietResult.liver_impact}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-bold text-blue-900 mb-1">💡 건강 조언</p>
                    <p className="text-sm text-gray-700">{dietResult.recommendation}</p>
                  </div>
                </div>
                <Button onClick={handleResetDiet} variant="outline" className="w-full">
                  다시 분석하기
                </Button>
              </CardContent>
            </Card>
          )}
          {dietState === "error" && (
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-red-600 font-medium">분석 중 오류가 발생했습니다</p>
                <p className="text-sm text-gray-600">이미지를 다시 업로드하거나 잠시 후 시도해주세요</p>
                <Button onClick={handleResetDiet} variant="outline">다시 시도하기</Button>
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
