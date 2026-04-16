import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
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
  Star,
} from "lucide-react";
import { challengeService } from "../../services/challenge";
import { foodService } from "../../services/food";

// API 응답 타입
type ActiveChallenge = {
  user_challenge_id: number;
  challenge_name: string;
  type: string;
  status: string;
  joined_at: string;
  completed_at: string | null;
};

type AvailableChallenge = {
  id: number;
  type: string;
  name: string;
  description: string;
  duration_days: number;
  required_logs: number;
  is_recommended: boolean;
};

type FoodResult = {
  food_name: string;
  fat: number;
  sugar: number;
  calories: number;
  impact_message: string;
};

type DietAnalysisState = "idle" | "loading" | "result";

// type별 아이콘 매핑
const typeIconMap: Record<string, any> = {
  "운동": Activity,
  "식단": Utensils,
  "금주": Trophy,
  "수면": Moon,
  "수분": Droplet,
  "체중관리": Weight,
  "식습관": Utensils,
  "생활습관": Heart,
};

export function Challenges() {
  const [dietState, setDietState] = useState<DietAnalysisState>("idle");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [foodResult, setFoodResult] = useState<FoodResult | null>(null);

  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [availableChallenges, setAvailableChallenges] = useState<AvailableChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<number | null>(null);
  const [logLoading, setLogLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const [active, available] = await Promise.all([
        challengeService.getMy("진행중"),
        challengeService.getAll(),
      ]);
      setActiveChallenges(active);
      setAvailableChallenges(available);
    } catch (err) {
      console.error("챌린지 불러오기 실패", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (challengeId: number) => {
    setJoinLoading(challengeId);
    try {
      await challengeService.join(challengeId);
      await fetchChallenges();
    } catch (err: any) {
      alert(err.response?.data?.error_detail || "챌린지 참여에 실패했습니다.");
    } finally {
      setJoinLoading(null);
    }
  };

  const handleLog = async (userChallengeId: number) => {
    setLogLoading(userChallengeId);
    try {
      const result = await challengeService.log(userChallengeId, true);
      alert(result.motivation_message || "오늘의 챌린지를 기록했습니다!");
    } catch (err: any) {
      alert(err.response?.data?.error_detail || "기록에 실패했습니다.");
    } finally {
      setLogLoading(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setDietState("loading");
    try {
      const result = await foodService.analyze(selectedFile);
      setFoodResult(result);
      setDietState("result");
    } catch (err: any) {
      alert(err.response?.data?.error_detail || "분석에 실패했습니다.");
      setDietState("idle");
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

        {/* 진행 중 탭 */}
        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="size-8 text-emerald-600 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">진행 중인 챌린지가 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map((challenge) => (
              <ActiveChallengeCard
                key={challenge.user_challenge_id}
                challenge={challenge}
                isLogging={logLoading === challenge.user_challenge_id}
                onLog={handleLog}
              />
            ))
          )}
        </TabsContent>

        {/* 참여 가능 탭 */}
        <TabsContent value="available" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="size-8 text-emerald-600 animate-spin mx-auto" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {availableChallenges.map((challenge) => (
                <AvailableChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isJoining={joinLoading === challenge.id}
                  onJoin={handleJoin}
                />
              ))}
              <AddCustomChallengeCard />
            </div>
          )}
        </TabsContent>

        {/* 식단 분석 탭 */}
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
                  <input
                    type="file"
                    accept="image/jpg,image/jpeg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="diet-upload"
                  />
                  <label htmlFor="diet-upload">
                    <Button asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                      <span>사진 선택</span>
                    </Button>
                  </label>
                  {uploadedImage && (
                    <div className="mt-4">
                      <img src={uploadedImage} alt="Uploaded" className="w-full max-w-sm mx-auto rounded-lg" />
                      <Button
                        onClick={handleAnalyze}
                        className="mt-4 w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      >
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
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <Loader2 className="size-16 text-emerald-600 animate-spin mx-auto" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">식단을 분석중입니다...</h3>
                    <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {dietState === "result" && foodResult && (
            <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="p-6 space-y-4">
                {uploadedImage && (
                  <img src={uploadedImage} alt="Analyzed" className="w-full rounded-lg" />
                )}

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="size-5 text-emerald-600" />
                    분석 결과
                  </h3>

                  <div className="p-4 bg-white rounded-lg border border-emerald-200">
                    <p className="text-sm text-gray-600 mb-1">음식</p>
                    <p className="font-bold text-gray-900">{foodResult.food_name}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">칼로리</p>
                      <p className="font-bold text-gray-900">{foodResult.calories} kcal</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">지방</p>
                      <p className="font-bold text-gray-900">{foodResult.fat}g</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 text-center">
                      <p className="text-xs text-gray-600 mb-1">당</p>
                      <p className="font-bold text-gray-900">{foodResult.sugar}g</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm font-bold text-emerald-900 mb-1">✨ 한줄 평가</p>
                    <p className="text-sm text-gray-700">{foodResult.impact_message}</p>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setDietState("idle");
                    setUploadedImage(null);
                    setSelectedFile(null);
                    setFoodResult(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  다시 분석하기
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActiveChallengeCard({
  challenge,
  isLogging,
  onLog,
}: {
  challenge: ActiveChallenge;
  isLogging: boolean;
  onLog: (userChallengeId: number) => void;
}) {
  const Icon = typeIconMap[challenge.type] ?? Activity;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="size-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Icon className="size-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="mb-1">{challenge.challenge_name}</CardTitle>
              <Badge variant="outline">{challenge.type}</Badge>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-900">
            {challenge.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          참여일: {new Date(challenge.joined_at).toLocaleDateString("ko-KR")}
        </p>
        <Button
          className="w-full"
          variant="outline"
          disabled={isLogging}
          onClick={() => onLog(challenge.user_challenge_id)}
        >
          {isLogging ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4 mr-2" />
          )}
          오늘의 목표 달성하기
        </Button>
      </CardContent>
    </Card>
  );
}

function AvailableChallengeCard({
  challenge,
  isJoining,
  onJoin,
}: {
  challenge: AvailableChallenge;
  isJoining: boolean;
  onJoin: (challengeId: number) => void;
}) {
  const Icon = typeIconMap[challenge.type] ?? Activity;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-3 mb-3">
          <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="size-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="mb-1">{challenge.name}</CardTitle>
            <CardDescription>{challenge.description}</CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{challenge.type}</Badge>
          {challenge.is_recommended && (
            <Badge className="bg-amber-100 text-amber-900 border-amber-200">
              <Star className="size-3 mr-1" />
              추천
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{challenge.duration_days}일</span>
          </div>
          <span className="text-gray-400">목표 {challenge.required_logs}회</span>
        </div>

        <Button
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          disabled={isJoining}
          onClick={() => onJoin(challenge.id)}
        >
          {isJoining ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
          챌린지 시작하기
        </Button>
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
    difficulty: "초급" as "초급" | "중급" | "고급",
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
    console.log("Custom Challenge Created:", { ...formData, icon: selectedIcon });
    setOpen(false);
    setFormData({ title: "", description: "", category: "", duration: "", difficulty: "초급" });
    setSelectedIcon("Activity");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                <Plus className="size-4 mr-2" />
                챌린지 만들기
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogTrigger>

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
                      selectedIcon === iconOption.name
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
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
            <Input
              id="title"
              placeholder="예) 아침 스트레칭 챌린지"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">챌린지 방법 *</Label>
            <Textarea
              id="description"
              placeholder="예) 매일 아침 10분씩 스트레칭하기"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">분류 *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="기간을 선택하세요" />
              </SelectTrigger>
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
            <RadioGroup
              value={formData.difficulty}
              onValueChange={(value) => setFormData({ ...formData, difficulty: value as "초급" | "중급" | "고급" })}
            >
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
            <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
              챌린지 만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
