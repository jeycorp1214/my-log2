// 로그 카드 컴포넌트 — 제목, 메모 미리보기, 반복 배지
import type { logs } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { RotateCw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Log = InferSelectModel<typeof logs>;

interface Props {
  log: Log;
  onPress: () => void;
}

export function LogCard({ log, onPress }: Props) {
  const hasRepeat = log.repeatType && log.repeatType !== "none";

  return (
    <Pressable
      onPress={onPress}
      className="bg-app-surface rounded-[14px] p-[14px]"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="gap-1">
        <View className="flex-row items-center gap-[6px]">
          <Text
            className="flex-1 text-white text-sm font-semibold"
            numberOfLines={1}
          >
            {log.title}
          </Text>
          {hasRepeat && (
            <View className="bg-app-teal-dark rounded-[10px] px-2 flex-row items-center gap-1">
              <RotateCw size={10} color="#4ECDC4" />
              <Text className="text-[#4ECDC4] text-[10px] font-semibold">
                반복
              </Text>
            </View>
          )}
        </View>
        {log.memo ? (
          <Text
            className="text-[#888] text-[13px] leading-[18px]"
            numberOfLines={2}
          >
            {log.memo}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
