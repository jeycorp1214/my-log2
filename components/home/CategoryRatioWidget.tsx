// 홈 위젯 — 이번 달 카테고리(그룹)별 기록 비율
import { useCategoryRatio } from "@/hooks/stats/use-stats";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export function CategoryRatioWidget() {
  const router = useRouter();
  const { data, total } = useCategoryRatio("month");

  const topGroups = data.filter((g) => g.logCount > 0).slice(0, 3);
  if (topGroups.length === 0) return null;

  return (
    <Pressable
      className="mx-4 mb-4 bg-app-surface rounded-[16px] p-4"
      onPress={() => router.push("/settings/stats")}
      style={({ pressed }) => (pressed ? { opacity: 0.8 } : undefined)}
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-app-label text-[11px] font-semibold uppercase tracking-[0.5px]">
          이번 달 카테고리
        </Text>
        <Text className="text-[#555] text-[11px]">통계 →</Text>
      </View>

      <View className="gap-2.5">
        {topGroups.map((g) => {
          const pct = total > 0 ? Math.round((g.logCount / total) * 100) : 0;
          return (
            <View key={g.groupId}>
              <View className="flex-row items-center mb-1">
                <View
                  style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: g.color, marginRight: 6 }}
                />
                <Text className="flex-1 text-white text-[13px]">{g.name}</Text>
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
        })}

        {data.filter((g) => g.logCount > 0).length > 3 && (
          <Text className="text-[#555] text-[11px] text-right mt-1">
            +{data.filter((g) => g.logCount > 0).length - 3}개 더보기
          </Text>
        )}
      </View>
    </Pressable>
  );
}
