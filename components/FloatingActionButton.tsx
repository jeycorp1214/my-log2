// 플로팅 액션 버튼 — 화면 우하단 고정 + Plus 아이콘
import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

type Props = {
  onPress: () => void;
};

export function FloatingActionButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-app-teal items-center justify-center"
      style={{ elevation: 6 }}
    >
      <Plus size={24} color="#111" />
    </Pressable>
  );
}
