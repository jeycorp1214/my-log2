// 노트 탭 — 메모(체크리스트) | 할 일(아이젠하워 매트릭스) 서브탭
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { FilterBottomSheet, FilterChipGroup } from "@/components/FilterBottomSheet";
import TabsHeader from "@/components/layout/TabsHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { db } from "@/db/client";
import { memos, todos, type Quadrant } from "@/db/schema";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { dDayLabel, fromNow } from "@/utils/date";
import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Pin, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";

// ─── 상수 ───────────────────────────────────────────────
type CompletionFilter = "all" | "done" | "undone";
type SortOrder = "newest" | "oldest";
type NoteTab = "memo" | "todo";

type QuadrantConfig = {
  key: Quadrant;
  label: string;
  sub: string;
  color: string;
};

const QUADRANTS: QuadrantConfig[] = [
  { key: "do",       label: "즉시 실행", sub: "긴급 + 중요",    color: "#ff6b6b" },
  { key: "schedule", label: "계획",      sub: "중요 + 여유",    color: "#4ecdc4" },
  { key: "delegate", label: "빠르게 처리", sub: "긴급 + 비중요", color: "#f59e0b" },
  { key: "eliminate",label: "제거",       sub: "비긴급 + 비중요", color: "#666666" },
];

// ─── 컴포넌트 ────────────────────────────────────────────
export default function NoteScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NoteTab>("memo");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── 메모 상태 ──
  const [quickContent, setQuickContent] = useState("");
  const { prefs, setMemoPrefs } = useTabPreferences();
  const completionFilter = prefs.memo.completionFilter as CompletionFilter;
  const setCompletionFilter = (v: CompletionFilter) => setMemoPrefs({ completionFilter: v });
  const sortOrder = prefs.memo.sortOrder as SortOrder;
  const setSortOrder = (v: SortOrder) => setMemoPrefs({ sortOrder: v });
  const showDate = prefs.memo.showDate ?? false;
  const setShowDate = (v: boolean) => setMemoPrefs({ showDate: v });
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { data: allMemos = [] } = useLiveQuery(
    db.select().from(memos).orderBy(
      desc(memos.pinnedAt),
      sortOrder === "newest" ? desc(memos.createdAt) : asc(memos.createdAt),
    ),
    [sortOrder],
  );
  const filteredMemos = allMemos.filter((m) => {
    if (completionFilter === "done") return !!m.checkedAt;
    if (completionFilter === "undone") return !m.checkedAt;
    return true;
  }).filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return m.content?.toLowerCase().includes(q);
  });
  const memoDoneCount = allMemos.filter((m) => !!m.checkedAt).length;

  // ── 할 일 상태 ──
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>("do");
  const [todoInput, setTodoInput] = useState("");
  const [showTodoFilterSheet, setShowTodoFilterSheet] = useState(false);

  const { data: allTodos = [] } = useLiveQuery(
    db.select().from(todos).orderBy(asc(todos.createdAt)),
  );
  const quadrantTodos = allTodos
    .filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) return t.title?.toLowerCase().includes(q);
      return t.quadrant === selectedQuadrant;
    })
    .sort((a, b) => {
      if (!a.checkedAt && b.checkedAt) return -1;
      if (a.checkedAt && !b.checkedAt) return 1;
      return 0;
    });
  const todoCounts = Object.fromEntries(
    QUADRANTS.map((q) => {
      const qTodos = allTodos.filter((t) => t.quadrant === q.key);
      return [q.key, { done: qTodos.filter((t) => !!t.checkedAt).length, total: qTodos.length }];
    }),
  ) as Record<Quadrant, { done: number; total: number }>;
  const todoDoneCount = allTodos.filter((t) => !!t.checkedAt).length;

  // ── 메모 핸들러 ──
  async function handleMemoQuickAdd() {
    const content = quickContent.trim();
    if (content.length === 0) {
      router.push("/memos/new");
      return;
    }
    await db.insert(memos).values({ content });
    setQuickContent("");
    Keyboard.dismiss();
  }

  async function toggleMemoCheck(id: string, current: Date | null) {
    await db.update(memos).set({ checkedAt: current ? null : new Date(), updatedAt: new Date() }).where(eq(memos.id, id));
  }

  async function toggleMemoPin(id: string, current: Date | null) {
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
          setShowFilterSheet(false);
        },
      },
    ]);
  }

  // ── 할 일 핸들러 ──
  async function handleTodoQuickAdd() {
    const title = todoInput.trim();
    if (!title) return;
    await db.insert(todos).values({ title, quadrant: selectedQuadrant });
    setTodoInput("");
    Keyboard.dismiss();
  }

  async function toggleTodo(id: string, current: Date | null) {
    await db.update(todos).set({ checkedAt: current ? null : new Date(), updatedAt: new Date() }).where(eq(todos.id, id));
  }

  async function deleteTodo(id: string) {
    await db.delete(todos).where(eq(todos.id, id));
  }

  async function deleteCheckedTodos() {
    Alert.alert("완료 항목 삭제", `완료된 할 일 ${todoDoneCount}개를 삭제합니다.`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(todos).where(isNotNull(todos.checkedAt));
          setShowTodoFilterSheet(false);
        },
      },
    ]);
  }

  const memoFilterBadge = [completionFilter !== "all", sortOrder !== "newest", showDate].filter(Boolean).length;

  function toggleSearch() {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery("");
    } else {
      setShowSearch(true);
    }
  }

  // ── 렌더 ──
  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="노트"
        searchOnPress={toggleSearch}
        searchActive={showSearch}
        slidersOnPress={
          activeTab === "memo"
            ? () => setShowFilterSheet(true)
            : () => setShowTodoFilterSheet(true)
        }
        slidersActive={activeTab === "memo" ? memoFilterBadge > 0 : todoDoneCount > 0}
      />

      {/* 서브탭 */}
      <View className="flex-row px-5 border-b border-[#1e1e1e]">
        {(["memo", "todo"] as NoteTab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="mr-5 pb-2.5 pt-1"
            style={{ borderBottomWidth: activeTab === tab ? 2 : 0, borderColor: "#4ecdc4" }}
          >
            <Text
              className="text-[14px] font-semibold"
              style={{ color: activeTab === tab ? "#4ecdc4" : "#666" }}
            >
              {tab === "memo" ? "메모" : "할 일"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 로컬 검색 바 */}
      {showSearch && (
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeTab === "memo" ? "메모 내용 검색..." : "할 일 제목 검색..."}
        />
      )}

      {activeTab === "memo" ? (
        // ────────────── 메모 탭 ──────────────
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
                    onPress={() => toggleMemoCheck(item.id, item.checkedAt ?? null)}
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
                  <Pressable onPress={() => toggleMemoPin(item.id, item.pinnedAt ?? null)} hitSlop={8} className="p-1">
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
            onSubmit={handleMemoQuickAdd}
          />
        </>
      ) : (
        // ────────────── 할 일 탭 (아이젠하워 매트릭스) ──────────────
        <>
          {/* 2×2 그리드 */}
          <View>
            {([0, 2] as const).map((rowStart) => (
              <View key={rowStart} className="flex-row">
                {QUADRANTS.slice(rowStart, rowStart + 2).map((q) => {
                  const isSelected = selectedQuadrant === q.key;
                  return (
                    <Pressable
                      key={q.key}
                      onPress={() => setSelectedQuadrant(q.key)}
                      className="flex-1 p-3"
                      style={{
                        borderWidth: isSelected ? 1.5 : 0.5,
                        borderColor: isSelected ? q.color : "#2a2a2a",
                        backgroundColor: isSelected ? `${q.color}18` : "#141414",
                        minHeight: 76,
                      }}
                    >
                      <Text style={{ color: q.color, fontSize: 13, fontWeight: "700" }}>
                        {q.label}
                      </Text>
                      <Text style={{ color: "#555", fontSize: 10, marginTop: 1 }}>
                        {q.sub}
                      </Text>
                      {todoCounts[q.key].total > 0 && (
                        <View
                          className="mt-1.5 self-start rounded-full px-2 py-0.5"
                          style={{ backgroundColor: `${q.color}22` }}
                        >
                          <Text style={{ color: q.color, fontSize: 11, fontWeight: "600" }}>
                            {todoCounts[q.key].done}/{todoCounts[q.key].total}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* 선택 사분면 항목 */}
          <FlatList
            data={quadrantTodos}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 96 }}
            renderItem={({ item }) => {
              const isChecked = !!item.checkedAt;
              return (
                <View className="flex-row items-center gap-3 py-3 px-4 border-b border-[#1e1e1e]">
                  <Pressable
                    onPress={() => toggleTodo(item.id, item.checkedAt ?? null)}
                    hitSlop={8}
                    className="w-6 h-6 rounded-full border-2 items-center justify-center"
                    style={{ borderColor: isChecked ? "#4ecdc4" : "#444" }}
                  >
                    {isChecked && <View className="w-3 h-3 rounded-full bg-app-teal" />}
                  </Pressable>
                  <Pressable
                    className="flex-1"
                    onPress={() => router.push({ pathname: "/todos/[id]", params: { id: item.id } })}
                  >
                    <Text
                      className="text-white text-sm"
                      style={{ textDecorationLine: isChecked ? "line-through" : "none", opacity: isChecked ? 0.45 : 1 }}
                    >
                      {item.title}
                    </Text>
                    {item.dueDate && !isChecked && (
                      <Text
                        className="text-[11px] mt-0.5"
                        style={{
                          color: dDayLabel(item.dueDate, false).includes("전") ? "#ff6b6b"
                            : dDayLabel(item.dueDate, false) === "D-Day" ? "#f59e0b"
                            : "#666",
                        }}
                      >
                        {dDayLabel(item.dueDate, false)}
                      </Text>
                    )}
                    {item.note && (
                      <Text className="text-app-muted text-[11px] mt-0.5" numberOfLines={1}>
                        {item.note}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable onPress={() => deleteTodo(item.id)} hitSlop={8} className="p-1">
                    <Trash2 size={15} color="#444" />
                  </Pressable>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text className="text-app-muted text-center mt-10 text-[14px]">
                {QUADRANTS.find((q) => q.key === selectedQuadrant)?.label} 항목이 없습니다.
              </Text>
            }
          />

          <QuickInputBar
            placeholder={`${QUADRANTS.find((q) => q.key === selectedQuadrant)?.label}에 추가`}
            value={todoInput}
            onChange={setTodoInput}
            onSubmit={handleTodoQuickAdd}
          />
        </>
      )}

      {/* 메모 필터 바텀 시트 */}
      <FilterBottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)}>
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

      {/* 할 일 필터 바텀 시트 */}
      <FilterBottomSheet visible={showTodoFilterSheet} onClose={() => setShowTodoFilterSheet(false)}>
        <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-3">
          전체 현황
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {QUADRANTS.map((q) => (
            <View
              key={q.key}
              className="flex-row items-center gap-1.5 rounded-[8px] px-3 py-2"
              style={{ backgroundColor: `${q.color}18` }}
            >
              <Text style={{ color: q.color, fontSize: 12, fontWeight: "700" }}>{q.label}</Text>
              <Text style={{ color: "#666", fontSize: 12 }}>
                {todoCounts[q.key].done}/{todoCounts[q.key].total}
              </Text>
            </View>
          ))}
        </View>
        {todoDoneCount > 0 && (
          <Pressable
            onPress={deleteCheckedTodos}
            className="flex-row items-center justify-center gap-2 rounded-[10px] py-3"
            style={{ backgroundColor: "#2a1a1a" }}
          >
            <Trash2 size={15} color="#ff6b6b" />
            <Text style={{ color: "#ff6b6b", fontSize: 13, fontWeight: "600" }}>
              완료 항목 {todoDoneCount}개 삭제
            </Text>
          </Pressable>
        )}
      </FilterBottomSheet>
    </View>
  );
}
