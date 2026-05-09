// 인물 목록 탭 — 그룹별 섹션 + 정렬/필터/접기/검색 + 퀵 추가
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { MbtiPicker } from "@/components/persons/MbtiPicker";
import { PersonCard } from "@/components/persons/PersonCard";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import { usePersonsWithGroups } from "@/hooks/persons/use-persons-with-groups";
import { cn } from "@/utils/utils";
import { useRouter } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react-native";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

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

function sortPersons<T extends Person>(list: T[], order: SortOrder): T[] {
  if (order === "name-asc")
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  // age-asc: 나이 많은 순 (birthDate 오름차순), null은 뒤로
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
  const { allPersons, groupedPersons, ungrouped } = usePersonsWithGroups();
  const [quickName, setQuickName] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("name-asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [mbtiFilter, setMbtiFilter] = useState<MbtiFilter>("all");
  const [mbtiDetail, setMbtiDetail] = useState("");

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

  const filterBadge = [
    sortOrder !== "name-asc",
    groupFilter !== "all",
    mbtiFilter !== "all",
  ].filter(Boolean).length;

  const inputBarBottom = keyboardHeight > 0 ? keyboardHeight + 8 : 24;

  return (
    <View className="flex-1 bg-app-bg">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Text className="text-white text-2xl font-bold">인물</Text>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.push("/search")} className="p-2" hitSlop={4}>
            <Search size={20} color="#888" />
          </Pressable>
          <Pressable onPress={() => setShowFilterSheet(true)} hitSlop={8} style={{ padding: 6 }}>
            <SlidersHorizontal size={22} color={filterBadge > 0 ? "#4ecdc4" : "#888"} />
            {filterBadge > 0 && (
              <View className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-app-teal items-center justify-center">
                <Text style={{ color: "#111", fontSize: 10, fontWeight: "bold" }}>{filterBadge}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

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
                    분류 없음
                    {"  "}
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
