// 퀵 입력바 — KeyboardStickyView로 키보드 바로 위에 고정
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { cn } from "@/utils/utils";
import { Check, Plus } from "lucide-react-native";
import { useContext } from "react";
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

  // 탭바 높이만큼 opened offset 보정: 탭바 있을 때 input과 키보드 사이 gap 제거.
  // 탭바 밖에서 렌더링 시 context가 undefined → 0으로 폴백.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: tabBarHeight }}>
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
