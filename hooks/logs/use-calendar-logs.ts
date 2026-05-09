// 캘린더 화면용 월간 로그 + 반복 로그 실시간 쿼리 훅
import { db } from "@/db/client";
import { logs } from "@/db/schema";
import { and, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

export function useCalendarLogs(monthStart: Date, monthEnd: Date) {
  const { data: monthLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          isNull(logs.repeatType),
          gte(logs.logDate, monthStart),
          lte(logs.logDate, monthEnd),
        ),
      ),
    [monthStart.getTime(), monthEnd.getTime()],
  );

  const { data: repeatLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          isNotNull(logs.repeatType),
          lte(logs.logDate, monthEnd),
          or(isNull(logs.repeatUntil), gte(logs.repeatUntil, monthStart)),
        ),
      ),
    [monthStart.getTime(), monthEnd.getTime()],
  );

  return { monthLogs, repeatLogs };
}
