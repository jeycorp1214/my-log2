// DB 전체 데이터를 JSON으로 내보내고 불러오는 백업/복원 서비스
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import dayjs from "dayjs";

import { db } from "@/db/client";
import {
  groups,
  logPersons,
  logs,
  memos,
  personAnniversaries,
  persons,
  todos,
} from "@/db/schema";

export const BACKUP_VERSION = 1;

export type BackupData = {
  version: number;
  exported_at: string;
  data: {
    groups: typeof groups.$inferSelect[];
    persons: typeof persons.$inferSelect[];
    logs: typeof logs.$inferSelect[];
    logPersons: typeof logPersons.$inferSelect[];
    personAnniversaries: typeof personAnniversaries.$inferSelect[];
    todos: typeof todos.$inferSelect[];
    memos: typeof memos.$inferSelect[];
  };
};

export async function exportData(): Promise<void> {
  const [
    allGroups,
    allPersons,
    allLogs,
    allLogPersons,
    allPersonAnniversaries,
    allTodos,
    allMemos,
  ] = await Promise.all([
    db.select().from(groups),
    db.select().from(persons),
    db.select().from(logs),
    db.select().from(logPersons),
    db.select().from(personAnniversaries),
    db.select().from(todos),
    db.select().from(memos),
  ]);

  const backup: BackupData = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data: {
      groups: allGroups,
      persons: allPersons,
      logs: allLogs,
      logPersons: allLogPersons,
      personAnniversaries: allPersonAnniversaries,
      todos: allTodos,
      memos: allMemos,
    },
  };

  const filename = `mylog_backup_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
  const path = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(path, JSON.stringify(backup, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(path, {
    mimeType: "application/json",
    dialogTitle: "백업 파일 저장",
  });
}

export async function pickAndImport(): Promise<{ count: Record<string, number> }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled) throw new Error("CANCELLED");

  const uri = result.assets[0].uri;
  const raw = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let backup: BackupData;
  try {
    backup = JSON.parse(raw);
  } catch {
    throw new Error("JSON 파싱 실패 — 올바른 백업 파일이 아닙니다.");
  }

  if (backup.version !== BACKUP_VERSION) {
    throw new Error(`지원하지 않는 버전입니다. (version: ${backup.version})`);
  }

  const d = backup.data;
  if (!d?.groups || !d?.persons || !d?.logs) {
    throw new Error("백업 파일 구조가 올바르지 않습니다.");
  }

  await importData(backup);

  return {
    count: {
      groups: d.groups.length,
      persons: d.persons.length,
      logs: d.logs.length,
      logPersons: d.logPersons?.length ?? 0,
      personAnniversaries: d.personAnniversaries?.length ?? 0,
      todos: d.todos?.length ?? 0,
      memos: d.memos?.length ?? 0,
    },
  };
}

async function importData(backup: BackupData): Promise<void> {
  const d = backup.data;

  // 외래키 제약 순서대로 삭제
  await db.delete(logPersons);
  await db.delete(personAnniversaries);
  await db.delete(logs);
  await db.delete(persons);
  await db.delete(groups);
  await db.delete(todos);
  await db.delete(memos);

  // timestamp_ms 컬럼 복원 — JSON에서 number/string 모두 처리
  function toDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    return new Date(v as string | number);
  }

  if (d.groups.length > 0) await db.insert(groups).values(d.groups);

  if (d.persons.length > 0) {
    await db.insert(persons).values(
      d.persons.map((p) => ({
        ...p,
        createdAt: toDate(p.createdAt)!,
        updatedAt: toDate(p.updatedAt)!,
      })),
    );
  }

  if (d.logs.length > 0) {
    await db.insert(logs).values(
      d.logs.map((l) => ({
        ...l,
        logDate: toDate(l.logDate)!,
        repeatUntil: toDate(l.repeatUntil),
        checkedAt: toDate(l.checkedAt),
        createdAt: toDate(l.createdAt)!,
        updatedAt: toDate(l.updatedAt)!,
      })),
    );
  }

  if (d.logPersons?.length > 0) await db.insert(logPersons).values(d.logPersons);

  if (d.personAnniversaries?.length > 0) {
    await db.insert(personAnniversaries).values(
      d.personAnniversaries.map((a) => ({
        ...a,
        createdAt: toDate(a.createdAt)!,
      })),
    );
  }

  if (d.todos?.length > 0) {
    await db.insert(todos).values(
      d.todos.map((t) => ({
        ...t,
        checkedAt: toDate(t.checkedAt),
        createdAt: toDate(t.createdAt)!,
        updatedAt: toDate(t.updatedAt)!,
      })),
    );
  }

  if (d.memos?.length > 0) {
    await db.insert(memos).values(
      d.memos.map((m) => ({
        ...m,
        checkedAt: toDate(m.checkedAt),
        createdAt: toDate(m.createdAt)!,
        updatedAt: toDate(m.updatedAt)!,
      })),
    );
  }
}
