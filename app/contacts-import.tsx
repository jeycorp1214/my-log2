// 연락처 선택 후 persons 테이블에 일괄 적재하는 모달 화면
import { db } from "@/db/client";
import { groups } from "@/db/schema";
import {
  type ImportableContact,
  useContactsImport,
} from "@/hooks/use-contacts-import";
import { cn } from "@/utils/utils";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ContactsImportScreen() {
  const router = useRouter();
  const { contacts, loading, permissionDenied, loadContacts, importContacts } =
    useContactsImport();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupId, setGroupId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);

  const { data: allGroups = [] } = useLiveQuery(
    db.select().from(groups).orderBy(groups.sortOrder),
  );

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (allGroups.length > 0 && groupId === null) {
      const def = allGroups.find((g) => g.isDefault) ?? allGroups[0];
      setGroupId(def.id);
    }
  }, [allGroups, groupId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, query]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  async function handleImport() {
    if (selected.size === 0 || groupId === null) return;
    setImporting(true);
    const selectedContacts = contacts.filter((c) => selected.has(c.id));
    const { added } = await importContacts(selectedContacts, groupId);
    setImporting(false);
    Alert.alert("완료", `${added}명이 추가되었습니다.`, [
      { text: "확인", onPress: () => router.back() },
    ]);
  }

  return (
    <View className="flex-1 bg-app-bg">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
        <Text className="text-white text-xl font-bold">연락처 가져오기</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="p-2">
          <X size={22} color="#888" />
        </Pressable>
      </View>

      {/* 권한 거부 */}
      {permissionDenied && (
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Text className="text-white text-base font-semibold">
            연락처 접근 권한이 없습니다.
          </Text>
          <Text className="text-app-muted text-sm text-center">
            설정 앱에서 연락처 권한을 허용해 주세요.
          </Text>
        </View>
      )}

      {/* 로딩 */}
      {loading && !permissionDenied && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4ecdc4" />
          <Text className="text-app-muted text-sm mt-3">연락처 불러오는 중...</Text>
        </View>
      )}

      {/* 본문 */}
      {!loading && !permissionDenied && (
        <>
          {/* 검색 */}
          <View className="px-4 mb-2">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="이름 검색..."
              placeholderTextColor="#555"
              className="bg-[#1e1e1e] text-white rounded-xl px-4 py-3 text-sm"
            />
          </View>

          {/* 요약 바 */}
          <View className="flex-row items-center justify-between px-5 py-2 border-b border-[#1e1e1e]">
            <Text className="text-app-muted text-sm">
              {contacts.length}명 · {selected.size}명 선택
            </Text>
            <Pressable onPress={toggleAll} hitSlop={8}>
              <Text className="text-app-teal text-sm">
                {selected.size === filtered.length && filtered.length > 0
                  ? "전체 해제"
                  : "전체 선택"}
              </Text>
            </Pressable>
          </View>

          {/* 연락처 목록 */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180 }}
            ListEmptyComponent={
              <Text className="text-app-muted text-center mt-12 text-sm">
                연락처가 없습니다.
              </Text>
            }
            renderItem={({ item }: { item: ImportableContact }) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  className={cn(
                    "flex-row items-center gap-3 py-3 border-b border-[#1a1a1a]",
                  )}
                >
                  <View
                    className={cn(
                      "w-5 h-5 rounded-full border items-center justify-center",
                      isSelected
                        ? "bg-app-teal border-app-teal"
                        : "border-[#444]",
                    )}
                  >
                    {isSelected && <Check size={12} color="#111" strokeWidth={3} />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium">
                      {item.name}
                    </Text>
                    {(item.phone || item.email) && (
                      <Text className="text-app-muted text-xs mt-0.5">
                        {[item.phone, item.email].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>
                  {item.anniversaries.length > 0 && (
                    <Text className="text-[#555] text-xs">
                      기념일 {item.anniversaries.length}개
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />

          {/* 하단 고정 — 그룹 선택 + 가져오기 버튼 */}
          <View className="absolute bottom-0 left-0 right-0 bg-app-surface border-t border-[#222] px-4 pt-4 pb-8">
            <Text className="text-app-label text-xs font-semibold uppercase tracking-[0.5px] mb-3">
              그룹
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              className="mb-4"
            >
              {allGroups.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => setGroupId(g.id)}
                  className="rounded-[10px] px-4 py-2"
                  style={{
                    backgroundColor: groupId === g.id ? "#4ecdc4" : "#2a2a2a",
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: groupId === g.id ? "#111" : "#888" }}
                  >
                    {g.emoji ? `${g.emoji} ${g.name}` : g.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              onPress={handleImport}
              disabled={selected.size === 0 || importing || groupId === null}
              className="rounded-xl py-3.5 items-center"
              style={{
                backgroundColor:
                  selected.size > 0 && !importing ? "#4ecdc4" : "#2a2a2a",
              }}
            >
              {importing ? (
                <ActivityIndicator color="#111" />
              ) : (
                <Text
                  className="font-semibold text-sm"
                  style={{
                    color: selected.size > 0 ? "#111" : "#555",
                  }}
                >
                  {selected.size > 0
                    ? `${selected.size}명 가져오기`
                    : "연락처를 선택하세요"}
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}
