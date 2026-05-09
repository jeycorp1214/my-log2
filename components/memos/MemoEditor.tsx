import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from "react-native";

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSave: () => void;
  isSaveEnabled: boolean;
  onBack: () => void;
  autoFocus?: boolean;
}

export function MemoEditor({
  value,
  onChange,
  onSave,
  isSaveEnabled,
  onBack,
  autoFocus = false,
}: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      {/* 1. 메인 입력 영역 */}
      <ScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 20, gap: 8, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingVertical: 16,
            color: "#e0e0e0",
            fontSize: 16,
            lineHeight: 26,
            textAlignVertical: "top",
          }}
          placeholder="메모 내용을 입력하세요."
          placeholderTextColor="#555"
          multiline
          autoFocus={autoFocus}
          value={value}
          onChangeText={onChange}
          scrollEnabled={false} // ScrollView가 스크롤을 담당하므로 꺼줌
        />
      </ScrollView>

      <Pressable
        onPress={onSave}
        className="bg-app-teal rounded-[12px] p-4 items-center mt-6"
      >
        <Text className="text-[#111] text-base font-bold">저장</Text>
      </Pressable>
      <Pressable onPress={onBack} className="items-center py-3">
        <Text className="text-app-muted text-[14px]">취소</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
