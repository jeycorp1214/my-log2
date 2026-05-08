// 캘린더 탭 — 월별 달력 + 날짜 선택 or 월간 전체 로그 목록
import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { and, between, isNotNull, isNull, or, lte, gte } from "drizzle-orm";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";

import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { formatLogDate, formatMonthYear, startOfMonth, endOfMonth, isSameDay } from "@/utils/date";
import { expandRepeatInMonth } from "@/utils/repeat";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { LogCard } from "@/components/logs/LogCard";

type Log = InferSelectModel<typeof logs>;
type DaySection = { dateKey: string; date: Date; items: Log[] };

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 이번 달 logDate 기준 로그
  const { data: monthLogs = [] } = useLiveQuery(
    db.select().from(logs).where(between(logs.logDate, monthStart, monthEnd)),
  );

  // 반복 로그: 이번 달 이전에 시작했거나 이번 달 내에 시작했고, 이번 달까지 유효한 것
  // (repeatUntil IS NULL → 영구, OR repeatUntil >= monthStart)
  const { data: allRepeatLogs = [] } = useLiveQuery(
    db.select().from(logs).where(
      and(
        isNotNull(logs.repeatType),
        lte(logs.logDate, monthEnd),
        or(
          isNull(logs.repeatUntil),
          gte(logs.repeatUntil, monthStart),
        ),
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

    const allItems: { log: Log; date: Date }[] = [
      ...monthLogs.map((log) => ({ log, date: new Date(log.logDate) })),
      ...repeatOccurrences,
    ];

    for (const { log, date } of allItems) {
      const key = dayjs(date).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, { dateKey: key, date, items: [] });
      map.get(key)!.items.push(log);
    }

    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // 날짜 선택 뷰: 해당 날짜 로그
  const selectedLogs = selectedDate
    ? [
        ...monthLogs.filter((log) => isSameDay(new Date(log.logDate), selectedDate)),
        ...repeatOccurrences
          .filter(({ date }) => isSameDay(date, selectedDate))
          .map(({ log }) => log),
      ]
    : [];

  function prevMonth() {
    const prev = dayjs(currentMonth).subtract(1, "month");
    setCurrentMonth(prev.toDate());
    setSelectedDate(null); // 월 이동 시 날짜 선택 해제 → 월간 전체 뷰
  }

  function nextMonth() {
    const next = dayjs(currentMonth).add(1, "month");
    setCurrentMonth(next.toDate());
    setSelectedDate(null);
  }

  function goToday() {
    setCurrentMonth(new Date());
    setSelectedDate(new Date()); // 오늘 날짜 선택
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
  const targetDate = selectedDate ?? new Date();

  return (
    <View style={styles.container}>
      {/* 월 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <View style={styles.monthTitleArea}>
          <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
        </View>
        <Pressable onPress={goToday} style={styles.todayBtn}>
          <Text style={styles.todayText}>오늘</Text>
        </Pressable>
        <Pressable onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

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
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {selectedDate ? formatLogDate(selectedDate) : `${formatMonthYear(currentMonth)} 전체`}
        </Text>
        {selectedDate && (
          <Pressable onPress={() => setSelectedDate(null)} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>전체보기</Text>
          </Pressable>
        )}
      </View>

      {/* 로그 리스트 */}
      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {selectedDate ? (
          // 날짜 선택 뷰
          selectedLogs.length === 0 ? (
            <Text style={styles.emptyText}>기록이 없습니다.</Text>
          ) : (
            selectedLogs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id } })}
              />
            ))
          )
        ) : (
          // 월간 전체 뷰 (날짜별 섹션)
          daySections.length === 0 ? (
            <Text style={styles.emptyText}>이번 달 기록이 없습니다.</Text>
          ) : (
            daySections.map((section) => (
              <View key={section.dateKey}>
                <Pressable onPress={() => setSelectedDate(section.date)} style={styles.sectionDateRow}>
                  <Text style={styles.sectionDate}>{formatLogDate(section.date)}</Text>
                </Pressable>
                {section.items.map((log) => (
                  <LogCard
                    key={`${section.dateKey}-${log.id}`}
                    log={log}
                    onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id } })}
                  />
                ))}
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* FAB — 기록 추가 */}
      <Pressable
        onPress={() =>
          router.push({ pathname: "/logs/new", params: { date: targetDate.toISOString() } })
        }
        style={styles.fab}
      >
        <Plus size={24} color="#111" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 56,
    paddingBottom: 4,
    gap: 4,
  },
  navBtn: { padding: 8 },
  navText: { color: "#fff", fontSize: 24 },
  monthTitleArea: { flex: 1, alignItems: "center" },
  monthTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  todayBtn: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  todayText: { color: "#4ECDC4", fontSize: 12, fontWeight: "600" },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  listTitle: { color: "#ccc", fontSize: 14, fontWeight: "600" },
  clearBtn: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clearBtnText: { color: "#4ECDC4", fontSize: 12 },
  logList: { flex: 1 },
  logListContent: { paddingHorizontal: 16, paddingBottom: 96, gap: 8 },
  emptyText: { color: "#666", textAlign: "center", marginTop: 24 },
  sectionDateRow: { paddingVertical: 6, paddingHorizontal: 4, marginTop: 8 },
  sectionDate: { color: "#4ECDC4", fontSize: 12, fontWeight: "600", letterSpacing: 0.3 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4ECDC4",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
