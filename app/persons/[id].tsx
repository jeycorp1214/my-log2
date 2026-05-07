// 인물 상세 / 수정 / 삭제 모달 화면
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { persons, groups, logs, logPersons } from "@/db/schema";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { calcAge, formatLogDate, fromNow } from "@/utils/date";

const MBTI_OPTIONS = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: personList = [] } = useLiveQuery(db.select().from(persons).where(eq(persons.id, id)));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const person = personList[0];

  // 이 인물이 등장한 로그 조회
  const { data: personLogs = [] } = useLiveQuery(
    db
      .select({ log: logs })
      .from(logPersons)
      .innerJoin(logs, eq(logPersons.logId, logs.id))
      .where(eq(logPersons.personId, id)),
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [mbti, setMbti] = useState("");
  const [memo, setMemo] = useState("");
  const [groupId, setGroupId] = useState("");

  useEffect(() => {
    if (person) {
      setName(person.name);
      setBirthDate(person.birthDate ?? "");
      setMbti(person.mbti ?? "");
      setMemo(person.memo ?? "");
      setGroupId(person.groupId);
    }
  }, [person]);

  async function save() {
    if (!name.trim()) { Alert.alert("이름을 입력해 주세요."); return; }
    await db.update(persons).set({
      name: name.trim(),
      birthDate: birthDate.trim() || null,
      mbti: mbti || null,
      memo: memo.trim() || null,
      groupId,
      updatedAt: new Date(),
    }).where(eq(persons.id, id));
    setEditing(false);
  }

  async function deletePerson() {
    Alert.alert("인물 삭제", `${person?.name}을(를) 삭제할까요? 관련 기록 연결도 삭제됩니다.`, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          await db.delete(persons).where(eq(persons.id, id));
          router.back();
        },
      },
    ]);
  }

  if (!person) return null;

  const age = person.birthDate ? calcAge(person.birthDate) : null;
  const lastLog = personLogs[0]?.log;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {editing ? (
        <>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#555" />
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
          <TextInput style={[styles.input, styles.textarea]} value={memo} onChangeText={setMemo} multiline />
          <Text style={styles.label}>그룹</Text>
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
        </>
      ) : (
        <>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{person.name}</Text>
            <Pressable onPress={() => setEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>수정</Text>
            </Pressable>
          </View>
          <View style={styles.metaRow}>
            {age !== null && <Text style={styles.metaText}>{age}세</Text>}
            {person.mbti && <Text style={styles.metaText}>{person.mbti}</Text>}
          </View>
          {person.memo ? <Text style={styles.memo}>{person.memo}</Text> : null}

          {lastLog && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>마지막 기록</Text>
              <Text style={styles.infoValue}>{fromNow(new Date(lastLog.logDate))}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>함께한 기록 ({personLogs.length})</Text>
          {personLogs.map(({ log }) => (
            <Pressable
              key={log.id}
              onPress={() => router.push({ pathname: "/logs/[id]", params: { id: log.id } })}
              style={styles.logRow}
            >
              <Text style={styles.logDate}>{formatLogDate(new Date(log.logDate))}</Text>
              <Text style={styles.logTitle}>{log.title}</Text>
            </Pressable>
          ))}

          <Pressable onPress={deletePerson} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>인물 삭제</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  name: { color: "#fff", fontSize: 24, fontWeight: "700" },
  editBtn: { backgroundColor: "#1e1e1e", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: "#4ECDC4", fontSize: 14 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  metaText: { color: "#888", fontSize: 14 },
  memo: { color: "#aaa", fontSize: 15, lineHeight: 22 },
  infoBox: { backgroundColor: "#1e1e1e", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  infoLabel: { color: "#666", fontSize: 13 },
  infoValue: { color: "#4ECDC4", fontSize: 13 },
  sectionTitle: { color: "#aaa", fontSize: 13, fontWeight: "600", marginTop: 24, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  logRow: { backgroundColor: "#1e1e1e", borderRadius: 10, padding: 12, marginBottom: 6 },
  logDate: { color: "#666", fontSize: 12, marginBottom: 2 },
  logTitle: { color: "#fff", fontSize: 14 },
  deleteBtn: { marginTop: 32, backgroundColor: "#2a1a1a", borderRadius: 12, padding: 14, alignItems: "center" },
  deleteBtnText: { color: "#ff6b6b", fontSize: 15 },
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
