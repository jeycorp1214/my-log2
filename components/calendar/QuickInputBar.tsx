// 퀵 입력바 — 텍스트 입력 후 즉시 저장 or 상세 화면 이동
import { cn } from "@/utils/utils";
import { Check, Plus } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";

type Props = {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  bottom: number;
};

export function QuickInputBar({
  placeholder,
  value,
  onChange,
  onSubmit,
  bottom,
}: Props) {
  const hasText = value.trim().length > 0;
  return (
    <View
      className="absolute left-0 right-0 px-4 pt-2 bg-app-bg"
      style={{ bottom }}
    >
      <View className="flex-row items-center gap-2">
        <TextInput
          className="flex-1 h-14 bg-app-surface rounded-full px-5 text-white text-[15px]"
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
