// 메인 캘린더 뷰 — CalendarList(horizontal) 기반, compact/board 두 모드 지원
import { MonthPickerModal } from "@/components/MonthPickerModal";
import type { groups as groupsSchema } from "@/db/schema";
import type { EventItem } from "@/hooks/logs/use-event-filter";
import type { AnniversaryBoardItem } from "@/hooks/persons/use-anniversaries-in-month";
import { toDateKey } from "@/utils/date";
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { CalendarList, LocaleConfig } from "react-native-calendars";
import type { DateData } from "react-native-calendars";

LocaleConfig.locales["ko"] = {
  monthNames: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ],
  monthNamesShort: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ],
  dayNames: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  dayNamesShort: ["일", "월", "화", "수", "목", "금", "토"],
  today: "오늘",
};
LocaleConfig.defaultLocale = "ko";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CAL_THEME: any = {
  calendarBackground: "#111111",
  textSectionTitleColor: "#666666",
  selectedDayBackgroundColor: "#4ecdc4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ecdc4",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#333333",
  dotColor: "#4ecdc4",
  selectedDotColor: "#111111",
  "stylesheet.calendar.header": {
    header: { height: 0, overflow: "hidden", marginTop: 0 },
    dayHeader: {
      flex: 1,
      textAlign: "center",
      marginTop: 2,
      marginBottom: 7,
      fontSize: 12,
      color: "#666",
    },
    dayTextAtIndex0: { color: "#ff6b6b" },
    dayTextAtIndex6: { color: "#4ecdc4" },
    week: { marginTop: 7, flexDirection: "row", justifyContent: "space-around" },
  },
  "stylesheet.calendar.main": {
    container: { paddingHorizontal: 8, backgroundColor: "#111111" },
  },
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const ANN_COLOR = "#c084fc";
const COMPACT_HEIGHT = 290;
const BOARD_HEIGHT = 560;

type Group = InferSelectModel<typeof groupsSchema>;

type BoardItemInternal = {
  key: string;
  title: string;
  date: Date;
  isRepeat: boolean;
  isAnn: boolean;
  id: string;
};

interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  events: EventItem[];
  anniversaries: AnniversaryBoardItem[];
  groups: Group[];
  mode: "compact" | "board";
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function CalendarView({
  currentMonth,
  selectedDate,
  events,
  anniversaries,
  groups: groupList,
  mode,
  onSelectDate,
  onMonthChange,
}: Props) {
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const isSwipingRef = useRef(false);
  const swipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // stable callback — ref 패턴으로 dayComponent deps에서 제외
  const onSelectDateRef = useRef(onSelectDate);
  onSelectDateRef.current = onSelectDate;
  const stableOnSelectDate = useCallback((date: Date) => {
    onSelectDateRef.current(date);
  }, []);

  const groupColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groupList) map.set(g.id, g.color);
    return map;
  }, [groupList]);

  // multi-dot markedDates 변환
  const libMarkedDates = useMemo(() => {
    const md: Record<string, { dots: { key: string; color: string }[]; selected?: boolean }> = {};

    for (const evt of events) {
      const key = toDateKey(evt.displayDate);
      if (!md[key]) md[key] = { dots: [] };
      const color = groupColorMap.get(evt.log.groupId) ?? "#4ecdc4";
      if (!md[key].dots.some((d) => d.color === color)) {
        md[key].dots.push({ key: `g-${evt.log.groupId}-${key}`, color });
      }
    }

    for (const ann of anniversaries) {
      const key = toDateKey(ann.date);
      if (!md[key]) md[key] = { dots: [] };
      if (!md[key].dots.some((d) => d.color === ANN_COLOR)) {
        md[key].dots.push({ key: `ann-${key}`, color: ANN_COLOR });
      }
    }

    if (selectedDate) {
      const key = toDateKey(selectedDate);
      if (!md[key]) md[key] = { dots: [] };
      md[key] = { ...md[key], selected: true };
    }

    return md;
  }, [events, anniversaries, groupColorMap, selectedDate]);

  // board mode 아이템 — ref로 dayComponent 내부에서 최신값 접근
  const boardItemsRef = useRef<BoardItemInternal[]>([]);
  boardItemsRef.current = useMemo<BoardItemInternal[]>(
    () => [
      ...events.map((e) => ({
        key: e.key,
        title: e.log.title,
        date: e.displayDate,
        isRepeat: e.isRepeat,
        isAnn: false,
        id: e.log.id,
      })),
      ...anniversaries.map((a) => ({
        key: `ann-${a.personId}-${a.date.getTime()}`,
        title: a.displayTitle,
        date: a.date,
        isRepeat: false,
        isAnn: true,
        id: a.personId,
      })),
    ],
    [events, anniversaries],
  );

  const DayComponent = useMemo(() => {
    if (mode === "board") {
      return function BoardDay({
        date,
        state,
        onPress,
      }: {
        date?: DateData;
        marking?: unknown;
        state?: string;
        onPress?: (d?: DateData) => void;
      }) {
        if (!date) return null;
        const dow = dayjs(date.dateString).day();
        const isToday = state === "today";
        const dayItems = boardItemsRef.current.filter(
          (item) => toDateKey(item.date) === date.dateString,
        );
        const shown = dayItems.slice(0, 2);
        const overflow = dayItems.length - 2;

        return (
          <Pressable
            onPress={() => onPress?.(date)}
            style={{
              width: SCREEN_WIDTH / 7,
              minHeight: 84,
              padding: 3,
              borderTopWidth: 0.5,
              borderColor: "#222",
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: isToday ? "#4ecdc4" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isToday
                    ? "#111"
                    : dow === 0
                      ? "#ff6b6b"
                      : dow === 6
                        ? "#4ecdc4"
                        : "#e0e0e0",
                }}
              >
                {date.day}
              </Text>
            </View>
            {shown.map((item) => (
              <View
                key={item.key}
                style={{
                  backgroundColor: item.isAnn
                    ? "#c084fc22"
                    : item.isRepeat
                      ? "#f59e0b22"
                      : "#4ecdc422",
                  borderRadius: 3,
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                  marginBottom: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    color: item.isAnn ? "#c084fc" : item.isRepeat ? "#f59e0b" : "#4ecdc4",
                  }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </View>
            ))}
            {overflow > 0 && (
              <Text style={{ fontSize: 9, color: "#666", marginTop: 1 }}>
                +{overflow}
              </Text>
            )}
          </Pressable>
        );
      };
    }

    // CompactDay
    return function CompactDay({
      date,
      marking,
      state,
      onPress,
    }: {
      date?: DateData;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marking?: any;
      state?: string;
      onPress?: (d?: DateData) => void;
    }) {
      if (!date) return null;
      const dow = dayjs(date.dateString).day();
      const isSelected = (marking?.selected ?? false) as boolean;
      const isToday = state === "today";
      const dots = (marking?.dots ?? []) as { key: string; color: string }[];

      return (
        <Pressable
          onPress={() => onPress?.(date)}
          style={{
            width: SCREEN_WIDTH / 7,
            height: 46,
            alignItems: "center",
            paddingTop: 4,
          }}
        >
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: isSelected ? "#4ecdc4" : "transparent",
              borderWidth: isToday && !isSelected ? 1.5 : 0,
              borderColor: "#4ecdc4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: isToday ? "700" : "400",
                color: isSelected
                  ? "#111"
                  : state === "disabled"
                    ? "#333"
                    : dow === 0
                      ? "#ff6b6b"
                      : dow === 6
                        ? "#4ecdc4"
                        : "#e0e0e0",
              }}
            >
              {date.day}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 2, marginTop: 2 }}>
            {dots.slice(0, 4).map((d) => (
              <View
                key={d.key}
                style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: d.color }}
              />
            ))}
          </View>
        </Pressable>
      );
    };
  }, [mode]);

  function goToPrevMonth() {
    isSwipingRef.current = false;
    if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    onMonthChange(dayjs(currentMonth).subtract(1, "month").toDate());
  }

  function goToNextMonth() {
    isSwipingRef.current = false;
    if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
    onMonthChange(dayjs(currentMonth).add(1, "month").toDate());
  }

  const currentMonthStr = dayjs(currentMonth).format("YYYY-MM-DD");
  const calendarHeight = mode === "board" ? BOARD_HEIGHT : COMPACT_HEIGHT;

  return (
    <View>
      {/* 월 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Pressable onPress={goToPrevMonth} hitSlop={8}>
          <ChevronLeft size={22} color="#888" />
        </Pressable>
        <Pressable onPress={() => setShowMonthPicker(true)}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
            {dayjs(currentMonth).format("YYYY년 M월")}
          </Text>
        </Pressable>
        <Pressable onPress={goToNextMonth} hitSlop={8}>
          <ChevronRight size={22} color="#888" />
        </Pressable>
      </View>

      {/* 캘린더 */}
      <CalendarList
        horizontal
        pagingEnabled
        calendarWidth={SCREEN_WIDTH}
        calendarHeight={calendarHeight}
        hideArrows
        renderHeader={() => null}
        markingType="multi-dot"
        markedDates={libMarkedDates}
        dayComponent={DayComponent}
        theme={CAL_THEME}
        showSixWeeks
        current={isSwipingRef.current ? undefined : currentMonthStr}
        onVisibleMonthsChange={(months) => {
          if (months.length > 0) {
            isSwipingRef.current = true;
            onMonthChange(dayjs(months[0].dateString).startOf("month").toDate());
            if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
            swipeTimerRef.current = setTimeout(() => {
              isSwipingRef.current = false;
            }, 500);
          }
        }}
        onDayPress={(day) => {
          stableOnSelectDate(new Date(day.dateString));
        }}
        pastScrollRange={24}
        futureScrollRange={12}
      />

      <MonthPickerModal
        visible={showMonthPicker}
        currentMonth={currentMonth}
        onSelect={(year, month) => {
          isSwipingRef.current = false;
          if (swipeTimerRef.current) clearTimeout(swipeTimerRef.current);
          onMonthChange(new Date(year, month, 1));
          setShowMonthPicker(false);
        }}
        onClose={() => setShowMonthPicker(false)}
      />
    </View>
  );
}
