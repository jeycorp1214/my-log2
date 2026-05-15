// 인물 카드 컴포넌트 — 이름, 나이, 그룹 색상, 고정 표시
import { calcAge } from "@/utils/date";
import type { InferSelectModel } from "drizzle-orm";
import type { persons } from "@/db/schema";
import { Pressable, Text, View } from "react-native";

type Person = InferSelectModel<typeof persons>;

interface Props {
  person: Person;
  groupColor: string;
  logCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function PersonCard({ person, groupColor, logCount, onPress, onLongPress }: Props) {
  const age = person.birthDate ? calcAge(person.birthDate) : null;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-row bg-app-surface rounded-[14px] overflow-hidden mb-2"
      style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
    >
      <View className="w-1" style={{ backgroundColor: groupColor }} />
      <View className="flex-1 p-[14px] gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-base font-semibold">{person.name}</Text>
          {person.isPinned && (
            <Text className="text-app-teal text-[12px]">📌</Text>
          )}
        </View>
        <View className="flex-row gap-2">
          {age !== null && <Text className="text-[#888] text-[13px]">{age}세</Text>}
          {person.mbti && <Text className="text-[#888] text-[13px]">{person.mbti}</Text>}
        </View>
        {person.memo ? (
          <Text className="text-app-muted text-[13px]" numberOfLines={1}>{person.memo}</Text>
        ) : null}
        {logCount !== undefined && logCount > 0 && (
          <Text className="text-app-teal text-[12px] mt-0.5">관련 기록 {logCount}개 →</Text>
        )}
      </View>
    </Pressable>
  );
}
