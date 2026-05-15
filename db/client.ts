// expo-sqlite + drizzle-orm 클라이언트 초기화
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import * as schema from "./schema";

const expo = SQLite.openDatabaseSync("mylog.db", {
  enableChangeListener: true,
});

export const db = drizzle(expo, { schema });

// 컬럼이 없으면 ALTER TABLE — drizzle 마이그레이터 실패 시 안전망
async function ensurePersonsColumns() {
  const colDefs: { column: string; sql: string }[] = [
    {
      column: "is_pinned",
      sql: "ALTER TABLE persons ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0",
    },
    {
      column: "contact_interval",
      sql: "ALTER TABLE persons ADD COLUMN contact_interval INTEGER",
    },
    {
      column: "tags",
      sql: "ALTER TABLE persons ADD COLUMN tags TEXT",
    },
    {
      column: "met_at",
      sql: "ALTER TABLE persons ADD COLUMN met_at TEXT",
    },
  ];

  const rows = await expo.getAllAsync<{ name: string }>(
    "PRAGMA table_info(persons)",
  );
  const existing = new Set(rows.map((r) => r.name));

  for (const def of colDefs) {
    if (!existing.has(def.column)) {
      await expo.execAsync(def.sql);
    }
  }
}

export async function runMigrations() {
  await migrate(db, migrations);
  await ensurePersonsColumns();
}

// 테이블 전체 DROP 후 마이그레이션 재실행 — 스키마 구조까지 초기화
export async function resetDatabase() {
  const drops = [
    "DROP TABLE IF EXISTS log_persons",
    "DROP TABLE IF EXISTS person_anniversaries",
    "DROP TABLE IF EXISTS logs",
    "DROP TABLE IF EXISTS persons",
    "DROP TABLE IF EXISTS groups",
    "DROP TABLE IF EXISTS todos",
    "DROP TABLE IF EXISTS memos",
    "DROP TABLE IF EXISTS __drizzle_migrations",
  ];
  for (const sql of drops) {
    await expo.execAsync(sql);
  }
  await runMigrations();
}
