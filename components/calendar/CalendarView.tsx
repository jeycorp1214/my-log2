// CalendarList 기반 메인 캘린더 컴포넌트 — compact/board 두 모드 지원
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { isSameDay } from "@/utils/date";
import { formatMonthYear } from "@/utils/date";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { CalendarList, LocaleConfig } from "react-native-calendars";
import type { DateData } from "react-native-calendars";

LocaleConfig.locales["ko"] = {
  monthNames: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  monthNamesShort: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"],
  dayNames: ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"],
  dayNamesShort: ["일","월","화","수","목","금","토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "ko";

const SCREEN_WIDTH = Dimensions.get("window").width;

const DARK_THEME = {
  calendarBackground: "#111111",
  backgroundColor: "#111111",
  textSectionTitleColor: "#666666",
  selectedDayBackgroundColor: "#4ecdc4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ecdc4",
  todayBackgroundColor: "transparent",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#333333",
  dotColor: "#4ecdc4",
  selectedDotColor: "#111111",
  "stylesheet.calendar.header": {
    header: { height: 0, overflow: "hidden" as const, marginTop: 0 },
    dayHeader: {
      flex: 1,
      textAlign: "center" as const,
      marginTop: 2,
      marginBottom: 7,
      fontSize: 12,
      color: "#666666",
    },
    dayTextAtIndex0: { color: "#ff6b6b" },
    dayTextAtIndex6: { color: "#4ecdc4" },
    week: {
      marginTop: 7,
      flexDirection: "row" as const,
      justifyContent: "space-around" as const,
    },
  },
  "stylesheet.calendar.main": {
    container: {
      paddingLeft: 8,
      paddingRight: 8,
      backgroundColor: "#111111",
    },
  },
};

type DotItem = { key?: string; color: string };
type CalendarMarking = { dots?: DotItem[]; selected?: boolean };

type BoardItem = {
  date: Date;
  title: string;
  isRepeat: boolean;
  type?: "anniversary";
};

interface DayComponentProps {
  date?: DateData;
  marking?: CalendarMarking;
  state?: string;
  onPress?: (date?: DateData) => void;
  children?: React.ReactNode;
}

interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  markedDates: Date[];
  anniversaryDates?: Date[];
  mode?: "compact" | "board";
  boardItems?: BoardItem[];
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function CalendarView({
  currentMonth,
  selectedDate,
  markedDates,
  anniversaryDates = [],
  mode = "compact",
  boardItems = [],
  onSelectDate,
  onMonthChange,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  // stable onSelectDate via ref
  const onSelectDateRef = useRef(onSelectDate);
  onSelectDateRef.current = onSelectDate;
  const stableOnSelectDate = useCallback((date: Date) => {
    onSelectDateRef.current(date);
  }, []);

  // modeRef + boardItemsRef — dayComponent reads latest values without recreating
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const boardItemsRef = useRef(boardItems);
  boardItemsRef.current = boardItems;

  // markedDates → library format
  const libMarkedDates = useMemo(() => {
    const map: Record<string, CalendarMarking> = {};

    for (const d of markedDates) {
      const key = dayjs(d).format("YYYY-MM-DD");
      if (!map[key]) map[key] = { dots: [] };
      if (!map[key].dots!.some((dot) => dot.key === "log")) {
        map[key].dots!.push({ key: "log", color: "#4ecdc4" });
      }
    }

    for (const d of anniversaryDates) {
      const key = dayjs(d).format("YYYY-MM-DD");
      if (!map[key]) map[key] = { dots: [] };
      if (!map[key].dots!.some((dot) => dot.key === "ann")) {
        map[key].dots!.push({ key: "ann", color: "#c084fc" });
      }
    }

    if (selectedDate) {
      const key = dayjs(selectedDate).format("YYYY-MM-DD");
      if (!map[key]) map[key] = { dots: [] };
      map[key].selected = true;
    }

    return map;
  }, [markedDates, anniversaryDates, selectedDate]);

  // 단일 dayComponent — modeRef로 분기, stable (빈 deps)
  const DayComponent = useMemo(() => {
    return function DayCell({ date, marking, state, onPress, children }: DayComponentProps) {
      if (!date) return null;
      const dow = dayjs(date.dateString).day();
      const isSelected = marking?.selected ?? false;
      const isToday = state === "today";

      if (modeRef.current === "board") {
        const dayItems = boardItemsRef.current.filter((item) =>
          isSameDay(item.date, new Date(date.dateString)),
        );
        const overflowCount = Math.max(0, dayItems.length - 2);

        return (
          <Pressable
            style={{
              flex: 1,
              minHeight: 84,
              padding: 4,
              backgroundColor: isSelected ? "#142218" : "#111111",
            }}
            onPress={() => onPress?.(date)}
          >
            <Text
              style={{
                fontSize: 12,
                marginBottom: 2,
                fontWeight: isToday || isSelected ? "700" : "500",
                color: isToday
                  ? "#4ecdc4"
                  : dow === 0
                    ? "#ff6b6b"
                    : dow === 6
                      ? "#4ecdc4"
                      : "#cccccc",
              }}
            >
              {date.day}
            </Text>
            {dayItems.slice(0, 2).map((item, idx) => {
              const bgColor =
                item.type === "anniversary"
                  ? "#1e1428"
                  : item.isRepeat
                    ? "#28200c"
                    : "#0e2419";
              const textColor =
                item.type === "anniversary"
                  ? "#c084fc"
                  : item.isRepeat
                    ? "#c9922a"
                    : "#4ecdc4";
              return (
                <View
                  key={idx}
                  style={{
                    borderRadius: 3,
                    paddingHorizontal: 4,
                    marginBottom: 2,
                    backgroundColor: bgColor,
                  }}
                >
                  <Text numberOfLines={1} style={{ fontSize: 10, color: textColor }}>
                    {item.title}
                  </Text>
                </View>
              );
            })}
            {overflowCount > 0 && (
              <Text style={{ fontSize: 9, color: "#666666" }}>+{overflowCount}</Text>
            )}
          </Pressable>
        );
      }

      // compact mode
      const dots = marking?.dots ?? [];
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
              width: 36,
              height: 36,
              borderRadius: 18,
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
                fontSize: 14,
                fontWeight: isSelected ? "700" : "400",
              }}
            >
              {children ?? String(date.day)}
            </Text>
            {dots.length > 0 && (
              <View style={{ flexDirection: "row", gap: 2, marginTop: 1 }}>
                {dots.map((dot) => (
                  <View
                    key={dot.key ?? dot.color}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isSelected ? "#111111" : dot.color,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </Pressable>
      );
    };
  }, []); // stable — Calendar이 onPress 주입, modeRef/boardItemsRef로 최신값 접근

  const calendarHeight = mode === "board" ? 560 : 290;

  return (
    <View>
      {/* 월 네비게이션 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingBottom: 4,
          gap: 4,
        }}
      >
        <Pressable
          onPress={() => onMonthChange(dayjs(currentMonth).subtract(1, "month").toDate())}
          style={{ padding: 8 }}
        >
          <ChevronLeft size={22} color="#e0e0e0" />
        </Pressable>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={{ flex: 1, alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "600" }}>
            {formatMonthYear(currentMonth)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onMonthChange(dayjs(currentMonth).add(1, "month").toDate())}
          style={{ padding: 8 }}
        >
          <ChevronRight size={22} color="#e0e0e0" />
        </Pressable>
      </View>

      <CalendarList
        horizontal
        pagingEnabled
        calendarWidth={SCREEN_WIDTH}
        calendarHeight={calendarHeight}
        hideArrows
        markingType="multi-dot"
        markedDates={libMarkedDates}
        dayComponent={DayComponent}
        theme={DARK_THEME as any}
        showSixWeeks
        pastScrollRange={12}
        futureScrollRange={12}
        current={dayjs(currentMonth).format("YYYY-MM-DD")}
        onDayPress={(day) => stableOnSelectDate(new Date(day.dateString))}
        onVisibleMonthsChange={(months) => {
          if (months[0]) {
            onMonthChange(new Date(months[0].dateString));
          }
        }}
      />

      <MonthPickerModal
        visible={showPicker}
        currentMonth={currentMonth}
        onSelect={(year, month) => {
          onMonthChange(new Date(year, month, 1));
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}
