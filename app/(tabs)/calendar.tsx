// 캘린더 탭 — 월별 캘린더 뷰 + 선택 날짜 기록/기념일 패널
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { AnniversaryCard } from "@/components/calendar/AnniversaryCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import TabsHeader from "@/components/layout/TabsHeader";
import { LogCard } from "@/components/logs/LogCard";
import type { DayItem } from "@/hooks/useCalendarData";
import { useCalendarData } from "@/hooks/useCalendarData";

dayjs.locale("ko");

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

const TODAY = dayjs().format("YYYY-MM-DD");

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
  "stylesheet.calendar.header": {
    week: {
      marginTop: 4,
      flexDirection: "row" as const,
      justifyContent: "space-around" as const,
    },
  },
};

function itemKey(item: DayItem, idx: number): string {
  if (item.type === "log") return `log-${item.data.id}`;
  if (item.type === "repeat")
    return `repeat-${item.data.id}-${item.virtualDate}`;
  return `ann-${item.id}-${idx}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(TODAY);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const { markedDates: rawMarkedDates, dayItems } = useCalendarData(
    currentMonth,
    selectedDate,
  );

  // 오늘 날짜에 흰 점 추가 — 선택·미선택 무관하게 구분 표시
  const markedDates = useMemo(() => {
    const result = { ...rawMarkedDates };
    const todayEntry = result[TODAY] ?? { dots: [] };
    if (!todayEntry.dots.some((d) => d.key === "today")) {
      result[TODAY] = {
        ...todayEntry,
        dots: [{ key: "today", color: "#ffffff" }, ...todayEntry.dots],
      };
    }
    return result;
  }, [rawMarkedDates]);

  const selectedLabel = dayjs(selectedDate).format("M월 D일 (ddd)");

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader title="캘린더" searchOnPress />

      <View className="mx-4 rounded-[12px] overflow-hidden">
        <Calendar
          current={currentMonth}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => setSelectedDate(day.dateString)}
          onMonthChange={(month) => setCurrentMonth(month.dateString)}
          theme={CALENDAR_THEME}
          enableSwipeMonths
          renderHeader={(date) => (
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "600" }}>
              {dayjs(date).format("YYYY년 M월")}
            </Text>
          )}
        />
      </View>

      <View className="flex-row items-center px-4 mt-3 mb-2">
        <Text className="flex-1 text-app-label text-[10px] uppercase tracking-widest">
          {selectedLabel}
        </Text>
        {dayItems.length > 0 && (
          <Text className="text-app-muted text-xs">{dayItems.length}건</Text>
        )}
      </View>

      <FlatList
        data={dayItems}
        keyExtractor={itemKey}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 8,
        }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-app-muted text-sm">일정이 없습니다.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "log") {
            return (
              <LogCard
                log={item.data}
                onPress={() =>
                  router.push({
                    pathname: "/logs/[id]",
                    params: { id: item.data.id },
                  })
                }
              />
            );
          }
          if (item.type === "repeat") {
            return (
              <View style={{ opacity: 0.65 }}>
                <LogCard
                  log={item.data}
                  onPress={() =>
                    router.push({
                      pathname: "/logs/[id]",
                      params: {
                        id: item.data.id,
                        occurrenceDate: item.virtualDate,
                      },
                    })
                  }
                />
              </View>
            );
          }
          return (
            <AnniversaryCard
              personName={item.personName}
              title={item.title}
              dDay={item.dDay}
              isBirthday={item.isBirthday}
            />
          );
        }}
      />

      <FloatingActionButton
        onPress={() =>
          router.push({
            pathname: "/logs/new",
            params: { date: selectedDate },
          })
        }
      />
    </View>
  );
}
