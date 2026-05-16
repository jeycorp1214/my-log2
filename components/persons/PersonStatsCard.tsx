// 프로필 상세 화면의 통계 요약 카드
import dayjs from "dayjs";
import { Text, View } from "react-native";

interface StatsCardProps {
  logDates: Date[];
}

function getMostFrequentMonth(dates: Date[]): string | null {
  if (dates.length === 0) return null;
  const count = new Map<string, number>();
  for (const d of dates) {
    const key = dayjs(d).format("YYYY년 M월");
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  let max = 0;
  let result = "";
  for (const [month, cnt] of count) {
    if (cnt > max) {
      max = cnt;
      result = month;
    }
  }
  return result;
}

function getAvgInterval(dates: Date[]): string | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  let totalDays = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalDays += dayjs(sorted[i]).diff(dayjs(sorted[i - 1]), "day");
  }
  const avg = Math.round(totalDays / (sorted.length - 1));
  return `약 ${avg}일`;
}

export function PersonStatsCard({ logDates }: StatsCardProps) {
  if (logDates.length === 0) return null;

  const sorted = [...logDates].sort((a, b) => a.getTime() - b.getTime());
  const firstDate = dayjs(sorted[0]).format("YYYY.MM.DD");
  const mostFreqMonth = getMostFrequentMonth(logDates);
  const avgInterval = getAvgInterval(logDates);

  const stats: { label: string; value: string }[] = [
    { label: "총 기록", value: `${logDates.length}개` },
    { label: "첫 기록", value: firstDate },
    ...(mostFreqMonth ? [{ label: "자주 만난 달", value: mostFreqMonth }] : []),
    ...(avgInterval ? [{ label: "평균 간격", value: avgInterval }] : []),
  ];

  return (
    <View className="bg-app-surface rounded-[12px] p-4 mt-3 flex-row flex-wrap gap-y-3">
      {stats.map((s) => (
        <View key={s.label} style={{ width: "50%" }}>
          <Text className="text-app-muted text-[11px] mb-0.5">{s.label}</Text>
          <Text className="text-white text-[14px] font-semibold">
            {s.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
