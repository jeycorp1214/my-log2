// 생년월일 스마트 입력 컴포넌트 — 나이·연도·6자리·8자리 숫자 자동 파싱
import { calcAge, parseBirthInput } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { Calendar } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
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

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
};

export function BirthDateInput({ value, onChange }: Props) {
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const digits = text.replace(/\D/g, "");
  const typedDate = digits.length >= 2 ? parseBirthInput(text) : null;
  const previewDate = digits.length >= 2 ? typedDate : value;
  const showError = digits.length >= 2 && typedDate === null;

  function handleChange(raw: string) {
    setText(raw);
    if (!raw) {
      onChange(null);
      return;
    }
    const result = parseBirthInput(raw);
    if (result) onChange(result);
  }

  function handleClear() {
    setText("");
    onChange(null);
  }

  function handlePickerSelect(date: Date) {
    setText("");
    onChange(date);
    setShowPicker(false);
  }

  function handleDayPress(day: DateData) {
    handlePickerSelect(new Date(day.dateString));
  }

  const previewStr = previewDate
    ? (() => {
        const d = dayjs(previewDate);
        const dateLabel = d.format("YYYY년 M월 D일");
        const ageStr = calcAge(d.format("YYYY-MM-DD"));
        return `${dateLabel} · 만 ${ageStr}세`;
      })()
    : null;

  const pickerCurrent = value ? dayjs(value).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

  const selectedDateStr = value ? dayjs(value).format("YYYY-MM-DD") : undefined;

  return (
    <View>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-app-label text-[13px]">생년월일</Text>
        {value && !text && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Text className="text-app-muted text-[12px]">지우기</Text>
          </Pressable>
        )}
      </View>

      <View className="flex-row gap-2">
        <TextInput
          className="flex-1 bg-app-surface text-white rounded-[10px] p-3 text-sm"
          value={text}
          onChangeText={handleChange}
          placeholder="나이(77) · 연도(1950) · 날짜(800510)"
          placeholderTextColor="#555"
          keyboardType="number-pad"
        />
        <Pressable
          onPress={() => setShowPicker(true)}
          className="bg-app-surface rounded-[10px] items-center justify-center w-12"
        >
          <Calendar size={20} color="#4ecdc4" />
        </Pressable>
      </View>

      {previewStr && (
        <Text
          className={cn(
            "text-[13px] mt-2 px-1",
            showError ? "text-[#ff6b6b]" : "text-[#4ecdc4]",
          )}
        >
          {text ? `→ ${previewStr}` : previewStr}
        </Text>
      )}

      {showError && (
        <Text className="text-[#ff6b6b] text-[11px] mt-1 px-1">
          인식 불가 — 나이 2자리 / 연도 4자리 / 날짜 6자리(YYMMDD) /
          8자리(YYYYMMDD)
        </Text>
      )}

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
              current={pickerCurrent}
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
    </View>
  );
}
