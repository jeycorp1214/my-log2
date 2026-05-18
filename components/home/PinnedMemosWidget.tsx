// 홈 위젯 — 고정된 메모 목록
import { db } from "@/db/client";
import { memos } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Pin } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function PinnedMemosWidget() {
  const router = useRouter();

  const { data: pinned = [] } = useLiveQuery(
    db
      .select()
      .from(memos)
      .where(isNotNull(memos.pinnedAt))
      .orderBy(desc(memos.pinnedAt))
      .limit(5),
  );

  if (pinned.length === 0) return null;

  return (
    <View className="mx-4 mb-4 bg-app-surface rounded-[16px] overflow-hidden">
      <View className="px-4 pt-4 pb-2 flex-row items-center gap-1.5">
        <Pin size={11} color="#888" fill="#888" />
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px]">
          고정 메모
        </Text>
      </View>
      {pinned.map((memo, idx) => (
        <Pressable
          key={memo.id}
          onPress={() => router.push({ pathname: "/memos/[id]", params: { id: memo.id } })}
          className={`px-4 py-3 ${idx < pinned.length - 1 ? "border-b border-[#1e1e1e]" : "pb-4"}`}
          style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
        >
          <Text
            className="text-white text-sm"
            numberOfLines={2}
            style={{ opacity: memo.checkedAt ? 0.4 : 1, textDecorationLine: memo.checkedAt ? "line-through" : "none" }}
          >
            {memo.content}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
