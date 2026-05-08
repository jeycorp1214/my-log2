// 반복 로그의 해당 월 occurrence 날짜 계산 유틸
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";
import type { logs } from "@/db/schema";

type Log = InferSelectModel<typeof logs>;

export function expandRepeatInMonth(log: Log, monthStart: Date, monthEnd: Date): Date[] {
  const { repeatType, repeatInterval, repeatUntil } = log;

  if (!repeatType || repeatType === "none") return [];

  const origin = new Date(log.logDate);
  // repeatUntil null → 영구 반복, 이번 달 끝까지 계산
  const until = repeatUntil ? new Date(repeatUntil) : monthEnd;
  const step = repeatInterval ?? 1;

  if (origin > monthEnd || until < monthStart) return [];

  const advance: Record<string, (d: dayjs.Dayjs) => dayjs.Dayjs> = {
    daily: (d) => d.add(step, "day"),
    weekly: (d) => d.add(step * 7, "day"),
    monthly: (d) => d.add(step, "month"),
    yearly: (d) => d.add(step, "year"),
  };

  const fn = advance[repeatType];
  if (!fn) return [];

  let cur = dayjs(origin);
  let guard = 0;

  // monthStart 이전 건너뛰기
  while (cur.toDate() < monthStart && guard++ < 10000) {
    cur = fn(cur);
  }

  const results: Date[] = [];
  while (cur.toDate() <= monthEnd && cur.toDate() <= until) {
    results.push(cur.toDate());
    cur = fn(cur);
  }

  return results;
}
