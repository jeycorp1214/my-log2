// 홈 탭 — 대시보드형: 이번달 요약 + 스트릭 + 임박 기념일 + 최근 기록
import { FloatingActionButton } from "@/components/FloatingActionButton";
import TabsHeader from "@/components/layout/TabsHeader";
import { LogCard } from "@/components/logs/LogCard";
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { useAnniversariesInMonth } from "@/hooks/persons/use-anniversaries-in-month";
import {
  calcStreak,
  useAllLogDates,
  useCompletionRate,
} from "@/hooks/stats/use-stats";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

dayjs.locale("ko");

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default function HomeScreen() {
  const router = useRouter();

  const today = useMemo(() => dayjs(), []);
  const todayStr = today.format(
    `YYYY년 M월 D일 ${DAYS_KO[today.day()]}요일`,
  );

  // 이번달 완료율
  const { total: monthTotal, completed: monthDone } = useCompletionRate("month");
  const monthRate =
    monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0;

  // 스트릭
  const logDates = useAllLogDates();
  const { current: streakCurrent, best: streakBest } = useMemo(
    () => calcStreak(logDates),
    [logDates],
  );

  // 7일 이내 임박 기념일
  const annStart = useMemo(() => today.startOf("day").toDate(), [today]);
  const annEnd = useMemo(
    () => today.add(7, "day").endOf("day").toDate(),
    [today],
  );
  const { anniversaryBoardItems } = useAnniversariesInMonth(annStart, annEnd);
  const upcomingAnn = useMemo(
    () =>
      [...anniversaryBoardItems].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      ),
    [anniversaryBoardItems],
  );

  // 최근 기록 5개
  const { data: recentLogs = [] } = useLiveQuery(
    db.select().from(logs).orderBy(desc(logs.logDate)).limit(5),
  );

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader title="홈" searchOnPress={true} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 오늘 날짜 */}
        <View className="px-5 pt-4 pb-3">
          <Text className="text-white text-[18px] font-bold">{todayStr}</Text>
        </View>

        {/* 이번달 요약 카드 */}
        <View className="mx-4 mb-4 bg-app-surface rounded-[16px] p-4">
          <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px] mb-3">
            이번 달 요약
          </Text>
          <View className="flex-row items-center mb-3">
            <View className="flex-1">
              <Text className="text-app-muted text-[13px]">
                총{" "}
                <Text className="text-white font-semibold">{monthTotal}</Text>
                개 · 완료{" "}
                <Text className="text-white font-semibold">{monthDone}</Text>개
              </Text>
            </View>
            <Text className="text-app-teal text-[22px] font-bold">
              {monthRate}%
            </Text>
          </View>
          {/* 프로그레스바 */}
          <View className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
            <View
              className="h-full bg-app-teal rounded-full"
              style={{ width: `${monthRate}%` }}
            />
          </View>
        </View>

        {/* 스트릭 카드 */}
        <View className="mx-4 mb-4 bg-app-surface rounded-[16px] p-4 flex-row gap-4">
          <View className="flex-1 items-center">
            <Text className="text-[28px] font-bold text-white">
              {streakCurrent}
            </Text>
            <Text className="text-app-muted text-[12px] mt-0.5">현재 스트릭</Text>
          </View>
          <View className="w-px bg-[#2a2a2a]" />
          <View className="flex-1 items-center">
            <Text className="text-[28px] font-bold text-white">
              {streakBest}
            </Text>
            <Text className="text-app-muted text-[12px] mt-0.5">최장 스트릭</Text>
          </View>
        </View>

        {/* 임박 기념일 */}
        {upcomingAnn.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px] mb-2 px-1">
              다가오는 기념일
            </Text>
            <View className="bg-app-surface rounded-[16px] overflow-hidden">
              {upcomingAnn.map((ann, idx) => {
                const diff = dayjs(ann.date).diff(today.startOf("day"), "day");
                const dLabel =
                  diff === 0 ? "D-Day" : `D-${diff}`;
                return (
                  <Pressable
                    key={`${ann.personId}-${ann.date.getTime()}`}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: ann.personId },
                      })
                    }
                    style={({ pressed }) =>
                      pressed ? { opacity: 0.7 } : undefined
                    }
                    className={
                      idx < upcomingAnn.length - 1
                        ? "flex-row items-center px-4 py-3 border-b border-[#1e1e1e]"
                        : "flex-row items-center px-4 py-3"
                    }
                  >
                    <Text className="flex-1 text-white text-[14px]">
                      {ann.displayTitle}
                    </Text>
                    <Text className="text-app-teal text-[13px] font-semibold">
                      {dLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* 최근 기록 */}
        <View className="mx-4">
          <View className="flex-row items-center justify-between mb-2 px-1">
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px]">
              최근 기록
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/list")}>
              <Text className="text-app-teal text-[12px]">전체 보기</Text>
            </Pressable>
          </View>
          {recentLogs.length === 0 ? (
            <Text className="text-app-muted text-center py-8 text-[14px]">
              기록이 없습니다.
            </Text>
          ) : (
            <View className="gap-2">
              {recentLogs.map((log) => (
                <LogCard
                  key={log.id}
                  log={log}
                  onPress={() =>
                    router.push({
                      pathname: "/logs/[id]",
                      params: { id: log.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <FloatingActionButton onPress={() => router.push("/logs/new")} />
    </View>
  );
}
