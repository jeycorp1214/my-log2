// 인물 목록 탭 — 그룹별 섹션 + 인물 카드
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { persons, groups } from "@/db/schema";
import { PersonCard } from "@/components/persons/PersonCard";

export default function PersonsScreen() {
  const router = useRouter();

  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const groupedPersons = allGroups.map((group) => ({
    group,
    members: allPersons.filter((p) => p.groupId === group.id),
  })).filter((section) => section.members.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>인물</Text>
        <Pressable onPress={() => router.push("/persons/new")} style={styles.addBtn}>
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {allPersons.length === 0 ? (
          <Text style={styles.emptyText}>인물을 추가해 보세요.</Text>
        ) : (
          groupedPersons.map(({ group, members }) => (
            <View key={group.id} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {group.emoji} {group.name}
              </Text>
              {members.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  groupColor={group.color}
                  onPress={() => router.push({ pathname: "/persons/[id]", params: { id: person.id } })}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  addBtn: { backgroundColor: "#4ECDC4", borderRadius: 20, padding: 6 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { color: "#aaa", fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  emptyText: { color: "#666", textAlign: "center", marginTop: 48 },
});
