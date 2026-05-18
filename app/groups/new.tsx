// 그룹 추가 모달 화면
import { cn } from "@/utils/utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { PRESET_COLORS } from "@/db/seed";

export default function GroupNewScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [emoji, setEmoji] = useState("");

  async function save() {
    if (!name.trim()) {
      Alert.alert("그룹 이름을 입력해 주세요.");
      return;
    }
    await db.insert(groups).values({
      name: name.trim(),
      color,
      emoji: emoji.trim() || undefined,
      isDefault: false,
    });
    router.back();
  }

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-app-label text-[13px] mt-3">그룹 이름 *</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-sm"
        value={name}
        onChangeText={setName}
        placeholder="그룹 이름"
        placeholderTextColor="#555"
      />

      <Text className="text-app-label text-[13px] mt-3">이모지</Text>
      <TextInput
        className="bg-app-surface text-white rounded-[10px] p-3 text-sm"
        value={emoji}
        onChangeText={setEmoji}
        placeholder="🎯"
        placeholderTextColor="#555"
      />

      <Text className="text-app-label text-[13px] mt-3">색상</Text>
      <View className="flex-row flex-wrap gap-3 mt-2">
        {PRESET_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            className={cn(
              "w-9 h-9 rounded-full",
              color === c && "border-[3px] border-white",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </View>

      <Pressable
        onPress={save}
        className="bg-app-teal rounded-[12px] p-4 items-center mt-6"
      >
        <Text className="text-[#111] text-base font-bold">저장</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}
