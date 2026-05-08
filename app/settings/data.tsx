// 데이터 뷰어 화면 — 로컬 DB 전체 데이터 조회
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { db } from "@/db/client";
import { groups, logPersons, logs, persons } from "@/db/schema";

export default function DataViewerScreen() {
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allLogs = [] } = useLiveQuery(db.select().from(logs));
  const { data: allLogPersons = [] } = useLiveQuery(
    db.select().from(logPersons),
  );

  const [expanded, setExpanded] = useState<string | null>("groups");

  function toggleTable(tableName: string) {
    setExpanded(expanded === tableName ? null : tableName);
  }

  function renderJson(value: any): string {
    if (value === null || value === undefined) return "null";
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return JSON.stringify(value);
  }

  interface TableSection {
    name: string;
    label: string;
    data: any[];
  }

  const tables: TableSection[] = [
    { name: "groups", label: `📁 그룹 (${allGroups.length})`, data: allGroups },
    {
      name: "persons",
      label: `👤 인물 (${allPersons.length})`,
      data: allPersons,
    },
    { name: "logs", label: `📝 기록 (${allLogs.length})`, data: allLogs },
    {
      name: "logPersons",
      label: `🔗 기록-인물 연결 (${allLogPersons.length})`,
      data: allLogPersons,
    },
  ];

  return (
    <View className="flex-1 bg-app-bg">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-white text-lg font-bold">📊 데이터 뷰어</Text>
        <Text className="text-app-muted text-xs mt-1">
          로컬 DB의 모든 테이블 데이터
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {tables.map((table) => (
          <View key={table.name} className="mb-4">
            <Pressable
              onPress={() => toggleTable(table.name)}
              className={`rounded-[12px] p-3 flex-row items-center justify-between ${
                expanded === table.name ? "bg-app-teal" : "bg-app-surface"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  expanded === table.name ? "text-[#111]" : "text-white"
                }`}
              >
                {table.label}
              </Text>
              <Text
                className={
                  expanded === table.name ? "text-[#111]" : "text-app-muted"
                }
              >
                {expanded === table.name ? "−" : "+"}
              </Text>
            </Pressable>

            {expanded === table.name && (
              <View className="mt-2 bg-app-surface rounded-[10px] p-3">
                {table.data.length === 0 ? (
                  <Text className="text-app-muted text-[13px] text-center py-2">
                    데이터 없음
                  </Text>
                ) : (
                  <View>
                    {table.data.map((item, idx) => (
                      <View
                        key={idx}
                        className={`py-2 ${idx < table.data.length - 1 ? "border-b border-[#2a2a2a]" : ""}`}
                      >
                        <View className="flex-row flex-wrap gap-1">
                          {Object.entries(item).map(([key, value]) => (
                            <View key={key} className="w-full mb-1">
                              <Text className="text-[#666] text-[11px] font-mono">
                                {key}
                              </Text>
                              <Text
                                className="text-app-label text-[11px] font-mono"
                                numberOfLines={3}
                                selectable
                              >
                                {renderJson(value)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        ))}

        <View className="mt-4 bg-app-teal-dark rounded-[10px] p-3">
          <Text className="text-app-teal text-[13px]">
            💡 팁: 각 테이블을 탭하면 데이터를 펼쳐볼 수 있습니다. 텍스트를 길게
            누르면 복사 가능합니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
