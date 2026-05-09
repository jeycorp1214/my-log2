// 캘린더 탭 — 월별 달력 + 날짜 선택 or 월간 전체 로그 목록
import { CalendarDebugBar } from "@/components/calendar/CalendarDebugBar";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { DayDetailModal } from "@/components/calendar/DayDetailModal";
import { MonthNavBar } from "@/components/calendar/MonthNavBar";
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { LogCard } from "@/components/logs/LogCard";
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { db } from "@/db/client";
import { groups, logs } from "@/db/schema";
import { useCalendarLogs } from "@/hooks/logs/use-calendar-logs";
import { useAnniversariesInMonth } from "@/hooks/persons/use-anniversaries-in-month";
import { useDebugMode } from "@/providers/DebugProvider";
import {
  addMonths,
  endOfMonth,
  formatLogDate,
  formatMonthYear,
  isSameDay,
  startOfMonth,
  toDateKey,
} from "@/utils/date";
import { expandRepeatInMonth } from "@/utils/repeat";
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

type Log = InferSelectModel<typeof logs>;
type LogItem = { log: Log; isOccurrence: boolean };
type AnniversaryEntry = { title: string; personId: string };
type DaySection = {
  dateKey: string;
  date: Date;
  items: LogItem[];
  anniversaries: AnniversaryEntry[];
};

