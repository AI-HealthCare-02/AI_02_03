import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Progress } from "../components/ui/progress";
import { Activity, ArrowRight, ArrowLeft, Info, Wine, Dumbbell, Cigarette, Moon, Utensils } from "lucide-react";

export function OnboardingStep2() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Alcohol
    drinksAlcohol: "",
    alcoholType: "",
    alcoholTypeOther: "",
    alcoholTypeOtherMultiple: [] as string[], // For multiple selections when "기타" is chosen
    drinkingFrequency: "",
    drinksPerSession: "",
    
    // Exercise
    exercises: "",
    exerciseFrequency: "",
    exerciseDuration: "",
    
    // Smoking
    smokes: "",
    cigarettesPerDay: "",
    
    // Sleep
    sleepHours: "",
    
    // Diet - 7 questions with 5-point scale
    dietQ1: "", // 하루에 채소를 충분히 먹는다
    dietQ2: "", // 단 음식이나 음료를 자주 먹는다
    dietQ3: "", // 튀김, 배달 음식, 패스트푸드를 자주 먹는다
    dietQ4: "", // 식사를 규칙적인 시간에 한다
    dietQ5: "", // 식사 시 과식하는 경우가 많다
    dietQ6: "", // 단백질을 충분히 먹는다
    dietQ7: "", // 야식을 자주 먹는다
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Alcohol validation
    if (!formData.drinksAlcohol) {
      newErrors.drinksAlcohol = "음주 여부를 선택해주세요";
    } else if (formData.drinksAlcohol === "yes") {
      if (!formData.alcoholType) {
        newErrors.alcoholType = "주종을 선택해주세요";
      }
      if (formData.alcoholType === "other" && !formData.alcoholTypeOther) {
        newErrors.alcoholTypeOther = "기타 주종을 입력해주세요";
      }
      if (!formData.drinkingFrequency) {
        newErrors.drinkingFrequency = "음주 횟수를 입력해주세요";
      }
      if (!formData.drinksPerSession) {
        newErrors.drinksPerSession = "잔 수를 입력해주세요";
      }
    }

    // Exercise validation
    if (!formData.exercises) {
      newErrors.exercises = "운동 여부를 선택해주세요";
    } else if (formData.exercises === "yes") {
      if (!formData.exerciseFrequency) {
        newErrors.exerciseFrequency = "운동 횟수를 입력해주세요";
      }
      if (!formData.exerciseDuration) {
        newErrors.exerciseDuration = "운동 시간을 입력해주세요";
      }
    }

    // Smoking validation
    if (!formData.smokes) {
      newErrors.smokes = "흡연 여부를 선택해주세요";
    } else if (formData.smokes === "yes") {
      if (!formData.cigarettesPerDay) {
        newErrors.cigarettesPerDay = "하루 흡연량을 입력해주세요";
      }
    }

    // Sleep validation
    const sleepHours = parseFloat(formData.sleepHours);
    if (!formData.sleepHours) {
      newErrors.sleepHours = "수면 시간을 입력해주세요";
    } else if (sleepHours < 0 || sleepHours > 24) {
      newErrors.sleepHours = "올바른 수면 시간을 입력해주세요 (0-24시간)";
    }

    // Diet validation - all 7 questions
    const dietQuestions = ["dietQ1", "dietQ2", "dietQ3", "dietQ4", "dietQ5", "dietQ6", "dietQ7"];
    const unanswered = dietQuestions.filter((q) => !formData[q as keyof typeof formData]);
    if (unanswered.length > 0) {
      newErrors.diet = "모든 식습관 문항에 응답해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const drinkTypeMap: Record<string, string> = { soju: "소주", beer: "맥주" };
      const step2Data = {
        drinking: formData.drinksAlcohol === "yes" ? "음주함" : "음주안함",
        drink_type:
          formData.drinksAlcohol === "yes"
            ? (drinkTypeMap[formData.alcoholType] ?? formData.alcoholTypeOther ?? "기타")
            : null,
        drink_amount: formData.drinksAlcohol === "yes" ? parseFloat(formData.drinksPerSession) : 0,
        weekly_drink_freq: formData.drinksAlcohol === "yes" ? parseFloat(formData.drinkingFrequency) : 0,
        exercise: formData.exercises === "yes" ? "운동함" : "운동안함",
        weekly_exercise_count: formData.exercises === "yes" ? parseInt(formData.exerciseFrequency) : 0,
        smoking:
          formData.smokes === "yes" ? "현재흡연" : formData.smokes === "past" ? "과거흡연" : "비흡연",
        current_smoking: formData.smokes === "yes" ? `${formData.cigarettesPerDay}개비` : "안함",
        sleep_hours: parseFloat(formData.sleepHours),
        diet_questions: ["dietQ1", "dietQ2", "dietQ3", "dietQ4", "dietQ5", "dietQ6", "dietQ7"].map((q) =>
          parseInt(formData[q as keyof typeof formData] as string)
        ),
      };
      sessionStorage.setItem("onboarding_step2", JSON.stringify(step2Data));
      navigate("/onboarding/step3");
    }
  };

  const handlePrevious = () => {
    navigate("/onboarding/step1");
  };

  const handleNumberInput = (field: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, [field]: value });
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
      }
    }
  };

  const progressValue = (2 / 3) * 100;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-3">
            <div className="size-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="size-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">간(肝)편한 하루</h1>
            <p className="text-sm text-gray-600 mt-1">건강 관리의 첫 걸음을 시작해요</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <Card className="border-2 border-emerald-100">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">진행 상황</p>
                  <p className="text-2xl font-bold text-emerald-600">Step 2 / 3</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">생활습관 정보</p>
                  <p className="text-xs text-gray-500">약 3분 소요</p>
                </div>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Main Form Card */}
        <Card className="border-2 border-emerald-100 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">생활습관 정보를 입력해주세요</CardTitle>
            <CardDescription className="text-base mt-2">
              건강한 간을 위한 생활습관을 파악합니다
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
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
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      drinksAlcohol: value,
                      // Clear alcohol-related fields if "no" is selected
                      ...(value === "no" && {
                        alcoholType: "",
                        alcoholTypeOther: "",
                        drinkingFrequency: "",
                        drinksPerSession: "",
                      })
                    });
                    if (errors.drinksAlcohol) {
                      setErrors({ ...errors, drinksAlcohol: "" });
                    }
                  }}
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
                {errors.drinksAlcohol && (
                  <p className="text-sm text-red-600">{errors.drinksAlcohol}</p>
                )}

                {/* Conditional Alcohol Details */}
                {formData.drinksAlcohol === "yes" && (
                  <div className="space-y-4 mt-4 pl-4 border-l-4 border-purple-300">
                    {/* Alcohol Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        주로 드시는 주종 <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.alcoholType}
                        onValueChange={(value) => {
                          setFormData({ 
                            ...formData, 
                            alcoholType: value,
                            ...(value !== "other" && { alcoholTypeOther: "" })
                          });
                          if (errors.alcoholType) {
                            setErrors({ ...errors, alcoholType: "" });
                          }
                        }}
                        className="grid grid-cols-3 gap-3"
                      >
                        <div>
                          <RadioGroupItem value="soju" id="alcohol-soju" className="peer sr-only" />
                          <Label
                            htmlFor="alcohol-soju"
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.alcoholType === "soju"
                                ? "border-purple-500 bg-purple-100"
                                : "border-gray-200 hover:border-purple-200"
                            }`}
                          >
                            <span className="font-medium">소주</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="beer" id="alcohol-beer" className="peer sr-only" />
                          <Label
                            htmlFor="alcohol-beer"
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.alcoholType === "beer"
                                ? "border-purple-500 bg-purple-100"
                                : "border-gray-200 hover:border-purple-200"
                            }`}
                          >
                            <span className="font-medium">맥주</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="other" id="alcohol-other" className="peer sr-only" />
                          <Label
                            htmlFor="alcohol-other"
                            className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              formData.alcoholType === "other"
                                ? "border-purple-500 bg-purple-100"
                                : "border-gray-200 hover:border-purple-200"
                            }`}
                          >
                            <span className="font-medium">기타</span>
                          </Label>
                        </div>
                      </RadioGroup>
                      {errors.alcoholType && (
                        <p className="text-sm text-red-600">{errors.alcoholType}</p>
                      )}

                      {/* Other alcohol type input */}
                      {formData.alcoholType === "other" && (
                        <div className="space-y-3 mt-3 animate-in slide-in-from-top-4 duration-300">
                          <Label className="text-sm font-medium text-purple-700">
                            주로 드시는 주종을 선택해주세요 (여러 개 선택 가능)
                          </Label>
                          
                          {/* Horizontal Scrollable Alcohol Type Selection */}
                          <div className="relative">
                            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-50">
                              {[
                                { value: "wine", label: "와인", emoji: "🍷" },
                                { value: "makgeolli", label: "막걸리", emoji: "🍶" },
                                { value: "whiskey", label: "위스키", emoji: "🥃" },
                                { value: "sake", label: "청주/사케", emoji: "🍶" },
                                { value: "cocktail", label: "칵테일", emoji: "🍹" },
                                { value: "champagne", label: "샴페인", emoji: "🍾" },
                                { value: "liquor", label: "고량주", emoji: "🥃" },
                                { value: "fruit", label: "과일주", emoji: "🍇" },
                              ].map((type) => {
                                const isSelected = formData.alcoholTypeOtherMultiple.includes(type.value);
                                return (
                                  <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => {
                                      const current = formData.alcoholTypeOtherMultiple;
                                      const updated = isSelected
                                        ? current.filter((t) => t !== type.value)
                                        : [...current, type.value];
                                      setFormData({
                                        ...formData,
                                        alcoholTypeOtherMultiple: updated,
                                        alcoholTypeOther: updated.join(", "),
                                      });
                                      if (errors.alcoholTypeOther) {
                                        setErrors({ ...errors, alcoholTypeOther: "" });
                                      }
                                    }}
                                    className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[100px] ${
                                      isSelected
                                        ? "border-purple-500 bg-purple-100 shadow-md scale-105"
                                        : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50"
                                    }`}
                                  >
                                    <span className="text-3xl">{type.emoji}</span>
                                    <span className={`text-sm font-medium ${
                                      isSelected ? "text-purple-700" : "text-gray-700"
                                    }`}>
                                      {type.label}
                                    </span>
                                    {isSelected && (
                                      <div className="absolute top-2 right-2 size-5 bg-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Selected Count */}
                          {formData.alcoholTypeOtherMultiple.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <Info className="size-4 text-purple-600 flex-shrink-0" />
                              <p className="text-sm text-purple-700">
                                선택한 주종: <strong>{formData.alcoholTypeOtherMultiple.length}개</strong>
                              </p>
                            </div>
                          )}

                          {errors.alcoholTypeOther && (
                            <p className="text-sm text-red-600">{errors.alcoholTypeOther}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Drinking Frequency */}
                    <div className="space-y-2">
                      <Label htmlFor="drinking-frequency" className="text-sm font-medium">
                        주당 음주 횟수 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="drinking-frequency"
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 2"
                          value={formData.drinkingFrequency}
                          onChange={(e) => handleNumberInput("drinkingFrequency", e.target.value)}
                          className={`h-11 border-2 pr-20 ${errors.drinkingFrequency ? "border-red-500" : ""}`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          회/주
                        </div>
                      </div>
                      {errors.drinkingFrequency && (
                        <p className="text-sm text-red-600">{errors.drinkingFrequency}</p>
                      )}
                    </div>

                    {/* Drinks Per Session */}
                    <div className="space-y-2">
                      <Label htmlFor="drinks-per-session" className="text-sm font-medium">
                        1회 평균 음주량 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="drinks-per-session"
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 3"
                          value={formData.drinksPerSession}
                          onChange={(e) => handleNumberInput("drinksPerSession", e.target.value)}
                          className={`h-11 border-2 pr-16 ${errors.drinksPerSession ? "border-red-500" : ""}`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          잔
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">소주 1잔(50ml) 기준</p>
                      {errors.drinksPerSession && (
                        <p className="text-sm text-red-600">{errors.drinksPerSession}</p>
                      )}
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
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      exercises: value,
                      ...(value === "no" && {
                        exerciseFrequency: "",
                        exerciseDuration: "",
                      })
                    });
                    if (errors.exercises) {
                      setErrors({ ...errors, exercises: "" });
                    }
                  }}
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
                {errors.exercises && (
                  <p className="text-sm text-red-600">{errors.exercises}</p>
                )}

                {/* Conditional Exercise Details */}
                {formData.exercises === "yes" && (
                  <div className="space-y-4 mt-4 pl-4 border-l-4 border-blue-300">
                    {/* Exercise Frequency */}
                    <div className="space-y-2">
                      <Label htmlFor="exercise-frequency" className="text-sm font-medium">
                        주당 운동 횟수 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="exercise-frequency"
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 3"
                          value={formData.exerciseFrequency}
                          onChange={(e) => handleNumberInput("exerciseFrequency", e.target.value)}
                          className={`h-11 border-2 pr-20 ${errors.exerciseFrequency ? "border-red-500" : ""}`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          회/주
                        </div>
                      </div>
                      {errors.exerciseFrequency && (
                        <p className="text-sm text-red-600">{errors.exerciseFrequency}</p>
                      )}
                    </div>

                    {/* Exercise Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="exercise-duration" className="text-sm font-medium">
                        1회 평균 운동 시간 <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="exercise-duration"
                          type="text"
                          inputMode="numeric"
                          placeholder="예) 30"
                          value={formData.exerciseDuration}
                          onChange={(e) => handleNumberInput("exerciseDuration", e.target.value)}
                          className={`h-11 border-2 pr-16 ${errors.exerciseDuration ? "border-red-500" : ""}`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          분
                        </div>
                      </div>
                      {errors.exerciseDuration && (
                        <p className="text-sm text-red-600">{errors.exerciseDuration}</p>
                      )}
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
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      smokes: value,
                      ...(value !== "yes" && { cigarettesPerDay: "" })
                    });
                    if (errors.smokes) {
                      setErrors({ ...errors, smokes: "" });
                    }
                  }}
                  className="grid grid-cols-3 gap-3"
                >
                  <div>
                    <RadioGroupItem value="yes" id="smoke-yes" className="peer sr-only" />
                    <Label
                      htmlFor="smoke-yes"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.smokes === "yes"
                          ? "border-gray-500 bg-gray-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-sm">예</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="past" id="smoke-past" className="peer sr-only" />
                    <Label
                      htmlFor="smoke-past"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.smokes === "past"
                          ? "border-gray-500 bg-gray-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-sm">과거 흡연</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="no" id="smoke-no" className="peer sr-only" />
                    <Label
                      htmlFor="smoke-no"
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.smokes === "no"
                          ? "border-gray-500 bg-gray-100"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="font-medium text-sm">아니오</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.smokes && (
                  <p className="text-sm text-red-600">{errors.smokes}</p>
                )}

                {/* Conditional Smoking Details */}
                {formData.smokes === "yes" && (
                  <div className="space-y-2 mt-4 pl-4 border-l-4 border-gray-300">
                    <Label htmlFor="cigarettes-per-day" className="text-sm font-medium">
                      하루 평균 흡연량 <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="cigarettes-per-day"
                        type="text"
                        inputMode="numeric"
                        placeholder="예) 10"
                        value={formData.cigarettesPerDay}
                        onChange={(e) => handleNumberInput("cigarettesPerDay", e.target.value)}
                        className={`h-11 border-2 pr-20 ${errors.cigarettesPerDay ? "border-red-500" : ""}`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                        개비
                      </div>
                    </div>
                    {errors.cigarettesPerDay && (
                      <p className="text-sm text-red-600">{errors.cigarettesPerDay}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Sleep Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="size-5 text-indigo-600" />
                  <Label htmlFor="sleep-hours" className="text-base font-medium text-gray-900">
                    평균 수면 시간 <span className="text-red-500">*</span>
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="sleep-hours"
                    type="text"
                    inputMode="decimal"
                    placeholder="예) 7"
                    value={formData.sleepHours}
                    onChange={(e) => handleNumberInput("sleepHours", e.target.value)}
                    className={`h-12 text-lg border-2 pr-20 ${errors.sleepHours ? "border-red-500" : ""}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    시간
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="size-3" />
                  하루 평균 수면 시간을 입력해주세요
                </p>
                {errors.sleepHours && (
                  <p className="text-sm text-red-600">{errors.sleepHours}</p>
                )}
              </div>

              {/* Diet Section - 7 Questions */}
              <div className="space-y-6 p-5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="size-5 text-emerald-600" />
                  <Label className="text-base font-medium text-gray-900">
                    식습관 평가 <span className="text-red-500">*</span>
                  </Label>
                </div>
                <p className="text-sm text-gray-600">
                  각 문항에 대해 본인에게 해당하는 정도를 선택해주세요
                </p>

                {dietQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-3 p-4 bg-white rounded-lg border border-emerald-100">
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}. {question.text}
                    </p>
                    <RadioGroup
                      value={formData[question.id as keyof typeof formData] as string}
                      onValueChange={(value) => {
                        setFormData({ ...formData, [question.id]: value });
                        if (errors.diet) {
                          setErrors({ ...errors, diet: "" });
                        }
                      }}
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
                            className={`flex items-center justify-center p-2 border-2 rounded-lg cursor-pointer transition-all text-center min-h-[60px] ${
                              formData[question.id as keyof typeof formData] === option.value
                                ? "border-emerald-500 bg-emerald-100"
                                : "border-gray-200 hover:border-emerald-200"
                            }`}
                          >
                            <span className="text-xs font-medium whitespace-pre-line leading-tight">
                              {option.label}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}

                {errors.diet && (
                  <p className="text-sm text-red-600">{errors.diet}</p>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="h-14 text-base border-2"
                >
                  <ArrowLeft className="size-5 mr-2" />
                  이전 단계
                </Button>
                <Button
                  type="submit"
                  className="h-14 text-base bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-medium"
                >
                  다음 단계
                  <ArrowRight className="size-5 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          정확한 입력이 건강 관리에 도움이 됩니다
        </p>
      </div>
    </div>
  );
}