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
