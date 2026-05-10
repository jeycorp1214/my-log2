// 퀵 입력바 — 텍스트 입력 후 즉시 저장 or 상세 화면 이동
// 키보드 높이·safe area를 자체 관리하여 어느 화면에서든 동일한 위치 보장
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { cn } from "@/utils/utils";
import { Check, Plus } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
};

export function QuickInputBar({
  placeholder,
  value,
  onChange,
  onSubmit,
}: Props) {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  const hasText = value.trim().length > 0;

  // 키보드 up: 키보드 상단에 밀착 + 8px 내부 패딩 (갭 없음)
  // 키보드 down: safe area 위에 안착
  const bottom = keyboardHeight > 0 ? keyboardHeight : insets.bottom;
  const paddingBottom = keyboardHeight > 0 ? 8 : 0;

  return (
    <View
      className="absolute bottom-0 w-full px-4 bg-app-teal"
      style={{ bottom, paddingBottom }}
    >
      <View className="flex-row items-center gap-2 py-1">
        <TextInput
          className="flex-1 h-full bg-app-surface rounded-full px-5 text-white text-sm"
          placeholder={placeholder}
          placeholderTextColor="#444"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={onSubmit}
          className={cn(
            "w-14 h-14 rounded-full items-center justify-center",
            hasText ? "bg-app-teal" : "bg-app-surface",
          )}
          style={{ elevation: 6 }}
        >
          {hasText ? (
            <Check size={22} color="#111" />
          ) : (
            <Plus size={24} color="#9ca3af" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
