// 연도·월 선택 모달 컴포넌트
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

interface Props {
  visible: boolean;
  currentMonth: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

export function MonthPickerModal({
  visible,
  currentMonth,
  onSelect,
  onClose,
}: Props) {
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());

  useEffect(() => {
    if (visible) setPickerYear(currentMonth.getFullYear());
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
      >
        <Pressable className="bg-app-surface rounded-[16px] w-72 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Pressable
              onPress={() => setPickerYear((y) => y - 1)}
              className="p-2"
            >
              <ChevronLeft size={20} color="#e0e0e0" />
            </Pressable>
            <Text className="text-white text-base font-semibold">
              {pickerYear}년
            </Text>
            <Pressable
              onPress={() => setPickerYear((y) => y + 1)}
              className="p-2"
            >
              <ChevronRight size={20} color="#e0e0e0" />
            </Pressable>
          </View>
          <View className="px-4 pb-4">
            <VStack space="sm">
              {([0, 3, 6, 9] as const).map((start) => (
                <HStack key={start} className="gap-2">
                  {[0, 1, 2, 3].map((offset) => {
                    const m = start + offset;
                    const isCurrent =
                      pickerYear === currentMonth.getFullYear() &&
                      m === currentMonth.getMonth();
                    return (
                      <Pressable
                        key={m}
                        onPress={() => onSelect(pickerYear, m)}
                        className={`flex-1 rounded-[10px] py-2 items-center ${isCurrent ? "bg-app-teal" : "bg-app-bg"}`}
                      >
                        <Text
                          className={`text-[13px] font-semibold ${isCurrent ? "text-[#111]" : "text-white"}`}
                        >
                          {m + 1}월
                        </Text>
                      </Pressable>
                    );
                  })}
                </HStack>
              ))}
            </VStack>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
