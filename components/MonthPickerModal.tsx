// 연도별 월 선택 모달 — 12개 미니 캘린더 스크롤로 월 선택
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

const WEEKDAYS_SHORT = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  visible: boolean;
  currentMonth: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

function MiniCalendar({ year, month }: { year: number; month: number }) {
  const start = dayjs(new Date(year, month, 1));
  const daysInMonth = start.daysInMonth();
  const startDow = start.day();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = new Date();
  const todayDate =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

  return (
    <View>
      <View className="flex-row">
        {WEEKDAYS_SHORT.map((d, i) => (
          <Text
            key={d}
            className={cn(
              "flex-1 text-center text-[9px]",
              i === 0 ? "text-[#ff6b6b]" : i === 6 ? "text-[#4ecdc4]" : "text-[#555]",
            )}
          >
            {d}
          </Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, di) => (
            <View key={di} className="flex-1 items-center py-[1px]">
              {day !== null && (
                <View
                  className={cn(
                    "w-[15px] h-[15px] rounded-[8px] items-center justify-center",
                    day === todayDate ? "bg-[#4ecdc4]" : "bg-transparent",
                  )}
                >
                  <Text
                    className={cn(
                      "text-[10px]",
                      day === todayDate
                        ? "text-[#111]"
                        : di === 0
                          ? "text-[#ff6b6b]"
                          : di === 6
                            ? "text-[#4ecdc4]"
                            : "text-[#bbb]",
                    )}
                  >
                    {day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-[#111]">
        <SafeAreaView className="bg-[#111]">
          <View className="flex-row items-center justify-between px-4 pb-3 pt-10 border-b border-[#222]">
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color="#e0e0e0" />
            </Pressable>
            <View className="flex-row items-center gap-5">
              <Pressable
                onPress={() => setPickerYear((y) => y - 1)}
                hitSlop={8}
              >
                <ChevronLeft size={20} color="#e0e0e0" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">
                {pickerYear}년
              </Text>
              <Pressable
                onPress={() => setPickerYear((y) => y + 1)}
                hitSlop={8}
              >
                <ChevronRight size={20} color="#e0e0e0" />
              </Pressable>
            </View>
            <View className="w-[22px]" />
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={{ padding: 12, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {[0, 2, 4, 6, 8, 10].map((startMonth) => (
            <View key={startMonth} className="flex-row gap-3">
              {[startMonth, startMonth + 1].map((m) => {
                const isSelected =
                  pickerYear === currentMonth.getFullYear() &&
                  m === currentMonth.getMonth();
                return (
                  <Pressable
                    key={m}
                    onPress={() => onSelect(pickerYear, m)}
                    className={cn(
                      "flex-1 bg-[#1a1a1a] rounded-[12px] p-[10px]",
                      isSelected && "border-[1.5px] border-[#4ecdc4]",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[13px] font-semibold text-center mb-1.5",
                        isSelected ? "text-[#4ecdc4]" : "text-white",
                      )}
                    >
                      {m + 1}월
                    </Text>
                    <MiniCalendar year={pickerYear} month={m} />
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
