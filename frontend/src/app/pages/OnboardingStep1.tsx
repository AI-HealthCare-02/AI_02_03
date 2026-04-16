import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { Activity, ArrowRight, Info, CalendarIcon } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ko } from "date-fns/locale";

type Gender = "남성" | "여성" | "";
type FattyLiverDiagnosis = "있음" | "없음" | "";

interface Step1Payload {
  fatty_liver_diagnosis: FattyLiverDiagnosis;
  age: number;
  gender: Exclude<Gender, "">;
  height: number;
  weight: number;
  waist: number | null;
  waist_unknown: boolean;
}

export function OnboardingStep1() {
  const navigate = useNavigate();

  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [waistUnknown, setWaistUnknown] = useState(false);
  const [formData, setFormData] = useState<{
    gender: Gender;
    height: string;
    weight: string;
    waist: string;
  }>({
    gender: "",
    height: "",
    weight: "",
    waist: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!birthDate) {
      newErrors.age = "생년월일을 선택해주세요";
    } else {
      const age = differenceInYears(new Date(), birthDate);
      if (age < 13 || age > 80) {
        newErrors.age = "나이는 13세에서 80세 사이로 입력해주세요";
      }
    }

    if (!formData.gender) {
      newErrors.gender = "성별을 선택해주세요";
    }

    const height = parseFloat(formData.height);
    if (!formData.height) {
      newErrors.height = "키를 입력해주세요";
    } else if (Number.isNaN(height) || height < 100 || height > 250) {
      newErrors.height = "키는 100cm에서 250cm 사이로 입력해주세요";
    }

    const weight = parseFloat(formData.weight);
    if (!formData.weight) {
      newErrors.weight = "몸무게를 입력해주세요";
    } else if (Number.isNaN(weight) || weight < 20 || weight > 300) {
      newErrors.weight = "몸무게는 20kg에서 300kg 사이로 입력해주세요";
    }

    if (!waistUnknown) {
      const waist = parseFloat(formData.waist);
      if (!formData.waist) {
        newErrors.waist = "허리둘레를 입력해주세요";
      } else if (Number.isNaN(waist) || waist < 40 || waist > 200) {
        newErrors.waist = "허리둘레는 40cm에서 200cm 사이로 입력해주세요";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNumberInput = (field: "height" | "weight" | "waist", value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !birthDate || !formData.gender) return;

    const fattyLiverDiagnosis = (sessionStorage.getItem("fatty_liver_diagnosis") || "") as FattyLiverDiagnosis;
    const age = differenceInYears(new Date(), birthDate);

    const step1Data: Step1Payload = {
      fatty_liver_diagnosis: fattyLiverDiagnosis,
      age,
      gender: formData.gender,
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
      waist: waistUnknown ? null : parseFloat(formData.waist),
      waist_unknown: waistUnknown,
    };

    sessionStorage.setItem("onboarding_step1", JSON.stringify(step1Data));
    navigate("/onboarding/step2");
  };

  const progressValue = (1 / 3) * 100;
  const calculatedAge = birthDate ? differenceInYears(new Date(), birthDate) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
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

        <Card className="border-2 border-emerald-100">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">진행 상황</p>
                  <p className="text-2xl font-bold text-emerald-600">Step 1 / 3</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">기본 정보</p>
                  <p className="text-xs text-gray-500">약 1분 소요</p>
                </div>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">기본 정보를 입력해주세요</CardTitle>
            <CardDescription className="text-base mt-2">
              건강 상태를 정확히 파악하기 위한 기본 정보입니다
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-medium text-gray-900">
                  생년월일 <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full h-12 justify-start text-left font-normal border-2 ${
                        errors.age ? "border-red-500" : ""
                      } ${!birthDate ? "text-gray-500" : ""}`}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {birthDate ? format(birthDate, "yyyy년 MM월 dd일", { locale: ko }) : "생년월일을 선택하세요"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      onSelect={(date) => {
                        setBirthDate(date);
                        if (errors.age) {
                          setErrors((prev) => ({
                            ...prev,
                            age: "",
                          }));
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      locale={ko}
                      defaultMonth={new Date(1995, 0)}
                    />
                  </PopoverContent>
                </Popover>

                {birthDate && calculatedAge !== null && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-900">
                      <span className="font-medium">만 나이:</span>{" "}
                      <span className="text-lg font-bold">{calculatedAge}세</span>
                    </p>
                  </div>
                )}

                {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium text-gray-900">
                  성별 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value: "남성" | "여성") => {
                    setFormData((prev) => ({
                      ...prev,
                      gender: value,
                    }));
                    if (errors.gender) {
                      setErrors((prev) => ({
                        ...prev,
                        gender: "",
                      }));
                    }
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="남성" id="male" className="peer sr-only" />
                    <Label
                      htmlFor="male"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.gender === "남성"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-lg font-medium">남성</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="여성" id="female" className="peer sr-only" />
                    <Label
                      htmlFor="female"
                      className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.gender === "여성"
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-lg font-medium">여성</span>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
              </div>

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
                    className={`h-12 text-lg border-2 pr-16 ${errors.height ? "border-red-500" : ""}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    cm
                  </div>
                </div>
                {errors.height && <p className="text-sm text-red-600">{errors.height}</p>}
              </div>

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
                    className={`h-12 text-lg border-2 pr-16 ${errors.weight ? "border-red-500" : ""}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    kg
                  </div>
                </div>
                {errors.weight && <p className="text-sm text-red-600">{errors.weight}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waist" className="text-base font-medium text-gray-900">
                  허리둘레 {!waistUnknown && <span className="text-red-500">*</span>}
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
                      errors.waist ? "border-red-500" : ""
                    } ${waistUnknown ? "bg-gray-100 text-gray-400" : ""}`}
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
                      const isChecked = !!checked;
                      setWaistUnknown(isChecked);

                      if (isChecked) {
                        setFormData((prev) => ({
                          ...prev,
                          waist: "",
                        }));
                        if (errors.waist) {
                          setErrors((prev) => ({
                            ...prev,
                            waist: "",
                          }));
                        }
                      }
                    }}
                  />
                  <Label htmlFor="waist-unknown" className="text-sm text-gray-600 cursor-pointer">
                    허리둘레를 모름
                  </Label>
                </div>

                {errors.waist && <p className="text-sm text-red-600">{errors.waist}</p>}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900">BMI 자동 계산 안내</p>
                    <p className="text-sm text-blue-700">
                      입력하신 키와 몸무게를 바탕으로 BMI(체질량지수)가 자동으로 계산됩니다.
                      별도로 입력하실 필요가 없습니다.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-medium mt-8"
              >
                다음 단계로
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          입력하신 정보는 건강 관리 목적으로만 사용되며 안전하게 보관됩니다
        </p>
      </div>
    </div>
  );
}