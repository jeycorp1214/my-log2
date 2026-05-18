// 퀵 입력바 — Reanimated로 키보드 바로 위에 고정
import { cn } from "@/utils/utils";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { Check, Plus } from "lucide-react-native";
import { useContext } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";

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
  const hasText = value.trim().length > 0;

  // 탭바 높이 보정: 탭바 있을 때 input과 키보드 사이 gap 제거.
  // 탭바 밖에서 렌더링 시 context undefined → 0 폴백.
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  // Animated(JS 스레드) 대신 Reanimated(UI 스레드) 사용.
  // Android 신 아키텍처 + edge-to-edge에서 Animated는 타이밍 문제로
  // 포커스 시 즉시 반응 안 함. Reanimated는 UI 스레드에서 즉시 처리.
  const { height, progress } = useReanimatedKeyboardAnimation();
  const stickyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value + tabBarHeight * progress.value }],
  }));

  return (
    <Reanimated.View style={stickyStyle}>
      <View className="w-full px-4 bg-app-teal">
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
    </Reanimated.View>
  );
}
