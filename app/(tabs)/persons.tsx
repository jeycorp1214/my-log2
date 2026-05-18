// 프로필 목록 탭 — 프로필 리스트 / 기념일 리스트 모드 전환 + 필터/정렬
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import TabsHeader from "@/components/layout/TabsHeader";
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { PersonCard } from "@/components/persons/PersonCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import {
  type AnniversaryBoardItem,
  useAnniversariesInMonth,
} from "@/hooks/persons/use-anniversaries-in-month";
import { usePersonsWithGroups } from "@/hooks/persons/use-persons-with-groups";
import { useIsFocused } from "@/hooks/use-is-focused";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { formatLogDate } from "@/utils/date";
import { parseTags } from "@/utils/person";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from "react-native";

type TabMode = "persons" | "anniversary";
type AnnPreset =
  | "this-week"
  | "this-month"
  | "recent-3m"
  | "recent-6m"
  | "recent-1y"
  | "custom";
type SortOrder = "name-asc" | "age-asc" | "last-contact-asc";
type MbtiFilter = "all" | "yes" | "no";
type OverdueFilter = "all" | "overdue";

type Person = {
  id: number;
  name: string;
  birthDate?: string | null;
  mbti?: string | null;
  groupId: number;
  isPinned: boolean;
  tags?: string | null;
  metAt?: string | null;
  contactInterval?: number | null;
  createdAt: Date;
};

const ANN_PRESETS: { key: AnnPreset; label: string }[] = [
  { key: "this-week", label: "이번 주" },
  { key: "this-month", label: "이번 달" },
  { key: "recent-3m", label: "최근 3개월" },
  { key: "recent-6m", label: "최근 6개월" },
  { key: "recent-1y", label: "최근 1년" },
  { key: "custom", label: "직접 선택" },
];

function sortPersons<T extends Person>(
  list: T[],
  order: SortOrder,
  lastLogDateMap?: Map<number, Date>,
): T[] {
  if (order === "name-asc")
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  if (order === "last-contact-asc") {
    return [...list].sort((a, b) => {
      const da = lastLogDateMap?.get(a.id) ?? null;
      const db_ = lastLogDateMap?.get(b.id) ?? null;
      if (!da && !db_) return 0;
      if (!da) return -1; // 기록 없음 = 연락 가장 오래됨 → 맨 앞
      if (!db_) return 1;
      return da.getTime() - db_.getTime();
    });
  }
  return [...list].sort((a, b) => {
    const da = a.birthDate ?? null;
    const db_ = b.birthDate ?? null;
    if (!da && !db_) return 0;
    if (!da) return 1;
    if (!db_) return -1;
    return da < db_ ? -1 : da > db_ ? 1 : 0;
  });
}

