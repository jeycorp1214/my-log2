// 해당 월의 기념일 날짜 목록 계산 — personAnniversaries + persons.birthDate
import { db } from "@/db/client";
import { personAnniversaries, persons } from "@/db/schema";
import { isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import dayjs from "dayjs";
import { useMemo } from "react";

export type AnniversaryBoardItem = {
  date: Date;
  title: string;
  isRepeat: false;
  type: "anniversary";
};

export function useAnniversariesInMonth(monthStart: Date, monthEnd: Date) {
  const { data: anniversaries = [] } = useLiveQuery(
    db.select().from(personAnniversaries),
  );

  const { data: birthPersons = [] } = useLiveQuery(
    db
      .select({ name: persons.name, birthDate: persons.birthDate })
      .from(persons)
      .where(isNotNull(persons.birthDate)),
  );

  return useMemo(() => {
    const monthYear = dayjs(monthStart).year();
    const monthMonth = dayjs(monthStart).month();

    const dates: Date[] = [];
    const boardItems: AnniversaryBoardItem[] = [];

    function add(date: Date, title: string) {
      dates.push(date);
      boardItems.push({ date, title, isRepeat: false, type: "anniversary" });
    }

    for (const ann of anniversaries) {
      const d = dayjs(ann.date);
      if (ann.isRepeat) {
        if (d.month() === monthMonth) {
          const occ = d.year(monthYear).toDate();
          if (occ >= monthStart && occ <= monthEnd) add(occ, ann.title);
        }
      } else {
        if (d.year() === monthYear && d.month() === monthMonth) {
          const occ = d.toDate();
          if (occ >= monthStart && occ <= monthEnd) add(occ, ann.title);
        }
      }
    }

    for (const p of birthPersons) {
      if (!p.birthDate) continue;
      const d = dayjs(p.birthDate);
      if (d.month() === monthMonth) {
        const occ = d.year(monthYear).toDate();
        if (occ >= monthStart && occ <= monthEnd) add(occ, `${p.name} 생일`);
      }
    }

    return { anniversaryDates: dates, anniversaryBoardItems: boardItems };
  }, [anniversaries, birthPersons, monthStart.getTime(), monthEnd.getTime()]);
}
