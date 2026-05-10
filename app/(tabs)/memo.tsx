// 메모 탭 — 체크박스 기반 메모/할일 목록 + 완료 상태 필터
import { QuickInputBar } from "@/components/calendar/QuickInputBar";
import TabsHeader from "@/components/layout/TabsHeader";
import { db } from "@/db/client";
import { memos } from "@/db/schema";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

type CompletionFilter = "all" | "done" | "undone";
type SortOrder = "newest" | "oldest";

export default function MemoScreen() {
  const router = useRouter();
  const [quickContent, setQuickContent] = useState("");
  const { prefs, setMemoPrefs } = useTabPreferences();
  const completionFilter = prefs.memo.completionFilter as CompletionFilter;
  const setCompletionFilter = (v: CompletionFilter) =>
    setMemoPrefs({ completionFilter: v });
  const sortOrder = prefs.memo.sortOrder as SortOrder;
  const setSortOrder = (v: SortOrder) => setMemoPrefs({ sortOrder: v });
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const { data: allMemos = [] } = useLiveQuery(
    db
      .select()
      .from(memos)
      .orderBy(
        sortOrder === "newest" ? desc(memos.createdAt) : asc(memos.createdAt),
      ),
    [sortOrder],
  );

  const filtered = allMemos.filter((m) => {
    if (completionFilter === "done") return !!m.checkedAt;
    if (completionFilter === "undone") return !m.checkedAt;
    return true;
  });

  const doneCount = allMemos.filter((m) => !!m.checkedAt).length;

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
    await db
      .update(memos)
      .set({ checkedAt: current ? null : new Date(), updatedAt: new Date() })
      .where(eq(memos.id, id));
  }

  async function deleteMemo(id: string, isChecked: boolean) {
    if (isChecked) {
      await db.delete(memos).where(eq(memos.id, id));
      return;
    }
    Alert.alert("메모 삭제", "이 메모를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => db.delete(memos).where(eq(memos.id, id)),
      },
    ]);
  }

  async function deleteChecked() {
    Alert.alert("완료 항목 삭제", `완료된 메모 ${doneCount}개를 삭제합니다.`, [
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

  const filterBadge = [
    completionFilter !== "all",
    sortOrder !== "newest",
  ].filter(Boolean).length;

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="메모"
        slidersOnPress={() => setShowFilterSheet(true)}
        slidersActive={filterBadge > 0}
      />

      {/* 요약 */}
      <View className="flex-row items-center px-5 py-2 border-b border-[#1e1e1e]">
        <Text className="text-app-muted text-[13px]">
          총 {allMemos.length}개 · 완료 {doneCount}개
        </Text>
      </View>

      {/* 메모 리스트 */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 96 }} // 퀵 입력 바 겹침 방지
        renderItem={({ item }) => {
          const isChecked = !!item.checkedAt;
          return (
            <View className="flex-row items-center gap-3 py-3 px-4 border-b border-[#1e1e1e]">
              {/* 체크박스 */}
              <Pressable
                onPress={() => toggleCheck(item.id, item.checkedAt ?? null)}
                hitSlop={8} // 터치 영역 확대
                className="w-6 h-6 rounded-full border-2 items-center justify-center"
                style={{ borderColor: isChecked ? "#4ecdc4" : "#444" }}
              >
                {isChecked && (
                  <View className="w-3 h-3 rounded-full bg-app-teal" />
                )}
              </Pressable>

              {/* 내용 — 탭 시 상세 이동 */}
              <Pressable
                className="flex-1 flex-row items-center gap-2"
                onPress={() =>
                  router.push({
                    pathname: "/memos/[id]",
                    params: { id: item.id },
                  })
                }
              >
                <Text
                  className="flex-1 text-white text-sm"
                  numberOfLines={5}
                  style={{
                    textDecorationLine: isChecked ? "line-through" : "none",
                    opacity: isChecked ? 0.45 : 1,
                  }}
                >
                  {item.content}
                </Text>
              </Pressable>

              {/* 삭제 */}
              <Pressable
                onPress={() => deleteMemo(item.id, isChecked)}
                hitSlop={8}
                className="p-1"
              >
                <Trash2 size={15} color="#444" />
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="text-app-muted text-center mt-16 text-[14px]">
            메모가 없습니다.
          </Text>
        }
      />

      <QuickInputBar
        placeholder="메모 추가"
        value={quickContent}
        onChange={setQuickContent}
        onSubmit={handleQuickAdd}
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
            className="bg-app-surface rounded-t-[20px] px-5 pt-5 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-5" />

            {/* 완료 상태 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              완료 상태
            </Text>
            <View className="flex-row gap-2 mb-5">
              {(["all", "undone", "done"] as const).map((v) => {
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

            {/* 정렬 */}
            <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px] mb-2">
              정렬
            </Text>
            <View className="flex-row gap-2 mb-6">
              {(["newest", "oldest"] as const).map((v) => {
                const label = v === "newest" ? "최신순" : "오래된순";
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

            {/* 완료 항목 일괄 삭제 */}
            {doneCount > 0 && (
              <Pressable
                onPress={deleteChecked}
                className="flex-row items-center justify-center gap-2 rounded-[10px] py-3"
                style={{ backgroundColor: "#2a1a1a" }}
              >
                <Trash2 size={15} color="#ff6b6b" />
                <Text
                  style={{ color: "#ff6b6b", fontSize: 13, fontWeight: "600" }}
                >
                  완료 항목 {doneCount}개 삭제
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
