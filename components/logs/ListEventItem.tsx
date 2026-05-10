// 리스트 탭 이벤트 아이템 — 체크박스(일반), 반복 배지(반복), 제목/날짜
import type { EventItem } from "@/hooks/logs/use-event-filter";
import { formatLogDate } from "@/utils/date";
import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = {
  item: EventItem;
  onToggleCheck: (id: string, current: Date | null) => void;
  onPress: () => void;
};

export function ListEventItem({ item, onToggleCheck, onPress }: Props) {
  const { log, isRepeat, displayDate } = item;
  const isChecked = !!log.checkedAt;

  return (
    <View className="flex-row items-center gap-3 py-3 px-4 border-b border-[#1e1e1e]">
      {isRepeat ? (
        <View className="w-6 h-6 items-center justify-center">
          <View className="bg-[#1a3a2e] rounded-full px-1.5 py-0.5">
            <Text className="text-app-teal text-[9px] font-bold">반복</Text>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={() => onToggleCheck(log.id, log.checkedAt ?? null)}
          hitSlop={8}
          className="w-6 h-6 rounded-full border-2 items-center justify-center"
          style={{ borderColor: isChecked ? "#4ecdc4" : "#444" }}
        >
          {isChecked && <View className="w-3 h-3 rounded-full bg-app-teal" />}
        </Pressable>
      )}

      <Pressable
        onPress={onPress}
        className="flex-1 flex-row items-center gap-2"
      >
        <View className="flex-1">
          <Text
            className="text-white text-sm"
            style={{
              textDecorationLine: isChecked ? "line-through" : "none",
              opacity: isChecked ? 0.45 : 1,
            }}
          >
            {log.title}
          </Text>
          <Text className="text-app-muted text-[12px] mt-0.5">
            {formatLogDate(displayDate)}
          </Text>
        </View>
        <ChevronRight size={16} color="#444" />
      </Pressable>
    </View>
  );
}
