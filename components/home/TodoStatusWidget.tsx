// 홈 위젯 — 할 일 사분면별 현황 요약
import { db } from "@/db/client";
import { todos, type Quadrant } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

const QUADRANTS: { key: Quadrant; label: string; color: string }[] = [
  { key: "do",       label: "즉시 실행", color: "#ff6b6b" },
  { key: "schedule", label: "계획",      color: "#4ecdc4" },
  { key: "delegate", label: "빠른 처리", color: "#f59e0b" },
  { key: "eliminate",label: "제거",       color: "#666666" },
];

export function TodoStatusWidget() {
  const router = useRouter();

  const { data: countRows = [] } = useLiveQuery(
    db
      .select({
        quadrant: todos.quadrant,
        total: count(),
        done: sql<number>`SUM(CASE WHEN ${todos.checkedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(todos)
      .groupBy(todos.quadrant),
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        countRows.map((r) => [r.quadrant, { done: r.done ?? 0, total: r.total }]),
      ) as Record<Quadrant, { done: number; total: number }>,
    [countRows],
  );

  const totalUndone = useMemo(
    () => countRows.reduce((s, r) => s + (r.total - (r.done ?? 0)), 0),
    [countRows],
  );
  const grandTotal = useMemo(() => countRows.reduce((s, r) => s + r.total, 0), [countRows]);

  if (grandTotal === 0) return null;

  return (
    <Pressable
      className="mx-4 mb-4 bg-app-surface rounded-[16px] p-4"
      onPress={() => router.push("/(tabs)/memo")}
      style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px]">
          할 일 현황
        </Text>
        {totalUndone > 0 && (
          <Text className="text-[#f59e0b] text-xs font-semibold">
            미완료 {totalUndone}개
          </Text>
        )}
      </View>
      <View className="flex-row flex-wrap gap-2">
        {QUADRANTS.map((q) => {
          const { done, total } = counts[q.key] ?? { done: 0, total: 0 };
          if (total === 0) return null;
          return (
            <View
              key={q.key}
              className="flex-row items-center gap-1.5 rounded-[8px] px-3 py-2"
              style={{ backgroundColor: `${q.color}18` }}
            >
              <Text style={{ color: q.color, fontSize: 12, fontWeight: "700" }}>
                {q.label}
              </Text>
              <Text style={{ color: "#666", fontSize: 12 }}>
                {done}/{total}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
