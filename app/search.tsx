// 전체 텍스트 검색 화면 — 기록/프로필/메모/할일 LIKE 검색 + 필터 칩
import { SearchLogItem } from "@/components/logs/SearchLogItem";
import { PersonCard } from "@/components/persons/PersonCard";
import { SearchMemoItem } from "@/components/search/SearchMemoItem";
import { SearchTodoItem } from "@/components/search/SearchTodoItem";
import { db } from "@/db/client";
import { groups, logPersons, logs, memos, persons, todos } from "@/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { count, desc, eq, like, or, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";

type Log = InferSelectModel<typeof logs>;
type Person = InferSelectModel<typeof persons>;
type Memo = InferSelectModel<typeof memos>;
type Todo = InferSelectModel<typeof todos>;

type LogItem = { _type: "log"; log: Log };
type PersonItem = {
  _type: "person";
  person: Person;
  groupColor: string;
  logCount: number;
};
type MemoItem = { _type: "memo"; memo: Memo };
type TodoItem = { _type: "todo"; todo: Todo };
type SearchItem = LogItem | PersonItem | MemoItem | TodoItem;

type SearchSection = { title: string; key: FilterType; data: SearchItem[] };

type FilterType = "all" | "log" | "person" | "memo" | "todo";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "log", label: "기록" },
  { key: "person", label: "프로필" },
  { key: "memo", label: "메모" },
  { key: "todo", label: "할 일" },
];

