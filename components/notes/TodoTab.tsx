// 할 일 서브탭 — 아이젠하워 매트릭스 기반 우선순위 관리
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import { FilterBottomSheet } from "@/components/FilterBottomSheet";
import { db } from "@/db/client";
import { todos, type Quadrant } from "@/db/schema";
import { dDayLabel } from "@/utils/date";
import { asc, eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, FlatList, Keyboard, Pressable, Text, View } from "react-native";

type QuadrantConfig = {
  key: Quadrant;
  label: string;
  sub: string;
  color: string;
};

const QUADRANTS: QuadrantConfig[] = [
  { key: "do",       label: "즉시 실행", sub: "긴급 + 중요",     color: "#ff6b6b" },
  { key: "schedule", label: "계획",      sub: "중요 + 여유",     color: "#4ecdc4" },
  { key: "delegate", label: "빠르게 처리", sub: "긴급 + 비중요", color: "#f59e0b" },
  { key: "eliminate",label: "제거",       sub: "비긴급 + 비중요", color: "#666666" },
];

type Props = {
  searchQuery: string;
  filterSheetVisible: boolean;
  onFilterSheetClose: () => void;
  onDoneCountChange: (count: number) => void;
};

export function TodoTab({ searchQuery, filterSheetVisible, onFilterSheetClose, onDoneCountChange }: Props) {
  const router = useRouter();
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>("do");
  const [todoInput, setTodoInput] = useState("");

  const { data: allTodos = [] } = useLiveQuery(
    db.select().from(todos).orderBy(asc(todos.createdAt)),
  );

  const quadrantTodos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTodos
      .filter((t) => {
        if (q) return t.title?.toLowerCase().includes(q);
        return t.quadrant === selectedQuadrant;
      })
      .sort((a, b) => {
        if (!a.checkedAt && b.checkedAt) return -1;
        if (a.checkedAt && !b.checkedAt) return 1;
        return 0;
      });
  }, [allTodos, searchQuery, selectedQuadrant]);

  const todoCounts = useMemo(
    () =>
      Object.fromEntries(
        QUADRANTS.map((q) => {
          const qTodos = allTodos.filter((t) => t.quadrant === q.key);
          return [q.key, { done: qTodos.filter((t) => !!t.checkedAt).length, total: qTodos.length }];
        }),
      ) as Record<Quadrant, { done: number; total: number }>,
    [allTodos],
  );

  const todoDoneCount = useMemo(() => {
    const count = allTodos.filter((t) => !!t.checkedAt).length;
    onDoneCountChange(count);
    return count;
  }, [allTodos]);

  async function handleQuickAdd() {
    const title = todoInput.trim();
    if (!title) return;
    await db.insert(todos).values({ title, quadrant: selectedQuadrant });
    setTodoInput("");
    Keyboard.dismiss();
  }

  async function toggleTodo(id: number, current: Date | null) {
    await db.update(todos).set({ checkedAt: current ? null : new Date(), updatedAt: new Date() }).where(eq(todos.id, id));
  }

  async function deleteTodo(id: number) {
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
          onFilterSheetClose();
        },
      },
    ]);
  }

  return (
    <>
      {/* 2×2 매트릭스 그리드 */}
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
        keyExtractor={(item) => String(item.id)}
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
        onSubmit={handleQuickAdd}
      />

      <FilterBottomSheet visible={filterSheetVisible} onClose={onFilterSheetClose}>
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
    </>
  );
}
