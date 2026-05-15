// 검색 결과용 할 일 아이템 — 제목 + 사분면 라벨
import type { InferSelectModel } from "drizzle-orm";
import type { todos } from "@/db/schema";
import { Pressable, Text, View } from "react-native";

type Todo = InferSelectModel<typeof todos>;

const QUADRANT_LABEL: Record<string, { label: string; color: string }> = {
  do:       { label: "즉시 실행", color: "#ff6b6b" },
  schedule: { label: "계획",      color: "#4ecdc4" },
  delegate: { label: "빠르게 처리", color: "#f59e0b" },
  eliminate:{ label: "제거",      color: "#666666" },
};

interface Props {
  todo: Todo;
  onPress: () => void;
}

export function SearchTodoItem({ todo, onPress }: Props) {
  const isChecked = !!todo.checkedAt;
  const q = QUADRANT_LABEL[todo.quadrant] ?? { label: todo.quadrant, color: "#888" };

  return (
    <Pressable
      onPress={onPress}
      className="bg-app-surface rounded-[14px] p-[14px] mb-2"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <View className="flex-row items-center gap-2">
        <View
          className="rounded-[6px] px-[6px] py-[2px]"
          style={{ backgroundColor: `${q.color}22` }}
        >
          <Text style={{ color: q.color, fontSize: 10, fontWeight: "600" }}>
            {q.label}
          </Text>
        </View>
        <Text
          className="flex-1 text-sm"
          numberOfLines={1}
          style={{
            color: isChecked ? "#666" : "#fff",
            textDecorationLine: isChecked ? "line-through" : "none",
          }}
        >
          {todo.title}
        </Text>
      </View>
    </Pressable>
  );
}
