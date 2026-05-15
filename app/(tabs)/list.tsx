// 리스트 탭 — 기간 필터링된 로그를 월별 섹션으로 표시 + 체크 완료 관리
import TabsHeader from "@/components/layout/TabsHeader";
import { ListEventItem } from "@/components/logs/ListEventItem";
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { db } from "@/db/client";
import { groups, logPersons, logs } from "@/db/schema";
import { type EventItem, useEventFilter } from "@/hooks/logs/use-event-filter";
import {
  type AnniversaryBoardItem,
  useAnniversariesInMonth,
} from "@/hooks/persons/use-anniversaries-in-month";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { formatMonthYear } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from "react-native";

type Preset = "this-week" | "this-month" | "recent-3m" | "custom";
type CompletionFilter = "all" | "done" | "undone";
type TypeFilter = "all" | "regular" | "repeat";
type PersonFilter = "all" | "yes" | "no";
type SortOrder = "oldest" | "newest";

type PresetConfig = { key: Preset; label: string };
type SectionData = EventItem | AnniversaryBoardItem;

const PRESETS: PresetConfig[] = [
  { key: "this-week", label: "이번 주" },
  { key: "this-month", label: "이번 달" },
  { key: "recent-3m", label: "최근 3개월" },
  { key: "custom", label: "직접 선택" },
];

