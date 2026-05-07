// 인물 추가 모달 화면
import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { persons, groups } from "@/db/schema";

const MBTI_OPTIONS = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

export default function PersonNewScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");

  async function save() {
    if (!name.trim()) { Alert.alert("이름을 입력해 주세요."); return; }
    if (!groupId) { Alert.alert("그룹을 선택해 주세요."); return; }

    await db.insert(persons).values({
      name: name.trim(),
      birthDate: birthDate.trim() || undefined,
      mbti: mbti || undefined,
      memo: memo.trim() || undefined,
      groupId,
    });
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>이름 *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="이름 입력" placeholderTextColor="#555" />

      <Text style={styles.label}>생년월일</Text>
      <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor="#555" />

      <Text style={styles.label}>MBTI</Text>
      <View style={styles.chipRow}>
        {MBTI_OPTIONS.map((m) => (
          <Pressable key={m} onPress={() => setMbti(mbti === m ? "" : m)} style={[styles.chip, mbti === m && styles.chipSelected]}>
            <Text style={[styles.chipText, mbti === m && styles.chipTextSelected]}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>메모</Text>
      <TextInput style={[styles.input, styles.textarea]} value={memo} onChangeText={setMemo} placeholder="메모" placeholderTextColor="#555" multiline numberOfLines={3} />

      <Text style={styles.label}>그룹 *</Text>
      <View style={styles.chipRow}>
        {allGroups.map((g) => (
          <Pressable key={g.id} onPress={() => setGroupId(g.id)} style={[styles.chip, groupId === g.id && styles.chipSelected]}>
            <Text style={[styles.chipText, groupId === g.id && styles.chipTextSelected]}>{g.emoji} {g.name}</Text>
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
  textarea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { backgroundColor: "#1e1e1e", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: "#4ECDC4" },
  chipText: { color: "#aaa", fontSize: 13 },
  chipTextSelected: { color: "#111", fontWeight: "600" },
  saveBtn: { backgroundColor: "#4ECDC4", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "700" },
});
