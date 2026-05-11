// 날짜 선택 모달 컴포넌트 — react-native-calendars Calendar 기반 인라인 날짜 선택
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { formatMonthYear } from "@/utils/date";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import type { DateData } from "react-native-calendars";
import { Calendar } from "react-native-calendars";

interface Props {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const PICKER_THEME = {
  calendarBackground: "#1a1a1a",
  backgroundColor: "#1a1a1a",
  textSectionTitleColor: "#666666",
  selectedDayBackgroundColor: "#4ecdc4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ecdc4",
  todayBackgroundColor: "transparent",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#444444",
  "stylesheet.calendar.header": {
    header: { height: 0, overflow: "hidden" as const, marginTop: 0 },
    dayHeader: {
      flex: 1,
      textAlign: "center" as const,
      fontSize: 11,
      color: "#666666",
      marginTop: 2,
      marginBottom: 6,
    },
    dayTextAtIndex0: { color: "#ff6b6b" },
    dayTextAtIndex6: { color: "#4ecdc4" },
    week: {
      marginTop: 6,
      flexDirection: "row" as const,
      justifyContent: "space-around" as const,
    },
  },
  "stylesheet.calendar.main": {
    container: { paddingLeft: 6, paddingRight: 6, backgroundColor: "#1a1a1a" },
  },
};

export function DatePickerModal({ visible, value, onChange, onClose }: Props) {
  const [pickerMonth, setPickerMonth] = useState(value);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    if (visible) setPickerMonth(value);
  }, [visible]);

  function handleSelect(date: Date) {
    onChange(date);
    onClose();
  }

  const markedDates = useMemo(
    () => ({ [dayjs(value).format("YYYY-MM-DD")]: { selected: true } }),
    [value],
  );

  const DayComponent = useMemo(() => {
    return function PickerDay({
      date,
      marking,
      state,
      onPress,
      children,
    }: {
      date?: DateData;
      marking?: { selected?: boolean };
      state?: string;
      onPress?: (date?: DateData) => void;
      children?: React.ReactNode;
    }) {
      if (!date) return null;
      const dow = dayjs(date.dateString).day();
      const isSelected = marking?.selected ?? false;
      const isToday = state === "today";
      const numColor = isSelected
        ? "#111111"
        : dow === 0
          ? "#ff6b6b"
          : dow === 6
            ? "#4ecdc4"
            : "#e0e0e0";
      return (
        <Pressable
          style={{ flex: 1, alignItems: "center", paddingVertical: 2 }}
          onPress={() => onPress?.(date)}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSelected ? "#4ecdc4" : "transparent",
              borderWidth: !isSelected && isToday ? 1 : 0,
              borderColor: "#4ecdc4",
            }}
          >
            <Text
              style={{
                color: numColor,
                fontSize: 13,
                fontWeight: isSelected ? "700" : "400",
              }}
            >
              {children ?? String(date.day)}
            </Text>
          </View>
        </Pressable>
      );
    };
  }, []);

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
        <Pressable className="bg-app-surface rounded-[16px] w-80 overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-1">
            <Pressable
              onPress={() =>
                setPickerMonth(dayjs(pickerMonth).subtract(1, "month").toDate())
              }
              className="p-2"
            >
              <ChevronLeft size={20} color="#e0e0e0" />
            </Pressable>
            <Pressable
              onPress={() => setShowMonthPicker(true)}
              className="py-1 px-2"
            >
              <Text className="text-white text-base font-semibold">
                {formatMonthYear(pickerMonth)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                setPickerMonth(dayjs(pickerMonth).add(1, "month").toDate())
              }
              className="p-2"
            >
              <ChevronRight size={20} color="#e0e0e0" />
            </Pressable>
          </View>
          <View className="pb-3">
            <Calendar
              key={dayjs(pickerMonth).format("YYYY-MM")}
              current={dayjs(pickerMonth).format("YYYY-MM-DD")}
              hideArrows
              hideExtraDays
              onDayPress={(day) => handleSelect(new Date(day.dateString))}
              markedDates={markedDates}
              dayComponent={DayComponent}
              theme={PICKER_THEME as any}
            />
          </View>
        </Pressable>
      </Pressable>

      <MonthPickerModal
        visible={showMonthPicker}
        currentMonth={pickerMonth}
        onSelect={(year, month) => {
          setPickerMonth(new Date(year, month, 1));
          setShowMonthPicker(false);
        }}
        onClose={() => setShowMonthPicker(false)}
      />
    </Modal>
  );
}
