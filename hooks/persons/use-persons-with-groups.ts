// 인물 목록과 그룹 정보를 함께 조회하는 훅
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";

export function usePersonsWithGroups() {
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

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

  return { allPersons, groupedPersons, ungrouped };
}
