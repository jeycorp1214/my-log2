// 반복 로그의 해당 월 occurrence 날짜 계산 유틸
import dayjs from "dayjs";
import type { InferSelectModel } from "drizzle-orm";
import type { logs } from "@/db/schema";

type Log = InferSelectModel<typeof logs>;

export const REPEAT_TYPES = ["none", "daily", "weekly", "monthly", "yearly"] as const;
export type RepeatType = (typeof REPEAT_TYPES)[number];

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

  // 수학적 점프: monthStart 이전 occurrence를 O(1)로 건너뜀
  if (cur.toDate() < monthStart) {
    const ms = dayjs(monthStart);
    if (repeatType === "daily") {
      const n = Math.ceil(ms.diff(cur, "day") / step);
      cur = cur.add(n * step, "day");
    } else if (repeatType === "weekly") {
      const n = Math.ceil(ms.diff(cur, "day") / (step * 7));
      cur = cur.add(n * step * 7, "day");
    } else if (repeatType === "monthly") {
      const n = Math.floor(ms.diff(cur, "month") / step);
      if (n > 0) cur = cur.add(n * step, "month");
      // monthly는 월 길이 편차로 1회 보정 가능
      if (cur.toDate() < monthStart) cur = fn(cur);
    } else if (repeatType === "yearly") {
      const n = Math.floor(ms.diff(cur, "year") / step);
      if (n > 0) cur = cur.add(n * step, "year");
      if (cur.toDate() < monthStart) cur = fn(cur);
    }
  }

  const results: Date[] = [];
  while (cur.toDate() <= monthEnd && cur.toDate() <= until) {
    results.push(cur.toDate());
    cur = fn(cur);
  }

  return results;
}
