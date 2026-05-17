// 기간 필터 기반 이벤트 리스트 훅 — 일반 로그 + 반복 occurrence 통합 반환
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { expandRepeatInMonth } from "@/utils/repeat";
import dayjs from "dayjs";
import { and, asc, eq, gte, isNotNull, isNull, lte, ne, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

type Log = InferSelectModel<typeof logs>;

export type EventItem = {
  key: string;
  log: Log;
  isRepeat: boolean;
  displayDate: Date;
};

export function useEventFilter(start: Date, end: Date) {
  const { data: regularLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          or(isNull(logs.repeatType), eq(logs.repeatType, "none")),
          gte(logs.logDate, start),
          lte(logs.logDate, end),
        ),
      )
      .orderBy(asc(logs.logDate)),
    [start.getTime(), end.getTime()],
  );

  const { data: repeatSources = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          isNotNull(logs.repeatType),
          ne(logs.repeatType, "none"),
          lte(logs.logDate, end),
          or(isNull(logs.repeatUntil), gte(logs.repeatUntil, start)),
        ),
      ),
    [start.getTime(), end.getTime()],
  );

  const items = useMemo<EventItem[]>(() => {
    // "전체" 등 원거리 end에서 반복 occurrence가 폭발하지 않도록 2년으로 캡
    const repeatEnd = new Date(
      Math.min(end.getTime(), dayjs().add(2, "year").valueOf()),
    );

    const all: EventItem[] = [
      ...regularLogs.map((log) => ({
        key: String(log.id),
        log,
        isRepeat: false,
        displayDate: new Date(log.logDate),
      })),
      ...repeatSources.flatMap((log) =>
        expandRepeatInMonth(log, start, repeatEnd).map((date) => ({
          key: `${log.id}-${date.getTime()}`,
          log,
          isRepeat: true,
          displayDate: date,
        })),
      ),
    ];

    return all.sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime());
  }, [regularLogs, repeatSources, start.getTime(), end.getTime()]);

  return items;
}
