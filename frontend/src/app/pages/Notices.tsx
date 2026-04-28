import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Megaphone } from "lucide-react";

const NOTICES = [
  {
    id: 1,
    title: "간(肝)편한 하루 서비스 오픈 안내",
    date: "2026-04-01",
    content:
      "안녕하세요. 간(肝)편한 하루 서비스가 정식 오픈되었습니다. 지방간 위험도 예측 및 건강 챌린지 기능을 통해 건강한 생활 습관을 만들어 보세요.",
  },
  {
    id: 2,
    title: "AI 건강 예측 기능 업데이트",
    date: "2026-04-10",
    content:
      "AI 기반 지방간 위험도 예측 모델이 업데이트되었습니다. 더 정확한 분석과 맞춤형 챌린지 추천을 경험해보세요.",
  },
  {
    id: 3,
    title: "식단 분석 기능 추가",
    date: "2026-04-20",
    content:
      "음식 사진을 촬영하면 AI가 영양 성분을 분석해드리는 식단 기록 기능이 추가되었습니다. 지방간에 미치는 영향도 함께 확인하세요.",
  },
];

export function Notices() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/mypage/settings")}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
          <p className="text-sm text-gray-600">서비스 공지 및 업데이트 소식</p>
        </div>
      </div>

      {NOTICES.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Megaphone className="size-12 mb-3" />
          <p>등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...NOTICES].reverse().map((notice) => (
            <Card key={notice.id} className="border border-gray-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <p className="font-semibold text-gray-900">{notice.title}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{notice.date}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{notice.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
