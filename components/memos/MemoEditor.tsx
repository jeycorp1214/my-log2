// 메모 내용 입력 텍스트 에디터 컴포넌트
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
        className="flex-1 px-5 py-4 text-[#e0e0e0] text-base leading-[26px]"
        style={{ textAlignVertical: "top" }}
        placeholder="메모 내용을 입력하세요."
        placeholderTextColor="#555"
        multiline
        autoFocus={autoFocus}
        value={value}
        onChangeText={onChange}
        scrollEnabled={false}
      />
    </>
  );
}
