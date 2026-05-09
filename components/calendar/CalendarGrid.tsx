// 월별 달력 그리드 컴포넌트 — 컴팩트(점 마킹) / 보드(이벤트 제목) 두 모드 지원
import { WEEKDAYS } from "@/db/seed";
import { isSameDay } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { Pressable, Text, View } from "react-native";

type BoardItem = { date: Date; title: string; isRepeat: boolean; type?: "anniversary" };

interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  markedDates: Date[];
  onSelectDate: (date: Date) => void;
  mode?: "compact" | "board";
  boardItems?: BoardItem[];
  anniversaryDates?: Date[];
}

export function CalendarGrid({
  currentMonth,
  selectedDate,
  markedDates,
  onSelectDate,
  mode = "compact",
  boardItems = [],
  anniversaryDates = [],
}: Props) {
  const start = dayjs(currentMonth).startOf("month");
  const daysInMonth = start.daysInMonth();
  const startDow = start.day();

  const cells: (dayjs.Dayjs | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => start.add(i, "day")),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (dayjs.Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = new Date();

  return (
    <View className="px-2">
      {/* 요일 헤더 */}
      <View className="flex-row">
        {WEEKDAYS.map((d) => (
          <Text
            key={d}
            className={cn(
              "flex-1 text-center text-xs py-[6px]",
              d === "일" ? "text-[#ff6b6b]" : d === "토" ? "text-app-teal" : "text-app-muted",
            )}
          >
            {d}
          </Text>
        ))}
      </View>

      {mode === "compact" ? (
        // 컴팩트 모드: 점 마킹
        weeks.map((week, wi) => (
          <View key={wi} className="flex-row">
            {week.map((day, di) => {
              if (!day)
                return <View key={di} className="flex-1 items-center py-[2px]" />;
              const date = day.toDate();
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
              const isToday = isSameDay(date, today);
              const hasLog = markedDates.some((d) => isSameDay(d, date));
              const hasAnniversary = anniversaryDates.some((d) => isSameDay(d, date));
              const isWeekend = di === 0 || di === 6;

              return (
                <Pressable
                  key={di}
                  className="flex-1 items-center py-[2px]"
                  onPress={() => onSelectDate(date)}
                >
                  <View
                    className={cn(
                      "w-9 h-9 rounded-full items-center justify-center",
                      isSelected ? "bg-app-teal" : isToday ? "border border-app-teal" : null,
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[14px]",
                        isSelected ? "text-[#111] font-bold" : isWeekend ? "text-[#aaa]" : "text-[#e0e0e0]",
                      )}
                    >
                      {day.date()}
                    </Text>
                    {(hasLog || hasAnniversary) && (
                      <View className="flex-row gap-[2px] mt-[1px]">
                        {hasLog && (
                          <View
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: isSelected ? "#111" : "#4ecdc4" }}
                          />
                        )}
                        {hasAnniversary && (
                          <View
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: isSelected ? "#111" : "#c084fc" }}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))
      ) : (
        // 보드 모드: 셀에 이벤트 제목 표시
        <View style={{ gap: 1, backgroundColor: "#1e1e1e" }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: "row", gap: 1 }}>
              {week.map((day, di) => {
                if (!day)
                  return (
                    <View
                      key={di}
                      className="flex-1 bg-app-bg"
                      style={{ minHeight: 68 }}
                    />
                  );
                const date = day.toDate();
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isToday = isSameDay(date, today);
                const isWeekend = di === 0 || di === 6;
                const dayItems = boardItems.filter((item) =>
                  isSameDay(item.date, date),
                );
                const overflowCount = Math.max(0, dayItems.length - 2);

                return (
                  <Pressable
                    key={di}
                    className="flex-1 p-1"
                    style={{
                      minHeight: 68,
                      backgroundColor: isSelected ? "#142218" : "#111",
                    }}
                    onPress={() => onSelectDate(date)}
                  >
                    <Text
                      className="text-[12px] mb-1"
                      style={{
                        color: isToday
                          ? "#4ecdc4"
                          : isWeekend
                            ? "#888"
                            : "#ccc",
                        fontWeight: isToday || isSelected ? "700" : "500",
                      }}
                    >
                      {day.date()}
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
                          className="rounded-[3px] px-1 mb-[2px]"
                          style={{ backgroundColor: bgColor }}
                        >
                          <Text
                            numberOfLines={1}
                            className="text-[10px]"
                            style={{ color: textColor }}
                          >
                            {item.title}
                          </Text>
                        </View>
                      );
                    })}

                    {overflowCount > 0 && (
                      <Text className="text-[9px] text-app-muted">
                        +{overflowCount}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
