// 캘린더 탭 — 월별 달력 + 선택 날짜 로그 목록
import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { and, between, isNotNull, lt, gte } from "drizzle-orm";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import dayjs from "dayjs";

import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { formatLogDate, formatMonthYear, startOfMonth, endOfMonth, isSameDay } from "@/utils/date";
import { expandRepeatInMonth } from "@/utils/repeat";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { LogCard } from "@/components/logs/LogCard";

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // 이번 달 logDate 기준 로그
  const { data: monthLogs = [] } = useLiveQuery(
    db.select().from(logs).where(between(logs.logDate, monthStart, monthEnd)),
  );

  // 이번 달 이전에 시작한 반복 로그 (repeatUntil이 이번 달 이후인 것만)
  const { data: pastRepeatLogs = [] } = useLiveQuery(
    db.select().from(logs).where(
      and(
        isNotNull(logs.repeatType),
        lt(logs.logDate, monthStart),
        gte(logs.repeatUntil, monthStart),
      ),
    ),
  );

  // 반복 로그 → 이번 달 occurrence 확장
  const repeatOccurrences = pastRepeatLogs.flatMap((log) =>
    expandRepeatInMonth(log, monthStart, monthEnd).map((date) => ({ log, date })),
  );

  // 달력 마킹용 날짜 목록
  const logDates = [
    ...monthLogs.map((log) => new Date(log.logDate)),
    ...repeatOccurrences.map(({ date }) => date),
  ];

  // 선택 날짜 로그 (일반 + 반복 occurrence)
  const selectedLogs = [
    ...monthLogs.filter((log) => isSameDay(new Date(log.logDate), selectedDate)),
    ...repeatOccurrences
      .filter(({ date }) => isSameDay(date, selectedDate))
      .map(({ log }) => log),
  ];

  function prevMonth() {
    const prev = dayjs(currentMonth).subtract(1, "month");
    setCurrentMonth(prev.toDate());
    setSelectedDate(prev.startOf("month").toDate());
  }

  function nextMonth() {
    const next = dayjs(currentMonth).add(1, "month");
    setCurrentMonth(next.toDate());
    setSelectedDate(next.startOf("month").toDate());
  }

  function goToday() {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }

  // 수평 스와이프로 월 이동
  const swipe = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -50) runOnJS(nextMonth)();
      else if (e.translationX > 50) runOnJS(prevMonth)();
    });

  return (
    <View style={styles.container}>
      {/* 월 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Pressable onPress={goToday} style={styles.monthTitleArea}>
          <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
        </Pressable>
        <Pressable onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      {/* 오늘 버튼 */}
      <View style={styles.todayRow}>
        <Pressable onPress={goToday} style={styles.todayBtn}>
          <Text style={styles.todayText}>오늘</Text>
        </Pressable>
      </View>

      {/* 스와이프 가능한 달력 */}
      <GestureDetector gesture={swipe}>
        <View>
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            markedDates={logDates}
            onSelectDate={setSelectedDate}
          />
        </View>
      </GestureDetector>

      {/* 선택 날짜 표시 */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{formatLogDate(selectedDate)}</Text>
      </View>

      <ScrollView style={styles.logList} contentContainerStyle={styles.logListContent}>
        {selectedLogs.length === 0 ? (
          <Text style={styles.emptyText}>기록이 없습니다.</Text>
        ) : (
          selectedLogs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id } })}
            />
          ))
        )}
      </ScrollView>

      {/* FAB — 기록 추가 */}
      <Pressable
        onPress={() => router.push({ pathname: "/logs/new", params: { date: selectedDate.toISOString() } })}
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 4,
  },
  navBtn: { padding: 8 },
  navText: { color: "#fff", fontSize: 24 },
  monthTitleArea: { flex: 1, alignItems: "center" },
  monthTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  todayRow: { alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 6 },
  todayBtn: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  todayText: { color: "#4ECDC4", fontSize: 12, fontWeight: "600" },
  listHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  listTitle: { color: "#ccc", fontSize: 14 },
  logList: { flex: 1 },
  logListContent: { paddingHorizontal: 16, paddingBottom: 96, gap: 8 },
  emptyText: { color: "#666", textAlign: "center", marginTop: 24 },
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
