// 날짜 선택용 캘린더 모달 — DateInput / BirthDateInput 공용
import "@/utils/calendarLocale";
import { parseDateShortcut } from "@/utils/date";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import type { DateData } from "react-native-calendars";
import { Calendar } from "react-native-calendars";

export const CALENDAR_THEME = {
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
  visible: boolean;
  value: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

export function CalendarPickerModal({
  visible,
  value,
  onSelect,
  onClose,
}: Props) {
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setInputText("");
      setError("");
    }
  }, [visible]);

  const current = value
    ? dayjs(value).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
  const selectedDateStr = value ? dayjs(value).format("YYYY-MM-DD") : undefined;

  function handleDayPress(day: DateData) {
    onSelect(new Date(day.dateString));
  }

  function handleShortcutConfirm() {
    const parsed = parseDateShortcut(inputText);
    if (!parsed) {
      setError("형식 오류. 예: 1212 또는 251212");
      return;
    }
    setError("");
    onSelect(parsed);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "center",
          paddingHorizontal: 16,
        }}
        onPress={onClose}
      >
        <View
          style={{ backgroundColor: "#1a1a1a", borderRadius: 16, padding: 16 }}
          onStartShouldSetResponder={() => true}
        >
          <Calendar
            theme={CALENDAR_THEME}
            current={current}
            onDayPress={handleDayPress}
            enableSwipeMonths
            renderHeader={(date) => (
              <Text
                style={{ color: "#ffffff", fontSize: 15, fontWeight: "600" }}
              >
                {dayjs(date as unknown as string).format("YYYY년 M월")}
              </Text>
            )}
            markedDates={
              selectedDateStr
                ? {
                    [selectedDateStr]: {
                      selected: true,
                      selectedColor: "#4ECDC4",
                    },
                  }
                : {}
            }
          />
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: "#2a2a2a",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: "#e0e0e0",
                  fontSize: 14,
                }}
                placeholder="1212 또는 251212"
                placeholderTextColor="#555"
                value={inputText}
                onChangeText={(t) => { setInputText(t); setError(""); }}
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleShortcutConfirm}
              />
              <Pressable
                onPress={handleShortcutConfirm}
                style={{
                  backgroundColor: "#4ECDC4",
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#111", fontSize: 14, fontWeight: "600" }}>
                  확인
                </Text>
              </Pressable>
            </View>
            {error ? (
              <Text style={{ color: "#ff6b6b", fontSize: 12, marginTop: 4 }}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
