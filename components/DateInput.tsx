// 날짜 입력 필드 컴포넌트 — field(폼 필드) / compact(인라인) 두 가지 형태
import { formatLogDate } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { DateData } from "react-native-calendars";
import { Calendar as RNCalendar, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales["ko"] = {
  monthNames: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  monthNamesShort: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  dayNames: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
  dayNamesShort: ["일","월","화","수","목","금","토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "ko";

const CALENDAR_THEME = {
  backgroundColor: "transparent",
  calendarBackground: "transparent",
  textSectionTitleColor: "#888888",
  selectedDayBackgroundColor: "#4ECDC4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ECDC4",
  todayBackgroundColor: "#1a3a3a",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#444444",
  dotColor: "#4ECDC4",
  selectedDotColor: "#111111",
  arrowColor: "#4ECDC4",
  disabledArrowColor: "#444444",
  monthTextColor: "#ffffff",
  indicatorColor: "#4ECDC4",
  textDayFontSize: 14,
  textMonthFontSize: 15,
  textDayHeaderFontSize: 11,
};

interface DateInputProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  defaultValue?: Date;
  variant?: "field" | "compact";
  className?: string;
}

export function DateInput({
  value,
  onChange,
  onClear,
  label,
  placeholder = "날짜 선택",
  defaultValue,
  variant = "field",
  className,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerValue = value ?? defaultValue ?? new Date();
  const selectedDateStr = value ? dayjs(value).format("YYYY-MM-DD") : undefined;

  function handleDayPress(day: DateData) {
    onChange(new Date(day.dateString));
    setShowPicker(false);
  }

  const calendarModal = (
    <Modal
      visible={showPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPicker(false)}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", paddingHorizontal: 16 }}
        onPress={() => setShowPicker(false)}
      >
        <View
          style={{ backgroundColor: "#1a1a1a", borderRadius: 16, padding: 16 }}
          onStartShouldSetResponder={() => true}
        >
          <RNCalendar
            theme={CALENDAR_THEME}
            current={dayjs(pickerValue).format("YYYY-MM-DD")}
            onDayPress={handleDayPress}
            markedDates={
              selectedDateStr
                ? { [selectedDateStr]: { selected: true, selectedColor: "#4ECDC4" } }
                : {}
            }
          />
        </View>
      </Pressable>
    </Modal>
  );

  if (variant === "compact") {
    return (
      <>
        <Pressable
          onPress={() => setShowPicker(true)}
          className="flex-1 bg-[#1a1a1a] rounded-[8px] px-2 py-1.5"
        >
          <Text className={cn("text-[13px]", value ? "text-[#ccc]" : "text-[#555]")}>
            {value ? dayjs(value).format("YYYY.MM.DD") : placeholder}
          </Text>
        </Pressable>
        {calendarModal}
      </>
    );
  }

  return (
    <View className={className}>
      {label && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-app-label text-[13px]">{label}</Text>
          {onClear && value && (
            <Pressable onPress={onClear} hitSlop={8}>
              <Text className="text-app-muted text-[12px]">지우기</Text>
            </Pressable>
          )}
        </View>
      )}
      <Pressable
        onPress={() => setShowPicker(true)}
        className="bg-app-surface rounded-[10px] p-3 flex-row items-center justify-between"
      >
        <Text className={cn("text-sm", value ? "text-white" : "text-[#555]")}>
          {value ? formatLogDate(value) : placeholder}
        </Text>
        <Calendar size={18} color="#4ecdc4" />
      </Pressable>
      {calendarModal}
    </View>
  );
}
