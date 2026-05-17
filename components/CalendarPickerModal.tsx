// 날짜 선택용 캘린더 모달 — DateInput / BirthDateInput 공용
import dayjs from "dayjs";
import { Modal, Pressable, Text, View } from "react-native";
import type { DateData } from "react-native-calendars";
import { Calendar, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales["ko"] = {
  monthNames: [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ],
  monthNamesShort: [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ],
  dayNames: [
    "일요일",
    "월요일",
    "화요일",
    "수요일",
    "목요일",
    "금요일",
    "토요일",
  ],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "ko";

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
  const current = value
    ? dayjs(value).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
  const selectedDateStr = value ? dayjs(value).format("YYYY-MM-DD") : undefined;

  function handleDayPress(day: DateData) {
    onSelect(new Date(day.dateString));
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
        </View>
      </Pressable>
    </Modal>
  );
}
