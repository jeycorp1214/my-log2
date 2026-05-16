// 홈 대시보드 최근 기록 아이템 — 그룹 컬러 도트 + 상대 날짜 + 완료 취소선
import { RotateCw } from "lucide-react-native";
import dayjs from "dayjs";
import { Pressable, Text, View } from "react-native";

interface Props {
  title: string;
  logDate: Date;
  checkedAt: Date | null;
  groupColor: string;
  groupEmoji: string | null;
  groupName: string;
  repeatType: string | null;
  onPress: () => void;
}

function relativeDateLabel(date: Date): string {
  const today = dayjs().startOf("day");
  const d = dayjs(date).startOf("day");
  const diff = today.diff(d, "day");
  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  if (diff <= 6) return `${diff}일 전`;
  return dayjs(date).format("M월 D일");
}

export function HomeLogItem({
  title,
  logDate,
  checkedAt,
  groupColor,
  groupEmoji,
  groupName,
  repeatType,
  onPress,
}: Props) {
  const isChecked = !!checkedAt;
  const hasRepeat = repeatType && repeatType !== "none";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
      className="flex-row items-center gap-3 px-4 py-3 bg-app-surface rounded-[14px]"
    >
      {/* 그룹 컬러 도트 */}
      <View
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: groupColor }}
      />

      {/* 본문 */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="flex-1 text-[14px] font-semibold"
            numberOfLines={1}
            style={{
              color: isChecked ? "#555" : "#fff",
              textDecorationLine: isChecked ? "line-through" : "none",
            }}
          >
            {title}
          </Text>
          {hasRepeat && (
            <RotateCw size={11} color="#4ECDC4" />
          )}
        </View>
        <Text className="text-app-muted text-[12px]">
          {relativeDateLabel(logDate)}
          {groupEmoji
            ? `  ·  ${groupEmoji} ${groupName}`
            : `  ·  ${groupName}`}
        </Text>
      </View>

      {/* 완료 표시 */}
      {isChecked && (
        <View className="w-4 h-4 rounded-full bg-app-teal items-center justify-center flex-shrink-0">
          <View className="w-2 h-2 rounded-full bg-[#111]" />
        </View>
      )}
    </Pressable>
  );
}
