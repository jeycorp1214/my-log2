// 검색 결과용 메모 아이템 — 내용 미리보기 + 완료 상태
import type { InferSelectModel } from "drizzle-orm";
import type { memos } from "@/db/schema";
import { Pressable, Text, View } from "react-native";
import { CheckCircle } from "lucide-react-native";

type Memo = InferSelectModel<typeof memos>;

interface Props {
  memo: Memo;
  onPress: () => void;
}

export function SearchMemoItem({ memo, onPress }: Props) {
  const isChecked = !!memo.checkedAt;

  return (
    <Pressable
      onPress={onPress}
      className="bg-app-surface rounded-[14px] p-[14px] mb-2"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="flex-row items-start gap-2">
        {isChecked && <CheckCircle size={14} color="#4ECDC4" style={{ marginTop: 2 }} />}
        <Text
          className="flex-1 text-sm"
          numberOfLines={2}
          style={{
            color: isChecked ? "#666" : "#fff",
            textDecorationLine: isChecked ? "line-through" : "none",
          }}
        >
          {memo.content}
        </Text>
      </View>
    </Pressable>
  );
}
