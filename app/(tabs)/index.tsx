// 홈 탭 — 대시보드형: 이번달 요약 + 스트릭 + 임박 기념일 + 최근 기록
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { CategoryRatioWidget } from "@/components/home/CategoryRatioWidget";
import { MiniHeatmapWidget } from "@/components/home/MiniHeatmapWidget";
import { OverduePersonsWidget } from "@/components/home/OverduePersonsWidget";
import { PinnedMemosWidget } from "@/components/home/PinnedMemosWidget";
import { TodayRepeatWidget } from "@/components/home/TodayRepeatWidget";
import { TodoStatusWidget } from "@/components/home/TodoStatusWidget";
import TabsHeader from "@/components/layout/TabsHeader";
import { HomeLogItem } from "@/components/logs/HomeLogItem";
import { db } from "@/db/client";
import { groups, logs } from "@/db/schema";
import { useAnniversariesInMonth } from "@/hooks/persons/use-anniversaries-in-month";
import {
  calcLongestGap,
  calcStreak,
  useAllLogDates,
  useCompletionRate,
} from "@/hooks/stats/use-stats";
import { useTabPreferences } from "@/providers/TabPreferencesProvider";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";

dayjs.locale("ko");

const DAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

const WIDGET_LABELS: { key: keyof import("@/providers/TabPreferencesProvider").HomePrefs; label: string }[] = [
  { key: "showMonthSummary",  label: "이번 달 요약" },
  { key: "showStreak",        label: "스트릭" },
  { key: "showMiniHeatmap",   label: "최근 12주 히트맵" },
  { key: "showCategoryRatio", label: "카테고리 비율" },
  { key: "showUpcomingAnn",   label: "다가오는 기념일" },
  { key: "showTodayRepeat",   label: "오늘의 반복" },
  { key: "showOverduePersons",label: "연락 필요 인물" },
  { key: "showPinnedMemos",   label: "고정 메모" },
  { key: "showTodoStatus",    label: "할 일 현황" },
  { key: "showRecentLogs",    label: "최근 기록" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { prefs, setHomePrefs } = useTabPreferences();
  const home = prefs.home;
  const [showWidgetSheet, setShowWidgetSheet] = useState(false);

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
  const longestGap = useMemo(() => calcLongestGap(logDates), [logDates]);

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

  // 최근 기록 5개 (그룹 정보 join)
  const { data: recentLogs = [] } = useLiveQuery(
    db
      .select({
        id: logs.id,
        title: logs.title,
        logDate: logs.logDate,
        checkedAt: logs.checkedAt,
        repeatType: logs.repeatType,
        groupColor: groups.color,
        groupEmoji: groups.emoji,
        groupName: groups.name,
      })
      .from(logs)
      .leftJoin(groups, eq(logs.groupId, groups.id))
      .orderBy(desc(logs.logDate))
      .limit(5),
  );

  return (
    <View className="flex-1 bg-app-bg">
      <TabsHeader
        title="홈"
        searchOnPress={true}
        slidersOnPress={() => setShowWidgetSheet(true)}
      />
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
        {home.showMonthSummary && (
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
        )}

        {/* 스트릭 카드 */}
        {home.showStreak && (
        <Pressable
          className="mx-4 mb-4 bg-app-surface rounded-[16px] p-4"
          onPress={() => router.push("/settings/stats")}
          style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px]">
              스트릭
            </Text>
            <Text className="text-[#555] text-[11px]">통계 →</Text>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1 items-center">
              <Text className="text-[26px] font-bold text-white">{streakCurrent}</Text>
              <Text className="text-app-muted text-[11px] mt-0.5">현재</Text>
            </View>
            <View className="w-px bg-[#2a2a2a]" />
            <View className="flex-1 items-center">
              <Text className="text-[26px] font-bold text-white">{streakBest}</Text>
              <Text className="text-app-muted text-[11px] mt-0.5">최장</Text>
            </View>
            <View className="w-px bg-[#2a2a2a]" />
            <View className="flex-1 items-center">
              <Text className="text-[26px] font-bold text-white">{longestGap}</Text>
              <Text className="text-app-muted text-[11px] mt-0.5">최장 공백</Text>
            </View>
          </View>
        </Pressable>
        )}

        {/* 새 위젯: 미니 히트맵 */}
        {home.showMiniHeatmap && <MiniHeatmapWidget />}

        {/* 새 위젯: 카테고리 비율 */}
        {home.showCategoryRatio && <CategoryRatioWidget />}

        {/* 새 위젯: 오늘의 반복 */}
        {home.showTodayRepeat && <TodayRepeatWidget />}

        {/* 새 위젯: 연락 필요 인물 */}
        {home.showOverduePersons && <OverduePersonsWidget />}

        {/* 새 위젯: 고정 메모 */}
        {home.showPinnedMemos && <PinnedMemosWidget />}

        {/* 새 위젯: 할 일 현황 */}
        {home.showTodoStatus && <TodoStatusWidget />}

        {/* 임박 기념일 */}
        {home.showUpcomingAnn && upcomingAnn.length > 0 && (
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
        {home.showRecentLogs && (
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
                <HomeLogItem
                  key={log.id}
                  title={log.title}
                  logDate={new Date(log.logDate)}
                  checkedAt={log.checkedAt ? new Date(log.checkedAt) : null}
                  repeatType={log.repeatType ?? null}
                  groupColor={log.groupColor ?? "#4ECDC4"}
                  groupEmoji={log.groupEmoji ?? null}
                  groupName={log.groupName ?? ""}
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
        )}
      </ScrollView>
      <FloatingActionButton onPress={() => router.push("/logs/new")} />

      {/* 위젯 표시 설정 바텀시트 */}
      <Modal
        visible={showWidgetSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWidgetSheet(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowWidgetSheet(false)}
        >
          <Pressable
            className="bg-app-surface rounded-t-[20px] px-5 pt-5 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-10 h-1 bg-[#444] rounded-full self-center mb-5" />
            <Text className="text-white text-[16px] font-bold mb-4">홈 화면 구성</Text>
            {WIDGET_LABELS.map(({ key, label }) => (
              <View
                key={key}
                className="flex-row items-center justify-between py-3 border-b border-[#1e1e1e]"
              >
                <Text className="text-white text-[14px]">{label}</Text>
                <Switch
                  value={home[key]}
                  onValueChange={(v) => setHomePrefs({ [key]: v })}
                  trackColor={{ false: "#333", true: "#4ecdc4" }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
