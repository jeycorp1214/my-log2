// 앱 최초 실행 시 기본 그룹 3개 시드
import { db } from "./client";
import { groups } from "./schema";

export const DEFAULT_GROUPS = [
  { name: "집안", color: "#FF6B6B", emoji: "🏠", isDefault: true, sortOrder: 0 },
  { name: "친구", color: "#4ECDC4", emoji: "👥", isDefault: true, sortOrder: 1 },
  { name: "회사", color: "#45B7D1", emoji: "💼", isDefault: true, sortOrder: 2 },
];

export async function seedDefaultGroups() {
  const existing = await db.select().from(groups);
  if (existing.length > 0) return;
  await db.insert(groups).values(DEFAULT_GROUPS);
}
