import { useState } from "react";
import api from "../../../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Clock, Pill, Plus, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { Medication } from "./types";

const medicationDatabase = [
  // 간 기능 개선
  "우루사", "밀크씨슬", "실리마린", "레가론", "헤파메르츠",
  "고덱스", "리버스", "실리빈", "인사돌",
  // 항산화 / 보조
  "비타민E", "비타민C", "글루타치온", "NAC", "알파리포산",
  // 지방간 보조
  "오메가3", "코엔자임Q10", "타우린", "아르기닌", "메티오닌",
  // 일반 영양제
  "종근당 락토핏", "프로바이오틱스", "비오틴", "마그네슘", "아연",
  // 일반 의약품
  "타이레놀", "이부프로펜", "게보린", "판콜",
];

function getRecommendedTimes(frequency: string, timing: string): string[] {
  if (timing === "취침 전") return ["22:00"];
  const timeMap: { [key: number]: string[] } = {
    1: ["08:00"],
    2: ["08:00", "18:00"],
    3: ["08:00", "12:00", "18:00"],
    4: ["08:00", "12:00", "18:00", "22:00"],
  };
  return timeMap[parseInt(frequency, 10)] || [];
}

interface Props {
  medications: Medication[];
  onRefresh: () => void;
}

export function MedicationSection({ medications, onRefresh }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [medicationNameInput, setMedicationNameInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: "",
    frequency: "1",
    timing: "상관없음",
    times: [] as string[],
  });

  const filteredMedications = medicationDatabase.filter((med) =>
    med.toLowerCase().includes(medicationNameInput.toLowerCase())
  );

  const openForm = () => {
    setNewMedication({ name: "", frequency: "1", timing: "상관없음", times: getRecommendedTimes("1", "상관없음") });
    setMedicationNameInput("");
    setShowSuggestions(false);
    setIsAdding(true);
  };

  const closeForm = () => {
    setNewMedication({ name: "", frequency: "1", timing: "상관없음", times: [] });
    setMedicationNameInput("");
    setShowSuggestions(false);
    setIsAdding(false);
  };

  const handleFrequencyChange = (frequency: string) => {
    setNewMedication((prev) => ({ ...prev, frequency, times: getRecommendedTimes(frequency, prev.timing) }));
  };

  const handleTimingChange = (timing: string) => {
    setNewMedication((prev) => ({ ...prev, timing, times: getRecommendedTimes(prev.frequency, timing) }));
  };

  const handleTimeChange = (index: number, newTime: string) => {
    setNewMedication((prev) => {
      const updatedTimes = [...prev.times];
      updatedTimes[index] = newTime;
      return { ...prev, times: updatedTimes };
    });
  };

  const handleNameSelect = (name: string) => {
    setMedicationNameInput(name);
    setNewMedication((prev) => ({ ...prev, name }));
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    const trimmedName = newMedication.name.trim();
    if (!trimmedName || newMedication.times.length === 0) {
      alert("약 이름과 복용 시간을 입력해주세요");
      return;
    }
    await api.post("/api/v1/medications", {
      name: trimmedName,
      dosage: "1정",
      times: newMedication.times,
    });
    closeForm();
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/api/v1/medications/${id}`);
    onRefresh();
  };

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader
        className="cursor-pointer hover:bg-purple-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="size-5 text-purple-600" />
            <CardTitle>복약 관리</CardTitle>
          </div>
          <Button variant="ghost" size="icon">
            {isOpen ? <ChevronUp className="size-5 text-gray-600" /> : <ChevronDown className="size-5 text-gray-600" />}
          </Button>
        </div>
        <CardDescription>복용 중인 약과 복용 시간을 관리하세요</CardDescription>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 border-t">
          {isAdding && (
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-gray-900">복약 추가</p>
                <Button variant="ghost" size="sm" onClick={closeForm} className="text-gray-500 hover:text-gray-700">
                  취소
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="med-name">약 이름</Label>
                  <Input
                    id="med-name"
                    placeholder="약 이름을 검색하세요"
                    value={medicationNameInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMedicationNameInput(value);
                      setNewMedication((prev) => ({ ...prev, name: value }));
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="border-2"
                  />
                  {showSuggestions && medicationNameInput && filteredMedications.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border-2 border-purple-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {filteredMedications.map((med, idx) => (
                        <button
                          type="button"
                          key={idx}
                          className="w-full text-left px-4 py-2 hover:bg-purple-50 transition-colors"
                          onClick={() => handleNameSelect(med)}
                        >
                          {med}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>복용 횟수</Label>
                  <Select
                    value={newMedication.frequency}
                    onValueChange={handleFrequencyChange}
                    disabled={newMedication.timing === "취침 전"}
                  >
                    <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">하루 1번</SelectItem>
                      <SelectItem value="2">하루 2번</SelectItem>
                      <SelectItem value="3">하루 3번</SelectItem>
                      <SelectItem value="4">하루 4번</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>복용 시점</Label>
                  <Select value={newMedication.timing} onValueChange={handleTimingChange}>
                    <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="식전">식전</SelectItem>
                      <SelectItem value="식후">식후</SelectItem>
                      <SelectItem value="취침 전">취침 전</SelectItem>
                      <SelectItem value="상관없음">상관없음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>복용 시간</Label>
                  <div className="space-y-2">
                    {newMedication.times.length > 0 ? (
                      newMedication.times.map((time, idx) => (
                        <Popover key={idx}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal border-2">
                              <Clock className="mr-2 size-4" />
                              {time || "시간 선택"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">시간 선택</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">시</Label>
                                  <Select
                                    value={time.split(":")[0]}
                                    onValueChange={(hour) =>
                                      handleTimeChange(idx, `${hour}:${time.split(":")[1] || "00"}`)
                                    }
                                  >
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                        <SelectItem key={hour} value={hour.toString().padStart(2, "0")}>
                                          {hour.toString().padStart(2, "0")}시
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">분</Label>
                                  <Select
                                    value={time.split(":")[1] || "00"}
                                    onValueChange={(minute) =>
                                      handleTimeChange(idx, `${time.split(":")[0]}:${minute}`)
                                    }
                                  >
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {["00", "10", "20", "30", "40", "50"].map((minute) => (
                                        <SelectItem key={minute} value={minute}>{minute}분</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-3 bg-white border-2 border-purple-200 rounded-lg">
                        복용 횟수와 시점을 선택하면 추천 시간이 표시됩니다
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                onClick={handleSave}
              >
                <Check className="size-4 mr-2" />
                저장
              </Button>
            </div>
          )}
          {!isAdding && (
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={openForm}
            >
              <Plus className="size-4 mr-2" />
              복약 추가
            </Button>
          )}
          <div className="space-y-3">
            <p className="font-medium text-gray-900">현재 복용 중인 약</p>
            {medications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">등록된 약이 없습니다</p>
            ) : (
              medications.map((med) => (
                <Card key={med.id} className="border border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="size-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Pill className="size-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600">하루 {med.times.length}회 복용</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(med.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        삭제
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {med.times.map((time, idx) => (
                        <div key={idx} className="p-3 rounded-lg border-2 bg-gray-50 border-gray-200">
                          <div className="flex items-center gap-2">
                            <Clock className="size-4 text-gray-600" />
                            <span className="text-sm font-medium">{time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
