// 인물 목록 탭 — 인물 리스트 / 기념일 리스트 모드 전환 + 필터/정렬
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { AnniversaryItem } from "@/components/persons/AnniversaryItem";
import { PersonCard } from "@/components/persons/PersonCard";
import { MonthPickerModal } from "@/components/MonthPickerModal";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import { usePersonsWithGroups } from "@/hooks/persons/use-persons-with-groups";
import { type AnniversaryBoardItem, useAnniversariesInMonth } from "@/hooks/persons/use-anniversaries-in-month";
import { formatLogDate } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  View,
} from "react-native";

// ── 공통 타입 ─────────────────────────────────────────────
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
  createdAt: Date;
};

const ANN_PRESETS: { key: AnnPreset; label: string }[] = [
  { key: "this-week", label: "이번 주" },
  { key: "this-month", label: "이번 달" },
  { key: "recent-3m", label: "최근 3개월" },
  { key: "custom", label: "직접 선택" },
];

// ── 유틸 ─────────────────────────────────────────────────
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

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function PersonsScreen() {
  const router = useRouter();
  const { allPersons, groupedPersons, ungrouped } = usePersonsWithGroups();

  // 공통
  const [tabMode, setTabMode] = useState<TabMode>("persons");
  const [quickName, setQuickName] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // ── 인물 모드 상태 ────────────────────────────────────
  const [sortOrder, setSortOrder] = useState<SortOrder>("name-asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showPersonFilterSheet, setShowPersonFilterSheet] = useState(false);
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [mbtiFilter, setMbtiFilter] = useState<MbtiFilter>("all");
  const [mbtiDetail, setMbtiDetail] = useState("");

  // ── 기념일 모드 상태 ──────────────────────────────────
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

  // ── 기념일 기간 계산 ──────────────────────────────────
  const { annStart, annEnd } = useMemo(() => {
    const now = dayjs();
    if (annPreset === "this-week")
      return { annStart: now.startOf("week").toDate(), annEnd: now.endOf("week").toDate() };
    if (annPreset === "this-month")
      return { annStart: now.startOf("month").toDate(), annEnd: now.endOf("month").toDate() };
    if (annPreset === "recent-3m")
      return { annStart: now.subtract(3, "month").toDate(), annEnd: now.toDate() };
    return { annStart: annCustomStart, annEnd: annCustomEnd };
  }, [annPreset, annCustomStart, annCustomEnd]);

  const { anniversaryBoardItems } = useAnniversariesInMonth(annStart, annEnd);

  // personId → groupId 매핑
  const personGroupMap = useMemo(
    () => new Map(allPersons.map((p) => [p.id, p.groupId])),
    [allPersons],
  );

  const filteredAnniversaries = useMemo(() => {
    let items = anniversaryBoardItems;
    if (annGroupFilter !== "all")
      items = items.filter((item) => personGroupMap.get(item.personId) === annGroupFilter);
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

  // ── 인물 모드 필터/정렬 ───────────────────────────────
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

  const sortedGroupedPersons = useMemo(
    () =>
      groupedPersons
        .filter(({ group }) => groupFilter === "all" || group.id === groupFilter)
        .map(({ group, members }) => ({
          group,
          members: applyMbtiFilter(sortPersons(members as Person[], sortOrder)) as typeof members,
        }))
        .filter(({ members }) => members.length > 0),
    [groupedPersons, sortOrder, groupFilter, mbtiFilter, mbtiDetail],
  );

  const sortedUngrouped = useMemo(() => {
    if (groupFilter !== "all") return [];
    return applyMbtiFilter(sortPersons(ungrouped as Person[], sortOrder)) as typeof ungrouped;
  }, [ungrouped, sortOrder, groupFilter, mbtiFilter, mbtiDetail]);

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

  const personFilterBadge = [
    sortOrder !== "name-asc",
    groupFilter !== "all",
    mbtiFilter !== "all",
  ].filter(Boolean).length;

  const annFilterBadge = annGroupFilter !== "all" ? 1 : 0;
  const inputBarBottom = keyboardHeight > 0 ? keyboardHeight + 8 : 24;

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <View className="flex-1 bg-app-bg">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-bold">인물</Text>
        <View className="flex-row items-center gap-2">
          {tabMode === "persons" && (
            <Pressable onPress={() => router.push("/search")} className="p-2" hitSlop={4}>
              <Search size={20} color="#888" />
            </Pressable>
          )}
          <Pressable
            onPress={() =>
              tabMode === "persons"
                ? setShowPersonFilterSheet(true)
                : setAnnGroupFilter("all") // 기념일 모드 필터는 인라인
            }
            hitSlop={8}
            style={{ padding: 6 }}
          >
            <SlidersHorizontal
              size={22}
              color={
                (tabMode === "persons" ? personFilterBadge : annFilterBadge) > 0
                  ? "#4ecdc4"
                  : "#888"
              }
            />
            {(tabMode === "persons" ? personFilterBadge : annFilterBadge) > 0 && (
              <View className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-app-teal items-center justify-center">
                <Text style={{ color: "#111", fontSize: 10, fontWeight: "bold" }}>
                  {tabMode === "persons" ? personFilterBadge : annFilterBadge}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* 탭 토글 */}
      <View className="flex-row mx-5 mb-3 bg-[#1a1a1a] rounded-[12px] p-1">
        {(["persons", "anniversary"] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setTabMode(mode)}
            className="flex-1 rounded-[10px] py-2 items-center"
            style={{ backgroundColor: tabMode === mode ? "#2a2a2a" : "transparent" }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: tabMode === mode ? "#e0e0e0" : "#555" }}
            >
              {mode === "persons" ? "인물" : "기념일"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── 인물 모드 ── */}
      {tabMode === "persons" && (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }}>
            {allPersons.length === 0 ? (
              <Text className="text-app-muted text-center mt-12">인물을 추가해 보세요.</Text>
            ) : (
              <>
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
                          <Text className="text-[#555] font-normal">{members.length}</Text>
                        </Text>
                        {collapsed
                          ? <ChevronRight size={14} color="#555" />
                          : <ChevronDown size={14} color="#555" />
                        }
                      </Pressable>
                      {!collapsed && members.map((person) => (
                        <PersonCard
                          key={person.id}
                          person={person}
                          groupColor={group.color}
                          onPress={() =>
                            router.push({ pathname: "/persons/[id]", params: { id: person.id } })
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
                        <Text className="text-[#555] font-normal">{sortedUngrouped.length}</Text>
                      </Text>
                      {collapsedGroups.has("__ungrouped__")
                        ? <ChevronRight size={14} color="#555" />
                        : <ChevronDown size={14} color="#555" />
                      }
                    </Pressable>
                    {!collapsedGroups.has("__ungrouped__") && sortedUngrouped.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        groupColor="#555"
                        onPress={() =>
                          router.push({ pathname: "/persons/[id]", params: { id: person.id } })
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
            bottom={inputBarBottom}
          />
        </>
      )}

      {/* ── 기념일 모드 ── */}
      {tabMode === "anniversary" && (
        <View className="flex-1">
          {/* 기간 프리셋 */}
          <View className="h-11">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={ANN_PRESETS}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
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

          {/* 그룹 필터 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="max-h-10"
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}
          >
            <Pressable
              onPress={() => setAnnGroupFilter("all")}
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: annGroupFilter === "all" ? "#4ecdc4" : "#222" }}
            >
              <Text
                className="text-[12px] font-semibold"
                style={{ color: annGroupFilter === "all" ? "#111" : "#888" }}
              >
                전체
              </Text>
            </Pressable>
            {allGroups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setAnnGroupFilter(g.id)}
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: annGroupFilter === g.id ? "#4ecdc4" : "#222" }}
              >
                <Text
                  className="text-[12px] font-semibold"
                  style={{ color: annGroupFilter === g.id ? "#111" : "#888" }}
                >
                  {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* 요약 */}
          <View className="flex-row items-center px-5 py-2.5 border-b border-[#1e1e1e]">
            <Text className="text-app-muted text-[13px]">
              총 {filteredAnniversaries.length}개
            </Text>
          </View>

          {/* 날짜별 섹션 리스트 */}
          <SectionList
            sections={annSections}
            keyExtractor={(item, idx) => `${item.personId}-${item.date.getTime()}-${idx}`}
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
                  onPress={() =>
                    router.push({ pathname: "/persons/[id]", params: { id: item.personId } })
                  }
                />
              </View>
            )}
            ListEmptyComponent={
              <Text className="text-app-muted text-center mt-16 text-[14px]">
                해당 기간에 기념일이 없습니다.
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 96 }}
            stickySectionHeadersEnabled
          />

          {/* 기념일 직접 선택 피커 */}
          <MonthPickerModal
            visible={showAnnStartPicker}
            currentMonth={annCustomStart}
            onSelect={(year, month) => {
              setAnnCustomStart(new Date(year, month, 1));
              setShowAnnStartPicker(false);
            }}
            onClose={() => setShowAnnStartPicker(false)}
          />
          <MonthPickerModal
            visible={showAnnEndPicker}
            currentMonth={annCustomEnd}
            onSelect={(year, month) => {
              setAnnCustomEnd(dayjs(new Date(year, month, 1)).endOf("month").toDate());
              setShowAnnEndPicker(false);
            }}
            onClose={() => setShowAnnEndPicker(false)}
          />
        </View>
      )}

      {/* ── 인물 필터 바텀 시트 ── */}
      <Modal
        visible={showPersonFilterSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPersonFilterSheet(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowPersonFilterSheet(false)}
        >
          <Pressable
            className="bg-app-surface rounded-t-[20px]"
            style={{ maxHeight: "80%" }}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-5" />

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
                  style={{ backgroundColor: groupFilter === "all" ? "#4ecdc4" : "#2a2a2a" }}
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
                    style={{ backgroundColor: groupFilter === g.id ? "#4ecdc4" : "#2a2a2a" }}
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

              {/* MBTI */}
              <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
                MBTI
              </Text>
              <View className="flex-row gap-2 mb-3">
                {(["all", "yes", "no"] as const).map((v) => {
                  const label = v === "all" ? "전체" : v === "yes" ? "있음" : "없음";
                  return (
                    <Pressable
                      key={v}
                      onPress={() => {
                        setMbtiFilter(v);
                        if (v !== "yes") setMbtiDetail("");
                      }}
                      className="flex-1 rounded-[10px] py-2.5 items-center"
                      style={{ backgroundColor: mbtiFilter === v ? "#4ecdc4" : "#2a2a2a" }}
                    >
                      <Text
                        className="text-[13px] font-semibold"
                        style={{ color: mbtiFilter === v ? "#111" : "#888" }}
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

              {/* 정렬 */}
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
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
