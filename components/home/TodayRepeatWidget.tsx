// 홈 위젯 — 오늘 발생하는 반복 기록
import { db } from "@/db/client";
import { groups, logs } from "@/db/schema";
import { expandRepeatInMonth } from "@/utils/repeat";
import dayjs from "dayjs";
import { and, eq, gte, isNotNull, isNull, lte, ne, or } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

export function TodayRepeatWidget() {
  const router = useRouter();

  const todayStart = useMemo(() => dayjs().startOf("day").toDate(), []);
  const todayEnd = useMemo(() => dayjs().endOf("day").toDate(), []);

  const { data: repeatLogs = [] } = useLiveQuery(
    db
      .select({ log: logs, groupColor: groups.color })
      .from(logs)
      .leftJoin(groups, eq(logs.groupId, groups.id))
      .where(
        and(
          isNotNull(logs.repeatType),
          ne(logs.repeatType, "none"),
          lte(logs.logDate, todayEnd),
          or(isNull(logs.repeatUntil), gte(logs.repeatUntil, todayStart)),
        ),
      ),
  );

  const todayItems = useMemo(
    () =>
      repeatLogs.filter(
        ({ log }) => expandRepeatInMonth(log, todayStart, todayEnd).length > 0,
      ),
    [repeatLogs, todayStart, todayEnd],
  );

  if (todayItems.length === 0) return null;

  return (
    <View className="mx-4 mb-4 bg-app-surface rounded-[16px] overflow-hidden">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px]">
          오늘의 반복
        </Text>
        <Text className="text-[#555] text-xs">{todayItems.length}개</Text>
      </View>
      {todayItems.map(({ log, groupColor }, idx) => (
        <Pressable
          key={log.id}
          onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id, occurrenceDate: dayjs().format("YYYY-MM-DD") } })}
          className={`flex-row items-center gap-3 px-4 py-3 ${idx < todayItems.length - 1 ? "border-b border-[#1e1e1e]" : "pb-4"}`}
          style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
        >
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: groupColor ?? "#4ecdc4" }} />
          <Text className="flex-1 text-white text-sm" numberOfLines={1}>
            {log.title}
          </Text>
          <Text className="text-[#f59e0b] text-xs">반복</Text>
        </Pressable>
      ))}
    </View>
  );
}
