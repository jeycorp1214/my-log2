// 기념일 항목 표시 컴포넌트 — 달력/리스트 뷰에서 사용
import { DAYS_KO } from "@/utils/date";
import dayjs from "dayjs";
import { Cake } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

function getDday(date: Date): string {
  const today = dayjs().startOf("day");
  const target = dayjs(date).startOf("day");
  const diff = target.diff(today, "day");
  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function getDateStr(date: Date): string {
  const d = dayjs(date);
  return `${d.format("M월 D일")} (${DAYS_KO[d.day()]})`;
}

type Props = { title: string; date?: Date; groupColor?: string; onPress?: () => void };

export function AnniversaryItem({ title, date, groupColor, onPress }: Props) {
  const dday = date ? getDday(date) : null;
  const dateStr = date ? getDateStr(date) : null;
  const isDday = dday === "D-DAY";
  const isPast = dday?.startsWith("D+");

  const Inner = (
    <View
      className="flex-row items-center mb-2 rounded-[10px] overflow-hidden"
      style={{ backgroundColor: "#1e1428" }}
    >
      {groupColor && (
        <View className="w-1 self-stretch" style={{ backgroundColor: groupColor }} />
      )}
      <View className="flex-1 flex-row items-center gap-2 py-2.5 px-3">
      <Cake size={14} color="#c084fc" />
      <View className="flex-1">
        <Text className="text-[14px]" style={{ color: "#c084fc" }}>
          {title}
        </Text>
        {dateStr && (
          <Text className="text-[12px] mt-0.5" style={{ color: "#9b6fd4" }}>
            {dateStr}
          </Text>
        )}
      </View>
      {dday && (
        <View
          className="px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: isDday
              ? "#7c3aed"
              : isPast
                ? "#2a2a2a"
                : "#2a1a40",
          }}
        >
          <Text
            className="text-[11px] font-semibold"
            style={{
              color: isDday ? "#fff" : isPast ? "#666" : "#c084fc",
            }}
          >
            {dday}
          </Text>
        </View>
      )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: "#2a1a40" }}>
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}
