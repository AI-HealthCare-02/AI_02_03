import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import {
  FileText,
  CalendarIcon,
  Wine,
  Dumbbell,
  Cigarette,
  Moon,
  Info,
  Utensils,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ko } from "date-fns/locale";
import api from "../../lib/api";

type SectionType = "basic" | "lifestyle" | "diet" | "diagnosis" | null;

interface SurveyMeResponse {
  age: number;
  gender: string;
  height: number;
  weight: number;
  waist: number;
  drinking: string;
  drink_type: string | null;
  weekly_drink_freq: number;
  drink_amount: number;
  exercise: string;
  weekly_exercise_count: number;
  smoking: string;
  current_smoking: string;
  sleep_hours: number;
  diet_q1: number;
  diet_q2: number;
  diet_q3: number;
  diet_q4: number;
  diet_q5: number;
  diet_q6: number;
  diet_q7: number;
  diabetes: string;
  hypertension: string;
  sleep_disorder: string;
}

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
    if (!v) return "other";
    if (v === "소주") return "soju";
    if (v === "맥주") return "beer";
    return "other";
  };

  const drinkTypeToServer = (v: string) => {
    if (v === "soju") return "소주";
    if (v === "beer") return "맥주";
    return null;
  };

  useEffect(() => {
    api.get<SurveyMeResponse>("/api/v1/surveys/me").then((res) => {
      const d = res.data;
      // age → 생년월일 역산 (현재 연도 기준 approximate)
      const approxBirth = new Date();
      approxBirth.setFullYear(approxBirth.getFullYear() - d.age);
      setBirthDate(approxBirth);

      const smokingCount = d.current_smoking?.match(/\d+/)?.[0] ?? "";

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
        cigarettesPerDay: smokingCount,
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
      const ageFromBirthDate =
        birthDate !== undefined ? differenceInYears(new Date(), birthDate) : undefined;

      payload = {
        ...(ageFromBirthDate !== undefined ? { age: ageFromBirthDate } : {}),
        gender: formData.gender === "male" ? "남성" : "여성",
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
        current_smoking:
          formData.smokes === "yes"
            ? (formData.cigarettesPerDay ? `${formData.cigarettesPerDay}개비` : "흡연")
            : "안함",
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
      const res = await api.put<{
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
              <div className="grid grid-cols-2 gap-6">
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
            // Edit Form
            <form className="space-y-6">
              {/* Birth Date */}
              <div className="space-y-2">
                <Label className="text-base font-medium text-gray-900">
                  생년월일 <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full h-12 justify-start text-left font-normal border-2 ${
                        !birthDate && "text-gray-500"
                      }`}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {birthDate
                        ? format(birthDate, "yyyy년 MM월 dd일", { locale: ko })
                        : "생년월일을 선택하세요"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      onSelect={setBirthDate}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={ko}
                      defaultMonth={new Date(1995, 0)}
                    />
                  </PopoverContent>
                </Popover>

                {birthDate && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-900">
                      <span className="font-medium">만 나이:</span>{" "}
                      <span className="text-lg font-bold">
                        {differenceInYears(new Date(), birthDate)}세
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Gender */}
              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">
                  성별 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="male" id="male" className="peer sr-only" />
                    <Label
                      htmlFor="male"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.gender === "male"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-lg font-medium">남성</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="female" id="female" className="peer sr-only" />
                    <Label
                      htmlFor="female"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.gender === "female"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-lg font-medium">여성</span>
                    </Label>
                  </div>
                </RadioGroup>
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
                {errors.height && <p className="text-xs text-red-500">{errors.height}</p>}
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
                {errors.weight && <p className="text-xs text-red-500">{errors.weight}</p>}
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
                {errors.waist && <p className="text-xs text-red-500">{errors.waist}</p>}

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
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => expandedSection !== "lifestyle" && toggleSection("lifestyle")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>생활습관</CardTitle>
            <div className="flex items-center gap-2">
              {expandedSection !== "lifestyle" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("lifestyle");
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
          {expandedSection !== "lifestyle" ? (
            // Summary View
            <div className="space-y-4">
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
          ) : (
            // Edit Form - Lifestyle
            <form className="space-y-6">
              {/* Alcohol Section */}
              <div className="space-y-4 p-5 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Wine className="size-5 text-purple-600" />
                  <Label className="text-base font-medium text-gray-900">
                    음주 여부 <span className="text-red-500">*</span>
                  </Label>
                </div>

                <RadioGroup
                  value={formData.drinksAlcohol}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      drinksAlcohol: value,
                      ...(value === "no" && {
                        alcoholType: "",
                        drinkingFrequency: "0",
                        drinksPerSession: "0",
                      }),
                    })
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="yes" id="alcohol-yes" className="peer sr-only" />
                    <Label
                      htmlFor="alcohol-yes"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.drinksAlcohol === "yes"
                          ? "border-purple-500 bg-purple-100"
                          : "border-gray-200 hover:border-purple-200"
                      }`}
                    >
                      <span className="font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="alcohol-no" className="peer sr-only" />
                    <Label
                      htmlFor="alcohol-no"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.drinksAlcohol === "no"
                          ? "border-purple-500 bg-purple-100"
                          : "border-gray-200 hover:border-purple-200"
                      }`}
                    >
                      <span className="font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>

                {formData.drinksAlcohol === "yes" && (
                  <div className="space-y-4 mt-4 pl-4 border-l-4 border-purple-300">
                    {/* Alcohol Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        주로 드시는 주종 <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.alcoholType}
                        onValueChange={(value) =>
                          setFormData({ ...formData, alcoholType: value })
                        }
                        className="grid grid-cols-3 gap-3"
                      >
                        {[
                          { value: "soju", label: "소주" },
                          { value: "beer", label: "맥주" },
                          { value: "other", label: "기타" },
                        ].map(({ value, label }) => (
                          <div key={value}>
                            <RadioGroupItem value={value} id={`alcohol-${value}`} className="peer sr-only" />
                            <Label
                              htmlFor={`alcohol-${value}`}
                              className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.alcoholType === value
                                  ? "border-purple-500 bg-purple-100"
                                  : "border-gray-200 hover:border-purple-200"
                              }`}
                            >
                              <span className="font-medium">{label}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Drinking Frequency */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        주당 음주 횟수 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 2"
                          value={formData.drinkingFrequency}
                          onChange={(e) => handleNumberInput("drinkingFrequency", e.target.value)}
                          className="h-11 border-2 pr-20"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          회/주
                        </div>
                      </div>
                    </div>

                    {/* Drinks Per Session */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        1회 평균 음주량 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 3"
                          value={formData.drinksPerSession}
                          onChange={(e) => handleNumberInput("drinksPerSession", e.target.value)}
                          className="h-11 border-2 pr-16"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          잔
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">소주 1잔(50ml) 기준</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Exercise Section */}
              <div className="space-y-4 p-5 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="size-5 text-blue-600" />
                  <Label className="text-base font-medium text-gray-900">
                    운동 여부 <span className="text-red-500">*</span>
                  </Label>
                </div>

                <RadioGroup
                  value={formData.exercises}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      exercises: value,
                      ...(value === "no" && {
                        exerciseFrequency: "0",
                        exerciseDuration: "30",
                      }),
                    })
                  }
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="yes" id="exercise-yes" className="peer sr-only" />
                    <Label
                      htmlFor="exercise-yes"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.exercises === "yes"
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-200 hover:border-blue-200"
                      }`}
                    >
                      <span className="font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="exercise-no" className="peer sr-only" />
                    <Label
                      htmlFor="exercise-no"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.exercises === "no"
                          ? "border-blue-500 bg-blue-100"
                          : "border-gray-200 hover:border-blue-200"
                      }`}
                    >
                      <span className="font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>

                {formData.exercises === "yes" && (
                  <div className="space-y-4 mt-4 pl-4 border-l-4 border-blue-300">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        주당 운동 횟수 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 3"
                          value={formData.exerciseFrequency}
                          onChange={(e) => handleNumberInput("exerciseFrequency", e.target.value)}
                          className="h-11 border-2 pr-20"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          회/주
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        1회 평균 운동 시간 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 30"
                          value={formData.exerciseDuration}
                          onChange={(e) => handleNumberInput("exerciseDuration", e.target.value)}
                          className="h-11 border-2 pr-16"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          분
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Smoking Section */}
              <div className="space-y-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Cigarette className="size-5 text-gray-600" />
                  <Label className="text-base font-medium text-gray-900">
                    흡연 여부 <span className="text-red-500">*</span>
                  </Label>
                </div>

                <RadioGroup
                  value={formData.smokes}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      smokes: value,
                      ...(value !== "yes" && { cigarettesPerDay: "" }),
                    })
                  }
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { value: "yes", label: "예" },
                    { value: "past", label: "과거 흡연" },
                    { value: "no", label: "아니오" },
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={`smoke-${value}`} className="peer sr-only" />
                      <Label
                        htmlFor={`smoke-${value}`}
                        className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.smokes === value
                            ? "border-gray-500 bg-gray-100"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="font-medium text-sm">{label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {formData.smokes === "yes" && (
                  <div className="space-y-2 mt-4 pl-4 border-l-4 border-gray-300">
                    <Label className="text-sm font-medium">
                      하루 평균 흡연량 <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="예) 10"
                        value={formData.cigarettesPerDay}
                        onChange={(e) => handleNumberInput("cigarettesPerDay", e.target.value)}
                        className="h-11 border-2 pr-16"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        개비
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sleep Section */}
              <div className="space-y-4 p-5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="size-5 text-indigo-600" />
                  <Label className="text-base font-medium text-gray-900">
                    수면 시간 <span className="text-red-500">*</span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    하루 평균 수면 시간 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="예) 7"
                      value={formData.sleepHours}
                      onChange={(e) => handleNumberInput("sleepHours", e.target.value)}
                      className="h-11 border-2 pr-20"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      시간
                    </div>
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
                  onClick={() => handleSaveSection("lifestyle")}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  저장
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Diet Assessment Section */}
      <Card className="border-2 border-orange-100">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => expandedSection !== "diet" && toggleSection("diet")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>식습관 평가</CardTitle>
            <div className="flex items-center gap-2">
              {expandedSection !== "diet" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("diet");
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
          {expandedSection !== "diet" ? (
            // Summary View
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
          ) : (
            // Edit Form - Diet
            <form className="space-y-6">
              <div className="space-y-6">
                {dietQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="space-y-3 p-4 bg-orange-50/50 rounded-lg border border-orange-100"
                  >
                    <Label className="text-base font-medium text-gray-900 flex items-start gap-2">
                      <Utensils className="size-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>
                        {index + 1}. {question.text}
                      </span>
                    </Label>

                    <RadioGroup
                      value={formData[question.id as keyof typeof formData] as string}
                      onValueChange={(value) =>
                        setFormData({ ...formData, [question.id]: value })
                      }
                      className="grid grid-cols-5 gap-2"
                    >
                      {scaleOptions.map((option) => (
                        <div key={option.value}>
                          <RadioGroupItem
                            value={option.value}
                            id={`${question.id}-${option.value}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${question.id}-${option.value}`}
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all text-center min-h-[4rem] ${
                              formData[question.id as keyof typeof formData] === option.value
                                ? "border-orange-500 bg-orange-100"
                                : "border-gray-200 hover:border-orange-200"
                            }`}
                          >
                            <span className="text-xs font-medium whitespace-pre-line">
                              {option.label}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
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
                  onClick={() => handleSaveSection("diet")}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  저장
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Diagnosis Section */}
      <Card className="border-2 border-red-100">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => expandedSection !== "diagnosis" && toggleSection("diagnosis")}
        >
          <div className="flex items-center justify-between">
            <CardTitle>진단 여부</CardTitle>
            <div className="flex items-center gap-2">
              {expandedSection !== "diagnosis" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection("diagnosis");
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
          {expandedSection !== "diagnosis" ? (
            // Summary View
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
          ) : (
            // Edit Form - Diagnosis
            <form className="space-y-6">
              {/* Diabetes */}
              <div className="space-y-3 p-5 bg-red-50/50 rounded-lg border border-red-100">
                <Label className="text-base font-medium text-gray-900">
                  당뇨 진단 여부 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.diabetes}
                  onValueChange={(value) => setFormData({ ...formData, diabetes: value })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="yes" id="diabetes-yes" className="peer sr-only" />
                    <Label
                      htmlFor="diabetes-yes"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.diabetes === "yes"
                          ? "border-red-500 bg-red-100"
                          : "border-gray-200 hover:border-red-200"
                      }`}
                    >
                      <span className="font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="diabetes-no" className="peer sr-only" />
                    <Label
                      htmlFor="diabetes-no"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.diabetes === "no"
                          ? "border-red-500 bg-red-100"
                          : "border-gray-200 hover:border-red-200"
                      }`}
                    >
                      <span className="font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Hypertension */}
              <div className="space-y-3 p-5 bg-orange-50/50 rounded-lg border border-orange-100">
                <Label className="text-base font-medium text-gray-900">
                  고혈압 진단 여부 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.hypertension}
                  onValueChange={(value) => setFormData({ ...formData, hypertension: value })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="yes" id="hypertension-yes" className="peer sr-only" />
                    <Label
                      htmlFor="hypertension-yes"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.hypertension === "yes"
                          ? "border-orange-500 bg-orange-100"
                          : "border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <span className="font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="hypertension-no" className="peer sr-only" />
                    <Label
                      htmlFor="hypertension-no"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.hypertension === "no"
                          ? "border-orange-500 bg-orange-100"
                          : "border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <span className="font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Sleep Disorder */}
              <div className="space-y-3 p-5 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <Label className="text-base font-medium text-gray-900">
                  수면장애 진단 여부 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.sleepDisorder}
                  onValueChange={(value) => setFormData({ ...formData, sleepDisorder: value })}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="yes" id="sleep-yes" className="peer sr-only" />
                    <Label
                      htmlFor="sleep-yes"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.sleepDisorder === "yes"
                          ? "border-indigo-500 bg-indigo-100"
                          : "border-gray-200 hover:border-indigo-200"
                      }`}
                    >
                      <span className="font-medium">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="sleep-no" className="peer sr-only" />
                    <Label
                      htmlFor="sleep-no"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.sleepDisorder === "no"
                          ? "border-indigo-500 bg-indigo-100"
                          : "border-gray-200 hover:border-indigo-200"
                      }`}
                    >
                      <span className="font-medium">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
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
                  onClick={() => handleSaveSection("diagnosis")}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  저장
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
