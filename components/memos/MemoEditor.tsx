import { TextInput } from "react-native";

interface Props {
  value: string;
  onChange: (text: string) => void;
  isSaveEnabled: boolean;
  autoFocus?: boolean;
}

export function MemoEditor({ value, onChange, autoFocus = false }: Props) {
  return (
    <>
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
    </>
  );
}
