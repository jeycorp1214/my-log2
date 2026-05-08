// 월별 달력 그리드 컴포넌트
import { WEEKDAYS } from "@/db/seed";
import { isSameDay } from "@/utils/date";
import dayjs from "dayjs";
import { Pressable, Text, View } from "react-native";

interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  markedDates: Date[];
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  markedDates,
  onSelectDate,
}: Props) {
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
    <View className="px-2">
      {/* 요일 헤더 */}
      <View className="flex-row">
        {WEEKDAYS.map((d) => (
          <Text
            key={d}
            className={`flex-1 text-center text-xs py-[6px] ${d === "일" ? "text-[#ff6b6b]" : d === "토" ? "text-app-teal" : "text-app-muted"}`}
          >
            {d}
          </Text>
        ))}
      </View>

      {/* 날짜 셀 */}
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, di) => {
            if (!day)
              return <View key={di} className="flex-1 items-center py-[2px]" />;
            const date = day.toDate();
            const isSelected = selectedDate
              ? isSameDay(date, selectedDate)
              : false;
            const isToday = isSameDay(date, new Date());
            const hasLog = markedDates.some((d) => isSameDay(d, date));
            const isWeekend = di === 0 || di === 6;

            return (
              <Pressable
                key={di}
                className="flex-1 items-center py-[2px]"
                onPress={() => onSelectDate(date)}
              >
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center ${isSelected ? "bg-app-teal" : isToday ? "border border-app-teal" : ""}`}
                >
                  <Text
                    className={`text-[14px] ${isSelected ? "text-[#111] font-bold" : isWeekend ? "text-[#aaa]" : "text-[#e0e0e0]"}`}
                  >
                    {day.date()}
                  </Text>
                  {hasLog && (
                    <View
                      className={`w-1 h-1 rounded-full mt-[1px] ${isSelected ? "bg-[#111]" : "bg-app-teal"}`}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
