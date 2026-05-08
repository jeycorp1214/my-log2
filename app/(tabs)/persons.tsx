// 인물 목록 탭 — 그룹별 섹션 + 인물 카드
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { PersonCard } from "@/components/persons/PersonCard";
import { db } from "@/db/client";
import { groups, persons } from "@/db/schema";

export default function PersonsScreen() {
  const router = useRouter();

  const { data: allPersons = [] } = useLiveQuery(db.select().from(persons));
  const { data: allGroups = [] } = useLiveQuery(db.select().from(groups));

  const groupedPersons = allGroups
    .map((group) => ({
      group,
      members: allPersons.filter((p) => p.groupId === group.id),
    }))
    .filter((section) => section.members.length > 0);

  const ungrouped = allPersons.filter((p) => !p.groupId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>인물</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {allPersons.length === 0 ? (
          <Text style={styles.emptyText}>인물을 추가해 보세요.</Text>
        ) : (
          <>
            {groupedPersons.map(({ group, members }) => (
              <View key={group.id} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {group.emoji} {group.name}
                </Text>
                {members.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    groupColor={group.color}
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: person.id },
                      })
                    }
                  />
                ))}
              </View>
            ))}

            {ungrouped.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>분류 없음</Text>
                {ungrouped.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    groupColor="#555"
                    onPress={() =>
                      router.push({
                        pathname: "/persons/[id]",
                        params: { id: person.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB — 인물 추가 */}
      <Pressable onPress={() => router.push("/persons/new")} style={styles.fab}>
        <Plus size={24} color="#111" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingBottom: 96 },
  section: { marginBottom: 24 },
  sectionTitle: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyText: { color: "#666", textAlign: "center", marginTop: 48 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4ECDC4",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
