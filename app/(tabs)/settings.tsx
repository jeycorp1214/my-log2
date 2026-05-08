// 설정 탭 — 그룹 관리 + 개발 도구(데이터 초기화)
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { groups, logs, logPersons, persons } from "@/db/schema";
import { seedDefaultGroups } from "@/db/seed";

export default function SettingsScreen() {
  const router = useRouter();
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  async function deleteGroup(id: string, isDefault: boolean) {
    if (isDefault) {
      Alert.alert("삭제 불가", "기본 그룹은 삭제할 수 없습니다.");
      return;
    }
    Alert.alert("그룹 삭제", "그룹을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          await db.delete(groups).where(eq(groups.id, id));
        },
      },
    ]);
  }

  async function resetAllData() {
    Alert.alert(
      "전체 데이터 초기화",
      "모든 기록, 인물, 그룹이 삭제되고 기본 그룹이 재생성됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "초기화",
          style: "destructive",
          onPress: async () => {
            await db.delete(logPersons);
            await db.delete(logs);
            await db.delete(persons);
            await db.delete(groups);
            await seedDefaultGroups();
            router.replace("/(tabs)");
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 그룹 관리 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>그룹 관리</Text>
            <Pressable onPress={() => router.push("/groups/new")} style={styles.addBtn}>
              <Plus size={16} color="#fff" />
            </Pressable>
          </View>
          {allGroups.map((group) => (
            <View key={group.id} style={styles.groupRow}>
              <View style={[styles.colorDot, { backgroundColor: group.color }]} />
              <Text style={styles.groupName}>
                {group.emoji} {group.name}
              </Text>
              {!group.isDefault && (
                <Pressable onPress={() => deleteGroup(group.id, group.isDefault)} style={styles.deleteBtn}>
                  <Trash2 size={16} color="#ff6b6b" />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* 개발 도구 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>개발 도구</Text>
          <Pressable onPress={resetAllData} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>전체 데이터 초기화</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#aaa", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  addBtn: { backgroundColor: "#4ECDC4", borderRadius: 16, padding: 4 },
  groupRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e1e1e", borderRadius: 12, padding: 14, marginBottom: 8 },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  groupName: { flex: 1, color: "#fff", fontSize: 15 },
  deleteBtn: { padding: 4 },
  resetBtn: { backgroundColor: "#2a1a1a", borderRadius: 12, padding: 14, alignItems: "center" },
  resetBtnText: { color: "#ff6b6b", fontSize: 15, fontWeight: "600" },
});
