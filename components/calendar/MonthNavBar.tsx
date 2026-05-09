// 월 네비게이션 바 — 이전/다음 월 이동 + 월 선택 모달 트리거
import { formatMonthYear } from "@/utils/date";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  onPickerOpen: () => void;
};

export function MonthNavBar({ currentMonth, onPrev, onNext, onPickerOpen }: Props) {
  return (
    <View className="flex-row items-center px-3 pb-1 gap-1">
      <Pressable onPress={onPrev} className="p-2">
        <ChevronLeft size={22} color="#e0e0e0" />
      </Pressable>
      <Pressable onPress={onPickerOpen} className="flex-1 items-center py-2">
        <Text className="text-white text-[18px] font-semibold">
          {formatMonthYear(currentMonth)}
        </Text>
      </Pressable>
      <Pressable onPress={onNext} className="p-2">
        <ChevronRight size={22} color="#e0e0e0" />
      </Pressable>
    </View>
  );
}
