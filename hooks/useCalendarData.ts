// 캘린더 탭 — 월별 markedDates와 선택 날짜 항목 계산 훅
import dayjs from "dayjs";
import { and, eq, gte, isNotNull, isNull, lt, ne, or, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

import { db } from "@/db/client";
import { logs, personAnniversaries, persons } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { dDayLabel } from "@/utils/date";
import { expandRepeatInMonth } from "@/utils/repeat";

type Log = InferSelectModel<typeof logs>;

const DOT_LOG = { key: "log", color: "#4ECDC4" };
const DOT_REPEAT = { key: "repeat", color: "#f59e0b" };
const DOT_ANNIVERSARY = { key: "anniversary", color: "#f97316" };

export type LogDayItem = { type: "log"; data: Log };
export type RepeatDayItem = { type: "repeat"; data: Log; virtualDate: string };
export type AnniversaryDayItem = {
  type: "anniversary";
  id: string;
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
  { dots: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }
>;

export function useCalendarData(currentMonthStr: string, selectedDate: string) {
  const monthStart = dayjs(currentMonthStr).startOf("month");
  const monthEnd = dayjs(currentMonthStr).endOf("month");
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
          or(isNull(logs.repeatUntil), gte(logs.repeatUntil, monthStart.toDate())),
        ),
      ),
    [monthStartMs, monthEndMs],
  );

  const currentYearMonth = monthStart.format("YYYY-MM");
  const currentMonthPad = monthStart.format("MM");

  const { data: anniversaries = [] } = useLiveQuery(
    db.select().from(personAnniversaries).where(
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
    db.select({ id: persons.id, name: persons.name, birthDate: persons.birthDate }).from(persons),
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
      for (const occ of expandRepeatInMonth(log, monthStart.toDate(), monthEnd.toDate())) {
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
    marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: "#4ECDC4" };
    return marks;
  }, [baseDots, selectedDate]);

  const dayItems = useMemo((): DayItem[] => {
    if (!selectedDate) return [];
    const items: DayItem[] = [];
    const [, selMm, selDd] = selectedDate.split("-");
    const selMonth = parseInt(selMm, 10);
    const selDay = parseInt(selDd, 10);

    for (const log of monthLogs) {
      if (dayjs(log.logDate).format("YYYY-MM-DD") === selectedDate) {
        items.push({ type: "log", data: log });
      }
    }

    for (const log of repeatLogs) {
      for (const occ of expandRepeatInMonth(
        log,
        monthStart.toDate(),
        monthEnd.toDate(),
      )) {
        if (dayjs(occ).format("YYYY-MM-DD") !== selectedDate) continue;
        const alreadyAsLog = items.some(
          (i) => i.type === "log" && i.data.id === log.id,
        );
        if (!alreadyAsLog) {
          items.push({ type: "repeat", data: log, virtualDate: selectedDate });
        }
      }
    }

    for (const ann of anniversaries) {
      const [, annMm, annDd] = ann.date.split("-");
      const matches = ann.isRepeat
        ? parseInt(annMm, 10) === selMonth && parseInt(annDd, 10) === selDay
        : ann.date === selectedDate;
      if (!matches) continue;
      const person = allPersons.find((p) => p.id === ann.personId);
      if (!person) continue;
      items.push({
        type: "anniversary",
        id: ann.id,
        personName: person.name,
        title: ann.title,
        date: ann.date,
        isRepeat: ann.isRepeat,
        dDay: dDayLabel(ann.date, ann.isRepeat),
        isBirthday: false,
      });
    }

    for (const person of allPersons) {
      if (!person.birthDate) continue;
      const [, bMm, bDd] = person.birthDate.split("-");
      if (parseInt(bMm, 10) !== selMonth || parseInt(bDd, 10) !== selDay) continue;
      items.push({
        type: "anniversary",
        id: `birth-${person.id}`,
        personName: person.name,
        title: "생일",
        date: person.birthDate,
        isRepeat: true,
        dDay: dDayLabel(person.birthDate, true),
        isBirthday: true,
      });
    }

    return items;
  }, [selectedDate, monthLogs, repeatLogs, anniversaries, allPersons, monthStart, monthEnd]);

  return { markedDates, dayItems };
}