export default function ListScreen() {
  const router = useRouter();

  const { prefs, setListPrefs } = useTabPreferences();
  const preset = prefs.list.preset as Preset;
  const setPreset = (v: Preset) => setListPrefs({ preset: v });
  const [customStart, setCustomStart] = useState(() =>
    dayjs().startOf("month").toDate(),
  );
  const [customEnd, setCustomEnd] = useState(() =>
    dayjs().endOf("month").toDate(),
  );
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const completionFilter = prefs.list.completionFilter as CompletionFilter;
  const setCompletionFilter = (v: CompletionFilter) =>
    setListPrefs({ completionFilter: v });
  const typeFilter = prefs.list.typeFilter as TypeFilter;
  const setTypeFilter = (v: TypeFilter) => setListPrefs({ typeFilter: v });
  const sortOrder = prefs.list.sortOrder as SortOrder;
  const setSortOrder = (v: SortOrder) => setListPrefs({ sortOrder: v });
  const groupFilter = prefs.list.groupFilter;
  const setGroupFilter = (v: string) => setListPrefs({ groupFilter: v });
  const personFilter = prefs.list.personFilter as PersonFilter;
  const setPersonFilter = (v: PersonFilter) =>
    setListPrefs({ personFilter: v });
  const showAnniversaries = prefs.list.showAnniversaries;
  const setShowAnniversaries = (v: boolean) =>
    setListPrefs({ showAnniversaries: v });
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  const { data: linkedLogRows = [] } = useLiveQuery(
    db.selectDistinct({ logId: logPersons.logId }).from(logPersons),
  );
  const linkedLogIdSet = useMemo(
    () => new Set(linkedLogRows.map((r) => r.logId)),
    [linkedLogRows],
  );

  const { start, end } = useMemo(() => {
    const now = dayjs();
    if (preset === "this-week")
      return {
        start: now.startOf("week").toDate(),
        end: now.endOf("week").toDate(),
      };
    if (preset === "this-month")
      return {
        start: now.startOf("month").toDate(),
        end: now.endOf("month").toDate(),
      };
    if (preset === "recent-3m")
      return { start: now.subtract(3, "month").toDate(), end: now.toDate() };
    return { start: customStart, end: customEnd };
  }, [preset, customStart, customEnd]);

  const allItems = useEventFilter(start, end);
  const { anniversaryBoardItems } = useAnniversariesInMonth(start, end);

  const filtered = useMemo(() => {
    let items = allItems;
    if (completionFilter === "done")
      items = items.filter((i) => i.isRepeat || !!i.log.checkedAt);
    if (completionFilter === "undone")
      items = items.filter((i) => i.isRepeat || !i.log.checkedAt);
    if (typeFilter === "regular") items = items.filter((i) => !i.isRepeat);
    if (typeFilter === "repeat") items = items.filter((i) => i.isRepeat);
    if (groupFilter !== "all")
      items = items.filter((i) => i.log.groupId === groupFilter);
    if (personFilter === "yes")
      items = items.filter((i) => linkedLogIdSet.has(i.log.id));
    if (personFilter === "no")
      items = items.filter((i) => !linkedLogIdSet.has(i.log.id));
    return sortOrder === "newest" ? [...items].reverse() : items;
  }, [
    allItems,
    completionFilter,
    typeFilter,
    groupFilter,
    personFilter,
    sortOrder,
    linkedLogIdSet,
  ]);

  const sections = useMemo(() => {
    const map = new Map<string, { date: Date; data: SectionData[] }>();

    for (const item of filtered) {
      const key = formatMonthYear(item.displayDate);
      if (!map.has(key)) map.set(key, { date: item.displayDate, data: [] });
      map.get(key)!.data.push(item);
    }

    if (showAnniversaries) {
      for (const ann of anniversaryBoardItems) {
        const key = formatMonthYear(ann.date);
        if (!map.has(key)) map.set(key, { date: ann.date, data: [] });
        map.get(key)!.data.push(ann);
      }
    }

    return Array.from(map.values())
      .sort((a, b) =>
        sortOrder === "newest"
          ? b.date.getTime() - a.date.getTime()
          : a.date.getTime() - b.date.getTime(),
      )
      .map(({ date, data }) => ({ title: formatMonthYear(date), data }));
  }, [filtered, showAnniversaries, anniversaryBoardItems, sortOrder]);

  const regularItems = filtered.filter((i) => !i.isRepeat);
  const totalCount = regularItems.length;
  const doneCount = regularItems.filter((i) => !!i.log.checkedAt).length;

  const filterBadge = [
    completionFilter !== "all",
    typeFilter !== "all",
    sortOrder !== "oldest",
    groupFilter !== "all",
    personFilter !== "all",
    showAnniversaries,
  ].filter(Boolean).length;

  async function toggleCheck(id: string, current: Date | null) {
    await db
      .update(logs)
      .set({ checkedAt: current ? null : new Date(), updatedAt: new Date() })
      .where(eq(logs.id, id));
  }

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="리스트"
        slidersOnPress={() => setShowFilterSheet(true)}
        slidersActive={filterBadge > 0}
      />

      {/* 기간 프리셋 칩 */}
      <View className="h-11">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PRESETS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 8,
            paddingBottom: 8,
          }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setPreset(item.key)}
              className={cn(
                "rounded-full px-4 py-1.5",
                preset === item.key ? "bg-app-teal" : "bg-[#222]",
              )}
            >
              <Text
                className={cn(
                  "text-[13px] font-semibold",
                  preset === item.key ? "text-[#111]" : "text-[#888]",
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

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
        keyExtractor={(item, idx) =>
          "type" in item && item.type === "anniversary"
            ? `ann-${item.personId}-${item.date.getTime()}`
            : ((item as EventItem).key ?? String(idx))
        }
        renderSectionHeader={({ section }) => (
          <View className="bg-[#111] px-5 py-2">
            <Text className="text-app-dim text-[13px] font-semibold">
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          if ("type" in item && item.type === "anniversary") {
            return (
              <View className="px-4">
                <AnniversaryItem
                  title={item.displayTitle}
                  date={item.date}
                  onPress={() =>
                    router.push({
                      pathname: "/persons/[id]",
                      params: { id: item.personId },
                    })
                  }
                />
              </View>
            );
          }
          const eventItem = item as EventItem;
          return (
            <ListEventItem
              item={eventItem}
              onToggleCheck={toggleCheck}
              onPress={() =>
                router.push({
                  pathname: "/logs/[id]",
                  params: { id: eventItem.log.id },
                })
              }
            />
          );
        }}
        ListEmptyComponent={
          <Text className="text-app-muted text-center mt-16 text-[14px]">
            해당 기간에 기록이 없습니다.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        stickySectionHeadersEnabled
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

            {/* 완료 상태 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              완료 상태
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["all", "done", "undone"] as const).map((v) => {
                const label =
                  v === "all" ? "전체" : v === "done" ? "완료" : "미완료";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setCompletionFilter(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{
                      backgroundColor:
                        completionFilter === v ? "#4ecdc4" : "#2a2a2a",
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{
                        color: completionFilter === v ? "#111" : "#888",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 기록 유형 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              기록 유형
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["all", "regular", "repeat"] as const).map((v) => {
                const label =
                  v === "all" ? "전체" : v === "regular" ? "일반" : "반복";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setTypeFilter(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{
                      backgroundColor: typeFilter === v ? "#4ecdc4" : "#2a2a2a",
                    }}
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

            {/* 그룹 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              그룹
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setGroupFilter("all")}
                className="rounded-[10px] px-4 py-2.5"
                style={{
                  backgroundColor:
                    groupFilter === "all" ? "#4ecdc4" : "#2a2a2a",
                }}
              >
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: groupFilter === "all" ? "#111" : "#888" }}
                >
                  전체
                </Text>
              </Pressable>
              {allGroups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => setGroupFilter(g.id)}
                  className="rounded-[10px] px-4 py-2.5"
                  style={{
                    backgroundColor:
                      groupFilter === g.id ? "#4ecdc4" : "#2a2a2a",
                  }}
                >
                  <Text
                    className="text-[13px] font-semibold"
                    style={{ color: groupFilter === g.id ? "#111" : "#888" }}
                  >
                    {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* 관련 인물 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              관련 인물
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["all", "yes", "no"] as const).map((v) => {
                const label =
                  v === "all" ? "전체" : v === "yes" ? "있음" : "없음";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setPersonFilter(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{
                      backgroundColor:
                        personFilter === v ? "#4ecdc4" : "#2a2a2a",
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: personFilter === v ? "#111" : "#888" }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 정렬 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              정렬
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["oldest", "newest"] as const).map((v) => {
                const label = v === "oldest" ? "오래된순" : "최신순";
                return (
                  <Pressable
                    key={v}
                    onPress={() => setSortOrder(v)}
                    className="flex-1 rounded-[10px] py-2.5 items-center"
                    style={{
                      backgroundColor: sortOrder === v ? "#4ecdc4" : "#2a2a2a",
                    }}
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

            {/* 기념일 표시 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              기념일
            </Text>
            <Pressable
              onPress={() => setShowAnniversaries(!showAnniversaries)}
              className="flex-row items-center justify-between rounded-[10px] px-4 py-3"
              style={{ backgroundColor: "#2a2a2a" }}
            >
              <Text className="text-[13px]" style={{ color: "#ccc" }}>
                기념일 함께 표시
              </Text>
              <View
                className="w-12 h-6 rounded-full justify-center"
                style={{ backgroundColor: showAnniversaries ? "#7c3aed" : "#444" }}
              >
                <View
                  className="w-5 h-5 rounded-full bg-white"
                  style={showAnniversaries ? { marginLeft: "auto", marginRight: 2 } : { marginLeft: 2 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
