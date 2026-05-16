// 설정 통계 화면에서 사용하는 집계 쿼리 훅 모음
import { db } from "@/db/client";
import { groups, logPersons, logs, persons, todos } from "@/db/schema";
import dayjs from "dayjs";
import { and, count, desc, eq, gte, isNotNull, max, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { alias } from "drizzle-orm/sqlite-core";
import { useMemo } from "react";

const QUADRANT_LABELS: Record<string, string> = {
  do: "중요·긴급",
  schedule: "중요·비긴급",
  delegate: "비중요·긴급",
  eliminate: "비중요·비긴급",
};

export type Period = "month" | "year" | "all";

function getPeriodStart(period: Period): Date | undefined {
  if (period === "month") return dayjs().startOf("month").toDate();
  if (period === "year") return dayjs().startOf("year").toDate();
  return undefined;
}

export function useSummaryStats() {
  const monthStart = useMemo(() => dayjs().startOf("month").toDate(), []);

  const { data: totalLogsData = [] } = useLiveQuery(
    db.select({ value: count() }).from(logs),
  );
  const { data: totalPersonsData = [] } = useLiveQuery(
    db.select({ value: count() }).from(persons),
  );
  const { data: monthLogsData = [] } = useLiveQuery(
    db
      .select({ value: count() })
      .from(logs)
      .where(gte(logs.logDate, monthStart)),
    [],
  );

  return {
    totalLogs: totalLogsData[0]?.value ?? 0,
    totalPersons: totalPersonsData[0]?.value ?? 0,
    monthLogs: monthLogsData[0]?.value ?? 0,
  };
}

export function usePersonRanking(period: Period) {
  const start = useMemo(() => getPeriodStart(period), [period]);

  const { data = [] } = useLiveQuery(
    db
      .select({
        personId: persons.id,
        name: persons.name,
        logCount: count(logPersons.id),
        lastDate: max(logs.logDate),
      })
      .from(persons)
      .leftJoin(logPersons, eq(persons.id, logPersons.personId))
      .leftJoin(
        logs,
        start
          ? and(eq(logPersons.logId, logs.id), gte(logs.logDate, start))
          : eq(logPersons.logId, logs.id),
      )
      .groupBy(persons.id)
      .orderBy(desc(count(logPersons.id))),
    [period],
  );

  return data;
}

export function useLastContact() {
  const { data = [] } = useLiveQuery(
    db
      .select({
        personId: persons.id,
        name: persons.name,
        lastDate: max(logs.logDate),
      })
      .from(persons)
      .leftJoin(logPersons, eq(persons.id, logPersons.personId))
      .leftJoin(logs, eq(logPersons.logId, logs.id))
      .groupBy(persons.id)
      .orderBy(max(logs.logDate)),
  );

  return data;
}

export function useCategoryRatio(period: Period) {
  const start = useMemo(() => getPeriodStart(period), [period]);

  const { data = [] } = useLiveQuery(
    db
      .select({
        groupId: groups.id,
        name: groups.name,
        color: groups.color,
        logCount: count(logs.id),
      })
      .from(groups)
      .leftJoin(
        logs,
        start
          ? and(eq(groups.id, logs.groupId), gte(logs.logDate, start))
          : eq(groups.id, logs.groupId),
      )
      .groupBy(groups.id)
      .orderBy(desc(count(logs.id))),
    [period],
  );

  const total = useMemo(
    () => data.reduce((sum, g) => sum + g.logCount, 0),
    [data],
  );

  return { data, total };
}

export function useAllLogDates(limitDays?: number) {
  const since = useMemo(
    () => limitDays ? dayjs().subtract(limitDays, "day").startOf("day").toDate() : undefined,
    [limitDays],
  );

  const { data = [] } = useLiveQuery(
    db
      .select({ logDate: logs.logDate })
      .from(logs)
      .where(since ? gte(logs.logDate, since) : undefined),
    [since?.getTime()],
  );
  return data.map((r) => new Date(r.logDate));
}

export function calcStreak(dates: Date[]): { current: number; best: number } {
  if (dates.length === 0) return { current: 0, best: 0 };

  const daySet = new Set(dates.map((d) => dayjs(d).format("YYYY-MM-DD")));

  // 오늘부터 역순, 오늘 기록 없으면 어제부터 확인
  let current = 0;
  let check = dayjs().format("YYYY-MM-DD");
  while (daySet.has(check)) {
    current++;
    check = dayjs(check).subtract(1, "day").format("YYYY-MM-DD");
  }
  if (current === 0) {
    check = dayjs().subtract(1, "day").format("YYYY-MM-DD");
    while (daySet.has(check)) {
      current++;
      check = dayjs(check).subtract(1, "day").format("YYYY-MM-DD");
    }
  }

  // 최장 스트릭
  const sortedDays = [...daySet].sort();
  let best = 0;
  let streak = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const diff = dayjs(sortedDays[i]).diff(dayjs(sortedDays[i - 1]), "day");
      streak = diff === 1 ? streak + 1 : 1;
    }
    if (streak > best) best = streak;
  }

  return { current, best };
}

