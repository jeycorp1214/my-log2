// 프로필 상세 타임라인의 개별 아이템 컴포넌트
import { Pressable, Text, View } from "react-native";

interface TimelineItemProps {
  date: string;
  type: "log" | "anniversary";
  title: string;
  subtitle?: string;
  dday?: string;
  onPress?: () => void;
  isLast?: boolean;
}

export function TimelineItem({
  date,
  type,
  title,
  subtitle,
  dday,
  onPress,
  isLast = false,
}: TimelineItemProps) {
  const dotColor = type === "anniversary" ? "#2DD4BF" : "#6B7280";

  return (
    <View className="flex-row gap-3">
      {/* 타임라인 선 + 점 */}
      <View className="items-center" style={{ width: 20 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
            marginTop: 14,
          }}
        />
        {!isLast && (
          <View
            style={{
              width: 1.5,
              flex: 1,
              backgroundColor: "#2A2A2A",
              minHeight: 16,
            }}
          />
        )}
      </View>

      {/* 내용 */}
      <View className="flex-1 pb-3">
        <Text className="text-app-muted text-xs mt-[10px] mb-1">
          {date}
        </Text>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          className={`rounded-[10px] p-3 ${
            type === "anniversary" ? "bg-[#0F2A28]" : "bg-app-surface"
          }`}
        >
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-sm flex-1 ${
                type === "anniversary" ? "text-app-teal" : "text-white"
              }`}
            >
              {title}
            </Text>
            {dday && (
              <Text className="text-app-teal text-sm font-semibold ml-2">
                {dday}
              </Text>
            )}
          </View>
          {subtitle && (
            <Text className="text-app-muted text-xs mt-0.5">
              {subtitle}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
