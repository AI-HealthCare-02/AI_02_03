import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  FileText,
  Wine,
  Dumbbell,
  Cigarette,
  Moon,
  Info,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import api from "../../lib/api";

type SectionType = "basic" | "lifestyle" | "diet" | "diagnosis" | null;

export function HealthDataManagement() {
  const [expandedSection, setExpandedSection] = useState<SectionType>(null);
  const [loading, setLoading] = useState(true);

  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [waistUnknown, setWaistUnknown] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Info
    gender: "male",
    height: "",
    weight: "",
    waist: "",

    // Lifestyle
    drinksAlcohol: "no",
    alcoholType: "",
    alcoholTypeOther: "",
    alcoholTypeOtherMultiple: [] as string[],
    drinkingFrequency: "0",
    drinksPerSession: "0",
    exercises: "no",
    exerciseFrequency: "0",
    exerciseDuration: "30",
    smokes: "no",
    cigarettesPerDay: "",
    sleepHours: "7",

    // Diet
    dietQ1: "3",
    dietQ2: "3",
    dietQ3: "3",
    dietQ4: "3",
    dietQ5: "3",
    dietQ6: "3",
    dietQ7: "3",

    // Diagnosis
    diabetes: "no",
    hypertension: "no",
    sleepDisorder: "no",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 음주 종류 서버값 → 프론트 값 매핑
  const drinkTypeToFront = (v: string | null) => {
    if (!v) return "기타";
    if (v === "소주") return "soju";
    if (v === "맥주") return "beer";
    return "기타";
  };

  const drinkTypeToServer = (v: string) => {
    if (v === "soju") return "소주";
    if (v === "beer") return "맥주";
    return null;
  };

  useEffect(() => {
    api.get("/api/v1/surveys/me").then((res) => {
      const d = res.data;
      // age → 생년월일 역산 (현재 연도 기준 approximate)
      const approxBirth = new Date();
      approxBirth.setFullYear(approxBirth.getFullYear() - d.age);
      setBirthDate(approxBirth);

      setFormData({
        gender: d.gender === "남성" ? "male" : "female",
        height: String(d.height),
        weight: String(d.weight),
        waist: d.waist > 0 ? String(d.waist) : "",
        drinksAlcohol: d.drinking === "음주안함" ? "no" : "yes",
        alcoholType: drinkTypeToFront(d.drink_type ?? null),
        alcoholTypeOther: "",
        alcoholTypeOtherMultiple: [],
        drinkingFrequency: String(d.weekly_drink_freq),
        drinksPerSession: String(d.drink_amount),
        exercises: d.exercise === "운동안함" ? "no" : "yes",
        exerciseFrequency: String(d.weekly_exercise_count),
        exerciseDuration: "30",
        smokes: d.smoking === "현재흡연" ? "yes" : d.smoking === "과거흡연" ? "past" : "no",
        cigarettesPerDay: "",
        sleepHours: String(d.sleep_hours),
        dietQ1: String(d.diet_q1),
        dietQ2: String(d.diet_q2),
        dietQ3: String(d.diet_q3),
        dietQ4: String(d.diet_q4),
        dietQ5: String(d.diet_q5),
        dietQ6: String(d.diet_q6),
        dietQ7: String(d.diet_q7),
        diabetes: d.diabetes === "있음" ? "yes" : "no",
        hypertension: d.hypertension === "있음" ? "yes" : "no",
        sleepDisorder: d.sleep_disorder === "있음" ? "yes" : "no",
      });
      if (!d.waist || d.waist <= 0) setWaistUnknown(true);
    }).catch(() => {
      // 설문 없을 경우 기본값 유지
    }).finally(() => setLoading(false));
  }, []);

  const toggleSection = (section: SectionType) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleNumberInput = (field: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, [field]: value });
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
      }
    }
  };

  const handleSaveSection = async (section: SectionType) => {
    // 기본 정보 유효성 검사
    if (section === "basic") {
      const newErrors: Record<string, string> = {};
      const h = parseFloat(formData.height);
      const w = parseFloat(formData.weight);

      if (!formData.height || isNaN(h)) {
        newErrors.height = "키를 입력해주세요";
      } else if (h < 100 || h > 250) {
        newErrors.height = "키는 100cm ~ 250cm 사이로 입력해주세요";
      }

      if (!formData.weight || isNaN(w)) {
        newErrors.weight = "몸무게를 입력해주세요";
      } else if (w < 20 || w > 300) {
        newErrors.weight = "몸무게는 20kg ~ 300kg 사이로 입력해주세요";
      }

      if (!waistUnknown) {
        const wt = parseFloat(formData.waist);
        if (!formData.waist || isNaN(wt)) {
          newErrors.waist = "허리둘레를 입력해주세요";
        } else if (wt < 40 || wt > 200) {
          newErrors.waist = "허리둘레는 40cm ~ 200cm 사이로 입력해주세요";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    let payload: Record<string, unknown> = {};

    if (section === "basic") {
      payload = {
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        waist: waistUnknown ? 0 : parseFloat(formData.waist),
      };
    } else if (section === "lifestyle") {
      payload = {
        drinking: formData.drinksAlcohol === "yes" ? "음주함" : "음주안함",
        drink_amount: formData.drinksAlcohol === "yes" ? parseFloat(formData.drinksPerSession) : 0,
        drink_type: formData.drinksAlcohol === "yes" ? drinkTypeToServer(formData.alcoholType) : null,
        weekly_drink_freq: formData.drinksAlcohol === "yes" ? parseFloat(formData.drinkingFrequency) : 0,
        exercise: formData.exercises === "yes" ? "운동함" : "운동안함",
        weekly_exercise_count: formData.exercises === "yes" ? parseInt(formData.exerciseFrequency) : 0,
        smoking: formData.smokes === "yes" ? "현재흡연" : formData.smokes === "past" ? "과거흡연" : "비흡연",
        current_smoking: formData.smokes === "yes" ? "흡연" : "안함",
        sleep_hours: parseFloat(formData.sleepHours),
      };
    } else if (section === "diet") {
      payload = {
        diet_questions: [
          parseInt(formData.dietQ1),
          parseInt(formData.dietQ2),
          parseInt(formData.dietQ3),
          parseInt(formData.dietQ4),
          parseInt(formData.dietQ5),
          parseInt(formData.dietQ6),
          parseInt(formData.dietQ7),
        ],
      };
    } else if (section === "diagnosis") {
      payload = {
        diabetes: formData.diabetes === "yes" ? "있음" : "없음",
        hypertension: formData.hypertension === "yes" ? "있음" : "없음",
        sleep_disorder: formData.sleepDisorder === "yes" ? "있음" : "없음",
      };
    }

    try {
      const res = await api.patch<{
        detail: string;
        bmi: number;
        score_before: number;
        new_score: number;
        new_grade: string;
        score_change: number;
      }>("/api/v1/surveys/me", payload);
      const { new_score, new_grade, score_change } = res.data;
      const changeStr = score_change > 0 ? `+${score_change}` : String(score_change);
      setSaveMessage({ type: "success", text: `저장되었습니다. 현재 점수: ${Math.round(new_score)}점 (${new_grade}) [${changeStr}점]` });
      setExpandedSection(null);
    } catch {
      setSaveMessage({ type: "error", text: "저장 중 오류가 발생했습니다." });
    }
  };

  const dietQuestions = [
    { id: "dietQ1", text: "하루에 채소를 충분히 먹는다" },
    { id: "dietQ2", text: "단 음식이나 음료를 자주 먹는다" },
    { id: "dietQ3", text: "튀김, 배달 음식, 패스트푸드를 자주 먹는다" },
    { id: "dietQ4", text: "식사를 규칙적인 시간에 한다" },
    { id: "dietQ5", text: "식사 시 과식하는 경우가 많다" },
    { id: "dietQ6", text: "단백질을 충분히 먹는다" },
    { id: "dietQ7", text: "야식을 자주 먹는다" },
  ];

  const scaleOptions = [
    { value: "1", label: "전혀\n아니다" },
    { value: "2", label: "아니다" },
    { value: "3", label: "보통\n이다" },
    { value: "4", label: "그렇다" },
    { value: "5", label: "매우\n그렇다" },
  ];

  const getScaleLabel = (value: string) => {
    const option = scaleOptions.find((opt) => opt.value === value);
    return option ? option.label.replace("\n", " ") : "-";
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const height = parseFloat(formData.height) / 100;
      const weight = parseFloat(formData.weight);
      return (weight / (height * height)).toFixed(1);
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="size-8 text-purple-600" />
          헬스 데이터 관리
        </h2>
        <p className="text-gray-600">건강 정보를 확인하고 수정하세요</p>
      </div>

      {saveMessage && (
        <p className={`text-sm px-4 py-3 rounded-lg border ${saveMessage.type === "success" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-600 bg-red-50 border-red-200"}`}>
          {saveMessage.text}
        </p>
      )}

      {/* Basic Info Section */}
      <Card className="border-2 border-emerald-100">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => expandedSection !== "basic" && toggleSection("basic")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>기본 정보</CardTitle>
            <div className="flex items-center gap-2">
              {expandedSection !== "basic" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("basic");
                  }}
                  className="border-2"
                >
                  수정
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {expandedSection !== "basic" ? (
            // Summary View
            <div className="space-y-6">
              {/* Info Grid - 2 columns */}
              <div className="grid grid-cols-2 gap-6">
                {/* Birth Date - Gender */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">생년월일</p>
                  <p className="text-lg font-bold text-gray-900">
                    {birthDate ? format(birthDate, "yyyy.MM.dd") : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">성별</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formData.gender === "male" ? "남성" : "여성"}
                  </p>
                </div>

                {/* Age - Height */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">나이</p>
                  <p className="text-lg font-bold text-gray-900">
                    {birthDate ? differenceInYears(new Date(), birthDate) : "-"}세
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">키</p>
                  <p className="text-lg font-bold text-gray-900">{formData.height}cm</p>
                </div>

                {/* Weight - Waist */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">몸무게</p>
                  <p className="text-lg font-bold text-gray-900">{formData.weight}kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">허리둘레</p>
                  <p className="text-lg font-bold text-gray-900">
                    {waistUnknown ? "모름" : `${formData.waist}cm`}
                  </p>
                </div>
              </div>

              {/* BMI Emphasis Area */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">체질량지수</p>
                    <p className="text-3xl font-bold text-emerald-600">{calculateBMI()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-700">BMI</p>
                    <p className="text-xs text-gray-500 mt-1">정상 범위</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit Form - 신체 측정값만 수정 가능
            <form className="space-y-6">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                <Info className="size-4 mt-0.5 flex-shrink-0" />
                <span>키, 몸무게, 허리둘레만 수정할 수 있습니다. 나이·성별·진단 정보 등은 변경할 수 없습니다.</span>
              </div>

              {/* Height */}
              <div className="space-y-2">
                <Label htmlFor="height" className="text-base font-medium text-gray-900">
                  키 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="height"
                    type="text"
                    inputMode="decimal"
                    placeholder="예) 170"
                    value={formData.height}
                    onChange={(e) => handleNumberInput("height", e.target.value)}
                    className="h-12 text-lg border-2 pr-16"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    cm
                  </div>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-base font-medium text-gray-900">
                  몸무게 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="weight"
                    type="text"
                    inputMode="decimal"
                    placeholder="예) 65"
                    value={formData.weight}
                    onChange={(e) => handleNumberInput("weight", e.target.value)}
                    className="h-12 text-lg border-2 pr-16"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    kg
                  </div>
                </div>
              </div>

              {/* Waist */}
              <div className="space-y-2">
                <Label htmlFor="waist" className="text-base font-medium text-gray-900">
                  허리둘레 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="waist"
                    type="text"
                    inputMode="decimal"
                    placeholder="예) 80"
                    value={formData.waist}
                    onChange={(e) => handleNumberInput("waist", e.target.value)}
                    disabled={waistUnknown}
                    className={`h-12 text-lg border-2 pr-16 ${
                      waistUnknown ? "bg-gray-100 text-gray-400" : ""
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    cm
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="size-3" />
                  배꼽 위치에서 측정한 허리둘레를 입력해주세요
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="waist-unknown"
                    checked={waistUnknown}
                    onCheckedChange={(checked) => {
                      setWaistUnknown(!!checked);
                      if (checked) {
                        setFormData({ ...formData, waist: "" });
                      }
                    }}
                  />
                  <Label
                    htmlFor="waist-unknown"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    허리둘레를 모름
                  </Label>
                </div>
              </div>

              {/* BMI Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      현재 BMI: {calculateBMI()}
                    </p>
                    <p className="text-sm text-blue-700">
                      입력하신 키와 몸무게를 바탕으로 자동 계산됩니다
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleSection(null)}
                  className="flex-1 border-2"
                >
                  취소
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSaveSection("basic")}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  저장
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Lifestyle Section */}
      <Card className="border-2 border-blue-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>생활습관</CardTitle>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">수정 불가</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
              {/* Alcohol Summary */}
              <div className="pb-3 border-b">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Wine className="size-4 text-purple-600" />
                  음주
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">음주 여부: </span>
                    <span className="font-medium">
                      {formData.drinksAlcohol === "yes" ? "예" : "아니오"}
                    </span>
                  </div>
                  {formData.drinksAlcohol === "yes" && (
                    <>
                      <div>
                        <span className="text-gray-600">주종: </span>
                        <span className="font-medium">
                          {formData.alcoholType === "soju"
                            ? "소주"
                            : formData.alcoholType === "beer"
                            ? "맥주"
                            : "기타"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">음주 횟수: </span>
                        <span className="font-medium">주 {formData.drinkingFrequency}회</span>
                      </div>
                      <div>
                        <span className="text-gray-600">1회 음주량: </span>
                        <span className="font-medium">{formData.drinksPerSession}잔</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Exercise Summary */}
              <div className="pb-3 border-b">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Dumbbell className="size-4 text-blue-600" />
                  운동
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">운동 여부: </span>
                    <span className="font-medium">
                      {formData.exercises === "yes" ? "예" : "아니오"}
                    </span>
                  </div>
                  {formData.exercises === "yes" && (
                    <>
                      <div>
                        <span className="text-gray-600">운동 횟수: </span>
                        <span className="font-medium">주 {formData.exerciseFrequency}회</span>
                      </div>
                      <div>
                        <span className="text-gray-600">운동 시간: </span>
                        <span className="font-medium">{formData.exerciseDuration}분</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Smoking Summary */}
              <div className="pb-3 border-b">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Cigarette className="size-4 text-gray-600" />
                  흡연
                </p>
                <div className="text-sm">
                  <span className="text-gray-600">흡연 여부: </span>
                  <span className="font-medium">
                    {formData.smokes === "yes"
                      ? "예"
                      : formData.smokes === "past"
                      ? "과거 흡연"
                      : "아니오"}
                  </span>
                </div>
              </div>

              {/* Sleep Summary */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Moon className="size-4 text-indigo-600" />
                  수면
                </p>
                <div className="text-sm">
                  <span className="text-gray-600">평균 수면 시간: </span>
                  <span className="font-medium">{formData.sleepHours}시간</span>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Diet Assessment Section */}
      <Card className="border-2 border-orange-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>식습관 평가</CardTitle>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">수정 불가</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {dietQuestions.map((question) => (
              <div
                key={question.id}
                className="flex items-start justify-between gap-4 pb-3 border-b last:border-b-0 last:pb-0"
              >
                <p className="text-sm text-gray-700">{question.text}</p>
                <p className="font-medium text-gray-900 whitespace-nowrap">
                  {getScaleLabel(formData[question.id as keyof typeof formData] as string)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Section */}
      <Card className="border-2 border-red-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>진단 여부</CardTitle>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">수정 불가</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">당뇨 진단</p>
              <p className="font-medium text-gray-900">
                {formData.diabetes === "yes" ? "예" : "아니오"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">고혈압 진단</p>
              <p className="font-medium text-gray-900">
                {formData.hypertension === "yes" ? "예" : "아니오"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">수면장애 진단</p>
              <p className="font-medium text-gray-900">
                {formData.sleepDisorder === "yes" ? "예" : "아니오"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}