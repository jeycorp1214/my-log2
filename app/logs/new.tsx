// 로그 추가 모달 화면
import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { logs, logPersons, groups, persons } from "@/db/schema";

const REPEAT_OPTIONS = [
  { label: "없음", value: "none" },
  { label: "매일", value: "daily" },
  { label: "매주", value: "weekly" },
  { label: "매월", value: "monthly" },
  { label: "매년", value: "yearly" },
];

export default function LogNewScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();

  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));

  const initialDate = date ? new Date(date) : new Date();

  const [title, setTitle] = useState("");
  const [logDate] = useState(initialDate);
  const [memo, setMemo] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [groupId, setGroupId] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  function togglePerson(pid: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid],
    );
  }

  async function save() {
    if (!title.trim()) { Alert.alert("제목을 입력해 주세요."); return; }
    if (!groupId) { Alert.alert("그룹을 선택해 주세요."); return; }

    const [inserted] = await db.insert(logs).values({
      title: title.trim(),
      logDate,
      memo: memo.trim() || undefined,
      repeatType: repeatType !== "none" ? repeatType : undefined,
      groupId,
    }).returning({ id: logs.id });

    if (selectedPersonIds.length > 0) {
      await db.insert(logPersons).values(
        selectedPersonIds.map((personId) => ({ logId: inserted.id, personId })),
      );
    }

    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>제목 *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="기록 제목" placeholderTextColor="#555" />

      <Text style={styles.label}>메모</Text>
      <TextInput style={[styles.input, styles.textarea]} value={memo} onChangeText={setMemo} placeholder="메모" placeholderTextColor="#555" multiline numberOfLines={4} />

      <Text style={styles.label}>반복</Text>
      <View style={styles.chipRow}>
        {REPEAT_OPTIONS.map(({ label, value }) => (
          <Pressable key={value} onPress={() => setRepeatType(value)} style={[styles.chip, repeatType === value && styles.chipSelected]}>
            <Text style={[styles.chipText, repeatType === value && styles.chipTextSelected]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>그룹 *</Text>
      <View style={styles.chipRow}>
        {allGroups.map((g) => (
          <Pressable key={g.id} onPress={() => setGroupId(g.id)} style={[styles.chip, groupId === g.id && styles.chipSelected]}>
            <Text style={[styles.chipText, groupId === g.id && styles.chipTextSelected]}>{g.emoji} {g.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>관련 인물</Text>
      <View style={styles.chipRow}>
        {allPersons.map((p) => (
          <Pressable key={p.id} onPress={() => togglePerson(p.id)} style={[styles.chip, selectedPersonIds.includes(p.id) && styles.chipSelected]}>
            <Text style={[styles.chipText, selectedPersonIds.includes(p.id) && styles.chipTextSelected]}>{p.name}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={save} style={styles.saveBtn}>
        <Text style={styles.saveBtnText}>저장</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  label: { color: "#aaa", fontSize: 13, marginTop: 12 },
  input: { backgroundColor: "#1e1e1e", color: "#fff", borderRadius: 10, padding: 12, fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { backgroundColor: "#1e1e1e", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: "#4ECDC4" },
  chipText: { color: "#aaa", fontSize: 13 },
  chipTextSelected: { color: "#111", fontWeight: "600" },
  saveBtn: { backgroundColor: "#4ECDC4", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "700" },
});
