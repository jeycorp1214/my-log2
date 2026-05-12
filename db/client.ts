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

export async function runMigrations() {
  await migrate(db, migrations);
}

// 테이블 전체 DROP 후 마이그레이션 재실행 — 스키마 구조까지 초기화
export async function resetDatabase() {
  await expo.execAsync(`
    DROP TABLE IF EXISTS log_persons;
    DROP TABLE IF EXISTS person_anniversaries;
    DROP TABLE IF EXISTS logs;
    DROP TABLE IF EXISTS persons;
    DROP TABLE IF EXISTS groups;
    DROP TABLE IF EXISTS todos;
    DROP TABLE IF EXISTS memos;
    DROP TABLE IF EXISTS __drizzle_migrations;
  `);
  await runMigrations();
}
