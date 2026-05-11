// KeyboardStickyView 동작 테스트 — 더미 목록 + 키보드 고정 입력창
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DUMMY_ITEMS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  label: `더미 항목 ${i + 1}`,
  desc: `스크롤해도 입력창이 키보드 바로 위에 붙어있는지 확인`,
}));

export default function KeyboardTestScreen() {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string[]>([]);

  // KeyboardStickyView(Animated/JS 스레드) 대신 Reanimated(UI 스레드) 사용.
  // Android 신 아키텍처 + edge-to-edge 환경에서 Animated 이벤트는 타이밍 문제로
  // 포커스 시 즉시 반응 안 하고, 키보드 내림 시 복귀 안 하는 문제 발생.
  const { height } = useReanimatedKeyboardAnimation();
  const stickyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value }],
  }));

  function handleSubmit() {
    if (!text.trim()) return;
    setSubmitted((prev) => [text.trim(), ...prev]);
    setText("");
  }

  return (
    <View className="flex-1 bg-app-bg">
      <KeyboardAwareScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {submitted.length > 0 && (
          <View className="mb-4">
            <Text className="text-app-label text-[11px] uppercase tracking-widest mb-2">
              입력된 텍스트
            </Text>
            {submitted.map((s, i) => (
              <View key={i} className="bg-app-teal/20 rounded-lg px-3 py-2 mb-1">
                <Text className="text-app-teal text-sm">{s}</Text>
              </View>
            ))}
          </View>
        )}

        <Text className="text-app-label text-[11px] uppercase tracking-widest mb-2">
          더미 목록 (스크롤 테스트)
        </Text>
        {DUMMY_ITEMS.map((item) => (
          <View
            key={item.id}
            className="bg-app-surface rounded-xl px-4 py-3 mb-2"
          >
            <Text className="text-white text-sm font-medium">{item.label}</Text>
            <Text className="text-app-muted text-[11px] mt-0.5">{item.desc}</Text>
          </View>
        ))}
      </KeyboardAwareScrollView>

      <Reanimated.View style={stickyStyle}>
        <View
          className="px-4 bg-app-surface border-t border-[#2a2a2a]"
          style={{
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 10,
          }}
        >
          <Text className="text-app-muted text-[10px] mb-1 text-center">
            포커스 시 즉시 올라오고 · 키보드 내리면 즉시 내려와야 함
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 h-11 bg-[#1a1a1a] rounded-full px-4 text-white text-sm"
              placeholder="텍스트 입력 후 전송..."
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSubmit}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <View className="px-4 h-11 rounded-full bg-app-teal items-center justify-center">
              <Text
                className="text-black text-sm font-semibold"
                onPress={handleSubmit}
              >
                전송
              </Text>
            </View>
          </View>
        </View>
      </Reanimated.View>
    </View>
  );
}