export function useRepeatRatio(period: Period) {
  const start = useMemo(() => getPeriodStart(period), [period]);

  const { data = [] } = useLiveQuery(
    db
      .select({
        total: count(),
        repeated: sql<number>`SUM(CASE WHEN ${logs.repeatType} IS NOT NULL AND ${logs.repeatType} != 'none' THEN 1 ELSE 0 END)`,
      })
      .from(logs)
      .where(start ? gte(logs.logDate, start) : undefined),
    [period],
  );

  const row = data[0];
  const total = row?.total ?? 0;
  const repeated = row?.repeated ?? 0;
  return {
    total,
    repeated,
    rate: total > 0 ? Math.round((repeated / total) * 100) : 0,
  };
}

export function calcAvgInterval(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const totalDays = dayjs().diff(dayjs(sorted[0]), "day");
  return totalDays > 0 ? Math.round(totalDays / dates.length) : 0;
}

export function useQuadrantStats() {
  const { data = [] } = useLiveQuery(
    db
      .select({
        quadrant: todos.quadrant,
        total: count(),
        completed: sql<number>`SUM(CASE WHEN ${todos.checkedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(todos)
      .groupBy(todos.quadrant),
  );

  return data.map((row) => ({
    quadrant: row.quadrant,
    label: QUADRANT_LABELS[row.quadrant] ?? row.quadrant,
    total: row.total,
    completed: row.completed ?? 0,
    rate:
      row.total > 0
        ? Math.round(((row.completed ?? 0) / row.total) * 100)
        : 0,
  }));
}

export function calcLongestGap(dates: Date[]): number {
  const daySet = [
    ...new Set(dates.map((d) => dayjs(d).format("YYYY-MM-DD"))),
  ].sort();
  if (daySet.length < 2) return 0;
  let maxGap = 0;
  for (let i = 1; i < daySet.length; i++) {
    const gap = dayjs(daySet[i]).diff(dayjs(daySet[i - 1]), "day");
    if (gap > maxGap) maxGap = gap;
  }
  return maxGap;
}

export function useMbtiDistribution() {
  const { data = [] } = useLiveQuery(
    db
      .select({ mbti: persons.mbti, count: count() })
      .from(persons)
      .where(isNotNull(persons.mbti))
      .groupBy(persons.mbti)
      .orderBy(desc(count())),
  );
  const total = useMemo(
    () => data.reduce((sum, r) => sum + r.count, 0),
    [data],
  );
  return { data, total };
}

export function useCoAppearance() {
  const lpA = alias(logPersons, "lpA");
  const lpB = alias(logPersons, "lpB");
  const pA = alias(persons, "pA");
  const pB = alias(persons, "pB");

  const { data = [] } = useLiveQuery(
    db
      .select({ nameA: pA.name, nameB: pB.name, count: count() })
      .from(lpA)
      .innerJoin(
        lpB,
        and(eq(lpA.logId, lpB.logId), sql`${lpA.personId} < ${lpB.personId}`),
      )
      .innerJoin(pA, eq(lpA.personId, pA.id))
      .innerJoin(pB, eq(lpB.personId, pB.id))
      .groupBy(lpA.personId, lpB.personId)
      .orderBy(desc(count()))
      .limit(5),
  );
  return data;
}

export function useCompletionRate(period: Period) {
  const start = useMemo(() => getPeriodStart(period), [period]);

  const { data = [] } = useLiveQuery(
    db
      .select({
        total: count(),
        completed: sql<number>`SUM(CASE WHEN ${logs.checkedAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(logs)
      .where(start ? gte(logs.logDate, start) : undefined),
    [period],
  );

  const row = data[0];
  const total = row?.total ?? 0;
  const completed = row?.completed ?? 0;
  return {
    total,
    completed,
    rate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
