// 인물 목록 탭 — 그룹별 섹션 + 정렬/접기/검색 + 퀵 추가
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { PersonCard } from "@/components/persons/PersonCard";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import { usePersonsWithGroups } from "@/hooks/persons/use-persons-with-groups";
import { cn } from "@/utils/utils";
import { useRouter } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react-native";
import { Keyboard, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";

type SortOrder = "name-asc" | "newest" | "oldest";

type Person = {
  id: string;
  name: string;
  createdAt: Date;
  [key: string]: unknown;
};

function sortPersons<T extends Person>(list: T[], order: SortOrder): T[] {
  if (order === "name-asc") return [...list].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  if (order === "newest") return [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export default function PersonsScreen() {
  const router = useRouter();
  const { allPersons, groupedPersons, ungrouped } = usePersonsWithGroups();
  const [quickName, setQuickName] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("name-asc");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showFilterSheet, setShowFilterSheet] = useState(false);

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

  const sortedGroupedPersons = useMemo(
    () => groupedPersons.map(({ group, members }) => ({ group, members: sortPersons(members, sortOrder) })),
    [groupedPersons, sortOrder],
  );

  const sortedUngrouped = useMemo(
    () => sortPersons(ungrouped, sortOrder),
    [ungrouped, sortOrder],
  );

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
    await db.insert(persons).values({
      name,
      groupId: allGroups[0].id,
    });
    setQuickName("");
    Keyboard.dismiss();
  }

  const filterBadge = sortOrder !== "name-asc" ? 1 : 0;
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

      {/* 정렬 바텀 시트 */}
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
              정렬
            </Text>
            <View className="flex-row gap-2">
              {(["name-asc", "newest", "oldest"] as const).map((v) => {
                const label = v === "name-asc" ? "이름순" : v === "newest" ? "최근 추가순" : "오래된순";
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
