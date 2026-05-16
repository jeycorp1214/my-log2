// 프로필 카드 컴포넌트 — 이름, 나이, 그룹 색상, 고정/연락 주기 표시
import type { persons } from "@/db/schema";
import { calcAge, fromNow } from "@/utils/date";
import { parseTags } from "@/utils/person";
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";
import { Pin } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

const AVATAR_COLORS = [
  "#4ECDC4",
  "#FF6B6B",
  "#FFA94D",
  "#74C0FC",
  "#A9E34B",
  "#DA77F2",
  "#F06595",
  "#63E6BE",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type Person = InferSelectModel<typeof persons>;

interface Props {
  person: Person;
  groupColor: string;
  logCount?: number;
  lastLogDate?: Date;
  onPress: () => void;
  onPinPress?: () => void;
}

export function PersonCard({
  person,
  groupColor,
  logCount,
  lastLogDate,
  onPress,
  onPinPress,
}: Props) {
  const age = person.birthDate ? calcAge(person.birthDate) : null;

  const daysSinceLastLog = lastLogDate
    ? dayjs().startOf("day").diff(dayjs(lastLogDate).startOf("day"), "day")
    : null;

  const isOverdue =
    person.contactInterval != null &&
    (daysSinceLastLog == null || daysSinceLastLog >= person.contactInterval);

  const barColor =
    person.contactInterval == null
      ? null
      : isOverdue
        ? "#FF6B6B"
        : daysSinceLastLog != null &&
            daysSinceLastLog >= person.contactInterval * 0.75
          ? "#FFA94D"
          : "#4ecdc4";

  const barWidth =
    person.contactInterval != null
      ? Math.min(
          ((daysSinceLastLog ?? person.contactInterval) /
            person.contactInterval) *
            100,
          100,
        )
      : 0;

  const initial = person.name.charAt(0);
  const bgColor = avatarColor(person.name);
  const parsedTags = parseTags(person.tags);

  return (
    <Pressable
      onPress={onPress}
      className="bg-app-surface rounded-[14px] overflow-hidden mb-2"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="flex-row">
        <View
          className="w-1 self-stretch"
          style={{ backgroundColor: groupColor }}
        />
        <View className="justify-center pl-[12px] pr-[4px] py-[14px]">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: bgColor + "33",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: bgColor, fontSize: 16, fontWeight: "700" }}>
              {initial}
            </Text>
          </View>
        </View>
        <View className="flex-1 p-[14px] gap-1">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-white text-base font-semibold flex-1 mr-2"
              numberOfLines={1}
            >
              {person.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              {lastLogDate ? (
                <Text className="text-[#666] text-[11px]">
                  {fromNow(lastLogDate)}
                </Text>
              ) : person.contactInterval != null ? (
                <Text className="text-[#555] text-[11px]">기록 없음</Text>
              ) : null}
              {onPinPress && (
                <Pressable onPress={onPinPress} hitSlop={8}>
                  <Pin
                    size={14}
                    color={person.isPinned ? "#4ecdc4" : "#444"}
                    fill={person.isPinned ? "#4ecdc4" : "none"}
                  />
                </Pressable>
              )}
            </View>
          </View>
          <View className="flex-row gap-2">
            {age !== null && (
              <Text className="text-[#888] text-[13px]">{age}세</Text>
            )}
            {person.mbti && (
              <Text className="text-[#888] text-[13px]">{person.mbti}</Text>
            )}
          </View>
          {person.memo ? (
            <Text className="text-app-muted text-[13px]" numberOfLines={1}>
              {person.memo}
            </Text>
          ) : null}
          {parsedTags.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-0.5">
              {parsedTags.map((tag) => (
                <View
                  key={tag}
                  className="bg-[#1a2e2c] rounded-[6px] px-2 py-0.5"
                >
                  <Text className="text-app-teal text-[11px]">{tag}</Text>
                </View>
              ))}
            </View>
          )}
          {logCount !== undefined && logCount > 0 && (
            <Text className="text-app-teal text-[12px] mt-0.5">
              관련 기록 {logCount}개 →
            </Text>
          )}
        </View>
      </View>

      {/* 연락 주기 진행률 바 */}
      {barColor != null && (
        <View className="h-[2px] bg-[#1e1e1e]">
          <View
            className="h-full"
            style={{ width: `${barWidth}%`, backgroundColor: barColor }}
          />
        </View>
      )}
    </Pressable>
  );
}
