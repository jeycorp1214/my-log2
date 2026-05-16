// 인물 목록 탭 — 인물 리스트 / 기념일 리스트 모드 전환 + 필터/정렬
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import TabsHeader from "@/components/layout/TabsHeader";
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { PersonCard } from "@/components/persons/PersonCard";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { groups, persons } from "@/db/schema";
import {
  type AnniversaryBoardItem,
  useAnniversariesInMonth,
} from "@/hooks/persons/use-anniversaries-in-month";
import { usePersonsWithGroups } from "@/hooks/persons/use-persons-with-groups";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { formatLogDate } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
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
type AnnPreset = "this-week" | "this-month" | "recent-3m" | "custom";
type SortOrder = "name-asc" | "age-asc";
type MbtiFilter = "all" | "yes" | "no";

type Person = {
  id: string;
  name: string;
  birthDate?: string | null;
  mbti?: string | null;
  groupId: string;
  isPinned: boolean;
  tags?: string | null;
  metAt?: string | null;
  createdAt: Date;
};

const ANN_PRESETS: { key: AnnPreset; label: string }[] = [
  { key: "this-week", label: "이번 주" },
  { key: "this-month", label: "이번 달" },
  { key: "recent-3m", label: "최근 3개월" },
  { key: "custom", label: "직접 선택" },
];

