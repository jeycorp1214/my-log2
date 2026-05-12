// 홈 탭 — 캘린더 메인 뷰 (compact/board 모드)
import { FloatingActionButton } from "@/components/FloatingActionButton";
import TabsHeader from "@/components/layout/TabsHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ListEventItem } from "@/components/logs/ListEventItem";
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { db } from "@/db/client";
import { groups, logs } from "@/db/schema";
import { type EventItem, useEventFilter } from "@/hooks/logs/use-event-filter";
import {
  type AnniversaryBoardItem,
  useAnniversariesInMonth,
} from "@/hooks/persons/use-anniversaries-in-month";
import { toDateKey } from "@/utils/date";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { LayoutGrid, List } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

dayjs.locale("ko");

type DayItem = EventItem | AnniversaryBoardItem;

export default function HomeScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(() =>
    dayjs().startOf("month").toDate(),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"compact" | "board">("compact");

  const start = useMemo(
    () => dayjs(currentMonth).startOf("month").toDate(),
    [currentMonth],
  );
  const end = useMemo(
    () => dayjs(currentMonth).endOf("month").toDate(),
    [currentMonth],
  );

  const events = useEventFilter(start, end);
  const { anniversaryBoardItems } = useAnniversariesInMonth(start, end);
  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  const selectedDayItems = useMemo<DayItem[]>(() => {
    if (!selectedDate) return [];
    const key = toDateKey(selectedDate);
    const dayEvents = events.filter((e) => toDateKey(e.displayDate) === key);
    const dayAnns = anniversaryBoardItems.filter(
      (a) => toDateKey(a.date) === key,
    );
    return [...dayAnns, ...dayEvents];
  }, [events, anniversaryBoardItems, selectedDate]);

  async function toggleCheck(id: string, current: Date | null) {
    await db
      .update(logs)
      .set({ checkedAt: current ? null : new Date(), updatedAt: new Date() })
      .where(eq(logs.id, id));
  }

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="캘린더"
        searchOnPress={true}
        CustomRight={
          <Pressable
            className="p-2"
            onPress={() =>
              setViewMode((m) => (m === "compact" ? "board" : "compact"))
            }
          >
            {viewMode === "compact" ? (
              <LayoutGrid size={22} color="#888" />
            ) : (
              <List size={22} color="#4ecdc4" />
            )}
          </Pressable>
        }
      />

      <CalendarView
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        events={events}
        anniversaries={anniversaryBoardItems}
        groups={allGroups}
        mode={viewMode}
        onSelectDate={setSelectedDate}
        onMonthChange={(date) => {
          setCurrentMonth(dayjs(date).startOf("month").toDate());
          setSelectedDate(null);
        }}
      />

      {/* 날짜 상세 바텀 시트 */}
      <Modal
        visible={selectedDate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          onPress={() => setSelectedDate(null)}
        >
          <Pressable
            className="bg-app-surface rounded-t-[20px]"
            style={{ maxHeight: "65%" }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 bg-[#444] rounded-full self-center mt-3 mb-1" />
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-white text-[16px] font-bold">
                {selectedDate && dayjs(selectedDate).format("M월 D일 (ddd)")}
              </Text>
              <Pressable
                onPress={() => {
                  setSelectedDate(null);
                  router.push({
                    pathname: "/logs/new",
                    params: { date: selectedDate ? toDateKey(selectedDate) : undefined },
                  });
                }}
                className="bg-app-teal rounded-full px-3 py-1.5"
              >
                <Text className="text-[#111] text-[13px] font-semibold">+ 기록 추가</Text>
              </Pressable>
            </View>

            <FlatList<DayItem>
              data={selectedDayItems}
              keyExtractor={(item, idx) =>
                "type" in item && item.type === "anniversary"
                  ? `ann-${item.personId}-${item.date.getTime()}`
                  : `evt-${(item as EventItem).key ?? idx}`
              }
              renderItem={({ item }) => {
                if ("type" in item && item.type === "anniversary") {
                  return (
                    <View className="px-4">
                      <AnniversaryItem
                        title={item.displayTitle}
                        onPress={() => {
                          setSelectedDate(null);
                          router.push({ pathname: "/persons/[id]", params: { id: item.personId } });
                        }}
                      />
                    </View>
                  );
                }
                const eventItem = item as EventItem;
                return (
                  <ListEventItem
                    item={eventItem}
                    onToggleCheck={toggleCheck}
                    onPress={() => {
                      setSelectedDate(null);
                      router.push({ pathname: "/logs/[id]", params: { id: eventItem.log.id } });
                    }}
                  />
                );
              }}
              ListEmptyComponent={
                <Text className="text-app-muted text-center mt-8 mb-8 text-[14px]">
                  기록이 없습니다.
                </Text>
              }
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <FloatingActionButton onPress={() => router.push("/logs/new")} />
    </View>
  );
}