export default function CalendarScreen() {
  const router = useRouter();
  const { savedDate } = useLocalSearchParams<{ savedDate?: string }>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"compact" | "board">("compact");
  const [showAnniversaries, setShowAnniversaries] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const { debugMode } = useDebugMode();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (!savedDate) return;
    const d = new Date(savedDate);
    setCurrentMonth(d);
    setSelectedDate(d);
  }, [savedDate]);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth]);

  const { monthLogs, repeatLogs: allRepeatLogs } = useCalendarLogs(
    monthStart,
    monthEnd,
  );

  const { anniversaryDates, anniversaryBoardItems } = useAnniversariesInMonth(
    monthStart,
    monthEnd,
  );

  const repeatOccurrences = allRepeatLogs.flatMap((log) =>
    expandRepeatInMonth(log, monthStart, monthEnd).map((date) => ({
      log,
      date,
    })),
  );

  const logDates = [
    ...monthLogs.map((log) => new Date(log.logDate)),
    ...repeatOccurrences.map(({ date }) => date),
  ];

  const calendarAnniversaryDates = showAnniversaries ? anniversaryDates : [];

  const boardItems = useMemo(
    () => [
      ...monthLogs.map((log) => ({
        date: new Date(log.logDate),
        title: log.title,
        isRepeat: false as const,
      })),
      ...repeatOccurrences.map(({ log, date }) => ({
        date,
        title: log.title,
        isRepeat: true as const,
      })),
      ...(showAnniversaries
        ? anniversaryBoardItems.map((ann) => ({
            date: ann.date,
            title: ann.displayTitle,
            isRepeat: false as const,
            type: "anniversary" as const,
          }))
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      monthLogs,
      allRepeatLogs,
      monthStart,
      monthEnd,
      showAnniversaries,
      anniversaryBoardItems,
    ],
  );

  function buildDaySections(): DaySection[] {
    const map = new Map<string, DaySection>();

    const allItems: { log: Log; date: Date; isOccurrence: boolean }[] = [
      ...monthLogs.map((log) => ({
        log,
        date: new Date(log.logDate),
        isOccurrence: false,
      })),
      ...repeatOccurrences.map(({ log, date }) => ({
        log,
        date,
        isOccurrence: true,
      })),
    ];

    for (const { log, date, isOccurrence } of allItems) {
      const key = toDateKey(date);
      if (!map.has(key))
        map.set(key, { dateKey: key, date, items: [], anniversaries: [] });
      map.get(key)!.items.push({ log, isOccurrence });
    }

    if (showAnniversaries) {
      for (const ann of anniversaryBoardItems) {
        const key = toDateKey(ann.date);
        if (!map.has(key))
          map.set(key, {
            dateKey: key,
            date: ann.date,
            items: [],
            anniversaries: [],
          });
        map.get(key)!.anniversaries.push({
          title: ann.displayTitle,
          personId: ann.personId,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }

  const selectedLogs: LogItem[] = selectedDate
    ? [
        ...monthLogs
          .filter((log) => isSameDay(new Date(log.logDate), selectedDate))
          .map((log) => ({ log, isOccurrence: false })),
        ...repeatOccurrences
          .filter(({ date }) => isSameDay(date, selectedDate))
          .map(({ log }) => ({ log, isOccurrence: true })),
      ]
    : [];

  const selectedAnniversaries =
    showAnniversaries && selectedDate
      ? anniversaryBoardItems.filter((ann) => isSameDay(ann.date, selectedDate))
      : [];

  function prevMonth() {
    setCurrentMonth(addMonths(currentMonth, -1));
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  }

  function goToday() {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }

  async function handleQuickPress() {
    const title = quickTitle.trim();
    if (title.length === 0) {
      router.push({
        pathname: "/logs/new",
        params: { date: targetDate.toISOString() },
      });
      return;
    }
    if (allGroups.length === 0) return;
    await db.insert(logs).values({
      title,
      logDate: targetDate,
      groupId: allGroups[0].id,
    });
    setQuickTitle("");
    Keyboard.dismiss();
  }

  function handleSelectDate(date: Date) {
    if (viewMode === "board") {
      if (selectedDate && isSameDay(selectedDate, date)) {
        setShowDayModal(true);
      } else {
        setSelectedDate(date);
      }
    } else {
      if (selectedDate && isSameDay(selectedDate, date)) {
        setSelectedDate(null);
      } else {
        setSelectedDate(date);
      }
    }
  }

  // 수평: 월 이동
  const horizontalSwipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(nextMonth)();
      else if (e.translationX > 50) runOnJS(prevMonth)();
    });

  // 수직: 모드 전환 (아래 → 보드, 위 → 컴팩트)
  const verticalSwipe = Gesture.Pan()
    .activeOffsetY([-30, 30])
    .failOffsetX([-10, 10])
    .onEnd((e) => {
      if (e.translationY > 50) runOnJS(setViewMode)("board");
      else if (e.translationY < -50) runOnJS(setViewMode)("compact");
    });

  const calendarGesture = Gesture.Race(horizontalSwipe, verticalSwipe);

  const daySections = buildDaySections();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();
  const targetDate =
    selectedDate ??
    (isCurrentMonth
      ? today
      : new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));

  const inputBarBottom = keyboardHeight > 0 ? keyboardHeight + 8 : 24;

  // 보드: 날짜 선택 시에만 하단 리스트 표시
  // 컴팩트: 항상 하단 리스트 표시
  const showList = viewMode === "compact";

  return (
    <View className="flex-1 bg-app-bg">
      <CalendarHeader
        viewMode={viewMode}
        onToggleView={() =>
          setViewMode((v) => (v === "compact" ? "board" : "compact"))
        }
        onSearchPress={() => router.push("/search")}
        onTodayPress={goToday}
        showAnniversaries={showAnniversaries}
        onToggleAnniversaries={() => setShowAnniversaries((v) => !v)}
      />

      <MonthNavBar
        currentMonth={currentMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
        onMonthChange={(date) => {
          setCurrentMonth(date);
          setSelectedDate(null);
        }}
      />

      {debugMode && (
        <CalendarDebugBar
          currentMonth={currentMonth}
          monthStart={monthStart}
          monthEnd={monthEnd}
          monthLogs={monthLogs}
          allRepeatLogs={allRepeatLogs}
          selectedDate={selectedDate}
          viewMode={viewMode}
        />
      )}

      {/* 캘린더 그리드 — 수평(월 이동) + 수직(모드 전환) 제스처 통합 */}
      <GestureDetector gesture={calendarGesture}>
        <View>
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            markedDates={logDates}
            onSelectDate={handleSelectDate}
            mode={viewMode === "board" ? "board" : "compact"}
            boardItems={viewMode === "board" ? boardItems : undefined}
            anniversaryDates={calendarAnniversaryDates}
          />
        </View>
      </GestureDetector>

      {/* 날짜 레이블 바 */}
      {showList && (
        <View className="flex-row items-center justify-between px-5 py-[10px]">
          <Text className="text-app-dim text-[14px] font-semibold">
            {selectedDate
              ? formatLogDate(selectedDate)
              : `${formatMonthYear(currentMonth)} 전체`}
          </Text>
          {selectedDate && (
            <Pressable
              onPress={() => setSelectedDate(null)}
              className="bg-app-surface rounded-[10px] px-2 py-[3px]"
            >
              <Text className="text-app-teal text-xs">전체보기</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* 하단 리스트 — 컴팩트: 항상, 보드: 날짜 선택 시 */}
      {showList && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 96,
            gap: 8,
          }}
        >
          {selectedDate ? (
            selectedLogs.length === 0 && selectedAnniversaries.length === 0 ? (
              <Text className="text-app-muted text-center mt-6">
                기록이 없습니다.
              </Text>
            ) : (
              <>
                {selectedAnniversaries.map((ann, i) => (
                  <AnniversaryItem
                    key={`ann-${i}`}
                    title={ann.displayTitle}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: ann.personId },
                      })
                    }
                  />
                ))}
                {selectedLogs.map((item) => (
                  <LogCard
                    key={item.log.id}
                    log={item.log}
                    onPress={() =>
                      router.push({
                        pathname: "/logs/[id]",
                        params: item.isOccurrence
                          ? {
                              id: item.log.id,
                              occurrenceDate: selectedDate!.toISOString(),
                            }
                          : { id: item.log.id },
                      })
                    }
                  />
                ))}
              </>
            )
          ) : daySections.length === 0 ? (
            <Text className="text-app-muted text-center mt-6">
              이번 달 기록이 없습니다.
            </Text>
          ) : (
            daySections.map((section) => (
              <View key={section.dateKey}>
                <Pressable
                  onPress={() => setSelectedDate(section.date)}
                  className="py-1.5 px-1 mt-2"
                >
                  <Text className="text-app-teal text-xs font-semibold tracking-[0.3px]">
                    {formatLogDate(section.date)}
                  </Text>
                </Pressable>
                {section.anniversaries.map((ann, i) => (
                  <AnniversaryItem
                    key={`ann-${section.dateKey}-${i}`}
                    title={ann.title}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: ann.personId },
                      })
                    }
                  />
                ))}
                {section.items.map((item) => (
                  <LogCard
                    key={`${section.dateKey}-${item.log.id}`}
                    log={item.log}
                    onPress={() =>
                      router.push({
                        pathname: "/logs/[id]",
                        params: item.isOccurrence
                          ? {
                              id: item.log.id,
                              occurrenceDate: section.date.toISOString(),
                            }
                          : { id: item.log.id },
                      })
                    }
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <QuickInputBar
        placeholder={`${dayjs(targetDate).format("M월 D일")}에 기록 추가`}
        value={quickTitle}
        onChange={setQuickTitle}
        onSubmit={handleQuickPress}
        bottom={inputBarBottom}
      />

      <DayDetailModal
        visible={showDayModal}
        date={selectedDate}
        items={selectedLogs}
        anniversaries={selectedAnniversaries}
        onClose={() => setShowDayModal(false)}
        onLogPress={(item) =>
          router.push({
            pathname: "/logs/[id]",
            params: item.isOccurrence
              ? { id: item.log.id, occurrenceDate: selectedDate!.toISOString() }
              : { id: item.log.id },
          })
        }
        onPersonPress={(personId) =>
          router.push({ pathname: "/persons/[id]", params: { id: personId } })
        }
      />
    </View>
  );
}
