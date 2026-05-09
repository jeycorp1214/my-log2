// 전체 텍스트 검색 화면 — 기록(제목/메모) + 인물(이름/메모) LIKE 검색
import { PersonCard } from "@/components/persons/PersonCard";
import { SearchLogItem } from "@/components/logs/SearchLogItem";
import { db } from "@/db/client";
import { groups, logs, persons } from "@/db/schema";
import { cn } from "@/utils/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { desc, eq, like, or, sql } from "drizzle-orm";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import type { InferSelectModel } from "drizzle-orm";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from "react-native";

type Log = InferSelectModel<typeof logs>;
type Person = InferSelectModel<typeof persons>;

type LogItem = { _type: "log"; log: Log };
type PersonItem = { _type: "person"; person: Person; groupColor: string };
type SearchItem = LogItem | PersonItem;

type SearchSection = { title: string; data: SearchItem[] };

export default function SearchScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

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
      .select({ person: persons, groupColor: groups.color })
      .from(persons)
      .leftJoin(groups, eq(persons.groupId, groups.id))
      .where(
        isActive
          ? or(like(persons.name, pattern), like(persons.memo, pattern))
          : sql`0`,
      )
      .orderBy(persons.name)
      .limit(20),
    [debouncedQuery],
  );

  const sections: SearchSection[] = useMemo(() => {
    if (!isActive) return [];
    const result: SearchSection[] = [];

    if (rawLogs.length > 0) {
      result.push({
        title: `기록 (${rawLogs.length}개)`,
        data: rawLogs.map((log) => ({ _type: "log" as const, log })),
      });
    }

    if (rawPersonResults.length > 0) {
      result.push({
        title: `인물 (${rawPersonResults.length}개)`,
        data: rawPersonResults.map(({ person, groupColor }) => ({
          _type: "person" as const,
          person,
          groupColor: groupColor ?? "#888",
        })),
      });
    }

    return result;
  }, [isActive, rawLogs, rawPersonResults]);

  const status = !isActive
    ? "idle"
    : debouncedQuery.length === 1
      ? "too-short"
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
        <View className="flex-1 flex-row items-center gap-2 bg-app-surface rounded-[12px] px-3 h-10">
          <Search size={16} color="#666" />
          <TextInput
            className="flex-1 text-white text-[15px]"
            placeholder="기록, 인물 검색..."
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

      {/* 상태별 UI */}
      {status === "idle" && (
        <View className="flex-1 items-center justify-center pb-20">
          <Search size={40} color="#333" />
          <Text className="text-app-muted text-[15px] mt-4">
            기록과 인물을 검색합니다.
          </Text>
          <Text className="text-[#444] text-[13px] mt-1">
            2글자 이상 입력해 주세요.
          </Text>
        </View>
      )}

      {status === "empty" && (
        <View className="flex-1 items-center justify-center pb-20">
          <Text className="text-app-muted text-[15px]">
            '{debouncedQuery}'에 대한 결과가 없습니다.
          </Text>
        </View>
      )}

      {status === "results" && (
        <SectionList
          sections={sections}
          keyExtractor={(item, idx) =>
            item._type === "log" ? item.log.id : `${item.person.id}-${idx}`
          }
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
            return (
              <View className="px-4">
                <PersonCard
                  person={item.person}
                  groupColor={item.groupColor}
                  onPress={() =>
                    router.push({
                      pathname: "/persons/[id]",
                      params: { id: item.person.id },
                    })
                  }
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
