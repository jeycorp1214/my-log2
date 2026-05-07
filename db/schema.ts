// 앱 전체 SQLite 스키마 정의 (groups, persons, logs, logPersons)
import { int, text, sqliteTable, index } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable("groups", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  color: text("color").notNull(),
  emoji: text("emoji"),
  isDefault: int("is_default", { mode: "boolean" }).notNull().default(false),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: int("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: int("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const persons = sqliteTable("persons", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  birthDate: text("birth_date"),
  mbti: text("mbti"),
  memo: text("memo"),
  groupId: text("group_id")
    .notNull()
    .references(() => groups.id),
  createdAt: int("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: int("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const logs = sqliteTable(
  "logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    logDate: int("log_date", { mode: "timestamp_ms" }).notNull(),
    memo: text("memo"),
    repeatType: text("repeat_type"), // none|daily|weekly|monthly|yearly
    repeatInterval: int("repeat_interval"),
    repeatUntil: int("repeat_until", { mode: "timestamp_ms" }),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
    createdAt: int("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: int("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("log_date_idx").on(table.logDate),
    index("log_group_id_idx").on(table.groupId),
  ],
);

export const logPersons = sqliteTable("log_persons", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  logId: text("log_id")
    .notNull()
    .references(() => logs.id, { onDelete: "cascade" }),
  personId: text("person_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),
});
