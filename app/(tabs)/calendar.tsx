// 캘린더 탭 — 월별 캘린더 뷰 + 선택 날짜 기록/기념일 패널
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";

import { AnniversaryCard } from "@/components/calendar/AnniversaryCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import TabsHeader from "@/components/layout/TabsHeader";
import { LogCard } from "@/components/logs/LogCard";
import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { useCalendarData } from "@/hooks/useCalendarData";
import type { DayItem } from "@/hooks/useCalendarData";
import { cn } from "@/utils/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

dayjs.locale("ko");

const TODAY = dayjs().format("YYYY-MM-DD");

const CALENDAR_THEME = {
  backgroundColor: "transparent",
  calendarBackground: "transparent",
  textSectionTitleColor: "#888888",
  selectedDayBackgroundColor: "#4ECDC4",
  selectedDayTextColor: "#111111",
  todayTextColor: "#4ECDC4",
  todayBackgroundColor: "#1a3a3a",
  dayTextColor: "#e0e0e0",
  textDisabledColor: "#444444",
  dotColor: "#4ECDC4",
  selectedDotColor: "#111111",
  arrowColor: "#4ECDC4",
  disabledArrowColor: "#444444",
  monthTextColor: "#ffffff",
  indicatorColor: "#4ECDC4",
  textDayFontSize: 14,
  textMonthFontSize: 15,
  textDayHeaderFontSize: 11,
  "stylesheet.calendar.header": {
    week: {
      marginTop: 4,
      flexDirection: "row" as const,
      justifyContent: "space-around" as const,
    },
  },
};

function itemKey(item: DayItem, idx: number): string {
  if (item.type === "log") return `log-${item.data.id}`;
  if (item.type === "repeat") return `repeat-${item.data.id}-${item.virtualDate}`;
  return `ann-${item.id}-${idx}`;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(TODAY);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const { markedDates, dayItems } = useCalendarData(currentMonth, selectedDate);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  const filteredDayItems = useMemo(() => {
    if (groupFilter === "all") return dayItems;
    return dayItems.filter((item) => {
      if (item.type === "log" || item.type === "repeat")
        return item.data.groupId === groupFilter;
      return true;
    });
  }, [dayItems, groupFilter]);

  const selectedLabel = dayjs(selectedDate).format("M월 D일 (ddd)");

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader title="캘린더" searchOnPress />

      {/* 그룹 필터 칩 */}
      {allGroups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
          style={{ flexGrow: 0 }}
        >
          <Pressable
            onPress={() => setGroupFilter("all")}
            className={cn("rounded-full px-4 py-1.5", groupFilter === "all" ? "bg-app-teal" : "bg-[#222]")}
          >
            <Text className={cn("text-[13px] font-semibold", groupFilter === "all" ? "text-[#111]" : "text-[#888]")}>
              전체
            </Text>
          </Pressable>
          {allGroups.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => setGroupFilter(g.id)}
              className={cn("rounded-full px-4 py-1.5", groupFilter === g.id ? "bg-app-teal" : "bg-[#222]")}
            >
              <Text className={cn("text-[13px] font-semibold", groupFilter === g.id ? "text-[#111]" : "text-[#888]")}>
                {g.emoji ? `${g.emoji} ${g.name}` : g.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <View className="mx-4 rounded-[12px] overflow-hidden">
        <Calendar
          current={currentMonth}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => setSelectedDate(day.dateString)}
          onMonthChange={(month) => setCurrentMonth(month.dateString)}
          theme={CALENDAR_THEME}
          enableSwipeMonths
        />
      </View>

      <View className="flex-row items-center px-4 mt-3 mb-2">
        <Text className="flex-1 text-app-label text-[10px] uppercase tracking-widest">
          {selectedLabel}
        </Text>
        {filteredDayItems.length > 0 && (
          <Text className="text-app-muted text-xs">{filteredDayItems.length}개</Text>
        )}
      </View>

      <FlatList
        data={filteredDayItems}
        keyExtractor={itemKey}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          gap: 8,
        }}
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text className="text-app-muted text-sm">기록이 없습니다.</Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "log") {
            return (
              <LogCard
                log={item.data}
                onPress={() =>
                  router.push({
                    pathname: "/logs/[id]",
                    params: { id: item.data.id },
                  })
                }
              />
            );
          }
          if (item.type === "repeat") {
            return (
              <View style={{ opacity: 0.65 }}>
                <LogCard
                  log={item.data}
                  onPress={() =>
                    router.push({
                      pathname: "/logs/[id]",
                      params: {
                        id: item.data.id,
                        occurrenceDate: item.virtualDate,
                      },
                    })
                  }
                />
              </View>
            );
          }
          return (
            <AnniversaryCard
              personName={item.personName}
              title={item.title}
              dDay={item.dDay}
              isBirthday={item.isBirthday}
            />
          );
        }}
      />

      <FloatingActionButton
        onPress={() =>
          router.push({
            pathname: "/logs/new",
            params: { date: selectedDate },
          })
        }
      />
    </View>
  );
}
