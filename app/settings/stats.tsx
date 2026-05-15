// 설정 통계 화면 — 인물 랭킹, 마지막 연결, 카테고리 비율, 스트릭, 완료율, 반복 비율, 평균 간격, 할일 사분면, 동반 등장, MBTI
import {
  calcAvgInterval,
  calcLongestGap,
  calcStreak,
  type Period,
  useAllLogDates,
  useCategoryRatio,
  useCoAppearance,
  useCompletionRate,
  useLastContact,
  useMbtiDistribution,
  usePersonRanking,
  useQuadrantStats,
  useRepeatRatio,
  useSummaryStats,
} from "@/hooks/stats/use-stats";
import { fromNow } from "@/utils/date";
import { cn } from "@/utils/utils";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PERIOD_CHIPS: { key: Period; label: string }[] = [
  { key: "month", label: "이번 달" },
  { key: "year", label: "올해" },
  { key: "all", label: "전체" },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-app-label text-[13px] font-semibold uppercase tracking-[0.5px] mb-3">
      {children}
    </Text>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-app-surface rounded-[12px] py-3 items-center">
      <Text className="text-white text-[18px] font-bold">{value}</Text>
      <Text className="text-app-muted text-[11px] mt-0.5">{label}</Text>
    </View>
  );
}

