// 캘린더 탭 — 월별 캘린더 뷰 + 핸들 드래그로 확장/축소 + 선택 날짜 기록/기념일 패널
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import type { DateData } from "react-native-calendars";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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

// 확장 모드 날짜 셀 높이
const EXPANDED_CELL_HEIGHT = 78;

function getItemTitle(item: DayItem): string {
  if (item.type === "log" || item.type === "repeat") return item.data.title;
  return item.isBirthday
    ? `${item.personName} 생일`
    : `${item.personName} ${item.title}`;
}

function getItemColor(item: DayItem): string {
  if (item.type === "log") return "#4ECDC4";
  if (item.type === "repeat") return "#f59e0b";
  return "#f97316";
}

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
  const {
    markedDates: rawMarkedDates,
    dayItems,
    monthItemsByDate,
  } = useCalendarData(currentMonth, selectedDate);

  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedSV = useSharedValue(false);
  const listOpacity = useSharedValue(1);

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

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onEnd((event) => {
      "worklet";
      if (!isExpandedSV.value && event.translationY > 40) {
        isExpandedSV.value = true;
        listOpacity.value = withTiming(0, { duration: 150 }, (done) => {
          "worklet";
          if (done) runOnJS(setIsExpanded)(true);
        });
      } else if (isExpandedSV.value && event.translationY < -40) {
        isExpandedSV.value = false;
        runOnJS(setIsExpanded)(false);
        listOpacity.value = withTiming(1, { duration: 200 });
      }
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      "worklet";
      if (isExpandedSV.value) {
        isExpandedSV.value = false;
        runOnJS(setIsExpanded)(false);
        listOpacity.value = withTiming(1, { duration: 200 });
      } else {
        isExpandedSV.value = true;
        listOpacity.value = withTiming(0, { duration: 150 }, (done) => {
          "worklet";
          if (done) runOnJS(setIsExpanded)(true);
        });
      }
    });

  const handleGesture = Gesture.Race(panGesture, tapGesture);

  const animatedListStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    flex: 1,
  }));

  // 확장 모드 셀 — 날짜 번호 + 항목 제목 최대 2줄 표시
  const renderDayComponent = useCallback(
    ({ date, state }: { date?: DateData; state?: string }) => {
      if (!date) return null;
      const dateStr = date.dateString;
      const items = monthItemsByDate[dateStr] ?? [];
      const isSelected = dateStr === selectedDate;
      const isToday = dateStr === TODAY;
      const isDisabled = state === "disabled";

      return (
        <TouchableOpacity
          onPress={() => setSelectedDate(dateStr)}
          style={{
            height: EXPANDED_CELL_HEIGHT,
            padding: 3,
            backgroundColor: isSelected ? "#1a3a3a" : "transparent",
            borderRadius: 6,
            overflow: "hidden",
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: 12,
              textAlign: "center",
              color: isDisabled
                ? "#444444"
                : isSelected || isToday
                  ? "#4ECDC4"
                  : "#e0e0e0",
              fontWeight: isSelected || isToday ? "700" : "400",
            }}
          >
            {date.day}
          </Text>
          {items.slice(0, 2).map((item, i) => (
            <Text
              key={i}
              numberOfLines={1}
              style={{
                fontSize: 9,
                color: getItemColor(item),
                marginTop: 2,
                lineHeight: 11,
              }}
            >
              {getItemTitle(item)}
            </Text>
          ))}
          {items.length > 2 && (
            <Text style={{ fontSize: 8, color: "#666666", marginTop: 1 }}>
              +{items.length - 2}
            </Text>
          )}
        </TouchableOpacity>
      );
    },
    [monthItemsByDate, selectedDate],
  );

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="캘린더"
        listOnPress={() => router.push("/(tabs)/list")}
        searchOnPress
      />

      <View className="mx-4 rounded-[12px] overflow-hidden">
        <Calendar
          key={isExpanded ? "expanded" : "collapsed"}
          current={currentMonth}
          markedDates={isExpanded ? undefined : markedDates}
          markingType={isExpanded ? undefined : "multi-dot"}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          onMonthChange={(month) => setCurrentMonth(month.dateString)}
          theme={CALENDAR_THEME}
          enableSwipeMonths
          dayComponent={isExpanded ? renderDayComponent : undefined}
          renderHeader={(date) => (
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "600" }}>
              {dayjs(date).format("YYYY년 M월")}
            </Text>
          )}
        />
      </View>

      {/* 드래그 핸들 — 아래 드래그·탭으로 확장, 위 드래그·탭으로 축소 */}
      <GestureDetector gesture={handleGesture}>
        <View
          style={{ alignItems: "center", paddingVertical: 8, height: 28 }}
          hitSlop={{ top: 8, bottom: 8, left: 40, right: 40 }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: isExpanded ? "#4ECDC4" : "#444444",
            }}
          />
        </View>
      </GestureDetector>

      {/* 선택 날짜 레이블 — 축소 모드에서만 표시 */}
      {!isExpanded && (
        <View className="flex-row items-center px-4 mt-1 mb-2">
          <Text className="flex-1 text-app-label text-[10px] uppercase tracking-widest">
            {selectedLabel}
          </Text>
          {dayItems.length > 0 && (
            <Text className="text-app-muted text-xs">{dayItems.length}건</Text>
          )}
        </View>
      )}

      {/* 리스트 — 확장 진입 시 페이드아웃 후 언마운트 */}
      {!isExpanded && (
        <Animated.View style={animatedListStyle}>
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
                  onPress={() =>
                    router.push({
                      pathname: "/persons/[id]",
                      params: { id: item.personId },
                    })
                  }
                />
              );
            }}
          />
        </Animated.View>
      )}

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
