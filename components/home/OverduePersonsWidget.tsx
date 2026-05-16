// 홈 위젯 — 연락 주기가 지난 인물 목록
import { db } from "@/db/client";
import { logPersons, logs, persons } from "@/db/schema";
import { eq, isNotNull, max, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

export function OverduePersonsWidget() {
  const router = useRouter();

  const { data: rows = [] } = useLiveQuery(
    db
      .select({
        id: persons.id,
        name: persons.name,
        contactInterval: persons.contactInterval,
        lastLogDate: max(logs.logDate).as("last_log_date"),
      })
      .from(persons)
      .leftJoin(logPersons, eq(logPersons.personId, persons.id))
      .leftJoin(logs, eq(logs.id, logPersons.logId))
      .where(isNotNull(persons.contactInterval))
      .groupBy(persons.id),
  );

  const overdue = useMemo(() => {
    const today = dayjs().startOf("day");
    return rows
      .map((r) => {
        const lastDate = r.lastLogDate ? dayjs(r.lastLogDate).startOf("day") : null;
        const daysSince = lastDate ? today.diff(lastDate, "day") : null;
        const interval = r.contactInterval!;
        const isOverdue = daysSince === null || daysSince >= interval;
        return { ...r, daysSince, isOverdue };
      })
      .filter((r) => r.isOverdue)
      .sort((a, b) => (b.daysSince ?? 9999) - (a.daysSince ?? 9999))
      .slice(0, 5);
  }, [rows]);

  if (overdue.length === 0) return null;

  return (
    <View className="mx-4 mb-4 bg-app-surface rounded-[16px] overflow-hidden">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px]">
          연락 필요
        </Text>
        <Text className="text-[#555] text-[11px]">{overdue.length}명</Text>
      </View>
      {overdue.map((p, idx) => (
        <Pressable
          key={p.id}
          onPress={() => router.push({ pathname: "/persons/[id]", params: { id: p.id } })}
          className={`flex-row items-center px-4 py-3 ${idx < overdue.length - 1 ? "border-b border-[#1e1e1e]" : "pb-4"}`}
          style={({ pressed }) => pressed ? { opacity: 0.7 } : undefined}
        >
          <Text className="flex-1 text-white text-[14px]">{p.name}</Text>
          <Text className="text-[#ff6b6b] text-[12px] font-semibold">
            {p.daysSince === null ? "기록 없음" : `${p.daysSince}일 경과`}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
