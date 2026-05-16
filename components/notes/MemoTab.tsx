// 메모 서브탭 — 체크리스트형 자유 메모 목록
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { FilterBottomSheet, FilterChipGroup } from "@/components/FilterBottomSheet";
import { db } from "@/db/client";
import { memos } from "@/db/schema";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { fromNow } from "@/utils/date";
import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Pin, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, FlatList, Keyboard, Pressable, Text, View } from "react-native";

type CompletionFilter = "all" | "done" | "undone";
type SortOrder = "newest" | "oldest";

type Props = {
  searchQuery: string;
  filterSheetVisible: boolean;
  onFilterSheetClose: () => void;
  onFilterBadgeChange: (count: number) => void;
};

export function MemoTab({ searchQuery, filterSheetVisible, onFilterSheetClose, onFilterBadgeChange }: Props) {
  const router = useRouter();
  const [quickContent, setQuickContent] = useState("");

  const { prefs, setMemoPrefs } = useTabPreferences();
  const completionFilter = prefs.memo.completionFilter as CompletionFilter;
  const setCompletionFilter = (v: CompletionFilter) => setMemoPrefs({ completionFilter: v });
  const sortOrder = prefs.memo.sortOrder as SortOrder;
  const setSortOrder = (v: SortOrder) => setMemoPrefs({ sortOrder: v });
  const showDate = prefs.memo.showDate ?? false;
  const setShowDate = (v: boolean) => setMemoPrefs({ showDate: v });

  const { data: allMemos = [] } = useLiveQuery(
    db.select().from(memos).orderBy(
      desc(memos.pinnedAt),
      sortOrder === "newest" ? desc(memos.createdAt) : asc(memos.createdAt),
    ),
    [sortOrder],
  );

  const filteredMemos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMemos.filter((m) => {
      if (completionFilter === "done" && !m.checkedAt) return false;
      if (completionFilter === "undone" && m.checkedAt) return false;
      if (q && !m.content?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allMemos, completionFilter, searchQuery]);

  const memoDoneCount = useMemo(() => allMemos.filter((m) => !!m.checkedAt).length, [allMemos]);

  useMemo(() => {
    const badge = [completionFilter !== "all", sortOrder !== "newest", showDate].filter(Boolean).length;
    onFilterBadgeChange(badge);
  }, [completionFilter, sortOrder, showDate]);

  async function handleQuickAdd() {
    const content = quickContent.trim();
    if (content.length === 0) {
      router.push("/memos/new");
      return;
    }
    await db.insert(memos).values({ content });
    setQuickContent("");
    Keyboard.dismiss();
  }

  async function toggleCheck(id: string, current: Date | null) {
    await db.update(memos).set({ checkedAt: current ? null : new Date(), updatedAt: new Date() }).where(eq(memos.id, id));
  }

  async function togglePin(id: string, current: Date | null) {
    await db.update(memos).set({ pinnedAt: current ? null : new Date(), updatedAt: new Date() }).where(eq(memos.id, id));
  }

  async function deleteMemo(id: string, isChecked: boolean) {
    if (isChecked) {
      await db.delete(memos).where(eq(memos.id, id));
      return;
    }
    Alert.alert("메모 삭제", "이 메모를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => db.delete(memos).where(eq(memos.id, id)) },
    ]);
  }

  async function deleteCheckedMemos() {
    Alert.alert("완료 항목 삭제", `완료된 메모 ${memoDoneCount}개를 삭제합니다.`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(memos).where(isNotNull(memos.checkedAt));
          onFilterSheetClose();
        },
      },
    ]);
  }

  return (
    <>
      <View className="flex-row items-center px-5 py-2 border-b border-[#1e1e1e]">
        <Text className="text-app-muted text-[13px]">
          총 {allMemos.length}개 · 완료 {memoDoneCount}개
        </Text>
      </View>

      <FlatList
        data={filteredMemos}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 96 }}
        renderItem={({ item }) => {
          const isChecked = !!item.checkedAt;
          return (
            <View className="flex-row items-center gap-3 py-3 px-4 border-b border-[#1e1e1e]">
              <Pressable
                onPress={() => toggleCheck(item.id, item.checkedAt ?? null)}
                hitSlop={8}
                className="w-6 h-6 rounded-full border-2 items-center justify-center"
                style={{ borderColor: isChecked ? "#4ecdc4" : "#444" }}
              >
                {isChecked && <View className="w-3 h-3 rounded-full bg-app-teal" />}
              </Pressable>
              <Pressable
                className="flex-1"
                onPress={() => router.push({ pathname: "/memos/[id]", params: { id: item.id } })}
              >
                <Text
                  className="flex-1 text-white text-sm"
                  numberOfLines={5}
                  style={{ textDecorationLine: isChecked ? "line-through" : "none", opacity: isChecked ? 0.45 : 1 }}
                >
                  {item.content}
                </Text>
                {showDate && (
                  <Text className="text-app-muted text-[11px] mt-1">
                    {fromNow(item.createdAt)}
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={() => togglePin(item.id, item.pinnedAt ?? null)} hitSlop={8} className="p-1">
                <Pin size={14} color={item.pinnedAt ? "#4ecdc4" : "#444"} fill={item.pinnedAt ? "#4ecdc4" : "none"} />
              </Pressable>
              <Pressable onPress={() => deleteMemo(item.id, isChecked)} hitSlop={8} className="p-1">
                <Trash2 size={15} color="#444" />
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="text-app-muted text-center mt-16 text-[14px]">메모가 없습니다.</Text>
        }
      />

      <QuickInputBar
        placeholder="메모 추가"
        value={quickContent}
        onChange={setQuickContent}
        onSubmit={handleQuickAdd}
      />

      <FilterBottomSheet visible={filterSheetVisible} onClose={onFilterSheetClose}>
        <FilterChipGroup
          label="완료 상태"
          options={[{ value: "all", label: "전체" }, { value: "undone", label: "미완료" }, { value: "done", label: "완료" }]}
          value={completionFilter}
          onChange={setCompletionFilter}
        />
        <FilterChipGroup
          label="정렬"
          options={[{ value: "newest", label: "최신순" }, { value: "oldest", label: "오래된순" }]}
          value={sortOrder}
          onChange={setSortOrder}
        />
        <FilterChipGroup
          label="날짜 표시"
          options={[{ value: false, label: "숨김" }, { value: true, label: "표시" }]}
          value={showDate}
          onChange={setShowDate}
          className="mb-6"
        />
        {memoDoneCount > 0 && (
          <Pressable
            onPress={deleteCheckedMemos}
            className="flex-row items-center justify-center gap-2 rounded-[10px] py-3"
            style={{ backgroundColor: "#2a1a1a" }}
          >
            <Trash2 size={15} color="#ff6b6b" />
            <Text style={{ color: "#ff6b6b", fontSize: 13, fontWeight: "600" }}>
              완료 항목 {memoDoneCount}개 삭제
            </Text>
          </Pressable>
        )}
      </FilterBottomSheet>
    </>
  );
}
