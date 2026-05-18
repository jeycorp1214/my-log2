// 노트 탭 — 메모(체크리스트) | 할 일(아이젠하워 매트릭스) 서브탭
import TabsHeader from "@/components/layout/TabsHeader";
import { MemoTab } from "@/components/notes/MemoTab";
import { TodoTab } from "@/components/notes/TodoTab";
import { SearchBar } from "@/components/ui/SearchBar";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type NoteTab = "memo" | "todo";

export default function NoteScreen() {
  const [activeTab, setActiveTab] = useState<NoteTab>("memo");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemoFilter, setShowMemoFilter] = useState(false);
  const [showTodoFilter, setShowTodoFilter] = useState(false);
  const [memoFilterBadge, setMemoFilterBadge] = useState(0);
  const [todoDoneCount, setTodoDoneCount] = useState(0);

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="노트"
        slidersOnPress={
          activeTab === "memo"
            ? () => setShowMemoFilter(true)
            : () => setShowTodoFilter(true)
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
              className="text-sm font-semibold"
              style={{ color: activeTab === tab ? "#4ecdc4" : "#666" }}
            >
              {tab === "memo" ? "메모" : "할 일"}
            </Text>
          </Pressable>
        ))}
      </View>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={activeTab === "memo" ? "메모 내용 검색..." : "할 일 제목 검색..."}
      />

      {activeTab === "memo" ? (
        <MemoTab
          searchQuery={searchQuery}
          filterSheetVisible={showMemoFilter}
          onFilterSheetClose={() => setShowMemoFilter(false)}
          onFilterBadgeChange={setMemoFilterBadge}
        />
      ) : (
        <TodoTab
          searchQuery={searchQuery}
          filterSheetVisible={showTodoFilter}
          onFilterSheetClose={() => setShowTodoFilter(false)}
          onDoneCountChange={setTodoDoneCount}
        />
      )}
    </View>
  );
}