export default function SearchScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputText.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputText]);

  const isActive = debouncedQuery.length >= 2;
  const pattern = `%${debouncedQuery}%`;

  const { data: rawLogs = [] } = useLiveQuery(
    db
      .select()
      .from(logs)
      .where(
        isActive
          ? or(like(logs.title, pattern), like(logs.memo, pattern))
          : sql`0`,
      )
      .orderBy(desc(logs.logDate))
      .limit(50),
    [debouncedQuery],
  );

  const { data: rawPersonResults = [] } = useLiveQuery(
    db
      .select({
        person: persons,
        groupColor: groups.color,
        logCount: count(logPersons.logId),
      })
      .from(persons)
      .leftJoin(groups, eq(persons.groupId, groups.id))
      .leftJoin(logPersons, eq(logPersons.personId, persons.id))
      .where(
        isActive
          ? or(like(persons.name, pattern), like(persons.memo, pattern))
          : sql`0`,
      )
      .groupBy(persons.id)
      .orderBy(persons.name)
      .limit(20),
    [debouncedQuery],
  );

  const { data: rawMemos = [] } = useLiveQuery(
    db
      .select()
      .from(memos)
      .where(isActive ? like(memos.content, pattern) : sql`0`)
      .orderBy(desc(memos.createdAt))
      .limit(30),
    [debouncedQuery],
  );

  const { data: rawTodos = [] } = useLiveQuery(
    db
      .select()
      .from(todos)
      .where(isActive ? like(todos.title, pattern) : sql`0`)
      .orderBy(desc(todos.createdAt))
      .limit(30),
    [debouncedQuery],
  );

  const allSections: SearchSection[] = useMemo(() => {
    if (!isActive) return [];
    const result: SearchSection[] = [];

    if (rawLogs.length > 0) {
      result.push({
        key: "log",
        title: `기록 (${rawLogs.length}개)`,
        data: rawLogs.map((log) => ({ _type: "log" as const, log })),
      });
    }
    if (rawPersonResults.length > 0) {
      result.push({
        key: "person",
        title: `프로필 (${rawPersonResults.length}개)`,
        data: rawPersonResults.map(({ person, groupColor, logCount }) => ({
          _type: "person" as const,
          person,
          groupColor: groupColor ?? "#888",
          logCount,
        })),
      });
    }
    if (rawMemos.length > 0) {
      result.push({
        key: "memo",
        title: `메모 (${rawMemos.length}개)`,
        data: rawMemos.map((memo) => ({ _type: "memo" as const, memo })),
      });
    }
    if (rawTodos.length > 0) {
      result.push({
        key: "todo",
        title: `할 일 (${rawTodos.length}개)`,
        data: rawTodos.map((todo) => ({ _type: "todo" as const, todo })),
      });
    }

    return result;
  }, [isActive, rawLogs, rawPersonResults, rawMemos, rawTodos]);

  const sections = useMemo(
    () =>
      activeFilter === "all"
        ? allSections
        : allSections.filter((s) => s.key === activeFilter),
    [allSections, activeFilter],
  );

  const totalCount = allSections.reduce((acc, s) => acc + s.data.length, 0);

  const status = !isActive
    ? "idle"
    : sections.length === 0
      ? "empty"
      : "results";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-app-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* 검색 헤더 */}
      <View className="flex-row items-center gap-3 px-4 pt-14 pb-3">
        <View className="flex-1 flex-row items-center gap-2 bg-app-surface rounded-[12px] px-3 h-12">
          <Search size={16} color="#666" />
          <TextInput
            className="flex-1 text-white text-sm"
            placeholder="기록, 프로필, 메모, 할 일 검색..."
            placeholderTextColor="#555"
            value={inputText}
            onChangeText={setInputText}
            autoFocus
            returnKeyType="search"
            clearButtonMode="never"
          />
          {inputText.length > 0 && (
            <Pressable onPress={() => setInputText("")} hitSlop={8}>
              <X size={16} color="#555" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text className="text-app-teal text-[14px]">닫기</Text>
        </Pressable>
      </View>

      {/* 필터 칩 */}
      {isActive && totalCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 8,
            gap: 8,
          }}
          style={{ flexGrow: 0 }}
        >
          {FILTERS.map((f) => {
            const isSelected = activeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: isSelected ? "#4ECDC4" : "#222" }}
              >
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: isSelected ? "#111" : "#888" }}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* 상태별 UI */}
      {status === "idle" && (
        <View className="flex-1 items-center justify-center pb-20">
          <Search size={40} color="#333" />
          <Text className="text-app-muted text-sm mt-4">
            기록, 프로필, 메모, 할 일을 검색합니다.
          </Text>
          <Text className="text-[#444] text-[13px] mt-1">
            2글자 이상 입력해 주세요.
          </Text>
        </View>
      )}

      {status === "empty" && (
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-app-muted text-sm">
            {debouncedQuery}에 대한 결과가 없습니다.
          </Text>
        </View>
      )}

      {status === "results" && (
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) => {
            if (item._type === "log") return item.log.id;
            if (item._type === "person") return item.person.id;
            if (item._type === "memo") return item.memo.id;
            return `${item.todo.id}-${idx}`;
          }}
          renderSectionHeader={({ section }) => (
            <View className="px-4 py-2 bg-app-bg">
              <Text className="text-app-label text-[12px] font-semibold uppercase tracking-[0.5px]">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            if (item._type === "log") {
              return (
                <View className="px-4">
                  <SearchLogItem
                    log={item.log}
                    onPress={() =>
                      router.push({
                        pathname: "/logs/[id]",
                        params: { id: item.log.id },
                      })
                    }
                  />
                </View>
              );
            }
            if (item._type === "person") {
              return (
                <View className="px-4">
                  <PersonCard
                    person={item.person}
                    groupColor={item.groupColor}
                    logCount={item.logCount}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: item.person.id },
                      })
                    }
                  />
                </View>
              );
            }
            if (item._type === "memo") {
              return (
                <View className="px-4">
                  <SearchMemoItem
                    memo={item.memo}
                    onPress={() =>
                      router.push({
                        pathname: "/memos/[id]",
                        params: { id: item.memo.id },
                      })
                    }
                  />
                </View>
              );
            }
            return (
              <View className="px-4">
                <SearchTodoItem
                  todo={item.todo}
                  onPress={() => router.push("/(tabs)/memo")}
                />
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 96 }}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}
