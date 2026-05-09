// 리스트 탭 — 기간 필터링된 로그를 월별 섹션으로 표시 + 체크 완료 관리
import { ListEventItem } from "@/components/logs/ListEventItem";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { type EventItem, useEventFilter } from "@/hooks/logs/use-event-filter";
import { formatMonthYear } from "@/utils/date";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, SectionList, Text, View } from "react-native";

type Preset = { label: string; months: number | null };

const PRESETS: Preset[] = [
  { label: "1개월", months: 1 },
  { label: "3개월", months: 3 },
  { label: "6개월", months: 6 },
  { label: "1년", months: 12 },
  { label: "전체", months: null },
];

const EPOCH = new Date(0);
const FAR_FUTURE = new Date(2200, 0, 1);

export default function ListScreen() {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState(1); // 기본값: 3개월
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const today = useMemo(() => new Date(), []);

  const { start, end } = useMemo(() => {
    const preset = PRESETS[activePreset];
    if (preset.months === null) {
      return { start: EPOCH, end: FAR_FUTURE };
    }
    return {
      start: today,
      end: dayjs(today).add(preset.months, "month").toDate(),
    };
  }, [activePreset, today]);

  const allItems = useEventFilter(start, end);

  const filtered = useMemo(
    () =>
      showIncompleteOnly
        ? allItems.filter((item) => item.isRepeat || !item.log.checkedAt)
        : allItems,
    [allItems, showIncompleteOnly],
  );

  const sections = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const item of filtered) {
      const key = formatMonthYear(item.displayDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const regularItems = filtered.filter((i) => !i.isRepeat);
  const totalCount = regularItems.length;
  const doneCount = regularItems.filter((i) => !!i.log.checkedAt).length;

  async function toggleCheck(id: string, current: Date | null) {
    await db
      .update(logs)
      .set({ checkedAt: current ? null : new Date(), updatedAt: new Date() })
      .where(eq(logs.id, id));
  }

  return (
    <View className="flex-1 bg-app-bg">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-bold">리스트</Text>
      </View>

      {/* 기간 필터 칩 */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={PRESETS}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setActivePreset(index)}
            className="rounded-full px-4 py-1.5"
            style={{
              backgroundColor: activePreset === index ? "#4ecdc4" : "#222",
            }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: activePreset === index ? "#111" : "#888" }}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* 요약 + 미완료만 토글 */}
      <View className="flex-row items-center justify-between px-5 py-2.5 border-b border-[#1e1e1e]">
        <Text className="text-app-muted text-[13px]">
          총 {totalCount}개 · 완료 {doneCount}개
        </Text>
        <Pressable
          onPress={() => setShowIncompleteOnly(!showIncompleteOnly)}
          className="rounded-full px-3 py-1"
          style={{
            backgroundColor: showIncompleteOnly ? "#1a3a2e" : "#222",
          }}
        >
          <Text
            className="text-[12px] font-semibold"
            style={{ color: showIncompleteOnly ? "#4ecdc4" : "#777" }}
          >
            미완료만
          </Text>
        </Pressable>
      </View>

      {/* 월별 섹션 리스트 */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        renderSectionHeader={({ section }) => (
          <View className="bg-[#111] px-5 py-2">
            <Text className="text-app-dim text-[13px] font-semibold">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ListEventItem
            item={item}
            onToggleCheck={toggleCheck}
            onPress={() =>
              router.push({ pathname: "/logs/[id]", params: { id: item.log.id } })
            }
          />
        )}
        ListEmptyComponent={
          <Text className="text-app-muted text-center mt-16 text-[14px]">
            해당 기간에 기록이 없습니다.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        stickySectionHeadersEnabled
      />
    </View>
  );
}
