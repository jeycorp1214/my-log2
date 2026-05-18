// 홈 위젯 — 최근 12주 기록 히트맵 (GitHub 잔디 미니 버전)
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { toDateKey } from "@/utils/date";
import dayjs from "dayjs";
import { and, gte, lte } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const WEEKS = 12;

function heatColor(count: number): string {
  if (count === 0) return "#1e1e1e";
  if (count === 1) return "#0e2419";
  if (count <= 3) return "#1a3a2e";
  if (count <= 6) return "#2d5a40";
  return "#4ecdc4";
}

export function MiniHeatmapWidget() {
  const router = useRouter();

  const rangeStart = useMemo(
    () => dayjs().subtract(WEEKS - 1, "week").startOf("week").toDate(),
    [],
  );
  const rangeEnd = useMemo(() => dayjs().endOf("day").toDate(), []);

  const { data: rangeLogs = [] } = useLiveQuery(
    db
      .select({ logDate: logs.logDate })
      .from(logs)
      .where(and(gte(logs.logDate, rangeStart), lte(logs.logDate, rangeEnd))),
  );

  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of rangeLogs) {
      const key = toDateKey(new Date(log.logDate));
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [rangeLogs]);

  const weeks = useMemo(() => {
    const start = dayjs(rangeStart);
    const result: string[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(start.add(w * 7 + d, "day").format("YYYY-MM-DD"));
      }
      result.push(week);
    }
    return result;
  }, [rangeStart]);

  const todayKey = toDateKey(new Date());
  const totalInRange = Object.values(countByDay).reduce((s, n) => s + n, 0);

  return (
    <Pressable
      className="mx-4 mb-4 bg-app-surface rounded-[16px] p-4"
      onPress={() => router.push("/settings/heatmap")}
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px]">
          최근 12주
        </Text>
        <Text className="text-app-teal text-xs">{totalInRange}개 →</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: GAP }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: GAP }}>
              {week.map((dayStr) => {
                const count = countByDay[dayStr] ?? 0;
                const isToday = dayStr === todayKey;
                return (
                  <View
                    key={dayStr}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 2,
                      backgroundColor: heatColor(count),
                      borderWidth: isToday ? 1 : 0,
                      borderColor: "#4ecdc4",
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-2 mt-3">
        <Text className="text-[#555] text-xs">적음</Text>
        {["#1e1e1e", "#0e2419", "#1a3a2e", "#2d5a40", "#4ecdc4"].map((c) => (
          <View
            key={c}
            style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: c }}
          />
        ))}
        <Text className="text-[#555] text-xs">많음</Text>
      </View>
    </Pressable>
  );
}
