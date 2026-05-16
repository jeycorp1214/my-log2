// 기념일 D-Day 카드 컴포넌트 — 프로필명, 제목, D-Day 표시
import { Cake, Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface Props {
  personName: string;
  title: string;
  dDay: string;
  isBirthday: boolean;
  onPress?: () => void;
}

export function AnniversaryCard({
  personName,
  title,
  dDay,
  isBirthday,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "#2a1a40" }}>
    <View className="bg-app-surface rounded-[14px] p-[14px] flex-row items-center gap-3">
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: "#f9731620" }}
      >
        {isBirthday ? (
          <Cake size={16} color="#f97316" />
        ) : (
          <Star size={16} color="#f97316" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-semibold" numberOfLines={1}>
          {personName}
        </Text>
        <Text className="text-app-muted text-xs mt-0.5" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text className="text-[#f97316] text-xs font-semibold">{dDay}</Text>
    </View>
    </Pressable>
  );
}
