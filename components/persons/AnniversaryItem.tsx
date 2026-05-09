// 기념일 항목 표시 컴포넌트 — 달력 날짜 뷰에서 사용
import { Cake } from "lucide-react-native";
import { View, Text } from "react-native";

type Props = { title: string };

export function AnniversaryItem({ title }: Props) {
  return (
    <View
      className="flex-row items-center gap-2 py-2.5 px-3 mb-2 rounded-[10px]"
      style={{ backgroundColor: "#1e1428" }}
    >
      <Cake size={14} color="#c084fc" />
      <Text className="text-[14px]" style={{ color: "#c084fc" }}>
        {title}
      </Text>
    </View>
  );
}
