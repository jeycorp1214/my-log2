// 프로필 카드 컴포넌트 — 이름, 나이, 그룹 색상, 고정/연락 주기 표시
import type { persons } from "@/db/schema";
import { calcAge, fromNow } from "@/utils/date";
import { parseTags } from "@/utils/person";
import type { InferSelectModel } from "drizzle-orm";
import { StarIcon } from "lucide-react-native";
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
  logCount,
  lastLogDate,
  onPress,
  onPinPress,
}: Props) {
  const age = person.birthDate ? calcAge(person.birthDate) : null;
  const initial = person.name.charAt(0);
  const bgColor = avatarColor(person.name);
  const parsedTags = parseTags(person.tags);

  const metaLine = [
    age != null ? `${age}세` : null,
    person.mbti || null,
    lastLogDate
      ? fromNow(lastLogDate)
      : person.contactInterval != null
        ? ""
        : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      className="bg-app-surface rounded-[14px] mb-2"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="flex-row px-4 gap-3">
        <View className="justify-center px-[12px] pr-[4px] py-[14px]">
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

        <View className="flex-1 px-[10px] py-[14px] gap-1">
          {/* 1줄: 이름 + 태그 + 핀 */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 gap-2 flex-row flex-wrap items-center  ">
              <Text
                className="text-white text-base font-semibold"
                style={{ flexShrink: 1 }}
                numberOfLines={1}
              >
                {person.name}
              </Text>
              {parsedTags.map((tag) => (
                <View
                  key={tag}
                  className="bg-[#1a2e2c] rounded-[6px] px-1.5 py-0.5"
                >
                  <Text className="text-app-teal text-[11px]">{tag}</Text>
                </View>
              ))}
            </View>
            {onPinPress && (
              <Pressable onPress={onPinPress} hitSlop={8}>
                <StarIcon
                  size={20}
                  color={person.isPinned ? "#4ecdc4" : "#444"}
                  fill={person.isPinned ? "#4ecdc4" : "none"}
                />
              </Pressable>
            )}
          </View>

          {/* 2줄: 나이 · MBTI · 마지막 연락 */}
          {metaLine.length > 0 && (
            <Text className="text-[#888] text-[13px]">{metaLine}</Text>
          )}

          {/* 3줄: 메모 */}
          {person.memo ? (
            <Text className="text-app-muted text-[13px]" numberOfLines={1}>
              {person.memo}
            </Text>
          ) : null}

          {logCount !== undefined && logCount > 0 && (
            <Text className="text-app-teal text-[12px] mt-0.5">
              관련 기록 {logCount}개 →
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
