// 탭 내부 로컬 검색용 인라인 검색 바
import { Search, X } from "lucide-react-native";
import { Pressable, TextInput, View } from "react-native";

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "검색...",
}: SearchBarProps) {
  return (
    <View className="flex-row items-center gap-2 mx-4 mb-2 bg-app-surface rounded-[10px] px-3 ">
      <Search size={15} color="#666" />
      <TextInput
        className="flex-1 text-white text-sm"
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange("")} hitSlop={8}>
          <X size={15} color="#555" />
        </Pressable>
      )}
    </View>
  );
}
