// 퀵 입력바 — KeyboardStickyView로 키보드 바로 위에 고정
import { cn } from "@/utils/utils";
import { Check, Plus } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
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
  const insets = useSafeAreaInsets();
  const hasText = value.trim().length > 0;

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
      <View
        className="w-full px-4 bg-app-teal"
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }}
      >
        <View className="flex-row items-center gap-2 py-3">
          <TextInput
            className="flex-1 h-14 bg-app-surface rounded-full px-5 text-white text-sm"
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
    </KeyboardStickyView>
  );
}
