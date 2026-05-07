// 캘린더 탭 — 월별 달력 + 선택 날짜 로그 목록
import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { between } from "drizzle-orm";
import dayjs from "dayjs";

import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { formatLogDate, formatMonthYear, startOfMonth, endOfMonth, isSameDay } from "@/utils/date";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { LogCard } from "@/components/logs/LogCard";

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: monthLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(between(logs.logDate, monthStart, monthEnd)),
  );

  const selectedLogs = monthLogs.filter((log) =>
    isSameDay(new Date(log.logDate), selectedDate),
  );

  const logDates = monthLogs.map((log) => new Date(log.logDate));

  function prevMonth() {
    setCurrentMonth(dayjs(currentMonth).subtract(1, "month").toDate());
  }

  function nextMonth() {
    setCurrentMonth(dayjs(currentMonth).add(1, "month").toDate());
  }

  return (
    <View style={styles.container}>
      {/* 월 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
        <Pressable onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>

      {/* 달력 */}
      <CalendarGrid
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        markedDates={logDates}
        onSelectDate={setSelectedDate}
      />

      {/* 선택 날짜 로그 목록 */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{formatLogDate(selectedDate)}</Text>
        <Pressable
          onPress={() => router.push({ pathname: "/logs/new", params: { date: selectedDate.toISOString() } })}
          style={styles.addBtn}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  navBtn: { padding: 8 },
  navText: { color: "#fff", fontSize: 24 },
  monthTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  listTitle: { color: "#ccc", fontSize: 14 },
  addBtn: { backgroundColor: "#4ECDC4", borderRadius: 20, padding: 6 },
  logList: { flex: 1 },
  logListContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  emptyText: { color: "#666", textAlign: "center", marginTop: 24 },
});
