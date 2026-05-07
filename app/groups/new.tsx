// 그룹 추가 모달 화면
import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";

import { db } from "@/db/client";
import { groups } from "@/db/schema";

const PRESET_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

export default function GroupNewScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [emoji, setEmoji] = useState("");

  async function save() {
    if (!name.trim()) { Alert.alert("그룹 이름을 입력해 주세요."); return; }
    await db.insert(groups).values({
      name: name.trim(),
      color,
      emoji: emoji.trim() || undefined,
      isDefault: false,
    });
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>그룹 이름 *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="그룹 이름" placeholderTextColor="#555" />

      <Text style={styles.label}>이모지</Text>
      <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} placeholder="🎯" placeholderTextColor="#555" />

      <Text style={styles.label}>색상</Text>
      <View style={styles.colorRow}>
        {PRESET_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
          />
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
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: "#fff" },
  saveBtn: { backgroundColor: "#4ECDC4", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#111", fontSize: 16, fontWeight: "700" },
});
