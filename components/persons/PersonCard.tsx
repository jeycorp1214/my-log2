// 인물 카드 컴포넌트 — 이름, 나이, 그룹 색상, 고정/연락 주기 표시
import { calcAge } from "@/utils/date";
import type { InferSelectModel } from "drizzle-orm";
import dayjs from "dayjs";
import type { persons } from "@/db/schema";
import { Pressable, Text, View } from "react-native";

type Person = InferSelectModel<typeof persons>;

interface Props {
  person: Person;
  groupColor: string;
  logCount?: number;
  lastLogDate?: Date;
  onPress: () => void;
  onLongPress?: () => void;
}

export function PersonCard({ person, groupColor, logCount, lastLogDate, onPress, onLongPress }: Props) {
  const age = person.birthDate ? calcAge(person.birthDate) : null;

  const daysSinceLastLog = lastLogDate
    ? dayjs().startOf("day").diff(dayjs(lastLogDate).startOf("day"), "day")
    : null;

  const isOverdue =
    person.contactInterval != null &&
    daysSinceLastLog != null &&
    daysSinceLastLog >= person.contactInterval;

  const badgeColor =
    isOverdue && person.contactInterval != null && daysSinceLastLog != null
      ? daysSinceLastLog >= person.contactInterval * 1.5
        ? "#FF6B6B"
        : "#FFA94D"
      : null;

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
          <View className="flex-row items-center gap-2">
            {badgeColor && daysSinceLastLog != null && (
              <View
                style={{ backgroundColor: badgeColor + "22", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}
              >
                <Text style={{ color: badgeColor, fontSize: 11 }}>
                  {daysSinceLastLog}일 경과
                </Text>
              </View>
            )}
            {person.isPinned && (
              <Text className="text-app-teal text-[12px]">📌</Text>
            )}
          </View>
        </View>
        <View className="flex-row gap-2">
          {age !== null && <Text className="text-[#888] text-[13px]">{age}세</Text>}
          {person.mbti && <Text className="text-[#888] text-[13px]">{person.mbti}</Text>}
        </View>
        {person.memo ? (
          <Text className="text-app-muted text-[13px]" numberOfLines={1}>{person.memo}</Text>
        ) : null}
        {(() => {
          const parsedTags: string[] = person.tags ? JSON.parse(person.tags) : [];
          return parsedTags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1 mt-0.5">
              {parsedTags.map((tag) => (
                <View key={tag} className="bg-[#1a2e2c] rounded-[6px] px-2 py-0.5">
                  <Text className="text-app-teal text-[11px]">{tag}</Text>
                </View>
              ))}
            </View>
          ) : null;
        })()}
        {logCount !== undefined && logCount > 0 && (
          <Text className="text-app-teal text-[12px] mt-0.5">관련 기록 {logCount}개 →</Text>
        )}
      </View>
    </Pressable>
  );
}
