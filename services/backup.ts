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

// 파일 선택 + 파싱만. import는 하지 않음 — 미리보기용
export async function pickBackupFile(): Promise<BackupData> {
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

  // 현재보다 낮은 버전은 허용 (컬럼 추가만 있었으면 복원 가능)
  if (typeof backup.version !== "number" || backup.version > BACKUP_VERSION) {
    throw new Error(`지원하지 않는 버전입니다. (version: ${backup.version})`);
  }

  const d = backup.data;
  if (!d?.groups || !d?.persons || !d?.logs) {
    throw new Error("백업 파일 구조가 올바르지 않습니다.");
  }

  return backup;
}

// 미리보기 확인 후 실제 import
export async function applyImport(backup: BackupData): Promise<void> {
  await importData(backup);
}

async function importData(backup: BackupData): Promise<void> {
  const d = backup.data;

  // timestamp_ms 컬럼 복원 — JSON에서 number/string 모두 처리
  function toDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    return new Date(v as string | number);
  }

  await db.transaction(async (tx) => {
    // 외래키 제약 순서대로 삭제
    await tx.delete(logPersons);
    await tx.delete(personAnniversaries);
    await tx.delete(logs);
    await tx.delete(persons);
    await tx.delete(groups);
    await tx.delete(todos);
    await tx.delete(memos);

    if (d.groups.length > 0) {
      await tx.insert(groups).values(
        d.groups.map((g) => ({
          ...g,
          createdAt: toDate(g.createdAt)!,
          updatedAt: toDate(g.updatedAt)!,
        })),
      );
    }

    if (d.persons.length > 0) {
      await tx.insert(persons).values(
        d.persons.map((p) => ({
          ...p,
          createdAt: toDate(p.createdAt)!,
          updatedAt: toDate(p.updatedAt)!,
        })),
      );
    }

    if (d.logs.length > 0) {
      await tx.insert(logs).values(
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

    if (d.logPersons?.length > 0) await tx.insert(logPersons).values(d.logPersons);

    if (d.personAnniversaries?.length > 0) {
      await tx.insert(personAnniversaries).values(
        d.personAnniversaries.map((a) => ({
          ...a,
          createdAt: toDate(a.createdAt)!,
        })),
      );
    }

    if (d.todos?.length > 0) {
      await tx.insert(todos).values(
        d.todos.map((t) => ({
          ...t,
          checkedAt: toDate(t.checkedAt),
          createdAt: toDate(t.createdAt)!,
          updatedAt: toDate(t.updatedAt)!,
        })),
      );
    }

    if (d.memos?.length > 0) {
      await tx.insert(memos).values(
        d.memos.map((m) => ({
          ...m,
          checkedAt: toDate(m.checkedAt),
          createdAt: toDate(m.createdAt)!,
          updatedAt: toDate(m.updatedAt)!,
        })),
      );
    }
  });
}
