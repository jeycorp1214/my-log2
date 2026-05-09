// 캘린더 디버그 정보 바 — 쿼리 상태 및 로그 샘플 표시
import { logs } from "@/db/schema";
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";
import { Text, View } from "react-native";

type Log = InferSelectModel<typeof logs>;

type Props = {
  currentMonth: Date;
  monthStart: Date;
  monthEnd: Date;
  monthLogs: Log[];
  allRepeatLogs: Log[];
  selectedDate: Date | null;
  viewMode: "compact" | "board";
};

export function CalendarDebugBar({
  currentMonth,
  monthStart,
  monthEnd,
  monthLogs,
  allRepeatLogs,
  selectedDate,
  viewMode,
}: Props) {
  return (
    <View className="bg-[#2a1a1a] px-3 py-2 border-b border-[#444]">
      <Text className="text-[10px] text-app-teal font-mono font-bold">🔍 DEBUG</Text>
      <Text className="text-[10px] text-app-muted font-mono">
        월: {dayjs(currentMonth).format("YYYY년 M월")} | 범위:{" "}
        {dayjs(monthStart).format("YYYY년 M월 D일")} ~{" "}
        {dayjs(monthEnd).format("YYYY년 M월 D일")}
      </Text>
      <Text className="text-[10px] text-[#888] font-mono">
        monthLogs: {monthLogs.length} | allRepeatLogs: {allRepeatLogs.length} |
        selectedDate: {selectedDate ? "있음" : "없음"} | mode: {viewMode}
      </Text>
      {monthLogs.length > 0 && (
        <View className="mt-1 pl-2 border-l border-[#666]">
          {monthLogs.slice(0, 3).map((log) => (
            <Text key={log.id} className="text-[9px] text-[#aaa] font-mono">
              • {dayjs(log.logDate).format("YYYY년 M월 D일")} - {log.title}
            </Text>
          ))}
          {monthLogs.length > 3 && (
            <Text className="text-[9px] text-[#666] font-mono">
              ... +{monthLogs.length - 3} more
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
