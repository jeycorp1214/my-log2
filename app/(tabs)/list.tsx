// 리스트 탭 — 기간 필터링된 로그를 월별 섹션으로 표시 + 체크 완료 관리
import { ListEventItem } from "@/components/logs/ListEventItem";
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { type EventItem, useEventFilter } from "@/hooks/logs/use-event-filter";
import { formatMonthYear } from "@/utils/date";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { useRouter } from "expo-router";
import { SlidersHorizontal } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, SectionList, Text, View } from "react-native";

type Preset = "this-year" | "last-year" | "recent-1y" | "all" | "custom";
type CompletionFilter = "all" | "done" | "undone";
type TypeFilter = "all" | "regular" | "repeat";
type SortOrder = "oldest" | "newest";

type PresetConfig = { key: Preset; label: string };

const PRESETS: PresetConfig[] = [
  { key: "this-year", label: "올해" },
  { key: "last-year", label: "작년" },
  { key: "recent-1y", label: "최근 1년" },
  { key: "all", label: "전체" },
  { key: "custom", label: "직접 선택" },
];

const EPOCH = new Date(0);
const FAR_FUTURE = new Date(2200, 0, 1);

export default function ListScreen() {
  const router = useRouter();

  const [preset, setPreset] = useState<Preset>("this-year");
  const [customStart, setCustomStart] = useState(() =>
    dayjs().startOf("year").toDate(),
  );
  const [customEnd, setCustomEnd] = useState(() =>
    dayjs().endOf("year").toDate(),
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { start, end } = useMemo(() => {
    const now = dayjs();
    if (preset === "this-year")
      return { start: now.startOf("year").toDate(), end: now.endOf("year").toDate() };
    if (preset === "last-year") {
      const ly = now.subtract(1, "year");
      return { start: ly.startOf("year").toDate(), end: ly.endOf("year").toDate() };
    }
    if (preset === "recent-1y")
      return { start: now.subtract(1, "year").toDate(), end: now.toDate() };
    if (preset === "all") return { start: EPOCH, end: FAR_FUTURE };
    return { start: customStart, end: customEnd };
  }, [preset, customStart, customEnd]);

  const allItems = useEventFilter(start, end);

  const filtered = useMemo(() => {
    let items = allItems;
    if (completionFilter === "done")
      items = items.filter((i) => i.isRepeat || !!i.log.checkedAt);
    if (completionFilter === "undone")
      items = items.filter((i) => i.isRepeat || !i.log.checkedAt);
    if (typeFilter === "regular") items = items.filter((i) => !i.isRepeat);
    if (typeFilter === "repeat") items = items.filter((i) => i.isRepeat);
    return sortOrder === "newest" ? [...items].reverse() : items;
  }, [allItems, completionFilter, typeFilter, sortOrder]);

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

  const filterBadge = [
    completionFilter !== "all",
    typeFilter !== "all",
    sortOrder !== "oldest",
  ].filter(Boolean).length;

  async function toggleCheck(id: string, current: Date | null) {
    await db
      .update(logs)
      .set({ checkedAt: current ? null : new Date(), updatedAt: new Date() })
      .where(eq(logs.id, id));
  }

  return (
    <View className="flex-1 bg-app-bg">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-bold">리스트</Text>
        <Pressable onPress={() => setShowFilterSheet(true)} hitSlop={8} style={{ padding: 6 }}>
          <SlidersHorizontal size={22} color={filterBadge > 0 ? "#4ecdc4" : "#888"} />
          {filterBadge > 0 && (
            <View
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-app-teal items-center justify-center"
            >
              <Text style={{ color: "#111", fontSize: 10, fontWeight: "bold" }}>
                {filterBadge}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* 기간 프리셋 칩 */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={PRESETS}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setPreset(item.key)}
            className="rounded-full px-4 py-1.5"
            style={{ backgroundColor: preset === item.key ? "#4ecdc4" : "#222" }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: preset === item.key ? "#111" : "#888" }}
            >
              {item.label}
            </Text>
          </Pressable>
        )}
      />

      {/* 직접 선택 시 날짜 범위 버튼 */}
      {preset === "custom" && (
        <View className="flex-row gap-2 px-4 pb-2">
          <Pressable
            onPress={() => setShowStartPicker(true)}
            className="flex-1 bg-app-surface rounded-[10px] py-2.5 items-center"
          >
            <Text className="text-white text-[13px]">
              {dayjs(customStart).format("YYYY년 M월")}
            </Text>
            <Text className="text-app-muted text-[11px] mt-0.5">시작</Text>
          </Pressable>
          <View className="justify-center px-1">
            <Text className="text-app-muted">—</Text>
          </View>
          <Pressable
            onPress={() => setShowEndPicker(true)}
            className="flex-1 bg-app-surface rounded-[10px] py-2.5 items-center"
          >
            <Text className="text-white text-[13px]">
              {dayjs(customEnd).format("YYYY년 M월")}
            </Text>
            <Text className="text-app-muted text-[11px] mt-0.5">종료</Text>
          </Pressable>
        </View>
      )}

      {/* 요약 */}
      <View className="flex-row items-center px-5 py-2.5 border-b border-[#1e1e1e]">
        <Text className="text-app-muted text-[13px]">
          총 {totalCount}개 · 완료 {doneCount}개
        </Text>
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

      {/* 날짜 범위 피커 */}
      <MonthPickerModal
        visible={showStartPicker}
        currentMonth={customStart}
        onSelect={(year, month) => {
          setCustomStart(new Date(year, month, 1));
          setShowStartPicker(false);
        }}
        onClose={() => setShowStartPicker(false)}
      />
      <MonthPickerModal
        visible={showEndPicker}
        currentMonth={customEnd}
        onSelect={(year, month) => {
          setCustomEnd(dayjs(new Date(year, month, 1)).endOf("month").toDate());
          setShowEndPicker(false);
        }}
        onClose={() => setShowEndPicker(false)}
      />

      {/* 필터 바텀 시트 */}
      <Modal
        visible={showFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowFilterSheet(false)}
        >
          <Pressable className="bg-app-surface rounded-t-[20px] px-5 pt-5 pb-10">
            <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-5" />

            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              완료 상태
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["all", "done", "undone"] as const).map((v) => {
                const label = v === "all" ? "전체" : v === "done" ? "완료" : "미완료";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setCompletionFilter(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{ backgroundColor: completionFilter === v ? "#4ecdc4" : "#2a2a2a" }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: completionFilter === v ? "#111" : "#888" }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              기록 유형
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["all", "regular", "repeat"] as const).map((v) => {
                const label = v === "all" ? "전체" : v === "regular" ? "일반" : "반복";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setTypeFilter(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{ backgroundColor: typeFilter === v ? "#4ecdc4" : "#2a2a2a" }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: typeFilter === v ? "#111" : "#888" }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              정렬
            </Text>
            <View className="flex-row gap-2">
              {(["oldest", "newest"] as const).map((v) => {
                const label = v === "oldest" ? "오래된순" : "최신순";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setSortOrder(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{ backgroundColor: sortOrder === v ? "#4ecdc4" : "#2a2a2a" }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: sortOrder === v ? "#111" : "#888" }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
