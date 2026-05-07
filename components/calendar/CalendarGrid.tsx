// 월별 달력 그리드 컴포넌트
import { View, Text, Pressable, StyleSheet } from "react-native";
import dayjs from "dayjs";
import { isSameDay } from "@/utils/date";

interface Props {
  currentMonth: Date;
  selectedDate: Date;
  markedDates: Date[];
  onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function CalendarGrid({ currentMonth, selectedDate, markedDates, onSelectDate }: Props) {
  const start = dayjs(currentMonth).startOf("month");
  const daysInMonth = start.daysInMonth();
  const startDow = start.day(); // 0=일

  const cells: (dayjs.Dayjs | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => start.add(i, "day")),
  ];

  // 6주 맞추기
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (dayjs.Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.container}>
      {/* 요일 헤더 */}
      <View style={styles.row}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekday, d === "일" && styles.sunday, d === "토" && styles.saturday]}>
            {d}
          </Text>
        ))}
      </View>

      {/* 날짜 셀 */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;
            const date = day.toDate();
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            const hasLog = markedDates.some((d) => isSameDay(d, date));
            const isWeekend = di === 0 || di === 6;

            return (
              <Pressable key={di} style={styles.cell} onPress={() => onSelectDate(date)}>
                <View style={[styles.dayInner, isSelected && styles.selected, isToday && !isSelected && styles.today]}>
                  <Text style={[styles.dayText, isWeekend && styles.weekendText, isSelected && styles.selectedText]}>
                    {day.date()}
                  </Text>
                  {hasLog && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8 },
  row: { flexDirection: "row" },
  weekday: { flex: 1, textAlign: "center", color: "#666", fontSize: 12, paddingVertical: 6 },
  sunday: { color: "#ff6b6b" },
  saturday: { color: "#4ECDC4" },
  cell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayInner: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  selected: { backgroundColor: "#4ECDC4" },
  today: { borderWidth: 1, borderColor: "#4ECDC4" },
  dayText: { color: "#e0e0e0", fontSize: 14 },
  weekendText: { color: "#aaa" },
  selectedText: { color: "#111", fontWeight: "700" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#4ECDC4", marginTop: 1 },
  dotSelected: { backgroundColor: "#111" },
});
