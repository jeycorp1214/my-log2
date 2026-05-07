// 로그 상세 / 수정 / 삭제 모달 화면
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { logs, logPersons, groups, persons } from "@/db/schema";
import { formatLogDate } from "@/utils/date";

const REPEAT_OPTIONS = [
  { label: "없음", value: "none" },
  { label: "매일", value: "daily" },
  { label: "매주", value: "weekly" },
  { label: "매월", value: "monthly" },
  { label: "매년", value: "yearly" },
];

export default function LogDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: logList = [] } = useLiveQuery(db.select().from(logs).where(eq(logs.id, id)));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));
  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: linkedPersons = [] } = useLiveQuery(
    db
      .select({ person: persons })
      .from(logPersons)
      .innerJoin(persons, eq(logPersons.personId, persons.id))
      .where(eq(logPersons.logId, id)),
  );

  const log = logList[0];

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [repeatType, setRepeatType] = useState("none");
  const [groupId, setGroupId] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);

  useEffect(() => {
    if (log) {
      setTitle(log.title);
      setMemo(log.memo ?? "");
      setRepeatType(log.repeatType ?? "none");
      setGroupId(log.groupId);
    }
  }, [log]);

  useEffect(() => {
    setSelectedPersonIds(linkedPersons.map((lp) => lp.person.id));
  }, [linkedPersons]);

  function togglePerson(pid: string) {
    setSelectedPersonIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid],
    );
  }

  async function save() {
    if (!title.trim()) { Alert.alert("제목을 입력해 주세요."); return; }
    await db.update(logs).set({
      title: title.trim(),
      memo: memo.trim() || null,
      repeatType: repeatType !== "none" ? repeatType : null,
      groupId,
      updatedAt: new Date(),
    }).where(eq(logs.id, id));

    // logPersons 재설정
    await db.delete(logPersons).where(eq(logPersons.logId, id));
    if (selectedPersonIds.length > 0) {
      await db.insert(logPersons).values(
        selectedPersonIds.map((personId) => ({ logId: id, personId })),
      );
    }
    setEditing(false);
  }

  async function deleteLog() {
    Alert.alert("기록 삭제", "이 기록을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          await db.delete(logs).where(eq(logs.id, id));
          router.back();
        },
      },
    ]);
  }

  if (!log) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {editing ? (
        <>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#555" />
          <Text style={styles.label}>메모</Text>
          <TextInput style={[styles.input, styles.textarea]} value={memo} onChangeText={setMemo} multiline />
          <Text style={styles.label}>반복</Text>
          <View style={styles.chipRow}>
            {REPEAT_OPTIONS.map(({ label, value }) => (
              <Pressable key={value} onPress={() => setRepeatType(value)} style={[styles.chip, repeatType === value && styles.chipSelected]}>
                <Text style={[styles.chipText, repeatType === value && styles.chipTextSelected]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>그룹</Text>
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
        </>
      ) : (
        <>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{log.title}</Text>
            <Pressable onPress={() => setEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>수정</Text>
            </Pressable>
          </View>
          <Text style={styles.dateText}>{formatLogDate(new Date(log.logDate))}</Text>
          {log.memo ? <Text style={styles.memo}>{log.memo}</Text> : null}

          {linkedPersons.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>함께한 인물</Text>
              <View style={styles.chipRow}>
                {linkedPersons.map(({ person }) => (
                  <Pressable
                    key={person.id}
                    onPress={() => router.push({ pathname: "/persons/[id]", params: { id: person.id } })}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{person.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Pressable onPress={deleteLog} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>기록 삭제</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  content: { padding: 20, gap: 8, paddingBottom: 40 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { flex: 1, color: "#fff", fontSize: 22, fontWeight: "700", marginRight: 12 },
  editBtn: { backgroundColor: "#1e1e1e", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: "#4ECDC4", fontSize: 14 },
  dateText: { color: "#666", fontSize: 13 },
  memo: { color: "#aaa", fontSize: 15, lineHeight: 22, marginTop: 8 },
  sectionTitle: { color: "#aaa", fontSize: 13, fontWeight: "600", marginTop: 20, textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: { backgroundColor: "#1e1e1e", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipSelected: { backgroundColor: "#4ECDC4" },
  chipText: { color: "#aaa", fontSize: 13 },
  chipTextSelected: { color: "#111", fontWeight: "600" },
  deleteBtn: { marginTop: 32, backgroundColor: "#2a1a1a", borderRadius: 12, padding: 14, alignItems: "center" },
  deleteBtnText: { color: "#ff6b6b", fontSize: 15 },
  label: { color: "#aaa", fontSize: 13, marginTop: 12 },
  input: { backgroundColor: "#1e1e1e", color: "#fff", borderRadius: 10, padding: 12, fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  saveBtn: { backgroundColor: "#4ECDC4", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "700" },
});