function sortPersons<T extends Person>(list: T[], order: SortOrder): T[] {
  if (order === "name-asc")
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
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
  const { allPersons, groupedPersons, ungrouped, lastLogDateMap } = usePersonsWithGroups();

  const [tabMode, setTabMode] = useState<TabMode>("persons");
  const [quickName, setQuickName] = useState("");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  // ── 인물 모드 상태 ─────────────────────────────────────
  const { prefs, setPersonsPrefs } = useTabPreferences();
  const sortOrder = prefs.persons.sortOrder as SortOrder;
  const setSortOrder = (v: SortOrder) => setPersonsPrefs({ sortOrder: v });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const groupFilter = prefs.persons.groupFilter;
  const setGroupFilter = (v: string) => setPersonsPrefs({ groupFilter: v });
  const mbtiFilter = prefs.persons.mbtiFilter as MbtiFilter;
  const setMbtiFilter = (v: MbtiFilter) => setPersonsPrefs({ mbtiFilter: v });
  const mbtiDetail = prefs.persons.mbtiDetail;
  const setMbtiDetail = (v: string) => setPersonsPrefs({ mbtiDetail: v });
  const [tagFilter, setTagFilter] = useState<string>("all");

  // ── 기념일 모드 상태 ───────────────────────────────────
  const [annPreset, setAnnPreset] = useState<AnnPreset>("this-month");
  const [annCustomStart, setAnnCustomStart] = useState(() =>
    dayjs().startOf("month").toDate(),
  );
  const [annCustomEnd, setAnnCustomEnd] = useState(() =>
    dayjs().endOf("month").toDate(),
  );
  const [showAnnStartPicker, setShowAnnStartPicker] = useState(false);
  const [showAnnEndPicker, setShowAnnEndPicker] = useState(false);
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
    return { annStart: annCustomStart, annEnd: annCustomEnd };
  }, [annPreset, annCustomStart, annCustomEnd]);

  const { anniversaryBoardItems } = useAnniversariesInMonth(annStart, annEnd);

  const personGroupMap = useMemo(
    () => new Map(allPersons.map((p) => [p.id, p.groupId])),
    [allPersons],
  );

  const filteredAnniversaries = useMemo(() => {
    let items = anniversaryBoardItems;
    if (annGroupFilter !== "all")
      items = items.filter(
        (item) => personGroupMap.get(item.personId) === annGroupFilter,
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

  // ── 인물 모드 필터/정렬 ────────────────────────────────
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
      const parsedTags: string[] = p.tags ? JSON.parse(p.tags) : [];
      return parsedTags.includes(tagFilter);
    });
  }

  const sortedGroupedPersons = useMemo(
    () =>
      groupedPersons
        .filter(
          ({ group }) => groupFilter === "all" || group.id === groupFilter,
        )
        .map(({ group, members }) => ({
          group,
          members: applyTagFilter(
            applyMbtiFilter(
              sortPersons(members as Person[], sortOrder),
            ),
          ) as typeof members,
        }))
        .filter(({ members }) => members.length > 0),
    [groupedPersons, sortOrder, groupFilter, mbtiFilter, mbtiDetail, tagFilter],
  );

  const sortedUngrouped = useMemo(() => {
    if (groupFilter !== "all") return [];
    return applyTagFilter(
      applyMbtiFilter(
        sortPersons(ungrouped as Person[], sortOrder),
      ),
    ) as typeof ungrouped;
  }, [ungrouped, sortOrder, groupFilter, mbtiFilter, mbtiDetail, tagFilter]);

  const pinnedPersons = useMemo(
    () => allPersons.filter((p) => p.isPinned),
    [allPersons],
  );

  async function togglePin(personId: string, current: boolean) {
    await db
      .update(persons)
      .set({ isPinned: !current, updatedAt: new Date() })
      .where(eq(persons.id, personId));
  }

  function toggleCollapse(id: string) {
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

  const filterBadge =
    tabMode === "persons"
      ? [
          sortOrder !== "name-asc",
          groupFilter !== "all",
          mbtiFilter !== "all",
          tagFilter !== "all",
        ].filter(Boolean).length
      : annGroupFilter !== "all"
        ? 1
        : 0;

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="인물"
        searchOnPress={tabMode === "persons"}
        cakeOnPress={() =>
          setTabMode((m) => (m === "persons" ? "anniversary" : "persons"))
        }
        cakeActive={tabMode === "anniversary"}
        slidersOnPress={() => setShowFilterSheet(true)}
        slidersActive={filterBadge > 0}
      />

      {/* ── 인물 모드 ── */}
      {tabMode === "persons" && (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}
          >
            {allPersons.length === 0 ? (
              <Text className="text-app-muted text-center mt-12">
                인물을 추가해 보세요.
              </Text>
            ) : (
              <>
                {pinnedPersons.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-[#aaa] text-[13px] font-semibold uppercase tracking-[0.5px] mb-2">
                      📌 고정{"  "}
                      <Text className="text-[#555] font-normal">
                        {pinnedPersons.length}
                      </Text>
                    </Text>
                    {pinnedPersons.map((person) => {
                      const grp = allGroups.find((g) => g.id === person.groupId);
                      return (
                        <PersonCard
                          key={person.id}
                          person={person}
                          groupColor={grp?.color ?? "#555"}
                          lastLogDate={lastLogDateMap.get(person.id)}
                          onPress={() =>
                            router.push({
                              pathname: "/persons/[id]",
                              params: { id: person.id },
                            })
                          }
                          onLongPress={() =>
                            togglePin(person.id, person.isPinned)
                          }
                        />
                      );
                    })}
                  </View>
                )}
                {sortedGroupedPersons.map(({ group, members }) => {
                  const collapsed = collapsedGroups.has(group.id);
                  return (
                    <View key={group.id} className="mb-6">
                      <Pressable
                        onPress={() => toggleCollapse(group.id)}
                        className="flex-row items-center justify-between mb-2"
                        hitSlop={4}
                      >
                        <Text className="text-[#aaa] text-[13px] font-semibold uppercase tracking-[0.5px]">
                          {group.emoji} {group.name}
                          {"  "}
                          <Text className="text-[#555] font-normal">
                            {members.length}
                          </Text>
                        </Text>
                        {collapsed ? (
                          <ChevronRight size={14} color="#555" />
                        ) : (
                          <ChevronDown size={14} color="#555" />
                        )}
                      </Pressable>
                      {!collapsed &&
                        members.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            groupColor={group.color}
                            lastLogDate={lastLogDateMap.get(person.id)}
                            onPress={() =>
                              router.push({
                                pathname: "/persons/[id]",
                                params: { id: person.id },
                              })
                            }
                            onLongPress={() =>
                              togglePin(person.id, person.isPinned)
                            }
                          />
                        ))}
                    </View>
                  );
                })}
                {sortedUngrouped.length > 0 && (
                  <View className="mb-6">
                    <Pressable
                      onPress={() => toggleCollapse("__ungrouped__")}
                      className="flex-row items-center justify-between mb-2"
                      hitSlop={4}
                    >
                      <Text className="text-[#aaa] text-[13px] font-semibold uppercase tracking-[0.5px]">
                        분류 없음{"  "}
                        <Text className="text-[#555] font-normal">
                          {sortedUngrouped.length}
                        </Text>
                      </Text>
                      {collapsedGroups.has("__ungrouped__") ? (
                        <ChevronRight size={14} color="#555" />
                      ) : (
                        <ChevronDown size={14} color="#555" />
                      )}
                    </Pressable>
                    {!collapsedGroups.has("__ungrouped__") &&
                      sortedUngrouped.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          groupColor="#555"
                          lastLogDate={lastLogDateMap.get(person.id)}
                          onPress={() =>
                            router.push({
                              pathname: "/persons/[id]",
                              params: { id: person.id },
                            })
                          }
                          onLongPress={() =>
                            togglePin(person.id, person.isPinned)
                          }
                        />
                      ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <QuickInputBar
            placeholder="이름으로 인물 추가"
            value={quickName}
            onChange={setQuickName}
            onSubmit={handleQuickAdd}
          />
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
                      "text-[13px] font-semibold",
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
              <Pressable
                onPress={() => setShowAnnStartPicker(true)}
                className="flex-1 bg-app-surface rounded-[10px] py-2.5 items-center"
              >
                <Text className="text-white text-[13px]">
                  {dayjs(annCustomStart).format("YYYY년 M월")}
                </Text>
                <Text className="text-app-muted text-[11px] mt-0.5">시작</Text>
              </Pressable>
              <View className="justify-center px-1">
                <Text className="text-app-muted">—</Text>
              </View>
              <Pressable
                onPress={() => setShowAnnEndPicker(true)}
                className="flex-1 bg-app-surface rounded-[10px] py-2.5 items-center"
              >
                <Text className="text-white text-[13px]">
                  {dayjs(annCustomEnd).format("YYYY년 M월")}
                </Text>
                <Text className="text-app-muted text-[11px] mt-0.5">종료</Text>
              </Pressable>
            </View>
          )}

          {/* 요약 */}
          <View className="flex-row items-center px-5 py-2.5 border-b border-[#1e1e1e]">
            <Text className="text-app-muted text-[13px]">
              총 {filteredAnniversaries.length}개
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
                <Text className="text-app-dim text-[13px] font-semibold">
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
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
            )}
            ListEmptyComponent={
              <Text className="text-app-muted text-center mt-16 text-[14px]">
                해당 기간에 기념일이 없습니다.
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 16 }} // 섹션 헤더가 아이템과 겹치는 문제 완화
            stickySectionHeadersEnabled
          />
        </View>
      )}

      {/* 기념일 커스텀 기간 월 선택 피커 */}
      <MonthPickerModal
        visible={showAnnStartPicker}
        value={annCustomStart}
        onChange={(date) => {
          setAnnCustomStart(date);
          if (date > annCustomEnd) setAnnCustomEnd(date);
        }}
        onClose={() => setShowAnnStartPicker(false)}
      />
      <MonthPickerModal
        visible={showAnnEndPicker}
        value={annCustomEnd}
        onChange={(date) => {
          setAnnCustomEnd(date);
          if (date < annCustomStart) setAnnCustomStart(date);
        }}
        onClose={() => setShowAnnEndPicker(false)}
      />

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

              {/* ── 인물 모드 필터 ── */}
              {tabMode === "persons" && (
                <>
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
                        onPress={() => setGroupFilter(g.id)}
                        className="rounded-[10px] px-4 py-2.5"
                        style={{
                          backgroundColor:
                            groupFilter === g.id ? "#4ecdc4" : "#2a2a2a",
                        }}
                      >
                        <Text
                          className="text-[13px] font-semibold"
                          style={{
                            color: groupFilter === g.id ? "#111" : "#888",
                          }}
                        >
                          {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
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
                            className="text-[13px] font-semibold"
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

                  <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
                    관계 태그
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-5"
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {["all", "연인", "가족", "직장동료", "오랜친구", "멘토", "온라인친구"].map(
                      (tag) => (
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
                            className="text-[13px] font-semibold"
                            style={{
                              color: tagFilter === tag ? "#111" : "#888",
                            }}
                          >
                            {tag === "all" ? "전체" : tag}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </ScrollView>

                  <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
                    정렬
                  </Text>
                  <View className="flex-row gap-2">
                    {(["name-asc", "age-asc"] as const).map((v) => {
                      const label = v === "name-asc" ? "이름순" : "나이순";
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
                            className="text-[13px] font-semibold"
                            style={{ color: sortOrder === v ? "#111" : "#888" }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* ── 기념일 모드 필터 ── */}
              {tabMode === "anniversary" && (
                <>
                  <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
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
                        className="text-[13px] font-semibold"
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
                        onPress={() => setAnnGroupFilter(g.id)}
                        className="rounded-[10px] px-4 py-2.5"
                        style={{
                          backgroundColor:
                            annGroupFilter === g.id ? "#4ecdc4" : "#2a2a2a",
                        }}
                      >
                        <Text
                          className="text-[13px] font-semibold"
                          style={{
                            color: annGroupFilter === g.id ? "#111" : "#888",
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