function PeriodChips({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <View className="flex-row gap-2 mb-6">
      {PERIOD_CHIPS.map(({ key, label }) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          className={cn(
            "px-3 py-1.5 rounded-full border",
            period === key ? "bg-app-teal border-app-teal" : "border-[#333]",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-medium",
              period === key ? "text-[#0a0a0a]" : "text-app-muted",
            )}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("year");

  const summary = useSummaryStats();
  const ranking = usePersonRanking(period);
  const lastContact = useLastContact();
  const { data: catData, total: catTotal } = useCategoryRatio(period);
  const allDates = useAllLogDates();
  const { current: currentStreak, best: bestStreak } = useMemo(
    () => calcStreak(allDates),
    [allDates],
  );
  const avgInterval = useMemo(() => calcAvgInterval(allDates), [allDates]);
  const longestGap = useMemo(() => calcLongestGap(allDates), [allDates]);
  const completion = useCompletionRate(period);
  const repeatRatio = useRepeatRatio(period);
  const quadrantStats = useQuadrantStats();
  const coAppearance = useCoAppearance();
  const { data: mbtiData, total: mbtiTotal } = useMbtiDistribution();

  const rankingWithLogs = ranking.filter((r) => r.logCount > 0).slice(0, 10);
  const catWithLogs = catData.filter((g) => g.logCount > 0);

  return (
    <View className="flex-1 bg-app-bg">
      <View className="flex-row items-center px-4 pt-14 pb-4 gap-3">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color="#888" />
        </Pressable>
        <Text className="text-white text-xl font-bold">통계</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 요약 카드 */}
        <View className="flex-row gap-3 mb-8">
          <StatCard label="총 기록" value={`${summary.totalLogs}개`} />
          <StatCard label="총 인물" value={`${summary.totalPersons}명`} />
          <StatCard label="이번 달" value={`${summary.monthLogs}개`} />
        </View>

        {/* 기간 칩 */}
        <PeriodChips period={period} onChange={setPeriod} />

        {/* 인물 랭킹 */}
        <View className="mb-8">
          <SectionTitle>인물 랭킹</SectionTitle>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            {rankingWithLogs.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-app-muted text-sm">기록이 없습니다.</Text>
              </View>
            ) : (
              rankingWithLogs.map((item, i) => (
                <View key={item.personId}>
                  {i > 0 && (
                    <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
                  )}
                  <View className="flex-row items-center px-[14px] py-[13px] gap-3">
                    <Text className="text-app-muted text-[13px] w-5 text-center">
                      {i + 1}
                    </Text>
                    <Text className="flex-1 text-white text-sm">
                      {item.name}
                    </Text>
                    <Text className="text-app-teal text-sm font-semibold">
                      {item.logCount}회
                    </Text>
                    {item.lastDate && (
                      <Text className="text-app-muted text-[11px] ml-1">
                        {dayjs(item.lastDate).format("M/D")}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 마지막 연결 */}
        <View className="mb-8">
          <SectionTitle>마지막 연결</SectionTitle>
          <View className="bg-app-surface rounded-[12px] overflow-hidden">
            {lastContact.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-app-muted text-sm">인물이 없습니다.</Text>
              </View>
            ) : (
              lastContact.slice(0, 5).map((item, i) => (
                <View key={item.personId}>
                  {i > 0 && (
                    <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
                  )}
                  <View className="flex-row items-center px-[14px] py-[13px]">
                    <Text className="flex-1 text-white text-sm">
                      {item.name}
                    </Text>
                    <Text className="text-app-muted text-[12px]">
                      {item.lastDate
                        ? fromNow(new Date(item.lastDate))
                        : "기록 없음"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 카테고리 비율 */}
        <View className="mb-8">
          <SectionTitle>카테고리 비율</SectionTitle>
          <View className="bg-app-surface rounded-[12px] p-[14px] gap-3">
            {catWithLogs.length === 0 ? (
              <View className="py-4 items-center">
                <Text className="text-app-muted text-sm">기록이 없습니다.</Text>
              </View>
            ) : (
              catWithLogs.map((g) => {
                const pct =
                  catTotal > 0
                    ? Math.round((g.logCount / catTotal) * 100)
                    : 0;
                return (
                  <View key={g.groupId}>
                    <View className="flex-row items-center mb-1.5">
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: g.color,
                          marginRight: 6,
                        }}
                      />
                      <Text className="flex-1 text-white text-[13px]">
                        {g.name}
                      </Text>
                      <Text className="text-app-muted text-[12px]">
                        {g.logCount}개 ({pct}%)
                      </Text>
                    </View>
                    <View className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <View
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          backgroundColor: g.color,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* 기록 스트릭 (현재/최장/최장공백) + 평균 간격 */}
        <View className="flex-row gap-3 mb-3">
          <View
            style={{ flex: 2 }}
            className="bg-app-surface rounded-[12px] p-[14px]"
          >
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px] mb-3">
              기록 스트릭
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1 items-center">
                <Text className="text-white text-[22px] font-bold">
                  {currentStreak}
                </Text>
                <Text className="text-app-muted text-[10px] mt-0.5">현재</Text>
              </View>
              <View className="w-[1px] bg-[#2a2a2a]" />
              <View className="flex-1 items-center">
                <Text className="text-white text-[22px] font-bold">
                  {bestStreak}
                </Text>
                <Text className="text-app-muted text-[10px] mt-0.5">최장</Text>
              </View>
              <View className="w-[1px] bg-[#2a2a2a]" />
              <View className="flex-1 items-center">
                <Text className="text-white text-[22px] font-bold">
                  {longestGap}
                </Text>
                <Text className="text-app-muted text-[10px] mt-0.5">공백</Text>
              </View>
            </View>
          </View>

          <View className="flex-1 bg-app-surface rounded-[12px] p-[14px]">
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px] mb-3">
              평균 간격
            </Text>
            <Text className="text-white text-[22px] font-bold">
              {avgInterval}
            </Text>
            <Text className="text-app-muted text-[10px] mt-0.5">일마다 1회</Text>
          </View>
        </View>

        {/* 완료율 + 반복 기록 비율 */}
        <View className="flex-row gap-3 mb-8">
          <View className="flex-1 bg-app-surface rounded-[12px] p-[14px]">
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px] mb-3">
              완료율
            </Text>
            <Text className="text-white text-[22px] font-bold mb-2">
              {completion.rate}%
            </Text>
            <View className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mb-1.5">
              <View
                style={{
                  width: `${completion.rate}%`,
                  height: "100%",
                  backgroundColor: "#4ecdc4",
                  borderRadius: 4,
                }}
              />
            </View>
            <Text className="text-app-muted text-[10px]">
              {completion.completed}/{completion.total}개
            </Text>
          </View>

          <View className="flex-1 bg-app-surface rounded-[12px] p-[14px]">
            <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px] mb-3">
              반복 기록 비율
            </Text>
            <Text className="text-white text-[22px] font-bold mb-2">
              {repeatRatio.rate}%
            </Text>
            <View className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mb-1.5">
              <View
                style={{
                  width: `${repeatRatio.rate}%`,
                  height: "100%",
                  backgroundColor: "#c9922a",
                  borderRadius: 4,
                }}
              />
            </View>
            <Text className="text-app-muted text-[10px]">
              {repeatRatio.repeated}/{repeatRatio.total}개
            </Text>
          </View>
        </View>

        {/* 할일 사분면별 완료율 */}
        {quadrantStats.length > 0 && (
          <View className="mb-8">
            <SectionTitle>할일 완료율</SectionTitle>
            <View className="bg-app-surface rounded-[12px] p-[14px] gap-3">
              {quadrantStats.map((q) => (
                <View key={q.quadrant}>
                  <View className="flex-row items-center mb-1.5">
                    <Text className="flex-1 text-white text-[13px]">
                      {q.label}
                    </Text>
                    <Text className="text-app-muted text-[12px]">
                      {q.completed}/{q.total}개 ({q.rate}%)
                    </Text>
                  </View>
                  <View className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${q.rate}%`,
                        height: "100%",
                        backgroundColor: "#4ecdc4",
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 함께 등장 빈도 */}
        {coAppearance.length > 0 && (
          <View className="mb-8">
            <SectionTitle>함께 등장 빈도</SectionTitle>
            <View className="bg-app-surface rounded-[12px] overflow-hidden">
              {coAppearance.map((item, i) => (
                <View key={`${item.nameA}-${item.nameB}`}>
                  {i > 0 && (
                    <View className="h-[1px] bg-[#2a2a2a] mx-[14px]" />
                  )}
                  <View className="flex-row items-center px-[14px] py-[13px]">
                    <Text className="flex-1 text-white text-sm">
                      {item.nameA} · {item.nameB}
                    </Text>
                    <Text className="text-app-teal text-sm font-semibold">
                      {item.count}회
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* MBTI 분포 */}
        {mbtiData.length > 0 && (
          <View className="mb-8">
            <SectionTitle>MBTI 분포</SectionTitle>
            <View className="bg-app-surface rounded-[12px] p-[14px] gap-3">
              {mbtiData.map((item) => {
                const pct =
                  mbtiTotal > 0
                    ? Math.round((item.count / mbtiTotal) * 100)
                    : 0;
                return (
                  <View key={item.mbti}>
                    <View className="flex-row items-center mb-1.5">
                      <Text className="text-white text-[13px] font-medium w-14">
                        {item.mbti}
                      </Text>
                      <View className="flex-1 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mx-3">
                        <View
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: "#4ecdc4",
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      <Text className="text-app-muted text-[12px] w-12 text-right">
                        {item.count}명 ({pct}%)
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
