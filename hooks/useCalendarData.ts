// 캘린더 탭 — 월별 markedDates와 선택 날짜 항목 계산 훅
import dayjs from "dayjs";
import { and, eq, gte, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

import { db } from "@/db/client";
import { logs, personAnniversaries, persons } from "@/db/schema";
import { dDayLabel } from "@/utils/date";
import { expandRepeatInMonth } from "@/utils/repeat";
import type { InferSelectModel } from "drizzle-orm";

type Log = InferSelectModel<typeof logs>;

const DOT_LOG = { key: "log", color: "#4ECDC4" };
const DOT_REPEAT = { key: "repeat", color: "#f59e0b" };
const DOT_ANNIVERSARY = { key: "anniversary", color: "#f97316" };

export type LogDayItem = { type: "log"; data: Log };
export type RepeatDayItem = { type: "repeat"; data: Log; virtualDate: string };
export type AnniversaryDayItem = {
  type: "anniversary";
  id: string | number;
  personId: string | number;
  personName: string;
  title: string;
  date: string;
  isRepeat: boolean;
  dDay: string;
  isBirthday: boolean;
};
export type DayItem = LogDayItem | RepeatDayItem | AnniversaryDayItem;

type MarkedDates = Record<
  string,
  {
    dots: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
  }
>;

export function useCalendarData(currentMonthStr: string, selectedDate: string) {
  const monthStart = useMemo(
    () => dayjs(currentMonthStr).startOf("month"),
    [currentMonthStr],
  );
  const monthEnd = useMemo(
    () => dayjs(currentMonthStr).endOf("month"),
    [currentMonthStr],
  );
  const monthStartMs = monthStart.valueOf();
  const monthEndMs = monthEnd.valueOf();

  const { data: monthLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          gte(logs.logDate, monthStart.toDate()),
          lt(logs.logDate, monthEnd.add(1, "day").startOf("day").toDate()),
        ),
      ),
    [monthStartMs, monthEndMs],
  );

  const { data: repeatLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        and(
          isNotNull(logs.repeatType),
          ne(logs.repeatType, "none"),
          lt(logs.logDate, monthEnd.add(1, "day").startOf("day").toDate()),
          or(
            isNull(logs.repeatUntil),
            gte(logs.repeatUntil, monthStart.toDate()),
          ),
        ),
      ),
    [monthStartMs, monthEndMs],
  );

  const currentYearMonth = monthStart.format("YYYY-MM");
  const currentMonthPad = monthStart.format("MM");

  const { data: anniversaries = [] } = useLiveQuery(
    db
      .select()
      .from(personAnniversaries)
      .where(
        or(
          and(
            eq(personAnniversaries.isRepeat, true),
            sql`strftime('%m', ${personAnniversaries.date}) = ${currentMonthPad}`,
          ),
          and(
            eq(personAnniversaries.isRepeat, false),
            sql`strftime('%Y-%m', ${personAnniversaries.date}) = ${currentYearMonth}`,
          ),
        ),
      ),
    [monthStartMs],
  );

  const { data: allPersons = [] } = useLiveQuery(
    db
      .select({
        id: persons.id,
        name: persons.name,
        birthDate: persons.birthDate,
      })
      .from(persons),
  );

  // dots 계산 — 선택 날짜와 무관하게 월/데이터 변경 시에만 재계산
  const baseDots = useMemo((): MarkedDates => {
    const marks: MarkedDates = {};

    function addDot(dateStr: string, dot: { key: string; color: string }) {
      if (!marks[dateStr]) marks[dateStr] = { dots: [] };
      if (!marks[dateStr].dots.some((d) => d.key === dot.key)) {
        marks[dateStr].dots.push(dot);
      }
    }

    for (const log of monthLogs) {
      addDot(dayjs(log.logDate).format("YYYY-MM-DD"), DOT_LOG);
    }

    for (const log of repeatLogs) {
      for (const occ of expandRepeatInMonth(
        log,
        monthStart.toDate(),
        monthEnd.toDate(),
      )) {
        addDot(dayjs(occ).format("YYYY-MM-DD"), DOT_REPEAT);
      }
    }

    const currentYear = monthStart.year();
    const currentMonthNum = monthStart.month() + 1;

    for (const ann of anniversaries) {
      try {
        const parts = ann.date.split("-");
        if (parts.length < 3) continue;
        const [, mm, dd] = parts;
        const annMonth = parseInt(mm, 10);
        if (ann.isRepeat) {
          if (annMonth === currentMonthNum) {
            addDot(`${currentYear}-${mm}-${dd}`, DOT_ANNIVERSARY);
          }
        } else {
          const annYear = parseInt(parts[0], 10);
          if (annYear === currentYear && annMonth === currentMonthNum) {
            addDot(ann.date, DOT_ANNIVERSARY);
          }
        }
      } catch {
        // 잘못된 날짜 포맷 무시
      }
    }

    for (const person of allPersons) {
      if (!person.birthDate) continue;
      try {
        const parts = person.birthDate.split("-");
        if (parts.length < 3) continue;
        const [, mm, dd] = parts;
        if (parseInt(mm, 10) === currentMonthNum) {
          addDot(`${currentYear}-${mm}-${dd}`, DOT_ANNIVERSARY);
        }
      } catch {
        // 잘못된 날짜 포맷 무시
      }
    }

    return marks;
  }, [monthLogs, repeatLogs, anniversaries, allPersons, monthStart, monthEnd]);

  // 선택 날짜 하이라이트 오버레이 — baseDots와 분리해 날짜 탭 시 dots 재계산 방지
  const markedDates = useMemo((): MarkedDates => {
    const marks = { ...baseDots };
    if (!marks[selectedDate]) marks[selectedDate] = { dots: [] };
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: "#4ECDC4",
    };
    return marks;
  }, [baseDots, selectedDate]);

  // 월 전체 날짜별 아이템 맵 — selectedDate 변경 시 재계산 없음
  const monthItemsByDate = useMemo((): Record<string, DayItem[]> => {
    const result: Record<string, DayItem[]> = {};
    const currentMonthNum = monthStart.month() + 1;
    const currentYear = monthStart.year();

    const addItem = (dateStr: string, item: DayItem) => {
      if (!result[dateStr]) result[dateStr] = [];
      result[dateStr].push(item);
    };

    for (const log of monthLogs) {
      addItem(dayjs(log.logDate).format("YYYY-MM-DD"), {
        type: "log",
        data: log,
      });
    }

    for (const log of repeatLogs) {
      for (const occ of expandRepeatInMonth(
        log,
        monthStart.toDate(),
        monthEnd.toDate(),
      )) {
        const dateStr = dayjs(occ).format("YYYY-MM-DD");
        const isAlreadyLog = (result[dateStr] ?? []).some(
          (i) => i.type === "log" && (i as LogDayItem).data.id === log.id,
        );
        if (!isAlreadyLog) {
          addItem(dateStr, { type: "repeat", data: log, virtualDate: dateStr });
        }
      }
    }

    for (const ann of anniversaries) {
      try {
        const parts = ann.date.split("-");
        if (parts.length < 3) continue;
        const [annYearStr, mm, dd] = parts;
        const annMonth = parseInt(mm, 10);
        let dateStr: string;
        if (ann.isRepeat) {
          if (annMonth !== currentMonthNum) continue;
          dateStr = `${currentYear}-${mm}-${dd}`;
        } else {
          if (
            parseInt(annYearStr, 10) !== currentYear ||
            annMonth !== currentMonthNum
          )
            continue;
          dateStr = ann.date;
        }
        const person = allPersons.find((p) => p.id === ann.personId);
        if (!person) continue;
        addItem(dateStr, {
          type: "anniversary",
          id: ann.id,
          personId: ann.personId,
          personName: person.name,
          title: ann.title,
          date: ann.date,
          isRepeat: ann.isRepeat,
          dDay: dDayLabel(ann.date, ann.isRepeat),
          isBirthday: false,
        });
      } catch {}
    }

    for (const person of allPersons) {
      if (!person.birthDate) continue;
      try {
        const parts = person.birthDate.split("-");
        if (parts.length < 3) continue;
        const [, mm, dd] = parts;
        if (parseInt(mm, 10) !== currentMonthNum) continue;
        const dateStr = `${currentYear}-${mm}-${dd}`;
        addItem(dateStr, {
          type: "anniversary",
          id: `birth-${person.id}`,
          personId: person.id,
          personName: person.name,
          title: "생일",
          date: person.birthDate,
          isRepeat: true,
          dDay: dDayLabel(person.birthDate, true),
          isBirthday: true,
        });
      } catch {}
    }

    return result;
  }, [monthLogs, repeatLogs, anniversaries, allPersons, monthStart, monthEnd]);

  const dayItems = useMemo(
    () => monthItemsByDate[selectedDate] ?? [],
    [monthItemsByDate, selectedDate],
  );

  return { markedDates, dayItems, monthItemsByDate };
}
