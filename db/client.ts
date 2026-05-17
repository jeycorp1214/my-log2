// expo-sqlite + drizzle-orm 클라이언트 초기화
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import * as SQLite from "expo-sqlite";
import migrations from "../drizzle/migrations";
import * as schema from "./schema";

const expo = SQLite.openDatabaseSync("mylog.db", {
  enableChangeListener: true,
});

export const db = drizzle(expo, { schema });

// 컬럼이 없으면 ALTER TABLE — drizzle 마이그레이터 실패 시 안전망
async function ensureColumns(
  table: string,
  colDefs: { column: string; sql: string }[],
) {
  const rows = await expo.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  const existing = new Set(rows.map((r) => r.name));
  for (const def of colDefs) {
    if (!existing.has(def.column)) {
      await expo.execAsync(def.sql);
    }
  }
}

// 마이그레이션 누락 시 안전망 — 테이블별 컬럼 존재 여부 보장
async function ensureAllLegacyColumns() {
  await ensureColumns("groups", [
    { column: "sort_order", sql: "ALTER TABLE groups ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0" },
    { column: "is_system", sql: "ALTER TABLE groups ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0" },
  ]);
  await ensureColumns("persons", [
    { column: "is_pinned", sql: "ALTER TABLE persons ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0" },
    { column: "contact_interval", sql: "ALTER TABLE persons ADD COLUMN contact_interval INTEGER" },
    { column: "tags", sql: "ALTER TABLE persons ADD COLUMN tags TEXT" },
    { column: "met_at", sql: "ALTER TABLE persons ADD COLUMN met_at TEXT" },
  ]);
  await ensureColumns("todos", [
    { column: "note", sql: "ALTER TABLE todos ADD COLUMN note TEXT" },
    { column: "due_date", sql: "ALTER TABLE todos ADD COLUMN due_date TEXT" },
  ]);
  await ensureColumns("memos", [
    { column: "pinned_at", sql: "ALTER TABLE memos ADD COLUMN pinned_at INTEGER" },
  ]);
}

export async function runMigrations() {
  await migrate(db, migrations);
  await ensureAllLegacyColumns();
}

// 전체 데이터 삭제 + 마이그레이션 재실행 — 복구 불가. 개발/QA 전용.
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
