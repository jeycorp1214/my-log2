// 캘린더 탭 헤더 — 제목 + 뷰 모드 토글 / 검색 / 오늘 버튼
import { cn } from "@/utils/utils";
import { Search } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = {
  viewMode: "compact" | "board";
  onToggleView: () => void;
  onSearchPress: () => void;
  onTodayPress: () => void;
};

export function CalendarHeader({ viewMode, onToggleView, onSearchPress, onTodayPress }: Props) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
      <Text className="text-white text-2xl font-bold">캘린더</Text>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={onToggleView}
          className="bg-app-surface rounded-[12px] px-[10px] py-[5px]"
        >
          <Text
            className={cn(
              "text-xs font-semibold",
              viewMode === "board" ? "text-app-teal" : "text-app-muted",
            )}
          >
            {viewMode === "compact" ? "보드" : "컴팩트"}
          </Text>
        </Pressable>

        <Pressable onPress={onSearchPress} className="p-2" hitSlop={4}>
          <Search size={20} color="#888" />
        </Pressable>

        <Pressable
          onPress={onTodayPress}
          className="bg-app-surface rounded-[12px] px-[10px] py-[5px]"
        >
          <Text className="text-app-teal text-xs font-semibold">오늘</Text>
        </Pressable>
      </View>
    </View>
  );
}
