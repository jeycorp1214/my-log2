// 해당 기간의 기념일 목록 계산 — personAnniversaries(persons 조인) + persons.birthDate
import { db } from "@/db/client";
import { personAnniversaries, persons } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import dayjs from "dayjs";
import { useMemo } from "react";

export type AnniversaryBoardItem = {
  date: Date;
  displayTitle: string;
  personId: string;
  isRepeat: false;
  type: "anniversary";
};

export function useAnniversariesInMonth(start: Date, end: Date, enabled = true) {
  const { data: annWithPersons = [] } = useLiveQuery(
    db
      .select({
        id: personAnniversaries.id,
        personId: personAnniversaries.personId,
        personName: persons.name,
        title: personAnniversaries.title,
        date: personAnniversaries.date,
        isRepeat: personAnniversaries.isRepeat,
      })
      .from(personAnniversaries)
      .leftJoin(persons, eq(personAnniversaries.personId, persons.id)),
  );

  const { data: birthPersons = [] } = useLiveQuery(
    db
      .select({ id: persons.id, name: persons.name, birthDate: persons.birthDate })
      .from(persons)
      .where(isNotNull(persons.birthDate)),
  );

  return useMemo(() => {
    if (!enabled) return { anniversaryDates: [], anniversaryBoardItems: [] };
    const startYear = dayjs(start).year();
    const endYear = dayjs(end).year();
    const rangeYears = endYear - startYear;
    const today = dayjs();

    // 범위가 너무 크면(전체 등) 현재 연도 ±2로 제한 — occurrence 폭발 방지
    const [effStart, effEnd] = rangeYears > 10
      ? [today.year() - 1, today.year() + 2]
      : [startYear, endYear];

    const dates: Date[] = [];
    const boardItems: AnniversaryBoardItem[] = [];

    function add(date: Date, displayTitle: string, personId: string) {
      dates.push(date);
      boardItems.push({ date, displayTitle, personId, isRepeat: false, type: "anniversary" });
    }

    for (const ann of annWithPersons) {
      const d = dayjs(ann.date);
      const name = ann.personName ?? "";
      const prefix = name ? `${name} - ` : "";

      if (ann.isRepeat) {
        for (let y = effStart; y <= effEnd; y++) {
          const occ = d.year(y).toDate();
          if (occ >= start && occ <= end) {
            const years = y - d.year();
            const suffix = years > 0 ? ` · ${years}주년` : "";
            add(occ, `${prefix}${ann.title}${suffix}`, ann.personId);
          }
        }
      } else {
        const occ = d.toDate();
        if (occ >= start && occ <= end) {
          add(occ, `${prefix}${ann.title}`, ann.personId);
        }
      }
    }

    for (const p of birthPersons) {
      if (!p.birthDate) continue;
      const d = dayjs(p.birthDate);
      const birthYear = d.year();

      for (let y = effStart; y <= effEnd; y++) {
        const occ = d.year(y).toDate();
        if (occ >= start && occ <= end) {
          const age = y - birthYear;
          const suffix = age > 0 ? ` · ${age}번째` : "";
          add(occ, `${p.name} 생일${suffix}`, p.id);
        }
      }
    }

    return { anniversaryDates: dates, anniversaryBoardItems: boardItems };
  }, [annWithPersons, birthPersons, start.getTime(), end.getTime(), enabled]);
}
