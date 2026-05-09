// 월 네비게이션 바 — 이전/다음 월 이동 + 월 선택 모달 트리거
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { formatMonthYear } from "@/utils/date";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  onMonthChange: (date: Date) => void;
};

export function MonthNavBar({ currentMonth, onPrev, onNext, onMonthChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View className="flex-row items-center px-3 pb-1 gap-1">
      <Pressable onPress={onPrev} className="p-2">
        <ChevronLeft size={22} color="#e0e0e0" />
      </Pressable>
      <Pressable onPress={() => setShowPicker(true)} className="flex-1 items-center py-2">
        <Text className="text-white text-[18px] font-semibold">
          {formatMonthYear(currentMonth)}
        </Text>
      </Pressable>
      <Pressable onPress={onNext} className="p-2">
        <ChevronRight size={22} color="#e0e0e0" />
      </Pressable>

      <MonthPickerModal
        visible={showPicker}
        currentMonth={currentMonth}
        onSelect={(year, month) => {
          onMonthChange(new Date(year, month, 1));
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}