export default function PersonsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { allPersons, groupedPersons, ungrouped, lastLogDateMap } =
    usePersonsWithGroups();

  const [tabMode, setTabMode] = useState<TabMode>("persons");
  const [quickName, setQuickName] = useState("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [nameQuery, setNameQuery] = useState("");

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );
  const groupMap = useMemo(
    () => new Map(allGroups.map((g) => [g.id, g])),
    [allGroups],
  );

  // ── 프로필 모드 상태 ─────────────────────────────────────
  const { prefs, setPersonsPrefs } = useTabPreferences();
  const sortOrder = prefs.persons.sortOrder as SortOrder;
  const setSortOrder = (v: SortOrder) => setPersonsPrefs({ sortOrder: v });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number | string>>(
    new Set(),
  );
  const groupFilter = prefs.persons.groupFilter;
  const setGroupFilter = (v: string) => setPersonsPrefs({ groupFilter: v });
  const mbtiFilter = prefs.persons.mbtiFilter as MbtiFilter;
  const setMbtiFilter = (v: MbtiFilter) => setPersonsPrefs({ mbtiFilter: v });
  const mbtiDetail = prefs.persons.mbtiDetail;
  const setMbtiDetail = (v: string) => setPersonsPrefs({ mbtiDetail: v });
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [overdueFilter, setOverdueFilter] = useState<OverdueFilter>("all");

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const p of allPersons) {
      const tags = parseTags(p.tags);
      for (const t of tags) tagSet.add(t);
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "ko"));
  }, [allPersons]);

  // ── 기념일 모드 상태 ───────────────────────────────────
  const annPreset = prefs.persons.annPreset as AnnPreset;
  const setAnnPreset = (v: AnnPreset) => setPersonsPrefs({ annPreset: v });
  const [annCustomStart] = useState(() => dayjs().startOf("month").toDate());
  const [annCustomEnd] = useState(() => dayjs().endOf("month").toDate());
  const [annGroupFilter, setAnnGroupFilter] = useState<string>("all");

  // ── 기념일 기간 계산 ───────────────────────────────────
  const { annStart, annEnd } = useMemo(() => {
    const now = dayjs();
    if (annPreset === "this-week")
      return {
        annStart: now.startOf("week").toDate(),
        annEnd: now.endOf("week").toDate(),
      };
    if (annPreset === "this-month")
      return {
        annStart: now.startOf("month").toDate(),
        annEnd: now.endOf("month").toDate(),
      };
    if (annPreset === "recent-3m")
      return {
        annStart: now.subtract(3, "month").toDate(),
        annEnd: now.toDate(),
      };
    if (annPreset === "recent-6m")
      return {
        annStart: now.subtract(6, "month").toDate(),
        annEnd: now.toDate(),
      };
    if (annPreset === "recent-1y")
      return {
        annStart: now.subtract(1, "year").toDate(),
        annEnd: now.toDate(),
      };
    return { annStart: annCustomStart, annEnd: annCustomEnd };
  }, [annPreset, annCustomStart, annCustomEnd]);

  const { anniversaryBoardItems } = useAnniversariesInMonth(
    annStart,
    annEnd,
    isFocused,
  );

  const personGroupMap = useMemo(
    () => new Map(allPersons.map((p) => [p.id, p.groupId])),
    [allPersons],
  );

  const filteredAnniversaries = useMemo(() => {
    let items = anniversaryBoardItems;
    if (annGroupFilter !== "all")
      items = items.filter(
        (item) => String(personGroupMap.get(item.personId)) === annGroupFilter,
      );
    return [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [anniversaryBoardItems, annGroupFilter, personGroupMap]);

  const annSections = useMemo(() => {
    const map = new Map<string, { date: Date; data: AnniversaryBoardItem[] }>();
    for (const item of filteredAnniversaries) {
      const key = dayjs(item.date).format("YYYY-MM-DD");
      if (!map.has(key)) map.set(key, { date: item.date, data: [] });
      map.get(key)!.data.push(item);
    }
    return Array.from(map.values()).map(({ date, data }) => ({
      title: formatLogDate(date),
      data,
    }));
  }, [filteredAnniversaries]);

  // ── 프로필 모드 필터/정렬 ────────────────────────────────
  function applyMbtiFilter<T extends Person>(list: T[]): T[] {
    if (mbtiFilter === "no")
      return list.filter((p) => !p.mbti || p.mbti.length === 0);
    if (mbtiFilter === "yes") {
      const hasMbti = list.filter((p) => p.mbti && p.mbti.length > 0);
      if (mbtiDetail.length === 4)
        return hasMbti.filter((p) => p.mbti === mbtiDetail);
      return hasMbti;
    }
    return list;
  }

  function applyTagFilter<T extends Person>(list: T[]): T[] {
    if (tagFilter === "all") return list;
    return list.filter((p) => {
      return parseTags(p.tags).includes(tagFilter);
    });
  }

  function applyOverdueFilter<T extends Person>(list: T[]): T[] {
    if (overdueFilter === "all") return list;
    return list.filter((p) => {
      if (p.contactInterval == null) return false;
      const lastDate = lastLogDateMap.get(p.id) ?? null;
      const daysSince = lastDate
        ? dayjs().startOf("day").diff(dayjs(lastDate).startOf("day"), "day")
        : null;
      return daysSince == null || daysSince >= p.contactInterval;
    });
  }

  const sortedGroupedPersons = useMemo(
    () =>
      groupedPersons
        .filter(
          ({ group }) =>
            groupFilter === "all" || String(group.id) === groupFilter,
        )
        .map(({ group, members }) => ({
          group,
          members: applyOverdueFilter(
            applyTagFilter(
              applyMbtiFilter(
                sortPersons(members as Person[], sortOrder, lastLogDateMap),
              ),
            ),
          ) as typeof members,
        }))
        .filter(({ members }) => members.length > 0),
    [
      groupedPersons,
      sortOrder,
      groupFilter,
      mbtiFilter,
      mbtiDetail,
      tagFilter,
      overdueFilter,
      lastLogDateMap,
    ],
  );

  const sortedUngrouped = useMemo(() => {
    if (groupFilter !== "all") return [];
    return applyOverdueFilter(
      applyTagFilter(
        applyMbtiFilter(
          sortPersons(ungrouped as Person[], sortOrder, lastLogDateMap),
        ),
      ),
    ) as typeof ungrouped;
  }, [
    ungrouped,
    sortOrder,
    groupFilter,
    mbtiFilter,
    mbtiDetail,
    tagFilter,
    overdueFilter,
    lastLogDateMap,
  ]);

  const pinnedPersons = useMemo(
    () => allPersons.filter((p) => p.isPinned),
    [allPersons],
  );

  const personSections = useMemo(() => {
    const result = [] as {
      id: string | number;
      titleText: string;
      color?: string;
      collapsible: boolean;
      memberCount: number;
      data: typeof allPersons;
      isPinned?: boolean;
    }[];

    if (pinnedPersons.length > 0) {
      result.push({
        id: "__pinned__",
        titleText: "📌 즐겨찾기",
        collapsible: false,
        memberCount: pinnedPersons.length,
        data: pinnedPersons,
        isPinned: true,
      });
    }

    for (const { group, members } of sortedGroupedPersons) {
      const collapsed = collapsedGroups.has(group.id);
      result.push({
        id: group.id,
        titleText: `${group.emoji ?? ""} ${group.name}`.trim(),
        // color: group.color,
        collapsible: true, // 그룹은 항상 접을 수 있게
        memberCount: members.length, // 접힌 상태에서도 멤버 수는 보여줌
        data: collapsed ? [] : members, // 접힌 상태면 빈 배열로
      });
    }

    if (sortedUngrouped.length > 0) {
      const collapsed = collapsedGroups.has("__ungrouped__");
      result.push({
        id: "__ungrouped__",
        titleText: "분류 없음",
        collapsible: true,
        memberCount: sortedUngrouped.length,
        data: collapsed ? [] : sortedUngrouped,
      });
    }

    return result;
  }, [pinnedPersons, sortedGroupedPersons, sortedUngrouped, collapsedGroups]);

  async function togglePin(personId: number, current: boolean) {
    await db
      .update(persons)
      .set({ isPinned: !current, updatedAt: new Date() })
      .where(eq(persons.id, personId));
  }

  function toggleCollapse(id: number | string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleQuickAdd() {
    const name = quickName.trim();
    if (name.length === 0) {
      router.push("/persons/new");
      return;
    }
    if (allGroups.length === 0) return;
    await db.insert(persons).values({ name, groupId: allGroups[0].id });
    setQuickName("");
    Keyboard.dismiss();
  }

  const visiblePersonCount =
    sortedGroupedPersons.reduce((sum, { members }) => sum + members.length, 0) +
    sortedUngrouped.length;

  const allGroupIds = sortedGroupedPersons.map(({ group }) => group.id);
  const isAllCollapsed =
    allGroupIds.length > 0 &&
    allGroupIds.every((id) => collapsedGroups.has(id));

  function toggleAllCollapse() {
    if (isAllCollapsed) {
      setCollapsedGroups(new Set());
    } else {
      setCollapsedGroups(new Set(allGroupIds));
    }
  }

  const searchedPersons = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return allPersons;
    return allPersons.filter((p) => p.name.toLowerCase().includes(q));
  }, [allPersons, nameQuery]);

  const filterBadge =
    tabMode === "persons"
      ? [
          sortOrder !== "name-asc",
          groupFilter !== "all",
          mbtiFilter !== "all",
          tagFilter !== "all",
          overdueFilter !== "all",
        ].filter(Boolean).length
      : annGroupFilter !== "all"
        ? 1
        : 0;

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title={tabMode === "persons" ? "프로필" : "히스토리"}
        cakeOnPress={() => {
          setTabMode((m) => (m === "persons" ? "anniversary" : "persons"));
          setNameQuery("");
        }}
        historyActive={tabMode === "anniversary"}
        slidersOnPress={() => setShowFilterSheet(true)}
        slidersActive={filterBadge > 0}
      />

      {/* ── 프로필 모드 ── */}
      {tabMode === "persons" && (
        <>
          {/* 로컬 검색 바 */}
          <SearchBar
            value={nameQuery}
            onChange={setNameQuery}
            placeholder="이름 검색..."
          />

          {/* 검색어 있을 때: 플랫 결과 리스트 */}
          {nameQuery.trim() !== "" && (
            <FlatList
              data={searchedPersons}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 96,
              }}
              ListEmptyComponent={
                <Text className="text-app-muted text-center mt-12 text-sm">
                  일치하는 프로필이 없습니다.
                </Text>
              }
              renderItem={({ item }) => {
                const grp = groupMap.get(item.groupId);
                return (
                  <PersonCard
                    key={item.id}
                    person={item}
                    groupColor={grp?.color ?? "#555"}
                    lastLogDate={lastLogDateMap.get(item.id)}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: item.id },
                      })
                    }
                    onPinPress={() => togglePin(item.id, item.isPinned)}
                  />
                );
              }}
            />
          )}

          {/* 검색어 없을 때: 기존 그룹 뷰 표시 */}
          {nameQuery.trim() === "" && (
            <>
              {/* 요약 바 */}
              <View className="flex-row items-center justify-between px-5 py-2.5 border-b border-[#1e1e1e]">
                <Text className="text-app-muted text-sm">
                  총 {allPersons.length}명
                  {visiblePersonCount !== allPersons.length &&
                    ` · 표시 ${visiblePersonCount}명`}
                </Text>
                {allGroupIds.length > 0 && (
                  <Pressable onPress={toggleAllCollapse} hitSlop={8}>
                    <Text className="text-[#555] text-xs">
                      {isAllCollapsed ? "전체 펼치기" : "전체 접기"}
                    </Text>
                  </Pressable>
                )}
              </View>

              <SectionList
                sections={personSections}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: 96,
                }}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section }) => (
                  <View className="mt-4 mb-2">
                    {section.collapsible ? (
                      <Pressable
                        onPress={() => toggleCollapse(section.id)}
                        className="flex-row items-center justify-between"
                        hitSlop={4}
                      >
                        <View className="flex-row items-center gap-2">
                          {section.color && (
                            <View
                              className="w-[6px] h-[6px] rounded-full"
                              style={{ backgroundColor: section.color }}
                            />
                          )}
                          <Text className="text-[#aaa] text-sm font-semibold uppercase tracking-[0.5px]">
                            {section.titleText}
                            {"  "}
                            <Text className="text-[#555] font-normal">
                              {section.memberCount}
                            </Text>
                          </Text>
                        </View>
                        {collapsedGroups.has(section.id) ? (
                          <ChevronRight size={14} color="#555" />
                        ) : (
                          <ChevronDown size={14} color="#555" />
                        )}
                      </Pressable>
                    ) : (
                      <Text className="text-[#aaa] text-sm font-semibold uppercase tracking-[0.5px]">
                        {section.titleText}
                        {"  "}
                        <Text className="text-[#555] font-normal">
                          {section.memberCount}
                        </Text>
                      </Text>
                    )}
                  </View>
                )}
                renderItem={({ item, section }) => {
                  const groupColor = section.isPinned
                    ? (groupMap.get(item.groupId)?.color ?? "#555")
                    : (section.color ?? "#555");
                  return (
                    <PersonCard
                      person={item}
                      groupColor={groupColor}
                      lastLogDate={lastLogDateMap.get(item.id)}
                      onPress={() =>
                        router.push({
                          pathname: "/persons/[id]",
                          params: { id: item.id },
                        })
                      }
                      onPinPress={() => togglePin(item.id, item.isPinned)}
                    />
                  );
                }}
                ListEmptyComponent={
                  allPersons.length === 0 ? (
                    <Text className="text-app-muted text-center mt-12">
                      프로필을 추가해 보세요.
                    </Text>
                  ) : (
                    <View className="items-center mt-16 gap-3">
                      <Text className="text-app-muted text-sm">
                        조건에 맞는 프로필이 없습니다.
                      </Text>
                      {filterBadge > 0 && (
                        <Pressable
                          onPress={() => {
                            setSortOrder("name-asc");
                            setGroupFilter("all");
                            setMbtiFilter("all");
                            setMbtiDetail("");
                            setTagFilter("all");
                            setOverdueFilter("all");
                          }}
                          className="bg-[#222] rounded-full px-4 py-2"
                        >
                          <Text className="text-app-teal text-sm">
                            필터 초기화
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )
                }
              />

              <QuickInputBar
                placeholder="이름으로 프로필 추가"
                value={quickName}
                onChange={setQuickName}
                onSubmit={handleQuickAdd}
              />
            </>
          )}
        </>
      )}

      {/* ── 기념일 모드 ── */}
      {tabMode === "anniversary" && (
        <View className="flex-1">
          {/* 기간 프리셋 칩 */}
          <View className="h-11">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={ANN_PRESETS}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{
                paddingHorizontal: 16,
                gap: 8,
                paddingBottom: 8,
              }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setAnnPreset(item.key)}
                  className={cn(
                    "rounded-full px-4 py-1.5",
                    annPreset === item.key ? "bg-app-teal" : "bg-[#222]",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      annPreset === item.key ? "text-[#111]" : "text-[#888]",
                    )}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          {/* 직접 선택 날짜 범위 */}
          {annPreset === "custom" && (
            <View className="flex-row gap-2 px-4 pb-2">
              <View className="flex-1 bg-app-surface rounded-[10px] py-2.5 items-center">
                <Text className="text-white text-sm">
                  {dayjs(annCustomStart).format("YYYY년 M월")}
                </Text>
                <Text className="text-app-muted text-xs mt-0.5">시작</Text>
              </View>
              <View className="justify-center px-1">
                <Text className="text-app-muted">—</Text>
              </View>
              <View className="flex-1 bg-app-surface rounded-[10px] py-2.5 items-center">
                <Text className="text-white text-sm">
                  {dayjs(annCustomEnd).format("YYYY년 M월")}
                </Text>
                <Text className="text-app-muted text-xs mt-0.5">종료</Text>
              </View>
            </View>
          )}

          {/* 요약 */}
          <View className="flex-row items-center justify-between px-5 py-2.5 border-b border-[#1e1e1e]">
            <Text className="text-app-muted text-sm">
              총 {filteredAnniversaries.length}개
            </Text>
            <Text className="text-app-muted text-xs">
              {dayjs(annStart).format("YY.MM.DD")} ~
              {dayjs(annEnd).format("YY.MM.DD")}
            </Text>
          </View>

          {/* 날짜별 섹션 리스트 */}
          <SectionList
            sections={annSections}
            keyExtractor={(item, idx) =>
              `${item.personId}-${item.date.getTime()}-${idx}`
            }
            renderSectionHeader={({ section }) => (
              <View className="bg-[#111] px-5 py-2">
                <Text className="text-app-dim text-sm font-semibold">
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const gId = personGroupMap.get(item.personId);
              const grp = gId ? groupMap.get(gId) : undefined;
              return (
                <View className="px-4">
                  <AnniversaryItem
                    title={item.displayTitle}
                    date={item.date}
                    groupColor={grp?.color}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: item.personId },
                      })
                    }
                  />
                </View>
              );
            }}
            ListEmptyComponent={
              <View className="items-center mt-16 gap-3">
                <Text className="text-app-muted text-sm">
                  해당 기간에 기념일이 없습니다.
                </Text>
                {annGroupFilter !== "all" && (
                  <Pressable
                    onPress={() => setAnnGroupFilter("all")}
                    className="bg-[#222] rounded-full px-4 py-2"
                  >
                    <Text className="text-app-teal text-sm">필터 초기화</Text>
                  </Pressable>
                )}
              </View>
            }
            contentContainerStyle={{ paddingBottom: 16 }} // 섹션 헤더가 아이템과 겹치는 문제 완화
            stickySectionHeadersEnabled
          />
        </View>
      )}

      {/* ── 필터 바텀 시트 (모드 공통) ── */}
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
          <Pressable
            className="bg-app-surface rounded-t-[20px]"
            style={{ maxHeight: "80%" }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 40,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-5" />

              {/* ── 프로필 모드 필터 ── */}
              {tabMode === "persons" && (
                <>
                  <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
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
                        className="text-sm font-semibold"
                        style={{
                          color: groupFilter === "all" ? "#111" : "#888",
                        }}
                      >
                        전체
                      </Text>
                    </Pressable>
                    {allGroups.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() => setGroupFilter(String(g.id))}
                        className="rounded-[10px] px-4 py-2.5"
                        style={{
                          backgroundColor:
                            groupFilter === String(g.id)
                              ? "#4ecdc4"
                              : "#2a2a2a",
                        }}
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{
                            color:
                              groupFilter === String(g.id) ? "#111" : "#888",
                          }}
                        >
                          {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
                    MBTI
                  </Text>
                  <View className="flex-row gap-2 mb-3">
                    {(["all", "yes", "no"] as const).map((v) => {
                      const label =
                        v === "all" ? "전체" : v === "yes" ? "있음" : "없음";
                      return (
                        <Pressable
                          key={v}
                          onPress={() => {
                            setMbtiFilter(v);
                            if (v !== "yes") setMbtiDetail("");
                          }}
                          className="flex-1 rounded-[10px] py-2.5 items-center"
                          style={{
                            backgroundColor:
                              mbtiFilter === v ? "#4ecdc4" : "#2a2a2a",
                          }}
                        >
                          <Text
                            className="text-sm font-semibold"
                            style={{
                              color: mbtiFilter === v ? "#111" : "#888",
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {mbtiFilter === "yes" && (
                    <View className="mb-5">
                      <MbtiPicker value={mbtiDetail} onChange={setMbtiDetail} />
                    </View>
                  )}
                  {mbtiFilter !== "yes" && <View className="mb-5" />}

                  {allTags.length > 0 && (
                    <>
                      <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
                        관계 태그
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-5"
                        contentContainerStyle={{ gap: 8 }}
                      >
                        {["all", ...allTags].map((tag) => (
                          <Pressable
                            key={tag}
                            onPress={() => setTagFilter(tag)}
                            className="rounded-[10px] px-4 py-2.5"
                            style={{
                              backgroundColor:
                                tagFilter === tag ? "#4ecdc4" : "#2a2a2a",
                            }}
                          >
                            <Text
                              className="text-sm font-semibold"
                              style={{
                                color: tagFilter === tag ? "#111" : "#888",
                              }}
                            >
                              {tag === "all" ? "전체" : tag}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
                    연락 주기
                  </Text>
                  <View className="flex-row gap-2 mb-5">
                    {(["all", "overdue"] as const).map((v) => {
                      const label = v === "all" ? "전체" : "연락 필요";
                      return (
                        <Pressable
                          key={v}
                          onPress={() => setOverdueFilter(v)}
                          className="flex-1 rounded-[10px] py-2.5 items-center"
                          style={{
                            backgroundColor:
                              overdueFilter === v ? "#4ecdc4" : "#2a2a2a",
                          }}
                        >
                          <Text
                            className="text-sm font-semibold"
                            style={{
                              color: overdueFilter === v ? "#111" : "#888",
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
                    정렬
                  </Text>
                  <View className="flex-row gap-2">
                    {(["name-asc", "age-asc", "last-contact-asc"] as const).map(
                      (v) => {
                        const label =
                          v === "name-asc"
                            ? "이름순"
                            : v === "age-asc"
                              ? "나이순"
                              : "연락순";
                        return (
                          <Pressable
                            key={v}
                            onPress={() => setSortOrder(v)}
                            className="flex-1 rounded-[10px] py-2.5 items-center"
                            style={{
                              backgroundColor:
                                sortOrder === v ? "#4ecdc4" : "#2a2a2a",
                            }}
                          >
                            <Text
                              className="text-sm font-semibold"
                              style={{
                                color: sortOrder === v ? "#111" : "#888",
                              }}
                            >
                              {label}
                            </Text>
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                </>
              )}

              {/* ── 기념일 모드 필터 ── */}
              {tabMode === "anniversary" && (
                <>
                  <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-2">
                    그룹
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <Pressable
                      onPress={() => setAnnGroupFilter("all")}
                      className="rounded-[10px] px-4 py-2.5"
                      style={{
                        backgroundColor:
                          annGroupFilter === "all" ? "#4ecdc4" : "#2a2a2a",
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: annGroupFilter === "all" ? "#111" : "#888",
                        }}
                      >
                        전체
                      </Text>
                    </Pressable>
                    {allGroups.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() => setAnnGroupFilter(String(g.id))}
                        className="rounded-[10px] px-4 py-2.5"
                        style={{
                          backgroundColor:
                            annGroupFilter === String(g.id)
                              ? "#4ecdc4"
                              : "#2a2a2a",
                        }}
                      >
                        <Text
                          className="text-sm font-semibold"
                          style={{
                            color:
                              annGroupFilter === String(g.id) ? "#111" : "#888",
                          }}
                        >
                          {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
