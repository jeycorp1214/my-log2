// 프로필 목록과 그룹 정보를 함께 조회하는 훅
import { db } from "@/db/client";
import { groups, logPersons, logs, persons } from "@/db/schema";
import { eq, max } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

export function usePersonsWithGroups() {
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: lastContactRows = [] } = useLiveQuery(
    db
      .select({ personId: logPersons.personId, lastDate: max(logs.logDate) })
      .from(logPersons)
      .innerJoin(logs, eq(logPersons.logId, logs.id))
      .groupBy(logPersons.personId),
  );

  const lastLogDateMap = useMemo(() => {
    const map = new Map<string, Date>();
    for (const row of lastContactRows) {
      if (row.lastDate) map.set(row.personId, row.lastDate as Date);
    }
    return map;
  }, [lastContactRows]);

  const groupedPersons = useMemo(
    () =>
      allGroups
        .map((group) => ({
          group,
          members: allPersons.filter((p) => p.groupId === group.id),
        }))
        .filter((section) => section.members.length > 0),
    [allPersons, allGroups],
  );

  const ungrouped = useMemo(
    () => allPersons.filter((p) => !p.groupId),
    [allPersons],
  );

  return { allPersons, groupedPersons, ungrouped, lastLogDateMap };
}
