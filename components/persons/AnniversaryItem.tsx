// 기념일 항목 표시 컴포넌트 — 달력/리스트 뷰에서 사용
import { Cake } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = { title: string; onPress?: () => void };

export function AnniversaryItem({ title, onPress }: Props) {
  const Inner = (
    <View
      className="flex-row items-center gap-2 py-2.5 px-3 mb-2 rounded-[10px]"
      style={{ backgroundColor: "#1e1428" }}
    >
      <Cake size={14} color="#c084fc" />
      <Text className="flex-1 text-[14px]" style={{ color: "#c084fc" }}>
        {title}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: "#2a1a40" }}>
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}
