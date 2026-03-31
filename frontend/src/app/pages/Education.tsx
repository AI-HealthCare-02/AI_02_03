import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { 
  AlertCircle, 
  Activity, 
  Utensils, 
  Apple,
  Ban,
  CheckCircle,
  Info,
  TrendingDown
} from "lucide-react";

export function Education() {
  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">건강 정보</h2>
        <p className="text-gray-600">지방간 예방과 관리에 필요한 정보를 확인하세요</p>
      </div>

      {/* What is Fatty Liver */}
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-5 text-amber-600" />
            지방간이란?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            지방간은 간 세포에 지방이 비정상적으로 축적되는 질환입니다. 
            간 무게의 5% 이상이 지방으로 차 있을 때 지방간으로 진단됩니다.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <h4 className="font-medium text-gray-900 mb-2">주요 원인</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>비만 및 과체중</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>과도한 음주</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>당뇨병</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>고지혈증</span>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-lg border border-amber-200">
              <h4 className="font-medium text-gray-900 mb-2">증상</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>초기에는 특별한 증상이 없음</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>피로감, 무기력</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>오른쪽 상복부 불편감</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>소화불량</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prevention & Management */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="size-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
              <Activity className="size-6 text-emerald-600" />
            </div>
            <CardTitle>운동</CardTitle>
            <CardDescription>규칙적인 신체 활동</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>주 150분 이상 유산소 운동</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>주 2-3회 근력 운동</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>일상 활동량 늘리기</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>걷기, 수영, 자전거 등</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader>
            <div className="size-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <Utensils className="size-6 text-blue-600" />
            </div>
            <CardTitle>식습관</CardTitle>
            <CardDescription>건강한 식단 관리</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>균형 잡힌 영양소 섭취</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>채소와 과일 충분히 섭취</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>통곡물 선택하기</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>건강한 지방 섭취</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <div className="size-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <TrendingDown className="size-6 text-purple-600" />
            </div>
            <CardTitle>체중 관리</CardTitle>
            <CardDescription>건강한 체중 유지</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>체중의 5-10% 감량 목표</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>급격한 감량 피하기</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>적절한 칼로리 조절</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="size-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <span>장기적인 접근 방식</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Foods */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="size-5 text-green-600" />
              권장 식품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FoodCategory 
                title="채소류" 
                items={["브로콜리", "시금치", "양배추", "토마토", "당근"]}
                color="green"
              />
              <FoodCategory 
                title="과일류" 
                items={["베리류", "사과", "바나나", "오렌지"]}
                color="green"
              />
              <FoodCategory 
                title="단백질" 
                items={["닭가슴살", "생선", "두부", "콩", "달걀"]}
                color="green"
              />
              <FoodCategory 
                title="건강한 지방" 
                items={["아보카도", "견과류", "올리브오일", "등푸른 생선"]}
                color="green"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="size-5 text-red-600" />
              제한 식품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <FoodCategory 
                title="당류" 
                items={["설탕", "사탕", "탄산음료", "과자", "케이크"]}
                color="red"
              />
              <FoodCategory 
                title="정제 탄수화물" 
                items={["흰 빵", "흰 쌀", "라면", "빵류"]}
                color="red"
              />
              <FoodCategory 
                title="포화지방" 
                items={["튀김", "가공육", "버터", "마가린"]}
                color="red"
              />
              <FoodCategory 
                title="알코올" 
                items={["소주", "맥주", "와인", "모든 주류"]}
                color="red"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-blue-600" />
            자주 묻는 질문
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>지방간은 완치가 가능한가요?</AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed">
                네, 가능합니다. 비알코올성 지방간의 경우 체중 감량, 운동, 식습관 개선 등 생활습관 교정을 통해 
                충분히 호전될 수 있습니다. 체중의 5-10% 감량만으로도 간 지방이 크게 감소할 수 있습니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>지방간에 좋은 운동은 무엇인가요?</AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed">
                유산소 운동이 가장 효과적입니다. 빠르게 걷기, 조깅, 수영, 자전거 타기 등을 주 150분 이상 
                실천하는 것이 좋습니다. 또한 근력 운동을 병행하면 더욱 효과적입니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>지방간이 있으면 간암으로 발전하나요?</AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed">
                지방간이 간염, 간경화로 진행될 경우 간암의 위험이 증가할 수 있습니다. 
                하지만 조기에 발견하고 적절히 관리하면 진행을 막을 수 있으므로 정기적인 
                검진과 생활습관 개선이 중요합니다.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>얼마나 빨리 개선될 수 있나요?</AccordionTrigger>
              <AccordionContent className="text-gray-700 leading-relaxed">
                개인차가 있지만, 체중 감량과 운동을 꾸준히 실천하면 3-6개월 내에 간 수치가 
                개선되는 것을 확인할 수 있습니다. 지속적인 관리가 중요합니다.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function FoodCategory({ 
  title, 
  items, 
  color 
}: { 
  title: string; 
  items: string[];
  color: "green" | "red";
}) {
  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge 
            key={item} 
            variant="outline" 
            className={color === "green" ? "border-green-300" : "border-red-300"}
          >
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
