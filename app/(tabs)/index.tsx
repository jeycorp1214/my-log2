// 캘린더 탭 — 월별 달력 + 날짜 선택 or 월간 전체 로그 목록
import type { InferSelectModel } from "drizzle-orm";
import { and, between, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { LogCard } from "@/components/logs/LogCard";
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
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

type Log = InferSelectModel<typeof logs>;
type LogItem = { log: Log; isOccurrence: boolean };
type DaySection = { dateKey: string; date: Date; items: LogItem[] };

export default function CalendarScreen() {
  const router = useRouter();
  const { savedDate } = useLocalSearchParams<{ savedDate?: string }>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // 기록 저장 후 해당 달로 이동
  useEffect(() => {
    if (!savedDate) return;
    const d = new Date(savedDate);
    setCurrentMonth(d);
    setSelectedDate(d);
  }, [savedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 이번 달 logDate 기준 로그
  const { data: monthLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(between(logs.logDate, monthStart, monthEnd)),
  );

  // 반복 로그: 이번 달 이전에 시작했거나 이번 달 내에 시작했고, 이번 달까지 유효한 것
  const { data: allRepeatLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          isNotNull(logs.repeatType),
          lte(logs.logDate, monthEnd),
          or(isNull(logs.repeatUntil), gte(logs.repeatUntil, monthStart)),
        ),
      ),
  );

  // 반복 occurrence 확장 (원본 날짜 제외 → monthLogs와 중복 방지)
  const repeatOccurrences = allRepeatLogs.flatMap((log) =>
    expandRepeatInMonth(log, monthStart, monthEnd)
      .filter((date) => !isSameDay(date, new Date(log.logDate)))
      .map((date) => ({ log, date })),
  );

  // 달력 마킹용 날짜 목록
  const logDates = [
    ...monthLogs.map((log) => new Date(log.logDate)),
    ...repeatOccurrences.map(({ date }) => date),
  ];

  // 월간 전체 뷰: 날짜별 섹션 그룹
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
      if (date < monthStart || date > monthEnd) continue;
      const key = toDateKey(date);
      if (!map.has(key)) map.set(key, { dateKey: key, date, items: [] });
      map.get(key)!.items.push({ log, isOccurrence });
    }

    return Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }

  // 날짜 선택 뷰: 해당 날짜 로그
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

  function openPicker() {
    setShowPicker(true);
  }

  // 날짜 탭: 선택/재탭 시 해제(전체 뷰)
  function handleSelectDate(date: Date) {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
    }
  }

  // 수평 스와이프로 월 이동
  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(nextMonth)();
      else if (e.translationX > 50) runOnJS(prevMonth)();
    });

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

  return (
    <View className="flex-1 bg-app-bg">
      {/* 월 헤더 */}
      <View className="flex-row items-center px-3 pt-14 pb-1 gap-1">
        <Pressable onPress={prevMonth} className="p-2">
          <ChevronLeft size={22} color="#e0e0e0" />
        </Pressable>
        <Pressable onPress={openPicker} className="flex-1 items-center py-2">
          <Text className="text-white text-[18px] font-semibold">
            {formatMonthYear(currentMonth)}
          </Text>
        </Pressable>
        <Pressable
          onPress={goToday}
          className="bg-app-surface rounded-[12px] px-[10px] py-[5px]"
        >
          <Text className="text-app-teal text-xs font-semibold">오늘</Text>
        </Pressable>
        <Pressable onPress={nextMonth} className="p-2">
          <ChevronRight size={22} color="#e0e0e0" />
        </Pressable>
      </View>

      {/* 디버그 정보 (개발용) */}
      {__DEV__ && (
        <View className="bg-[#2a1a1a] px-3 py-2 border-b border-[#444]">
          <Text className="text-[10px] text-app-teal font-mono font-bold">
            🔍 DEBUG
          </Text>
          <Text className="text-[10px] text-app-muted font-mono">
            월: {formatMonthYear(currentMonth)} | 범위:{" "}
            {formatLogDate(monthStart)} ~ {formatLogDate(monthEnd)}
          </Text>
          <Text className="text-[10px] text-[#888] font-mono">
            monthLogs: {monthLogs.length} | allRepeatLogs:{" "}
            {allRepeatLogs.length} | selectedDate:{" "}
            {selectedDate ? "있음" : "없음"}
          </Text>
          {monthLogs.length > 0 && (
            <View className="mt-1 pl-2 border-l border-[#666]">
              {monthLogs.slice(0, 3).map((log) => (
                <Text key={log.id} className="text-[9px] text-[#aaa] font-mono">
                  • {formatLogDate(new Date(log.logDate))} - {log.title}
                </Text>
              ))}
              {monthLogs.length > 3 && (
                <Text className="text-[9px] text-[#666] font-mono">
                  ... +{monthLogs.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* 스와이프 가능한 달력 */}
      <GestureDetector gesture={swipe}>
        <View>
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            markedDates={logDates}
            onSelectDate={handleSelectDate}
          />
        </View>
      </GestureDetector>

      {/* 리스트 헤더 */}
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

      {/* 로그 리스트 */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 96,
          gap: 8,
        }}
      >
        {selectedDate ? (
          selectedLogs.length === 0 ? (
            <Text className="text-app-muted text-center mt-6">
              기록이 없습니다.
            </Text>
          ) : (
            selectedLogs.map((item) => (
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
            ))
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

      {/* FAB — 기록 추가 */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/logs/new",
            params: { date: targetDate.toISOString() },
          })
        }
        className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-app-teal items-center justify-center shadow-lg"
        style={{ elevation: 6 }}
      >
        <Plus size={24} color="#111" />
      </Pressable>

      {/* MonthPicker 모달 */}
      <MonthPickerModal
        visible={showPicker}
        currentMonth={currentMonth}
        onSelect={(year, month) => {
          setCurrentMonth(new Date(year, month, 1));
          setSelectedDate(null);
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}
