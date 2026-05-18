// 연간 기록 히트맵 화면 — GitHub 잔디 스타일
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { DAYS_KO, toDateKey } from "@/utils/date";
import dayjs from "dayjs";
import { and, gte, lte } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const WEEKDAYS = DAYS_KO;
const CELL = 13;
const GAP = 2;
const STEP = CELL + GAP;

function heatColor(count: number): string {
  if (count === 0) return "#1e1e1e";
  if (count === 1) return "#0e2419";
  if (count <= 3) return "#1a3a2e";
  if (count <= 6) return "#2d5a40";
  return "#4ecdc4";
}

export default function HeatmapScreen() {
  const today = dayjs();
  const [year, setYear] = useState(today.year());

  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(() => new Date(year, 11, 31, 23, 59, 59, 999), [year]);

  const { data: yearLogs = [] } = useLiveQuery(
    db
      .select({ logDate: logs.logDate })
      .from(logs)
      .where(and(gte(logs.logDate, yearStart), lte(logs.logDate, yearEnd))),
    [year],
  );

  // 날짜별 기록 카운트
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of yearLogs) {
      const key = toDateKey(new Date(log.logDate));
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [yearLogs]);

  // 주 단위 그리드 생성 (Jan 1이 속한 주 일요일 ~ Dec 31이 속한 주 토요일)
  const weeks = useMemo(() => {
    const gridStart = dayjs(yearStart).startOf("week"); // 전 주 일요일
    const gridEnd = dayjs(yearEnd).endOf("week");       // 다음 주 토요일

    const result: string[][] = [];
    let cur = gridStart;
    while (cur.valueOf() <= gridEnd.valueOf()) {
      const week: string[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(cur.format("YYYY-MM-DD"));
        cur = cur.add(1, "day");
      }
      result.push(week);
    }
    return result;
  }, [year]);

  // 주 인덱스 → 월 레이블 (해당 주에 월 첫날 포함 시)
  const monthLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    weeks.forEach((week, wi) => {
      for (const dayStr of week) {
        const d = dayjs(dayStr);
        if (d.date() === 1 && d.year() === year) {
          labels[wi] = `${d.month() + 1}월`;
          break;
        }
      }
    });
    return labels;
  }, [weeks, year]);

  const totalCount = Object.values(countByDay).reduce((sum, n) => sum + n, 0);
  const activeDays = Object.keys(countByDay).length;
  const maxStreak = useMemo(() => {
    let best = 0;
    let cur = 0;
    const d = dayjs(yearStart);
    for (let i = 0; i < 366; i++) {
      const key = d.add(i, "day").format("YYYY-MM-DD");
      if (key > `${year}-12-31`) break;
      if (countByDay[key]) {
        cur++;
        best = Math.max(best, cur);
      } else {
        cur = 0;
      }
    }
    return best;
  }, [countByDay, year]);

  return (
    <View className="flex-1 bg-app-bg">
      {/* 헤더 */}
      <View className="flex-row items-center px-4 pt-14 pb-4 gap-3">
        <View className="flex-row items-center gap-4 flex-1">
          <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={8}>
            <ChevronLeft size={22} color="#888" />
          </Pressable>
          <Text className="text-white text-xl font-bold">{year}년 기록</Text>
          <Pressable
            onPress={() => setYear((y) => y + 1)}
            disabled={year >= today.year()}
            hitSlop={8}
          >
            <ChevronRight size={22} color={year >= today.year() ? "#333" : "#888"} />
          </Pressable>
        </View>
      </View>

      {/* 요약 통계 */}
      <View className="flex-row gap-3 px-4 mb-5">
        {[
          { label: "총 기록", value: `${totalCount}개` },
          { label: "기록한 날", value: `${activeDays}일` },
          { label: "최대 연속", value: `${maxStreak}일` },
        ].map((stat) => (
          <View
            key={stat.label}
            className="flex-1 bg-app-surface rounded-[12px] py-3 items-center"
          >
            <Text className="text-white text-lg font-bold">{stat.value}</Text>
            <Text className="text-app-muted text-xs mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* 히트맵 그리드 */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 요일 레이블 + 그리드 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* 월 레이블 행 */}
            <View style={{ flexDirection: "row", height: 18, marginBottom: 2 }}>
              {/* 요일 레이블 공간 */}
              <View style={{ width: 20 }} />
              {weeks.map((_, wi) => (
                <View key={wi} style={{ width: STEP }}>
                  {monthLabels[wi] ? (
                    <Text style={{ fontSize: 10, color: "#666", position: "absolute", left: 0 }}>
                      {monthLabels[wi]}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>

            {/* 요일 × 주 그리드 */}
            <View style={{ flexDirection: "row" }}>
              {/* 요일 레이블 */}
              <View style={{ marginRight: 2 }}>
                {WEEKDAYS.map((wd, i) => (
                  <View
                    key={wd}
                    style={{ width: 16, height: STEP, justifyContent: "center", alignItems: "flex-end" }}
                  >
                    {i % 2 === 1 && (
                      <Text style={{ fontSize: 9, color: "#555" }}>{wd}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* 주 컬럼들 */}
              {weeks.map((week, wi) => (
                <View key={wi} style={{ marginRight: GAP }}>
                  {week.map((dayStr) => {
                    const isCurrentYear = dayStr >= `${year}-01-01` && dayStr <= `${year}-12-31`;
                    const isToday = dayStr === toDateKey(new Date());
                    const count = countByDay[dayStr] ?? 0;
                    return (
                      <View
                        key={dayStr}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 2,
                          marginBottom: GAP,
                          backgroundColor: isCurrentYear ? heatColor(count) : "#111",
                          borderWidth: isToday ? 1 : 0,
                          borderColor: "#4ecdc4",
                        }}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* 범례 */}
        <View className="flex-row items-center gap-2 mt-4">
          <Text className="text-app-muted text-xs">적음</Text>
          {["#1e1e1e", "#0e2419", "#1a3a2e", "#2d5a40", "#4ecdc4"].map((c) => (
            <View key={c} style={{ width: CELL, height: CELL, borderRadius: 2, backgroundColor: c }} />
          ))}
          <Text className="text-app-muted text-xs">많음</Text>
        </View>
      </ScrollView>
    </View>
  );
}
