import { useState } from "react";
import type React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Activity,
  Utensils,
  Droplet,
  Moon,
  Heart,
  Trophy,
  Plus,
  Smile,
  Dumbbell,
  Apple,
  Bed,
  Coffee,
  Bike,
} from "lucide-react";
import api from "../../../lib/api";
import type { Difficulty } from "../../types/challenges";

interface AddCustomChallengeButtonProps {
  onCreated: () => void;
}

export function AddCustomChallengeButton({ onCreated }: AddCustomChallengeButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const durationDays = parseInt(formData.duration);
    if (!formData.title || !formData.category || !durationDays) return;
    setSubmitting(true);
    try {
      await api.post("/api/v1/challenges/custom", {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration_days: durationDays,
      });
      setOpen(false);
      setFormData({ title: "", description: "", category: "", duration: "", difficulty: "초급" });
      setSelectedIcon("Activity");
      onCreated();
    } catch {
      // 오류 처리
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        나만의 챌린지
      </Button>

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
                <SelectItem value="7">7일</SelectItem>
                <SelectItem value="14">14일</SelectItem>
                <SelectItem value="21">21일</SelectItem>
                <SelectItem value="30">30일</SelectItem>
                <SelectItem value="60">60일</SelectItem>
                <SelectItem value="90">90일</SelectItem>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>취소</Button>
            <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" disabled={submitting}>
              {submitting ? "생성 중..." : "챌린지 만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
